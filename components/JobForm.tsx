"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Job, JobInsert, DEFAULT_STAGES, applyStageClick, getSupabase } from "@/lib/supabase";

interface JobFormProps {
  job?: Job | null;
  onSave: (job: Job) => void;
  onCancel: () => void;
}

function StageIcon({ state }: { state: string }) {
  if (state === "completed")
    return (
      <svg width={14} height={14} viewBox="0 0 16 16" fill="none">
        <path d="M2.5 8.5L6.5 12.5L13.5 4" stroke="white" strokeWidth="2.4"
          strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  if (state === "failed")
    return (
      <svg width={14} height={14} viewBox="0 0 16 16" fill="none">
        <path d="M3.5 3.5L12.5 12.5M12.5 3.5L3.5 12.5" stroke="white"
          strokeWidth="2.4" strokeLinecap="round" />
      </svg>
    );
  return <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />;
}

export default function JobForm({ job, onSave, onCancel }: JobFormProps) {
  // Stable keys for stage rows so React doesn't confuse inputs on add/remove
  const keyCounter = useRef(0);
  const nextKey = useCallback(() => String(++keyCounter.current), []);

  const makeKeys = (count: number) =>
    Array.from({ length: count }, () => nextKey());

  const [stageKeys, setStageKeys] = useState<string[]>(() =>
    makeKeys(DEFAULT_STAGES.length)
  );

  const [form, setForm] = useState<JobInsert>({
    company_name: "",
    role: "",
    date_applied: new Date().toISOString().split("T")[0],
    field: "",
    stages: DEFAULT_STAGES.map((s) => ({ ...s })),
    job_link: "",
    cv_url: null,
    notes: "",
  });
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (job) {
      const src = job.stages?.length
        ? job.stages.map((s) => ({ ...s }))
        : DEFAULT_STAGES.map((s) => ({ ...s }));
      setStageKeys(makeKeys(src.length));
      setForm({
        company_name: job.company_name,
        role: job.role,
        date_applied: job.date_applied,
        field: job.field || "",
        stages: src,
        job_link: job.job_link || "",
        cv_url: job.cv_url || null,
        notes: job.notes || "",
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [job]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleStageClick = (idx: number) => {
    setForm((prev) => ({ ...prev, stages: applyStageClick(prev.stages, idx) }));
  };

  const handleStageName = (idx: number, name: string) => {
    setForm((prev) => ({
      ...prev,
      stages: prev.stages.map((s, i) => (i === idx ? { ...s, name } : s)),
    }));
  };

  const addStage = () => {
    setStageKeys((prev) => [...prev, nextKey()]);
    setForm((prev) => ({
      ...prev,
      stages: [...prev.stages, { name: "", state: "not_reached" as const }],
    }));
  };

  const removeStage = (idx: number) => {
    setStageKeys((prev) => prev.filter((_, i) => i !== idx));
    setForm((prev) => ({
      ...prev,
      stages: prev.stages.filter((_, i) => i !== idx),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      let cv_url = form.cv_url || null;

      if (cvFile) {
        const ext = cvFile.name.split(".").pop() ?? "pdf";
        const path = `${crypto.randomUUID()}.${ext}`;
        const sb = getSupabase();
        const { error: uploadError } = await sb.storage
          .from("cvs")
          .upload(path, cvFile, { upsert: false });
        if (uploadError) throw new Error(`העלאת קו"ח נכשלה: ${uploadError.message}`);
        const { data: urlData } = sb.storage.from("cvs").getPublicUrl(path);
        cv_url = urlData.publicUrl;
      }

      const url = job ? `/api/jobs/${job.id}` : "/api/jobs";
      const method = job ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          field:    form.field    || null,
          job_link: form.job_link || null,
          cv_url,
          notes:    form.notes    || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "שגיאה בשמירה");
      }
      onSave(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "שגיאה לא ידועה");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] flex flex-col">
        <div className="p-6 overflow-y-auto flex-1">
          <h2 className="text-xl font-bold text-slate-800 mb-6">
            {job ? "עריכת מועמדות" : "הוספת מועמדות חדשה"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-300 text-red-700 text-sm rounded-xl p-3">
                {error}
              </div>
            )}

            <Field label="שם החברה *">
              <input name="company_name" value={form.company_name} onChange={handleChange}
                required placeholder="לדוגמה: Google" className="input" />
            </Field>

            <Field label="תפקיד *">
              <input name="role" value={form.role} onChange={handleChange}
                required placeholder="לדוגמה: מפתח Full Stack" className="input" />
            </Field>

            <Field label="תחום">
              <input
                name="field"
                value={form.field || ""}
                onChange={handleChange}
                list="field-suggestions"
                placeholder="לדוגמה: טכנולוגיה, שיווק, מכירות..."
                className="input"
                autoComplete="off"
              />
              <datalist id="field-suggestions">
                <option value="טכנולוגיה" />
                <option value="שיווק" />
                <option value="מכירות" />
                <option value="משאבי אנוש" />
                <option value="פיננסים" />
                <option value="עיצוב" />
                <option value="ניהול מוצר" />
                <option value="נתונים ו-AI" />
                <option value="אבטחת מידע" />
                <option value="תפעול" />
                <option value="משפטי" />
                <option value="חינוך" />
                <option value="בריאות" />
                <option value="נדל״ן" />
                <option value="לוגיסטיקה" />
                <option value="שירות לקוחות" />
              </datalist>
            </Field>

            <Field label="תאריך הגשה *">
              <input name="date_applied" type="date" value={form.date_applied}
                onChange={handleChange} required className="input" />
            </Field>

            {/* Stage editor */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                שלבי התהליך
              </label>
              <div className="space-y-2 bg-slate-50 rounded-xl p-3 border border-slate-200">
                {form.stages.map((stage, idx) => (
                  <div key={stageKeys[idx] ?? idx} className="flex items-center gap-2">
                    {/* Clickable state circle */}
                    <button
                      type="button"
                      onClick={() => handleStageClick(idx)}
                      title="לחץ לשינוי סטטוס"
                      className={[
                        "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                        "transition-all hover:scale-110 active:scale-95",
                        "focus:outline-none focus:ring-2 focus:ring-offset-1",
                        stage.state === "completed"
                          ? "bg-green-500 focus:ring-green-400"
                          : stage.state === "failed"
                          ? "bg-red-500 focus:ring-red-400"
                          : "bg-slate-200 focus:ring-slate-300",
                      ].join(" ")}
                    >
                      <StageIcon state={stage.state} />
                    </button>

                    {/* Editable stage name */}
                    <input
                      value={stage.name}
                      onChange={(e) => handleStageName(idx, e.target.value)}
                      placeholder={`שם שלב ${idx + 1}`}
                      className="input flex-1 py-1.5 text-sm"
                      dir="rtl"
                    />

                    {/* Remove stage button — always visible, disabled when only 1 stage */}
                    <button
                      type="button"
                      onClick={() => removeStage(idx)}
                      disabled={form.stages.length === 1}
                      title="הסר שלב"
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex-shrink-0"
                    >
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                        <path d="M3 3L13 13M13 3L3 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    </button>
                  </div>
                ))}

                {/* Add stage button */}
                <button
                  type="button"
                  onClick={addStage}
                  className="w-full mt-1 py-1.5 rounded-lg border border-dashed border-slate-300 text-slate-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-colors text-sm flex items-center justify-center gap-1.5"
                >
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                    <path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
                  </svg>
                  הוסף שלב
                </button>

                <p className="text-xs text-slate-400 text-center">
                  לחץ על עיגול: אפור → ירוק ✓ → אדום ✗ → אפור
                </p>
              </div>
            </div>

            <Field label="קישור למשרה">
              <input name="job_link" type="text" value={form.job_link || ""}
                onChange={handleChange} placeholder="https://..." className="input" />
            </Field>

            <Field label='קו"ח (PDF / Word)'>
              <div className="space-y-1.5">
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => setCvFile(e.target.files?.[0] ?? null)}
                  className="block w-full text-sm text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-colors cursor-pointer"
                />
                {!cvFile && form.cv_url && (
                  <a
                    href={form.cv_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                  >
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                      <path d="M4 2h6l4 4v8H4V2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
                      <path d="M10 2v4h4" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
                    </svg>
                    צפה בקו&quot;ח הנוכחי
                  </a>
                )}
                {cvFile && (
                  <p className="text-xs text-slate-500">נבחר: {cvFile.name}</p>
                )}
              </div>
            </Field>

            <Field label="הערות">
              <textarea name="notes" value={form.notes || ""} onChange={handleChange}
                rows={3} placeholder="מידע נוסף, שם איש קשר..." className="input resize-none" />
            </Field>

            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={saving}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl transition-colors">
                {saving ? "שומר..." : job ? "עדכן" : "הוסף"}
              </button>
              <button type="button" onClick={onCancel}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 rounded-xl transition-colors">
                ביטול
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      {children}
    </div>
  );
}
