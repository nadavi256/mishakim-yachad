import { useMemo, useRef, useState } from "react";
import { Navigate, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Icon, SportGlyph } from "../components/icons";
import { Overlay, Phone } from "../components/shell";
import { Brand, Cover, ParkMap } from "../components/visuals";
import { useMe, useStore } from "../data/store";
import { emptyDraft, nextTitle, validateStep } from "../data/logic";
import { PLACES, SPORTS } from "../data/sports";
import type { Draft, JoinPolicy, Level } from "../data/types";
import { LEVEL_LABEL, costLabel, durationLabel, formatWhen } from "../lib/format";
import { dateInJerusalem, jerusalemYmd } from "../lib/format";

const LEVELS: Level[] = ["all", "beginner", "intermediate", "advanced"];
const STEP_TITLES = ["מה עושים?", "מתי ואיפה?", "הצטרפות ופרסום"];
const STEP_LABELS = ["פרטי הפעילות", "מתי ואיפה?", "אישור ופרסום"];

function dayOptions(now = new Date()) {
  const today = jerusalemYmd(now);
  return Array.from({ length: 14 }, (_, offset) => {
    const iso = dateInJerusalem(offset, 12, 0, now);
    const ymd = jerusalemYmd(new Date(iso));
    let label = new Intl.DateTimeFormat("he-IL", { timeZone: "Asia/Jerusalem", weekday: "long", day: "numeric", month: "numeric" }).format(new Date(iso));
    if (ymd === today) label = "היום";
    else if (offset === 1) label = "מחר";
    return { offset, label };
  });
}

const TIMES = Array.from({ length: 34 }, (_, i) => {
  const hour = 6 + Math.floor(i / 2);
  const minute = i % 2 === 0 ? "00" : "30";
  return `${String(hour).padStart(2, "0")}:${minute}`;
});

