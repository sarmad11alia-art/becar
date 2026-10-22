import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const listOffersSchema = z.object({
  type: z.string().optional(),
});

async function createPublicSupabaseClient() {
  const { createClient } = await import("@supabase/supabase-js");
  const url = process.env["SUPABASE_URL"]!;
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient(url, key, {
    auth: {
      storage: undefined,
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      fetch: (input: RequestInfo | URL, init?: RequestInit) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) {
          h.delete("Authorization");
        }
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

/**
 * Most in-demand insurers in Saudi Arabia (vehicle market), ordered by
 * market demand. Name fragments match against company_name.
 * Every licensed insurer present in the catalog is listed here so no
 * company falls into the "unlisted" bucket.
 */
const KSA_POPULARITY: string[] = [
  "التعاونية",
  "بوبا",
  "الراجحي",
  "ميدغلف",
  "ولاء",
  "الوطنية",
  "اتحاد الخليج",
  "الملاث",
  "الدرع العربي",
  "مجموعة الخليج",
  "الجزيرة",
  "سلامة",
  "سايكو",
  "أسيج",
  "المتحدة",
  "العربية",
  "الاتحاد",
  "أمانة",
  "ليفا",
  "عناية",
  "الصقر",
  "الخليجية العامة",
  "تري",
  "متكاملة",
  "زارة",
  "ملاذ",
  "بروج",
  "وقاية",
  "الأهلي",
  "الإنماء",
  "أليانز",
  "أكسا",
  "العالمية",
  "تشب",
];

function ksaRank(companyName: string): number {
  const name = companyName.trim();
  // "تري من التعاونية" is a distinct brand and must not inherit Tawuniya's rank.
  if (name.includes("تري")) return KSA_POPULARITY.indexOf("تري");
  // "تشب العربية" is a distinct brand and must not inherit "العربية"'s rank.
  if (name.includes("تشب")) return KSA_POPULARITY.indexOf("تشب");
  for (let i = 0; i < KSA_POPULARITY.length; i++) {
    const frag = KSA_POPULARITY[i];
    if (frag && name.includes(frag)) return i;
  }
  return KSA_POPULARITY.length; // unlisted companies go last
}

export const listOffers = createServerFn({ method: "GET" })
  .inputValidator((data) => listOffersSchema.parse(data))
  .handler(async ({ data }) => {
    const supabasePublic = await createPublicSupabaseClient();

    let query = supabasePublic
      .from("insurance_offers")
      .select("*")
      .eq("active", true)
      .order("sort_order", { ascending: true });

    if (data.type) {
      query = query.eq("type", data.type);
    }

    const { data: offers, error } = await query;

    if (error) throw new Error(error.message);

    type OfferRow = { id: string; company_name?: string; sort_order?: number };

    return ((offers ?? []) as OfferRow[]).sort((a, b) => {
      // 1) Most-used insurers in the Saudi market first.
      const rankDiff =
        ksaRank(String(a.company_name ?? "")) - ksaRank(String(b.company_name ?? ""));
      if (rankDiff !== 0) return rankDiff;
      // 2) Then the catalog-defined order within each company.
      return Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0);
    });
  });

/** Canonical discount rate (بي كير). Server is the source of truth. */
export const BCARE_DISCOUNT = 0.9;

export type Feature = { label: string; price?: number; included?: boolean };

export function normalizeFeatures(f: unknown): Feature[] {
  if (!Array.isArray(f)) return [];
  return f.map((it) => {
    if (typeof it === "string") return { label: it, price: 0, included: true };
    const o = (it ?? {}) as Feature;
    return { label: String(o.label ?? ""), price: Number(o.price ?? 0), included: !!o.included };
  });
}

export type PricingOffer = {
  type: string;
  price: number | string;
  rate: number | string | null;
  min_price: number | string | null;
  features?: unknown;
};

/**
 * Pure pricing calculation. Exported for tests.
 * - شامل وضد الغير: السعر يتناسب مع قيمة المركبة — base = carValue>0 ? max(min_price, carValue*rate) : (min_price || price)
 * - يطبّق خصم بي كير على الأساس، ثم يضيف الإضافات المصرّح بها فقط.
 */
export function calcOfferPricing(
  offer: PricingOffer,
  carValue: number,
  extras: string[] = [],
) {
  const rate = Number(offer.rate ?? 0);
  const minPrice = Number(offer.min_price ?? 0);
  const cv = Number.isFinite(carValue) && carValue > 0 ? carValue : 0;
  let base: number;
  if (rate > 0) {
    base = cv > 0 ? Math.max(minPrice, cv * rate) : minPrice > 0 ? minPrice : Number(offer.price);
  } else {
    base = Number(offer.price);
  }
  const features = normalizeFeatures(offer.features);
  const wanted = new Set(extras.map((s) => s.trim()));
  const acceptedExtras = features
    .filter((f) => !f.included && wanted.has(f.label) && Number(f.price ?? 0) > 0)
    .map((f) => ({ label: f.label, price: Number(f.price ?? 0) }));
  const extrasSum = acceptedExtras.reduce((s, e) => s + e.price, 0);
  const original = base;
  const discounted = base * BCARE_DISCOUNT;
  const total = discounted + extrasSum;
  return { original, discounted, extras: acceptedExtras, total, car_value: cv };
}

/**
 * Authoritative server-side pricing (uses DB values only).
 */
export const computeOfferPrice = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z
      .object({
        offer_id: z.string().uuid(),
        session_id: z.string().min(4).optional(),
        extras: z.array(z.string()).optional(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const supabase = await createPublicSupabaseClient();

    const { data: offer, error } = await supabase
      .from("insurance_offers")
      .select("id, company_name, company_logo_url, type, price, rate, min_price, features, active")
      .eq("id", data.offer_id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!offer || !offer.active) throw new Error("OFFER_NOT_FOUND");

    let carValue = 0;
    if (data.session_id) {
      const { data: q } = await supabase
        .from("quotes")
        .select("id, quote_details(car_value, created_at)")
        .eq("session_id", data.session_id)
        .maybeSingle();
      const details =
        (q as { quote_details?: { car_value?: number; created_at?: string }[] } | null)
          ?.quote_details ?? [];
      // Use the customer's newest answer, matching what the offers page shows.
      const newest = [...details]
        .sort((a, b) => String(b?.created_at ?? "").localeCompare(String(a?.created_at ?? "")))
        .find((d) => Number(d?.car_value ?? 0) > 0);
      carValue = Number(newest?.car_value ?? 0) || 0;
    }

    const priced = calcOfferPricing(offer as PricingOffer, carValue, data.extras ?? []);

    return {
      offer_id: offer.id,
      company_name: offer.company_name,
      company_logo_url: offer.company_logo_url,
      type: offer.type,
      ...priced,
    };
  });
