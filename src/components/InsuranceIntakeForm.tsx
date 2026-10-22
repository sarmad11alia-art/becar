import { useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent, type ReactNode } from "react";
import { ArrowLeft, Lock } from "lucide-react";
import { toast } from "sonner";
import {
  createMedicalQuote,
  createTravelQuote,
  createMedicalMisQuote,
} from "@/lib/insurance-quotes.functions";
import { getOrCreateSessionId, mergeVisitorData } from "@/lib/visitor-session";

export type IntakeKind = "medical" | "travel" | "medical-mis";

export function IntakeShell({
  kind,
  title,
  subtitle,
  children,
  onSubmit,
  submitLabel = "اعرض العروض",
}: {
  kind: IntakeKind;
  title: string;
  subtitle: string;
  children: ReactNode;
  onSubmit: (form: FormData, sessionId: string) => Promise<void>;
  submitLabel?: string;
}) {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      const sessionId = getOrCreateSessionId();
      window.localStorage.setItem("bcare_insurance_kind", kind);
      const data = new FormData(e.currentTarget);
      const snapshot: Record<string, unknown> = { kind };
      data.forEach((v, k) => {
        snapshot[k] = typeof v === "string" ? v : undefined;
      });
      mergeVisitorData(snapshot);
      await onSubmit(data, sessionId);
      navigate({ to: "/offers/$kind" as never, params: { kind } as never });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "تعذّر إرسال البيانات";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mx-auto max-w-xl">
        <div className="bcare-card overflow-hidden ring-1">
          <div className="border-b border-bcare-border bg-bcare-surface/70 px-5 pb-4 pt-5">
            <h2 className="text-lg font-black text-bcare-ink">{title}</h2>
            <p className="mt-1 text-xs text-bcare-muted">{subtitle}</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4 p-5 md:p-6">
            {children}
            <button
              type="submit"
              disabled={loading}
              className="bcare-gradient-cta mt-2 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-base font-bold text-white shadow-glow-orange transition-transform hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-60"
            >
              {loading ? "جاري التحميل..." : submitLabel}
              {!loading && <ArrowLeft className="h-4 w-4" />}
            </button>
            <p className="flex items-center justify-center gap-1.5 pt-1 text-center text-[11px] text-slate-400">
              <Lock className="h-3 w-3" />
              بياناتك مشفّرة — بمتابعتك أنت توافق على شروط الاستخدام وسياسة الخصوصية
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

export function Field({
  label,
  name,
  type = "text",
  required,
  placeholder,
  min,
  max,
  inputMode,
  pattern,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  min?: number;
  max?: number;
  inputMode?: "text" | "numeric" | "tel" | "email";
  pattern?: string;
}) {
  return (
    <div>
      <label className="bcare-label">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        min={min}
        max={max}
        inputMode={inputMode}
        pattern={pattern}
        className="bcare-field"
      />
    </div>
  );
}

export function SelectField({
  label,
  name,
  options,
  required,
}: {
  label: string;
  name: string;
  options: string[];
  required?: boolean;
}) {
  return (
    <div>
      <label className="bcare-label">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      <select name={name} required={required} className="bcare-field">
        <option value="">اختر...</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}

export const submitMedical = async (fd: FormData, sessionId: string) => {
  await createMedicalQuote({
    data: {
      session_id: sessionId,
      full_name: String(fd.get("full_name") || ""),
      phone: String(fd.get("phone") || ""),
      email: String(fd.get("email") || ""),
      age: Number(fd.get("age") || 30),
      num_insured: Number(fd.get("num_insured") || 1),
      current_insurer: String(fd.get("current_insurer") || ""),
      coverage_type: String(fd.get("coverage_type") || ""),
      budget: String(fd.get("budget") || ""),
      notes: String(fd.get("notes") || ""),
    },
  });
};

export const submitTravel = async (fd: FormData, sessionId: string) => {
  await createTravelQuote({
    data: {
      session_id: sessionId,
      full_name: String(fd.get("full_name") || ""),
      phone: String(fd.get("phone") || ""),
      email: String(fd.get("email") || ""),
      destination: String(fd.get("destination") || ""),
      trip_duration: Number(fd.get("trip_duration") || 7),
      num_travelers: Number(fd.get("num_travelers") || 1),
      traveler_ages: String(fd.get("traveler_ages") || ""),
      trip_type: String(fd.get("trip_type") || ""),
      notes: String(fd.get("notes") || ""),
    },
  });
};

export const submitMedicalMis = async (fd: FormData, sessionId: string) => {
  await createMedicalMisQuote({
    data: {
      session_id: sessionId,
      full_name: String(fd.get("full_name") || ""),
      phone: String(fd.get("phone") || ""),
      email: String(fd.get("email") || ""),
      profession: String(fd.get("profession") || ""),
      license_number: String(fd.get("license_number") || ""),
      workplace: String(fd.get("workplace") || ""),
      coverage_amount: String(fd.get("coverage_amount") || ""),
      notes: String(fd.get("notes") || ""),
    },
  });
};
