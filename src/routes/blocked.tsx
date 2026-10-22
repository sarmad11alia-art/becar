import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/blocked")({
  head: () => ({ meta: [{ title: "غير متاح" }] }),
  component: () => (
    <div dir="rtl" className="flex min-h-screen items-center justify-center bg-slate-50 p-6 text-center">
      <div>
        <h1 className="mb-2 text-2xl font-bold text-red-600">تم رفض الوصول</h1>
        <p className="text-slate-600">لا يمكنك الوصول إلى هذا الموقع.</p>
      </div>
    </div>
  ),
});
