// Shared primitives of the "Goma y tiza" style: global CSS, cards, buttons, the stepper used
// to log a set, the plate row that counts sets, a progress ring and the bottom navigation.
// Presentation only — no data, no fetches.
import { T, FONT, NUM } from "./tokens.jsx";

export const GlobalStyle = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,400..800&display=swap');
    *{box-sizing:border-box;margin:0;padding:0}
    html{-webkit-text-size-adjust:100%}
    body{background:${T.bg};color:${T.bone};font-family:${FONT};-webkit-tap-highlight-color:transparent}
    button,input,select{font:inherit;color:inherit}
    button{cursor:pointer}
    button:disabled{cursor:default}
    :focus-visible{outline:2px solid ${T.bone};outline-offset:2px}
    input:focus{outline:none;border-color:${T.ash}!important}
    input::placeholder{color:${T.faint};opacity:1}
    input[type=number]::-webkit-inner-spin-button,input[type=number]::-webkit-outer-spin-button{-webkit-appearance:none;margin:0}
    input[type=number]{-moz-appearance:textfield}
    .exsvg svg{width:100%;height:100%;display:block}
    .scrollx{scrollbar-width:none;-webkit-overflow-scrolling:touch}
    .scrollx::-webkit-scrollbar{display:none}
    .fade{animation:fade .22s ease}
    @keyframes fade{from{opacity:0}to{opacity:1}}
    .open{animation:open .22s ease}
    @keyframes open{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:none}}
    .plate-in{animation:plate .32s cubic-bezier(.3,1.6,.5,1)}
    @keyframes plate{from{transform:scale(.4)}to{transform:scale(1)}}
    .press:active{transform:scale(.97)}
    summary{list-style:none}
    summary::-webkit-details-marker{display:none}
    details[open] .chev{transform:rotate(45deg)}
    @media (prefers-reduced-motion: reduce){*{animation:none!important;transition:none!important}}
  `}</style>
);

// A unit of content (an exercise, a meal). `accent` draws the plate-colored edge.
export const Card = ({ children, accent, style, onClick, ...rest }) => (
  <div onClick={onClick} {...rest} style={{
    background: T.surface, borderRadius: 20, padding: 16,
    boxShadow: accent ? `inset 4px 0 0 ${accent}` : "none",
    ...style,
  }}>{children}</div>
);

// A titled block that is not a card: the title is quiet, the content carries the weight.
export const Section = ({ title, aside, children, style }) => (
  <section style={{ marginTop: 28, ...style }}>
    {(title || aside) && (
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, marginBottom: 10 }}>
        <h2 style={{ fontSize: 13, fontWeight: 600, color: T.ash }}>{title}</h2>
        {aside && <div style={{ fontSize: 13, color: T.ash }}>{aside}</div>}
      </div>
    )}
    {children}
  </section>
);

// solid: filled with the accent (the one action of a block) · ghost: outlined · quiet: text only
export const Btn = ({ children, onClick, accent = T.bone, disabled, variant = "solid", size = "md", full, style, type = "button", ...rest }) => {
  const solid = variant === "solid";
  return (
    <button type={type} onClick={onClick} disabled={disabled} className="press" {...rest} style={{
      minHeight: size === "sm" ? 36 : 48, padding: size === "sm" ? "0 14px" : "0 18px",
      width: full ? "100%" : undefined, borderRadius: 14, whiteSpace: "nowrap",
      fontSize: size === "sm" ? 14 : 16, fontWeight: 700,
      background: solid ? (disabled ? T.raised : accent) : "transparent",
      color: solid ? (disabled ? T.faint : T.bg) : disabled ? T.faint : accent,
      border: variant === "ghost" ? `1.5px solid ${disabled ? T.line : accent + "88"}` : "none",
      transition: "background .15s, transform .1s",
      ...style,
    }}>{children}</button>
  );
};

// Day / filter pill. `sub` is a second, smaller line (the session type).
export const Pill = ({ on, accent = T.bone, onClick, children, sub, style }) => (
  <button type="button" onClick={onClick} aria-pressed={on} className="press" style={{
    flexShrink: 0, minWidth: 56, minHeight: 52, padding: "6px 12px", borderRadius: 16,
    background: on ? accent : T.surface, color: on ? T.bg : T.bone, border: "none",
    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 1,
    transition: "background .15s", scrollSnapAlign: "center", ...style,
  }}>
    <span style={{ fontSize: 15, fontWeight: 700 }}>{children}</span>
    {sub && <span style={{ fontSize: 11, fontWeight: 500, color: on ? T.bg : T.ash, opacity: on ? 0.75 : 1 }}>{sub}</span>}
  </button>
);

const num = (s) => { const n = Number(String(s).replace(",", ".")); return Number.isFinite(n) ? n : null; };

// − value + for one number of a set. Empty shows the placeholder (the previous set), and a
// tap on − / + starts from it, so repeating or nudging the last set is one tap.
export const Stepper = ({ label, value, onChange, placeholder, step = 1, accent, unit, inputMode = "decimal" }) => {
  const nudge = (dir) => {
    const base = value !== "" ? num(value) : num(placeholder);
    const next = Math.max(0, Math.round(((base ?? 0) + dir * step) * 100) / 100);
    onChange(String(next));
  };
  const btn = { width: 44, flexShrink: 0, background: "none", border: "none", color: T.ash, fontSize: 24, fontWeight: 500, lineHeight: 1 };
  return (
    <label style={{ flex: 1, minWidth: 0, display: "block" }}>
      <span style={{ display: "block", fontSize: 13, color: T.ash, marginBottom: 6 }}>{label}</span>
      <div style={{ display: "flex", alignItems: "stretch", height: 56, background: T.bg, borderRadius: 14, border: `1.5px solid ${value !== "" ? accent : T.line}` }}>
        <button type="button" aria-label={`menos ${label}`} onClick={() => nudge(-1)} className="press" style={btn}>−</button>
        <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "baseline", justifyContent: "center", gap: 3, paddingTop: 10 }}>
          <input type="number" inputMode={inputMode} enterKeyHint="go" step={step} min={0} value={value} placeholder={placeholder}
            onChange={(e) => onChange(e.target.value)} aria-label={label}
            style={{ ...NUM, width: "100%", minWidth: 0, textAlign: "center", fontSize: 26, background: "none", border: "none", outline: "none", color: T.bone, padding: 0 }} />
          {unit && <span style={{ fontSize: 13, color: T.ash, flexShrink: 0 }}>{unit}</span>}
        </div>
        <button type="button" aria-label={`mas ${label}`} onClick={() => nudge(1)} className="press" style={btn}>+</button>
      </div>
    </label>
  );
};

// One disc per planned set, filled as sets are logged; all green when the exercise is done.
// Logged sets beyond the plan still get a disc.
export const PlateRow = ({ planned, done, accent, size = 14 }) => {
  const n = Math.max(planned, done);
  if (!n) return null;
  const complete = planned > 0 && done >= planned;
  return (
    <div aria-label={`${done} de ${planned} series`} style={{ display: "flex", gap: 4, flexWrap: "wrap", justifyContent: "flex-end" }}>
      {Array.from({ length: n }, (_, i) => {
        const filled = i < done;
        const col = complete ? T.core : accent;
        return (
          <span key={i + (filled ? "f" : "e")} className={filled ? "plate-in" : undefined} style={{
            width: size, height: size, borderRadius: "50%", flexShrink: 0,
            background: filled ? `radial-gradient(circle, ${T.surface} 0 18%, ${col} 20%)` : "transparent",
            border: filled ? "none" : `2px solid ${col}55`,
          }} />
        );
      })}
    </div>
  );
};

// Progress ring with the count in the middle.
export const Ring = ({ value, total, accent, size = 64 }) => {
  const r = (size - 8) / 2, c = 2 * Math.PI * r;
  const p = total ? Math.min(1, value / total) : 0;
  const col = total && value >= total ? T.core : accent;
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }} aria-label={`${value} de ${total} series hoy`}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={T.raised} strokeWidth="6" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={col} strokeWidth="6" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - p)} style={{ transition: "stroke-dashoffset .4s ease" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", lineHeight: 1 }}>
        <span style={{ ...NUM, fontSize: 20 }}>{value}</span>
        <span style={{ fontSize: 11, color: T.ash }}>de {total}</span>
      </div>
    </div>
  );
};

// A logged set: value, optional RIR, delete.
export const SetChip = ({ set, accent, onRemove }) => (
  <div className="plate-in" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: T.bg, borderRadius: 12, padding: "6px 4px 6px 12px", minHeight: 40 }}>
    <span style={{ width: 8, height: 8, borderRadius: "50%", background: accent, flexShrink: 0 }} />
    <span style={{ ...NUM, fontSize: 18 }}>
      {set.duration_s
        ? <>{set.load_kg > 0 && <>{set.load_kg}<small style={{ fontSize: 12, color: T.ash, fontWeight: 500 }}> kg</small> · </>}{set.duration_s}<small style={{ fontSize: 12, color: T.ash, fontWeight: 500 }}> s</small></>
        : <>{set.load_kg}<small style={{ fontSize: 12, color: T.ash, fontWeight: 500 }}> kg</small> × {set.reps}</>}
    </span>
    {set.rir != null && <span title="Reps en reserva" style={{ fontSize: 12, color: set.rir === 0 ? T.danger : T.ash }}>RIR {set.rir}</span>}
    {onRemove
      ? <button type="button" onClick={onRemove} aria-label="Borrar serie" style={{ width: 32, height: 32, background: "none", border: "none", color: T.faint, fontSize: 16 }}>✕</button>
      : <span style={{ width: 8 }} />}
  </div>
);

const ICONS = {
  // barbell
  entreno: <><path d="M3 12h18" /><rect x="5" y="7" width="3" height="10" rx="1" /><rect x="16" y="7" width="3" height="10" rx="1" /></>,
  // list
  registro: <><path d="M9 6h11M9 12h11M9 18h11" /><circle cx="4.5" cy="6" r="1" /><circle cx="4.5" cy="12" r="1" /><circle cx="4.5" cy="18" r="1" /></>,
  // trend
  dash: <><path d="M3 17l6-6 4 4 8-8" /><path d="M15 7h6v6" /></>,
  // bowl
  nutricion: <><path d="M3 11h18a9 9 0 0 1-18 0z" /><path d="M8 7c0-2 2-2 2-4M13 7c0-2 2-2 2-4" /></>,
};

// Fixed bottom navigation, within thumb reach, clear of the home indicator.
export const BottomNav = ({ tabs, tab, onTab, accent }) => (
  <nav style={{
    position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 30,
    background: T.bg + "F2", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
    borderTop: `1px solid ${T.line}`, paddingBottom: "env(safe-area-inset-bottom)",
  }}>
    <div style={{ display: "flex", maxWidth: 640, margin: "0 auto" }}>
      {tabs.map(([key, label]) => {
        const on = tab === key;
        return (
          <button key={key} type="button" onClick={() => onTab(key)} aria-current={on ? "page" : undefined} style={{
            flex: 1, minHeight: 60, background: "none", border: "none", display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", gap: 3, color: on ? T.bone : T.faint, position: "relative",
          }}>
            {on && <span style={{ position: "absolute", top: 0, width: 28, height: 3, borderRadius: 2, background: accent }} />}
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{ICONS[key]}</svg>
            <span style={{ fontSize: 12, fontWeight: on ? 700 : 500 }}>{label}</span>
          </button>
        );
      })}
    </div>
  </nav>
);

export const ErrorNote = ({ children }) => (
  <div role="alert" style={{ marginTop: 10, padding: "10px 14px", borderRadius: 12, background: T.danger + "1A", color: T.danger, fontSize: 14, lineHeight: 1.45 }}>{children}</div>
);
