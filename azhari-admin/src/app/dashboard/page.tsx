"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";
import { StudentGuard } from "@/components/Guards";
import { Nav } from "@/components/Nav";
import type { Score, Settings } from "@/lib/types";

export default function DashboardPage() {
  return (
    <main className="page-fade">
      <Nav />
      <StudentGuard>
        <DashboardBody />
      </StudentGuard>
    </main>
  );
}

function DashboardBody() {
  const { student } = useAuth();
  const [score, setScore] = useState<Score | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loadingScore, setLoadingScore] = useState(true);

  useEffect(() => {
    if (!student) return;
    // Same query shape for every student — RLS decides whether a row comes
    // back at all (own row only, and only once the admin's publish toggle
    // is on). Hidden results or a mismatched id both just return zero rows.
    supabase.from("scores").select("*").eq("student_id", student.id).maybeSingle().then(({ data }) => {
      setScore(data as Score | null);
      setLoadingScore(false);
    });
    supabase.from("settings").select("*").eq("id", "singleton").maybeSingle().then(({ data }) => {
      setSettings(data as Settings);
    });
  }, [student]);

  if (!student) return null;

  return (
    <div className="max-w-3xl mx-auto px-6 py-10 space-y-6">
      <h1 className="font-display text-2xl font-bold text-ink">مرحبًا، {student.full_name}</h1>

      {/* بطاقة المتسابق */}
      <CompetitorCard name={student.full_name} regNumber={student.registration_number} level={student.memorization_level} />

      <div className="grid md:grid-cols-2 gap-6">
        {/* 1. بياناتي */}
        <section className="card">
          <h2 className="margin-rule font-bold text-ink mb-4">بياناتي</h2>
          <dl className="text-sm space-y-2.5">
            <Row label="الاسم" value={student.full_name} />
            <Row label="رقم الهاتف" value={student.phone} />
            <Row label="البريد الإلكتروني" value={student.email} />
            <Row label="المرحلة التعليمية" value={student.educational_stage} />
            <Row label="المعهد" value={student.institute} />
          </dl>
        </section>

        {/* 2. فرع المسابقة */}
        <section className="card">
          <h2 className="margin-rule font-bold text-ink mb-4">فرع المسابقة</h2>
          <div className="bg-teal-tint rounded-xl p-4 text-center">
            <p className="text-xs text-ink-faint mb-1">مستوى الحفظ المسجَّل به</p>
            <p className="text-lg font-bold text-teal-deep">{student.memorization_level}</p>
          </div>
          <p className="text-xs text-ink-faint mt-3 leading-relaxed">
            ترتيبك في النتيجة يُحسب بين المتسابقين في نفس هذا المستوى فقط.
          </p>
        </section>
      </div>

      {/* 3. موعد ومكان الاختبار */}
      <section className="card">
        <h2 className="margin-rule font-bold text-ink mb-4">موعد ومكان الاختبار</h2>
        {student.exam_date ? (
          <dl className="text-sm space-y-2.5">
            <Row label="التاريخ" value={student.exam_date} />
            <Row label="الوقت" value={student.exam_time ?? "—"} />
            <Row label="المكان" value={student.exam_place ?? "—"} />
          </dl>
        ) : (
          <div className="empty-state !py-4">
            <div className="icon">🕐</div>
            <p>سيظهر موعد الاختبار هنا بمجرد أن تُعلنه الإدارة.</p>
          </div>
        )}
      </section>

      {/* 4. الإشعارات */}
      <section className="card">
        <h2 className="margin-rule font-bold text-ink mb-4">الإشعارات</h2>
        {settings?.announcement ? (
          <div className="bg-brass-tint border border-brass/25 rounded-xl p-4 text-sm text-ink-soft leading-relaxed">
            {settings.announcement}
          </div>
        ) : (
          <div className="empty-state !py-4">
            <div className="icon">🔔</div>
            <p>لا توجد إشعارات جديدة حاليًا.</p>
          </div>
        )}
      </section>

      {/* 5. النتيجة */}
      <section className="card">
        <h2 className="margin-rule font-bold text-ink mb-4">النتيجة</h2>
        {loadingScore ? (
          <p className="text-ink-faint text-sm">جاري التحميل...</p>
        ) : score ? (
          <div className="grid grid-cols-3 gap-3">
            <ResultStat label="الدرجة" value={`${score.final}%`} />
            <ResultStat label="ترتيبك في مستواك" value={String(score.rank ?? "—")} />
            <ResultStat label="الحالة" value={score.status === "PASSED" ? "ناجح" : "غير ناجح"}
              tone={score.status === "PASSED" ? "success" : "danger"} />
          </div>
        ) : (
          <div className="empty-state !py-4">
            <div className="icon">📄</div>
            <p>لم يتم إعلان النتائج بعد. ستظهر نتيجتك هنا فور الإعلان عنها.</p>
          </div>
        )}
      </section>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-line pb-2.5 last:border-0 last:pb-0">
      <span className="text-ink-faint">{label}</span>
      <span className="font-semibold text-ink">{value}</span>
    </div>
  );
}

function ResultStat({ label, value, tone }: { label: string; value: string; tone?: "success" | "danger" }) {
  const toneClass = tone === "success" ? "text-success" : tone === "danger" ? "text-danger" : "text-ink";
  return (
    <div className="bg-paper rounded-xl p-3.5 text-center">
      <p className="text-xs text-ink-faint mb-1">{label}</p>
      <p className={`text-lg font-bold ${toneClass}`}>{value}</p>
    </div>
  );
}

/** 6. بطاقة المتسابق — a small identity-card treatment: name + registration
    number, styled distinctly from the ordinary content cards around it. */
function CompetitorCard({ name, regNumber, level }: { name: string; regNumber: string; level: string }) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-ink text-white p-6">
      <svg className="absolute -bottom-8 -left-8 w-40 h-40 opacity-[0.08] pointer-events-none" viewBox="0 0 100 100" fill="none">
        <path d="M50 5 L58 35 L88 35 L64 53 L72 85 L50 65 L28 85 L36 53 L12 35 L42 35 Z" stroke="#C9A468" strokeWidth="1" />
      </svg>
      <div className="relative flex items-center justify-between gap-4">
        <div>
          <p className="text-xs text-brass-light font-bold tracking-wide mb-1">بطاقة المتسابق</p>
          <p className="font-display text-xl font-bold">{name}</p>
          <p className="text-xs text-white/60 mt-0.5">{level}</p>
        </div>
        <div className="text-left">
          <p className="text-[11px] text-white/60 mb-0.5">رقم التسجيل</p>
          <p className="text-2xl font-bold tracking-widest text-brass-light" dir="ltr">{regNumber}</p>
        </div>
      </div>
    </div>
  );
}
