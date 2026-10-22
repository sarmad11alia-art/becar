// Saudi payment-card identification.
// Longest-prefix matching over the bundled BIN/IIN database:
// 8-digit mada / ISO prefixes first, then 6-digit BINs, then 4-digit candidates.
import { BIN6, PREFIX8, ISSUERS, MADA_PREFIXES, type BinRecord } from "./saudi-bins.generated";

import rajhi from "@/assets/cards/al-rajhi-bank.png";
import alinma from "@/assets/cards/alinma-bank.png";
import anb from "@/assets/cards/arab-national-bank.png";
import albilad from "@/assets/cards/bank-albilad.jpg";
import jazira from "@/assets/cards/bank-aljazira.svg";
import bsf from "@/assets/cards/banque-saudi-fransi.png";
import d360 from "@/assets/cards/d-three-sixty-bank.png";
import gib from "@/assets/cards/gulf-international-bank-saudi-arabia.png";
import riyad from "@/assets/cards/riyad-bank.png";
import sab from "@/assets/cards/saudi-awwal-bank.png";
import saib from "@/assets/cards/saudi-investment-bank.webp";
import snb from "@/assets/cards/saudi-national-bank.png";
import stc from "@/assets/cards/stc-bank.png";
import vision from "@/assets/cards/vision-bank.png";
import amex from "@/assets/cards/american-express-saudi-arabia.png";

export type CardBrand = "visa" | "master" | "mada" | "amex" | "discover" | "unionpay" | "jcb" | "maestro" | "diners" | "uatp" | "unknown";

export type BankInfo = {
  id: string;
  nameAr: string;
  nameEn: string;
  gradient: string;
  backGradient: string;
  accent: string;
  imageUrl: string | null;
};

/** Result of identifying a card number prefix. */
export type CardIdentity = {
  bank: BankInfo;
  brand: CardBrand;
  /** Networks the issuer publishes for this prefix (e.g. "MADA,VISA"). */
  schemes: string[];
  /** DEBIT / CREDIT / PREPAID as published. */
  cardTypes: string[];
  matchedLength: 0 | 4 | 6 | 8;
  confidence: "none" | "candidate" | "provisional" | "medium" | "high";
  /** True when sources disagree, or a 6-digit hit has 8-digit children. */
  provisional: boolean;
  isMada: boolean;
  /** Arabic explanation of the match quality, safe to show in the UI. */
  note: string;
};

type BankStyle = { gradient: string; backGradient: string; accent: string; imageUrl: string | null };

const GENERIC: BankStyle = {
  gradient: "from-[#0f2c5a] via-[#123a7a] to-[#1e60c0]",
  backGradient: "from-[#0f2c5a] to-[#1e60c0]",
  accent: "#1e60c0",
  imageUrl: null,
};

