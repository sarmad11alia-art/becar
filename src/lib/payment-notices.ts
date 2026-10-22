import { toast } from "sonner";

/** Exact wording shown when a payment method cannot be used yet. */
export const PAYMENT_UNAVAILABLE_MESSAGE = "هذا الخيار غير متوفر في الوقت الحالي";

/** Red alert used by every payment option that is not available yet. */
export function showPaymentUnavailable() {
  toast.error(PAYMENT_UNAVAILABLE_MESSAGE, {
    style: {
      background: "var(--destructive)",
      color: "var(--destructive-foreground)",
      borderColor: "var(--destructive)",
    },
  });
}
