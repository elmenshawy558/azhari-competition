"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Student, Score } from "@/lib/types";

interface Stats {
  total: number; approved: number; pending: number; rejected: number;
  winners: { name: string; regNumber: string; final: number }[];
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
          return { name: student?.full_name ?? "—", regNumber: student?.registration_number ?? "—", final: s.final };
        });

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

  if (!stats) return <div className="p-8 text-gray-400">جاري التحميل...</div>;

  const cards = [
    ["إجمالي المتسابقين", stats.total, "bg-green-deep"],
    ["مقبول", stats.approved, "bg-green"],
    ["قيد المراجعة", stats.pending, "bg-gold"],
    ["مرفوض", stats.rejected, "bg-red-600"],
  ] as const;

  return (
    <div className="p-6 md:p-8 space-y-6">
      <h1 className="text-2xl font-bold text-green-deep">لوحة تحكم الإدارة</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map(([label, value, color]) => (
          <div key={label} className={`${color} text-white rounded-xl p-5`}>
            <p className="text-sm opacity-90">{label}</p>
            <p className="text-3xl font-bold mt-1">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        <section className="card">
          <h2 className="font-bold mb-3">الفائزون (أعلى 3 درجات)</h2>
          {stats.winners.length === 0 ? (
            <p className="text-gray-400 text-sm">لا توجد نتائج منشورة بعد</p>
          ) : (
            <ol className="space-y-2 text-sm">
              {stats.winners.map((w, i) => (
                <li key={w.regNumber} className="flex justify-between border-b pb-2">
                  <span>{i + 1}. {w.name} <span className="text-gray-400">({w.regNumber})</span></span>
                  <b>{w.final}</b>
                </li>
              ))}
            </ol>
          )}
        </section>

        <section className="card">
          <h2 className="font-bold mb-3">حسب المرحلة التعليمية</h2>
          {Object.keys(stats.byStage).length === 0 ? (
            <p className="text-gray-400 text-sm">لا يوجد متسابقون بعد</p>
          ) : (
            <ul className="text-sm space-y-2">
              {Object.entries(stats.byStage).map(([g, n]) => (
                <li key={g} className="flex justify-between border-b pb-2"><span>{g}</span><b>{n}</b></li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
