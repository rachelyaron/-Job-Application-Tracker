"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Job, JobInsert, DEFAULT_STAGES, applyStageClick, getSupabase, getSupabaseWithToken } from "@/lib/supabase";

interface JobFormProps {
  job?: Job | null;
  onSave: (job: Job) => void;
  onCancel: () => void;
  isDemo?: boolean;
}

function StageStateIcon({ state }: { state: string }) {
  if (state === "completed")
    return (
      <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
        <path d="M2.5 8.5L6.5 12.5L13.5 4" stroke="white" strokeWidth="2.4"
          strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  if (state === "failed")
    return (
      <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
        <path d="M3.5 3.5L12.5 12.5M12.5 3.5L3.5 12.5" stroke="white"
          strokeWidth="2.4" strokeLinecap="round" />
      </svg>
    );
  return null;
}

export default function JobForm({ job, onSave, onCancel, isDemo = false }: JobFormProps) {
  const keyCounter = useRef(0);
  const nextKey = useCallback(() => String(++keyCounter.current), []);
  const makeKeys = (count: number) => Array.from({ length: count }, () => nextKey());

  const [stageKeys, setStageKeys] = useState<string[]>(() => makeKeys(DEFAULT_STAGES.length));

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

  const handleStageClick  = (idx: number) =>
    setForm((prev) => ({ ...prev, stages: applyStageClick(prev.stages, idx) }));

  const handleStageName = (idx: number, name: string) =>
    setForm((prev) => ({
      ...prev,
      stages: prev.stages.map((s, i) => (i === idx ? { ...s, name } : s)),
    }));

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
      const payload = {
        ...form,
        field:    form.field    || null,
        job_link: form.job_link || null,
        notes:    form.notes    || null,
      };

      // ── Demo mode: everything stays in memory ─────────────────────────
      if (isDemo) {
        const cv_url = cvFile ? `demo-cv://${cvFile.name}` : (form.cv_url || null);
        const now = new Date().toISOString();
        const saved: Job = {
          ...payload,
          cv_url,
          id:         job?.id ?? `demo-${crypto.randomUUID()}`,
          user_id:    "demo",
          created_at: job?.created_at ?? now,
          updated_at: now,
        };
        onSave(saved);
        return;
      }

      // ── Real mode: upload CV then call API ────────────────────────────
      const { data: { session } } = await getSupabase().auth.getSession();
      const token = session?.access_token ?? "";

      let cv_url = form.cv_url || null;
      if (cvFile) {
        const ext = cvFile.name.split(".").pop() ?? "pdf";
        const path = `${crypto.randomUUID()}.${ext}`;
        const sb = getSupabaseWithToken(token);
        const { error: uploadError } = await sb.storage.from("cvs").upload(path, cvFile, { upsert: false });
        if (uploadError) throw new Error(`העלאת קו"ח נכשלה: ${uploadError.message}`);
        const { data: urlData } = getSupabaseWithToken(token).storage.from("cvs").getPublicUrl(path);
        cv_url = urlData.publicUrl;
      }

      const url    = job ? `/api/jobs/${job.id}` : "/api/jobs";
      const method = job ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...payload, cv_url }),
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
    <div className="modal-backdrop">
      <div className="modal">
        <div className="modal-head">
          <h2 className="modal-title">
            {job ? "עריכת מועמדות" : "הוספת מועמדות חדשה"}
          </h2>
          <button type="button" className="modal-close" onClick={onCancel}>×</button>
        </div>

        <div className="modal-body">
          <form id="job-form" onSubmit={handleSubmit}>
            {error && (
              <div style={{
                background: "#fef2f2", border: "1px solid #fecaca",
                color: "#b91c1c", borderRadius: 10, padding: "10px 14px",
                fontSize: 13, marginBottom: 16,
              }}>
                {error}
              </div>
            )}

            <div className="form-grid">
              <div className="field">
                <label>שם החברה <span style={{ color: "var(--accent)" }}>*</span></label>
                <input name="company_name" value={form.company_name} onChange={handleChange}
                  required placeholder="לדוגמה: Google" className="input" />
              </div>

              <div className="field">
                <label>תפקיד <span style={{ color: "var(--accent)" }}>*</span></label>
                <input name="role" value={form.role} onChange={handleChange}
                  required placeholder="לדוגמה: מפתח Full Stack" className="input" />
              </div>

              <div className="field">
                <label>תחום</label>
                <input
                  name="field" value={form.field || ""} onChange={handleChange}
                  list="field-suggestions" autoComplete="off"
                  placeholder="טכנולוגיה, שיווק, מכירות..." className="input"
                />
                <datalist id="field-suggestions">
                  <option value="טכנולוגיה" /><option value="שיווק" /><option value="מכירות" />
                  <option value="משאבי אנוש" /><option value="פיננסים" /><option value="עיצוב" />
                  <option value="ניהול מוצר" /><option value="נתונים ו-AI" /><option value="אבטחת מידע" />
                  <option value="תפעול" /><option value="משפטי" /><option value="חינוך" />
                  <option value="בריאות" /><option value="נדל״ן" /><option value="לוגיסטיקה" />
                  <option value="שירות לקוחות" />
                </datalist>
              </div>

              <div className="field">
                <label>תאריך הגשה <span style={{ color: "var(--accent)" }}>*</span></label>
                <input name="date_applied" type="date" value={form.date_applied}
                  onChange={handleChange} required className="input" />
              </div>

              <div className="field full">
                <label>שלבי התהליך</label>
                <div className="stage-editor">
                  {form.stages.map((stage, idx) => (
                    <div key={stageKeys[idx] ?? idx} className="stage-row">
                      <button
                        type="button"
                        onClick={() => handleStageClick(idx)}
                        title="לחץ לשינוי סטטוס"
                        className={`stage-btn ${stage.state === "completed" ? "completed" : stage.state === "failed" ? "failed" : ""}`}
                      >
                        <StageStateIcon state={stage.state} />
                      </button>
                      <input
                        value={stage.name}
                        onChange={(e) => handleStageName(idx, e.target.value)}
                        placeholder={`שם שלב ${idx + 1}`}
                        className="input"
                        dir="rtl"
                      />
                      <button
                        type="button"
                        onClick={() => removeStage(idx)}
                        disabled={form.stages.length === 1}
                        className="stage-remove"
                        title="הסר שלב"
                      >
                        <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                          <path d="M3 3L13 13M13 3L3 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                      </button>
                    </div>
                  ))}
                  <button type="button" onClick={addStage} className="stage-add">
                    <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                      <path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
                    </svg>
                    הוסף שלב
                  </button>
                  <div className="stage-help">
                    לחץ על עיגול לשינוי סטטוס:
                    <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", background: "var(--state-pending)", verticalAlign: "middle" }} /> אפור →
                    <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", background: "var(--state-completed)", verticalAlign: "middle" }} /> ירוק →
                    <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", background: "var(--state-failed)", verticalAlign: "middle" }} /> אדום
                  </div>
                </div>
              </div>

              <div className="field">
                <label>קישור למשרה</label>
                <input name="job_link" type="text" value={form.job_link || ""}
                  onChange={handleChange} placeholder="https://..." className="input" />
              </div>

              <div className="field">
                <label>קו&quot;ח (PDF / Word)</label>
                <div className="file-input">
                  <div className="file-ico">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"
                        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="2"
                        strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div className="file-text">
                    <div className="file-title">
                      {cvFile ? cvFile.name : "בחר קובץ קו״ח"}
                    </div>
                    <div className="file-sub">
                      {!cvFile && form.cv_url
                        ? <a href={form.cv_url} target="_blank" rel="noopener noreferrer"
                            style={{ color: "var(--accent)" }}>קובץ קיים — לחץ לצפייה</a>
                        : "PDF, DOC, DOCX"}
                    </div>
                  </div>
                  <input
                    type="file" accept=".pdf,.doc,.docx"
                    onChange={(e) => setCvFile(e.target.files?.[0] ?? null)}
                    style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }}
                  />
                </div>
              </div>

              <div className="field full">
                <label>הערות</label>
                <textarea name="notes" value={form.notes || ""} onChange={handleChange}
                  placeholder="מידע נוסף, שם איש קשר..." className="input" />
              </div>
            </div>
          </form>
        </div>

        <div className="modal-foot">
          <button type="button" onClick={onCancel} className="btn btn-ghost">
            ביטול
          </button>
          <button type="submit" form="job-form" disabled={saving} className="btn btn-primary">
            {saving ? "שומר..." : job ? "עדכן מועמדות" : "הוסף מועמדות"}
          </button>
        </div>
      </div>
    </div>
  );
}
