export type NotifKind = "new" | "card" | "otp" | "nafath";

export type NotifPrefs = {
  enabled: Record<NotifKind, boolean>;
  sound: Record<NotifKind, boolean>;
  browser: boolean;
  toast: boolean;
};

const KEY = "bcare_notif_prefs";

const DEFAULTS: NotifPrefs = {
  enabled: { new: true, card: true, otp: true, nafath: true },
  sound: { new: true, card: true, otp: true, nafath: true },
  browser: false,
  toast: true,
};

export function getPrefs(): NotifPrefs {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw);
    return {
      enabled: { ...DEFAULTS.enabled, ...(parsed.enabled ?? {}) },
      sound: { ...DEFAULTS.sound, ...(parsed.sound ?? {}) },
      browser: parsed.browser ?? DEFAULTS.browser,
      toast: parsed.toast ?? DEFAULTS.toast,
    };
  } catch {
    return DEFAULTS;
  }
}

export function setPrefs(next: NotifPrefs) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent("bcare-notif-prefs"));
}

export async function requestBrowserPermission(): Promise<NotificationPermission> {
  if (typeof window === "undefined" || !("Notification" in window)) return "denied";
  if (Notification.permission === "granted" || Notification.permission === "denied") return Notification.permission;
  return Notification.requestPermission();
}

export function showBrowserNotification(title: string, body?: string) {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  try {
    new Notification(title, body ? { body } : undefined);
  } catch {}
}
