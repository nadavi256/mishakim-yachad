import { useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Icon } from "../components/icons";
import { Phone, Overlay } from "../components/shell";
import { Brand, SportBadge } from "../components/visuals";
import { useMe, useStore } from "../data/store";
import { approvedCount, filterFeed } from "../data/logic";
import { SPORTS, sportName } from "../data/sports";
import { LEVEL_LABEL, formatWhen } from "../lib/format";
import { mapsLinks } from "../lib/links";
import type { Level } from "../data/types";

type Filters = {
  area: "all" | string;
  when: "week" | "today" | "tomorrow" | "any";
  level: "any" | Level;
  sort: "match" | "near" | "soon";
  onlySaved: boolean;
};

const DEFAULTS: Filters = { area: "all", when: "week", level: "any", sort: "match", onlySaved: false };

const AREAS = [
  { id: "all", label: "כל הארץ" },
  { id: "חיפה", label: "חיפה" },
  { id: "קרית אתא", label: "קרית אתא" },
  { id: "קרית ביאליק", label: "קרית ביאליק" },
];
const WHENS = [
  { id: "week", label: "השבוע" },
  { id: "today", label: "היום" },
  { id: "tomorrow", label: "מחר" },
  { id: "any", label: "כל התאריכים" },
];
const LEVELS = [
  { id: "any", label: "כל הרמות" },
  { id: "beginner", label: "מתחילים" },
  { id: "intermediate", label: "בינוניים" },
  { id: "advanced", label: "מתקדמים" },
];
const SORTS = [
  { id: "match", label: "הכי מתאים לי" },
  { id: "near", label: "הקרוב אליי" },
  { id: "soon", label: "מתחיל בקרוב" },
];

