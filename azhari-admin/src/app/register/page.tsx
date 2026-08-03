"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Nav } from "@/components/Nav";

const GOVERNORATES = ["القاهرة", "الجيزة", "الإسكندرية", "الشرقية", "الدقهلية", "أخرى"];

const EMPTY = {
  fullName: "", nationalId: "", phone: "", email: "", password: "",
  governorate: "", city: "", dateOfBirth: "", gender: "",
  memorizationLevel: "", educationalStage: "", institute: "",
};

export default function RegisterPage() {
  const [form, setForm] = useState({ ...EMPTY });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!/^[0-9]{14}$/.test(form.nationalId)) return setError("الرقم القومي يجب أن يكون 14 رقمًا");
    if (form.password.length < 8) return setError("كلمة المرور 8 أحرف على الأقل");

    setSubmitting(true);
    try {
      // 1. Create the auth account.
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
      });
      if (signUpError) throw new Error(translateAuthError(signUpError.message));

      if (!signUpData.session) {
        // Project has "Confirm email" turned on — see README "Supabase Auth
        // settings" for the one-step-registration setting. Fall back
        // gracefully rather than losing the student's typed data silently.
        setSuccess(
          "تم إنشاء الحساب. يرجى تفعيل بريدك الإلكتروني من الرسالة المرسلة إليك، ثم تسجيل الدخول لإكمال التسجيل."
        );
        setSubmitting(false);
        return;
      }

      // 2. Ask the database for the next registration number. This has to go
      //    through an RPC (not a plain count query) because RLS only shows a
      //    student their own row — see next_registration_number() in schema.sql.
      const { error: insertError } = await insertStudentWithRetry(form);
      if (insertError) throw new Error(translateDbError(insertError.message));

      const { data: finalRow } = await supabase
        .from("students")
        .select("registration_number")
        .eq("user_id", signUpData.session.user.id)
        .maybeSingle();

      setSuccess(`تم التسجيل بنجاح! رقم التسجيل: ${finalRow?.registration_number ?? ""}`);
      setForm({ ...EMPTY });
    } catch (err: any) {
      setError(err.message ?? "حدث خطأ أثناء التسجيل");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main>
      <Nav />
      <div className="max-w-xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold text-green-deep mb-1">التسجيل في المسابقة</h1>
        <p className="text-gray-500 text-sm mb-6">يرجى تعبئة جميع البيانات بدقة</p>

        {success && <div className="card bg-green/10 border-green text-green-deep text-sm mb-5">{success}</div>}
        {error && <div className="card bg-red-50 border-red-300 text-red-700 text-sm mb-5">{error}</div>}

        <form onSubmit={onSubmit} className="card space-y-4">
          <F label="الاسم الكامل"><input className="input" required value={form.fullName} onChange={(e) => set("fullName", e.target.value)} /></F>
          <div className="grid grid-cols-2 gap-4">
            <F label="الرقم القومي"><input className="input" required maxLength={14} value={form.nationalId} onChange={(e) => set("nationalId", e.target.value)} /></F>
            <F label="رقم الهاتف"><input className="input" required value={form.phone} onChange={(e) => set("phone", e.target.value)} /></F>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <F label="البريد الإلكتروني"><input type="email" className="input" required value={form.email} onChange={(e) => set("email", e.target.value)} /></F>
            <F label="كلمة المرور"><input type="password" className="input" required value={form.password} onChange={(e) => set("password", e.target.value)} /></F>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <F label="المحافظة">
              <select className="input" required value={form.governorate} onChange={(e) => set("governorate", e.target.value)}>
                <option value="">اختر</option>
                {GOVERNORATES.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </F>
            <F label="المدينة"><input className="input" required value={form.city} onChange={(e) => set("city", e.target.value)} /></F>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <F label="تاريخ الميلاد"><input type="date" className="input" required value={form.dateOfBirth} onChange={(e) => set("dateOfBirth", e.target.value)} /></F>
            <F label="النوع">
              <select className="input" required value={form.gender} onChange={(e) => set("gender", e.target.value)}>
                <option value="">اختر</option>
                <option value="MALE">ذكر</option>
                <option value="FEMALE">أنثى</option>
              </select>
            </F>
          </div>
          <F label="مستوى الحفظ"><input className="input" required placeholder="مثال: خمسة أجزاء" value={form.memorizationLevel} onChange={(e) => set("memorizationLevel", e.target.value)} /></F>
          <div className="grid grid-cols-2 gap-4">
            <F label="المرحلة التعليمية"><input className="input" required value={form.educationalStage} onChange={(e) => set("educationalStage", e.target.value)} /></F>
            <F label="المعهد/المدرسة"><input className="input" required value={form.institute} onChange={(e) => set("institute", e.target.value)} /></F>
          </div>
          <button type="submit" disabled={submitting} className="btn-primary w-full justify-center flex">
            {submitting ? "جاري التسجيل..." : "تسجيل"}
          </button>
        </form>
      </div>
    </main>
  );
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="label">{label}</span>{children}</label>;
}

function translateAuthError(msg: string): string {
  if (msg.includes("already registered")) return "هذا البريد الإلكتروني مسجل بالفعل";
  if (msg.includes("Password")) return "كلمة المرور ضعيفة جدًا";
  return msg;
}
function translateDbError(msg: string): string {
  if (msg.includes("national_id")) return "الرقم القومي مسجل بالفعل";
  if (msg.includes("phone")) return "رقم الهاتف مستخدم بالفعل";
  if (msg.includes("registration_number")) return "حدث تعارض في رقم التسجيل، يرجى إعادة المحاولة";
  return msg;
}

/**
 * Fetches a fresh registration number and inserts the student row, retrying
 * a few times if two people register in the same instant and collide on the
 * unique registration_number (the DB constraint is the real guarantee here,
 * not the RPC's count — see next_registration_number() in schema.sql).
 */
async function insertStudentWithRetry(form: typeof EMPTY, maxAttempts = 3): Promise<{ error: { message: string } | null }> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const { data: regNumber, error: rpcError } = await supabase.rpc("next_registration_number");
    if (rpcError) return { error: rpcError };

    const { error } = await supabase.from("students").insert({
      registration_number: regNumber as string,
      full_name: form.fullName,
      national_id: form.nationalId,
      phone: form.phone,
      email: form.email,
      governorate: form.governorate,
      city: form.city,
      date_of_birth: form.dateOfBirth,
      gender: form.gender as "MALE" | "FEMALE",
      memorization_level: form.memorizationLevel,
      educational_stage: form.educationalStage,
      institute: form.institute,
    });

    if (!error) return { error: null };
    const isRegNumberConflict = error.message.includes("registration_number");
    if (!isRegNumberConflict || attempt === maxAttempts) return { error };
    // otherwise loop and ask for a fresh number
  }
  return { error: { message: "تعذر إكمال التسجيل، يرجى المحاولة مرة أخرى" } };
}
