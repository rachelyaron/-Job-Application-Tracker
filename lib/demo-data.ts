import { Job } from "@/lib/supabase";

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}
function daysAgoISO(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

export const DEMO_JOBS: Job[] = [
  {
    id: "demo-1",
    user_id: "demo",
    company_name: "Google",
    role: "Senior Frontend Engineer",
    field: "טכנולוגיה",
    date_applied: daysAgo(21),
    stages: [
      { name: "הגשתי מועמדות", state: "completed" },
      { name: "שיחת טלפון",    state: "completed" },
      { name: "ראיון HR",       state: "completed" },
      { name: "ראיון טכני",    state: "completed" },
      { name: "ראיון סופי",    state: "not_reached" },
      { name: "הצעה",           state: "not_reached" },
    ],
    job_link: null,
    cv_url: null,
    notes: "ראיון סופי עם מנהל הצוות — מרגיש טוב!",
    created_at: daysAgoISO(21),
    updated_at: daysAgoISO(2),
  },
  {
    id: "demo-2",
    user_id: "demo",
    company_name: "Meta",
    role: "Product Manager",
    field: "ניהול מוצר",
    date_applied: daysAgo(14),
    stages: [
      { name: "הגשתי מועמדות", state: "completed" },
      { name: "שיחת טלפון",    state: "completed" },
      { name: "ראיון HR",       state: "completed" },
      { name: "ראיון טכני",    state: "not_reached" },
      { name: "ראיון סופי",    state: "not_reached" },
      { name: "הצעה",           state: "not_reached" },
    ],
    job_link: null,
    cv_url: null,
    notes: "אמרו שהתהליך לוקח 3–4 שבועות מרגע ה-HR",
    created_at: daysAgoISO(14),
    updated_at: daysAgoISO(4),
  },
  {
    id: "demo-3",
    user_id: "demo",
    company_name: "Wix",
    role: "Full Stack Developer",
    field: "טכנולוגיה",
    date_applied: daysAgo(8),
    stages: [
      { name: "הגשתי מועמדות", state: "completed" },
      { name: "שיחת טלפון",    state: "not_reached" },
      { name: "ראיון HR",       state: "not_reached" },
      { name: "ראיון טכני",    state: "not_reached" },
      { name: "ראיון סופי",    state: "not_reached" },
      { name: "הצעה",           state: "not_reached" },
    ],
    job_link: null,
    cv_url: null,
    notes: "נשלח קו״ח דרך LinkedIn — ממתין לתשובה",
    created_at: daysAgoISO(8),
    updated_at: daysAgoISO(8), // stale: not updated since apply
  },
  {
    id: "demo-4",
    user_id: "demo",
    company_name: "Lemonade",
    role: "Data Analyst",
    field: "נתונים ו-AI",
    date_applied: daysAgo(35),
    stages: [
      { name: "הגשתי מועמדות", state: "completed" },
      { name: "שיחת טלפון",    state: "completed" },
      { name: "ראיון HR",       state: "completed" },
      { name: "ראיון טכני",    state: "failed" },
      { name: "ראיון סופי",    state: "not_reached" },
      { name: "הצעה",           state: "not_reached" },
    ],
    job_link: null,
    cv_url: null,
    notes: "נפסלתי אחרי case study — אתחכם לפעם הבאה",
    created_at: daysAgoISO(35),
    updated_at: daysAgoISO(25),
  },
  {
    id: "demo-5",
    user_id: "demo",
    company_name: "Taboola",
    role: "Backend Engineer",
    field: "טכנולוגיה",
    date_applied: daysAgo(42),
    stages: [
      { name: "הגשתי מועמדות", state: "completed" },
      { name: "שיחת טלפון",    state: "completed" },
      { name: "ראיון HR",       state: "completed" },
      { name: "ראיון טכני",    state: "completed" },
      { name: "ראיון סופי",    state: "completed" },
      { name: "הצעה",           state: "completed" },
    ],
    job_link: null,
    cv_url: null,
    notes: "קיבלתי הצעה! 340K + אופציות",
    created_at: daysAgoISO(42),
    updated_at: daysAgoISO(5),
  },
];
