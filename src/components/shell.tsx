import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { useStore } from "../data/store";
import { Icon } from "./icons";

export function DemoBanner() {
  const { reset } = useStore();
  return (
    <div className="demo-banner">
      <span>גרסת הדגמה — נתוני דמה</span>
      <button type="button" onClick={reset}>
        איפוס
      </button>
    </div>
  );
}

const TABS = [
  { to: "/", label: "בית", icon: "home" as const, end: true },
  { to: "/discover", label: "גילוי", icon: "compass" as const, end: false },
  { to: "/my", label: "הפעילויות שלי", icon: "calendar" as const, end: false },
  { to: "/profile", label: "פרופיל", icon: "user" as const, end: false },
];

export function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="ניווט ראשי">
      {TABS.map((tab) => (
        <NavLink key={tab.to} to={tab.to} end={tab.end} className={({ isActive }) => `nav-item${isActive ? " on" : ""}`}>
          <Icon name={tab.icon} size={22} />
          <span>{tab.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

export function Phone({
  screen,
  children,
  nav = true,
  cta,
  overlay,
}: {
  screen: string;
  children: ReactNode;
  nav?: boolean;
  cta?: ReactNode;
  overlay?: ReactNode;
}) {
  return (
    <div className="stage">
      <div className="phone" data-screen={screen}>
        <DemoBanner />
        <div className="scroll" data-scroll>
          {children}
        </div>
        {cta}
        {nav && <BottomNav />}
        {overlay}
      </div>
    </div>
  );
}

export function Toasts() {
  const { toasts } = useStore();
  if (!toasts.length) return null;
  return (
    <div className="toasts" role="status">
      {toasts.map((toast) => (
        <div key={toast.id} className="toast">
          {toast.text}
        </div>
      ))}
    </div>
  );
}

export function Overlay({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div className="overlay" role="presentation" onClick={onClose}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label={title} onClick={(event) => event.stopPropagation()}>
        <div className="sheet-head">
          <h2>{title}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="סגירה">
            <Icon name="close" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
