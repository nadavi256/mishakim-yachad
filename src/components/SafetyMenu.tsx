import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useStore } from "../data/store";
import type { Report } from "../data/types";
import { Overlay } from "./shell";

function InPhone({ children }: { children: ReactNode }) {
  const [host, setHost] = useState<HTMLElement | null>(null);
  useEffect(() => {
    setHost(document.querySelector<HTMLElement>(".phone"));
  }, []);
  if (!host) return null;
  return createPortal(children, host);
}

export function SafetyMenu({
  reportTitle,
  subjectType,
  subjectId,
  blockUserId,
  autoOpenReport,
}: {
  reportTitle: string;
  subjectType: Report["subject_type"];
  subjectId: string;
  blockUserId?: string;
  autoOpenReport?: string | null;
}) {
  const { report, blockUser } = useStore();
  const [mode, setMode] = useState<"report" | "block" | null>(null);
  useEffect(() => {
    if (autoOpenReport) setMode("report");
  }, [autoOpenReport]);
  const [reason, setReason] = useState("תוכן לא הולם");

  return (
    <>
      <div className="btn-row">
        <button type="button" className="btn" onClick={() => setMode("report")}>דיווח</button>
        {blockUserId && (
          <button type="button" className="btn" onClick={() => setMode("block")}>חסימה</button>
        )}
      </div>
      {mode === "report" && (
        <InPhone>
          <Overlay title={reportTitle} onClose={() => setMode(null)}>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                report({ subject_type: subjectType, subject_id: subjectId, reason, details: "" });
                setMode(null);
              }}
            >
              <label className="field">סיבה
                <select value={reason} onChange={(event) => setReason(event.target.value)}>
                  <option>תוכן לא הולם</option>
                  <option>הטרדה</option>
                  <option>פרטים אישיים שפורסמו</option>
                  <option>אחר</option>
                </select>
              </label>
              <p className="help">הדיווח נשמר אצלכם. אין כאן מספר טלפון או כתובת בית.</p>
              <button className="btn primary block" type="submit" style={{ marginTop: 8 }}>שליחת דיווח</button>
            </form>
          </Overlay>
        </InPhone>
      )}
      {mode === "block" && blockUserId && (
        <InPhone>
          <Overlay title="חסימה" onClose={() => setMode(null)}>
            <p>אחרי החסימה לא תראו זה את זה ולא תוכלו לשלוח הודעות אחד לשני.</p>
            <p className="help">אין שיחה פרטית בין קטין לבגיר. צ'אט קיים רק בתוך פעילות ששניכם אושרתם אליה.</p>
            <button
              type="button"
              className="btn primary block"
              style={{ marginTop: 8 }}
              onClick={() => {
                blockUser(blockUserId);
                setMode(null);
              }}
            >
              אישור חסימה
            </button>
          </Overlay>
        </InPhone>
      )}
    </>
  );
}
