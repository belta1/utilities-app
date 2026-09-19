// <NAME> — one-line description of what this UI is for.
// Copy to pages/<name>.jsx, rename the export, replace the two tabs. Everything a page
// needs is here: fonts + resets, sticky header with tabs, API helper, a data hook with
// loading/empty/error states, and SSR-safe "today". See .claude/skills/new-webui/SKILL.md.
import { useState, useEffect, useMemo, useCallback } from "react";
import { T } from "./_lib/recomp/tokens.jsx";

const MONO = "'JetBrains Mono',monospace";
const GROT = "'Space Grotesk',sans-serif";

// ═══════════════════════════════════════════════════════════════
// API + DATE HELPERS
// ═══════════════════════════════════════════════════════════════
async function api(method, url, body) {
  let res;
  try {
    res = await fetch(url, {
      method,
      headers: body ? { "content-type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error(`sin respuesta de ${location.host} (${method} ${url})`);
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || res.statusText);
  return data;
}

const pad = (n) => String(n).padStart(2, "0");
const localDate = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseDate = (iso) => { const [y, m, d] = iso.split("-").map(Number); return new Date(y, m - 1, d); };
const shiftDate = (iso, delta) => { const d = parseDate(iso); d.setDate(d.getDate() + delta); return localDate(d); };
const fmtDate = (iso) => parseDate(iso).toLocaleDateString("es-ES", { weekday: "short", day: "2-digit", month: "short" });

// ═══════════════════════════════════════════════════════════════
// DATA HOOKS
// ═══════════════════════════════════════════════════════════════
// Rows for a date range, plus mutations that refetch afterwards. Swap the URL for
// your app's route; keep the shape { rows, loading, error, busy, add, remove }.
function useItems(from, to) {
  const [rows, setRows] = useState(null);          // null = not loaded yet
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const refresh = useCallback(() => {
    if (!from || !to) return Promise.resolve();
    return api("GET", `/api/<app>/items?from=${from}&to=${to}`).then(setRows).catch((e) => setError(e.message));
  }, [from, to]);
  useEffect(() => { refresh(); }, [refresh]);
  const run = async (fn) => {
    setBusy(true); setError(null);
    try { await fn(); await refresh(); } catch (e) { setError(e.message); } finally { setBusy(false); }
  };
  return {
    rows, loading: rows === null && !error, busy, error,
    add: (body) => run(() => api("POST", "/api/<app>/items", body)),
    remove: (id) => run(() => api("DELETE", `/api/<app>/items/${id}`)),
  };
}

// ═══════════════════════════════════════════════════════════════
// SHARED WIDGETS
// ═══════════════════════════════════════════════════════════════
const Label = ({ children, color = T.faint, style }) => (
  <div style={{ fontSize: 8, letterSpacing: 2, color, fontFamily: MONO, ...style }}>{children}</div>
);

const Card = ({ accent, children, style }) => (
  <div style={{ background: T.surface, border: `1px solid ${T.line}`, borderLeft: accent ? `3px solid ${accent}` : undefined, borderRadius: 13, padding: "12px 14px", ...style }}>
    {children}
  </div>
);

const Stat = ({ label, value, color = T.bone }) => (
  <div style={{ background: T.bg, borderRadius: 7, padding: "6px 8px", flex: 1, textAlign: "center", border: `1px solid ${T.line}` }}>
    <div style={{ fontSize: 7, color: T.faint, letterSpacing: 1.5, fontFamily: MONO }}>{label}</div>
    <div style={{ fontSize: 14, fontFamily: GROT, fontWeight: 700, color }}>{value}</div>
  </div>
);

const inputStyle = {
  width: "100%", minWidth: 0, background: T.bg, border: `1px solid ${T.line}`, borderRadius: 8,
  color: T.bone, padding: "8px 9px", fontFamily: GROT, fontSize: 14, fontWeight: 700, outline: "none",
};

const Field = ({ label, accent, ...input }) => (
  <label style={{ flex: 1, minWidth: 0 }}>
    <Label style={{ marginBottom: 4 }}>{label}</Label>
    <input {...input} style={{ ...inputStyle, borderColor: input.value ? accent + "88" : T.line }} />
  </label>
);

const Btn = ({ children, onClick, accent = T.copper, disabled, small, ghost, style }) => (
  <button onClick={onClick} disabled={disabled} style={{
    background: ghost ? "none" : disabled ? T.raised : accent, color: ghost ? accent : disabled ? T.faint : T.bg,
    border: ghost ? `1px solid ${accent}66` : "none", borderRadius: 8, cursor: disabled ? "default" : "pointer",
    padding: small ? "5px 9px" : "9px 14px", fontFamily: GROT, fontWeight: 700, fontSize: small ? 11 : 13,
    letterSpacing: 0.5, whiteSpace: "nowrap", transition: "all .15s", ...style,
  }}>{children}</button>
);

const Empty = ({ children }) => (
  <div style={{ textAlign: "center", padding: "18px 0", color: T.faint, fontFamily: MONO, fontSize: 10, letterSpacing: 1 }}>{children}</div>
);
const ErrorNote = ({ children }) => children ? <div style={{ marginTop: 6, fontSize: 10, color: "#D98A8A" }}>{children}</div> : null;

// ═══════════════════════════════════════════════════════════════
// TAB 1 — list + add form for the last 30 days
// ═══════════════════════════════════════════════════════════════
const ItemsTab = ({ today }) => {
  const accent = T.copper;
  const items = useItems(today && shiftDate(today, -30), today);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const ok = name.trim() && Number.isFinite(Number(amount)) && Number(amount) >= 0;
  const total = useMemo(() => (items.rows ?? []).reduce((s, r) => s + Number(r.amount), 0), [items.rows]);

  if (!today || items.loading) return <Empty>cargando…</Empty>;
  if (items.rows === null) return <div style={{ padding: 14 }}><ErrorNote>{items.error}</ErrorNote></div>;

  return (
    <div style={{ padding: "14px 14px 26px" }} className="fadein">
      <Card accent={accent} style={{ marginBottom: 10 }}>
        <Label style={{ marginBottom: 8 }}>// ULTIMOS_30_DIAS</Label>
        <div style={{ display: "flex", gap: 5 }}>
          <Stat label="REGISTROS" value={items.rows.length} color={accent} />
          <Stat label="TOTAL" value={total.toLocaleString("es-ES")} color={T.gold} />
        </div>
      </Card>

      <Card style={{ marginBottom: 12, display: "flex", flexDirection: "column", gap: 8 }}>
        <Label color={accent}>// ANADIR</Label>
        <div style={{ display: "flex", gap: 7, alignItems: "flex-end" }}>
          <Field label="NOMBRE" accent={accent} value={name} onChange={(e) => setName(e.target.value)} placeholder="nombre" />
          <Field label="CANTIDAD" accent={accent} type="number" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" />
          <Btn accent={accent} disabled={!ok || items.busy}
            onClick={() => items.add({ name: name.trim(), amount: Number(amount), date: today }).then(() => { setName(""); setAmount(""); })}>
            + GUARDAR
          </Btn>
        </div>
        <ErrorNote>{items.error}</ErrorNote>
      </Card>

      {items.rows.length === 0 ? <Empty>SIN REGISTROS</Empty> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {items.rows.map((r) => (
            <div key={r.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: T.surface, border: `1px solid ${T.line}`, borderRadius: 9, padding: "8px 12px" }}>
              <div>
                <div style={{ fontFamily: GROT, fontSize: 12, fontWeight: 700, color: T.bone }}>{r.name}</div>
                <div style={{ fontSize: 9, color: T.ash, fontFamily: MONO, textTransform: "capitalize" }}>{fmtDate(r.happened_on)}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontFamily: GROT, fontWeight: 700, color: T.gold }}>{r.amount}</span>
                <button onClick={() => items.remove(r.id)} title="Borrar" style={{ background: "none", border: "none", color: T.faint, cursor: "pointer", fontSize: 11 }}>✕</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// TAB 2 — static content (no data)
// ═══════════════════════════════════════════════════════════════
const InfoTab = () => (
  <div style={{ padding: "14px 14px 26px" }} className="fadein">
    <Card accent={T.sage}>
      <Label color={T.sage} style={{ marginBottom: 6 }}>// COMO_FUNCIONA</Label>
      <div style={{ fontSize: 11, color: T.bone, lineHeight: 1.8 }}>
        Texto explicativo. Sin acentos, frases cortas. Un dato por linea.
      </div>
    </Card>
  </div>
);

// ═══════════════════════════════════════════════════════════════
// ROOT
// ═══════════════════════════════════════════════════════════════
const TABS = [["items", "REGISTROS"], ["info", "INFO"]];

export default function App() {
  const [tab, setTab] = useState(TABS[0][0]);
  const [today, setToday] = useState(null);           // set after mount: SSR has no local date
  useEffect(() => { setToday(localDate()); }, []);

  return (
    <div style={{ fontFamily: MONO, background: T.bg, minHeight: "100vh", color: T.bone }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=JetBrains+Mono:wght@400;600&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        body{background:${T.bg}}
        ::-webkit-scrollbar{width:4px;height:4px}::-webkit-scrollbar-track{background:#14110F}::-webkit-scrollbar-thumb{background:#3A332B;border-radius:2px}
        button,input,select{font-family:inherit}
        input:focus,select:focus{border-color:${T.copper}!important}
        input::placeholder{color:${T.faint};font-weight:500}
        input[type=number]::-webkit-inner-spin-button,input[type=number]::-webkit-outer-spin-button{-webkit-appearance:none}
        input[type=number]{-moz-appearance:textfield}
        .fadein{animation:fi .3s ease}
        @keyframes fi{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        @media (prefers-reduced-motion: reduce){ *{animation:none!important;transition:none!important} }
      `}</style>

      <div style={{ padding: "18px 16px 0", borderBottom: `1px solid ${T.line}`, background: T.bg, position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 8, letterSpacing: 3, color: T.faint, marginBottom: 3 }}>// APP_LABEL</div>
            <div style={{ fontFamily: GROT, fontSize: 24, fontWeight: 700, lineHeight: 0.95, letterSpacing: "-0.5px", color: T.bone }}>
              NOMBRE<span style={{ color: T.copper }}>_</span>v1
            </div>
          </div>
          <div style={{ textAlign: "right", fontSize: 9, color: T.ash, lineHeight: 1.6 }}>
            {today && <div style={{ textTransform: "capitalize" }}>{fmtDate(today)}</div>}
          </div>
        </div>
        <div style={{ display: "flex" }}>
          {TABS.map(([t, lbl]) => (
            <button key={t} onClick={() => setTab(t)} style={{
              flex: 1, background: "none", border: "none", cursor: "pointer", padding: "9px 2px",
              fontSize: 9.5, letterSpacing: 1.5, transition: "all .2s",
              color: tab === t ? T.copper : T.faint,
              borderBottom: tab === t ? `2px solid ${T.copper}` : `2px solid transparent`,
            }}>{lbl}</button>
          ))}
        </div>
      </div>

      <div key={tab}>
        {tab === "items" ? <ItemsTab today={today} /> : <InfoTab />}
      </div>

      <div style={{ padding: "10px 18px 26px", textAlign: "center", fontSize: 8, color: T.faint, letterSpacing: 2 }}>
        PIE_DE_PAGINA
      </div>
    </div>
  );
}
