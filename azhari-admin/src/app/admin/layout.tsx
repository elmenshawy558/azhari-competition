"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AdminGuard } from "@/components/Guards";
import { Nav } from "@/components/Nav";

const TABS = [
  ["/admin", "الرئيسية"],
  ["/admin/students", "المتسابقون"],
  ["/admin/scores", "النتائج"],
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <main className="page-fade">
      <Nav />
      <AdminGuard>
        <div className="bg-white border-b border-line">
          <div className="max-w-5xl mx-auto px-6 flex gap-1 overflow-x-auto">
            {TABS.map(([href, label]) => (
              <Link key={href} href={href}
                className={`py-3.5 px-4 text-sm whitespace-nowrap border-b-2 font-semibold transition-colors ${
                  pathname === href ? "border-brass text-ink" : "border-transparent text-ink-faint hover:text-ink"
                }`}>
                {label}
              </Link>
            ))}
          </div>
        </div>
        <div className="max-w-5xl mx-auto">{children}</div>
      </AdminGuard>
    </main>
  );
}
