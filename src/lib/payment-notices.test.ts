import { describe, expect, it } from "vitest";
import { PAYMENT_UNAVAILABLE_MESSAGE } from "./payment-notices";

describe("payment unavailable notice", () => {
  it("shows the exact Arabic wording requested for unavailable options", () => {
    expect(PAYMENT_UNAVAILABLE_MESSAGE).toBe("هذا الخيار غير متوفر في الوقت الحالي");
  });
});
