import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Icon } from "../components/icons";
import { Overlay, Phone } from "../components/shell";
import { Brand, Cover, LetterAvatar } from "../components/visuals";
import { useMe, useStore } from "../data/store";
import { canAccessChat, isFinished, profileById } from "../data/logic";
import { CURRENT_USER_ID } from "../data/types";
import { formatWhen } from "../lib/format";
import { mapsLinks } from "../lib/links";

type Tab = "joined" | "organizing" | "requests";
type When = "upcoming" | "history";

export function MyActivitiesScreen() {
  const navigate = useNavigate();
  const me = useMe();
  const store = useStore();
  const { state, toast } = store;
  const [tab, setTab] = useState<Tab>("joined");
  const [when, setWhen] = useState<When>("upcoming");
  const [navFor, setNavFor] = useState<string | null>(null);
  const [cancelId, setCancelId] = useState<string | null>(null);

  const pendingInvites = state.invitations.filter((i) => i.recipient_id === CURRENT_USER_ID && i.status === "pending");
  const incoming = state.participations.filter((p) => {
    if (p.status !== "pending") return false;
    const activity = state.activities.find((a) => a.id === p.activity_id);
    return activity?.owner_id === CURRENT_USER_ID;
  });
  const badge = pendingInvites.length + incoming.length;

  const joined = state.activities.filter((activity) => {
    const row = state.participations.find((p) => p.activity_id === activity.id && p.user_id === CURRENT_USER_ID && (p.status === "approved" || p.status === "needs_reconfirm"));
    if (!row) return false;
    const past = isFinished(activity);
    return when === "history" ? past : !past;
  });

  const organizing = [
    ...state.drafts.filter((d) => d.owner_id === CURRENT_USER_ID).map((d) => ({ kind: "draft" as const, draft: d })),
    ...state.activities
      .filter((a) => a.owner_id === CURRENT_USER_ID && a.status !== "draft")
      .filter((a) => (when === "history" ? isFinished(a) || a.status === "cancelled" : !isFinished(a) && a.status === "published"))
      .map((activity) => ({ kind: "activity" as const, activity })),
  ];

  const navActivity = state.activities.find((a) => a.id === navFor);

  return (
    <Phone
      screen="my"
      overlay={
        <>
          {navActivity && (
            <Overlay title="ניווט לנקודת המפגש" onClose={() => setNavFor(null)}>
              <div className="menu-list">
                <a className="btn" href={mapsLinks(navActivity.location.lat, navActivity.location.lon).google} target="_blank" rel="noopener noreferrer">Google Maps</a>
                <a className="btn" href={mapsLinks(navActivity.location.lat, navActivity.location.lon).waze} target="_blank" rel="noopener noreferrer">Waze</a>
              </div>
              <p className="fine">הקישור נבנה מהקואורדינטות שנשמרו.</p>
            </Overlay>
          )}
          {cancelId && (
            <Overlay title="ביטול השתתפות" onClose={() => setCancelId(null)}>
              <p>לבטל את ההשתתפות? המקום יתפנה והמארגן יקבל עדכון.</p>
              <div className="btn-row">
                <button
                  type="button"
                  className="btn primary"
                  onClick={() => {
                    const result = store.cancelParticipation(cancelId);
                    setCancelId(null);
                    if (result.error) toast(result.error);
                    else toast("ההשתתפות בוטלה");
                  }}
                >
                  אישור הביטול
                </button>
                <button type="button" className="btn" onClick={() => setCancelId(null)}>השארה</button>
              </div>
            </Overlay>
          )}
        </>
      }
    >
      <header className="topbar">
        <div className="me-chip">
          <LetterAvatar letter={me.display_name.slice(0, 1)} />
          <span>{me.display_name}</span>
        </div>
        <Brand />
        <Link to="/notifications" className="icon-btn" aria-label="התראות">
          <Icon name="bell" />
        </Link>
      </header>
      <div className="head-row">
        <h1>הפעילויות שלי</h1>
        <button type="button" className="btn primary" onClick={() => navigate("/publish/1")}>
          <Icon name="plus" size={16} />
          פרסום פעילות
        </button>
      </div>
      <div className="tabs" role="tablist">
        <button type="button" className={tab === "joined" ? "on" : ""} onClick={() => setTab("joined")}>אני משתתף</button>
        <button type="button" className={tab === "organizing" ? "on" : ""} onClick={() => setTab("organizing")}>אני מארגן</button>
        <button type="button" className={tab === "requests" ? "on" : ""} onClick={() => setTab("requests")}>
          בקשות והזמנות
          {badge > 0 && <span className="tab-badge">{badge}</span>}
        </button>
      </div>
      {tab !== "requests" && (
        <div className="subtabs">
          <button type="button" className={when === "upcoming" ? "on" : ""} onClick={() => setWhen("upcoming")}>קרובות</button>
          <button type="button" className={when === "history" ? "on" : ""} onClick={() => setWhen("history")}>היסטוריה</button>
        </div>
      )}
      {tab === "joined" && pendingInvites.length > 0 && when === "upcoming" && (
        <div className="invite-banner">
          <span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
            <Icon name="mail" size={18} />
            ממתינות לך {pendingInvites.length} הזמנות
          </span>
          <button type="button" onClick={() => setTab("requests")}>
            לצפייה
            <Icon name="chevron" size={16} />
          </button>
        </div>
      )}
      {tab === "joined" && (
        joined.length === 0 ? (
          <div className="empty"><h3>{when === "history" ? "אין עדיין היסטוריה" : "עוד לא הצטרפתם לפעילות"}</h3><p>אפשר למצוא מפגש במסך הבית או בגילוי.</p></div>
        ) : (
          <div className="stack">
            {joined.map((activity) => {
              const owner = profileById(state, activity.owner_id);
              const chat = canAccessChat(state, activity.id, CURRENT_USER_ID);
              return (
                <article key={activity.id} className="card" data-activity-id={activity.id}>
                  <div className="my-top">
                    <Cover sport={activity.sport_id} className="my-thumb" />
                    <div className="my-body">
                      <span className="badge"><Icon name="check" size={14} />הצטרפותך אושרה</span>
                      <h3>{activity.title}</h3>
                      <div className="meta"><Icon name="calendar" size={14} /> {formatWhen(activity.starts_at, new Date(), "comma")}</div>
                      <div className="meta">{activity.location.address}</div>
                      <div className="meta">בהובלת {owner?.display_name}</div>
                    </div>
                  </div>
                  <div className="btn-row">
                    <Link className="btn" to={`/activity/${activity.id}`}><Icon name="info" size={16} />פרטים</Link>
                    {chat && <Link className="btn" to={`/activity/${activity.id}/chat`} data-testid="chat-entry"><Icon name="chat" size={16} />צ'אט</Link>}
                    <button type="button" className="btn" onClick={() => setNavFor(activity.id)}><Icon name="send" size={16} />ניווט</button>
                  </div>
                  {when === "upcoming" && (
                    <button type="button" className="linkish" onClick={() => setCancelId(activity.id)}>ביטול השתתפות</button>
                  )}
                </article>
              );
            })}
          </div>
        )
      )}
      {tab === "organizing" && (
        organizing.length === 0 ? (
          <div className="empty"><h3>אין כאן פעילויות</h3><p>טיוטה לא מופיעה בחיפוש ולא בפרופיל הציבורי.</p></div>
        ) : (
          <div className="stack">
            {organizing.map((item) => item.kind === "draft" ? (
              <article key={item.draft.id} className="card">
                <span className="badge">טיוטה</span>
                <h3>{item.draft.title || "טיוטה בלי כותרת"}</h3>
                <button type="button" className="btn primary" style={{ marginTop: 10 }} onClick={() => navigate(`/publish/${item.draft.last_step}`)}>המשך עריכה</button>
              </article>
            ) : (
              <article key={item.activity.id} className="card">
                <div className="my-top">
                  <Cover sport={item.activity.sport_id} className="my-thumb" />
                  <div className="my-body">
                    <span className="badge">{item.activity.status === "cancelled" ? "בוטלה" : "פורסמה"}</span>
                    <h3>{item.activity.title}</h3>
                    <div className="meta">{formatWhen(item.activity.starts_at, new Date(), "comma")}</div>
                    <div className="meta">{item.activity.location.address}</div>
                  </div>
                </div>
                <Link className="btn primary" to={`/activity/${item.activity.id}`} style={{ marginTop: 10 }}>לניהול הפעילות</Link>
              </article>
            ))}
          </div>
        )
      )}
      {tab === "requests" && (
        <div className="stack">
          <h2 style={{ fontSize: 16 }}>הזמנות שקיבלתי</h2>
          {pendingInvites.length === 0 && <p className="meta">אין הזמנות ממתינות.</p>}
          {pendingInvites.map((invite) => {
            const activity = state.activities.find((a) => a.id === invite.activity_id);
            const sender = profileById(state, invite.sender_id);
            if (!activity) return null;
            return (
              <article key={invite.id} className="card">
                <h3>{activity.title}</h3>
                <div className="meta">מאת {sender?.display_name} · {formatWhen(activity.starts_at, new Date(), "comma")}</div>
                <div className="btn-row">
                  <button type="button" className="btn primary" onClick={() => {
                    const result = store.acceptInvitation(invite.id);
                    if (result.error) toast(result.error);
                    else toast("ההזמנה אושרה");
                  }}>אישור</button>
                  <button type="button" className="btn" onClick={() => { store.declineInvitation(invite.id); toast("ההזמנה נדחתה"); }}>דחייה</button>
                </div>
              </article>
            );
          })}
          <h2 style={{ fontSize: 16 }}>בקשות שנשלחו</h2>
          {state.participations.filter((p) => p.user_id === CURRENT_USER_ID && p.status === "pending").length === 0 && <p className="meta">אין בקשות ממתינות. בקשה לא תופסת מקום ולא פותחת צ'אט.</p>}
          <h2 style={{ fontSize: 16 }}>ממתינות לאישור שלי</h2>
          {incoming.length === 0 && <p className="meta">אין בקשות להצטרפות לפעילויות שלכם.</p>}
        </div>
      )}
    </Phone>
  );
}
