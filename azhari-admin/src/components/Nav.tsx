"use client";

import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";

export function Nav() {
  const { session, isAdmin, signOut } = useAuth();

  return (
    <nav className="bg-green-deep text-white sticky top-0 z-30">
      <div className="max-w-5xl mx-auto px-6 py-3.5 flex items-center justify-between">
        <Link href="/" className="font-bold text-gold-light">أزهري وأفتخر</Link>
        <div className="flex items-center gap-1 text-sm">
          <Link href="/" className="px-3 py-1.5 rounded-full hover:bg-white/10">الرئيسية</Link>
          {!session && <Link href="/register" className="px-3 py-1.5 rounded-full hover:bg-white/10">التسجيل</Link>}
          {!session && <Link href="/login" className="px-3 py-1.5 rounded-full hover:bg-white/10">تسجيل الدخول</Link>}
          {session && !isAdmin && <Link href="/dashboard" className="px-3 py-1.5 rounded-full hover:bg-white/10">لوحتي</Link>}
          {session && isAdmin && <Link href="/admin" className="px-3 py-1.5 rounded-full bg-gold text-green-deep font-bold">لوحة الإدارة</Link>}
          {session && (
            <button onClick={signOut} className="px-3 py-1.5 rounded-full hover:bg-white/10">خروج</button>
          )}
        </div>
      </div>
    </nav>
  );
}
