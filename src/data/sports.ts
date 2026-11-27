export interface SportDef {
  id: string;
  name: string;
  suggestedTitle: string;
}

/** More than 10, extensible. Not a closed catalogue. */
export const SPORTS: SportDef[] = [
  { id: "soccer", name: "כדורגל", suggestedTitle: "כדורגל בערב" },
  { id: "basketball", name: "כדורסל", suggestedTitle: "כדורסל בפארק" },
  { id: "volleyball", name: "כדורעף", suggestedTitle: "כדורעף בחוף" },
  { id: "tennis", name: "טניס", suggestedTitle: "טניס למתחילים" },
  { id: "walking", name: "הליכה", suggestedTitle: "הליכה בפארק" },
  { id: "running", name: "ריצה", suggestedTitle: "ריצת בוקר" },
  { id: "swimming", name: "שחייה", suggestedTitle: "שחייה בבוקר" },
  { id: "cycling", name: "רכיבה", suggestedTitle: "רכיבת בוקר" },
  { id: "yoga", name: "יוגה", suggestedTitle: "יוגה בפארק" },
  { id: "fitness", name: "כושר", suggestedTitle: "אימון כושר" },
  { id: "padel", name: "פאדל", suggestedTitle: "פאדל אחה״צ" },
  { id: "table-tennis", name: "טניס שולחן", suggestedTitle: "טניס שולחן" },
  { id: "climbing", name: "טיפוס", suggestedTitle: "טיפוס בקיר" },
  { id: "pilates", name: "פילאטיס", suggestedTitle: "פילאטיס" },
];

export function sportById(id: string): SportDef | undefined {
  return SPORTS.find((s) => s.id === id);
}

export function sportName(id: string): string {
  return sportById(id)?.name ?? id;
}

export function suggestTitle(sportId: string): string {
  return sportById(sportId)?.suggestedTitle ?? "";
}

export interface PlaceOption {
  id: string;
  name: string;
  address: string;
  city: string;
  lat: number;
  lon: number;
}

/** Local stand-in for a places provider. Fictional street, real-area coordinates. */
export const PLACES: PlaceOption[] = [
  {
    id: "park-ka",
    name: "מגרש הספורט בפארק",
    address: "רחוב הדוגמה 12, קרית אתא",
    city: "קרית אתא",
    lat: 32.8094,
    lon: 35.105,
  },
  {
    id: "soccer-haifa",
    name: "מגרש הכדורגל העירוני",
    address: "רחוב הדוגמה 12, חיפה",
    city: "חיפה",
    lat: 32.794,
    lon: 34.9896,
  },
  {
    id: "tennis-haifa",
    name: "מגרשי הטניס העירוניים",
    address: "רחוב הדוגמה 12, חיפה",
    city: "חיפה",
    lat: 32.8012,
    lon: 34.995,
  },
  {
    id: "bialik",
    name: "פארק קרית ביאליק",
    address: "רחוב הדוגמה 8, קרית ביאליק",
    city: "קרית ביאליק",
    lat: 32.8275,
    lon: 35.086,
  },
  {
    id: "promenade",
    name: "טיילת החוף",
    address: "טיילת בת גלים, חיפה",
    city: "חיפה",
    lat: 32.8302,
    lon: 34.97,
  },
  {
    id: "arena",
    name: "היכל הספורט",
    address: "רחוב הדוגמה 3, חיפה",
    city: "חיפה",
    lat: 32.788,
    lon: 35.001,
  },
];
