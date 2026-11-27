import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { Phone } from "../components/shell";
import { Brand } from "../components/visuals";
import { useStore } from "../data/store";
import { ageYears, isMinor, needsParentConsent } from "../lib/age";
import { completeOnboarding } from "../lib/supabase";

export function OnboardingScreen() {
  const navigate = useNavigate();
  const { toast } = useStore();
  const { configured, session } = useAuth();
  const [birthDate, setBirthDate] = useState("");
  const [parentApproved, setParentApproved] = useState(false);
  const [busy, setBusy] = useState(false);
  const under16 = birthDate ? needsParentConsent(birthDate) : false;
  const minor = birthDate ? isMinor(birthDate) : false;

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!birthDate) {
      toast("בחרו תאריך לידה");
      return;
    }
    if (birthDate > new Date().toISOString().slice(0, 10)) {
      toast("תאריך הלידה צריך להיות בעבר");
      return;
    }
    if (under16 && !parentApproved) {
      toast("מתחת לגיל 16 צריך לסמן שאישור הורה התקבל");
      return;
    }
    setBusy(true);
    const result = await completeOnboarding(birthDate, parentApproved);
    setBusy(false);
    if (!result.configured) {
      toast("תאריך הלידה נשמר רק לתצוגה. בלי Supabase הדמו לא משתנה.");
      navigate("/");
      return;
    }
    if (result.error) {
      toast(result.error);
      return;
    }
    toast("החשבון מוכן");
    navigate("/");
  }

  return (
    <Phone screen="onboarding" nav={false}>
      <header className="topbar center"><Brand /></header>
      <div className="page-title">
        <h1>תאריך לידה</h1>
        <p className="sub">חובה. בני נוער יכולים להמשיך. אין כאן שער גיל 18.</p>
      </div>
      <form className="form" onSubmit={onSubmit}>
        <label className="field" data-field="birth_date">תאריך לידה
          <input type="date" value={birthDate} max={new Date().toISOString().slice(0, 10)} onChange={(event) => setBirthDate(event.target.value)} required />
        </label>
        {birthDate && (
          <p className="help">
            גיל {ageYears(birthDate)}
            {minor ? " · קטין" : " · בגיר"}
          </p>
        )}
        {under16 && (
          <label className="check-row">
            <input type="checkbox" checked={parentApproved} onChange={(event) => setParentApproved(event.target.checked)} />
            <span>הורה או אפוטרופוס אישר את השימוש. זה סימון זמני עד שיהיה אימות הורה אמיתי.</span>
          </label>
        )}
        <div className="note-card">
          <p>לקטין לא מוצגים לאחרים טלפון או מיקום מדויק, רק אזור. אין שיחה פרטית עם בגיר. צ'אט נפתח רק אם שניכם אושרתם לאותה פעילות.</p>
        </div>
        {!configured && <p className="help">בלי חיבור Supabase הטופס לא נשלח לשרת.</p>}
        {configured && !session && <p className="help">צריך קודם להיכנס עם Google כדי לשמור את התאריך בשרת.</p>}
        <button className="btn primary" type="submit" disabled={busy}>{busy ? "שומר…" : "המשך"}</button>
      </form>
    </Phone>
  );
}
