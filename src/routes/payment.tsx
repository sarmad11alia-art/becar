import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/payment")({
  head: () => ({
    meta: [
      { title: "الدفع | بي كير" },
      { name: "description", content: "إتمام عملية الدفع بأمان" },
    ],
  }),
  component: PaymentLayout,
});

function PaymentLayout() {
  return <Outlet />;
}
