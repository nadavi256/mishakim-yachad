import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Icon } from "../components/icons";
import { Overlay, Phone } from "../components/shell";
import { Avatar, Brand, SportBadge } from "../components/visuals";
import { useStore } from "../data/store";
import { isFinished } from "../data/logic";
import { SPORTS, sportName } from "../data/sports";
import { formatWhen, sportsLine } from "../lib/format";
import { CURRENT_USER_ID } from "../data/types";

type Tab = "activities" | "people" | "watch";

export function DiscoveryScreen() {
  const { state, toggleSavedProfile } = useStore();
  const [tab, setTab] = useState<Tab>("people");
  const [q, setQ] = useState("");
  const [sport, setSport] = useState("all");
  const [area, setArea] = useState("all");
  const [sheet, setSheet] = useState<"sport" | "area" | null>(null);
  const query = q.trim();

  const people = useMemo(() => {
    return state.profiles.filter((profile) => {
      if (profile.user_id === CURRENT_USER_ID || profile.visibility !== "public") return false;
      if (state.blockedUserIds.includes(profile.user_id)) return false;
      if (sport !== "all" && !profile.sports.some((s) => s.sport_id === sport)) return false;
      if (area !== "all" && !profile.general_area.includes(area)) return false;
      if (!query) return true;
      const blob = `${profile.display_name} ${profile.role_label} ${profile.general_area} ${profile.sports.map((s) => sportName(s.sport_id)).join(" ")}`;
      return blob.includes(query);
    });
  }, [state, query, sport, area]);

  const activities = useMemo(() => {
    return state.activities.filter((activity) => {
      if (activity.status !== "published" || isFinished(activity)) return false;
      if (state.blockedUserIds.includes(activity.owner_id)) return false;
      if (sport !== "all" && activity.sport_id !== sport) return false;
      if (area !== "all" && activity.location.city !== area) return false;
      if (!query) return true;
      const blob = `${activity.title} ${activity.location.place_name} ${activity.location.city} ${sportName(activity.sport_id)}`;
      return blob.includes(query);
    });
  }, [state, query, sport, area]);

  return (
    <Phone
      screen="discover"
      overlay={
        sheet && (
          <Overlay title={sheet === "sport" ? "ענף" : "אזור"} onClose={() => setSheet(null)}>
            <div className="menu-list">
              <button type="button" className={(sheet === "sport" ? sport : area) === "all" ? "on" : ""} onClick={() => { if (sheet === "sport") setSport("all"); else setArea("all"); setSheet(null); }}>
                {sheet === "sport" ? "כל הענפים" : "כל הארץ"}
              </button>
              {sheet === "sport"
                ? SPORTS.map((item) => (
                    <button type="button" key={item.id} className={sport === item.id ? "on" : ""} onClick={() => { setSport(item.id); setSheet(null); }}>
                      {item.name}
                    </button>
                  ))
                : ["חיפה", "קרית אתא", "קרית ביאליק"].map((city) => (
                    <button type="button" key={city} className={area === city ? "on" : ""} onClick={() => { setArea(city); setSheet(null); }}>
                      {city}
                    </button>
                  ))}
            </div>
          </Overlay>
        )
      }
    >
      <header className="topbar center">
        <Brand />
      </header>
      <div className="page-title center">
        <h1>גילוי</h1>
        <p className="sub">חפשו פעילות, שותף או מאמן</p>
      </div>
      <label className="search">
        <input value={q} onChange={(event) => setQ(event.target.value)} placeholder="חיפוש לפי שם, פעילות או מקום" />
        <Icon name="search" />
      </label>
      <div className="seg" role="tablist">
        <button type="button" role="tab" aria-selected={tab === "activities"} className={tab === "activities" ? "on" : ""} onClick={() => setTab("activities")}>פעילויות</button>
        <button type="button" role="tab" aria-selected={tab === "people"} className={tab === "people" ? "on" : ""} onClick={() => setTab("people")}>אנשים ומאמנים</button>
        <button type="button" role="tab" aria-selected={tab === "watch"} className={tab === "watch" ? "on" : ""} onClick={() => setTab("watch")}>אירועי צפייה</button>
      </div>
      {tab !== "watch" && (
        <div className="filter-row" style={{ paddingBottom: 10 }}>
          <button type="button" className="pill-select" onClick={() => setSheet("sport")}>
            <SportBadge sport={sport === "all" ? "soccer" : sport} size={18} />
            {sport === "all" ? "כל הענפים" : sportName(sport)}
            <Icon name="down" size={16} />
          </button>
          <button type="button" className="pill-select" onClick={() => setSheet("area")}>
            <Icon name="pin" size={16} />
            {area === "all" ? "כל הארץ" : area}
            <Icon name="down" size={16} />
          </button>
        </div>
      )}
      {tab === "watch" && (
        <div className="empty">
          <h2>בקרוב</h2>
          <p>אירועי צפייה רשמיים עדיין לא זמינים. מפגש צפייה, כשיהיה, אינו כרטיס ואינו מקום שמור.</p>
        </div>
      )}
      {tab === "people" && (
        people.length === 0 ? <div className="empty"><h3>לא נמצאו אנשים</h3><p>נסו שם אחר או ענף אחר.</p></div> : (
          <div className="person-grid">
            {people.map((profile) => {
              const saved = state.savedProfileIds.includes(profile.user_id);
              return (
                <article key={profile.user_id} className="card person-card">
                  <button type="button" className={`star${saved ? " on" : ""}`} aria-pressed={saved} aria-label={saved ? "הסרה מהשמורים" : "שמירת פרופיל"} onClick={() => toggleSavedProfile(profile.user_id)}>
                    <Icon name={saved ? "starFill" : "star"} />
                  </button>
                  <Avatar id={profile.avatar} size={64} />
                  <h3>{profile.display_name}</h3>
                  <div className="person-meta"><Icon name="user" size={14} />{profile.role_label}</div>
                  <div className="person-meta">{sportsLine(profile.sports, sportName)}</div>
                  <div className="person-meta"><Icon name="pin" size={14} />{profile.general_area}</div>
                  <Link className="btn primary" to={`/u/${profile.user_id}`}>לפרופיל</Link>
                </article>
              );
            })}
          </div>
        )
      )}
      {tab === "activities" && (
        activities.length === 0 ? <div className="empty"><h3>לא נמצאו פעילויות</h3><p>נסו מילה אחרת או ענף אחר. בחירה כאן לא מתווספת להעדפות שלכם.</p></div> : (
          <div className="stack">
            {activities.map((activity) => (
              <Link key={activity.id} to={`/activity/${activity.id}`} className="card" style={{ textDecoration: "none" }}>
                <div className="title-row">
                  <SportBadge sport={activity.sport_id} />
                  <h3>{activity.title}</h3>
                </div>
                <div className="meta">{formatWhen(activity.starts_at)} · {activity.location.city}</div>
              </Link>
            ))}
          </div>
        )
      )}
    </Phone>
  );
}
