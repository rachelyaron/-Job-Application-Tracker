"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Job, JobStages, hasInterview, hasOffer, isJobActive, DEFAULT_STAGES, getSupabase } from "@/lib/supabase";
import { useSettings } from "@/contexts/SettingsContext";
import { DEMO_JOBS } from "@/lib/demo-data";
import StatsBar from "@/components/StatsBar";
import JobTable from "@/components/JobTable";
import CardsView from "@/components/CardsView";
import KanbanView from "@/components/KanbanView";
import JobForm from "@/components/JobForm";
import AiTips from "@/components/AiTips";
import AuthForm from "@/components/AuthForm";
import TweaksPanel from "@/components/TweaksPanel";

export default function Home() {
  const { view, lang, t } = useSettings();

  const [jobs, setJobs]             = useState<Job[]>([]);
  const [loading, setLoading]       = useState(true);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [showForm, setShowForm]     = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterField,  setFilterField]  = useState("all");
  const [search, setSearch]         = useState("");
  const [userEmail, setUserEmail]   = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isDemo, setIsDemo]         = useState(false);
  const tokenRef = useRef<string | null>(null);

  // ── Auth + demo: single effect so demo check short-circuits Supabase ────
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
    // Demo mode: skip Supabase entirely
    if (window.location.search.includes("demo=true")) {
      setIsDemo(true);
      setJobs(DEMO_JOBS);
      setUserEmail("demo");
      setAuthLoading(false);
      setLoading(false);
      return;
    }

    // Real auth
    const sb = getSupabase();
    sb.auth.getSession().then(({ data }) => {
      tokenRef.current = data.session?.access_token ?? null;
      setUserEmail(data.session?.user?.email ?? null);
      setAuthLoading(false);
      if (data.session) fetchJobs();
      else setLoading(false);
    });
    const { data: { subscription } } = sb.auth.onAuthStateChange((_, session) => {
      tokenRef.current = session?.access_token ?? null;
      setUserEmail(session?.user?.email ?? null);
      if (session) fetchJobs();
      else { setJobs([]); setLoading(false); }
    });
    return () => subscription.unsubscribe();
  }, [fetchJobs]);

  // ── Handlers ─────────────────────────────────────────────────────────────
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
    if (isDemo) {
      setJobs((prev) => prev.filter((j) => j.id !== id));
      return;
    }
    const res = await fetch(`/api/jobs/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${tokenRef.current ?? ""}` },
    });
    if (res.ok) setJobs((prev) => prev.filter((j) => j.id !== id));
  };

  const handleEdit = (job: Job) => { setEditingJob(job); setShowForm(true); };

  const handleTimelineChange = async (id: string, stages: JobStages) => {
    setJobs((prev) =>
      prev.map((j) => (j.id === id ? { ...j, stages, updated_at: new Date().toISOString() } : j))
    );
    if (isDemo) return; // local-only in demo
    await fetch(`/api/jobs/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokenRef.current ?? ""}` },
      body: JSON.stringify({ stages }),
    });
  };

  const handleLogout = () => {
    if (isDemo) { window.location.href = "/"; return; }
    getSupabase().auth.signOut();
  };

  // ── Filtering ─────────────────────────────────────────────────────────────
  const safe = (j: Job) => j.stages?.length ? j.stages : DEFAULT_STAGES;

  const uniqueFields = Array.from(
    new Set(jobs.map((j) => j.field).filter(Boolean) as string[])
  ).sort();

  const statusFilters = [
    { value: "all",       label: t.all,       count: jobs.length },
    { value: "active",    label: t.active,    count: jobs.filter((j) => isJobActive(safe(j))).length },
    { value: "interview", label: t.interview, count: jobs.filter((j) => hasInterview(safe(j))).length },
    { value: "offer",     label: t.offer,     count: jobs.filter((j) => hasOffer(safe(j))).length },
    { value: "rejected",  label: t.rejected,  count: jobs.filter((j) => !isJobActive(safe(j)) && !hasOffer(safe(j))).length },
  ];

  const filteredJobs = (() => {
    let list = jobs;
    if (filterStatus === "active")    list = list.filter((j) => isJobActive(safe(j)));
    if (filterStatus === "interview") list = list.filter((j) => hasInterview(safe(j)));
    if (filterStatus === "offer")     list = list.filter((j) => hasOffer(safe(j)));
    if (filterStatus === "rejected")  list = list.filter((j) => !isJobActive(safe(j)) && !hasOffer(safe(j)));
    if (filterField  !== "all")       list = list.filter((j) => j.field === filterField);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((j) =>
        j.company_name.toLowerCase().includes(q) || j.role.toLowerCase().includes(q)
      );
    }
    return list;
  })();

  // ── Render ────────────────────────────────────────────────────────────────
  if (authLoading) {
    return (
      <div style={{ minHeight: "100svh", display: "grid", placeItems: "center" }}>
        <div style={{
          width: 36, height: 36, borderRadius: "50%",
          border: "3px solid var(--accent-soft)",
          borderTopColor: "var(--accent)",
          animation: "spin 0.8s linear infinite",
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!userEmail) return <AuthForm />;

  const avatarLetter = isDemo ? "D" : userEmail[0].toUpperCase();

  return (
    <>
      {/* Demo mode banner */}
      {isDemo && (
        <div className="demo-banner">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M5 3l14 9-14 9V3z" fill="currentColor"/>
          </svg>
          מצב הדגמה — השינויים אינם נשמרים
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/" className="demo-banner-exit">יציאה מהדמו ←</a>
        </div>
      )}

      <header className="header">
        <div className="header-inner">
          <div className="brand">
            <div className="brand-mark">{lang === "he" ? "מ" : "JT"}</div>
            <div>
              <div className="brand-name">{t.brand}</div>
              <div className="brand-sub">{t.sub}</div>
            </div>
          </div>

          <div style={{ flex: 1 }} />

          {!isDemo && <AiTips jobs={jobs} />}

          <button
            onClick={() => { setEditingJob(null); setShowForm(true); }}
            className="btn btn-primary"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M8 2v12M2 8h12" stroke="white" strokeWidth="2.4" strokeLinecap="round"/>
            </svg>
            {t.add}
          </button>

          <div className="user-pill">
            <div className="avatar">{avatarLetter}</div>
            <span style={{ maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {isDemo ? "Demo" : userEmail}
            </span>
            <button className="logout-btn" onClick={handleLogout}>{t.logout}</button>
          </div>
        </div>
      </header>

      <main className="container" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <StatsBar jobs={jobs} t={t} lang={lang} />

        <div className="filter-bar">
          {statusFilters.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilterStatus(f.value)}
              className={`chip ${filterStatus === f.value ? "active" : ""}`}
            >
              {f.label}
              <span className="count">({f.count})</span>
            </button>
          ))}

          {uniqueFields.length > 0 && (
            <div className="select-wrap" style={{ marginInlineStart: 4 }}>
              <select value={filterField} onChange={(e) => setFilterField(e.target.value)}>
                <option value="all">{t.allFields}</option>
                {uniqueFields.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>
          )}

          <div className="filter-spacer" />

          <div className="search">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
              <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <input
              placeholder={t.searchPh}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "64px 0", gap: 14 }}>
            <div style={{
              width: 36, height: 36, borderRadius: "50%",
              border: "3px solid var(--accent-soft)",
              borderTopColor: "var(--accent)",
              animation: "spin 0.8s linear infinite",
            }} />
            <p style={{ color: "var(--ink-3)" }}>{t.loading}</p>
          </div>
        ) : view === "cards" ? (
          <CardsView
            jobs={filteredJobs}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onTimelineChange={handleTimelineChange}
            t={t}
            lang={lang}
          />
        ) : view === "kanban" ? (
          <KanbanView
            jobs={filteredJobs}
            onEdit={handleEdit}
            onTimelineChange={handleTimelineChange}
            t={t}
            lang={lang}
          />
        ) : (
          <JobTable
            jobs={filteredJobs}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onTimelineChange={handleTimelineChange}
            t={t}
            lang={lang}
          />
        )}
      </main>

      {showForm && (
        <JobForm
          job={editingJob}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditingJob(null); }}
          isDemo={isDemo}
        />
      )}

      <TweaksPanel />

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}
