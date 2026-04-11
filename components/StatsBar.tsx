"use client";

import { Job, hasInterview, hasOffer, isJobActive, DEFAULT_STAGES } from "@/lib/supabase";

interface StatsBarProps {
  jobs: Job[];
}

export default function StatsBar({ jobs }: StatsBarProps) {
  const safe = (j: Job) => j.stages?.length ? j.stages : DEFAULT_STAGES;
  const total      = jobs.length;
  const interviews = jobs.filter((j) => hasInterview(safe(j))).length;
  const offers     = jobs.filter((j) => hasOffer(safe(j))).length;
  const conversionRate = total > 0 ? Math.round((interviews / total) * 100) : 0;

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const stale = jobs.filter(
    (j) => isJobActive(safe(j)) && new Date(j.updated_at) < sevenDaysAgo
  );

  return (
    <div className="space-y-4">
      {stale.length > 0 && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 flex items-start gap-3">
          <span className="text-2xl">⚠️</span>
          <div>
            <p className="font-semibold text-amber-800">
              תזכורת: {stale.length} מועמדות לא עודכנו מעל 7 ימים
            </p>
            <p className="text-sm text-amber-700 mt-1">
              {stale.map((j) => `${j.company_name} — ${j.role}`).join(" | ")}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="סה״כ מועמדויות" value={total} color="bg-blue-50 border-blue-200" textColor="text-blue-700" />
        <StatCard label="ראיונות" value={interviews} color="bg-purple-50 border-purple-200" textColor="text-purple-700" />
        <StatCard label="הצעות עבודה" value={offers} color="bg-green-50 border-green-200" textColor="text-green-700" />
        <StatCard label="אחוז המרה לראיון" value={`${conversionRate}%`} color="bg-orange-50 border-orange-200" textColor="text-orange-700" />
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
  textColor,
}: {
  label: string;
  value: string | number;
  color: string;
  textColor: string;
}) {
  return (
    <div className={`${color} border rounded-xl p-4 text-center`}>
      <p className={`text-3xl font-bold ${textColor}`}>{value}</p>
      <p className="text-sm text-slate-600 mt-1">{label}</p>
    </div>
  );
}
