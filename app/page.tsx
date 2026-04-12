"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Job, JobStages, hasInterview, hasOffer, isJobActive, DEFAULT_STAGES, getSupabase } from "@/lib/supabase";
import StatsBar from "@/components/StatsBar";
import JobTable from "@/components/JobTable";
import JobForm from "@/components/JobForm";
import AiTips from "@/components/AiTips";
import AuthForm from "@/components/AuthForm";

export default function Home() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterField, setFilterField] = useState("all");
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  // Always-current token for use inside callbacks
  const tokenRef = useRef<string | null>(null);

  const fetchJobs = useCallback(async () => {
    if (!tokenRef.current) return;
    setLoading(true);
    try {
      const res = await fetch("/api/jobs", {
        headers: { Authorization: `Bearer ${tokenRef.current}` },
      });
      if (res.ok) setJobs(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const sb = getSupabase();

    // Check existing session on mount
    sb.auth.getSession().then(({ data }) => {
      tokenRef.current = data.session?.access_token ?? null;
      setUserEmail(data.session?.user?.email ?? null);
      setAuthLoading(false);
      if (data.session) fetchJobs();
      else setLoading(false);
    });

    // Keep token and user state in sync with Supabase auth events
    const { data: { subscription } } = sb.auth.onAuthStateChange((_, session) => {
      tokenRef.current = session?.access_token ?? null;
      setUserEmail(session?.user?.email ?? null);
      if (session) fetchJobs();
      else { setJobs([]); setLoading(false); }
    });

    return () => subscription.unsubscribe();
  }, [fetchJobs]);

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
    const res = await fetch(`/api/jobs/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${tokenRef.current ?? ""}` },
    });
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
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenRef.current ?? ""}`,
      },
      body: JSON.stringify({ stages }),
    });
  };

  const handleLogout = async () => {
    await getSupabase().auth.signOut();
  };

  const safe = (j: Job) => j.stages?.length ? j.stages : DEFAULT_STAGES;

  const uniqueFields = Array.from(
    new Set(jobs.map((j) => j.field).filter(Boolean) as string[])
  ).sort();

  const statusFilters = [
    { value: "all",       label: "הכל",    count: jobs.length },
    { value: "active",    label: "בתהליך", count: jobs.filter((j) => isJobActive(safe(j))).length },
    { value: "interview", label: "ראיון",  count: jobs.filter((j) => hasInterview(safe(j))).length },
    { value: "offer",     label: "הצעה",   count: jobs.filter((j) => hasOffer(safe(j))).length },
    { value: "rejected",  label: "נדחיתי", count: jobs.filter((j) => !isJobActive(safe(j)) && !hasOffer(safe(j))).length },
  ];

  const filteredJobs = (() => {
    let list = jobs;
    if (filterStatus === "active")    list = list.filter((j) => isJobActive(safe(j)));
    if (filterStatus === "interview") list = list.filter((j) => hasInterview(safe(j)));
    if (filterStatus === "offer")     list = list.filter((j) => hasOffer(safe(j)));
    if (filterStatus === "rejected")  list = list.filter((j) => !isJobActive(safe(j)) && !hasOffer(safe(j)));
    if (filterField !== "all")        list = list.filter((j) => j.field === filterField);
    return list;
  })();

  // Waiting for initial session check
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center" dir="rtl">
        <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  // Not logged in
  if (!userEmail) return <AuthForm />;

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
            {/* User info + logout */}
            <div className="flex items-center gap-2 pr-2 mr-1 border-r border-slate-200">
              <span className="text-xs text-slate-400 max-w-[140px] truncate hidden sm:block">
                {userEmail}
              </span>
              <button
                onClick={handleLogout}
                className="text-sm text-slate-500 hover:text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
              >
                התנתק
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
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
