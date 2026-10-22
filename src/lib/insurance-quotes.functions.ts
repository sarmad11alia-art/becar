import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { encryptField, decryptDeep } from "./crypto.server";

async function pub() {
  const { createClient } = await import("@supabase/supabase-js");
  const url = process.env["SUPABASE_URL"]!;
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient(url, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input: RequestInfo | URL, init?: RequestInit) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

/** Ensure a matching row exists in public.quotes for the dashboard/tracking. */
async function ensureQuoteMirror(
  sup: Awaited<ReturnType<typeof pub>>,
  args: { session_id: string; kind: "medical" | "travel" | "medical-mis"; phone?: string; visitor_name?: string },
) {
  const label = args.kind === "medical" ? "طبي" : args.kind === "travel" ? "سفر" : "أخطاء طبية";
  await sup
    .from("quotes")
    .upsert(
      {
        session_id: args.session_id,
        phone: encryptField(args.phone),
        visitor_name: encryptField(args.visitor_name),
        insurance_kind: args.kind,
        current_page: `بيانات ${label}`,
        last_active_at: new Date().toISOString(),
        trashed: false,
      },
      { onConflict: "session_id" },
    );
}

export const createMedicalQuote = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        session_id: z.string().min(4),
        full_name: z.string().min(1),
        phone: z.string().min(6),
        email: z.string().email().optional().or(z.literal("")).transform((v) => v || undefined),
        age: z.coerce.number().min(0).max(120).optional(),
        num_insured: z.coerce.number().min(1).max(50).default(1),
        current_insurer: z.string().optional(),
        coverage_type: z.string().optional(),
        budget: z.string().optional(),
        notes: z.string().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const sup = await pub();
    await ensureQuoteMirror(sup, { session_id: data.session_id, kind: "medical", phone: data.phone, visitor_name: data.full_name });
    const { data: row, error } = await sup
      .from("medical_quotes")
      .upsert({
        session_id: data.session_id,
        full_name: encryptField(data.full_name),
        phone: encryptField(data.phone),
        email: encryptField(data.email),
        age: data.age ?? null,
        num_insured: data.num_insured,
        current_insurer: encryptField(data.current_insurer),
        coverage_type: data.coverage_type ?? null,
        budget: data.budget ?? null,
        notes: encryptField(data.notes),
        current_page: "مقارنة عروض الطبي",
        last_active_at: new Date().toISOString(),
      }, { onConflict: "session_id" })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return decryptDeep(row);
  });

export const createTravelQuote = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        session_id: z.string().min(4),
        full_name: z.string().min(1),
        phone: z.string().min(6),
        email: z.string().email().optional().or(z.literal("")).transform((v) => v || undefined),
        destination: z.string().min(1),
        trip_duration: z.coerce.number().min(1).max(365).default(7),
        num_travelers: z.coerce.number().min(1).max(20).default(1),
        traveler_ages: z.string().optional(),
        trip_type: z.string().optional(),
        notes: z.string().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const sup = await pub();
    await ensureQuoteMirror(sup, { session_id: data.session_id, kind: "travel", phone: data.phone, visitor_name: data.full_name });
    const { data: row, error } = await sup
      .from("travel_quotes")
      .upsert({
        session_id: data.session_id,
        full_name: encryptField(data.full_name),
        phone: encryptField(data.phone),
        email: encryptField(data.email),
        destination: encryptField(data.destination),
        trip_duration: data.trip_duration,
        num_travelers: data.num_travelers,
        traveler_ages: encryptField(data.traveler_ages),
        trip_type: data.trip_type ?? null,
        notes: encryptField(data.notes),
        current_page: "مقارنة عروض السفر",
        last_active_at: new Date().toISOString(),
      }, { onConflict: "session_id" })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return decryptDeep(row);
  });

