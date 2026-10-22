import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "تسجيل الدخول | بي كير" },
      { name: "description", content: "تسجيل الدخول إلى لوحة تحكم بي كير" },
       { property: "og:title", content: "تسجيل الدخول | بي كير" },
       { property: "og:description", content: "تسجيل الدخول إلى لوحة تحكم بي كير" },
       { property: "og:type", content: "website" },
       { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const ADMIN_EMAIL = "majed@bcare.sa";
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: ADMIN_EMAIL, password });
    setLoading(false);
    if (error) {
      setError("كلمة المرور غير صحيحة");
      return;
    }
    navigate({ to: "/dashboard", replace: true });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bcare-surface px-4" dir="rtl">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-sm">
        <h1 className="mb-2 text-center text-2xl font-bold text-bcare-blue">تسجيل الدخول</h1>
        <p className="mb-6 text-center text-sm text-bcare-muted">لوحة تحكم بي كير</p>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="كلمة المرور"
            className="h-14 w-full rounded-xl border border-bcare-border px-4 outline-none focus:border-bcare-blue"
          />
          {error && <p className="text-center text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="h-14 w-full rounded-xl bg-bcare-blue font-bold text-white disabled:opacity-60"
          >
            {loading ? "جاري الدخول..." : "دخول"}
          </button>
        </form>
        <Link to="/" className="mt-4 block text-center text-sm text-bcare-blue">
          العودة للرئيسية
        </Link>
      </div>
    </div>
  );
}
