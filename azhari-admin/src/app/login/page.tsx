"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";
import { Nav } from "@/components/Nav";

/**
 * One login form for everyone — students and the admin sign in exactly the
 * same way, with the same Supabase Auth. There's no separate "admin login"
 * surface to find or attack: which dashboard someone lands on is decided
 * after authentication by checking the `admins` table (see AuthProvider),
 * which only your one seeded account can ever be a member of.
 */
export default function LoginPage() {
  const { refresh } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (signInError || !data.session) {
      setError("البريد الإلكتروني أو كلمة المرور غير صحيحة");
      return;
    }

    await refresh();

    // Route based on real DB membership, not on anything the client claims.
    const { data: adminRow } = await supabase.from("admins").select("user_id").eq("user_id", data.session.user.id).maybeSingle();
    window.location.href = adminRow ? "/admin" : "/dashboard";
  }

  return (
    <main>
      <Nav />
      <div className="max-w-md mx-auto px-6 py-16">
        <h1 className="text-2xl font-bold text-green-deep mb-6 text-center">تسجيل الدخول</h1>
        {error && <div className="card bg-red-50 border-red-300 text-red-700 text-sm mb-5">{error}</div>}
        <form onSubmit={onSubmit} className="card space-y-4">
          <label className="block"><span className="label">البريد الإلكتروني</span>
            <input type="email" className="input" required value={email} onChange={(e) => setEmail(e.target.value)} /></label>
          <label className="block"><span className="label">كلمة المرور</span>
            <input type="password" className="input" required value={password} onChange={(e) => setPassword(e.target.value)} /></label>
          <button type="submit" disabled={loading} className="btn-primary w-full justify-center flex">
            {loading ? "جاري الدخول..." : "دخول"}
          </button>
        </form>
      </div>
    </main>
  );
}
