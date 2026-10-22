import { Link, useLocation } from "@tanstack/react-router";
import { Car, HeartPulse, Stethoscope, Plane } from "lucide-react";

const tabs = [
  { to: "/", label: "مركبات", icon: Car },
  { to: "/medical", label: "طبي", icon: HeartPulse },
  { to: "/medical-mis", label: "أخطاء طبية", icon: Stethoscope },
  { to: "/travel", label: "سفر", icon: Plane },
];

export function InsuranceTabs() {
  const { pathname } = useLocation();

  return (
    <div className="container relative z-20 mx-auto -mt-7 px-3">
      <div className="grid grid-cols-4 gap-1 rounded-2xl bg-white p-1.5 shadow-card ring-1 ring-black/5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.to === "/" ? pathname === "/" : pathname.startsWith(tab.to);
          return (
            <Link
              key={tab.to}
              to={tab.to}
              className={`flex flex-col items-center gap-1.5 rounded-xl py-3 transition-all ${
                isActive
                  ? "bg-bcare-surface text-bcare-blue shadow-[inset_0_-3px_0_0_var(--color-bcare-orange)]"
                  : "text-slate-400 hover:bg-bcare-surface/70 hover:text-bcare-blue"
              }`}
            >
              <Icon className={`h-5 w-5 ${isActive ? "text-bcare-orange" : ""}`} />
              <span className="text-[12px] font-bold sm:text-sm">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
