"use client";

export default function AuthForm() {
  const handleDemo = () => {
    window.location.href = "/?demo=true";
  };

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-logo">📋</div>
        <h1 className="auth-title">מעקב מועמדויות</h1>
        <p className="auth-sub">נהל את חיפוש העבודה שלך</p>

        <p style={{
          marginTop: 24, marginBottom: 4,
          fontSize: 14, color: "var(--ink-2)",
          textAlign: "center", lineHeight: 1.6,
        }}>
          זוהי גרסת הדגמה — נסו את האפליקציה באופן חופשי
        </p>

        <button type="button" onClick={handleDemo} className="demo-btn">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
            <path d="M5 3l14 9-14 9V3z" fill="currentColor"/>
          </svg>
          כניסת דמו
        </button>
      </div>
    </div>
  );
}
