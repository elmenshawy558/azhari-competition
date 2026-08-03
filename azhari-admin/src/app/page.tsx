"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Nav } from "@/components/Nav";
import type { Settings } from "@/lib/types";

export default function HomePage() {
  const [settings, setSettings] = useState<Settings | null>(null);

  useEffect(() => {
    supabase.from("settings").select("*").eq("id", "singleton").maybeSingle().then(({ data }) => {
      setSettings(data as Settings);
    });
  }, []);

  return (
    <main>
      <Nav />
      <header className="bg-green-deep text-white text-center py-16 px-6">
        <h1 className="text-4xl font-bold text-gold-light mb-2">أزهري وأفتخر</h1>
        <p className="text-lg mb-1">مسابقة حفظ القرآن الكريم</p>
        <p className="text-sm opacity-70 mb-8">تنظيم: الشيخ أنس عبد المؤمن</p>
        {settings?.registration_open ? (
          <Link href="/register" className="btn-gold inline-block">سجّل الآن</Link>
        ) : (
          <span className="inline-block bg-white/10 py-2.5 px-5 rounded-lg text-sm">باب التسجيل مغلق حاليًا</span>
        )}
      </header>

      {settings?.announcement && (
        <div className="max-w-3xl mx-auto px-6 -mt-6 relative z-10">
          <div className="card bg-gold/10 border-gold text-sm">{settings.announcement}</div>
        </div>
      )}

      <section className="max-w-3xl mx-auto px-6 py-14">
        <h2 className="text-2xl font-bold text-green-deep mb-4">عن المسابقة</h2>
        <p className="text-gray-600 leading-8">{settings?.about_text || "..."}</p>
      </section>
    </main>
  );
}
