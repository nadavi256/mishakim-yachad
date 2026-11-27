import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Icon } from "../components/icons";
import { SafetyMenu } from "../components/SafetyMenu";
import { Phone } from "../components/shell";
import { Avatar, Brand, Cover, SportBadge } from "../components/visuals";
import { useMe, useStore } from "../data/store";
import { approvedCount, profileById, publishedByOwner } from "../data/logic";
import { SPORTS, sportName } from "../data/sports";
import { CURRENT_USER_ID, type Level } from "../data/types";
import { LEVEL_LABEL, LEVEL_SHORT, costLabel, formatWhen, sportsLine } from "../lib/format";

export function ProfileScreen() {
  const me = useMe();
  const { state } = useStore();
  const mine = publishedByOwner(state, me.user_id);
  return (
    <Phone screen="profile">
      <header className="topbar center"><Brand /></header>
      <div className="page-title"><h1>הפרופיל שלי</h1></div>
      <ProfileHero profileId={me.user_id} />
      <div className="pad" style={{ display: "flex", gap: 8 }}>
        <Link className="btn primary" to="/profile/edit" style={{ flex: 1 }}><Icon name="pencil" size={16} />עריכת פרופיל</Link>
        <Link className="btn" to="/profile/public" style={{ flex: 1 }}><Icon name="eye" size={16} />תצוגה ציבורית</Link>
      </div>
      <section className="section">
        <div className="section-label">
          <h2><SportBadge sport="soccer" size={22} />ענפי הספורט שלי</h2>
          <Link to="/profile/edit" className="text-btn">עריכה <Icon name="pencil" size={14} /></Link>
        </div>
        <div className="sport-row">
          {me.sports.map((sport) => (
            <div key={sport.sport_id} className="sport-pill">
              <SportBadge sport={sport.sport_id} size={28} />
              <strong>{sportName(sport.sport_id)}</strong>
              <span>{LEVEL_SHORT[sport.level]}</span>
            </div>
          ))}
        </div>
      </section>
      <section className="section">
        <Link className="link-row" to="/saved/people"><Icon name="people" size={18} /><span>פרופילים ששמרתי</span><Icon name="chevron" size={16} /></Link>
        <Link className="link-row" to="/saved/activities"><Icon name="calendar" size={18} /><span>פעילויות ששמרתי</span><Icon name="chevron" size={16} /></Link>
      </section>
      <section className="section">
        <div className="section-label"><h2><Icon name="megaphone" />הפעילויות שפרסמתי</h2></div>
        <div data-testid="published-by-me">
          {mine.length === 0 && <p className="hint">עוד לא פרסמתם פעילות. טיוטות לא מופיעות כאן.</p>}
          {mine.map((activity) => (
            <article key={activity.id} className="published-card" data-owner={activity.owner_id} data-activity-id={activity.id} style={{ marginTop: 8 }}>
              <div className="my-top">
                <Cover sport={activity.sport_id} className="my-thumb" />
                <div className="my-body">
                  <h3>{activity.title}</h3>
                  <div className="meta">מאת {me.display_name}</div>
                  <div className="meta">{formatWhen(activity.starts_at, new Date(), "comma")}</div>
                  <div className="meta">{activity.location.address}</div>
                  <div className="meta">{LEVEL_LABEL[activity.level]} · {costLabel(activity.cost_amount)}</div>
                </div>
              </div>
              <Link className="btn primary" to={`/activity/${activity.id}`} style={{ marginTop: 10 }}>לניהול הפעילות</Link>
            </article>
          ))}
        </div>
      </section>
      <section className="section">
        <div className="section-label">
          <h2><Icon name="gear" size={18} />הגדרות אישיות</h2>
        </div>
        <p className="hint">מוצגות רק לך</p>
        <Link className="setting-row" to="/settings/availability"><Icon name="calendar" size={18} /><span>זמינות והעדפות</span><Icon name="chevron" size={16} /></Link>
        <Link className="setting-row" to="/settings/notifications"><Icon name="bell" size={18} /><span>התראות</span><Icon name="chevron" size={16} /></Link>
        <Link className="setting-row" to="/settings/privacy"><Icon name="shield" size={18} /><span>פרטיות וחסימות</span><Icon name="chevron" size={16} /></Link>
        <Link className="setting-row" to="/settings/help"><Icon name="help" size={18} /><span>עזרה ותמיכה</span><Icon name="chevron" size={16} /></Link>
        <Link className="setting-row" to="/login"><Icon name="user" size={18} /><span>כניסה עם Google</span><Icon name="chevron" size={16} /></Link>
      </section>
    </Phone>
  );
}

