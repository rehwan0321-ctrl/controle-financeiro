import { supabase } from "@/integrations/supabase/client";

/**
 * Shared helper — generates a dynamic PIX via create-payment edge function
 * and opens a new tab with the QR code + copy-paste code.
 * Returns true if the tab was opened successfully.
 */
export async function openPixPayment(): Promise<boolean> {
  const { data, error } = await supabase.functions.invoke("create-payment");
  if (error || !data?.qr_code) {
    console.error("create-payment error:", error);
    return false;
  }

  const qrSrc = data.qr_code_base64
    ? `data:image/png;base64,${data.qr_code_base64}`
    : `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=10&data=${encodeURIComponent(data.qr_code)}`;

  const w = window.open("", "_blank");
  if (!w) return false;

  w.document.write(`<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"/>
  <title>Renovar Plano — RW Investimentos</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#0f0f0f;color:#fff;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:24px}
    .card{background:#1a1a1a;border:1px solid #2a2a2a;border-radius:16px;padding:28px;max-width:380px;width:100%;text-align:center;space-y:16px}
    h2{font-size:20px;font-weight:700;color:#22c55e;margin-bottom:4px}
    .sub{font-size:13px;color:#888;margin-bottom:20px}
    img{border-radius:12px;border:2px solid #2a2a2a;margin:0 auto 16px;display:block}
    .label{font-size:11px;text-transform:uppercase;letter-spacing:.1em;color:#666;margin-bottom:8px}
    .code-box{background:#111;border:1px solid #2a2a2a;border-radius:8px;padding:12px;font-size:11px;color:#666;word-break:break-all;cursor:pointer;transition:color .2s,border-color .2s;margin-bottom:16px}
    .code-box:hover{border-color:#22c55e;color:#aaa}
    .code-box.copied{color:#22c55e;border-color:#22c55e}
    .btn{display:block;width:100%;padding:12px;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;border:none;transition:opacity .2s}
    .btn:hover{opacity:.85}
    .btn-close{background:#222;color:#888;border:1px solid #333;margin-top:8px}
    .note{font-size:11px;color:#555;margin-top:16px}
  </style></head><body>
  <div class="card">
    <h2>Plano Mensal — R$ 29,90</h2>
    <p class="sub">Escaneie com o app do seu banco ou copie o código PIX</p>
    <img src="${qrSrc}" width="220" height="220" alt="QR Code PIX"/>
    <p class="label">PIX Copia e Cola</p>
    <div class="code-box" id="code" onclick="copyCode()">${data.qr_code}</div>
    <button class="btn btn-close" onclick="window.close()">Fechar</button>
    <p class="note">✅ Acesso ativado automaticamente em até 1 minuto após o pagamento</p>
  </div>
  <script>
    function copyCode(){
      navigator.clipboard.writeText(${JSON.stringify(data.qr_code)});
      var el=document.getElementById('code');
      el.classList.add('copied');
      el.textContent='✓ Copiado!';
      setTimeout(function(){el.classList.remove('copied');el.textContent=${JSON.stringify(data.qr_code)};},3000);
    }
  </script></body></html>`);
  w.document.close();
  return true;
}
