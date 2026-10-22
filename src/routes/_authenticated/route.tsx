import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: AuthLayout,
});

function AuthLayout() {
  return (
    <>
      <Outlet />
      <Toaster
        position="bottom-right"
        dir="rtl"
        richColors
        closeButton
        duration={5000}
        gap={10}
        offset={20}
        mobileOffset={{ bottom: 16, right: 12, left: 12 }}
        style={{ fontFamily: "var(--font-sans, inherit)" }}
        toastOptions={{
          classNames: {
            toast:
              "!rounded-2xl !border !border-slate-200/80 !bg-white/95 !backdrop-blur-md !shadow-[0_12px_32px_-8px_rgba(15,23,42,0.18),0_2px_8px_-2px_rgba(15,23,42,0.08)] !px-4 !py-3.5 !text-right !font-medium",
            title: "!text-sm !font-bold !text-slate-900 !text-right",
            description: "!text-[13px] !leading-6 !text-slate-500 !text-right",
            icon: "!mt-0.5",
            closeButton:
              "!left-1 !top-1 !h-6 !w-6 !rounded-lg !border-0 !bg-slate-100 !text-slate-400 hover:!bg-slate-200 hover:!text-slate-600",
            actionButton: "!rounded-lg !bg-slate-900 !text-white",
            cancelButton: "!rounded-lg !bg-slate-100 !text-slate-600",
          },
        }}
      />
    </>
  );
}