function ProfileHero({ profileId }: { profileId: string }) {
  const { state } = useStore();
  const profile = profileById(state, profileId);
  if (!profile) return null;
  return (
    <div className="hero">
      <div className="hero-text">
        <h2>{profile.display_name}</h2>
        <div className="loc"><Icon name="pin" size={16} />{profile.general_area}</div>
        <p className="bio">{profile.bio}</p>
      </div>
      <Avatar id={profile.avatar} size={84} />
    </div>
  );
}

export function PublicProfileScreen({ selfView = false }: { selfView?: boolean }) {
  const params = useParams();
  const me = useMe();
  const { state, toggleSavedProfile, toggleFollow, toast } = useStore();
  const userId = selfView ? me.user_id : params.id ?? "";
  const profile = profileById(state, userId);
  const navigate = useNavigate();
  if (!profile || profile.visibility !== "public" && profile.user_id !== me.user_id) {
    return <Phone screen="public-profile" nav={false}><p className="empty">הפרופיל לא זמין.</p></Phone>;
  }
  const mine = publishedByOwner(state, profile.user_id);
  const saved = state.savedProfileIds.includes(profile.user_id);
  const followed = state.followedPublisherIds.includes(profile.user_id);
  const isSelf = profile.user_id === me.user_id;
  return (
    <Phone screen="public-profile" nav={false}>
      <button type="button" className="back-link" onClick={() => navigate(-1)}><Icon name="back" size={18} />חזרה</button>
      {selfView && <p className="success">כך אחרים רואים את הפרופיל. בלי טלפון, בלי כתובת בית ובלי הגדרות.</p>}
      <ProfileHero profileId={profile.user_id} />
      {!isSelf && (
        <div className="pad" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button type="button" className="btn" onClick={() => { toggleSavedProfile(profile.user_id); toast(saved ? "הפרופיל הוסר מהשמורים" : "הפרופיל נשמר. זו לא הרשמה לעדכונים."); }}>
            <Icon name={saved ? "starFill" : "star"} size={16} />{saved ? "שמור" : "שמירת פרופיל"}
          </button>
          <button type="button" className="btn" onClick={() => { toggleFollow(profile.user_id); toast(followed ? "המעקב בוטל" : "תקבלו עדכון כשמתפרסמת פעילות חדשה"); }}>
            {followed ? "עוקבים" : "עקבו אחרי פרסומים"}
          </button>
        </div>
      )}
      <section className="section">
        <div className="section-label"><h2>ענפי ספורט</h2></div>
        <p>{sportsLine(profile.sports, sportName)} · {profile.sports.map((s) => LEVEL_SHORT[s.level]).join(", ")}</p>
        {profile.role === "coach" && <p className="hint" style={{ marginTop: 8 }}>{profile.specialty_note}</p>}
      </section>
      <section className="section">
        <div className="section-label"><h2>פעילויות שפורסמו</h2></div>
        {mine.length === 0 && <p className="hint">אין פעילויות פומביות.</p>}
        {mine.map((activity) => (
          <Link key={activity.id} to={`/activity/${activity.id}`} className="link-row">
            <span>{activity.title}</span>
            <Icon name="chevron" size={16} />
          </Link>
        ))}
      </section>
      {!isSelf && (
        <div className="pad">
          <SafetyMenu reportTitle="דיווח על פרופיל" subjectType="profile" subjectId={profile.user_id} blockUserId={profile.user_id} />
        </div>
      )}
    </Phone>
  );
}

