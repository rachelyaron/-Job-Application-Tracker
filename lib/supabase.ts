import { createClient, SupabaseClient } from "@supabase/supabase-js";

let _supabase: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!_supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) throw new Error("Missing Supabase environment variables");
    _supabase = createClient(url, key);
  }
  return _supabase;
}

export const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    return getSupabase()[prop as keyof SupabaseClient];
  },
});

export type StageState = "completed" | "failed" | "not_reached";

export interface Stage {
  name: string;
  state: StageState;
}

export type JobStages = Stage[];

export const DEFAULT_STAGES: JobStages = [
  { name: "הגשתי מועמדות", state: "not_reached" },
  { name: "שיחת טלפון",    state: "not_reached" },
  { name: "ראיון HR",       state: "not_reached" },
  { name: "ראיון טכני",    state: "not_reached" },
  { name: "ראיון סופי",    state: "not_reached" },
  { name: "הצעה",           state: "not_reached" },
];

function cycleState(s: StageState): StageState {
  if (s === "not_reached") return "completed";
  if (s === "completed")   return "failed";
  return "not_reached";
}

/** Returns a new stages array after toggling stage at `idx`. */
export function applyStageClick(stages: JobStages, idx: number): JobStages {
  const next = cycleState(stages[idx].state);
  const updated = stages.map((s) => ({ ...s }));
  updated[idx].state = next;

  if (next === "completed") {
    // earlier not_reached → completed (had to pass them to get here)
    for (let i = 0; i < idx; i++) {
      if (updated[i].state === "not_reached") updated[i].state = "completed";
    }
  } else {
    // failed or reset — later stages can't be active
    for (let i = idx + 1; i < updated.length; i++) {
      updated[i].state = "not_reached";
    }
  }
  return updated;
}

// ── Stats helpers ──────────────────────────────────────────────────────────

export function isJobActive(stages: JobStages): boolean {
  return (
    !stages.some((s) => s.state === "failed") &&
    stages[stages.length - 1]?.state !== "completed"
  );
}

/** Any middle stage (not first, not last) completed → counted as interview. */
export function hasInterview(stages: JobStages): boolean {
  return stages.slice(1, stages.length - 1).some((s) => s.state === "completed");
}

export function hasOffer(stages: JobStages): boolean {
  return stages[stages.length - 1]?.state === "completed";
}

// ── Job types ──────────────────────────────────────────────────────────────

export interface Job {
  id: string;
  company_name: string;
  role: string;
  date_applied: string;
  field: string | null;
  stages: JobStages;
  job_link: string | null;
  cv_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type JobInsert = Omit<Job, "id" | "created_at" | "updated_at">;
export type JobUpdate = Partial<JobInsert>;
