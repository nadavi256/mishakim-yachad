import type { ReactNode } from "react";

export type IconName =
  | "bell"
  | "chevron"
  | "down"
  | "pin"
  | "search"
  | "star"
  | "starFill"
  | "check"
  | "close"
  | "back"
  | "pencil"
  | "eye"
  | "megaphone"
  | "gear"
  | "shield"
  | "help"
  | "home"
  | "compass"
  | "calendar"
  | "user"
  | "chat"
  | "send"
  | "bookmark"
  | "bookmarkFill"
  | "plus"
  | "info"
  | "clock"
  | "chart"
  | "coin"
  | "mail"
  | "share"
  | "people"
  | "filter";

export function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  const p = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
  };
  const paths: Record<IconName, ReactNode> = {
    bell: (
      <>
        <path d="M6 9a6 6 0 1 1 12 0c0 7 2.5 7 2.5 7h-17S6 16 6 9" />
        <path d="M10 19a2 2 0 0 0 4 0" />
      </>
    ),
    chevron: <path d="M14 6 8 12l6 6" />,
    down: <path d="m6 9 6 6 6-6" />,
    pin: (
      <>
        <path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z" />
        <circle cx="12" cy="10" r="2.2" />
      </>
    ),
    search: (
      <>
        <circle cx="11" cy="11" r="6.5" />
        <path d="m16 16 4 4" />
      </>
    ),
    star: <path d="m12 3.5 2.4 5 5.6.7-4.1 3.8 1.1 5.5L12 16.8 7 18.5l1.1-5.5L4 9.2l5.6-.7L12 3.5z" />,
    starFill: <path d="m12 3.5 2.4 5 5.6.7-4.1 3.8 1.1 5.5L12 16.8 7 18.5l1.1-5.5L4 9.2l5.6-.7L12 3.5z" fill="currentColor" stroke="none" />,
    check: <path d="m5 12 5 5L20 7" />,
    close: (
      <>
        <path d="M6 6l12 12" />
        <path d="M18 6 6 18" />
      </>
    ),
    back: <path d="M9 6l6 6-6 6" />,
    pencil: (
      <>
        <path d="M4 20h4l10-10-4-4L4 16v4z" />
        <path d="m13 7 4 4" />
      </>
    ),
    eye: (
      <>
        <path d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6S2 12 2 12z" />
        <circle cx="12" cy="12" r="2.5" />
      </>
    ),
    megaphone: (
      <>
        <path d="M4 10v4l12 4V6L4 10z" />
        <path d="M8 14.5V19" />
      </>
    ),
    gear: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M12 3.5v2.2M12 18.3V20.5M4.8 6.5l1.6 1.6M17.6 15.9l1.6 1.6M3.5 12h2.2M18.3 12h2.2M4.8 17.5l1.6-1.6M17.6 8.1l1.6-1.6" />
      </>
    ),
    shield: <path d="M12 3 5 6v6c0 4.2 2.8 7.2 7 8.8 4.2-1.6 7-4.6 7-8.8V6l-7-3z" />,
    help: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M9.5 9a2.5 2.5 0 1 1 3.6 2.2c-.8.4-1.1 1-1.1 1.8V14" />
        <path d="M12 17h.01" />
      </>
    ),
    home: (
      <>
        <path d="m4 11 8-7 8 7" />
        <path d="M6 10.5V20h12v-9.5" />
      </>
    ),
    compass: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="m14.8 9.2-1.3 4.3-4.3 1.3 1.3-4.3 4.3-1.3z" />
      </>
    ),
    calendar: (
      <>
        <rect x="4" y="5" width="16" height="15" rx="2" />
        <path d="M8 3.5V7M16 3.5V7M4 10h16" />
      </>
    ),
    user: (
      <>
        <circle cx="12" cy="8" r="3.2" />
        <path d="M5 19c1.4-3 3.8-4.5 7-4.5S17.6 16 19 19" />
      </>
    ),
    chat: <path d="M5 16.5 3.5 20 8 18.2A8.5 8.5 0 1 0 5 16.5z" />,
    send: <path d="M4 12 20 4l-6 16-2.5-6.5L4 12z" />,
    bookmark: <path d="M7 4h10a1 1 0 0 1 1 1v15l-6-3.2L6 20V5a1 1 0 0 1 1-1z" />,
    bookmarkFill: <path d="M7 4h10a1 1 0 0 1 1 1v15l-6-3.2L6 20V5a1 1 0 0 1 1-1z" fill="currentColor" />,
    plus: (
      <>
        <path d="M12 5v14" />
        <path d="M5 12h14" />
      </>
    ),
    info: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 11v6" />
        <path d="M12 8h.01" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="8" />
        <path d="M12 8v4.5l3 2" />
      </>
    ),
    chart: (
      <>
        <path d="M5 19V9" />
        <path d="M12 19V5" />
        <path d="M19 19v-7" />
      </>
    ),
    coin: (
      <>
        <ellipse cx="12" cy="7" rx="7" ry="3" />
        <path d="M5 7v5c0 1.7 3.1 3 7 3s7-1.3 7-3V7" />
        <path d="M5 12v5c0 1.7 3.1 3 7 3s7-1.3 7-3v-5" />
      </>
    ),
    mail: (
      <>
        <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
        <path d="m4 7 8 6 8-6" />
      </>
    ),
    share: (
      <>
        <circle cx="6" cy="12" r="2" />
        <circle cx="17" cy="7" r="2" />
        <circle cx="17" cy="17" r="2" />
        <path d="m8 11 7-3M8 13l7 3" />
      </>
    ),
    people: (
      <>
        <circle cx="9" cy="8" r="2.2" />
        <circle cx="16" cy="9" r="1.8" />
        <path d="M4.5 18c.8-2.4 2.4-3.6 4.5-3.6s3.7 1.2 4.5 3.6" />
        <path d="M13 14.6c.8-.4 1.8-.6 3-.6 1.8 0 3.2.9 4 2.8" />
      </>
    ),
    filter: <path d="M4 6h16M7 12h10M10 18h4" />,
  };
  return <svg {...p}>{paths[name]}</svg>;
}