export function HomeScreen() {
  const navigate = useNavigate();
  const me = useMe();
  const { state } = useStore();
  const quick = me.sports.map((s) => s.sport_id);
  const [sport, setSport] = useState<string>("foryou");
  const [sheet, setSheet] = useState<"sports" | "area" | "when" | "level" | "sort" | null>(null);
  const memory = useRef<Record<string, { filters: Filters; scroll: number }>>({});
  const [filters, setFilters] = useState<Filters>(DEFAULTS);

  function rememberAndSwitch(next: string) {
    const el = document.querySelector<HTMLElement>("[data-scroll]");
    memory.current[sport] = { filters, scroll: el?.scrollTop ?? 0 };
    const saved = memory.current[next];
    setSport(next);
    setFilters(saved?.filters ?? DEFAULTS);
    requestAnimationFrame(() => {
      const node = document.querySelector<HTMLElement>("[data-scroll]");
      if (node) node.scrollTop = saved?.scroll ?? 0;
    });
  }

  const activities = useMemo(
    () =>
      filterFeed(state, {
        sport,
        userSportIds: quick,
        area: filters.area,
        when: filters.when,
        level: filters.level,
        sort: filters.sort,
        userArea: me.general_area,
        onlySavedPublishers: filters.onlySaved,
        savedPublisherIds: state.followedPublisherIds.length ? state.followedPublisherIds : state.savedProfileIds,
      }),
    [state, sport, quick, filters, me.general_area],
  );

  const areaLabel = AREAS.find((a) => a.id === filters.area)?.label ?? "כל הארץ";
  const whenLabel = WHENS.find((a) => a.id === filters.when)?.label ?? "השבוע";
  const levelLabel = LEVELS.find((a) => a.id === filters.level)?.label ?? "כל הרמות";
  const sortLabel = SORTS.find((a) => a.id === filters.sort)?.label ?? "הכי מתאים לי";

  return (
    <Phone
      screen="home"
      cta={
        <div className="cta-wrap">
          <button type="button" className="btn primary block" onClick={() => navigate(`/publish/1?sport=${sport}`)}>
            <Icon name="plus" size={18} />
            פרסום פעילות
          </button>
        </div>
      }
      overlay={
        sheet && (
          <Overlay title={sheetTitle(sheet)} onClose={() => setSheet(null)}>
            {sheet === "sports" && (
              <div className="sheet-grid">
                <button type="button" className={sport === "all" ? "on" : ""} onClick={() => { rememberAndSwitch("all"); setSheet(null); }}>
                  כל הענפים
                </button>
                {SPORTS.map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    className={sport === item.id ? "on" : ""}
                    onClick={() => { rememberAndSwitch(item.id); setSheet(null); }}
                  >
                    <SportBadge sport={item.id} size={22} />
                    {item.name}
                  </button>
                ))}
              </div>
            )}
            {sheet === "area" && (
              <div className="menu-list">
                {AREAS.map((item) => (
                  <button type="button" key={item.id} className={filters.area === item.id ? "on" : ""} onClick={() => { setFilters({ ...filters, area: item.id }); setSheet(null); }}>
                    {item.label}
                  </button>
                ))}
              </div>
            )}
            {sheet === "when" && (
              <div className="menu-list">
                {WHENS.map((item) => (
                  <button type="button" key={item.id} className={filters.when === item.id ? "on" : ""} onClick={() => { setFilters({ ...filters, when: item.id as Filters["when"] }); setSheet(null); }}>
                    {item.label}
                  </button>
                ))}
              </div>
            )}
            {sheet === "level" && (
              <div className="menu-list">
                {LEVELS.map((item) => (
                  <button type="button" key={item.id} className={filters.level === item.id ? "on" : ""} onClick={() => { setFilters({ ...filters, level: item.id as Filters["level"] }); setSheet(null); }}>
                    {item.label}
                  </button>
                ))}
              </div>
            )}
            {sheet === "sort" && (
              <div className="menu-list">
                {SORTS.map((item) => (
                  <button type="button" key={item.id} className={filters.sort === item.id ? "on" : ""} onClick={() => { setFilters({ ...filters, sort: item.id as Filters["sort"] }); setSheet(null); }}>
                    {item.label}
                  </button>
                ))}
                <button type="button" className={filters.onlySaved ? "on" : ""} onClick={() => setFilters({ ...filters, onlySaved: !filters.onlySaved })}>
                  {filters.onlySaved ? "מציג מפרסמים ששמרתי" : "רק מפרסמים ששמרתי"}
                </button>
              </div>
            )}
          </Overlay>
        )
      }
    >
      <header className="topbar">
        <span style={{ width: 40 }} />
        <Brand variant="swoosh" />
        <Link to="/notifications" className="icon-btn" aria-label="התראות">
          <Icon name="bell" />
        </Link>
      </header>
      <div className="greeting">
        <h1>היי {me.display_name}, מה משחקים היום?</h1>
      </div>
      <div className="picker">
        <div className="chip-scroller">
          <button type="button" className={`chip${sport === "foryou" ? " on" : ""}`} onClick={() => rememberAndSwitch("foryou")}>
            בשבילך
          </button>
          {quick.map((id) => (
            <button key={id} type="button" className={`chip${sport === id ? " on" : ""}`} onClick={() => rememberAndSwitch(id)}>
              {sportName(id)}
            </button>
          ))}
          <button type="button" className="chip dropdown" onClick={() => setSheet("sports")}>
            {sport !== "foryou" && sport !== "all" && !quick.includes(sport) ? sportName(sport) : "כל הענפים"}
            <Icon name="down" size={16} />
          </button>
        </div>
        <div className="filter-row">
          <button type="button" className="pill-select" onClick={() => setSheet("area")}>
            <Icon name="pin" size={16} />
            {areaLabel}
            <Icon name="down" size={16} />
          </button>
          <button type="button" className="pill-select" onClick={() => setSheet("when")}>
            {whenLabel}
            <Icon name="down" size={16} />
          </button>
          <button type="button" className="pill-select" onClick={() => setSheet("level")}>
            {levelLabel}
            <Icon name="down" size={16} />
          </button>
        </div>
      </div>
      <div className="section-head">
        <h2>פעילויות שמתאימות לך</h2>
        <button type="button" className="sort-btn" onClick={() => setSheet("sort")}>
          {sortLabel}
          <Icon name="filter" size={16} />
        </button>
      </div>
      {activities.length === 0 ? (
        <div className="empty">
          <h3>אין פעילויות שמתאימות</h3>
          <p>נסו תאריך או אזור אחר, או פרסמו פעילות חדשה. הסינון לא מורחב לבד.</p>
        </div>
      ) : (
        <div className="stack">
          {activities.map((activity) => {
            const links = mapsLinks(activity.location.lat, activity.location.lon);
            const count = approvedCount(state, activity.id);
            return (
              <article key={activity.id} className="card" data-activity-id={activity.id}>
                <div className="home-top">
                  <div className="home-main">
                    <div className="title-row">
                      <SportBadge sport={activity.sport_id} />
                      <h3>{activity.title}</h3>
                    </div>
                    <div className="meta">
                      {formatWhen(activity.starts_at)}
                      {" · "}
                      {LEVEL_LABEL[activity.level]}
                    </div>
                    <div className="place">
                      <Icon name="pin" size={16} />
                      <div>
                        <strong>{activity.location.city}</strong>
                        <div className="addr">{activity.location.address}</div>
                      </div>
                    </div>
                  </div>
                  <div className="home-side">
                    <span className="badge">הרשמה פתוחה</span>
                    <span className="count">
                      <Icon name="user" size={14} />
                      {count} נרשמו
                    </span>
                  </div>
                </div>
                <div className="btn-row">
                  <Link className="btn primary" to={`/activity/${activity.id}`}>
                    פרטים והצטרפות
                    <Icon name="chevron" size={16} />
                  </Link>
                  <a className="btn" href={links.google} target="_blank" rel="noopener noreferrer">
                    Google Maps
                  </a>
                  <a className="btn" href={links.waze} target="_blank" rel="noopener noreferrer">
                    Waze
                  </a>
                </div>
              </article>
            );
          })}
        </div>
      )}
      <p className="fine">הכתובות להמחשה</p>
    </Phone>
  );
}

function sheetTitle(sheet: string) {
  if (sheet === "sports") return "כל הענפים";
  if (sheet === "area") return "אזור";
  if (sheet === "when") return "מתי";
  if (sheet === "level") return "רמה";
  return "מיון";
}
