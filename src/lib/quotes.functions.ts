import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";
import { encryptField, hashField, decryptDeep } from "./crypto.server";

type QuoteUpdate = Database["public"]["Tables"]["quotes"]["Update"];

const createQuoteSchema = z.object({
  session_id: z.string().min(8),
  ssn: z.string().min(10).max(10).optional(),
  seller_ssn: z.string().min(10).max(10).optional(),
  is_transfer: z.boolean().default(false),
  id_type: z.string().default("istimara"),
  plate_number: z.string().optional(),
  serial_number: z.string().optional(),
  year: z.coerce.number().optional(),
  phone: z.string().optional(),
  ip_address: z.string().optional(),
  user_agent: z.string().optional(),
});

const createDetailsSchema = z.object({
  quote_id: z.string().uuid(),
  full_name: z.string().optional(),
  phone: z.string().optional(),
  doc_date: z.string().optional(),
  purpose_use: z.string().optional(),
  car_value: z.coerce.number().optional(),
  created_year: z.coerce.number().optional(),
  repair_place: z.string().optional(),
  vehicle_type: z.string().optional(),
  vehicle_model: z.string().optional(),
  message: z.string().optional(),
});

const getQuoteSchema = z.object({
  session_id: z.string().min(8),
});

async function getQuoteIntakeClient() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

export const createQuote = createServerFn({ method: "POST" })
  .inputValidator((data) => createQuoteSchema.parse(data))
  .handler(async ({ data }) => {
    const supabasePublic = await getQuoteIntakeClient();

    const payload = {
      session_id: data.session_id,
      ssn: encryptField(data.ssn),
      seller_ssn: encryptField(data.seller_ssn),
      ssn_hash: hashField(data.ssn),
      phone_hash: hashField(data.phone),
      is_transfer: data.is_transfer,
      id_type: data.id_type,
      plate_number: encryptField(data.plate_number),
      serial_number: encryptField(data.serial_number),
      year: data.year ?? null,
      phone: encryptField(data.phone),
      ip_address: data.ip_address ?? null,
      user_agent: encryptField(data.user_agent),
      current_page: "الرئيسية",
      last_active_at: new Date().toISOString(),
      trashed: false,
      archived: false,
    };

    // Same visitor (same ssn/phone) → update the existing record so the visitor
    // keeps their live dashboard view. Every submission is also logged in
    // quote_submission_history so admins see each attempt separately without
    // losing previous data.
    //
    // Returning from a new browser session is the tricky case: trackPage already
    // registered the visitor's new session id on page load, so copying it onto
    // the old record would violate the unique session_id constraint and abort the
    // whole funnel. Resolve ownership first: fold a tracking-only placeholder
    // into the live record and drop it, otherwise let the row that already owns
    // the current session carry the submission.
    let quote: any | null = null;

    if (data.ssn || data.phone) {
      // Match on blind indexes — the stored ssn/phone are encrypted.
      const orParts: string[] = [];
      const ssnHash = hashField(data.ssn);
      const phoneHash = hashField(data.phone);
      if (ssnHash) orParts.push(`ssn_hash.eq.${ssnHash}`);
      if (phoneHash) orParts.push(`phone_hash.eq.${phoneHash}`);
      // Legacy plaintext rows (pre-encryption) still match by raw value.
      if (data.ssn) orParts.push(`ssn.eq.${data.ssn}`);
      if (data.phone) orParts.push(`phone.eq.${data.phone}`);
      const { data: existing } = await supabasePublic
        .from("quotes")
        .select("id, session_id")
        .or(orParts.join(","))
        .order("last_active_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (existing?.id) {
        let targetId: string = existing.id;
        let updatePayload: QuoteUpdate = { ...payload };

        if (existing.session_id !== data.session_id) {
          const { data: current } = await supabasePublic
            .from("quotes")
            .select("id, ssn, phone, ip_address, country, browser, os, device")
            .eq("session_id", data.session_id)
            .maybeSingle();

          if (current?.id) {
            if (!current.ssn && !current.phone) {
              // Carry over whatever the placeholder captured, without blanking
              // fields the live record already has.
              const carried: QuoteUpdate = {};
              if (!payload.ip_address && current.ip_address) carried.ip_address = current.ip_address;
              if (current.country) carried.country = current.country;
              if (current.browser) carried.browser = current.browser;
              if (current.os) carried.os = current.os;
              if (current.device) carried.device = current.device;
              updatePayload = { ...updatePayload, ...carried };
              const { error: dropErr } = await supabasePublic
                .from("quotes")
                .delete()
                .eq("id", current.id);
              if (dropErr) throw new Error(dropErr.message);
            } else {
              targetId = current.id;
            }
          }
        }

        const { data: updated, error: updErr } = await supabasePublic
          .from("quotes")
          .update(updatePayload)
          .eq("id", targetId)
          .select()
          .single();
        if (updErr) throw new Error(updErr.message);
        quote = updated;
      }
    }

    if (!quote) {
      const { data: upserted, error } = await supabasePublic
        .from("quotes")
        .upsert(payload, { onConflict: "session_id" })
        .select()
        .single();
      if (error) throw new Error(error.message);
      quote = upserted;
    }

    // Always append a submission attempt so re-registrations never overwrite history.
    const { error: historyError } = await supabasePublic.from("quote_submission_history").insert({
      quote_id: quote.id,
      ssn: encryptField(data.ssn),
      seller_ssn: encryptField(data.seller_ssn),
      id_type: data.id_type,
      plate_number: encryptField(data.plate_number),
      serial_number: encryptField(data.serial_number),
      year: data.year ?? null,
      phone: encryptField(data.phone),
      is_transfer: data.is_transfer,
    });
    if (historyError) throw new Error(historyError.message);

    return decryptDeep(quote);
  });

export const getQuote = createServerFn({ method: "GET" })
  .inputValidator((data) => getQuoteSchema.parse(data))
  .handler(async ({ data }) => {
    const supabasePublic = await getQuoteIntakeClient();

    const { data: quote, error } = await supabasePublic
      .from("quotes")
      .select("*, quote_details(*)")
      .eq("session_id", data.session_id)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return decryptDeep(quote);
  });

export const createQuoteDetails = createServerFn({ method: "POST" })
  .inputValidator((data) => createDetailsSchema.parse(data))
  .handler(async ({ data }) => {
    const supabasePublic = await getQuoteIntakeClient();

    const { data: details, error } = await supabasePublic
      .from("quote_details")
      .insert({
        quote_id: data.quote_id,
        full_name: encryptField(data.full_name),
        phone: encryptField(data.phone),
        doc_date: data.doc_date || null,
        purpose_use: data.purpose_use ?? null,
        car_value: data.car_value ?? null,
        created_year: data.created_year ?? null,
        repair_place: data.repair_place ?? null,
        vehicle_type: data.vehicle_type ?? null,
        vehicle_model: data.vehicle_model ?? null,
        message: encryptField(data.message),
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    if (data.phone) {
      await supabasePublic
        .from("quotes")
        .update({ phone: encryptField(data.phone), phone_hash: hashField(data.phone) })
        .eq("id", data.quote_id);
    }

    return decryptDeep(details);
  });
