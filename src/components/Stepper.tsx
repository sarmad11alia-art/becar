import { Check } from "lucide-react";

const STEPS = ["البيانات", "التفاصيل", "العروض", "الملخص", "الدفع"];

export function Stepper({ current }: { current: number }) {
  return (
    <nav aria-label="خطوات الطلب" className="mb-5" dir="rtl">
      <ol className="flex items-center gap-1.5">
        {STEPS.map((label, i) => {
          const done = i < current;
          const active = i === current;
          return (
            <li key={label} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
              <div className="flex w-full items-center gap-1.5">
                <span
                  className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-[11px] font-black transition-colors ${
                    done
                      ? "bg-emerald-500 text-white"
                      : active
                        ? "bcare-gradient-cta text-white shadow-glow-orange"
                        : "bg-white text-slate-400 ring-1 ring-bcare-border"
                  }`}
                >
                  {done ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : i + 1}
                </span>
                {i < STEPS.length - 1 && (
                  <span
                    className={`h-1 flex-1 rounded-full ${done ? "bg-emerald-400" : "bg-bcare-border"}`}
                  />
                )}
              </div>
              <span
                className={`w-full truncate text-center text-[10px] font-bold sm:text-[11px] ${
                  active ? "text-bcare-blue" : "text-slate-400"
                }`}
              >
                {label}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
