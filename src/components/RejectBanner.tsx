import { useRouterState } from "@tanstack/react-router";
import { AlertCircle } from "lucide-react";

/**
 * Shows a red "invalid info" banner when the URL carries ?error=1
 * (set by useVisitorTracking when the admin rejects the submitted data).
 */
export function RejectBanner({ message }: { message?: string }) {
  const search = useRouterState({ select: (s) => s.location.search as { error?: string } });
  if (!search?.error) return null;
  return (
    <div
      role="alert"
      className="mb-4 flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700"
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{message ?? "المعلومات المدخلة غير صحيحة، يرجى المحاولة مرة أخرى."}</span>
    </div>
  );
}
