"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";
import { StudentGuard } from "@/components/Guards";
import { Nav } from "@/components/Nav";
import type { Score } from "@/lib/types";

const STATUS_LABEL: Record<string, string> = { PENDING: "قيد المراجعة", APPROVED: "مقبول", REJECTED: "مرفوض" };

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
  const { student, refresh } = useAuth();
  const [score, setScore] = useState<Score | null>(null);
  const [loadingScore, setLoadingScore] = useState(true);

  useEffect(() => {
    if (!student) return;
    // This query is intentionally the same for every student — RLS is what
    // decides whether a row comes back at all (own row only, and only once
    // the admin's single publish toggle is on). If results are hidden, or
    // this were somehow another student's id, Supabase returns zero rows,
    // not an error and not someone else's score.
    supabase.from("scores").select("*").eq("student_id", student.id).maybeSingle().then(({ data }) => {
      setScore(data as Score | null);
      setLoadingScore(false);
    });
  }, [student]);

  if (!student) return null;

  return (
    <div className="max-w-2xl mx-auto px-6 py-10 space-y-5">
      <h1 className="text-2xl font-bold text-green-deep">مرحبًا، {student.full_name}</h1>

      <section className="card">
        <h2 className="font-bold mb-3">بيانات التسجيل</h2>
        <span className={`badge badge-${student.approval_status.toLowerCase()}`}>{STATUS_LABEL[student.approval_status]}</span>
        <dl className="grid grid-cols-2 gap-2 text-sm mt-4">
          <dt className="text-gray-500">رقم التسجيل</dt><dd className="font-semibold">{student.registration_number}</dd>
          <dt className="text-gray-500">المرحلة</dt><dd>{student.educational_stage}</dd>
        </dl>
        {student.approval_status === "REJECTED" && student.rejection_reason && (
          <div className="card bg-red-50 border-red-300 text-red-700 text-sm mt-4">سبب الرفض: {student.rejection_reason}</div>
        )}
      </section>

      <section className="card">
        <h2 className="font-bold mb-3">موعد الامتحان</h2>
        {student.exam_date ? (
          <dl className="grid grid-cols-3 gap-2 text-sm">
            <dt className="text-gray-500">التاريخ</dt><dd className="col-span-2">{student.exam_date}</dd>
            <dt className="text-gray-500">الوقت</dt><dd className="col-span-2">{student.exam_time ?? "—"}</dd>
            <dt className="text-gray-500">المكان</dt><dd className="col-span-2">{student.exam_place ?? "—"}</dd>
          </dl>
        ) : (
          <p className="text-gray-500 text-sm">لم يتم تحديد موعد الامتحان بعد</p>
        )}
      </section>

      <section className="card">
        <h2 className="font-bold mb-3">النتيجة</h2>
        {loadingScore ? (
          <p className="text-gray-400 text-sm">جاري التحميل...</p>
        ) : score ? (
          <dl className="grid grid-cols-3 gap-2 text-sm">
            <dt className="text-gray-500">الدرجة النهائية</dt><dd className="col-span-2 font-bold">{score.final}</dd>
            <dt className="text-gray-500">الترتيب</dt><dd className="col-span-2">{score.rank ?? "—"}</dd>
            <dt className="text-gray-500">الحالة</dt><dd className="col-span-2">{score.status === "PASSED" ? "ناجح" : "غير ناجح"}</dd>
          </dl>
        ) : (
          <p className="text-gray-500 text-sm">لم يتم إعلان النتائج بعد</p>
        )}
      </section>
    </div>
  );
}
