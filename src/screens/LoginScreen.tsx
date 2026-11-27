import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { Phone } from "../components/shell";
import { Brand } from "../components/visuals";
import { useStore } from "../data/store";
import { signInWithGoogle, signOut } from "../lib/supabase";

export function LoginScreen() {
  const navigate = useNavigate();
  const { toast } = useStore();
  const { configured, session } = useAuth();
  const [busy, setBusy] = useState(false);

  async function onGoogle() {
    setBusy(true);
    const result = await signInWithGoogle();
    setBusy(false);
    if (!result.configured) {
      toast("גוגל יחובר כשיהיו כתובת ומפתח של Supabase. הדמו נשאר על נתוני הדמה.");
      return;
    }
    if (result.error) toast(result.error);
  }

  return (
    <Phone screen="login" nav={false}>
      <header className="topbar center">
        <Brand />
      </header>
      <div className="page-title center">
        <h1>כניסה</h1>
        <p className="sub">כניסה עם חשבון Google. בלי קוד SMS.</p>
      </div>
      <div className="note-card">
        <p>בני נוער יכולים להירשם. אחרי הכניסה נבקש תאריך לידה. מתחת לגיל 16 צריך לסמן שאישור הורה התקבל.</p>
      </div>
      <div className="form">
        <button type="button" className="btn google" disabled={busy} onClick={onGoogle}>
          <GoogleMark />
          המשך עם Google
        </button>
        {!configured && <p className="help">בגרסת הדגמה הזו אין עדיין פרויקט Supabase, ואפשר להמשיך בלי חשבון.</p>}
        {session && (
          <button type="button" className="btn" onClick={() => signOut().then(() => toast("יצאתם מהחשבון"))}>
            יציאה
          </button>
        )}
        <button type="button" className="btn" onClick={() => navigate("/")}>המשך לדמו</button>
        <button type="button" className="text-btn" onClick={() => navigate("/onboarding")}>לתצוגת תאריך הלידה</button>
      </div>
    </Phone>
  );
}

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      <path fill="#4285F4" d="M17.6 9.2c0-.6-.1-1.2-.2-1.8H9v3.4h4.8a4.1 4.1 0 0 1-1.8 2.7v2.2h2.9c1.7-1.6 2.7-3.9 2.7-6.5z" />
      <path fill="#34A853" d="M9 18c2.4 0 4.5-.8 6-2.2l-2.9-2.2c-.8.6-1.9.9-3.1.9-2.4 0-4.4-1.6-5.1-3.8H.9v2.3A9 9 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.9 10.7A5.4 5.4 0 0 1 3.6 9c0-.6.1-1.2.3-1.7V5H.9A9 9 0 0 0 0 9c0 1.4.3 2.8.9 4l3-2.3z" />
      <path fill="#EA4335" d="M9 3.6c1.3 0 2.5.5 3.4 1.3l2.6-2.6A9 9 0 0 0 .9 5l3 2.3C4.6 5.2 6.6 3.6 9 3.6z" />
    </svg>
  );
}
