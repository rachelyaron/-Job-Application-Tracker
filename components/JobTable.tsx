"use client";

import { Job, JobStages, isJobActive, DEFAULT_STAGES } from "@/lib/supabase";
import Timeline from "@/components/Timeline";

interface JobTableProps {
  jobs: Job[];
  onEdit: (job: Job) => void;
  onDelete: (id: string) => void;
  onTimelineChange: (id: string, stages: JobStages) => void;
}

export default function JobTable({ jobs, onEdit, onDelete, onTimelineChange }: JobTableProps) {
  const safeStages = (job: Job): JobStages =>
    job.stages?.length ? job.stages : DEFAULT_STAGES.map((s) => ({ ...s }));
  if (jobs.length === 0) {
    return (
      <div className="text-center py-16 text-slate-400">
        <p className="text-5xl mb-4">📋</p>
        <p className="text-lg">אין מועמדויות עדיין</p>
        <p className="text-sm mt-1">לחץ על ״הוסף מועמדות״ כדי להתחיל</p>
      </div>
    );
  }

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200">
      <table className="w-full text-sm">
        <thead className="bg-slate-100 text-slate-600">
          <tr>
            <th className="px-4 py-3 text-right font-semibold">חברה</th>
            <th className="px-4 py-3 text-right font-semibold">תפקיד</th>
            <th className="px-4 py-3 text-right font-semibold">תחום</th>
            <th className="px-4 py-3 text-right font-semibold">תאריך הגשה</th>
            <th className="px-4 py-3 text-right font-semibold">התקדמות</th>
            <th className="px-4 py-3 text-right font-semibold">קו&quot;ח</th>
            <th className="px-4 py-3 text-right font-semibold">הערות</th>
            <th className="px-4 py-3 text-right font-semibold">פעולות</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {jobs.map((job) => {
            const stages = safeStages(job);
            const isStale = isJobActive(stages) && new Date(job.updated_at) < sevenDaysAgo;

            return (
              <tr
                key={job.id}
                className={`bg-white hover:bg-slate-50 transition-colors ${
                  isStale ? "border-r-4 border-r-amber-400" : ""
                }`}
              >
                <td className="px-4 py-3 font-medium text-slate-800 whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    {isStale && <span title="לא עודכן מעל 7 ימים">⚠️</span>}
                    {job.company_name}
                  </div>
                </td>

                <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                  {job.role}
                </td>

                <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                  {job.field || <span className="text-slate-300">—</span>}
                </td>

                <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                  {new Date(job.date_applied).toLocaleDateString("he-IL")}
                </td>

                <td className="px-4 py-3">
                  <Timeline
                    stages={stages}
                    onChange={(updated) => onTimelineChange(job.id, updated)}
                    compact
                  />
                </td>

                <td className="px-4 py-3">
                  {job.cv_url ? (
                    <a
                      href={job.cv_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      title='צפה בקו"ח'
                      className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                        <path d="M4 2h6l4 4v8H4V2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
                        <path d="M10 2v4h4" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
                      </svg>
                      <span className="text-xs">צפה</span>
                    </a>
                  ) : (
                    <span className="text-slate-300 text-xs">—</span>
                  )}
                </td>

                <td className="px-4 py-3 text-slate-500 max-w-xs">
                  {job.job_link && (
                    <a
                      href={job.job_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline block mb-0.5"
                    >
                      קישור
                    </a>
                  )}
                  {job.notes && (
                    <span title={job.notes} className="cursor-help truncate block">
                      {job.notes.length > 35
                        ? job.notes.slice(0, 35) + "..."
                        : job.notes}
                    </span>
                  )}
                </td>

                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => onEdit(job)}
                      className="text-slate-500 hover:text-blue-600 transition-colors p-1 rounded hover:bg-blue-50"
                      title="ערוך"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`למחוק את המועמדות ל${job.company_name}?`)) {
                          onDelete(job.id);
                        }
                      }}
                      className="text-slate-500 hover:text-red-600 transition-colors p-1 rounded hover:bg-red-50"
                      title="מחק"
                    >
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
