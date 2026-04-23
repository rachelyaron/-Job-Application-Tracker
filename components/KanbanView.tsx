"use client";

import { useState } from "react";
import { Job, JobStages, DEFAULT_STAGES } from "@/lib/supabase";
import Timeline from "@/components/Timeline";
import { logoStyle, logoInitials, getKanbanColumn } from "@/lib/utils";
import { Strings } from "@/lib/strings";

interface KanbanViewProps {
  jobs:             Job[];
  onEdit:           (job: Job) => void;
  onTimelineChange: (id: string, stages: JobStages) => void;
  t:    Strings;
  lang: string;
}

export default function KanbanView({ jobs, onEdit, onTimelineChange, t, lang }: KanbanViewProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const safe = (j: Job): JobStages => j.stages?.length ? j.stages : DEFAULT_STAGES.map(s => ({ ...s }));

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const cols = [
    { id: "applied",  title: t.colApplied,  color: "#64748b" },
    { id: "screen",   title: t.colScreen,   color: "#3b82f6" },
    { id: "final",    title: t.colFinal,    color: "#8b5cf6" },
    { id: "offer",    title: t.colOffer,    color: "#10b981" },
    { id: "rejected", title: t.colRejected, color: "#ef4444" },
  ];

  const byCol: Record<string, Job[]> = Object.fromEntries(cols.map(c => [c.id, []]));
  jobs.forEach(job => {
    const col = getKanbanColumn(safe(job));
    (byCol[col] ??= []).push(job);
  });

  return (
    <div className="kanban">
      {cols.map(col => (
        <div key={col.id} className="kcol">
          <div className="kcol-head">
            <span className="kcol-dot" style={{ background: col.color }} />
            <span className="kcol-name">{col.title}</span>
            <span className="kcol-count">{byCol[col.id].length}</span>
          </div>
          <div className="kcol-body">
            {byCol[col.id].map(job => {
              const stages     = safe(job);
              const isExpanded = expanded.has(job.id);
              const overflow   = stages.length > 3;
              const hidden     = overflow && !isExpanded ? stages.length - 3 : 0;
              const visible    = overflow && !isExpanded ? stages.slice(0, 3) : stages;

              return (
                <div key={job.id} className="kcard" onClick={() => onEdit(job)}>
                  <div className="kcard-head">
                    <div
                      className="co-logo"
                      style={{ ...logoStyle(job.company_name), width: 30, height: 30, fontSize: 11, borderRadius: 8 }}
                    >
                      {logoInitials(job.company_name)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="kcard-role">{job.role}</div>
                      <div className="kcard-company">{job.company_name}</div>
                    </div>
                  </div>

                  <div onClick={(e) => e.stopPropagation()}>
                    <Timeline
                      stages={visible}
                      onChange={(updated) => {
                        // when collapsed, merge updated visible stages back with hidden tail
                        const full = (overflow && !isExpanded)
                          ? [...updated, ...stages.slice(3)]
                          : updated;
                        onTimelineChange(job.id, full);
                      }}
                      compact
                      lang={lang}
                    />

                    {overflow && (
                      <button
                        type="button"
                        className="kcard-more-btn"
                        onClick={(e) => toggleExpand(job.id, e)}
                      >
                        {isExpanded ? (
                          <span className="kcard-more-label">
                            <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
                              <path d="M3 10L8 5L13 10" stroke="currentColor" strokeWidth="2"
                                strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            {lang === "he" ? "פחות" : "Less"}
                          </span>
                        ) : (
                          <span className="kcard-more-label">
                            <span className="kcard-more-count">+{hidden}</span>
                            <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
                              <path d="M3 6L8 11L13 6" stroke="currentColor" strokeWidth="2"
                                strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </span>
                        )}
                      </button>
                    )}
                  </div>

                  <div className="kcard-meta">
                    <span>
                      {new Date(job.date_applied).toLocaleDateString(lang === "he" ? "he-IL" : "en-GB")}
                    </span>
                    {job.field && <><span>·</span><span>{job.field}</span></>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
