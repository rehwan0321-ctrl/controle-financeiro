import { useState, useEffect } from "react";
import { Clock, X, ShoppingCart } from "lucide-react";
import { PixPaymentDialog } from "@/components/PixPaymentDialog";

const TRIAL_HOURS = 24;

interface TrialBannerProps {
  trialStartedAt: string;
}

function calcRemaining(trialStartedAt: string) {
  const trialEnd = new Date(new Date(trialStartedAt).getTime() + TRIAL_HOURS * 60 * 60 * 1000);
  const ms = trialEnd.getTime() - Date.now();
  if (ms <= 0) return null;
  const totalSecs = Math.floor(ms / 1000);
  const h = Math.floor(totalSecs / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  const s = totalSecs % 60;
  return { h, m, s };
}

export const TrialBanner = ({ trialStartedAt }: TrialBannerProps) => {
  const [remaining, setRemaining] = useState(() => calcRemaining(trialStartedAt));
  const [dismissed, setDismissed] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setRemaining(calcRemaining(trialStartedAt)), 1000);
    return () => clearInterval(id);
  }, [trialStartedAt]);

  if (!remaining || dismissed) return null;

  const isUrgent = remaining.h < 3;
  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <>
      <div
        className={`relative w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium select-none transition-colors
          ${isUrgent
            ? "bg-red-600/90 hover:bg-red-600 text-white"
            : "bg-yellow-500/90 hover:bg-yellow-500 text-yellow-950"
          }`}
      >
        {/* Pulsing dot */}
        <span className={`inline-flex h-2 w-2 rounded-full animate-ping absolute left-4 opacity-75
          ${isUrgent ? "bg-red-200" : "bg-yellow-900/50"}`} />
        <span className={`inline-flex h-2 w-2 rounded-full absolute left-4
          ${isUrgent ? "bg-red-100" : "bg-yellow-900/60"}`} />

        <Clock className="h-4 w-4 ml-4 flex-shrink-0" />

        <span className="text-center">
          {isUrgent ? "⚠️ Avaliação expira em breve — " : "Período de avaliação gratuita — "}
          <span className="font-mono font-bold">{pad(remaining.h)}:{pad(remaining.m)}:{pad(remaining.s)}</span>
          {" "}restante{remaining.h === 0 && remaining.m < 5 ? "s!" : ""}
        </span>

        <button
          onClick={() => setDialogOpen(true)}
          className="flex items-center gap-1 ml-1 underline underline-offset-2"
        >
          <ShoppingCart className="h-3.5 w-3.5" />
          Adquirir plano
        </button>

        <button
          className="absolute right-3 p-1 rounded opacity-70 hover:opacity-100 transition-opacity"
          onClick={e => { e.stopPropagation(); setDismissed(true); }}
          title="Fechar"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <PixPaymentDialog open={dialogOpen} onOpenChange={setDialogOpen} currentExpiresAt={null} />
    </>
  );
};
