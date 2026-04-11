"use client";

import { useEffect, useState } from "react";
import { Job, JobStages, hasInterview, hasOffer, isJobActive, DEFAULT_STAGES } from "@/lib/supabase";
import StatsBar from "@/components/StatsBar";
import JobTable from "@/components/JobTable";
import JobForm from "@/components/JobForm";
import AiTips from "@/components/AiTips";

export default function Home() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterField, setFilterField] = useState("all");

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/jobs");
      if (res.ok) {
        const data = await res.json();
        setJobs(data);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = (saved: Job) => {
    setJobs((prev) => {
      const exists = prev.find((j) => j.id === saved.id);
      if (exists) return prev.map((j) => (j.id === saved.id ? saved : j));
      return [saved, ...prev];
    });
    setShowForm(false);
    setEditingJob(null);
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/jobs/${id}`, { method: "DELETE" });
    if (res.ok) setJobs((prev) => prev.filter((j) => j.id !== id));
  };

  const handleEdit = (job: Job) => {
    setEditingJob(job);
    setShowForm(true);
  };

  const handleTimelineChange = async (id: string, stages: JobStages) => {
    setJobs((prev) =>
      prev.map((j) => (j.id === id ? { ...j, stages, updated_at: new Date().toISOString() } : j))
    );
    await fetch(`/api/jobs/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stages }),
    });
  };

  const safe = (j: Job) => j.stages?.length ? j.stages : DEFAULT_STAGES;

  const statusFilters = [
    { value: "all",       label: "הכל",    count: jobs.length },
    { value: "active",    label: "בתהליך", count: jobs.filter((j) => isJobActive(safe(j))).length },
    { value: "interview", label: "ראיון",  count: jobs.filter((j) => hasInterview(safe(j))).length },
    { value: "offer",     label: "הצעה",   count: jobs.filter((j) => hasOffer(safe(j))).length },
    { value: "rejected",  label: "נדחיתי", count: jobs.filter((j) => !isJobActive(safe(j)) && !hasOffer(safe(j))).length },
  ];

  const uniqueFields = Array.from(
    new Set(jobs.map((j) => j.field).filter(Boolean) as string[])
  ).sort();

  const filteredJobs = (() => {
    let list = jobs;
    if (filterStatus === "active")    list = list.filter((j) => isJobActive(safe(j)));
    if (filterStatus === "interview") list = list.filter((j) => hasInterview(safe(j)));
    if (filterStatus === "offer")     list = list.filter((j) => hasOffer(safe(j)));
    if (filterStatus === "rejected")  list = list.filter((j) => !isJobActive(safe(j)) && !hasOffer(safe(j)));
    if (filterField !== "all")        list = list.filter((j) => j.field === filterField);
    return list;
  })();

  return (
    <main className="min-h-screen bg-slate-50" dir="rtl">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              📋 מעקב מועמדויות
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              נהל את חיפוש העבודה שלך
            </p>
          </div>
          <div className="flex items-center gap-3">
            <AiTips jobs={jobs} />
            <button
              onClick={() => {
                setEditingJob(null);
                setShowForm(true);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors flex items-center gap-2 shadow-sm"
            >
              <span>+</span>
              <span>הוסף מועמדות</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Stats */}
        <StatsBar jobs={jobs} />

        {/* Filter bar */}
        <div className="flex gap-2 flex-wrap items-center">
          {statusFilters.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilterStatus(f.value)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                filterStatus === f.value
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-slate-600 border-slate-200 hover:border-blue-300"
              }`}
            >
              {f.label}
              <span className="mr-1.5 text-xs opacity-70">({f.count})</span>
            </button>
          ))}
          {uniqueFields.length > 0 && (
            <select
              value={filterField}
              onChange={(e) => setFilterField(e.target.value)}
              className="mr-2 px-3 py-1.5 rounded-full text-sm font-medium border border-slate-200 bg-white text-slate-600 hover:border-blue-300 focus:outline-none focus:border-blue-400 transition-colors"
            >
              <option value="all">כל התחומים</option>
              {uniqueFields.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          )}
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
            <p className="mr-4 text-slate-600">טוען...</p>
          </div>
        ) : (
          <JobTable
            jobs={filteredJobs}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onTimelineChange={handleTimelineChange}
          />
        )}
      </div>

      {showForm && (
        <JobForm
          job={editingJob}
          onSave={handleSave}
          onCancel={() => {
            setShowForm(false);
            setEditingJob(null);
          }}
        />
      )}
    </main>
  );
}
