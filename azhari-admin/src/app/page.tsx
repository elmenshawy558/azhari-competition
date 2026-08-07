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
        <p className="text-gray-600 leading-8">
          {settings?.about_text ||
            "مسابقة أزهري وأفتخر لحفظ القرآن الكريم، مسابقة سنوية تهدف إلى تشجيع طلاب المعاهد الأزهرية على حفظ كتاب الله عز وجل وإتقان تلاوته وتجويده، وتكريم المتفوقين منهم. يشرف على المسابقة الشيخ أنس عبد المؤمن، ويشارك فيها الطلاب من مختلف المراحل التعليمية والمحافظات."}
        </p>
      </section>

      <section className="bg-green-deep/5 border-t border-b border-gold/20 py-14">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-green-deep mb-10 text-center">فضل القرآن الكريم</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            {/* Authentic Hadith */}
            <div className="card bg-white">
              <h3 className="font-bold text-green-deep mb-3 border-b border-gold pb-2">أحاديث صحيحة</h3>
              <ul className="space-y-4 text-sm text-gray-700 leading-relaxed">
                <li className="border-r-4 border-gold pr-3">
                  <p className="font-semibold text-green-deep mb-1">عن عثمان رضي الله عنه:</p>
                  <p>«الله عز وجل ما من أحد أفضل من آخر إلا بما في صدره من القرآن»</p>
                  <p className="text-xs text-gray-500 mt-1">(رواه الدارمي)</p>
                </li>
                <li className="border-r-4 border-gold pr-3">
                  <p className="font-semibold text-green-deep mb-1">عن أبي موسى الأشعري رضي الله عنه:</p>
                  <p>«مثل المؤمن الذي يقرأ القرآن، كمثل الأترجة: ريحها طيب وطعمها طيب»</p>
                  <p className="text-xs text-gray-500 mt-1">(صحيح البخاري)</p>
                </li>
                <li className="border-r-4 border-gold pr-3">
                  <p className="font-semibold text-green-deep mb-1">عن عائشة رضي الله عنها:</p>
                  <p>«الماهر بالقرآن مع السفرة الكرام البررة، والذي يقرأ القرآن ويتتعتع فيه وهو عليه شاق له أجران»</p>
                  <p className="text-xs text-gray-500 mt-1">(صحيح البخاري)</p>
                </li>
              </ul>
            </div>

            {/* Salaf Sayings */}
            <div className="card bg-white">
              <h3 className="font-bold text-green-deep mb-3 border-b border-gold pb-2">أقوال السلف الصالح</h3>
              <ul className="space-y-4 text-sm text-gray-700 leading-relaxed">
                <li className="border-r-4 border-gold pr-3">
                  <p className="font-semibold text-green-deep mb-1">الإمام الشافعي:</p>
                  <p>«لو لم ينزل من القرآن إلا سورة الفاتحة لكفت»</p>
                </li>
                <li className="border-r-4 border-gold pr-3">
                  <p className="font-semibold text-green-deep mb-1">ابن عباس رضي الله عنهما:</p>
                  <p>«القرآن الكريم يحتوي على شفاء لكل داء في القلب والجسد»</p>
                </li>
                <li className="border-r-4 border-gold pr-3">
                  <p className="font-semibold text-green-deep mb-1">عمر بن الخطاب رضي الله عنه:</p>
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
