#!/usr/bin/env python3
"""Deploy dist/ folder to GitHub Pages via GitHub REST API."""

import os
import base64
import json
import urllib.request
import urllib.error

REPO = "rehwan0321-ctrl/controle-financeiro"
BRANCH = "gh-pages"
PAT = ""  # Set your GitHub Personal Access Token here
DIST_DIR = r"C:\Users\Operador M.D\Downloads\controlefinaceirorm-fixed\.claude\worktrees\quirky-mayer\dist"
CNAME_CONTENT = "rwinvestimentos.com.br"

API_BASE = "https://api.github.com"
HEADERS = {
    "Authorization": f"Bearer {PAT}",
    "Accept": "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "Content-Type": "application/json",
}


def api_request(method, path, data=None):
    url = f"{API_BASE}{path}"
    body = json.dumps(data).encode("utf-8") if data is not None else None
    req = urllib.request.Request(url, data=body, headers=HEADERS, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8")
        raise RuntimeError(f"HTTP {e.code} on {method} {url}: {err_body}")


def get_branch_sha():
    print(f"[1] Getting current SHA of branch '{BRANCH}'...")
    resp = api_request("GET", f"/repos/{REPO}/git/ref/heads/{BRANCH}")
    sha = resp["object"]["sha"]
    print(f"    Branch SHA: {sha}")
    return sha


def create_branch_if_missing():
    """Try to get the branch; if it doesn't exist, create it from the default branch."""
    try:
        return get_branch_sha()
    except RuntimeError as e:
        if "422" in str(e) or "404" in str(e):
            print(f"    Branch '{BRANCH}' not found. Creating from default branch...")
            # Get default branch
            repo_info = api_request("GET", f"/repos/{REPO}")
            default_branch = repo_info["default_branch"]
            default_ref = api_request("GET", f"/repos/{REPO}/git/ref/heads/{default_branch}")
            base_sha = default_ref["object"]["sha"]
            api_request("POST", f"/repos/{REPO}/git/refs", {
                "ref": f"refs/heads/{BRANCH}",
                "sha": base_sha,
            })
            print(f"    Created branch '{BRANCH}' from '{default_branch}'")
            return get_branch_sha()
        raise


def upload_blob(file_path):
    """Upload a file as a blob and return its SHA."""
    # Determine if binary or text
    binary_extensions = {
        ".png", ".jpg", ".jpeg", ".gif", ".ico", ".webp",
        ".woff", ".woff2", ".ttf", ".eot", ".otf",
        ".pdf", ".zip", ".gz", ".br",
    }
    ext = os.path.splitext(file_path)[1].lower()
    is_binary = ext in binary_extensions

    with open(file_path, "rb") as f:
        raw = f.read()

    if is_binary:
        content = base64.b64encode(raw).decode("utf-8")
        encoding = "base64"
    else:
        try:
            content = raw.decode("utf-8")
            encoding = "utf-8"
        except UnicodeDecodeError:
            content = base64.b64encode(raw).decode("utf-8")
            encoding = "base64"

    resp = api_request("POST", f"/repos/{REPO}/git/blobs", {
        "content": content,
        "encoding": encoding,
    })
    return resp["sha"]


def collect_files(dist_dir):
    """Walk the dist directory and return list of (relative_path, absolute_path)."""
    files = []
    for root, dirs, filenames in os.walk(dist_dir):
        for filename in filenames:
            abs_path = os.path.join(root, filename)
            rel_path = os.path.relpath(abs_path, dist_dir).replace("\\", "/")
            files.append((rel_path, abs_path))
    return files


def main():
    # Step 1: Get or create branch SHA
    base_commit_sha = create_branch_if_missing()

    # Get the base commit to find the base tree SHA
    print(f"[1b] Getting base commit tree SHA...")
    commit_info = api_request("GET", f"/repos/{REPO}/git/commits/{base_commit_sha}")
    base_tree_sha = commit_info["tree"]["sha"]
    print(f"    Base tree SHA: {base_tree_sha}")

    # Step 2: Collect and upload all files as blobs
    files = collect_files(DIST_DIR)
    print(f"\n[2] Uploading {len(files)} files as blobs...")
    tree_entries = []
    for i, (rel_path, abs_path) in enumerate(files):
        print(f"    [{i+1}/{len(files)}] Uploading: {rel_path}")
        blob_sha = upload_blob(abs_path)
        tree_entries.append({
            "path": rel_path,
            "mode": "100644",
            "type": "blob",
            "sha": blob_sha,
        })

    # Step 2b: Create CNAME blob
    print(f"\n[2b] Creating CNAME blob (content: {CNAME_CONTENT})...")
    cname_blob_resp = api_request("POST", f"/repos/{REPO}/git/blobs", {
        "content": CNAME_CONTENT,
        "encoding": "utf-8",
    })
    cname_blob_sha = cname_blob_resp["sha"]
    print(f"    CNAME blob SHA: {cname_blob_sha}")
    tree_entries.append({
        "path": "CNAME",
        "mode": "100644",
        "type": "blob",
        "sha": cname_blob_sha,
    })

    # Step 3: Create a new tree (no base_tree = fresh tree with only our files + CNAME)
    print(f"\n[3] Creating new tree with {len(tree_entries)} entries (dist files + CNAME)...")
    tree_resp = api_request("POST", f"/repos/{REPO}/git/trees", {
        "tree": tree_entries,
    })
    new_tree_sha = tree_resp["sha"]
    print(f"    New tree SHA: {new_tree_sha}")

    # Step 4: Create a new commit
    print(f"\n[4] Creating new commit...")
    commit_resp = api_request("POST", f"/repos/{REPO}/git/commits", {
        "message": "deploy: update GitHub Pages from dist/",
        "tree": new_tree_sha,
        "parents": [base_commit_sha],
    })
    new_commit_sha = commit_resp["sha"]
    print(f"    New commit SHA: {new_commit_sha}")

    # Step 5: Update the branch ref
    print(f"\n[5] Updating branch '{BRANCH}' ref to new commit...")
    api_request("PATCH", f"/repos/{REPO}/git/refs/heads/{BRANCH}", {
        "sha": new_commit_sha,
        "force": True,
    })
    print(f"    Branch updated successfully!")

    print(f"\nDeployment complete!")
    print(f"GitHub Pages URL: https://rehwan0321-ctrl.github.io/controle-financeiro/")


if __name__ == "__main__":
    main()
