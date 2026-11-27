import { SportGlyph } from "./icons";

const FACES: Record<string, { skin: string; hair: string; shirt: string; hairPath: string; beard?: boolean }> = {
  liron: {
    skin: "#f0c2a0",
    hair: "#3a2a22",
    shirt: "#1c8f45",
    hairPath: "M24 30c1-10 8-16 16-16s15 6 16 16c-3-6-8-8-16-8s-13 2-16 8z",
    beard: true,
  },
  daniel: {
    skin: "#e8b892",
    hair: "#2a211c",
    shirt: "#24507a",
    hairPath: "M22 32c0-12 7-18 18-18s18 6 18 16c-2-2-6 2-8 0-3-4-8-6-10-6s-8 2-10 6c-2 2-6-2-8 2z",
  },
  yossi: {
    skin: "#efc3a2",
    hair: "#4a3428",
    shirt: "#5d6b78",
    hairPath: "M26 28c1-8 6-12 14-12s13 4 14 12c-4-5-8-6-14-6s-10 1-14 6z",
    beard: true,
  },
  maya: {
    skin: "#f3c7aa",
    hair: "#6b3e2e",
    shirt: "#e7f6ec",
    hairPath: "M20 34c2-16 10-22 20-22 8 0 16 4 18 14-6-2-8 6-10 8-4-10-12-12-18-8-4 2-8 4-10 8z",
  },
  omer: {
    skin: "#e7b48e",
    hair: "#241814",
    shirt: "#2f6fbe",
    hairPath: "M22 31c1-11 8-17 18-17s17 6 18 16c-4-3-7 1-9-1-2-5-6-7-9-7s-7 2-9 7c-2 2-5-2-9 2z",
  },
};

export function Avatar({ id, size = 72 }: { id: string; size?: number }) {
  const face = FACES[id] ?? FACES.liron;
  return (
    <svg className="avatar" width={size} height={size} viewBox="0 0 80 80" aria-hidden>
      <circle cx="40" cy="40" r="40" fill="#e8f6ee" />
      <path d="M12 78c4-18 14-26 28-26s24 8 28 26" fill={face.shirt} />
      <circle cx="40" cy="34" r="14" fill={face.skin} />
      <path d={face.hairPath} fill={face.hair} />
      {face.beard && <path d="M30 40c2 8 6 11 10 11s8-3 10-11c-3 3-6 4-10 4s-7-1-10-4z" fill={face.hair} opacity="0.85" />}
      <circle cx="35" cy="33" r="1.3" fill="#2c241f" />
      <circle cx="45" cy="33" r="1.3" fill="#2c241f" />
      <path d="M34 39c2 2.4 4.2 3.2 6 3.2s4-.8 6-3.2" stroke="#c47d6c" strokeWidth="1.4" fill="none" strokeLinecap="round" />
    </svg>
  );
}

export function LetterAvatar({ letter }: { letter: string }) {
  return <span className="letter-avatar">{letter}</span>;
}

export function SportBadge({ sport, size = 36 }: { sport: string; size?: number }) {
  return (
    <span className="sport-badge" style={{ width: size, height: size }}>
      <SportGlyph sport={sport} size={Math.round(size * 0.56)} />
    </span>
  );
}

export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden>
      <circle cx="11" cy="11" r="3" fill="#178a3e" />
      <circle cx="21" cy="12" r="2.5" fill="#1aa34a" />
      <path d="M4 26c1.2-5 4-7.5 7.2-7.5 2.4 0 4.2 1.2 5.3 3.2" fill="none" stroke="#178a3e" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M16.5 22c.8-3.2 2.6-5 5.2-5 2.6 0 4.4 1.6 5.4 4.6" fill="none" stroke="#1aa34a" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

export function Brand({ variant = "lockup" }: { variant?: "swoosh" | "lockup" }) {
  return (
    <div className={`brand ${variant}`}>
      {variant === "lockup" && <LogoMark />}
      <div className="brand-text">
        <span>משחקים יחד</span>
        <svg className="swoosh" viewBox="0 0 120 12" aria-hidden>
          <path d="M4 8c22-8 46-8 70-2 14 2 28 2 42-3" fill="none" stroke="#178a3e" strokeWidth="3.5" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );
}

export function Cover({ sport, className }: { sport: string; className?: string }) {
  return (
    <svg className={className ?? "cover"} viewBox="0 0 320 200" preserveAspectRatio="xMidYMid slice" aria-hidden>
      {sport === "basketball" && <BasketScene />}
      {sport === "tennis" && <TennisScene />}
      {sport === "soccer" && <SoccerScene />}
      {sport !== "basketball" && sport !== "tennis" && sport !== "soccer" && <ParkScene sport={sport} />}
    </svg>
  );
}

function BasketScene() {
  return (
    <>
      <rect width="320" height="200" fill="#b9ddf5" />
      <circle cx="250" cy="36" r="18" fill="#ffe08a" />
      <ellipse cx="40" cy="150" rx="50" ry="40" fill="#7dbb62" />
      <ellipse cx="70" cy="120" rx="28" ry="36" fill="#3e8f45" />
      <ellipse cx="280" cy="130" rx="36" ry="44" fill="#3e8f45" />
      <rect x="36" y="78" width="200" height="110" fill="#d86a3a" />
      <path d="M36 118h200M70 78v110M160 78v110" stroke="#f4e2cf" strokeWidth="3" />
      <rect x="214" y="70" width="8" height="90" fill="#d7dde3" />
      <rect x="196" y="78" width="44" height="6" fill="#e8eef2" />
      <path d="M200 84h36v22H200z" fill="none" stroke="#f4f7fa" strokeWidth="2" />
      <circle cx="248" cy="150" r="28" fill="#e07a2f" />
      <path d="M220 150h56M248 122v56M226 134c12 8 20 8 32 0M226 166c12-8 20-8 32 0" stroke="#9a4d16" strokeWidth="2" fill="none" />
    </>
  );
}

