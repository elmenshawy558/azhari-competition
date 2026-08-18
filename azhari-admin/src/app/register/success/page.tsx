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
    <div className="max-w-md mx-auto px-6 py-20 text-center">
      <div className="w-14 h-14 rounded-full bg-success-tint text-success flex items-center justify-center mx-auto mb-6 text-2xl">
        ✓
      </div>

      <h1 className="font-display text-3xl font-bold text-ink mb-8 leading-snug">
        تم تسجيلك بنجاح{name ? <> يا {name}</> : ""} 🎉
      </h1>

      <div className="card bg-ink text-white">
        <p className="text-sm opacity-70 mb-1">رقم التسجيل الخاص بك</p>
        <p className="text-4xl font-bold tracking-widest text-brass-light" dir="ltr">{code}</p>
      </div>

      <p className="text-sm text-ink-faint mt-5 leading-relaxed">
        احتفظ بهذا الرقم في مكان آمن — ستحتاجه للرجوع إلى بياناتك لاحقًا.
      </p>

      <Link href="/dashboard" className="btn-primary inline-block mt-7">الذهاب إلى حسابي</Link>
    </div>
  );
}
