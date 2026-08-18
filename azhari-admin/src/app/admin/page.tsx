"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Student, Score } from "@/lib/types";

interface Stats {
  total: number; approved: number; pending: number; rejected: number;
  winners: { name: string; regNumber: string; final: number; level: string; rank: number }[];
  byStage: Record<string, number>;
}

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    (async () => {
      const { data: students } = await supabase.from("students").select("*");
      const { data: scores } = await supabase.from("scores").select("*").order("rank", { ascending: true });

      const list = (students ?? []) as Student[];
      const byStage: Record<string, number> = {};
      list.forEach((s) => { byStage[s.educational_stage] = (byStage[s.educational_stage] ?? 0) + 1; });

      const scoreList = (scores ?? []) as Score[];
      const winners = scoreList
        .filter((s) => s.rank !== null && s.rank <= 3 && s.status === "PASSED")
        .map((s) => {
          const student = list.find((st) => st.id === s.student_id);
          return {
            name: student?.full_name ?? "—",
            regNumber: student?.registration_number ?? "—",
            final: s.final,
            level: student?.memorization_level ?? "—",
            rank: s.rank!,
          };
        })
        // group visually by level, best rank first within each
        .sort((a, b) => a.level.localeCompare(b.level) || a.rank - b.rank);

      setStats({
        total: list.length,
        approved: list.filter((s) => s.approval_status === "APPROVED").length,
        pending: list.filter((s) => s.approval_status === "PENDING").length,
        rejected: list.filter((s) => s.approval_status === "REJECTED").length,
        winners,
        byStage,
      });
    })();
  }, []);

  if (!stats) return <div className="p-8 text-ink-faint">جاري التحميل...</div>;

  const cards = [
    ["إجمالي المتسابقين", stats.total, "bg-ink"],
    ["مقبول", stats.approved, "bg-success"],
    ["قيد المراجعة", stats.pending, "bg-brass"],
    ["مرفوض", stats.rejected, "bg-danger"],
  ] as const;

  return (
    <div className="p-6 md:p-8 space-y-6">
      <h1 className="font-display text-2xl font-bold text-ink">لوحة تحكم الإدارة</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map(([label, value, color]) => (
          <div key={label} className="card !p-4 flex items-center gap-3">
            <span className={`w-2.5 h-2.5 rounded-full ${color} shrink-0`} />
            <div>
              <p className="text-xs text-ink-faint">{label}</p>
              <p className="text-2xl font-bold text-ink mt-0.5">{value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        <section className="card">
          <h2 className="margin-rule font-bold text-ink mb-4">الفائزون (أعلى 3 في كل مستوى)</h2>
          {stats.winners.length === 0 ? (
            <div className="empty-state !py-4"><div className="icon">🏆</div><p>لا توجد نتائج بعد</p></div>
          ) : (
            <ol className="space-y-2.5 text-sm">
              {stats.winners.map((w) => (
                <li key={w.regNumber} className="flex justify-between border-b border-line pb-2.5 last:border-0">
                  <span className="text-ink">{w.rank}. {w.name} <span className="text-ink-faint">({w.level})</span></span>
                  <b className="text-ink">{w.final}</b>
                </li>
              ))}
            </ol>
          )}
        </section>

        <section className="card">
          <h2 className="margin-rule font-bold text-ink mb-4">حسب المرحلة التعليمية</h2>
          {Object.keys(stats.byStage).length === 0 ? (
            <div className="empty-state !py-4"><div className="icon">👥</div><p>لا يوجد متسابقون بعد</p></div>
          ) : (
            <ul className="text-sm space-y-2.5">
              {Object.entries(stats.byStage).map(([g, n]) => (
                <li key={g} className="flex justify-between border-b border-line pb-2.5 last:border-0"><span className="text-ink">{g}</span><b className="text-ink">{n}</b></li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
