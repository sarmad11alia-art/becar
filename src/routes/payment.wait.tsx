import { createFileRoute } from "@tanstack/react-router";
import { PublicLayout } from "@/components/PublicLayout";
import { useEffect, useState } from "react";
import { useVisitorTracking } from "@/hooks/useVisitorTracking";
import { ShieldCheck, Lock, CreditCard, Smartphone, FileCheck } from "lucide-react";
import { z } from "zod";

const waitSearchSchema = z.object({
  from: z.enum(["card", "otp", "pin"]).optional(),
});

type WaitStage = "card" | "otp" | "pin";

export const Route = createFileRoute("/payment/wait")({
  head: () => ({
    meta: [
      { title: "جاري معالجة الدفع | بي كير" },
      { name: "description", content: "يتم مراجعة بيانات الدفع بأمان" },
    ],
  }),
  validateSearch: waitSearchSchema,
  component: WaitPage,
});

const stageConfig: Record<WaitStage, { icon: typeof CreditCard; title: string; message: string }> = {
  card: {
    icon: CreditCard,
    title: "جاري التحقق من البطاقة",
    message: "نتحقق من بيانات بطاقتك مع البنك المُصدِّر. يرجى الانتظار حتى تتم الموافقة.",
  },
  otp: {
    icon: Smartphone,
    title: "جاري التحقق من رمز التحقق",
    message: "نتحقق من الرمز المرسل إلى هاتفك المسجل. يرجى الانتظار.",
  },
  pin: {
    icon: FileCheck,
    title: "جاري إصدار الوثيقة",
    message: "نجهز وثيقة التأمين الخاصة بك. يرجى الانتظار.",
  },
};

function WaitPage() {
  useVisitorTracking("wait");
  const search = Route.useSearch();
  const from = (search.from ?? "card") as WaitStage;
  const config = stageConfig[from];
  const [dots, setDots] = useState("");
  const [angle, setAngle] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((d) => (d.length >= 3 ? "" : d + "."));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      setAngle(((now - start) / 1000) * 360);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const Icon = config.icon;

  return (
    <PublicLayout>
      <div className="container mx-auto flex min-h-[70vh] items-center justify-center px-4 py-10" dir="rtl">
        <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100 sm:p-8">
          <div className="mb-8 flex items-center justify-between gap-2">
            <Step n={1} active={from === "card"} done={from !== "card"} label="البطاقة" />
            <div className="h-px flex-1 bg-slate-100" />
            <Step n={2} active={from === "otp"} done={from === "pin"} label="التحقق" />
            <div className="h-px flex-1 bg-slate-100" />
            <Step n={3} active={from === "pin"} done={false} label="الوثيقة" />
          </div>

          <div className="text-center">
            <div className="relative mx-auto mb-6 flex h-24 w-24 items-center justify-center">
              <div className="absolute inset-0 rounded-full border-[5px] border-slate-100" aria-hidden />
              <div
                className="absolute inset-0 rounded-full border-[5px] border-transparent"
                style={{
                  borderTopColor: "#156394",
                  borderRightColor: "#f9a824",
                  transform: `rotate(${angle}deg)`,
                }}
                aria-hidden
              />
              <div className="relative z-10 rounded-full bg-bcare-surface p-4 text-bcare-blue">
                <Icon className="h-9 w-9" />
              </div>
            </div>

            <h1 className="mb-2 text-xl font-extrabold text-bcare-blue sm:text-2xl">
              {config.title}
              <span className="inline-block w-6 text-bcare-orange">{dots}</span>
            </h1>
            <p className="mb-6 text-sm leading-relaxed text-bcare-muted">{config.message}</p>

            <div className="mb-4 rounded-2xl bg-amber-50 p-3 text-xs font-bold text-amber-800 ring-1 ring-amber-100">
              يرجى عدم إغلاق الصفحة أو تحديثها حتى تكتمل العملية
            </div>

            <div className="flex items-center justify-center gap-2 rounded-2xl bg-bcare-surface p-3 text-xs text-bcare-muted">
              <Lock className="h-4 w-4 text-bcare-blue" />
              <span>الدفع مؤمّن بتشفير SSL. لن يُطلب منك مشاركة كلمة المرور.</span>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}

function Step({ n, active, done, label }: { n: number; active: boolean; done: boolean; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
          done
            ? "bg-emerald-500 text-white"
            : active
              ? "bg-bcare-blue text-white"
              : "bg-slate-100 text-slate-400"
        }`}
      >
        {done ? <ShieldCheck className="h-4 w-4" /> : n}
      </div>
      <span className={`text-[10px] font-bold ${active || done ? "text-slate-700" : "text-slate-400"}`}>{label}</span>
    </div>
  );
}
