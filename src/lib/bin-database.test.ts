import { describe, expect, it } from "vitest";
import { BIN6, PREFIX8 } from "./saudi-bins.generated";
import { detectBrand, identifyCard } from "./bin-database";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { BankCardPreview } from "../components/BankCardPreview";

describe("Saudi card identification", () => {
  it("identifies an eight-digit mada prefix and its issuer", () => {
    const prefix = Object.keys(PREFIX8).find((key) => PREFIX8[key]?.schemes.includes("MADA"));
    expect(prefix).toBeDefined();
    const result = identifyCard(`${prefix}00000000`);
    expect(result.matchedLength).toBe(8);
    expect(result.brand).toBe("mada");
    expect(result.bank.id).toBe(PREFIX8[prefix ?? ""]?.issuer);
  });

  it("does not claim an issuer based on four digits alone", () => {
    const prefix = Object.keys(BIN6)[0]?.slice(0, 4);
    const result = identifyCard(prefix ?? "");
    expect(result.bank.id).toBe("generic");
    expect(result.provisional).toBe(true);
  });

  it("preserves distinct Saudi card networks", () => {
    for (const [scheme, expected] of [["UATP", "uatp"], ["MAESTRO", "maestro"], ["DINERS CLUB INTERNATIONAL", "diners"]] as const) {
      const prefix = Object.keys(BIN6).find((key) => BIN6[key]?.schemes === scheme);
      expect(prefix).toBeDefined();
      expect(identifyCard(`${prefix}0000000000`).brand).toBe(expected);
      expect(detectBrand(`${prefix}0000000000`)).toBe(expected);
    }
  });

  it("marks low confidence records as provisional", () => {
    const prefix = Object.keys(BIN6).find((key) => BIN6[key]?.confidence === "low" && !BIN6[key]?.hasChildren8);
    expect(prefix).toBeDefined();
    expect(identifyCard(`${prefix}0000000000`).provisional).toBe(true);
  });

  it("shows issuer artwork only for a reliable match and keeps the number masked", () => {
    const reliableNumber = "4054540000000000";
    const reliable = identifyCard(reliableNumber);
    const artwork = renderToStaticMarkup(createElement(BankCardPreview, {
      bank: reliable.bank, brand: reliable.brand, number: reliableNumber, showDataOverlay: true,
    }));
    expect(artwork).toContain(`<img src="${reliable.bank.imageUrl}"`);
    expect(artwork).not.toContain(reliableNumber);

    const uncertainNumber = "3600860000000000";
    const uncertain = identifyCard(uncertainNumber);
    const fallback = renderToStaticMarkup(createElement(BankCardPreview, {
      bank: uncertain.bank, brand: uncertain.brand, number: uncertainNumber, showDataOverlay: true,
    }));
    expect(uncertain.provisional).toBe(true);
    expect(fallback).not.toContain("<img");
    expect(fallback).toContain("بطاقة بنكية");
  });
});