"use client";

import { useState } from "react";
import { Job } from "@/lib/supabase";

interface AiTipsProps {
  jobs: Job[];
}

export default function AiTips({ jobs }: AiTipsProps) {
  const [tips, setTips] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);

  const fetchTips = async () => {
    setLoading(true);
    setError("");
    setTips("");
    setOpen(true);
    try {
      const res = await fetch("/api/ai-tips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobs }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "שגיאה בקבלת עצות");
      }
      const data = await res.json();
      setTips(data.tips);
    } catch (err) {
      setError(err instanceof Error ? err.message : "שגיאה לא ידועה");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={fetchTips}
        disabled={loading || jobs.length === 0}
        className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 disabled:opacity-50 text-white font-semibold px-5 py-2.5 rounded-xl transition-all flex items-center gap-2 shadow-sm"
        title={jobs.length === 0 ? "הוסף מועמדויות תחילה" : ""}
      >
        <span>✨</span>
        <span>{loading ? "מנתח..." : "טיפים מ-AI"}</span>
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <span>✨</span> המלצות AI לשיפור החיפוש
              </h2>
              <button
                onClick={() => setOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-2xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {loading && (
                <div className="flex items-center justify-center py-12">
                  <div className="w-10 h-10 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
                  <p className="mr-4 text-slate-600">מנתח את המועמדויות שלך...</p>
                </div>
              )}
              {error && (
                <p className="text-red-600 bg-red-50 border border-red-200 rounded-lg p-4">
                  {error}
                </p>
              )}
              {tips && (
                <div className="prose prose-slate max-w-none text-slate-700 whitespace-pre-line leading-relaxed">
                  {tips}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
