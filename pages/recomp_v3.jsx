// RECOMP v3 — the workout log and the plan, both backed by Postgres (/api/*).
//
// Everything with a number or a figure in it comes from the database: the catalog and
// its animated figures, the plan day and its prescribed sets/reps/rest, the load ladder
// and execution detail of each exercise, the coach's targets, and the body measurements
// on the telemetry tab. Swapping an exercise or rebalancing a target is therefore a
// write to the DB — no deploy, no page edit. Only the written content (weekly menu,
// macros, supplements, post-workout meals) still lives in ./_lib/recomp/data.jsx.
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { T, J } from "./_lib/recomp/tokens.jsx";
import { POST_WORKOUT } from "./_lib/recomp/data.jsx";
import { DashboardTab, NutritionTab } from "./_lib/recomp/ui.jsx";

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
    // fetch only rejects when no response came back at all (server down, wrong host,
    // blocked request); say where it was trying instead of the bare "Failed to fetch".
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
const fmtKg = (n) => Math.round(n).toLocaleString("es-ES");
const volume = (sets) => sets.reduce((sum, s) => sum + (s.reps ? s.load_kg * s.reps : 0), 0);
const fmtSet = (s) => (s.duration_s ? `${s.duration_s}s` : `${s.load_kg}×${s.reps}`);

// ═══════════════════════════════════════════════════════════════
// DATA HOOKS
// ═══════════════════════════════════════════════════════════════
function useExercises() {
  const [list, setList] = useState([]);
  const [error, setError] = useState(null);
  const refresh = useCallback(() => api("GET", "/api/exercises").then(setList).catch((e) => setError(e.message)), []);
  useEffect(() => { refresh(); }, [refresh]);
  const byName = useMemo(() => Object.fromEntries(list.map((e) => [e.name, e])), [list]);
  const byId = useMemo(() => Object.fromEntries(list.map((e) => [e.id, e])), [list]);
  return { list, byName, byId, error, refresh };
}

// The plan: one entry per day, each with its prescribed slots (main list + core
// finisher) already joined to the exercise's figure, load ladder and detail. Refetched
// on demand so a swap made by the coach shows up as soon as the tab is reopened.
function usePlan() {
  const [days, setDays] = useState([]);
  const [error, setError] = useState(null);
  const refresh = useCallback(() => api("GET", "/api/plan").then((rows) => { setDays(rows); setError(null); }).catch((e) => setError(e.message)), []);
  useEffect(() => { refresh(); }, [refresh]);
  return { days, error, refresh };
}

// Body composition rows, oldest first (the sparkline's order).
function useMeasurements() {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState(null);
  useEffect(() => {
    let live = true;
    api("GET", "/api/measurements?limit=24").then((r) => live && setRows(r)).catch((e) => live && setError(e.message));
    return () => { live = false; };
  }, []);
  return { rows, error };
}

// Distinct training days in the last 7 — the "sesiones/semana" goal on the dashboard.
function useSessionsPerWeek(today) {
  const [n, setN] = useState(null);
  useEffect(() => {
    if (!today) return;
    let live = true;
    api("GET", `/api/sets?from=${shiftDate(today, -6)}&to=${today}`)
      .then((sets) => live && setN(new Set(sets.map((s) => s.performed_on)).size))
      .catch(() => {});
    return () => { live = false; };
  }, [today]);
  return n;
}

// Sets logged on one date, plus mutations that refetch afterwards.
function useSets(date) {
  const [sets, setSets] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const refresh = useCallback(() => {
    if (!date) return Promise.resolve();
    return api("GET", `/api/sets?date=${date}`).then(setSets).catch((e) => setError(e.message));
  }, [date]);
  useEffect(() => { refresh(); }, [refresh]);
  const run = async (fn) => {
    setBusy(true); setError(null);
    try { await fn(); await refresh(); } catch (e) { setError(e.message); } finally { setBusy(false); }
  };
  return {
    sets, busy, error,
    add: (body) => run(() => api("POST", "/api/sets", { ...body, date })),
    remove: (id) => run(() => api("DELETE", `/api/sets/${id}`)),
  };
}

// Coach-set targets ("what to lift next time"), keyed by exercise id. Refetched
// whenever the day's sets change, since the coach writes them around the session.
function useTargets(dep) {
  const [byId, setById] = useState({});
  useEffect(() => {
    let live = true;
    api("GET", "/api/targets").then((rows) => live && setById(Object.fromEntries(rows.map((t) => [t.exercise_id, t])))).catch(() => {});
    return () => { live = false; };
  }, [dep]);
  return byId;
}

const TargetLine = ({ target, accent }) => (
  <div style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", columnGap: 6, rowGap: 2, minWidth: 0, maxWidth: "100%", marginTop: 7, padding: "5px 9px", background: accent + "12", border: `1px solid ${accent}33`, borderRadius: 7 }}>
    <span style={{ fontSize: 7, color: accent, letterSpacing: 1.5, fontFamily: MONO, flexShrink: 0 }}>OBJETIVO</span>
    <span style={{ fontSize: 12, fontFamily: GROT, fontWeight: 700, color: T.bone, flexShrink: 0, whiteSpace: "nowrap" }}>
      {target.load_kg != null && <>{target.load_kg}<span style={{ fontSize: 9, color: T.ash }}>kg</span></>}{target.load_kg != null && target.reps && " × "}{target.reps}
    </span>
    {target.reason && <span style={{ flex: "1 1 160px", minWidth: 0, fontSize: 9, color: T.ash, lineHeight: 1.45, whiteSpace: "normal", overflowWrap: "anywhere" }}>{target.reason}</span>}
  </div>
);

// Most recent earlier session for an exercise (for "ultima vez" and prefill).
function useLastSession(exerciseId, before) {
  const [last, setLast] = useState(null);
  useEffect(() => {
    setLast(null);
    if (!exerciseId || !before) return;
    let live = true;
    api("GET", `/api/exercises/${exerciseId}/last?before=${before}`).then((r) => live && setLast(r)).catch(() => {});
    return () => { live = false; };
  }, [exerciseId, before]);
  return last;
}