export function SportGlyph({ sport, size = 18 }: { sport: string; size?: number }) {
  const p = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    "aria-hidden": true as const,
  };
  if (sport === "basketball") {
    return (
      <svg {...p}>
        <circle cx="12" cy="12" r="8" />
        <path d="M4.5 12h15M12 4.2c2.4 2.4 2.4 13.2 0 15.6M12 4.2c-2.4 2.4-2.4 13.2 0 15.6" />
      </svg>
    );
  }
  if (sport === "soccer") {
    return (
      <svg {...p}>
        <circle cx="12" cy="12" r="8" />
        <path d="m12 8 3 2.2-1 3.4h-4L9 10.2 12 8z" />
      </svg>
    );
  }
  if (sport === "tennis") {
    return (
      <svg {...p}>
        <circle cx="12" cy="12" r="8" />
        <path d="M5 8c3 1 5 4 5 8M19 8c-3 1-5 4-5 8" />
      </svg>
    );
  }
  if (sport === "volleyball") {
    return (
      <svg {...p}>
        <circle cx="12" cy="12" r="8" />
        <path d="M12 4c2 4 2 12 0 16M5 9c5 2 9 2 14 0" />
      </svg>
    );
  }
  if (sport === "running" || sport === "walking") {
    return (
      <svg {...p}>
        <circle cx="14" cy="5.5" r="1.6" />
        <path d="M8 20l3-5 2 2 3 3M11 15l-2-3 4-1 2 2 3-1" />
      </svg>
    );
  }
  if (sport === "cycling") {
    return (
      <svg {...p}>
        <circle cx="7" cy="16" r="3" />
        <circle cx="17" cy="16" r="3" />
        <path d="m7 16 4-6h4l2 6M11 10l2-3h3" />
      </svg>
    );
  }
  if (sport === "swimming") {
    return (
      <svg {...p}>
        <path d="M3 15c2 1.5 3.2 1.5 4.5 0S10 13.5 12 15s3.2 1.5 4.5 0S19 13.5 21 15" />
        <path d="M3 19c2 1.5 3.2 1.5 4.5 0S10 17.5 12 19s3.2 1.5 4.5 0S19 17.5 21 19" />
        <circle cx="16" cy="8" r="1.4" />
      </svg>
    );
  }
  if (sport === "yoga" || sport === "pilates") {
    return (
      <svg {...p}>
        <circle cx="12" cy="6" r="1.6" />
        <path d="M12 8v4M8 20c1.2-3 2.4-4 4-4s2.8 1 4 4M5 13c2.2.8 4.4.8 7 .2 2.6-.6 4.6-.6 7 .2" />
      </svg>
    );
  }
  return (
    <svg {...p}>
      <path d="M6 14c2-6 10-6 12 0" />
      <path d="M8 14h8v3a4 4 0 0 1-8 0v-3z" />
      <path d="M9 8h6" />
    </svg>
  );
}
