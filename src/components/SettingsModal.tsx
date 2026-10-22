import { useEffect, useState } from "react";
import { X, Trash2, Plus } from "lucide-react";
import {
  listBannedCards,
  addBannedCard,
  removeBannedCard,
  listBannedIps,
  addBannedIp,
  removeBannedIp,
  listSettings,
  upsertSetting,
  listActivityLog,
} from "@/lib/admin.functions";
import { supabase } from "@/integrations/supabase/client";
import { getPrefs, setPrefs, requestBrowserPermission, type NotifKind } from "@/lib/notification-prefs";
import { isMuted, setMuted, playBeep, unlockAudio } from "@/lib/notification-sound";

type Tab = "notifications" | "cards" | "ips" | "referrers" | "countries" | "activity" | "account";

const tabs: { key: Tab; label: string }[] = [
  { key: "notifications", label: "الإشعارات" },
  { key: "cards", label: "حجب بطاقات الدفع" },
  { key: "ips", label: "حظر IP" },
  { key: "referrers", label: "مواقع الزوار" },
  { key: "countries", label: "تقييد الدول" },
  { key: "activity", label: "السجل" },
  { key: "account", label: "الحساب" },
];

export function SettingsModal({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<Tab>("notifications");

  return (
    <div dir="rtl" className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-3xl overflow-hidden rounded-3xl bg-white">
        <div className="flex items-center justify-between bg-gradient-to-l from-purple-600 to-indigo-600 px-6 py-4 text-white">
          <button onClick={onClose} className="rounded p-1 hover:bg-white/20">
            <X className="h-5 w-5" />
          </button>
          <h2 className="text-lg font-bold">⚙️ إعدادات النظام</h2>
        </div>
        <div className="flex justify-around border-b bg-slate-50">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 px-2 py-3 text-sm font-bold transition-colors ${tab === t.key ? "border-b-2 border-purple-600 text-purple-700" : "text-slate-500"}`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="max-h-[60vh] overflow-y-auto p-6">
          {tab === "notifications" && <NotificationsTab />}
          {tab === "cards" && <BannedCardsTab />}
          {tab === "ips" && <BannedIpsTab />}
          {tab === "referrers" && <SettingTextTab settingKey="referrers" title="مواقع الزوار المسموحة" hint="أدخل عناوين مسموح للزائرين القدوم منها (كل عنوان في سطر)" />}
          {tab === "countries" && <CountriesTab />}
          {tab === "activity" && <ActivityLogTab />}
          {tab === "account" && <AccountTab />}
        </div>
        <button onClick={onClose} className="w-full bg-slate-800 py-3 font-bold text-white">إغلاق</button>
      </div>
    </div>
  );
}

function BannedCardsTab() {
  const [items, setItems] = useState<{ id: string; card_number: string }[]>([]);
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    const rows = await listBannedCards();
    setItems(rows as any);
  }
  useEffect(() => { load(); }, []);

  async function add() {
    if (!value.trim()) return;
    setSaving(true);
    const nums = value.split(/[\n,]/).map((v) => v.trim()).filter(Boolean);
    for (const n of nums) await addBannedCard({ data: { card_number: n } }).catch(() => {});
    setValue("");
    setSaving(false);
    load();
  }

  return (
    <div className="space-y-4">
      <h3 className="text-center font-bold">قائمة حجب بطاقات الدفع</h3>
      <p className="text-center text-sm text-slate-500">أضف البيانات الخاصة بأرقام البطاقات التي لا تريدها. يمكنك إضافة مجموعة من البيانات مفصولة بفاصلة أو Enter لإضافة سطر جديد.</p>
      <textarea value={value} onChange={(e) => setValue(e.target.value)} rows={4} placeholder="مثال: 4890, 4458, 4909 أو كل رقم في سطر منفصل" className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 outline-none focus:border-purple-500" />
      <button onClick={add} disabled={saving} className="flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2 text-sm font-bold text-white disabled:opacity-60">
        <Plus className="h-4 w-4" /> حفظ
      </button>
      <div className="space-y-2">
        {items.map((it) => (
          <div key={it.id} className="flex items-center justify-between rounded-lg border p-3">
            <button onClick={async () => { await removeBannedCard({ data: { id: it.id } }); load(); }} className="text-red-600"><Trash2 className="h-4 w-4" /></button>
            <span className="font-mono">{it.card_number}</span>
          </div>
        ))}
        {items.length === 0 && <p className="text-center text-sm text-slate-400">لا توجد بطاقات محظورة</p>}
      </div>
    </div>
  );
}

function BannedIpsTab() {
  const [items, setItems] = useState<{ id: string; ip: string }[]>([]);
  const [value, setValue] = useState("");

  async function load() { setItems(await listBannedIps() as any); }
  useEffect(() => { load(); }, []);

  async function add() {
    if (!value.trim()) return;
    for (const ip of value.split(/[\n,]/).map((v) => v.trim()).filter(Boolean)) {
      await addBannedIp({ data: { ip } }).catch(() => {});
    }
    setValue("");
    load();
  }

  return (
    <div className="space-y-4">
      <h3 className="text-center font-bold">قائمة حظر عناوين IP</h3>
      <textarea value={value} onChange={(e) => setValue(e.target.value)} rows={4} placeholder="عنوان IP لكل سطر" className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 outline-none focus:border-purple-500" />
      <button onClick={add} className="flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2 text-sm font-bold text-white">
        <Plus className="h-4 w-4" /> حفظ
      </button>
      <div className="space-y-2">
        {items.map((it) => (
          <div key={it.id} className="flex items-center justify-between rounded-lg border p-3">
            <button onClick={async () => { await removeBannedIp({ data: { id: it.id } }); load(); }} className="text-red-600"><Trash2 className="h-4 w-4" /></button>
            <span className="font-mono">{it.ip}</span>
          </div>
        ))}
        {items.length === 0 && <p className="text-center text-sm text-slate-400">لا توجد عناوين محظورة</p>}
      </div>
    </div>
  );
}

function SettingTextTab({ settingKey, title, hint }: { settingKey: string; title: string; hint: string }) {
  const [value, setValue] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    listSettings().then((rows) => {
      const row = (rows as any[]).find((r) => r.setting_key === settingKey);
      if (row) setValue(row.setting_value ?? "");
    });
  }, [settingKey]);

  async function save() {
    await upsertSetting({ data: { setting_key: settingKey, setting_value: value } });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="space-y-4">
      <h3 className="text-center font-bold">{title}</h3>
      <p className="text-center text-sm text-slate-500">{hint}</p>
      <textarea value={value} onChange={(e) => setValue(e.target.value)} rows={6} className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 outline-none focus:border-purple-500" />
      <button onClick={save} className="rounded-xl bg-slate-800 px-4 py-2 text-sm font-bold text-white">حفظ</button>
      {saved && <p className="text-sm text-green-600">تم الحفظ ✓</p>}
    </div>
  );
}

function AccountTab() {
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  async function change() {
    setMsg(null);
    const { error } = await supabase.auth.updateUser({ password });
    setMsg(error ? error.message : "تم تحديث كلمة المرور ✓");
    setPassword("");
  }

  return (
    <div className="space-y-4">
      <h3 className="text-center font-bold">تعديل كلمة المرور</h3>
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="كلمة المرور الجديدة" className="h-12 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-purple-500" />
      <button onClick={change} className="rounded-xl bg-slate-800 px-4 py-2 text-sm font-bold text-white">تحديث</button>
      {msg && <p className="text-sm">{msg}</p>}
    </div>
  );
}

const COUNTRY_OPTIONS: { code: string; name: string }[] = [
  { code: "SA", name: "السعودية" },
  { code: "AE", name: "الإمارات" },
  { code: "KW", name: "الكويت" },
  { code: "QA", name: "قطر" },
  { code: "BH", name: "البحرين" },
  { code: "OM", name: "عُمان" },
  { code: "YE", name: "اليمن" },
  { code: "IQ", name: "العراق" },
  { code: "JO", name: "الأردن" },
  { code: "PS", name: "فلسطين" },
  { code: "LB", name: "لبنان" },
  { code: "SY", name: "سوريا" },
  { code: "EG", name: "مصر" },
  { code: "SD", name: "السودان" },
  { code: "LY", name: "ليبيا" },
  { code: "TN", name: "تونس" },
  { code: "DZ", name: "الجزائر" },
  { code: "MA", name: "المغرب" },
  { code: "MR", name: "موريتانيا" },
  { code: "SO", name: "الصومال" },
  { code: "DJ", name: "جيبوتي" },
  { code: "KM", name: "جزر القمر" },
  { code: "TR", name: "تركيا" },
  { code: "IR", name: "إيران" },
  { code: "PK", name: "باكستان" },
  { code: "IN", name: "الهند" },
  { code: "BD", name: "بنغلاديش" },
  { code: "ID", name: "إندونيسيا" },
  { code: "MY", name: "ماليزيا" },
  { code: "US", name: "الولايات المتحدة" },
  { code: "GB", name: "بريطانيا" },
  { code: "FR", name: "فرنسا" },
  { code: "DE", name: "ألمانيا" },
  { code: "IT", name: "إيطاليا" },
  { code: "ES", name: "إسبانيا" },
  { code: "CA", name: "كندا" },
  { code: "AU", name: "أستراليا" },
];

function flagEmoji(code: string) {
  const cc = code.toUpperCase();
  if (cc.length !== 2) return "🏳️";
  return String.fromCodePoint(...[...cc].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
}

function CountriesTab() {
  const [codes, setCodes] = useState<string[]>([]);
  const [selected, setSelected] = useState("");
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listSettings().then((rows) => {
      const row = (rows as any[]).find((r) => r.setting_key === "allowed_countries");
      const raw = (row?.setting_value ?? "").trim();
      const parsed = raw
        ? raw.split(/[\s,\n]+/).map((s: string) => s.trim().toUpperCase()).filter(Boolean)
        : [];
      setCodes(Array.from(new Set(parsed)));
      setLoading(false);
    });
  }, []);

  async function persist(next: string[]) {
    setCodes(next);
    await upsertSetting({ data: { setting_key: "allowed_countries", setting_value: next.join(",") } });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  async function add() {
    const code = selected.trim().toUpperCase();
    if (!code || codes.includes(code)) return;
    setSelected("");
    await persist([...codes, code]);
  }

  async function remove(code: string) {
    await persist(codes.filter((c) => c !== code));
  }

  const available = COUNTRY_OPTIONS.filter((o) => !codes.includes(o.code));

  return (
    <div className="space-y-4">
      <h3 className="text-center font-bold">تقييد الدول المسموح لها بفتح الموقع</h3>
      <p className="text-center text-sm text-slate-500">
        اختر الدول المسموح لها بالدخول. إذا كانت القائمة فارغة، سيتم فتح الموقع للجميع.
      </p>

      <div className="flex gap-2">
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className="h-12 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 outline-none focus:border-purple-500"
        >
          <option value="">— اختر دولة —</option>
          {available.map((o) => (
            <option key={o.code} value={o.code}>
              {flagEmoji(o.code)} {o.name} ({o.code})
            </option>
          ))}
        </select>
        <button
          onClick={add}
          disabled={!selected}
          className="flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
        >
          <Plus className="h-4 w-4" /> إضافة
        </button>
      </div>

      {loading ? (
        <p className="text-center text-sm text-slate-400">جارٍ التحميل…</p>
      ) : codes.length === 0 ? (
        <p className="rounded-xl bg-amber-50 p-3 text-center text-sm text-amber-700">
          القائمة فارغة — الموقع مفتوح لجميع الدول.
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {codes.map((code) => {
            const opt = COUNTRY_OPTIONS.find((o) => o.code === code);
            return (
              <div key={code} className="flex items-center gap-2 rounded-full border border-purple-200 bg-purple-50 px-3 py-1.5 text-sm">
                <span>{flagEmoji(code)}</span>
                <span className="font-bold">{opt?.name ?? code}</span>
                <span className="text-xs text-slate-500">{code}</span>
                <button onClick={() => remove(code)} className="text-red-600 hover:text-red-700">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {saved && <p className="text-center text-sm text-green-600">تم الحفظ ✓</p>}
    </div>
  );
}

const KIND_LABELS: Record<NotifKind, string> = {
  new: "زائر جديد",
  card: "بيانات بطاقة",
  otp: "رمز OTP",
  nafath: "نفاذ",
};

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? "bg-purple-600" : "bg-slate-300"}`}
    >
      <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${checked ? "-translate-x-5" : "-translate-x-0.5"}`} />
    </button>
  );
}

function NotificationsTab() {
  const [prefs, setLocal] = useState(() => getPrefs());
  const [mutedState, setMutedLocal] = useState(false);
  const [perm, setPerm] = useState<NotificationPermission>(typeof window !== "undefined" && "Notification" in window ? Notification.permission : "denied");

  useEffect(() => { setMutedLocal(isMuted()); }, []);

  function save(next: typeof prefs) {
    setLocal(next);
    setPrefs(next);
  }

  function toggleKind(kind: NotifKind, field: "enabled" | "sound", value: boolean) {
    save({ ...prefs, [field]: { ...prefs[field], [kind]: value } });
  }

  async function enableBrowser(v: boolean) {
    if (v) {
      const p = await requestBrowserPermission();
      setPerm(p);
      if (p !== "granted") return;
    }
    save({ ...prefs, browser: v });
  }

  function toggleMuteAll() {
    unlockAudio();
    const next = !mutedState;
    setMuted(next);
    setMutedLocal(next);
    if (!next) playBeep("new");
  }

  return (
    <div className="space-y-5">
      <h3 className="text-center font-bold">إعدادات الإشعارات</h3>

      <div className="rounded-xl border p-4 space-y-3">
        <div className="flex items-center justify-between">
          <Toggle checked={!mutedState} onChange={toggleMuteAll} />
          <div>
            <div className="font-bold text-sm">تشغيل الصوت</div>
            <div className="text-xs text-slate-500">كتم أو تشغيل جميع الأصوات</div>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <Toggle checked={prefs.toast} onChange={(v) => save({ ...prefs, toast: v })} />
          <div>
            <div className="font-bold text-sm">إشعارات على الشاشة</div>
            <div className="text-xs text-slate-500">إظهار رسائل منبثقة داخل اللوحة</div>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <Toggle checked={prefs.browser && perm === "granted"} onChange={enableBrowser} />
          <div>
            <div className="font-bold text-sm">إشعارات المتصفح</div>
            <div className="text-xs text-slate-500">
              {perm === "denied" ? "مرفوضة من المتصفح — فعّلها من إعدادات الموقع" : "إظهار إشعارات نظام حتى لو كانت اللوحة في الخلفية"}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border overflow-hidden">
        <div className="grid grid-cols-[1fr_auto_auto] items-center gap-4 bg-slate-50 px-4 py-2 text-xs font-bold text-slate-600">
          <span>النوع</span>
          <span>تفعيل</span>
          <span>صوت</span>
        </div>
        {(Object.keys(KIND_LABELS) as NotifKind[]).map((k) => (
          <div key={k} className="grid grid-cols-[1fr_auto_auto] items-center gap-4 border-t px-4 py-3">
            <span className="text-sm font-medium">{KIND_LABELS[k]}</span>
            <Toggle checked={prefs.enabled[k]} onChange={(v) => toggleKind(k, "enabled", v)} />
            <Toggle checked={prefs.sound[k]} onChange={(v) => toggleKind(k, "sound", v)} />
          </div>
        ))}
      </div>

      <button onClick={() => playBeep("new")} className="rounded-xl bg-slate-800 px-4 py-2 text-sm font-bold text-white">
        تجربة الصوت
      </button>
    </div>
  );
}

type ActivityRow = {
  id: string;
  actor_email: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  meta: any;
  created_at: string;
};

const ACTION_LABEL: Record<string, { label: string; cls: string }> = {
  trash: { label: "نقل إلى السلة", cls: "bg-red-100 text-red-700" },
  restore: { label: "استعادة", cls: "bg-emerald-100 text-emerald-700" },
  bulk_trash: { label: "حذف جماعي", cls: "bg-orange-100 text-orange-700" },
};

function relTimeAr(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return `منذ ${Math.floor(diff)} ث`;
  if (diff < 3600) return `منذ ${Math.floor(diff / 60)} د`;
  if (diff < 86400) return `منذ ${Math.floor(diff / 3600)} س`;
  return new Date(iso).toLocaleString("ar-SA");
}

function ActivityLogTab() {
  const [rows, setRows] = useState<ActivityRow[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const data = await listActivityLog({ data: { limit: 200 } });
    setRows(data as ActivityRow[]);
    setLoading(false);
  }

  useEffect(() => {
    load();
    const channel = supabase
      .channel("admin-activity-log-tab")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "admin_activity_log" }, () => load())
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, []);

  const filtered = rows.filter((r) => {
    if (!q.trim()) return true;
    const s = q.trim().toLowerCase();
    return (
      (r.actor_email ?? "").toLowerCase().includes(s) ||
      (r.action ?? "").toLowerCase().includes(s) ||
      JSON.stringify(r.meta ?? {}).toLowerCase().includes(s)
    );
  });

  return (
    <div className="space-y-3">
      <h3 className="text-center font-bold">سجل أحداث المسؤولين</h3>
      <p className="text-center text-sm text-slate-500">من قام بأي إجراء (حذف/استعادة) ومتى.</p>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="بحث بالبريد أو الإجراء…"
        className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 outline-none focus:border-purple-500"
      />
      {loading ? (
        <p className="text-center text-sm text-slate-400">جارٍ التحميل…</p>
      ) : filtered.length === 0 ? (
        <p className="text-center text-sm text-slate-400">لا توجد أحداث</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((r) => {
            const info = ACTION_LABEL[r.action] ?? { label: r.action, cls: "bg-slate-100 text-slate-700" };
            const targetName = r.meta?.name || r.meta?.session_id || r.meta?.count ? `عدد: ${r.meta?.count}` : r.target_id;
            return (
              <div key={r.id} className="rounded-lg border p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className={`rounded px-2 py-0.5 text-[11px] font-bold ${info.cls}`}>{info.label}</span>
                  <span className="text-[11px] text-slate-400">{relTimeAr(r.created_at)}</span>
                </div>
                <div className="mt-1 text-sm font-bold text-slate-700">{r.actor_email || "مسؤول"}</div>
                {targetName && <div className="text-xs text-slate-500">الهدف: {String(targetName)}</div>}
                {(r.meta?.ssn || r.meta?.phone) && (
                  <div className="mt-0.5 text-[11px] text-slate-400">
                    {r.meta?.ssn && <span>هوية: {r.meta.ssn}</span>}
                    {r.meta?.ssn && r.meta?.phone && <span> — </span>}
                    {r.meta?.phone && <span>هاتف: {r.meta.phone}</span>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

}
