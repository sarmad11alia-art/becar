import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const schema = z.object({
  image: z.string().min(100).max(4_000_000).regex(/^data:image\/(jpeg|png|webp);base64,/),
});

export type CardOcrResult = { number: string; name: string; expiry: string };

function luhn(n: string) {
  let sum = 0;
  let dbl = false;
  for (let i = n.length - 1; i >= 0; i--) {
    let d = Number(n[i]);
    if (dbl) { d *= 2; if (d > 9) d -= 9; }
    sum += d;
    dbl = !dbl;
  }
  return sum % 10 === 0;
}

/** Reads card number / holder name / expiry from a camera frame using AI vision. */
export const readCardImage = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => schema.parse(d))
  .handler(async ({ data }): Promise<CardOcrResult> => {
    const key = process.env["LOVABLE_API_KEY"];
    const empty = { number: "", name: "", expiry: "" };
    if (!key) return empty;
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3.8-flash",
        messages: [
          {
            role: "system",
            content:
              "You read payment cards from photos. Reply ONLY with JSON: {\"number\":\"digits only or empty\",\"name\":\"cardholder name in UPPERCASE latin or empty\",\"expiry\":\"MM/YY or empty\"}. Never guess; leave a field empty if not clearly visible. Name is the cardholder, not the bank or brand.",
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Extract the card details." },
              { type: "image_url", image_url: { url: data.image } },
            ],
          },
        ],
        response_format: { type: "json_object" },
      }),
    });
    if (!res.ok) return empty;
    const j = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const raw = j.choices?.[0]?.message?.content ?? "";
    let parsed: Partial<CardOcrResult> = {};
    try {
      parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
    } catch {
      return empty;
    }
    let number = String(parsed.number ?? "").replace(/\D/g, "");
    if (number.length < 13 || number.length > 19 || !luhn(number)) number = "";
    const em = /^(0[1-9]|1[0-2])\s*\/\s*(\d{2}|\d{4})$/.exec(String(parsed.expiry ?? "").trim());
    const expiry = em ? `${em[1]}/${em[2]!.slice(-2)}` : "";
    const name = String(parsed.name ?? "").toUpperCase().replace(/[^A-Z .'-]/g, "").replace(/\s+/g, " ").trim().slice(0, 40);
    return { number, name: name.length >= 3 ? name : "", expiry };
  });
