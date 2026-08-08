"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Nav } from "@/components/Nav";

export default function RegisterSuccessPage() {
  return (
    <main className="page-fade">
      <Nav />
      <Suspense fallback={null}>
        <SuccessBody />
      </Suspense>
    </main>
  );
}

function SuccessBody() {
  const params = useSearchParams();
  const code = params.get("code") ?? "";
  const name = params.get("name") ?? "";

  return (
    <div className="max-w-md mx-auto px-6 py-16 text-center">
      <div className="w-16 h-16 rounded-full bg-green/10 text-green-deep flex items-center justify-center mx-auto mb-5 text-3xl">
        ✓
      </div>
      <h1 className="text-2xl font-bold text-green-deep mb-2">تم التسجيل بنجاح!</h1>
      {name && <p className="text-gray-500 mb-6">أهلًا بك، {name}</p>}

      <div className="card bg-green-deep text-white">
        <p className="text-sm opacity-80 mb-1">رقم التسجيل الخاص بك</p>
        <p className="text-4xl font-bold tracking-widest text-gold-light" dir="ltr">{code}</p>
      </div>

      <p className="text-sm text-gray-500 mt-5 leading-relaxed">
        احتفظ بهذا الرقم — ستحتاجه إن أردت متابعة حالة التسجيل. تسجيل الدخول يتم بالبريد الإلكتروني وكلمة المرور اللذين أدخلتهما.
      </p>

      <Link href="/dashboard" className="btn-primary inline-block mt-6">الذهاب إلى لوحتي</Link>
    </div>
  );
}
