import { describe, it, expect } from "vitest";
import { calcOfferPricing, BCARE_DISCOUNT, type PricingOffer } from "./offers.functions";

const comp: PricingOffer = {
  type: "شامل",
  price: 0,
  rate: 0.0275,
  min_price: 850,
  features: [
    { label: "مساعدة على الطريق", price: 0, included: true },
    { label: "سيارة بديلة", price: 200, included: false },
    { label: "حوادث شخصية", price: 100, included: false },
  ],
};

const tpl: PricingOffer = {
  type: "ضد الغير",
  price: 375,
  rate: 0,
  min_price: 0,
  features: [],
};

describe("calcOfferPricing - شامل", () => {
  it("يطبق النسبة عندما تتجاوز قيمة المركبة الحد الأدنى", () => {
    const r = calcOfferPricing(comp, 100_000);
    // base = max(850, 100000*0.0275=2750) = 2750
    expect(r.original).toBe(2750);
    expect(r.discounted).toBeCloseTo(2750 * BCARE_DISCOUNT, 6);
    expect(r.total).toBeCloseTo(2750 * BCARE_DISCOUNT, 6);
  });

  it("يطبّق الحد الأدنى عندما تكون قيمة المركبة منخفضة", () => {
    const r = calcOfferPricing(comp, 10_000); // 275 < 850
    expect(r.original).toBe(850);
    expect(r.discounted).toBeCloseTo(850 * BCARE_DISCOUNT, 6);
  });

  it("يستخدم الحد الأدنى عندما تكون قيمة المركبة صفرًا أو غير صالحة", () => {
    expect(calcOfferPricing(comp, 0).original).toBe(850);
    expect(calcOfferPricing(comp, -5).original).toBe(850);
    expect(calcOfferPricing(comp, Number.NaN).original).toBe(850);
  });

  it("عند الحد الفاصل تمامًا يختار القيمة الأعلى", () => {
    // carValue*rate == min_price => 850/0.0275
    const boundary = 850 / 0.0275;
    const r = calcOfferPricing(comp, boundary);
    expect(r.original).toBeCloseTo(850, 6);
    const r2 = calcOfferPricing(comp, boundary + 1);
    expect(r2.original).toBeGreaterThan(850);
  });

  it("يقبل الإضافات المصرّح بها فقط ويجمعها بعد الخصم", () => {
    const r = calcOfferPricing(comp, 100_000, ["سيارة بديلة", "غير موجود", "مساعدة على الطريق"]);
    // extras: سيارة بديلة = 200 (included=false), مساعدة= included=true فيُتجاهل
    expect(r.extras).toEqual([{ label: "سيارة بديلة", price: 200 }]);
    expect(r.total).toBeCloseTo(2750 * BCARE_DISCOUNT + 200, 6);
  });
});

describe("calcOfferPricing - ضد الغير", () => {
  it("يستخدم السعر الثابت فقط إذا لم تُحدد نسبة لهذا العرض", () => {
    expect(calcOfferPricing(tpl, 0).original).toBe(375);
    expect(calcOfferPricing(tpl, 500_000).original).toBe(375);
    expect(calcOfferPricing(tpl, 500_000).discounted).toBeCloseTo(375 * BCARE_DISCOUNT, 6);
  });

  it("يحسب العرض بنسبة من قيمة المركبة مع حد أدنى وخصم بي كير", () => {
    const offer = { ...tpl, rate: 0.014, min_price: 380 };
    expect(calcOfferPricing(offer, 0).original).toBe(380);
    expect(calcOfferPricing(offer, 10_000).original).toBe(380);
    expect(calcOfferPricing(offer, 150_000).original).toBe(2100);
    expect(calcOfferPricing(offer, 150_000).total).toBeCloseTo(2100 * BCARE_DISCOUNT, 6);
  });
});
