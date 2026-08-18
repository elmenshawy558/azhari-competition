"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

export function Nav() {
  const { session, isAdmin, signOut } = useAuth();
  const pathname = usePathname();

  const linkClass = (href: string) =>
    `px-3 py-1.5 text-sm font-semibold transition-colors border-b-2 ${
      pathname === href ? "text-ink border-brass" : "text-ink-faint border-transparent hover:text-ink"
    }`;

  return (
    <nav className="bg-paper/95 backdrop-blur sticky top-0 z-30 border-b border-line">
      <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="font-display text-xl font-bold text-ink">أزهري وأفتخر</Link>
        <div className="flex items-center gap-1">
          <Link href="/" className={linkClass("/")}>الرئيسية</Link>
          {!session && <Link href="/register" className={linkClass("/register")}>التسجيل</Link>}
          {!session && <Link href="/login" className={linkClass("/login")}>تسجيل الدخول</Link>}
          {session && !isAdmin && <Link href="/dashboard" className={linkClass("/dashboard")}>حسابي</Link>}
          {session && isAdmin && (
            <Link href="/admin" className="mx-1 px-3.5 py-1.5 rounded-full bg-ink text-paper text-sm font-bold">
              لوحة الإدارة
            </Link>
          )}
          {session && (
            <button onClick={signOut} className="px-3 py-1.5 text-sm font-semibold text-ink-faint hover:text-danger transition-colors">
              خروج
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