export function EditProfileScreen() {
  const me = useMe();
  const { updateProfile, toast } = useStore();
  const navigate = useNavigate();
  const [name, setName] = useState(me.display_name);
  const [area, setArea] = useState(me.general_area);
  const [bio, setBio] = useState(me.bio);
  const [sports, setSports] = useState(me.sports);

  function toggleSport(id: string) {
    setSports((current) => current.some((s) => s.sport_id === id) ? current.filter((s) => s.sport_id !== id) : [...current, { sport_id: id, level: "beginner" as Level }]);
  }

  return (
    <Phone screen="edit-profile" nav={false}>
      <button type="button" className="back-link" onClick={() => navigate(-1)}><Icon name="back" size={18} />חזרה</button>
      <div className="page-title"><h1>עריכת פרופיל</h1><p className="sub">בלי מספר טלפון ובלי כתובת בית.</p></div>
      <form className="form" onSubmit={(event) => {
        event.preventDefault();
        if (name.trim().length < 2) { toast("השם קצר מדי"); return; }
        updateProfile({ display_name: name.trim(), bio: bio.trim(), general_area: area.trim(), sports });
        toast("הפרופיל עודכן בהדגמה");
        navigate("/profile");
      }}>
        <label className="field">שם
          <input value={name} onChange={(event) => setName(event.target.value)} maxLength={80} />
        </label>
        <label className="field">אזור כללי
          <input value={area} onChange={(event) => setArea(event.target.value)} placeholder="עיר או אזור, לא רחוב" />
        </label>
        <label className="field">על עצמי
          <textarea value={bio} maxLength={500} onChange={(event) => setBio(event.target.value)} />
        </label>
        <div className="field">ענפים ורמה
          <div className="sheet-grid">
            {SPORTS.map((sport) => {
              const selected = sports.find((s) => s.sport_id === sport.id);
              return (
                <button type="button" key={sport.id} className={selected ? "on" : ""} onClick={() => toggleSport(sport.id)} style={{ border: "1px solid var(--line)", borderRadius: 12, background: selected ? "var(--green-soft)" : "#fff", fontWeight: 800, minHeight: 44 }}>
                  {sport.name}
                </button>
              );
            })}
          </div>
          {sports.map((sport) => (
            <label key={sport.sport_id} className="field">{sportName(sport.sport_id)}
              <select value={sport.level} onChange={(event) => setSports((current) => current.map((s) => s.sport_id === sport.sport_id ? { ...s, level: event.target.value as Level } : s))}>
                <option value="beginner">מתחיל</option>
                <option value="intermediate">בינוני</option>
                <option value="advanced">מתקדם</option>
                <option value="all">כל הרמות</option>
              </select>
            </label>
          ))}
        </div>
        <button className="btn primary" type="submit">שמירה</button>
      </form>
    </Phone>
  );
}

export function SavedPeopleScreen() {
  const { state } = useStore();
  const navigate = useNavigate();
  const people = state.savedProfileIds.map((id) => profileById(state, id)).filter((p) => p != null);
  return (
    <Phone screen="saved-people" nav={false}>
      <button type="button" className="back-link" onClick={() => navigate(-1)}><Icon name="back" size={18} />חזרה</button>
      <div className="page-title"><h1>פרופילים ששמרתי</h1></div>
      {people.length === 0 && <div className="empty"><h3>עדיין לא שמרתם פרופילים</h3><p>שמירה לא מפעילה עדכונים. בשביל עדכונים יש כפתור מעקב נפרד.</p></div>}
      <div className="stack">
        {people.map((profile) => profile && (
          <Link key={profile.user_id} to={`/u/${profile.user_id}`} className="card" style={{ textDecoration: "none" }}>
            <strong>{profile.display_name}</strong>
            <div className="meta">{profile.general_area}</div>
          </Link>
        ))}
      </div>
    </Phone>
  );
}

export function SavedActivitiesScreen() {
  const { state } = useStore();
  const navigate = useNavigate();
  const activities = state.savedActivityIds.map((id) => state.activities.find((a) => a.id === id)).filter((a) => a != null);
  return (
    <Phone screen="saved-activities" nav={false}>
      <button type="button" className="back-link" onClick={() => navigate(-1)}><Icon name="back" size={18} />חזרה</button>
      <div className="page-title"><h1>פעילויות ששמרתי</h1><p className="sub">שמירה אינה הרשמה ואינה שומרת מקום.</p></div>
      {activities.length === 0 && <div className="empty"><h3>אין פעילויות שמורות</h3></div>}
      <div className="stack">
        {activities.map((activity) => activity && (
          <Link key={activity.id} to={`/activity/${activity.id}`} className="card" style={{ textDecoration: "none" }}>
            <strong>{activity.title}</strong>
            <div className="meta">{formatWhen(activity.starts_at)} · {approvedCount(state, activity.id)} נרשמו</div>
          </Link>
        ))}
      </div>
    </Phone>
  );
}

