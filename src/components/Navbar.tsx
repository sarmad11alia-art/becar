import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, ShieldCheck, X } from "lucide-react";
import { cn } from "@/lib/utils";
import bcareLogo from "@/assets/bcare-logo.png";

const NAV_LINKS = [
  { to: "/", label: "الرئيسية" },
  { to: "/medical", label: "التأمين الطبي" },
  { to: "/travel", label: "تأمين السفر" },
  { to: "/medical-mis", label: "الأخطاء الطبية" },
] as const;

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="relative z-[100]" dir="rtl">
      {/* Trust strip */}
      <div className="bcare-gradient-blue hidden text-white md:block">
        <div className="container mx-auto flex h-9 items-center justify-center px-4 text-[12px]">
          <span className="flex items-center gap-1.5 font-semibold">
            <ShieldCheck className="h-3.5 w-3.5" />
            وسيط تأمين مرخّص — أكثر من 20 شركة في مكان واحد
          </span>
        </div>
      </div>

      <nav className="border-b border-bcare-border/70 bg-white/90 backdrop-blur-md">
        <div className="container mx-auto grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 md:flex md:justify-between">
          <Link to="/" className="flex min-w-0 items-center gap-2.5">
            <img
              src={bcareLogo}
              alt="شعار بي كير للتأمين"
              className="h-12 w-auto shrink-0 rounded-lg object-contain"
            />
          </Link>

          <div className="hidden items-center gap-1 md:flex">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className="rounded-lg px-3 py-2 text-sm font-bold text-slate-600 transition-colors hover:bg-bcare-surface hover:text-bcare-blue"
                activeProps={{ className: "bg-bcare-surface text-bcare-blue" }}
              >
                {l.label}
              </Link>
            ))}
            <Link
              to="/"
              className="bcare-gradient-cta ms-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white shadow-glow-orange transition-transform hover:-translate-y-0.5"
            >
              احصل على عرض
            </Link>
          </div>

          <button
            type="button"
            aria-label={open ? "إغلاق القائمة" : "فتح القائمة"}
            onClick={() => setOpen((v) => !v)}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-bcare-border text-bcare-blue md:hidden"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {open && (
          <div className="border-t border-bcare-border bg-white px-4 pb-4 pt-2 md:hidden">
            <div className="flex flex-col">
              {NAV_LINKS.map((l) => (
                <Link
                  key={l.to}
                  to={l.to}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-3 text-sm font-bold text-slate-700 hover:bg-bcare-surface"
                >
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