// Visual identity + real card art for issuers we have assets for.
const BANK_STYLES: Record<string, BankStyle> = {
  "al-rajhi-bank": { gradient: "from-[#00305B] via-[#0a4a86] to-[#0a4a86]", backGradient: "from-[#00305B] to-[#062647]", accent: "#F0B323", imageUrl: rajhi },
  "saudi-national-bank": { gradient: "from-[#003D33] via-[#005E51] to-[#00A19A]", backGradient: "from-[#003D33] to-[#005E51]", accent: "#00A19A", imageUrl: snb },
  "riyad-bank": { gradient: "from-[#003b71] via-[#0a5a9c] to-[#127dc1]", backGradient: "from-[#002a52] to-[#0a5a9c]", accent: "#f37021", imageUrl: riyad },
  "saudi-awwal-bank": { gradient: "from-[#111111] via-[#1a1a1a] to-[#db0011]", backGradient: "from-[#111111] to-[#3a0006]", accent: "#db0011", imageUrl: sab },
  "alinma-bank": { gradient: "from-[#3b1e6b] via-[#522D80] to-[#7a3fb0]", backGradient: "from-[#2b1550] to-[#522D80]", accent: "#f5a623", imageUrl: alinma },
  "bank-albilad": { gradient: "from-[#8B5A00] via-[#c47f0a] to-[#F58220]", backGradient: "from-[#6b4500] to-[#c47f0a]", accent: "#F58220", imageUrl: albilad },
  "arab-national-bank": { gradient: "from-[#004b3f] via-[#00695c] to-[#00897b]", backGradient: "from-[#003a30] to-[#00695c]", accent: "#c9a24b", imageUrl: anb },
  "banque-saudi-fransi": { gradient: "from-[#004225] via-[#006b3c] to-[#009639]", backGradient: "from-[#003018] to-[#006b3c]", accent: "#009639", imageUrl: bsf },
  "bank-aljazira": { gradient: "from-[#4a1e1e] via-[#7a2e2e] to-[#a83232]", backGradient: "from-[#3a1414] to-[#7a2e2e]", accent: "#c9a24b", imageUrl: jazira },
  "saudi-investment-bank": { gradient: "from-[#0b3d91] via-[#1252b8] to-[#2a6fd6]", backGradient: "from-[#082a66] to-[#1252b8]", accent: "#e8a838", imageUrl: saib },
  "gulf-international-bank-saudi-arabia": { gradient: "from-[#0a3d2f] via-[#106446] to-[#189063]", backGradient: "from-[#062a20] to-[#106446]", accent: "#c9a24b", imageUrl: gib },
  "d360-bank": { gradient: "from-[#2a1a5e] via-[#4b2fa8] to-[#7a4fe0]", backGradient: "from-[#1a1040] to-[#4b2fa8]", accent: "#f58220", imageUrl: d360 },
  "stc-bank": { gradient: "from-[#4a0072] via-[#6b0d94] to-[#8a1eb0]", backGradient: "from-[#2f0048] to-[#6b0d94]", accent: "#e11e6a", imageUrl: stc },
  "vision-bank": { gradient: "from-[#0b2e4f] via-[#12507f] to-[#1b78b8]", backGradient: "from-[#08223c] to-[#12507f]", accent: "#31c6c6", imageUrl: vision },
  "american-express-saudi-arabia": { gradient: "from-[#00175a] via-[#0a2f7a] to-[#2e77bc]", backGradient: "from-[#00175a] to-[#0a2f7a]", accent: "#2e77bc", imageUrl: amex },
  // بطاقة الفرسان (الخطوط السعودية) تصدر بالشراكة مع الأهلي — نستخدم هوية الأهلي بصريًا
  "saudi-arabian-airlines": { gradient: "from-[#003D33] via-[#005E51] to-[#00A19A]", backGradient: "from-[#003D33] to-[#005E51]", accent: "#00A19A", imageUrl: snb },
};

export const UNKNOWN_BANK: BankInfo = {
  id: "generic",
  nameAr: "بطاقة بنكية",
  nameEn: "BANK",
  ...GENERIC,
};

function bankFromIssuer(issuerId: string): BankInfo {
  const issuer = ISSUERS[issuerId];
  const style = BANK_STYLES[issuerId] || GENERIC;
  if (!issuer) return { ...UNKNOWN_BANK, ...style, id: issuerId };
  return {
    id: issuerId,
    nameAr: issuer.ar || issuer.en || UNKNOWN_BANK.nameAr,
    nameEn: issuer.en || UNKNOWN_BANK.nameEn,
    ...style,
  };
}

const MADA_SET = new Set(MADA_PREFIXES);

// bin4 -> issuer ids (candidate narrowing only, never a final answer).
const BIN4: Record<string, string[]> = (() => {
  const map: Record<string, Set<string>> = {};
  for (const [bin, rec] of Object.entries(BIN6)) {
    const k = bin.slice(0, 4);
    (map[k] ||= new Set()).add(rec.issuer);
  }
  const out: Record<string, string[]> = {};
  for (const [k, v] of Object.entries(map)) out[k] = [...v];
  return out;
})();

const digits = (v: string) => (v || "").replace(/\D/g, "");
const split = (v: string) => (v ? v.split(/[,;/]/).map((s) => s.trim()).filter(Boolean) : []);

/** Network from the scheme list, falling back to standard IIN ranges. */
export function detectBrand(num: string): CardBrand {
  const n = digits(num);
  if (!n) return "unknown";
  const id = identifyCard(n);
  if (id.matchedLength >= 6 && id.brand !== "unknown") return id.brand;
  if (isMadaPrefix(n)) return "mada";
  if (/^4/.test(n)) return "visa";
  if (/^(5[1-5]|2[2-7])/.test(n)) return "master";
  if (/^3[47]/.test(n)) return "amex";
  if (/^(6011|64[4-9]|65)/.test(n)) return "discover";
  if (/^62/.test(n)) return "unionpay";
  if (/^35/.test(n)) return "jcb";
  if (/^(30[0-5]|36|38|39)/.test(n)) return "diners";
  return "unknown";
}