export function SettingsScreen() {
  const { key } = useParams();
  const navigate = useNavigate();
  const { state, unblockUser, reset, toast } = useStore();
  const titles: Record<string, string> = {
    availability: "זמינות והעדפות",
    notifications: "התראות",
    privacy: "פרטיות וחסימות",
    help: "עזרה ותמיכה",
  };
  return (
    <Phone screen="settings" nav={false}>
      <button type="button" className="back-link" onClick={() => navigate(-1)}><Icon name="back" size={18} />חזרה</button>
      <div className="page-title"><h1>{titles[key ?? ""] ?? "הגדרות"}</h1></div>
      {key === "availability" && <div className="note-card"><p>ההעדפות נשמרות רק בהדגמה הזו, על המכשיר. אין מעקב מיקום רציף, וחיפוש ארצי עובד בלי GPS.</p></div>}
      {key === "notifications" && <div className="note-card"><p>מרכז ההתראות בתוך האפליקציה פעיל גם בלי אישור להתראות במכשיר. בגרסה הזו אין דחיפה למכשיר.</p></div>}
      {key === "privacy" && (
        <div className="stack">
          <div className="note-card"><p>מספר טלפון, כתובת בית ומיקום מדויק של קטין לא מוצגים לאחרים. לאחרים מוצג רק אזור. נקודת המפגש של פעילות היא מקום שהמארגן בחר לשתף.</p></div>
          <h2 style={{ fontSize: 16, paddingInline: 4 }}>חסימות</h2>
          {state.blockedUserIds.length === 0 && <p className="meta" style={{ paddingInline: 4 }}>אין משתמשים חסומים.</p>}
          {state.blockedUserIds.map((id) => {
            const profile = profileById(state, id);
            return (
              <div key={id} className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>{profile?.display_name ?? "משתמש"}</span>
                <button type="button" className="btn" onClick={() => unblockUser(id)}>ביטול חסימה</button>
              </div>
            );
          })}
          <button type="button" className="btn" onClick={() => { if (window.confirm("בגרסת ההדגמה המחיקה מאפסת את הנתונים המקומיים בלבד. אין שרת ואין מדיניות שמירה סופית.")) { reset(); navigate("/"); } }}>מחיקת חשבון בהדגמה</button>
          <p className="fine">לפני השקה צריך מדיניות שמירה: מה קורה לרשומות מפגש משותפות.</p>
        </div>
      )}
      {key === "help" && (
        <div className="note-card">
          <p>זו גרסת הדגמה עם נתוני דמה. אפשר לאפס מהפס העליון. דיווח וחסימה נשמרים רק אצלכם בדפדפן.</p>
          <button type="button" className="btn" style={{ marginTop: 10 }} onClick={() => toast("הפנייה נשמרה בהדגמה")}>שליחת פנייה</button>
        </div>
      )}
    </Phone>
  );
}

export function NotificationsScreen() {
  const { state, markAllRead } = useStore();
  const navigate = useNavigate();
  const items = state.notifications.filter((n) => n.recipient_id === CURRENT_USER_ID).slice().reverse();
  return (
    <Phone screen="notifications" nav={false}>
      <button type="button" className="back-link" onClick={() => navigate(-1)}><Icon name="back" size={18} />חזרה</button>
      <div className="head-row">
        <h1>התראות</h1>
        <button type="button" className="text-btn" onClick={() => markAllRead()}>סימון כנקרא</button>
      </div>
      <div className="notice-list">
        {items.length === 0 && <div className="empty"><h3>אין התראות</h3></div>}
        {items.map((item) => (
          <Link key={item.id} to={item.entity_id ? `/activity/${item.entity_id}` : "/my"} className={`notice${item.read_at ? "" : " unread"}`}>
            <strong>{item.title}</strong>
            <div className="meta">{item.body}</div>
          </Link>
        ))}
      </div>
    </Phone>
  );
}
