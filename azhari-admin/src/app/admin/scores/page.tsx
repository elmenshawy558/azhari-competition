"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import * as XLSX from "xlsx";
import { supabase } from "@/lib/supabase";
import type { Student, Score, Settings } from "@/lib/types";

type Row = Student & { score: Score | null };

export default function AdminScoresPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [importLog, setImportLog] = useState<string | null>(null);
  const [toggling, setToggling] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: students }, { data: scores }, { data: settingsRow }] = await Promise.all([
      supabase.from("students").select("*").eq("approval_status", "APPROVED").order("registration_number"),
      supabase.from("scores").select("*"),
      supabase.from("settings").select("*").eq("id", "singleton").maybeSingle(),
    ]);
    const scoreByStudent = new Map((scores ?? []).map((s: any) => [s.student_id, s as Score]));
    setRows(((students ?? []) as Student[]).map((s) => ({ ...s, score: scoreByStudent.get(s.id) ?? null })));
    setSettings(settingsRow as Settings);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function togglePublish() {
    if (!settings) return;
    setToggling(true);
    const next = !settings.results_published;
    const { error } = await supabase.from("settings").update({ results_published: next }).eq("id", "singleton");
    setToggling(false);
    if (!error) setSettings({ ...settings, results_published: next });
  }

  async function saveScore(studentId: string, value: number) {
    const clamped = Math.max(0, Math.min(100, value));
    // status/updated_at are recomputed server-side by a trigger regardless
    // of what we send — this upsert only ever supplies the raw score.
    const { data, error } = await supabase
      .from("scores")
      .upsert({ student_id: studentId, final: clamped }, { onConflict: "student_id" })
      .select()
      .single();
    if (!error && data) {
      setRows((prev) => prev.map((r) => (r.id === studentId ? { ...r, score: data as Score } : r)));
    }
  }

  async function handleImport(file: File) {
    setImporting(true);
    setImportLog(null);
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const records: any[] = XLSX.utils.sheet_to_json(sheet);

      const regNumbers = records.map((r) => String(r.registrationNumber ?? r["رقم التسجيل"] ?? "").trim()).filter(Boolean);
      const { data: matched } = await supabase.from("students").select("id, registration_number").in("registration_number", regNumbers);
      const idByReg = new Map((matched ?? []).map((s: any) => [s.registration_number, s.id]));

      let ok = 0, failed: string[] = [];
      for (const r of records) {
        const reg = String(r.registrationNumber ?? r["رقم التسجيل"] ?? "").trim();
        const studentId = idByReg.get(reg);
        if (!studentId) { failed.push(`${reg}: رقم التسجيل غير موجود`); continue; }
        const rawScore = Number(r.score ?? r["الدرجة"]) || 0;
        const payload = { student_id: studentId, final: Math.max(0, Math.min(100, rawScore)) };
        const { error } = await supabase.from("scores").upsert(payload, { onConflict: "student_id" });
        if (error) failed.push(`${reg}: ${error.message}`); else ok++;
      }
      setImportLog(`تم استيراد ${ok} من ${records.length} صف بنجاح${failed.length ? " — أخطاء: " + failed.slice(0, 5).join("، ") : ""}`);
      load();
    } catch (e: any) {
      setImportLog(`تعذر قراءة الملف: ${e.message}`);
    } finally {
      setImporting(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  return (
    <div className="p-6 md:p-8 space-y-6">
      <h1 className="text-2xl font-bold text-green-deep">إدارة النتائج</h1>

      <section className="card flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-bold">نشر النتائج</h2>
          <p className="text-sm text-gray-500">عند التفعيل، يرى كل متسابق نتيجته فقط. عند الإيقاف، لا يرى أحد أي نتيجة.</p>
        </div>
        <button onClick={togglePublish} disabled={toggling || !settings}
          className={`btn-sm rounded-full px-5 py-2 font-bold ${settings?.results_published ? "bg-green text-white" : "bg-gray-200 text-gray-600"}`}>
          {settings?.results_published ? "منشورة — اضغط للإخفاء" : "مخفية — اضغط للنشر"}
        </button>
      </section>

      <section className="card">
        <h2 className="font-bold mb-2">استيراد الدرجات من Excel/CSV</h2>
        <p className="text-sm text-gray-500 mb-3">
          الأعمدة المطلوبة: registrationNumber (أو "رقم التسجيل")، score (أو "الدرجة" من 100)
        </p>
        <input ref={fileInput} type="file" accept=".xlsx,.xls,.csv" disabled={importing}
          onChange={(e) => e.target.files?.[0] && handleImport(e.target.files[0])} className="input" />
        {importing && <p className="text-sm text-gray-500 mt-2">جاري الاستيراد...</p>}
        {importLog && <div className="card bg-green/5 border-green text-sm mt-3">{importLog}</div>}
      </section>

      <section className="card overflow-x-auto p-0">
        {loading ? (
          <p className="p-6 text-gray-400">جاري التحميل...</p>
        ) : (
          <table className="w-full text-sm text-right">
            <thead>
              <tr className="border-b text-gray-500">
                <th className="p-3">رقم التسجيل</th><th className="p-3">الاسم</th><th className="p-3">المستوى</th>
                <th className="p-3">الدرجة /100</th><th className="p-3">الحالة</th><th className="p-3">الترتيب في المستوى</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b">
                  <td className="p-3">{r.registration_number}</td>
                  <td className="p-3">{r.full_name}</td>
                  <td className="p-3 text-gray-500">{r.memorization_level}</td>
                  <td className="p-2">
                    <ScoreInput value={r.score?.final ?? 0} onSave={(v) => saveScore(r.id, v)} />
                  </td>
                  <td className="p-3">
                    {r.score ? (r.score.status === "PASSED" ? <span className="badge badge-approved">ناجح</span> : <span className="badge badge-rejected">غير ناجح</span>) : "-"}
                  </td>
                  <td className="p-3">{r.score?.rank ?? "-"}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={6} className="p-8 text-center text-gray-400">لا يوجد متسابقون مقبولون بعد</td></tr>
              )}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

/** Small input that only writes to Supabase on blur/Enter, not on every keystroke. */
function ScoreInput({ value, onSave }: { value: number; onSave: (v: number) => void }) {
  const [local, setLocal] = useState(String(value));
  useEffect(() => setLocal(String(value)), [value]);
  return (
    <input
      type="number" min={0} max={100} className="input w-20 py-1 px-2 text-center"
      value={local}
      onChange={(e) => setLocal(e.target.value)}
      onBlur={() => { const n = Number(local) || 0; onSave(n); }}
      onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
    />
  );
}