function TennisScene() {
  return (
    <>
      <rect width="320" height="200" fill="#d5efc8" />
      <rect x="28" y="28" width="230" height="150" fill="#6fbe73" />
      <rect x="40" y="40" width="206" height="126" fill="none" stroke="#f7fff4" strokeWidth="3" />
      <path d="M143 40v126" stroke="#f7fff4" strokeWidth="3" />
      <path d="M40 103h206" stroke="#f4f7f2" strokeWidth="4" />
      <path d="M40 96h206M40 110h206" stroke="#ece8df" strokeWidth="2" />
      <circle cx="250" cy="150" r="16" fill="#d6ef4a" />
      <path d="M238 150h24M250 138c6 6 6 18 0 24" stroke="#fff" strokeWidth="1.4" fill="none" />
      <ellipse cx="300" cy="40" rx="30" ry="24" fill="#8fd0f2" />
    </>
  );
}

function SoccerScene() {
  return (
    <>
      <rect width="320" height="200" fill="#8fd18a" />
      <rect x="24" y="24" width="272" height="152" fill="none" stroke="#f4fff4" strokeWidth="3" />
      <circle cx="160" cy="100" r="28" fill="none" stroke="#f4fff4" strokeWidth="3" />
      <path d="M24 100h272" stroke="#f4fff4" strokeWidth="2" />
      <rect x="24" y="58" width="40" height="84" fill="none" stroke="#f4fff4" strokeWidth="3" />
      <rect x="256" y="58" width="40" height="84" fill="none" stroke="#f4fff4" strokeWidth="3" />
      <circle cx="200" cy="132" r="18" fill="#f7f7f7" />
      <path d="m200 118 6 6-2 7h-8l-2-7 6-6z" fill="#222" />
    </>
  );
}

function ParkScene({ sport }: { sport: string }) {
  return (
    <>
      <rect width="320" height="200" fill="#d7ecfb" />
      <ellipse cx="60" cy="160" rx="70" ry="40" fill="#8dce78" />
      <ellipse cx="260" cy="150" rx="80" ry="46" fill="#6fbf6a" />
      <rect x="70" y="70" width="180" height="90" rx="12" fill="#e7f6ec" />
      <circle cx="160" cy="112" r="22" fill="#178a3e" />
      <text x="160" y="118" textAnchor="middle" fontSize="14" fill="#fff" fontFamily="Heebo, sans-serif">
        {sport === "running" ? "ריצה" : sport === "yoga" ? "יוגה" : sport === "swimming" ? "שחייה" : "ספורט"}
      </text>
    </>
  );
}

export function ParkMap({
  pinX,
  pinY,
  draggable,
  onPin,
  label,
}: {
  pinX: number;
  pinY: number;
  draggable?: boolean;
  onPin?: (x: number, y: number) => void;
  label?: string;
}) {
  function move(clientX: number, clientY: number, el: SVGSVGElement) {
    const rect = el.getBoundingClientRect();
    const x = Math.min(92, Math.max(8, ((clientX - rect.left) / rect.width) * 100));
    const y = Math.min(88, Math.max(12, ((clientY - rect.top) / rect.height) * 100));
    onPin?.(x, y);
  }

  return (
    <svg
      className={`park-map${draggable ? " is-draggable" : ""}`}
      viewBox="0 0 320 180"
      role="img"
      aria-label="מפת נקודת המפגש להמחשה"
      onPointerDown={(event) => {
        if (!draggable) return;
        (event.currentTarget as SVGSVGElement).setPointerCapture(event.pointerId);
        move(event.clientX, event.clientY, event.currentTarget);
      }}
      onPointerMove={(event) => {
        if (!draggable || !event.currentTarget.hasPointerCapture(event.pointerId)) return;
        move(event.clientX, event.clientY, event.currentTarget);
      }}
    >
      <rect width="320" height="180" fill="#d9efcf" />
      <path d="M0 40h320M0 100h320M70 0v180M200 0v180" stroke="#f7fbf4" strokeWidth="10" />
      <rect x="88" y="58" width="96" height="64" rx="4" fill="#c5e6b4" stroke="#7db86a" />
      <path d="M96 90h80M136 66v48" stroke="#f4fff4" strokeWidth="2" />
      <text x="118" y="132" fontSize="11" fill="#1d6b38" fontFamily="Heebo, sans-serif">
        פארק העיר
      </text>
      <text x="206" y="28" fontSize="11" fill="#5c6b7e" fontFamily="Heebo, sans-serif">
        {label || "רחוב הדוגמה"}
      </text>
      <g transform={`translate(${(pinX / 100) * 320} ${(pinY / 100) * 180})`}>
        <path d="M0 0c-10-16-18-16-18-28a18 18 0 1 1 36 0c0 12-8 12-18 28z" fill="#e23d3d" />
        <circle cy="-28" r="6" fill="#fff" />
      </g>
    </svg>
  );
}
