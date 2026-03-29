import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  const supabaseUrl = env.VITE_SUPABASE_URL || "https://qubkmecpxbsdphtmwvvw.supabase.co";
  const supabasePublishableKey =
    env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1YmttZWNweGJzZHBodG13dnZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxNDI5NDIsImV4cCI6MjA4OTcxODk0Mn0.Y72dKZFiqCh-CMNLMyi5Yg7lOLGT4BsODQQO0FSD54E";
  const supabaseProjectId = env.VITE_SUPABASE_PROJECT_ID || "qubkmecpxbsdphtmwvvw";

  return {
    base: "/",
    server: {
      host: "::",
      port: process.env.PORT ? Number(process.env.PORT) : 8080,
      hmr: {
        overlay: false,
      },
    },
    define: {
      "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(supabaseUrl),
      "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY": JSON.stringify(supabasePublishableKey),
      "import.meta.env.VITE_SUPABASE_PROJECT_ID": JSON.stringify(supabaseProjectId),
    },
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
      dedupe: ["react", "react-dom", "react/jsx-runtime"],
    },
  };
});
