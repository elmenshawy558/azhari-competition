"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Nav } from "@/components/Nav";
import type { Settings } from "@/lib/types";

export default function HomePage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  useEffect(() => {
    supabase.from("settings").select("*").eq("id", "singleton").maybeSingle().then(({ data }) => {
      setSettings(data as Settings);
      setSettingsLoaded(true);
    });
  }, []);

  // Only show "closed" once we've actually loaded settings and it's
  // explicitly false — never while still loading.
  const isOpen = !settingsLoaded || settings?.registration_open !== false;

  return (
    <main className="page-fade">
      <Nav />

      <header className="relative overflow-hidden border-b border-line">
        {/* Quiet signature mark — a single thin-line eight-point star, not a
            repeated pattern. Barely-there, positioned off-center. */}
        <svg className="absolute -top-6 -left-10 w-56 h-56 opacity-[0.06] pointer-events-none" viewBox="0 0 100 100" fill="none">
          <path d="M50 5 L58 35 L88 35 L64 53 L72 85 L50 65 L28 85 L36 53 L12 35 L42 35 Z" stroke="#A9803F" strokeWidth="1" />
        </svg>

        <div className="max-w-3xl mx-auto px-6 py-24 text-center relative">
          <p className="text-sm font-bold text-teal tracking-wide mb-4">مسابقة قرآنية</p>
          <h1 className="font-display text-5xl font-bold text-ink mb-4 leading-tight">أزهري وأفتخر</h1>
          <p className="text-lg text-ink-soft mb-1">مسابقة حفظ القرآن الكريم</p>
          <p className="text-sm text-ink-faint mb-9">تنظيم: الشيخ أنس عبد المؤمن</p>
          {isOpen ? (
            <Link href="/register" className="btn-gold inline-block">سجّل الآن</Link>
          ) : (
            <span className="inline-block bg-white border border-line py-2.5 px-5 rounded-lg text-sm text-ink-soft">
              باب التسجيل مغلق حاليًا
            </span>
          )}
        </div>
      </header>

      {settings?.announcement && (
        <div className="max-w-3xl mx-auto px-6 -mt-6 relative z-10">
          <div className="card bg-brass-tint border-brass/30 text-sm text-ink-soft">{settings.announcement}</div>
        </div>
      )}

      <section className="max-w-3xl mx-auto px-6 py-16">
        <h2 className="margin-rule text-2xl font-bold text-ink mb-5">عن المسابقة</h2>
        <p className="text-ink-soft leading-8">
          {settings?.about_text ||
            "مسابقة أزهري وأفتخر لحفظ القرآن الكريم، مسابقة سنوية تهدف إلى تشجيع طلاب المعاهد الأزهرية على حفظ كتاب الله عز وجل وإتقان تلاوته وتجويده، وتكريم المتفوقين منهم. يشرف على المسابقة الشيخ أنس عبد المؤمن، ويشارك فيها الطلاب من مختلف المراحل التعليمية والمحافظات."}
        </p>
      </section>

      <section className="bg-teal-tint/50 border-y border-line py-16">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="margin-rule text-2xl font-bold text-ink mb-10">فضل القرآن الكريم</h2>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="card">
              <h3 className="font-bold text-ink mb-4 pb-3 border-b border-line">أحاديث صحيحة</h3>
              <ul className="space-y-5 text-sm text-ink-soft leading-relaxed">
                <li>
                  <p className="font-semibold text-ink mb-1">عن أبي أمامة الباهلي رضي الله عنه:</p>
                  <p>«اقرؤوا القرآن، فإنه يأتي يوم القيامة شفيعًا لأصحابه»</p>
                  <p className="text-xs text-ink-faint mt-1.5">(صحيح مسلم)</p>
                </li>
                <li>
                  <p className="font-semibold text-ink mb-1">عن أبي موسى الأشعري رضي الله عنه:</p>
                  <p>«مثل المؤمن الذي يقرأ القرآن، كمثل الأترجة: ريحها طيب وطعمها طيب»</p>
                  <p className="text-xs text-ink-faint mt-1.5">(صحيح البخاري)</p>
                </li>
                <li>
                  <p className="font-semibold text-ink mb-1">عن عائشة رضي الله عنها:</p>
                  <p>«الماهر بالقرآن مع السفرة الكرام البررة، والذي يقرأ القرآن ويتتعتع فيه وهو عليه شاق له أجران»</p>
                  <p className="text-xs text-ink-faint mt-1.5">(صحيح البخاري)</p>
                </li>
              </ul>
            </div>

            <div className="card">
              <h3 className="font-bold text-ink mb-4 pb-3 border-b border-line">أقوال السلف الصالح</h3>
              <ul className="space-y-5 text-sm text-ink-soft leading-relaxed">
                <li>
                  <p className="font-semibold text-ink mb-1">الإمام الشافعي:</p>
                  <p>«لو لم ينزل من القرآن إلا سورة الفاتحة لكفت»</p>
                </li>
                <li>
                  <p className="font-semibold text-ink mb-1">ابن عباس رضي الله عنهما:</p>
                  <p>«القرآن الكريم يحتوي على شفاء لكل داء في القلب والجسد»</p>
                </li>
                <li>
                  <p className="font-semibold text-ink mb-1">عمر بن الخطاب رضي الله عنه:</p>
                  <p>«تعلموا القرآن، فإنه أفضل العلم»</p>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
