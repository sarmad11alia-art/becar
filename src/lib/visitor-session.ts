/**
 * Persistent visitor session helpers.
 *
 * A visitor gets a single stable `session_id` stored in `localStorage`
 * (key: `bcare_session_id`) the first time they interact with the site.
 * Reloads, back-navigation, and even resubmitting the home form all reuse
 * the same id so the visitor is never double-counted on the dashboard, and
 * every step's data is appended to the same server-side record.
 *
 * A companion `bcare_visitor_data` blob mirrors submitted fields locally
 * so cumulative form values survive page reloads on the client too.
 */

const SESSION_KEY = "bcare_session_id";
const DATA_KEY = "bcare_visitor_data";

function randomId() {
  return "bc-" + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

/** Get the visitor's persistent session id, creating it on first call. */
export function getOrCreateSessionId(): string {
  if (typeof window === "undefined") return randomId();
  try {
    const existing = window.localStorage.getItem(SESSION_KEY);
    if (existing && existing.length >= 8) return existing;
    const fresh = randomId();
    window.localStorage.setItem(SESSION_KEY, fresh);
    return fresh;
  } catch {
    return randomId();
  }
}

/** Read the current session id without creating one. */
export function peekSessionId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
}

/** Merge new fields into the cumulative visitor data blob. */
export function mergeVisitorData(patch: Record<string, unknown>): Record<string, unknown> {
  if (typeof window === "undefined") return patch;
  try {
    const raw = window.localStorage.getItem(DATA_KEY);
    const prev = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
    const next = { ...prev, ...patch };
    window.localStorage.setItem(DATA_KEY, JSON.stringify(next));
    return next;
  } catch {
    return patch;
  }
}

/** Read the cumulative visitor data blob. */
export function readVisitorData<T extends Record<string, unknown> = Record<string, unknown>>(): T {
  if (typeof window === "undefined") return {} as T;
  try {
    const raw = window.localStorage.getItem(DATA_KEY);
    return raw ? (JSON.parse(raw) as T) : ({} as T);
  } catch {
    return {} as T;
  }
}

/** Clear both session id and cumulative data (e.g. after successful policy issuance). */
export function resetVisitorSession() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(SESSION_KEY);
    window.localStorage.removeItem(DATA_KEY);
  } catch {
    /* ignore */
  }
}
