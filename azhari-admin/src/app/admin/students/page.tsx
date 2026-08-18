"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { Student } from "@/lib/types";

const STATUS_LABEL: Record<string, string> = { PENDING: "قيد المراجعة", APPROVED: "مقبول", REJECTED: "مرفوض" };

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Student | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    // RLS already restricts this to "all students" only because we're the
    // admin — the exact same query run by a student would return only their
    // own row, with no code-level filtering needed on either side.
    let query = supabase.from("students").select("*").order("created_at", { ascending: false });
    if (status) query = query.eq("approval_status", status);
    if (q) query = query.or(`full_name.ilike.%${q}%,national_id.ilike.%${q}%,registration_number.ilike.%${q}%`);
    const { data } = await query;
    setStudents((data ?? []) as Student[]);
    setLoading(false);
  }, [q, status]);

  useEffect(() => { load(); }, [load]);

  async function setApproval(id: string, approval_status: Student["approval_status"], rejection_reason?: string) {
    await supabase.from("students").update({ approval_status, rejection_reason: rejection_reason ?? null }).eq("id", id);
    load();
  }
  async function remove(id: string) {
    if (!confirm("هل أنت متأكد من حذف هذا المتسابق؟")) return;
    await supabase.from("students").delete().eq("id", id);
    load();
  }

  function exportCsv() {
    const rows = [["رقم التسجيل", "الاسم", "الرقم القومي", "الحالة"]];
    students.forEach((s) => rows.push([s.registration_number, s.full_name, s.national_id, STATUS_LABEL[s.approval_status]]));
    const csv = "\uFEFF" + rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `students-${Date.now()}.csv`;
    a.click();
  }

  return (
    <div className="p-6 md:p-8 space-y-5">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <h1 className="font-display text-2xl font-bold text-ink">إدارة المتسابقين</h1>
        <button onClick={exportCsv} className="btn-gold btn-sm">تصدير CSV</button>
      </div>

      <div className="flex gap-3 flex-wrap">
        <input className="input flex-1 min-w-[220px]" placeholder="بحث بالاسم أو الرقم القومي أو رقم التسجيل"
          value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="input w-48" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">كل الحالات</option>
          <option value="PENDING">قيد المراجعة</option>
          <option value="APPROVED">مقبول</option>
          <option value="REJECTED">مرفوض</option>
        </select>
      </div>

      {loading ? (
        <p className="text-ink-faint">جاري التحميل...</p>
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-sm text-right">
            <thead>
              <tr className="border-b text-ink-faint">
                <th className="p-3">رقم التسجيل</th><th className="p-3">الاسم</th>
                <th className="p-3">الحالة</th><th className="p-3">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.id} className="border-b">
                  <td className="p-3">{s.registration_number}</td>
                  <td className="p-3">{s.full_name}</td>
                  <td className="p-3"><span className={`badge badge-${s.approval_status.toLowerCase()}`}>{STATUS_LABEL[s.approval_status]}</span></td>
                  <td className="p-3 space-x-2 space-x-reverse whitespace-nowrap">
                    <button onClick={() => setEditing(s)} className="text-ink underline text-xs">تعديل</button>
                    <button onClick={() => setApproval(s.id, "APPROVED")} className="text-teal-600 underline text-xs">قبول</button>
                    <button onClick={() => {
                      const reason = prompt("سبب الرفض:");
                      if (reason) setApproval(s.id, "REJECTED", reason);
                    }} className="text-red-600 underline text-xs">رفض</button>
                    <button onClick={() => remove(s.id)} className="text-ink-faint underline text-xs">حذف</button>
                  </td>
                </tr>
              ))}
              {students.length === 0 && (
                <tr><td colSpan={5} className="p-10 text-center text-ink-faint"><div className="text-2xl mb-2">🔍</div>لا يوجد متسابقون مطابقون</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {editing && <EditModal student={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />}
    </div>
  );
}

function EditModal({ student, onClose, onSaved }: { student: Student; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ ...student });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setError(null);
    const { error: err } = await supabase.from("students").update({
      full_name: form.full_name, phone: form.phone, email: form.email, memorization_level: form.memorization_level, educational_stage: form.educational_stage,
      institute: form.institute, exam_date: form.exam_date, exam_time: form.exam_time, exam_place: form.exam_place,
    }).eq("id", student.id);
    setSaving(false);
    if (err) { setError(err.message); return; }
    onSaved();
  }

  const set = (k: keyof Student, v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 max-w-lg w-full max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-bold text-lg mb-4">تعديل بيانات المتسابق</h2>
        {error && <div className="card bg-red-50 border-red-300 text-red-700 text-sm mb-4">{error}</div>}
        <div className="space-y-3">
          <L label="الاسم الكامل"><input className="input" value={form.full_name} onChange={(e) => set("full_name", e.target.value)} /></L>
          <div className="grid grid-cols-2 gap-3">
            <L label="الهاتف"><input className="input" value={form.phone} onChange={(e) => set("phone", e.target.value)} /></L>
            <L label="البريد"><input className="input" value={form.email} onChange={(e) => set("email", e.target.value)} /></L>
          </div>
          <L label="مستوى الحفظ"><input className="input" value={form.memorization_level} onChange={(e) => set("memorization_level", e.target.value)} /></L>
          <div className="grid grid-cols-2 gap-3">
            <L label="المرحلة"><input className="input" value={form.educational_stage} onChange={(e) => set("educational_stage", e.target.value)} /></L>
            <L label="المعهد"><input className="input" value={form.institute} onChange={(e) => set("institute", e.target.value)} /></L>
          </div>
          <p className="text-sm font-bold text-ink pt-2">موعد الامتحان</p>
          <div className="grid grid-cols-3 gap-3">
            <L label="التاريخ"><input type="date" className="input" value={form.exam_date ?? ""} onChange={(e) => set("exam_date", e.target.value)} /></L>
            <L label="الوقت"><input type="time" className="input" value={form.exam_time ?? ""} onChange={(e) => set("exam_time", e.target.value)} /></L>
            <L label="المكان"><input className="input" value={form.exam_place ?? ""} onChange={(e) => set("exam_place", e.target.value)} /></L>
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={save} disabled={saving} className="btn-primary flex-1 justify-center flex">{saving ? "جاري الحفظ..." : "حفظ"}</button>
          <button onClick={onClose} className="btn-outline flex-1">إلغاء</button>
        </div>
      </div>
    </div>
  );
}
function L({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block text-sm"><span className="label">{label}</span>{children}</label>;
}