// ═══════════════════════════════════════════════════════════════
// SHARED WIDGETS
// ═══════════════════════════════════════════════════════════════
const GENERIC_SVG = `<svg viewBox="0 0 100 80" fill="none">
  <line x1="22" y1="40" x2="78" y2="40" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
  <rect x="10" y="27" width="12" height="26" rx="3" fill="currentColor" opacity=".85"/>
  <rect x="78" y="27" width="12" height="26" rx="3" fill="currentColor" opacity=".85"/>
</svg>`;

const ExerciseImage = ({ exercise, accent }) => (
  <div className="exsvg" style={{ width: "100%", height: "100%", color: accent }}
    dangerouslySetInnerHTML={{ __html: exercise?.svg || GENERIC_SVG }} />
);

const Label = ({ children, color = T.faint, style }) => (
  <div style={{ fontSize: 8, letterSpacing: 2, color, fontFamily: MONO, ...style }}>{children}</div>
);

const inputStyle = {
  width: "100%", minWidth: 0, background: T.bg, border: `1px solid ${T.line}`, borderRadius: 8,
  color: T.bone, padding: "8px 9px", fontFamily: GROT, fontSize: 14, fontWeight: 700, outline: "none",
};

const NumField = ({ label, value, onChange, placeholder, step = 1, accent }) => (
  <label style={{ flex: 1, minWidth: 0 }}>
    <Label style={{ marginBottom: 4 }}>{label}</Label>
    <input type="number" inputMode="decimal" step={step} min={0} value={value} placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      style={{ ...inputStyle, borderColor: value ? accent + "88" : T.line }} />
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

const SetChip = ({ set, accent, onRemove }) => (
  <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: T.bg, border: `1px solid ${accent}44`, borderRadius: 7, padding: "4px 7px 4px 9px" }}>
    <span style={{ fontSize: 8, color: T.faint, fontFamily: MONO }}>S{set.set_number}</span>
    <span style={{ fontSize: 12, fontFamily: GROT, fontWeight: 700, color: T.bone }}>
      {set.duration_s
        ? <>{set.load_kg > 0 && <>{set.load_kg}<span style={{ fontSize: 9, color: T.ash }}>kg</span> · </>}{set.duration_s}<span style={{ fontSize: 9, color: T.ash }}>s</span></>
        : <>{set.load_kg}<span style={{ fontSize: 9, color: T.ash }}>kg</span> × {set.reps}</>}
    </span>
    {set.rir != null && <span title="Reps en reserva" style={{ fontSize: 8, color: set.rir === 0 ? "#D98A8A" : T.ash, fontFamily: MONO }}>R{set.rir}</span>}
    {onRemove && <button onClick={onRemove} title="Borrar serie" style={{ background: "none", border: "none", color: T.faint, cursor: "pointer", fontSize: 11, padding: "0 2px" }}>✕</button>}
  </div>
);

// Inline "add a set" form for one exercise. Empty fields fall back to the placeholder,
// which is the previous set today, else the last set of the previous session. A set is
// reps or seconds (planks); the mode follows the previous set, else the `timed` hint
// from the plan, and can be flipped with the REPS/SEG toggle.
const SetLogger = ({ exercise, accent, sets, log, date, timed = false }) => {
  const [kg, setKg] = useState("");
  const [n, setN] = useState("");
  const [modeChoice, setMode] = useState(null);
  const last = useLastSession(exercise.id, date);
  const prev = sets[sets.length - 1] ?? last?.sets?.[last.sets.length - 1];
  const mode = modeChoice ?? (prev ? (prev.duration_s ? "time" : "reps") : timed ? "time" : "reps");
  const prevN = prev ? (mode === "time" ? prev.duration_s : prev.reps) : null;
  const kgVal = kg === "" ? (prev?.load_kg ?? (mode === "time" ? 0 : undefined)) : Number(kg.replace(",", "."));
  const nVal = n === "" ? prevN : Number(n);
  const [rir, setRir] = useState("");                 // reps in reserve, optional (0–5)
  const rirVal = rir === "" ? null : Number(rir);
  const ok = Number.isFinite(kgVal) && kgVal >= 0 && Number.isInteger(nVal) && nVal > 0 && (rirVal === null || (Number.isInteger(rirVal) && rirVal >= 0 && rirVal <= 5));
  const submit = () => log.add({ exercise_id: exercise.id, load_kg: kgVal, [mode === "time" ? "duration_s" : "reps"]: nVal, rir: rirVal });

  return (
    <div style={{ background: T.bg, border: `1px solid ${accent}55`, borderRadius: 9, padding: "10px 12px" }} onClick={(e) => e.stopPropagation()}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 7 }}>
        <Label color={accent}>// REGISTRO_HOY</Label>
        {last && (
          <div style={{ fontSize: 9, color: T.ash, fontFamily: MONO }}>
            ultima vez {fmtDate(last.performed_on)}: <span style={{ color: T.bone }}>{last.sets.map(fmtSet).join(" · ")}</span>
          </div>
        )}
      </div>
      {sets.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 8 }}>
          {sets.map((s) => <SetChip key={s.id} set={s} accent={accent} onRemove={() => log.remove(s.id)} />)}
        </div>
      )}
      <div style={{ display: "flex", gap: 7, alignItems: "flex-end" }}>
        <NumField label="CARGA KG" value={kg} onChange={setKg} placeholder={prev ? String(prev.load_kg) : mode === "time" ? "0" : "kg"} step={0.5} accent={accent} />
        <NumField label={mode === "time" ? "SEGUNDOS" : "REPS"} value={n} onChange={setN} placeholder={prevN != null ? String(prevN) : mode === "time" ? "seg" : "reps"} accent={accent} />
        {mode === "reps" && (
          <label style={{ flex: "0 0 46px", minWidth: 0 }} title="Reps en reserva al terminar la serie (0 = fallo)">
            <Label style={{ marginBottom: 4 }}>RIR</Label>
            <input type="number" inputMode="numeric" min={0} max={5} value={rir} placeholder="–" onChange={(e) => setRir(e.target.value)}
              style={{ ...inputStyle, padding: "8px 6px", textAlign: "center", borderColor: rir !== "" ? accent + "88" : T.line }} />
          </label>
        )}
        <button onClick={() => { setMode(mode === "time" ? "reps" : "time"); setN(""); setRir(""); }} title="Cambiar reps / segundos" style={{
          alignSelf: "flex-end", background: T.surface, border: `1px solid ${T.line}`, borderRadius: 8, padding: "9px 6px", cursor: "pointer",
          fontFamily: MONO, fontSize: 8, letterSpacing: 1, color: T.ash, whiteSpace: "nowrap",
        }}>
          <span style={{ color: mode === "reps" ? accent : T.faint }}>REPS</span>/<span style={{ color: mode === "time" ? accent : T.faint }}>SEG</span>
        </button>
        <Btn accent={accent} disabled={!ok || log.busy} onClick={submit} style={{ padding: "9px 10px" }}>+ S{sets.length + 1}</Btn>
      </div>
      {log.error && <div style={{ marginTop: 6, fontSize: 10, color: "#D98A8A" }}>{log.error}</div>}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// TRAINING TAB — v2 plan cards, images from DB, logger inside each card