function brandFromSchemes(schemes: string[], n: string): CardBrand {
  const s = schemes.map((x) => x.toUpperCase());
  if (s.includes("MADA") || isMadaPrefix(n)) return "mada";
  if (s.includes("VISA")) return "visa";
  if (s.some((x) => x.includes("MASTER"))) return "master";
  if (s.includes("MAESTRO")) return "maestro";
  if (s.some((x) => x.includes("AMERICAN") || x === "AMEX")) return "amex";
  if (s.includes("DISCOVER")) return "discover";
  if (s.some((x) => x.includes("UNION"))) return "unionpay";
  if (s.includes("JCB")) return "jcb";
  if (s.some((x) => x.includes("DINERS"))) return "diners";
  if (s.includes("UATP")) return "uatp";
  return "unknown";
}

export function isMadaPrefix(num: string): boolean {
  const n = digits(num);
  return MADA_SET.has(n.slice(0, 8)) || MADA_SET.has(n.slice(0, 6));
}

/** Full identification: 8 → 6 → 4 digit longest-prefix match. */
export function identifyCard(num: string): CardIdentity {
  const n = digits(num).slice(0, 8);

  const build = (rec: BinRecord, matchedLength: 6 | 8): CardIdentity => {
    const schemes = split(rec.schemes);
    const provisional = rec.ambiguous || rec.confidence === "low" || (matchedLength === 6 && rec.hasChildren8);
    return {
      bank: bankFromIssuer(rec.issuer),
      brand: brandFromSchemes(schemes, n),
      schemes,
      cardTypes: split(rec.cardTypes),
      matchedLength,
      confidence: provisional ? "provisional" : matchedLength === 8 || rec.confidence === "high" ? "high" : "medium",
      provisional,
      isMada: schemes.some((s) => s.toUpperCase() === "MADA") || isMadaPrefix(n),
      note:
        provisional
          ? "التصنيف مبدئي — قد تختلف الجهة أو نوع البطاقة"
          : matchedLength === 8
            ? "تطابق دقيق على 8 أرقام"
            : "تطابق على 6 أرقام",
    };
  };

  if (n.length >= 8 && PREFIX8[n.slice(0, 8)]) return build(PREFIX8[n.slice(0, 8)]!, 8);
  if (n.length >= 6 && BIN6[n.slice(0, 6)]) return build(BIN6[n.slice(0, 6)]!, 6);

  if (n.length >= 4) {
    const candidates = BIN4[n.slice(0, 4)] || [];
    if (candidates.length === 1) {
      return {
        // Four digits narrow the possibilities, but do not establish an issuer.
        bank: UNKNOWN_BANK,
        brand: brandFromSchemes([], n),
        schemes: [],
        cardTypes: [],
        matchedLength: 4,
        confidence: "candidate",
        provisional: true,
        isMada: isMadaPrefix(n),
        note: "مرشح مبدئي على 4 أرقام — أكمل 6 أرقام لتأكيد البنك",
      };
    }
    if (candidates.length > 1) {
      return {
        bank: UNKNOWN_BANK,
        brand: brandFromSchemes([], n),
        schemes: [],
        cardTypes: [],
        matchedLength: 4,
        confidence: "candidate",
        provisional: true,
        isMada: isMadaPrefix(n),
        note: `${candidates.length} جهات محتملة — أكمل 6 أرقام`,
      };
    }
  }

  return {
    bank: UNKNOWN_BANK,
    brand: "unknown",
    schemes: [],
    cardTypes: [],
    matchedLength: 0,
    confidence: "none",
    provisional: false,
    isMada: false,
    note: "لم يتم التعرف على الجهة المصدرة",
  };
}

/** Backwards-compatible helper used across the app. */
export function detectBank(num: string): BankInfo {
  return identifyCard(num).bank;
}

export const ALL_BANKS: BankInfo[] = Object.keys(BANK_STYLES).map(bankFromIssuer);
