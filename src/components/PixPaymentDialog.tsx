import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Copy, Check, CheckCircle2 } from "lucide-react";

interface PixPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentExpiresAt?: string | null; // subscription expiry BEFORE payment — used to detect renewal
}

export function PixPaymentDialog({ open, onOpenChange, currentExpiresAt }: PixPaymentDialogProps) {
  const [loading, setLoading] = useState(false);
  const [pixData, setPixData] = useState<{ qr_code: string; qr_code_base64?: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [paid, setPaid] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Generate PIX when dialog opens
  useEffect(() => {
    if (!open) { setPixData(null); setPaid(false); return; }
    generate();
  }, [open]);

  // Cleanup polling on unmount
  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  const generate = async () => {
    setLoading(true);
    setPixData(null);
    try {
      const { data, error } = await supabase.functions.invoke("create-payment");
      if (error || !data?.qr_code) throw new Error("Erro ao gerar PIX");
      setPixData(data);
      startPolling();
    } catch (e) {
      alert("Erro ao gerar PIX. Tente novamente.");
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  const startPolling = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    // Snapshot current expiry so we can detect when it changes (renewal case)
    const prevExpiry = currentExpiresAt ? new Date(currentExpiresAt).getTime() : 0;

    pollRef.current = setInterval(async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("subscriptions")
        .select("subscription_expires_at")
        .eq("user_id", user.id)
        .single();
      if (!data?.subscription_expires_at) return;
      const newExpiry = new Date(data.subscription_expires_at).getTime();
      // Only confirm if new expiry is strictly greater than the previous one
      const isNewPayment = newExpiry > prevExpiry && newExpiry > Date.now();
      if (isNewPayment) {
        clearInterval(pollRef.current!);
        setPaid(true);
        setTimeout(() => { onOpenChange(false); window.location.reload(); }, 2500);
      }
    }, 5000);
  };

  const copy = () => {
    if (!pixData?.qr_code) return;
    navigator.clipboard.writeText(pixData.qr_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const qrSrc = pixData?.qr_code_base64
    ? `data:image/png;base64,${pixData.qr_code_base64}`
    : pixData?.qr_code
    ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=10&data=${encodeURIComponent(pixData.qr_code)}`
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Plano Mensal — R$ 29,90</DialogTitle>
        </DialogHeader>

        {paid ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <CheckCircle2 className="h-12 w-12 text-primary" />
            <p className="font-semibold text-primary">Pagamento confirmado!</p>
            <p className="text-sm text-muted-foreground">Seu plano foi renovado. Atualizando...</p>
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        ) : loading ? (
          <div className="flex flex-col items-center gap-3 py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Gerando PIX...</p>
          </div>
        ) : pixData ? (
          <div className="space-y-3 text-center">
            <p className="text-xs text-muted-foreground">
              Abra o app do seu banco → <strong>PIX → QR Code</strong> ou use Copia e Cola
            </p>

            {qrSrc && (
              <div className="flex justify-center">
                <img src={qrSrc} alt="QR Code PIX" className="rounded-xl border" width={200} height={200} />
              </div>
            )}

            <button
              onClick={copy}
              className="w-full flex items-center justify-center gap-2 rounded-lg border border-border bg-muted px-4 py-2.5 text-sm text-muted-foreground hover:bg-muted/80 transition-colors"
            >
              {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copiado!" : "Copiar código PIX"}
            </button>

            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              Aguardando confirmação...
            </div>

            <button onClick={generate} className="text-xs text-muted-foreground underline underline-offset-2">
              Gerar novo código
            </button>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
