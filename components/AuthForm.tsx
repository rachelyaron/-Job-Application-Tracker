"use client";

import { useState } from "react";
import { getSupabase } from "@/lib/supabase";

export default function AuthForm() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    const sb = getSupabase();
    try {
      if (mode === "login") {
        const { error } = await sb.auth.signInWithPassword({ email, password });
        if (error) throw error;
        // onAuthStateChange in page.tsx handles the transition
      } else {
        const { error } = await sb.auth.signUp({ email, password });
        if (error) throw error;
        setMessage("נשלח אליך אימייל אישור. אשר את הכתובת ואז התחבר.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "שגיאה לא ידועה";
      // Translate common Supabase error messages
      if (msg.includes("Invalid login credentials")) setError("אימייל או סיסמה שגויים");
      else if (msg.includes("Email not confirmed")) setError("יש לאשר את האימייל תחילה");
      else if (msg.includes("User already registered")) setError("כתובת האימייל כבר רשומה");
      else if (msg.includes("Password should be at least")) setError("הסיסמה חייבת להכיל לפחות 6 תווים");
      else setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4" dir="rtl">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <p className="text-5xl mb-3">📋</p>
          <h1 className="text-2xl font-bold text-slate-800">מעקב מועמדויות</h1>
          <p className="text-slate-500 text-sm mt-1">נהל את חיפוש העבודה שלך</p>
        </div>

        {/* Login / Signup toggle */}
        <div className="flex rounded-xl bg-slate-100 p-1 mb-6">
          <button
            type="button"
            onClick={() => { setMode("login"); setError(""); setMessage(""); }}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
              mode === "login" ? "bg-white shadow-sm text-slate-800" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            התחברות
          </button>
          <button
            type="button"
            onClick={() => { setMode("signup"); setError(""); setMessage(""); }}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
              mode === "signup" ? "bg-white shadow-sm text-slate-800" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            הרשמה
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-3">
              {error}
            </div>
          )}
          {message && (
            <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl p-3">
              {message}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">אימייל</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              className="input w-full"
              dir="ltr"
              autoComplete="email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">סיסמה</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="לפחות 6 תווים"
              className="input w-full"
              dir="ltr"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl transition-colors mt-2"
          >
            {loading ? "..." : mode === "login" ? "התחבר" : "הירשם"}
          </button>
        </form>
      </div>
    </div>
  );
}
