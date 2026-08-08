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
        <div className="bg-green-deep">
          <div className="max-w-5xl mx-auto px-6 flex gap-1 overflow-x-auto">
            {TABS.map(([href, label]) => (
              <Link key={href} href={href}
                className={`py-3 px-4 text-sm whitespace-nowrap border-b-2 ${
                  pathname === href ? "border-gold text-gold-light font-bold" : "border-transparent text-white/80 hover:text-white"
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