export function PublishScreen() {
  const { step: stepParam } = useParams();
  const step = Number(stepParam);
  const navigate = useNavigate();
  const [search] = useSearchParams();
  const me = useMe();
  const store = useStore();
  const idempotency = useRef(crypto.randomUUID());
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [placeQuery, setPlaceQuery] = useState("");
  const [manual, setManual] = useState(false);

  const [draft, setDraft] = useState<Draft>(() => {
    const existing = store.state.drafts.find((d) => d.owner_id === me.user_id);
    if (existing) return existing;
    const requested = search.get("sport");
    const sport = requested && requested !== "foryou" && requested !== "all" && SPORTS.some((s) => s.id === requested) ? requested : "basketball";
    return emptyDraft(me.user_id, sport);
  });

  const days = useMemo(() => dayOptions(), []);
  const selectedDay = useMemo(() => {
    if (!draft.starts_at) return 1;
    const target = jerusalemYmd(new Date(draft.starts_at));
    const index = days.findIndex((day) => jerusalemYmd(new Date(dateInJerusalem(day.offset, 12, 0))) === target);
    return index >= 0 ? days[index].offset : 1;
  }, [draft.starts_at, days]);
  const selectedTime = draft.starts_at ? new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Jerusalem", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date(draft.starts_at)) : "19:00";

  if (![1, 2, 3].includes(step)) return <Navigate to="/publish/1" replace />;

  function patch(partial: Partial<Draft>) {
    setDraft((current) => ({ ...current, ...partial }));
  }

  function setSport(sportId: string) {
    setDraft((current) => {
      const title = nextTitle(sportId, current.title, current.title_edited);
      return { ...current, sport_id: sportId, title: title.title, title_edited: title.titleEdited };
    });
  }

  function setWhen(offset: number, time: string) {
    const [hour, minute] = time.split(":").map(Number);
    patch({ starts_at: dateInJerusalem(offset, hour, minute) });
  }

  function showErrors(list: { field: string; message: string }[]) {
    const map: Record<string, string> = {};
    list.forEach((item) => { if (!map[item.field]) map[item.field] = item.message; });
    setErrors(map);
    const first = list[0]?.field;
    if (first) document.querySelector(`[data-field="${first}"]`)?.scrollIntoView({ block: "center" });
  }

  function goNext() {
    const list = validateStep(draft, step as 1 | 2 | 3);
    if (list.length) { showErrors(list); return; }
    const next = { ...draft, last_step: Math.max(draft.last_step, (step + 1) as 1 | 2 | 3) as 1 | 2 | 3 };
    setDraft(next);
    store.saveDraft(next);
    navigate(`/publish/${step + 1}`);
  }

  function publish() {
    const list = validateStep(draft, 3);
    if (list.length) { showErrors(list); return; }
    setBusy(true);
    const result = store.publish(draft, idempotency.current);
    setBusy(false);
    if (result.error || !result.activityId) {
      store.toast(result.error ?? "הפרסום נכשל. הטיוטה נשמרה.");
      store.saveDraft(draft);
      return;
    }
    navigate(`/activity/${result.activityId}?published=1`, { replace: true });
  }

  const suggestions = PLACES.filter((place) => {
    const blob = `${place.name} ${place.city} ${place.address}`;
    return placeQuery ? blob.includes(placeQuery) : true;
  }).slice(0, 5);
  const basePlace = PLACES.find((place) => place.name === draft.place_name);
  const pinFar = basePlace && draft.lat != null && (Math.abs(draft.lat - basePlace.lat) > 0.008 || Math.abs((draft.lon ?? 0) - basePlace.lon) > 0.008);

  function choosePlace(place: (typeof PLACES)[number]) {
    patch({ place_name: place.name, address: place.address, city: place.city, lat: place.lat, lon: place.lon, pin_x: 62, pin_y: 58 });
    setPlaceQuery("");
    setManual(false);
  }

  function movePin(x: number, y: number) {
    const baseLat = basePlace?.lat ?? draft.lat ?? 32.8;
    const baseLon = basePlace?.lon ?? draft.lon ?? 34.99;
    const lat = baseLat + ((58 - y) / 50) * 0.01;
    const lon = baseLon + ((x - 62) / 50) * 0.012;
    patch({ pin_x: x, pin_y: y, lat, lon });
  }

  return (
    <Phone
      screen={`publish-${step}`}
      nav={false}
      overlay={leaveOpen ? (
        <Overlay title="לשמור טיוטה?" onClose={() => setLeaveOpen(false)}>
          <p>אפשר להמשיך אחר כך. טיוטה לא מופיעה בחיפוש ולא בפרופיל הציבורי.</p>
          <div className="btn-row">
            <button type="button" className="btn primary" onClick={() => { store.saveDraft({ ...draft, last_step: step as 1 | 2 | 3 }); navigate("/my"); }}>שמירת טיוטה</button>
            <button type="button" className="btn" onClick={() => { store.discardDraft(draft.id); navigate("/"); }}>יציאה בלי שמירה</button>
          </div>
        </Overlay>
      ) : undefined}
    >
      <div className="publish-top">
        {step === 1 ? (
          <button type="button" className="x" aria-label="סגירה" onClick={() => setLeaveOpen(true)}><Icon name="close" /></button>
        ) : (
          <button type="button" className="back-abs" aria-label="חזרה" onClick={() => navigate(`/publish/${step - 1}`)}><Icon name="back" /></button>
        )}
        <Brand />
        <h1>פרסום פעילות</h1>
      </div>
      <div className="stepper" aria-hidden>
        <div className="fill" style={{ width: `${((step - 1) / 2) * 78}%` }} />
        {[1, 2, 3].map((n) => (
          <div key={n} className={`step${n === step ? " on" : ""}${n < step ? " done" : ""}`}>
            <span className="step-num">{n < step || step === 3 ? <Icon name="check" size={14} /> : n}</span>
            {step > 1 && <small>{STEP_LABELS[n - 1]}</small>}
          </div>
        ))}
      </div>
      <div className="step-hint">שלב {step} מתוך 3 · {STEP_TITLES[step - 1]}</div>
      {step === 1 && (
        <form className="form" onSubmit={(event) => { event.preventDefault(); goNext(); }}>
          <label className="field" data-field="sport">סוג ספורט
            <span className="fake-input" style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <SportGlyph sport={draft.sport_id} />
              <select value={draft.sport_id} onChange={(event) => setSport(event.target.value)} aria-label="סוג ספורט" style={{ border: 0, flex: 1, background: "transparent", font: "inherit" }}>
                {SPORTS.map((sport) => <option key={sport.id} value={sport.id}>{sport.name}</option>)}
              </select>
            </span>
            {errors.sport && <span className="err">{errors.sport}</span>}
          </label>
          <label className="field" data-field="title">כותרת הפעילות
            <input value={draft.title} maxLength={100} onChange={(event) => patch({ title: event.target.value, title_edited: true })} />
            <span className="help">הצגנו כותרת — אפשר לשנות</span>
            {errors.title && <span className="err">{errors.title}</span>}
          </label>
          <label className="field" data-field="description">תיאור · לא חובה
            <textarea value={draft.description} maxLength={2000} placeholder="משחק חברתי, כולם מוזמנים. מביאים מים ובאים לשחק!" onChange={(event) => patch({ description: event.target.value })} />
            {errors.description && <span className="err">{errors.description}</span>}
          </label>
          <div className="field">רמה
            <div className="choice-row">
              {LEVELS.map((level) => (
                <button type="button" key={level} className={draft.level === level ? "on" : ""} onClick={() => patch({ level })}>{LEVEL_LABEL[level]}</button>
              ))}
            </div>
          </div>
          <button className="btn primary xl" type="submit">המשך: מתי ואיפה <Icon name="chevron" size={18} /></button>
        </form>
      )}
      {step === 2 && (
        <form className="form" onSubmit={(event) => { event.preventDefault(); goNext(); }}>
          <div className="split">
            <label className="field">תאריך
              <select value={selectedDay} onChange={(event) => setWhen(Number(event.target.value), selectedTime)}>
                {days.map((day) => <option key={day.offset} value={day.offset}>{day.label}</option>)}
              </select>
            </label>
            <label className="field" data-field="starts_at">שעה
              <select value={selectedTime} onChange={(event) => setWhen(selectedDay, event.target.value)}>
                {TIMES.map((time) => <option key={time} value={time}>{time}</option>)}
              </select>
              {errors.starts_at && <span className="err">{errors.starts_at}</span>}
            </label>
          </div>
          <label className="field" data-field="duration">משך משוער · לא חובה
            <select value={draft.duration_minutes ?? ""} onChange={(event) => patch({ duration_minutes: event.target.value ? Number(event.target.value) : null })}>
              <option value="">ללא</option>
              {[30, 45, 60, 90, 120].map((minutes) => <option key={minutes} value={minutes}>{durationLabel(minutes)}</option>)}
            </select>
          </label>
          <label className="field" data-field="place">מקום הפעילות
            <span className="search" style={{ margin: 0 }}>
              <input value={placeQuery || draft.place_name} placeholder="מגרש הספורט בפארק" onChange={(event) => { setPlaceQuery(event.target.value); patch({ place_name: event.target.value }); }} />
              <Icon name="search" />
            </span>
            {!!placeQuery && suggestions.length > 0 && (
              <div className="suggest">
                {suggestions.map((place) => (
                  <button type="button" key={place.id} onClick={() => choosePlace(place)}>
                    <strong>{place.name}</strong>
                    <div className="meta">{place.address}</div>
                  </button>
                ))}
              </div>
            )}
            <button type="button" className="text-btn" onClick={() => setManual(true)}>אין כתובת ברשימה? הזנה ידנית</button>
            {errors.place && <span className="err">{errors.place}</span>}
          </label>
          {(manual || draft.address) && (
            <label className="field" data-field="address">כתובת נקודת המפגש
              <input value={draft.address} onChange={(event) => patch({ address: event.target.value, lat: draft.lat ?? 32.8, lon: draft.lon ?? 34.99, city: draft.city || "חיפה" })} />
              {errors.address && <span className="err">{errors.address}</span>}
            </label>
          )}
          <div data-field="pin">
            <ParkMap pinX={draft.pin_x} pinY={draft.pin_y} draggable label={draft.address ? "רחוב הדוגמה" : undefined} onPin={movePin} />
            <p className="help">מקמו את הסיכה בנקודת המפגש המדויקת</p>
            {pinFar && <p className="warn">הסיכה רחוקה מהכתובת. בדקו שהמיקום נכון — לא הזזנו אותה בשבילכם.</p>}
            {errors.pin && <span className="err">{errors.pin}</span>}
          </div>
          <label className="field" data-field="meeting_note">הוראות הגעה · לא חובה
            <textarea value={draft.meeting_note} maxLength={500} placeholder="נפגשים בכניסה המזרחית, ליד השער הכחול" onChange={(event) => patch({ meeting_note: event.target.value })} />
            {errors.meeting_note && <span className="err">{errors.meeting_note}</span>}
          </label>
          <p className="fine">הכתובת להמחשה בלבד</p>
          <div className="btn-row">
            <button className="btn primary" type="submit" style={{ flex: 1.6 }}>המשך: הצטרפות ופרסום</button>
            <button className="btn" type="button" onClick={() => navigate("/publish/1")}>חזרה</button>
          </div>
        </form>
      )}
      {step === 3 && (
        <form className="form" onSubmit={(event) => { event.preventDefault(); publish(); }}>
          <div className="field">כמות משתתפים
            <div className="segment">
              <button type="button" className={draft.capacity_mode === "unlimited" ? "on" : ""} onClick={() => patch({ capacity_mode: "unlimited", capacity: null })}>ללא הגבלה</button>
              <button type="button" className={draft.capacity_mode === "limited" ? "on" : ""} onClick={() => patch({ capacity_mode: "limited", capacity: draft.capacity ?? 10 })}>הגבלת כמות</button>
            </div>
            <span className="help">אפשר להצטרף ללא תקרת משתתפים.</span>
            {draft.capacity_mode === "limited" && (
              <input type="number" min={1} value={draft.capacity ?? 10} onChange={(event) => patch({ capacity: Number(event.target.value) })} data-field="capacity" />
            )}
            {errors.capacity && <span className="err">{errors.capacity}</span>}
          </div>
          <div className="field">עלות
            <div className="segment">
              <button type="button" className={draft.cost_mode === "free" ? "on" : ""} onClick={() => patch({ cost_mode: "free", cost_amount: 0 })}>חינם</button>
              <button type="button" className={draft.cost_mode === "paid" ? "on" : ""} onClick={() => patch({ cost_mode: "paid", cost_amount: draft.cost_amount || 20, payment_note: "התשלום מתואם מחוץ לאפליקציה. אין חיוב ואין החזר כאן." })}>בתשלום</button>
            </div>
            {draft.cost_mode === "paid" && (
              <>
                <input type="number" min={1} value={draft.cost_amount} onChange={(event) => patch({ cost_amount: Number(event.target.value) })} data-field="cost" />
                <span className="help">הסכום הוא לאדם, בשקלים. התשלום לא נגבה באפליקציה.</span>
              </>
            )}
            {errors.cost && <span className="err">{errors.cost}</span>}
          </div>
          <div className="field">אופן הצטרפות
            <div className="segment">
              <button type="button" className={draft.join_policy === "immediate" ? "on" : ""} onClick={() => patch({ join_policy: "immediate" satisfies JoinPolicy })}>הצטרפות מיידית</button>
              <button type="button" className={draft.join_policy === "approval" ? "on" : ""} onClick={() => patch({ join_policy: "approval" })}>באישור שלי</button>
            </div>
          </div>
          <div className="field">בדיקה לפני פרסום
            <div className="review">
              <Cover sport={draft.sport_id} />
              <div>
                <h3>{draft.title}</h3>
                <div className="meta">{draft.starts_at ? formatWhen(draft.starts_at, new Date(), "comma") : ""}</div>
                <div className="meta">{draft.place_name}</div>
                <div className="meta">{draft.address}</div>
                <div className="meta">{LEVEL_LABEL[draft.level]} · {costLabel(draft.cost_mode === "paid" ? draft.cost_amount : 0)} · {draft.capacity_mode === "limited" ? `עד ${draft.capacity}` : "ללא הגבלה"}</div>
              </div>
            </div>
            <button type="button" className="text-btn" onClick={() => navigate("/publish/1")}><Icon name="pencil" size={14} />עריכת פרטים</button>
            <p className="help">הפעילות תופיע בחיפוש ובפרופיל שלך.</p>
          </div>
          <div className="btn-row">
            <button className="btn primary" type="submit" disabled={busy} style={{ flex: 1.6 }}>{busy ? "מפרסם…" : "פרסום פעילות"}</button>
            <button className="btn" type="button" onClick={() => navigate("/publish/2")}>חזרה</button>
          </div>
        </form>
      )}
    </Phone>
  );
}