// ═══════════════════════════════════════════════════════════════
const dayAccent = (type) => type === "strength" ? T.copper : type === "lesmills" ? T.steel : type === "recovery" ? T.sage : type === "core" ? T.gold : T.faint;

// A plan slot is the row the card renders. It carries its exercise's figure, load
// ladder and execution detail, so a card needs nothing else; `exercise_id` is null only
// for the Les Mills / cycling placeholders, which are shown but never logged.
const isTimed = (slot) => /seg/i.test(slot.reps ?? "");

// Plan day keys (planKey in db.mjs) by Date.getDay(), for opening on today's session.
const WEEKDAY_KEYS = ["domingo", "lunes", "martes", "miercoles", "jueves", "viernes", "sabado"];

const TrainingTab = ({ plan, today }) => {
  const [activeDay, setActiveDay] = useState(0);
  const [expandedEx, setExpandedEx] = useState(null);
  const log = useSets(today);
  const targets = useTargets(log.sets);
  const typeLabel = { strength: "FUERZA", lesmills: "CARDIO", recovery: "BALANCE", core: "CORE", rest: "OFF" };
  const days = plan.days;
  const dayStrip = useRef(null);
  const autoPicked = useRef(false);

  // Select today's plan day once, after mount (today is client-only), then bring its
  // button into view — never again, so a day the user tapped sticks.
  useEffect(() => {
    if (autoPicked.current || !today || !days.length) return;
    autoPicked.current = true;
    const i = days.findIndex((d) => d.key === WEEKDAY_KEYS[parseDate(today).getDay()]);
    if (i < 0) return;
    setActiveDay(i);
    requestAnimationFrame(() => dayStrip.current?.children[i]?.scrollIntoView({ inline: "center", block: "nearest" }));
  }, [today, days]);
  const sel = days[activeDay];
  const accent = dayAccent(sel?.type);
  const setsFor = (slot) => (slot.exercise_id ? log.sets.filter((s) => s.exercise_id === slot.exercise_id) : []);
  const main = sel ? sel.exercises.filter((x) => x.section !== "core") : [];
  const core = sel ? sel.exercises.filter((x) => x.section === "core") : [];

  if (plan.error) return <div style={{ padding: "26px 16px", fontSize: 11, color: "#D98A8A" }}>No se pudo cargar el plan: {plan.error}</div>;
  if (!sel) return <div style={{ padding: "26px 16px", fontSize: 10, color: T.faint, fontFamily: MONO, letterSpacing: 2 }}>// CARGANDO PLAN…</div>;

  return (
    <div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", padding: "9px 16px", background: T.surface, borderBottom: `1px solid ${T.line}` }}>
        {[["Hombro", J.shoulder], ["Codo", J.elbow], ["Rodilla", J.knee], ["Cadera", J.hip]].map(([lbl, col]) => (
          <div key={lbl} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: col }} />
            <span style={{ fontSize: 8, color: T.ash, letterSpacing: 1.5, fontFamily: MONO }}>{lbl.toUpperCase()}</span>
          </div>
        ))}
      </div>

      <div style={{ padding: "14px 14px 0" }}>
        <div ref={dayStrip} style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4, marginBottom: 14 }}>
          {days.map((d, i) => {
            const ac = dayAccent(d.type);
            const on = activeDay === i;
            return (
              <button key={d.id} onClick={() => { setActiveDay(i); setExpandedEx(null); }} style={{
                flexShrink: 0, padding: "8px 11px", borderRadius: 10, minWidth: 56, textAlign: "center", cursor: "pointer",
                background: on ? T.raised : T.surface, border: `1px solid ${on ? ac : T.line}`, borderTop: `2px solid ${on ? ac : T.line}`,
                color: on ? T.bone : T.ash, transition: "all .2s",
              }}>
                <div style={{ fontSize: 12, fontFamily: GROT, fontWeight: 700 }}>{d.day.slice(0, 3).toUpperCase()}</div>
                <div style={{ fontSize: 7, marginTop: 2, letterSpacing: 1, color: on ? ac : T.faint, fontFamily: MONO }}>{typeLabel[d.type]}</div>
              </button>
            );
          })}
        </div>
      </div>

      <div key={activeDay} style={{ padding: "0 14px 26px" }} className="fadein">
        <div style={{ background: T.surface, border: `1px solid ${T.line}`, borderLeft: `3px solid ${accent}`, borderRadius: 13, padding: "13px 16px", marginBottom: 10 }}>
          <Label style={{ marginBottom: 4 }}>// SESION_{String(activeDay + 1).padStart(2, "0")} — {sel.day.toUpperCase()}</Label>
          <div style={{ fontFamily: GROT, fontSize: 16, fontWeight: 700, color: T.bone, lineHeight: 1.2 }}>{sel.label}</div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5, alignItems: "center" }}>
            <div style={{ fontSize: 10, color: T.ash }}>{sel.focus}</div>
            {sel.is_optional
              ? <div style={{ fontSize: 8, color: T.gold, border: `1px solid ${T.gold}55`, borderRadius: 6, padding: "2px 7px", fontFamily: MONO }}>OPCIONAL</div>
              : sel.source && <div style={{ fontSize: 8, color: T.faint, fontFamily: MONO }}>{sel.source}</div>}
          </div>
        </div>

        {sel.type === "rest" ? (
          <div style={{ background: T.surface, borderRadius: 13, padding: 26, textAlign: "center", border: `1px solid ${T.line}` }}>
            <div style={{ fontSize: 34, marginBottom: 8 }}>◼</div>
            <div style={{ fontFamily: GROT, fontSize: 16, fontWeight: 700, color: T.bone, marginBottom: 6 }}>Descanso total</div>
            <div style={{ fontSize: 11, color: T.ash, lineHeight: 1.8 }}>El musculo crece descansando.<br />Come bien · 7–8 h sueno · Hidratacion.</div>
          </div>
        ) : (
          <>
            {sel.tip && <div style={{ background: "#241A10", border: `1px solid ${T.ember}44`, borderRadius: 11, padding: "10px 14px", marginBottom: 10, fontSize: 11, color: "#E8C49A", lineHeight: 1.7 }}>{sel.tip}</div>}
            {sel.type === "strength" && <div style={{ fontSize: 9, color: T.faint, marginBottom: 8, fontFamily: MONO }}>tap ejercicio → registrar series · pesos sugeridos</div>}

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {main.map((ex) => {
                const isExp = expandedEx === ex.id;
                const done = setsFor(ex);
                const target = Number(ex.sets) || 0;
                const coachTarget = ex.exercise_id ? targets[ex.exercise_id] : null;
                return (
                  <div key={ex.id} onClick={() => setExpandedEx(isExp ? null : ex.id)}
                    style={{ background: isExp ? T.raised : T.surface, border: `1px solid ${isExp ? accent + "66" : done.length ? accent + "33" : T.line}`, borderRadius: 12, padding: "11px 12px", cursor: "pointer", transition: "all .2s" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                      <div style={{ flexShrink: 0, width: 86, height: 68, background: T.bg, borderRadius: 9, border: `1px solid ${accent}26`, padding: 3, overflow: "hidden" }}>
                        <ExerciseImage exercise={ex} accent={accent} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, lineHeight: 1.35, color: T.bone, marginBottom: ex.note ? 3 : 0, fontFamily: GROT }}>{ex.name}</div>
                        {ex.note && <div style={{ fontSize: 10, color: T.ash, lineHeight: 1.5 }}>{ex.note}</div>}
                      </div>
                      {ex.sets !== "—" && (
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
                          <div style={{ fontSize: 12, color: isExp ? accent : T.faint }}>{isExp ? "▲" : "▼"}</div>
                          {target > 0 && (
                            <div style={{ fontSize: 9, fontFamily: MONO, color: done.length >= target ? T.sage : done.length ? accent : T.faint, border: `1px solid ${done.length ? accent + "55" : T.line}`, borderRadius: 5, padding: "1px 5px" }}>
                              {done.length}/{target}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    {ex.sets !== "—" && (
                      <div style={{ display: "flex", gap: 5, marginTop: 9 }}>
                        {[["SER", ex.sets, accent], [isTimed(ex) ? "TIEMPO" : "REPS", ex.reps, T.bone], ["PAUSA", ex.rest, T.ash]].map(([lbl, val, col], j) => (
                          <div key={j} style={{ background: T.bg, borderRadius: 7, padding: "5px 8px", flex: 1, textAlign: "center", border: `1px solid ${T.line}` }}>
                            <div style={{ fontSize: 7, color: T.faint, letterSpacing: 1.5, fontFamily: MONO }}>{lbl}</div>
                            <div style={{ fontSize: 12, fontFamily: GROT, fontWeight: 700, color: col }}>{val}</div>
                          </div>
                        ))}
                      </div>
                    )}
                    {coachTarget && <TargetLine target={coachTarget} accent={accent} />}
                    {isExp && (
                      <div style={{ marginTop: 9, display: "flex", flexDirection: "column", gap: 8 }}>
                        {ex.exercise_id && today && <SetLogger exercise={{ id: ex.exercise_id, name: ex.name }} accent={accent} sets={done} log={log} date={today} timed={isTimed(ex)} />}
                        {(ex.load_start || ex.load_target) && (
                          <div style={{ background: T.bg, border: `1px solid ${accent}33`, borderRadius: 9, padding: "10px 12px" }}>
                            <Label style={{ marginBottom: 7 }}>// CARGA</Label>
                            <div style={{ display: "flex", gap: 7, marginBottom: ex.load_note ? 7 : 0 }}>
                              <div style={{ flex: 1, background: T.surface, borderRadius: 7, padding: "6px 9px" }}>
                                <Label style={{ marginBottom: 2, letterSpacing: 0 }}>INICIO</Label>
                                <div style={{ fontSize: 12, fontFamily: GROT, fontWeight: 700, color: accent }}>{ex.load_start ?? "—"}</div>
                              </div>
                              <div style={{ flex: 1, background: T.surface, borderRadius: 7, padding: "6px 9px" }}>
                                <Label style={{ marginBottom: 2, letterSpacing: 0 }}>SEM_06</Label>
                                <div style={{ fontSize: 12, fontFamily: GROT, fontWeight: 700, color: T.bone }}>{ex.load_target ?? "—"}</div>
                              </div>
                            </div>
                            {ex.load_note && <div style={{ fontSize: 10, color: T.sage, lineHeight: 1.5 }}>{ex.load_note}</div>}
                          </div>
                        )}
                        {(ex.muscles || ex.steps?.length) && (
                          <div style={{ background: T.bg, border: `1px solid ${T.line}`, borderRadius: 9, padding: "10px 12px" }}>
                            {ex.muscles && <>
                              <Label style={{ marginBottom: 4 }}>// MUSCULOS</Label>
                              <div style={{ fontSize: 10, color: T.gold, marginBottom: 9 }}>{ex.muscles}</div>
                            </>}
                            {ex.steps?.length > 0 && <>
                              <Label style={{ marginBottom: 5 }}>// EJECUCION</Label>
                              {ex.steps.map((step, pi) => (
                                <div key={pi} style={{ display: "flex", gap: 8, marginBottom: 5 }}>
                                  <div style={{ flexShrink: 0, width: 16, height: 16, borderRadius: 4, background: accent + "22", border: `1px solid ${accent}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, color: accent, fontFamily: MONO }}>{pi + 1}</div>
                                  <div style={{ fontSize: 10, color: T.bone, lineHeight: 1.5, paddingTop: 1 }}>{step}</div>
                                </div>
                              ))}
                            </>}
                            {ex.common_error && (
                              <div style={{ marginTop: 8, fontSize: 10, color: "#D98A8A", background: "#241414", border: "1px solid #4A2828", borderRadius: 7, padding: "6px 9px", lineHeight: 1.5 }}>
                                ✕ {ex.common_error}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {core.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <Label color={T.gold} style={{ fontSize: 9, marginBottom: 8 }}>// CORE_FINISHER — 5-8 MIN</Label>
                <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                  {core.map((ex) => {
                    const isExp = expandedEx === ex.id;
                    const done = setsFor(ex);
                    const target = Number(ex.sets) || 0;
                    const coachTarget = ex.exercise_id ? targets[ex.exercise_id] : null;
                    return (
                      <div key={ex.id} onClick={() => setExpandedEx(isExp ? null : ex.id)}
                        style={{ background: isExp ? T.raised : T.surface, border: `1px solid ${isExp ? T.gold + "66" : done.length ? T.gold + "44" : T.gold + "22"}`, borderRadius: 11, padding: "10px 13px", cursor: "pointer", transition: "all .2s" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: T.gold, marginBottom: 3, fontFamily: GROT }}>{ex.name}</div>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                            {target > 0 && (
                              <div style={{ fontSize: 9, fontFamily: MONO, color: done.length >= target ? T.sage : done.length ? T.gold : T.faint, border: `1px solid ${done.length ? T.gold + "55" : T.line}`, borderRadius: 5, padding: "1px 5px" }}>
                                {done.length}/{target}
                              </div>
                            )}
                            <div style={{ fontSize: 11, color: isExp ? T.gold : T.faint }}>{isExp ? "▲" : "▼"}</div>
                          </div>
                        </div>
                        <div style={{ fontSize: 10, color: T.ash, lineHeight: 1.5, marginBottom: 8 }}>{ex.note}</div>
                        <div style={{ display: "flex", gap: 5 }}>
                          {[["SER", ex.sets, T.gold], [isTimed(ex) ? "TIEMPO" : "REPS", ex.reps, T.bone], ["PAUSA", ex.rest, T.ash]].map(([lbl, val, col], j) => (
                            <div key={j} style={{ background: T.bg, borderRadius: 7, padding: "5px 8px", flex: 1, textAlign: "center", border: `1px solid ${T.line}` }}>
                              <div style={{ fontSize: 7, color: T.faint, letterSpacing: 1.5, fontFamily: MONO }}>{lbl}</div>
                              <div style={{ fontSize: 11, fontFamily: GROT, fontWeight: 700, color: col }}>{val}</div>
                            </div>
                          ))}
                        </div>
                        {coachTarget && <TargetLine target={coachTarget} accent={T.gold} />}
                        {isExp && ex.exercise_id && today && (
                          <div style={{ marginTop: 9 }}>
                            <SetLogger exercise={{ id: ex.exercise_id, name: ex.name }} accent={T.gold} sets={done} log={log} date={today} timed={isTimed(ex)} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {sel.post_key && POST_WORKOUT[sel.post_key] && (
              <div style={{ marginTop: 12, background: "#16201A", border: `1px solid ${T.sage}33`, borderRadius: 12, padding: "13px 15px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
                  <Label color={T.sage} style={{ fontSize: 9 }}>// {POST_WORKOUT[sel.post_key].titulo.toUpperCase()}</Label>
                  <div style={{ fontSize: 8, color: T.gold, fontFamily: MONO }}>{POST_WORKOUT[sel.post_key].ventana}</div>
                </div>
                {POST_WORKOUT[sel.post_key].comida.map((c, ci) => (
                  <div key={ci} style={{ fontSize: 11, color: T.bone, lineHeight: 1.9, paddingLeft: 9, borderLeft: `1px solid ${T.sage}55` }}>· {c}</div>
                ))}
                <div style={{ marginTop: 8, fontSize: 9, color: T.sage, fontFamily: MONO }}>{POST_WORKOUT[sel.post_key].macros}</div>
                <div style={{ marginTop: 6, fontSize: 10, color: T.ash, lineHeight: 1.6 }}>{POST_WORKOUT[sel.post_key].razon}</div>
              </div>
            )}
            {sel.type === "strength" && (
              <div style={{ marginTop: 10, background: T.surface, border: `1px solid ${T.line}`, borderRadius: 11, padding: "11px 13px", fontSize: 10, color: T.ash, lineHeight: 1.8 }}>
                <span style={{ color: T.copper, fontWeight: 600 }}>Overload:</span> sube peso al lograr el max de reps con buena forma 2 sesiones seguidas.<br />
                <span style={{ color: T.copper, fontWeight: 600 }}>Intensidad (RPE):</span> termina cada serie con 2 reps en reserva. La ultima serie de cada compuesto puede llegar a 1 en reserva.<br />
                <span style={{ color: T.copper, fontWeight: 600 }}>Calentamiento:</span> 5 min movilidad + 1 serie ligera por compuesto.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// LOG TAB — any exercise, any date, history// ═══════════════════════════════════════════════════════════════
// LOG TAB — any exercise, any date, history
// ═══════════════════════════════════════════════════════════════
const NewExerciseForm = ({ initialName = "", onCreated, onCancel }) => {
  const [name, setName] = useState(initialName);
  const [group, setGroup] = useState("");
  const [error, setError] = useState(null);
  const submit = () => api("POST", "/api/exercises", { name, muscle_group: group || null }).then(onCreated).catch((e) => setError(e.message));
  return (
    <div style={{ background: T.bg, border: `1px solid ${T.gold}55`, borderRadius: 9, padding: "10px 12px", display: "flex", flexDirection: "column", gap: 7 }}>
      <Label color={T.gold}>// NUEVO_EJERCICIO</Label>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre" style={inputStyle} />
      <input value={group} onChange={(e) => setGroup(e.target.value)} placeholder="Grupo muscular (opcional)" style={{ ...inputStyle, fontWeight: 500, fontSize: 12 }} />
      <div style={{ display: "flex", gap: 6 }}>
        <Btn accent={T.gold} disabled={!name.trim()} onClick={submit}>GUARDAR</Btn>
        <Btn ghost accent={T.ash} onClick={onCancel}>CANCELAR</Btn>
      </div>
      {error && <div style={{ fontSize: 10, color: "#D98A8A" }}>{error}</div>}
    </div>
  );
};

// Picker groups by movement pattern — the split the program is built on. Plan
// exercises take the pattern of the day they belong to (Lunes empuje, Martes halar,
// Miercoles pierna, core finishers) and lead their group in program order; the rest
// of the catalog is classified by muscle group, with a few pulls that live under
// "Hombros" (face pull, pajaros, remo al menton) caught by name.
const PATTERNS = [
  ["push", "EMPUJE", "Pecho · Hombros · Triceps"],
  ["pull", "HALAR", "Espalda · Biceps · Rear delt"],
  ["legs", "PIERNA", "Cuadriceps · Gluteos · Isquios · Gemelos"],
  ["core", "CORE", "Abdomen · Lumbar"],
  ["other", "OTROS", ""],
];
const PATTERN_OF_GROUP = {
  Pecho: "push", Hombros: "push", Triceps: "push",
  Espalda: "pull", Biceps: "pull", Trapecio: "pull",
  Piernas: "legs", Gluteos: "legs", Isquios: "legs", Gemelos: "legs", "Cadena posterior": "legs",
  Core: "core",
};
const dayPattern = (d) => (d.type === "core" ? "core" : /Pierna/.test(d.label) ? "legs" : /Halar/.test(d.label) && !/Empuje/.test(d.label) ? "pull" : /Empuje/.test(d.label) && !/Halar/.test(d.label) ? "push" : null);
const guessPattern = (e) => (/face pull|pajaros|remo|encogimiento/i.test(e.name) ? "pull" : PATTERN_OF_GROUP[e.muscle_group] ?? "other");

function pickerGroups(exercises, planDays) {
  const buckets = Object.fromEntries(PATTERNS.map(([key]) => [key, []]));
  const seen = new Set();
  const put = (e, pattern, plan) => {
    if (!e || seen.has(e.id)) return;
    seen.add(e.id);
    buckets[pattern].push({ value: String(e.id), exercise: e, plan });
  };
  for (const d of planDays) {
    const p = dayPattern(d);
    for (const x of d.exercises) {
      const bucket = x.section === "core" ? "core" : p;
      if (bucket) put(exercises.byId[x.exercise_id], bucket, true);
    }
  }
  for (const e of exercises.list) put(e, guessPattern(e), false);
  return PATTERNS.map(([key, label, hint]) => ({ label, hint, items: buckets[key] })).filter((g) => g.items.length);
}

const fold = (s) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

// Searchable picker: a text field that filters the grouped list as you type (accents
// ignored, name or muscle group). Closed, it shows the selected exercise; typing reopens
// it. The last row creates a new exercise, prefilled with the query when nothing matches.
const ExercisePicker = ({ groups, value, onPick, onCreate, accent }) => {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const selected = useMemo(() => groups.flatMap((g) => g.items).find((it) => it.value === value)?.exercise, [groups, value]);

  const q = fold(query.trim());
  const visible = useMemo(() => {
    const words = q.split(/\s+/).filter(Boolean);
    if (!words.length) return groups;
    const hit = (e) => { const hay = fold(`${e.name} ${e.muscle_group ?? ""}`); return words.every((w) => hay.includes(w)); };
    return groups.map((g) => ({ ...g, items: g.items.filter(({ exercise: e }) => hit(e)) })).filter((g) => g.items.length);
  }, [groups, q]);
  const flat = visible.flatMap((g) => g.items);
  const createLabel = q && !flat.length ? `+ crear "${query.trim()}"` : "+ nuevo ejercicio…";

  const choose = (it) => { onPick(it.value); setQuery(""); setOpen(false); };
  const create = () => { onCreate(flat.length ? "" : query.trim()); setQuery(""); setOpen(false); };
  const onKey = (e) => {
    if (e.key === "Escape") { setQuery(""); setOpen(false); e.target.blur(); }
    else if (e.key === "ArrowDown") { e.preventDefault(); setOpen(true); setActive((a) => Math.min(a + 1, flat.length)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    else if (e.key === "Enter" && open) { e.preventDefault(); active < flat.length ? choose(flat[active]) : create(); }
  };

  let idx = -1;
  return (
    <div style={{ position: "relative" }}>
      <input value={open ? query : selected?.name ?? ""} placeholder="buscar o elegir ejercicio…"
        onChange={(e) => { setQuery(e.target.value); setActive(0); setOpen(true); }}
        onFocus={() => { setOpen(true); setActive(0); }} onBlur={() => { setOpen(false); setQuery(""); }} onKeyDown={onKey}
        role="combobox" aria-expanded={open} autoComplete="off" spellCheck={false}
        style={{ ...inputStyle, fontSize: 13, paddingRight: 28, borderColor: selected ? accent + "88" : T.line }} />
      <div style={{ position: "absolute", right: 10, top: 10, fontSize: 10, color: open ? accent : T.faint, pointerEvents: "none" }}>{open ? "▲" : "▼"}</div>
      {open && (
        // mousedown is swallowed so the input keeps focus (and the list stays open) while tapping a row
        <div onMouseDown={(e) => e.preventDefault()} role="listbox" style={{
          position: "absolute", left: 0, right: 0, top: "calc(100% + 4px)", zIndex: 20, maxHeight: 280, overflowY: "auto",
          background: T.raised, border: `1px solid ${accent}66`, borderRadius: 9, boxShadow: "0 10px 30px rgba(0,0,0,.5)",
        }}>
          {visible.map((g) => (
            <div key={g.label}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "8px 11px 3px", position: "sticky", top: 0, background: T.raised }}>
                <Label color={accent}>// {g.label}</Label>
                {g.hint && <span style={{ fontSize: 7, color: T.faint, letterSpacing: 1, fontFamily: MONO }}>{g.hint}</span>}
              </div>
              {g.items.map((it, j) => {
                const i = ++idx;
                const on = i === active;
                const e = it.exercise;
                const firstOther = !it.plan && j > 0 && g.items[j - 1].plan;   // plan → catalog boundary
                return (
                  <div key={it.value} role="option" aria-selected={on} onClick={() => choose(it)} onMouseEnter={() => setActive(i)} style={{
                    display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8, padding: "7px 11px", cursor: "pointer",
                    background: on ? accent + "22" : "none", borderLeft: `2px solid ${it.value === value ? accent : "transparent"}`,
                    borderTop: firstOther ? `1px dashed ${T.line}` : "none",
                  }}>
                    <span style={{ fontSize: 12, fontFamily: GROT, fontWeight: 600, color: on ? T.bone : it.plan ? "#CFC6B8" : T.ash }}>
                      {it.plan && <span style={{ color: accent, marginRight: 6 }}>●</span>}{e.name}
                    </span>
                    {e.muscle_group && <span style={{ fontSize: 8, color: T.faint, letterSpacing: 1, flexShrink: 0 }}>{e.muscle_group.toUpperCase()}</span>}
                  </div>
                );
              })}
            </div>
          ))}
          {!flat.length && <div style={{ padding: "12px 11px 4px", fontSize: 10, color: T.faint, letterSpacing: 1 }}>SIN RESULTADOS</div>}
          <div onClick={create} onMouseEnter={() => setActive(flat.length)} style={{
            padding: "9px 11px", cursor: "pointer", fontSize: 11, fontFamily: GROT, fontWeight: 700, color: T.gold,
            borderTop: `1px solid ${T.line}`, background: active === flat.length ? T.gold + "18" : "none",
          }}>{createLabel}</div>
        </div>
      )}
    </div>
  );
};

const LogTab = ({ exercises, plan, today }) => {
  const [date, setDate] = useState(today);
  const [exerciseId, setExerciseId] = useState("");
  const [creating, setCreating] = useState(false);
  const [history, setHistory] = useState([]);
  const log = useSets(date);
  const accent = T.copper;

  useEffect(() => { if (!date && today) setDate(today); }, [date, today]);
  useEffect(() => {
    if (!today) return;
    api("GET", `/api/sets?from=${shiftDate(today, -60)}&to=${today}`).then(setHistory).catch(() => {});
  }, [today, log.sets]);

  const selected = exercises.byId[exerciseId];
  const groups = useMemo(() => {
    const order = [];
    const map = new Map();
    for (const s of log.sets) {
      if (!map.has(s.exercise_id)) { map.set(s.exercise_id, []); order.push(s.exercise_id); }
      map.get(s.exercise_id).push(s);
    }
    return order.map((id) => ({ exercise: exercises.byId[id] ?? { id, name: map.get(id)[0].exercise_name }, sets: map.get(id) }));
  }, [log.sets, exercises.byId]);

  const byDay = useMemo(() => {
    const m = new Map();
    for (const s of history) { if (!m.has(s.performed_on)) m.set(s.performed_on, []); m.get(s.performed_on).push(s); }
    return [...m.entries()].map(([d, sets]) => ({ date: d, sets, exercises: new Set(sets.map((s) => s.exercise_id)).size }));
  }, [history]);

  const picker = useMemo(() => pickerGroups(exercises, plan.days), [exercises.list, plan.days]);

  if (!date) return <div style={{ padding: 24, textAlign: "center", color: T.faint, fontFamily: MONO, fontSize: 10 }}>cargando…</div>;

  return (
    <div style={{ padding: "14px 14px 26px" }} className="fadein">
      {/* date nav + summary */}
      <div style={{ background: T.surface, border: `1px solid ${T.line}`, borderLeft: `3px solid ${accent}`, borderRadius: 13, padding: "12px 14px", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <Btn ghost small accent={T.ash} onClick={() => setDate(shiftDate(date, -1))}>‹</Btn>
          <div style={{ flex: 1, textAlign: "center" }}>
            <div style={{ fontFamily: GROT, fontSize: 15, fontWeight: 700, color: T.bone, textTransform: "capitalize" }}>{fmtDate(date)}</div>
            <Label style={{ marginTop: 2 }}>{date === today ? "HOY" : date}</Label>
          </div>
          <Btn ghost small accent={T.ash} onClick={() => setDate(shiftDate(date, 1))} disabled={date >= today}>›</Btn>
          {date !== today && <Btn small accent={accent} onClick={() => setDate(today)}>HOY</Btn>}
        </div>
        <div style={{ display: "flex", gap: 5 }}>
          {[["SERIES", log.sets.length, accent], ["EJERCICIOS", groups.length, T.bone], ["VOLUMEN KG", fmtKg(volume(log.sets)), T.gold]].map(([lbl, val, col]) => (
            <div key={lbl} style={{ background: T.bg, borderRadius: 7, padding: "6px 8px", flex: 1, textAlign: "center", border: `1px solid ${T.line}` }}>
              <div style={{ fontSize: 7, color: T.faint, letterSpacing: 1.5, fontFamily: MONO }}>{lbl}</div>
              <div style={{ fontSize: 14, fontFamily: GROT, fontWeight: 700, color: col }}>{val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* add */}
      <div style={{ background: T.surface, border: `1px solid ${T.line}`, borderRadius: 12, padding: "11px 12px", marginBottom: 12, display: "flex", flexDirection: "column", gap: 8 }}>
        <Label color={accent}>// ANADIR_SERIE</Label>
        <ExercisePicker groups={picker} value={exerciseId} accent={accent}
          onPick={(v) => { setCreating(false); setExerciseId(v); }}
          onCreate={(name) => { setExerciseId(""); setCreating(name || true); }} />
        {creating && (
          <NewExerciseForm key={creating} initialName={creating === true ? "" : creating} onCancel={() => setCreating(false)}
            onCreated={async (e) => { await exercises.refresh(); setExerciseId(String(e.id)); setCreating(false); }} />
        )}
        {selected && (
          <div style={{ display: "flex", gap: 10, alignItems: "stretch" }}>
            <div style={{ flexShrink: 0, width: 72, background: T.bg, borderRadius: 9, border: `1px solid ${accent}26`, padding: 3, overflow: "hidden" }}>
              <ExerciseImage exercise={selected} accent={accent} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <SetLogger key={selected.id + date} exercise={selected} accent={accent} sets={log.sets.filter((s) => s.exercise_id === selected.id)} log={log} date={date} />
            </div>
          </div>
        )}
        {exercises.error && <div style={{ fontSize: 10, color: "#D98A8A" }}>{exercises.error}</div>}
      </div>

      {/* today's groups */}
      {groups.length === 0 ? (
        <div style={{ textAlign: "center", padding: "18px 0", color: T.faint, fontFamily: MONO, fontSize: 10, letterSpacing: 1 }}>SIN SERIES REGISTRADAS</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {groups.map(({ exercise, sets }) => (
            <div key={exercise.id} style={{ background: T.surface, border: `1px solid ${T.line}`, borderRadius: 12, padding: "10px 12px" }}>
              <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 8 }}>
                <div style={{ flexShrink: 0, width: 56, height: 44, background: T.bg, borderRadius: 8, border: `1px solid ${accent}26`, padding: 2, overflow: "hidden" }}>
                  <ExerciseImage exercise={exercise} accent={accent} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: T.bone, fontFamily: GROT, lineHeight: 1.3 }}>{exercise.name}</div>
                  <div style={{ fontSize: 9, color: T.ash, fontFamily: MONO, marginTop: 2 }}>
                    {sets.every((s) => s.duration_s)
                      ? `${sets.length} series · max ${Math.max(...sets.map((s) => s.duration_s))} s`
                      : `${sets.length} series · ${fmtKg(volume(sets))} kg · max ${Math.max(...sets.map((s) => s.load_kg))} kg`}
                  </div>
                </div>
                <Btn ghost small accent={accent} onClick={() => { setCreating(false); setExerciseId(String(exercise.id)); window.scrollTo({ top: 0, behavior: "smooth" }); }}>+</Btn>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                {sets.map((s) => <SetChip key={s.id} set={s} accent={accent} onRemove={() => log.remove(s.id)} />)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* history */}
      {byDay.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <Label style={{ fontSize: 9, marginBottom: 8 }}>// HISTORIAL_60D</Label>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {byDay.map((d) => (
              <div key={d.date} onClick={() => setDate(d.date)} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer",
                background: d.date === date ? T.raised : T.surface, border: `1px solid ${d.date === date ? accent + "66" : T.line}`,
                borderRadius: 9, padding: "8px 12px",
              }}>
                <div style={{ fontFamily: GROT, fontSize: 12, fontWeight: 700, color: T.bone, textTransform: "capitalize" }}>{fmtDate(d.date)}</div>
                <div style={{ fontSize: 9, color: T.ash, fontFamily: MONO }}>
                  {d.exercises} ej · {d.sets.length} series · <span style={{ color: T.gold }}>{fmtKg(volume(d.sets))} kg</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// ROOT
// ═══════════════════════════════════════════════════════════════
export default function PlanRecomp() {
  const [tab, setTab] = useState("entreno");
  const [today, setToday] = useState(null);
  const exercises = useExercises();
  const plan = usePlan();
  const measurements = useMeasurements();
  const sessionsPerWeek = useSessionsPerWeek(today);
  const latest = measurements.rows[measurements.rows.length - 1] ?? null;
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
        select option,select optgroup{background:${T.surface};color:${T.bone}}
        input[type=number]::-webkit-inner-spin-button,input[type=number]::-webkit-outer-spin-button{-webkit-appearance:none}
        input[type=number]{-moz-appearance:textfield}
        .exsvg svg{width:100%;height:100%;display:block}
        .fadein{animation:fi .3s ease}
        @keyframes fi{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        @media (prefers-reduced-motion: reduce){ *{animation:none!important;transition:none!important} }
      `}</style>

      <div style={{ padding: "18px 16px 0", borderBottom: `1px solid ${T.line}`, background: T.bg, position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 8, letterSpacing: 3, color: T.faint, marginBottom: 3 }}>// BODY_RECOMP — JF</div>
            <div style={{ fontFamily: GROT, fontSize: 24, fontWeight: 700, lineHeight: 0.95, letterSpacing: "-0.5px", color: T.bone }}>
              RECOMP<span style={{ color: T.copper }}>_</span>v3
            </div>
          </div>
          <div style={{ textAlign: "right", fontSize: 9, color: T.ash, lineHeight: 1.6 }}>
            <div>
              {latest?.weight_kg != null && <><span style={{ color: T.gold }}>{Number(latest.weight_kg).toFixed(1)}</span> kg</>}
              {latest?.weight_kg != null && latest?.body_fat_pct != null && " · "}
              {latest?.body_fat_pct != null && <><span style={{ color: T.copper }}>{Number(latest.body_fat_pct).toFixed(1)}</span>%</>}
              {!latest && <span style={{ color: T.faint }}>sin medicion</span>}
            </div>
            <div style={{ color: T.faint }}>obj: 16% en 12 sem</div>
          </div>
        </div>
        <div style={{ display: "flex" }}>
          {[["dash", "TELEMETRIA"], ["entreno", "ENTRENO"], ["registro", "REGISTRO"], ["nutricion", "NUTRICION"]].map(([t, lbl]) => (
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
        {tab === "dash" ? <DashboardTab measurements={measurements.rows} sessionsPerWeek={sessionsPerWeek} error={measurements.error} />
          : tab === "entreno" ? <TrainingTab plan={plan} today={today} />
          : tab === "registro" ? <LogTab exercises={exercises} plan={plan} today={today} />
          : <NutritionTab />}
      </div>

      <div style={{ padding: "10px 18px 26px", textAlign: "center", fontSize: 8, color: T.faint, letterSpacing: 2 }}>
        {latest ? `DATA ${latest.measured_on.slice(8)}/${latest.measured_on.slice(5, 7)} · PLAN Y MEDICIONES DESDE LA BASE DE DATOS` : "SIN MEDICIONES REGISTRADAS"}
      </div>
    </div>
  );
}