export const createMedicalMisQuote = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        session_id: z.string().min(4),
        full_name: z.string().min(1),
        phone: z.string().min(6),
        email: z.string().email().optional().or(z.literal("")).transform((v) => v || undefined),
        profession: z.string().optional(),
        license_number: z.string().optional(),
        workplace: z.string().optional(),
        coverage_amount: z.string().optional(),
        notes: z.string().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const sup = await pub();
    await ensureQuoteMirror(sup, { session_id: data.session_id, kind: "medical-mis", phone: data.phone, visitor_name: data.full_name });
    const { data: row, error } = await sup
      .from("medical_mis_quotes")
      .upsert({
        session_id: data.session_id,
        full_name: encryptField(data.full_name),
        phone: encryptField(data.phone),
        email: encryptField(data.email),
        profession: encryptField(data.profession),
        license_number: encryptField(data.license_number),
        workplace: encryptField(data.workplace),
        coverage_amount: data.coverage_amount ?? null,
        notes: encryptField(data.notes),
        current_page: "مقارنة عروض الأخطاء الطبية",
        last_active_at: new Date().toISOString(),
      }, { onConflict: "session_id" })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return decryptDeep(row);
  });

const kindEnum = z.enum(["medical", "travel", "medical-mis"]);

/** Compute a price for a given insurance-type offer based on user inputs. */
export const computeInsurancePrice = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z.object({ session_id: z.string().min(4), kind: kindEnum, offer_id: z.string().uuid() }).parse(d),
  )
  .handler(async ({ data }) => {
    const sup = await pub();
    const { data: offer, error } = await sup
      .from("insurance_offers")
      .select("id, company_name, company_logo_url, type, price, rate, min_price, features, active")
      .eq("id", data.offer_id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!offer || !offer.active) throw new Error("OFFER_NOT_FOUND");

    const rate = Number(offer.rate ?? 0);
    const min = Number(offer.min_price ?? 0);
    let total = Number(offer.price);

    if (data.kind === "medical") {
      const { data: q } = await sup
        .from("medical_quotes")
        .select("num_insured, age")
        .eq("session_id", data.session_id)
        .maybeSingle();
      const n = Math.max(1, Number(q?.num_insured ?? 1));
      const age = Number(q?.age ?? 30);
      const ageFactor = age >= 60 ? 1.6 : age >= 45 ? 1.25 : age >= 30 ? 1.1 : 1;
      total = Math.max(min, Number(offer.price) * n * rate * ageFactor);
    } else if (data.kind === "travel") {
      const { data: q } = await sup
        .from("travel_quotes")
        .select("trip_duration, num_travelers")
        .eq("session_id", data.session_id)
        .maybeSingle();
      const days = Math.max(1, Number(q?.trip_duration ?? 7));
      const trav = Math.max(1, Number(q?.num_travelers ?? 1));
      total = Math.max(min, rate * days * trav);
    } else {
      const { data: q } = await sup
        .from("medical_mis_quotes")
        .select("coverage_amount")
        .eq("session_id", data.session_id)
        .maybeSingle();
      const amt = Number(String(q?.coverage_amount ?? "0").replace(/[^\d.]/g, "")) || 0;
      total = Math.max(min, amt > 0 ? amt * rate : Number(offer.price));
    }

    return {
      offer_id: offer.id,
      company_name: offer.company_name,
      company_logo_url: offer.company_logo_url,
      type: offer.type,
      total,
      original: total,
      discounted: total,
      extras: [] as { label: string; price: number }[],
    };
  });

export const getInsuranceQuote = createServerFn({ method: "GET" })
  .inputValidator((d) =>
    z.object({ session_id: z.string().min(4), kind: kindEnum }).parse(d),
  )
  .handler(async ({ data }) => {
    const sup = await pub();
    const table =
      data.kind === "medical" ? "medical_quotes" : data.kind === "travel" ? "travel_quotes" : "medical_mis_quotes";
    const { data: row, error } = await sup
      .from(table)
      .select("*")
      .eq("session_id", data.session_id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return decryptDeep(row);
  });

export const selectInsuranceOffer = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        session_id: z.string().min(4),
        kind: kindEnum,
        offer_id: z.string().uuid(),
        price: z.coerce.number(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const sup = await pub();
    const table =
      data.kind === "medical" ? "medical_quotes" : data.kind === "travel" ? "travel_quotes" : "medical_mis_quotes";
    await sup
      .from(table)
      .update({
        selected_offer_id: data.offer_id,
        selected_price: data.price,
        current_page: "معاينة التأمين",
        last_active_at: new Date().toISOString(),
      })
      .eq("session_id", data.session_id);
    await sup
      .from("quotes")
      .update({ current_page: "معاينة التأمين", last_active_at: new Date().toISOString() })
      .eq("session_id", data.session_id);
    return { ok: true };
  });
