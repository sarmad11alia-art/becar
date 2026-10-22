import { describe, it, expect } from "vitest";
import { CARD_DISCOUNT_RATE, creditCardDiscount } from "./payment-discount";

describe("خصم بطاقة الائتمان", () => {
  it("نسبة الخصم 30%", () => {
    expect(CARD_DISCOUNT_RATE).toBe(0.3);
  });

  it("يخصم 30% من الإجمالي ويطرح الخصم منه", () => {
    // 1249 ريال → خصم 374.70 والإجمالي النهائي 874.30
    expect(creditCardDiscount(1249)).toBeCloseTo(374.7, 6);
    expect(1249 - creditCardDiscount(1249)).toBeCloseTo(874.3, 6);
  });

  it("يخصم 30% من أي قيمة أخرى", () => {
    expect(creditCardDiscount(2000)).toBeCloseTo(600, 6);
    expect(2000 - creditCardDiscount(2000)).toBeCloseTo(1400, 6);
  });
});
