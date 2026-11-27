import { useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Icon } from "../components/icons";
import { Overlay, Phone } from "../components/shell";
import { Avatar, Brand, Cover, ParkMap, SportBadge } from "../components/visuals";
import { useMe, useStore } from "../data/store";
import { approvedCount, canAccessChat, profileById } from "../data/logic";
import { sportName } from "../data/sports";
import { CURRENT_USER_ID } from "../data/types";
import { LEVEL_LABEL, costLabel, dayLabel, durationLabel, formatTime } from "../lib/format";
import { activityShareUrl, mapsLinks } from "../lib/links";

export function ActivityScreen() {
  const { id = "" } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const me = useMe();
  const store = useStore();
  const { state, toast } = store;
  const activity = state.activities.find((a) => a.id === id);
  const [reportOpen, setReportOpen] = useState(false);
  const [reason, setReason] = useState("תוכן לא הולם");
  const [cancelOpen, setCancelOpen] = useState(false);
  if (!activity || (activity.status === "draft" && activity.owner_id !== me.user_id)) {
    return (
      <Phone screen="activity" nav={false}>
        <div className="empty"><h2>הפעילות לא נמצאה</h2><Link to="/" className="btn primary">חזרה לבית</Link></div>
      </Phone>
    );
  }
  const owner = profileById(state, activity.owner_id);
  const mine = state.participations.find((p) => p.activity_id === activity.id && p.user_id === CURRENT_USER_ID);
  const isOwner = activity.owner_id === CURRENT_USER_ID;
  const approved = mine?.status === "approved" || mine?.status === "needs_reconfirm";
  const pending = mine?.status === "pending";
  const chat = canAccessChat(state, activity.id, CURRENT_USER_ID);
  const saved = state.savedActivityIds.includes(activity.id);
  const count = approvedCount(state, activity.id);
  const links = mapsLinks(activity.location.lat, activity.location.lon);
  const cap = activity.capacity == null ? "ללא הגבלת משתתפים" : `מתוך ${activity.capacity}`;
  const justPublished = params.get("published") === "1";

  async function share() {
    const url = activityShareUrl(activity!.id);
    try {
      await navigator.clipboard.writeText(url);
      toast("הקישור הועתק");
    } catch {
      toast(url);
    }
  }

  return (
    <Phone
      screen="activity"
      nav={false}
      overlay={
        <>
          {reportOpen && (
            <Overlay title="דיווח על פעילות" onClose={() => setReportOpen(false)}>
              <form onSubmit={(event) => { event.preventDefault(); store.report({ subject_type: "activity", subject_id: activity.id, reason, details: "" }); setReportOpen(false); }}>
                <label className="field">סיבה<input value={reason} onChange={(e) => setReason(e.target.value)} /></label>
                <button className="btn primary block" type="submit" style={{ marginTop: 8 }}>שליחה</button>
              </form>
            </Overlay>
          )}
          {cancelOpen && (
            <Overlay title="ביטול הפעילות" onClose={() => setCancelOpen(false)}>
              <p>הפעילות תסומן כמבוטלת ולא תקבל נרשמים חדשים. אין כאן החזר כספי.</p>
              <button type="button" className="btn primary block" style={{ marginTop: 8 }} onClick={() => { store.cancelActivity(activity.id); setCancelOpen(false); toast("הפעילות בוטלה"); }}>אישור הביטול</button>
            </Overlay>
          )}
        </>
      }
    >
      <header className="topbar">
        <button type="button" className="icon-btn" aria-label="חזרה" onClick={() => navigate(-1)}><Icon name="back" /></button>
        <Brand />
        <button type="button" className="icon-btn" aria-pressed={saved} onClick={() => { store.toggleBookmark(activity.id); toast(saved ? "השמירה הוסרה" : "הפעילות נשמרה. זו לא הרשמה."); }} style={{ flexDirection: "column", height: "auto", width: 56, fontSize: 11, fontWeight: 800 }}>
          <Icon name={saved ? "bookmarkFill" : "bookmark"} />
          שמירה
        </button>
      </header>
      {justPublished && <div className="success">הפעילות פורסמה. אפשר לשתף את הקישור עם מי שתרצו.</div>}
      {activity.status === "cancelled" && <div className="success" style={{ background: "#fdecec", color: "#a12828" }}>הפעילות בוטלה. אי אפשר להצטרף.</div>}
      <div className="detail-hero">
        <div style={{ flex: 1 }}>
          <span className="chip-tag"><SportBadge sport={activity.sport_id} size={18} />{sportName(activity.sport_id)}</span>
          <h1>{activity.title}</h1>
          <p className="sub">{activity.subtitle}</p>
        </div>
        <Cover sport={activity.sport_id} />
      </div>
      {owner && (
        <div className="organizer">
          <Avatar id={owner.avatar} size={48} />
          <div className="who">
            <strong>{owner.display_name}</strong>
            <div className="meta">{owner.pronoun === "f" ? "מארגנת הפעילות" : "מארגן הפעילות"}</div>
          </div>
          <Link to={`/u/${owner.user_id}`} className="text-btn">לפרופיל <Icon name="chevron" size={14} /></Link>
        </div>
      )}
      <div className="stats">
        <div className="stat"><Icon name="calendar" /><b>{dayLabel(activity.starts_at)}</b><small dir="ltr">{formatTime(activity.starts_at)}</small></div>
        <div className="stat"><Icon name="clock" /><b>משך משוער</b><small>{durationLabel(activity.duration_minutes)}</small></div>
        <div className="stat"><Icon name="chart" /><b>{LEVEL_LABEL[activity.level]}</b></div>
        <div className="stat"><Icon name="coin" /><b>{costLabel(activity.cost_amount)}</b></div>
      </div>
      <div className="enrolled"><Icon name="people" size={18} />{count} נרשמו · {cap}</div>
      {activity.cost_amount > 0 && <p className="fine">{activity.payment_note}</p>}
      <section className="block">
        <h2><Icon name="pin" />איפה נפגשים?</h2>
        <strong>{activity.location.place_name}</strong>
        <div className="meta">{activity.location.address}</div>
        {activity.location.meeting_note && <p className="meta">{activity.location.meeting_note}</p>}
        <ParkMap pinX={62} pinY={58} label="רחוב הדוגמה" />
        <div className="btn-row">
          <a className="btn" href={links.waze} target="_blank" rel="noopener noreferrer">ניווט ב-Waze</a>
          <a className="btn" href={links.google} target="_blank" rel="noopener noreferrer">Google Maps</a>
        </div>
      </section>
      <section className="block">
        <p>{activity.description}</p>
        <p className="fine"><Icon name="info" size={14} /> הכתובת להמחשה בלבד</p>
      </section>
      <div className="cta-panel">
        {isOwner && (
          <>
            <button type="button" className="btn primary xl" onClick={share}><span>שיתוף קישור לפעילות<small>לניהול — אתם המארגנים</small></span><Icon name="share" /></button>
            {chat && <Link className="btn" to={`/activity/${activity.id}/chat`} data-testid="chat-entry" style={{ marginTop: 8 }}>פתיחת צ'אט</Link>}
            {activity.status === "published" && <button type="button" className="linkish" onClick={() => setCancelOpen(true)}>ביטול הפעילות</button>}
          </>
        )}
        {!isOwner && approved && (
          <Link className="btn primary xl" to={`/activity/${activity.id}/chat`} data-testid="chat-entry">
            <span>הצטרפתם לפעילות<small>פתיחת צ'אט</small></span>
            <Icon name="people" />
          </Link>
        )}
        {!isOwner && pending && <div className="success">הבקשה נשלחה וממתינה לאישור. אין עדיין מקום שמור ואין צ'אט.</div>}
        {!isOwner && !approved && !pending && activity.status === "published" && (
          <button
            type="button"
            className="btn primary xl"
            onClick={() => {
              const result = store.join(activity.id);
              if (result.error) toast(result.error);
              else if (result.status === "pending") toast("הבקשה נשלחה למארגן");
              else toast("הצטרפתם. אפשר לפתוח את הצ'אט");
            }}
          >
            <span>
              {activity.join_policy === "approval" ? "בקשת הצטרפות" : "הצטרפות לפעילות"}
              <small>{activity.join_policy === "approval" ? "המארגן צריך לאשר" : "הצטרפות מיידית"}</small>
            </span>
            <Icon name="people" />
          </button>
        )}
        <button type="button" className="linkish" onClick={() => setReportOpen(true)}>דיווח על הפעילות</button>
      </div>
    </Phone>
  );
}

export function ChatScreen() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { state, sendMessage, toast } = useStore();
  const [text, setText] = useState("");
  const activity = state.activities.find((a) => a.id === id);
  const allowed = activity ? canAccessChat(state, activity.id, CURRENT_USER_ID) : false;
  const messages = state.messages.filter((m) => m.activity_id === id);
  return (
    <Phone screen="chat" nav={false} cta={allowed ? (
      <form className="composer" onSubmit={(event) => {
        event.preventDefault();
        const result = sendMessage(id, text);
        if (result.error) toast(result.error);
        else setText("");
      }}>
        <input value={text} onChange={(event) => setText(event.target.value)} placeholder="הודעה לקבוצה" maxLength={2000} />
        <button type="submit">שליחה</button>
      </form>
    ) : undefined}>
      <button type="button" className="back-link" onClick={() => navigate(-1)}><Icon name="back" size={18} />חזרה</button>
      <div className="page-title"><h1>צ'אט</h1><p className="sub">{activity?.title}</p></div>
      {!allowed && (
        <div className="empty">
          <h2>הצ'אט סגור</h2>
          <p>הצ'אט פתוח רק למארגן ולמשתתפים שאושרו. בקשה ממתינה לא פותחת אותו, ואין כאן מספרי טלפון.</p>
        </div>
      )}
      {allowed && (
        <div className="chat-list">
          {messages.map((message) => {
            const sender = profileById(state, message.sender_id);
            const mine = message.sender_id === CURRENT_USER_ID;
            return (
              <div key={message.id} className={`bubble${mine ? " mine" : ""}`}>
                <b>{sender?.display_name ?? "משתתף"}</b>
                <span>{message.body}</span>
              </div>
            );
          })}
          {messages.length === 0 && <p className="meta">עוד אין הודעות. אל תשתפו כאן מספר טלפון.</p>}
        </div>
      )}
    </Phone>
  );
}
