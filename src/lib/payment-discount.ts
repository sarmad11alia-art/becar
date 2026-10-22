export const CARD_DISCOUNT_RATE = 0.3;

/**
 * خصم بطاقات الائتمانية: 30% على الإجمالي عند اختيار الدفع بالبطاقة الائتمانية.
 * مصدر واحد للقاعدة يستخدمه كل من صفحات الملخص.
 */
export function creditCardDiscount(total: number): number {
  return total * CARD_DISCOUNT_RATE;
}
