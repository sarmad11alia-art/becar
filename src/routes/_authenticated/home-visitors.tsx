import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Globe, Monitor, RefreshCw, Search, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { listHomeVisitors } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/home-visitors")({
  head: () => ({
    meta: [
      { title: "زوار الصفحة الرئيسية | بي كير" },
      { name: "description", content: "قائمة الزوار المتواجدين حاليًا في الصفحة الرئيسية للموقع" },
    ],
  }),
  component: HomeVisitorsPage,
});

type Row = {
  id: string;
  session_id: string;
  visitor_name: string | null;
  ssn: string | null;
  phone: string | null;
  ip_address: string | null;
  country: string | null;
  os: string | null;
  browser: string | null;
  device: string | null;
  current_page: string | null;
  last_active_at: string;
  quote_details?: { full_name: string | null }[] | null;
};

const COUNTRY_NAMES: Record<string, string> = {
  SA: "السعودية",
  AE: "الإمارات",
  KW: "الكويت",
  QA: "قطر",
  BH: "البحرين",
  OM: "عُمان",
  JO: "الأردن",
  EG: "مصر",
  IQ: "العراق",
  YE: "اليمن",
  SY: "سوريا",
  LB: "لبنان",
  PS: "فلسطين",
  MA: "المغرب",
  DZ: "الجزائر",
  TN: "تونس",
  LY: "ليبيا",
  SD: "السودان",
  US: "أمريكا",
  GB: "بريطانيا",
  TR: "تركيا",
  IN: "الهند",
  PK: "باكستان",
};

function countryName(code: string) {
  const c = code.trim().toUpperCase();
  return COUNTRY_NAMES[c] ?? c;
}

function countryFlag(code: string) {
  const c = code.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(c)) return "";
  return String.fromCodePoint(...[...c].map((ch) => 0x1f1e6 + ch.charCodeAt(0) - 65));
}

function relTime(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return `منذ ${Math.floor(diff)} ثانية`;
  if (diff < 3600) return `منذ ${Math.floor(diff / 60)} دقيقة`;
  if (diff < 86400) return `منذ ${Math.floor(diff / 3600)} ساعة`;
  return `منذ ${Math.floor(diff / 86400)} يوم`;
}

function HomeVisitorsPage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<Row[]>([]);
  const [onlyOnline, setOnlyOnline] = useState(true);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await listHomeVisitors({
        data: { onlyOnline, search: search || undefined },
      });
      setRows(data as unknown as Row[]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [onlyOnline, search]);

  // Realtime — refresh on any quote change
  useEffect(() => {
    const channel = supabase
      .channel("home-visitors")
      .on("postgres_changes", { event: "*", schema: "public", table: "quotes" }, () => load())
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [onlyOnline, search]);

  // Tick to refresh relative times
  useEffect(() => {
    const t = setInterval(() => setRows((v) => [...v]), 20000);
    return () => clearInterval(t);
  }, []);

  const count = useMemo(() => rows.length, [rows]);

  return (
    <div dir="rtl" className="min-h-screen bg-slate-50">
      <header className="flex items-center justify-between border-b bg-white px-4 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate({ to: "/dashboard" })}
            className="flex items-center gap-1 rounded p-2 text-slate-500 hover:bg-slate-100"
            title="العودة للوحة التحكم"
          >
            <ArrowRight className="h-5 w-5" />
            <span className="text-sm">لوحة التحكم</span>
          </button>
          <div className="h-6 w-px bg-slate-200" />
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-emerald-600" />
            <h1 className="text-lg font-bold text-slate-800">زوار الصفحة الرئيسية</h1>
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700">
              {count}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-xs text-slate-600">
            <input
              type="checkbox"
              checked={onlyOnline}
              onChange={(e) => setOnlyOnline(e.target.checked)}
              className="h-4 w-4"
            />
            المتصلين الآن فقط
          </label>
          <button
            onClick={load}
            className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs hover:bg-slate-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            تحديث
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-6xl p-4">
        <div className="mb-3 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute right-2 top-2.5 h-4 w-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث بالاسم أو الهوية أو الهاتف أو IP"
              className="h-9 w-full rounded-lg border border-slate-200 bg-white pr-8 pl-3 text-sm outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
          <table className="w-full text-right text-sm">
            <thead className="bg-slate-50 text-xs text-slate-600">
              <tr>
                <th className="px-3 py-2 font-semibold">الزائر</th>
                <th className="px-3 py-2 font-semibold">الهوية</th>
                <th className="px-3 py-2 font-semibold">الهاتف</th>
                <th className="px-3 py-2 font-semibold">IP</th>
                <th className="px-3 py-2 font-semibold">الدولة</th>
                <th className="px-3 py-2 font-semibold">الجهاز</th>
                <th className="px-3 py-2 font-semibold">آخر نشاط</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 py-10 text-center text-sm text-slate-400">
                    {loading ? "جارٍ التحميل…" : "لا يوجد زوار في الصفحة الرئيسية حاليًا"}
                  </td>
                </tr>
              ) : (
                rows.map((v) => {
                  const name = v.quote_details?.[0]?.full_name || v.visitor_name || "زائر";
                  return (
                    <tr key={v.id} className="border-t hover:bg-slate-50">
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                          <span className="font-medium text-slate-800">{name}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-slate-600">{v.ssn || "—"}</td>
                      <td className="px-3 py-2 text-slate-600">{v.phone || "—"}</td>
                      <td className="px-3 py-2 text-slate-600">
                        <span className="inline-flex items-center gap-1">
                          <Globe className="h-3 w-3 text-slate-400" />
                          {v.ip_address || "—"}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-slate-600">
                        <span className="inline-flex items-center gap-1">
                          {v.country ? (
                            <>
                              <span className="text-base leading-none">{countryFlag(v.country)}</span>
                              {countryName(v.country)}
                            </>
                          ) : (
                            "—"
                          )}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-slate-600">
                        <span className="inline-flex items-center gap-1">
                          <Monitor className="h-3 w-3 text-slate-400" />
                          {[v.device, v.os, v.browser].filter(Boolean).join(" · ") || "—"}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-xs text-slate-500">{relTime(v.last_active_at)}</td>
                      <td className="px-3 py-2 text-left">
                        <Link
                          to="/dashboard"
                          className="rounded border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-100"
                        >
                          عرض
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
