// RECOMP v3 — the workout log and the plan, both backed by Postgres (/api/*).
//
// Everything with a number or a figure in it comes from the database: the catalog and
// its animated figures, the plan day and its prescribed sets/reps/rest, the load ladder
// and execution detail of each exercise, the coach's targets, and the body measurements
// on the body tab. Swapping an exercise or rebalancing a target is therefore a
// write to the DB — no deploy, no page edit. Only the written content (weekly menu,
// macros, supplements, post-workout meals) still lives in ./_lib/recomp/data.jsx.
//
// Look: "Goma y tiza" (./_lib/recomp/tokens.jsx, ./_lib/recomp/kit.jsx) — phone first,
// bottom navigation, plate colors per movement pattern.
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { T, NUM } from "./_lib/recomp/tokens.jsx";
import { GlobalStyle, Card, Section, Btn, Pill, Stepper, PlateRow, Ring, SetChip, BottomNav, ErrorNote } from "./_lib/recomp/kit.jsx";
import { POST_WORKOUT } from "./_lib/recomp/data.jsx";
import { DashboardTab, NutritionTab } from "./_lib/recomp/ui.jsx";

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

// Today's recommendation, if the coach substituted a missed session into a light day.
// Date-scoped: only today's row is ever fetched, so it clears itself the next day.
function useRecommendation(today) {
  const [rec, setRec] = useState(null);
  useEffect(() => {
    if (!today) return;
    let live = true;
    api("GET", `/api/recommendation?date=${today}`).then((r) => live && setRec(r)).catch(() => {});
    return () => { live = false; };
  }, [today]);
  return rec;
}

// Last few earlier sessions of an exercise, newest first — any day it was done, whatever
// plan day it belonged to. The first one prefills the logger; all of them are the history.
function useRecentSessions(exerciseId, before, limit = 4) {
  const [sessions, setSessions] = useState([]);
  useEffect(() => {
    setSessions([]);
    if (!exerciseId || !before) return;
    let live = true;
    api("GET", `/api/exercises/${exerciseId}/sessions?before=${before}&limit=${limit}`).then((r) => live && setSessions(r)).catch(() => {});
    return () => { live = false; };
  }, [exerciseId, before, limit]);
  return sessions;
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

const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
const fmtDay = (iso) => cap(fmtDate(iso).replace(/\./g, ""));          // "Vie, 03 oct"
const unit = { fontSize: 13, color: T.ash, fontWeight: 500, fontStretch: "100%" };
const subTitle = { fontSize: 13, fontWeight: 600, color: T.ash, marginBottom: 8 };

// ═══════════════════════════════════════════════════════════════
// MOVEMENT PATTERNS — the split the program is built on, and the plate color of each
// ═══════════════════════════════════════════════════════════════
// Picker groups by movement pattern. Plan exercises take the pattern of the day they
// belong to (Lunes empuje, Martes halar, Miercoles pierna, core finishers) and lead their
// group in program order; the rest of the catalog is classified by muscle group, with a
// few pulls that live under "Hombros" (face pull, pajaros, remo al menton) caught by name.
const PATTERNS = [
  ["push", "Empuje", "Pecho, hombros y triceps"],
  ["pull", "Halar", "Espalda, biceps y deltoide posterior"],
  ["legs", "Pierna", "Cuadriceps, gluteos, isquios y gemelos"],
  ["core", "Core", "Abdomen y lumbar"],
  ["other", "Otros", ""],
];
const PATTERN_OF_GROUP = {
  Pecho: "push", Hombros: "push", Triceps: "push",
  Espalda: "pull", Biceps: "pull", Trapecio: "pull",
  Piernas: "legs", Gluteos: "legs", Isquios: "legs", Gemelos: "legs", "Cadena posterior": "legs",
  Core: "core",
};
const dayPattern = (d) => (d.type === "core" ? "core" : /Pierna/.test(d.label) ? "legs" : /Halar/.test(d.label) && !/Empuje/.test(d.label) ? "pull" : /Empuje/.test(d.label) && !/Halar/.test(d.label) ? "push" : null);
const guessPattern = (e) => (/face pull|pajaros|remo|encogimiento/i.test(e.name) ? "pull" : PATTERN_OF_GROUP[e.muscle_group] ?? "other");

const PATTERN_NAME = { push: "Empuje", pull: "Halar", legs: "Pierna", core: "Core" };
const TYPE_NAME = { lesmills: "Cardio", recovery: "Balance", core: "Core", rest: "Descanso", strength: "Rotacion" };

// A day's accent: its plate color when it trains one pattern, otherwise its kind of session.
const dayAccent = (d) => {
  if (!d) return T.ash;
  if (d.type === "lesmills") return T.cardio;
  if (d.type === "recovery") return T.recovery;
  if (d.type === "rest") return T.faint;
  const p = dayPattern(d);
  return p ? T[p] : T.bone;                    // the Friday rotation trains both
};
const dayKind = (d) => PATTERN_NAME[dayPattern(d)] ?? TYPE_NAME[d.type] ?? "";
const dayTitle = (d) => (d.type === "strength" ? cap(d.label.split("—").pop().trim()) : dayKind(d));

// ═══════════════════════════════════════════════════════════════
// SET LOGGER — used by the training cards and the log tab
// ═══════════════════════════════════════════════════════════════
const TargetLine = ({ target }) => (
  <div style={{ display: "flex", alignItems: "baseline", columnGap: 10, rowGap: 2, flexWrap: "wrap" }}>
    <span style={{ fontSize: 13, color: T.ash }}>Objetivo</span>
    <span style={{ ...NUM, fontSize: 22, whiteSpace: "nowrap" }}>
      {target.load_kg != null && <>{target.load_kg}<span style={unit}> kg</span></>}{target.load_kg != null && target.reps && " × "}{target.reps}
    </span>
    {target.reason && <span style={{ flexBasis: "100%", fontSize: 13, color: T.ash, lineHeight: 1.45, overflowWrap: "anywhere" }}>{target.reason}</span>}
  </div>
);

const loadStep = (e) => (e?.equipment === "Barra" ? 2.5 : 1);

// Inline "add a set" form for one exercise. Empty fields fall back to the placeholder,
// which is the previous set today, else the last set of the previous session. A set is
// reps or seconds (planks); the mode follows the previous set, else the `timed` hint
// from the plan, and can be switched with the Reps / Seg toggle.
const SetLogger = ({ exercise, accent, sets, log, date, timed = false }) => {
  const [kg, setKg] = useState("");
  const [n, setN] = useState("");
  const [modeChoice, setMode] = useState(null);
  const history = useRecentSessions(exercise.id, date);
  const last = history[0] ?? null;
  const prev = sets[sets.length - 1] ?? last?.sets?.[last.sets.length - 1];
  const mode = modeChoice ?? (prev ? (prev.duration_s ? "time" : "reps") : timed ? "time" : "reps");
  const prevN = prev ? (mode === "time" ? prev.duration_s : prev.reps) : null;
  const kgVal = kg === "" ? (prev?.load_kg ?? (mode === "time" ? 0 : undefined)) : Number(kg.replace(",", "."));
  const nVal = n === "" ? prevN : Number(n);
  const [rir, setRir] = useState("");                 // reps in reserve, optional (0–5)
  const rirVal = rir === "" ? null : Number(rir);
  const ok = Number.isFinite(kgVal) && kgVal >= 0 && Number.isInteger(nVal) && nVal > 0 && (rirVal === null || (Number.isInteger(rirVal) && rirVal >= 0 && rirVal <= 5));
  const submit = () => log.add({ exercise_id: exercise.id, load_kg: kgVal, [mode === "time" ? "duration_s" : "reps"]: nVal, rir: rirVal });
  // A form, so the phone keyboard's Go / Enter adds the set like the button does.
  const onSubmit = (e) => { e.preventDefault(); if (ok && !log.busy) submit(); };
  const switchMode = (m) => { if (m !== mode) { setMode(m); setN(""); setRir(""); } };

  return (
    <div onClick={(e) => e.stopPropagation()} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {history.length > 0 && (
        <div>
          <div style={subTitle}>Historial</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {history.map((h, i) => (
              <div key={h.performed_on} style={{ display: "grid", gridTemplateColumns: "92px 1fr", columnGap: 10, alignItems: "baseline" }}>
                <span style={{ fontSize: 13, color: i === 0 ? T.bone : T.ash, whiteSpace: "nowrap" }}>{fmtDay(h.performed_on)}</span>
                <span style={{ ...NUM, fontSize: 16, fontWeight: 700, color: i === 0 ? T.bone : T.ash, wordSpacing: 6, overflowWrap: "anywhere" }}>{h.sets.map(fmtSet).join(" ")}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <span style={{ ...subTitle, marginBottom: 0 }}>{sets.length ? `Hoy, ${sets.length} ${sets.length === 1 ? "serie" : "series"}` : "Registrar serie"}</span>
          <div role="group" aria-label="Medir por" style={{ display: "flex", background: T.bg, borderRadius: 10, padding: 3 }}>
            {[["reps", "Reps"], ["time", "Seg"]].map(([m, l]) => (
              <button key={m} type="button" aria-pressed={mode === m} onClick={() => switchMode(m)} style={{
                height: 30, padding: "0 12px", borderRadius: 8, border: "none", fontSize: 13, fontWeight: 600,
                background: mode === m ? T.raised : "none", color: mode === m ? T.bone : T.faint,
              }}>{l}</button>
            ))}
          </div>
        </div>
        {sets.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
            {sets.map((s) => <SetChip key={s.id} set={s} accent={accent} onRemove={() => log.remove(s.id)} />)}
          </div>
        )}
        <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", gap: 10 }}>
            <Stepper label="Carga" unit="kg" value={kg} onChange={setKg} step={loadStep(exercise)} accent={accent}
              placeholder={prev ? String(prev.load_kg) : mode === "time" ? "0" : "–"} />
            <Stepper label={mode === "time" ? "Segundos" : "Reps"} value={n} onChange={setN} step={mode === "time" ? 5 : 1} accent={accent} inputMode="numeric"
              placeholder={prevN != null ? String(prevN) : "–"} />
          </div>
          {mode === "reps" && (
            // A stepper (not buttons) so RIR is part of the Carga → Reps → RIR → Go
            // keyboard flow; half width, aligned under Carga.
            <div style={{ display: "flex", gap: 10 }}>
              <Stepper label="RIR" value={rir} onChange={setRir} step={1} accent={accent} inputMode="numeric" placeholder="–" />
              <div style={{ flex: 1 }} />
            </div>
          )}
          <Btn type="submit" full accent={accent} disabled={!ok || log.busy}>{log.busy ? "Guardando…" : `Anadir serie ${sets.length + 1}`}</Btn>
        </form>
      </div>
      {log.error && <ErrorNote>{log.error}</ErrorNote>}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// TRAINING TAB — the plan day, one card per exercise, logger inside each card
// ═══════════════════════════════════════════════════════════════
// A plan slot is the row the card renders. It carries its exercise's figure, load
// ladder and execution detail, so a card needs nothing else; `exercise_id` is null only
// for the Les Mills / cycling placeholders, which are shown but never logged.
const isTimed = (slot) => /seg/i.test(slot.reps ?? "");

// Plan day keys (planKey in db.mjs) by Date.getDay(), for opening on today's session.
const WEEKDAY_KEYS = ["domingo", "lunes", "martes", "miercoles", "jueves", "viernes", "sabado"];

// Load ladder, muscles, the steps (a real sequence, so numbered) and the common error.
const HowTo = ({ ex, accent }) => {
  if (!(ex.load_start || ex.load_target || ex.muscles || ex.steps?.length || ex.common_error)) return null;
  return (
    <details style={{ borderTop: `1px solid ${T.line}`, paddingTop: 4 }}>
      <summary style={{ minHeight: 44, display: "flex", alignItems: "center", fontSize: 15, fontWeight: 600, cursor: "pointer" }}>
        Como se hace<span className="chev" style={{ marginLeft: "auto", color: T.ash, fontSize: 20, transition: "transform .2s" }}>+</span>
      </summary>
      <div className="open" style={{ display: "flex", flexDirection: "column", gap: 16, paddingBottom: 4 }}>
        {(ex.load_start || ex.load_target) && (
          <div>
            <div style={{ display: "flex", gap: 24 }}>
              {[["Inicio", ex.load_start], ["Semana 6", ex.load_target]].map(([l, v]) => (
                <div key={l}>
                  <div style={{ fontSize: 13, color: T.ash }}>{l}</div>
                  <div style={{ ...NUM, fontSize: 20, color: T.bone }}>{v ?? "—"}</div>
                </div>
              ))}
            </div>
            {ex.load_note && <div style={{ fontSize: 13, color: T.ash, marginTop: 6, lineHeight: 1.45 }}>{ex.load_note}</div>}
          </div>
        )}
        {ex.muscles && (
          <div>
            <div style={subTitle}>Musculos</div>
            <div style={{ fontSize: 14, lineHeight: 1.5 }}>{ex.muscles}</div>
          </div>
        )}
        {ex.steps?.length > 0 && (
          <ol style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 10 }}>
            {ex.steps.map((step, i) => (
              <li key={i} style={{ display: "flex", gap: 12, fontSize: 14, lineHeight: 1.5 }}>
                <span style={{ ...NUM, fontSize: 16, color: accent, width: 14, flexShrink: 0 }}>{i + 1}</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        )}
        {ex.common_error && (
          <div style={{ fontSize: 14, lineHeight: 1.5, color: T.danger, background: T.danger + "14", borderRadius: 12, padding: "10px 12px" }}>
            Evita: {ex.common_error}
          </div>
        )}
      </div>
    </details>
  );
};

const ExerciseCard = ({ ex, accent, open, onToggle, done, coachTarget, today, log }) => {
  const planned = Number(ex.sets) || 0;
  const complete = planned > 0 && done.length >= planned;
  const prescribed = ex.sets !== "—";
  return (
    <Card accent={done.length ? (complete ? T.core : accent) : undefined} style={{ padding: 0, background: open ? T.raised : T.surface, transition: "background .2s" }}>
      <button type="button" onClick={onToggle} aria-expanded={open} style={{
        width: "100%", textAlign: "left", background: "none", border: "none", padding: 16, display: "flex", gap: 12, alignItems: "flex-start",
      }}>
        <div style={{ width: 64, height: 52, flexShrink: 0, borderRadius: 12, background: T.bg, padding: 3, overflow: "hidden" }}>
          <ExerciseImage exercise={ex} accent={accent} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 650, lineHeight: 1.25 }}>{ex.name}</div>
          {prescribed ? (
            <div style={{ display: "flex", columnGap: 10, alignItems: "baseline", flexWrap: "wrap", marginTop: 4 }}>
              <span style={{ ...NUM, fontSize: 18 }}>{ex.sets} × {ex.reps}</span>
              {ex.rest && ex.rest !== "—" && <span style={{ fontSize: 13, color: T.ash }}>pausa {ex.rest}</span>}
            </div>
          ) : ex.note && <div style={{ fontSize: 13, color: T.ash, marginTop: 4, lineHeight: 1.45 }}>{ex.note}</div>}
        </div>
        {planned > 0 && <div style={{ paddingTop: 3, maxWidth: 72 }}><PlateRow planned={planned} done={done.length} accent={accent} /></div>}
      </button>
      {(coachTarget || open) && (
        <div style={{ padding: "0 16px 16px", marginTop: -4 }}>
          {coachTarget && <TargetLine target={coachTarget} />}
          {open && (
            <div className="open" style={{ marginTop: coachTarget ? 16 : 0, display: "flex", flexDirection: "column", gap: 16 }}>
              {prescribed && ex.note && <p style={{ fontSize: 14, color: T.ash, lineHeight: 1.5 }}>{ex.note}</p>}
              {ex.exercise_id && today && <SetLogger exercise={{ id: ex.exercise_id, name: ex.name, equipment: ex.equipment }} accent={accent} sets={done} log={log} date={today} timed={isTimed(ex)} />}
              <HowTo ex={ex} accent={accent} />
            </div>
          )}
        </div>
      )}
    </Card>
  );
};

const TrainingTab = ({ plan, today, recommendation }) => {
  const [activeDay, setActiveDay] = useState(0);
  const [expandedEx, setExpandedEx] = useState(null);
  const log = useSets(today);
  const targets = useTargets(log.sets);
  const days = plan.days;
  const dayStrip = useRef(null);
  const autoPicked = useRef(false);

  // Select today's plan day once, after mount (today is client-only), then bring its
  // button into view — never again, so a day the user tapped sticks. When the coach has
  // substituted a session for today, open that recommended day instead of the calendar one.
  useEffect(() => {
    if (autoPicked.current || !today || !days.length) return;
    autoPicked.current = true;
    const wantKey = recommendation?.plan_key ?? WEEKDAY_KEYS[parseDate(today).getDay()];
    const i = days.findIndex((d) => d.key === wantKey);
    if (i < 0) return;
    setActiveDay(i);
    requestAnimationFrame(() => dayStrip.current?.children[i]?.scrollIntoView({ inline: "center", block: "nearest" }));
  }, [today, days, recommendation]);
  const sel = days[activeDay];
  const accent = dayAccent(sel);
  const setsFor = (slot) => (slot.exercise_id ? log.sets.filter((s) => s.exercise_id === slot.exercise_id) : []);
  const main = sel ? sel.exercises.filter((x) => x.section !== "core") : [];
  const core = sel ? sel.exercises.filter((x) => x.section === "core") : [];
  const counted = sel ? sel.exercises.filter((x) => x.exercise_id && Number(x.sets)) : [];
  const totalPlanned = counted.reduce((a, x) => a + Number(x.sets), 0);
  const totalDone = counted.reduce((a, x) => a + Math.min(setsFor(x).length, Number(x.sets)), 0);
  const todayKey = today ? recommendation?.plan_key ?? WEEKDAY_KEYS[parseDate(today).getDay()] : null;
  const recDay = recommendation && days.find((d) => d.key === recommendation.plan_key);

  if (plan.error) return <div style={{ padding: 16 }}><ErrorNote>No se pudo cargar el plan: {plan.error}</ErrorNote></div>;
  if (!sel) return <div style={{ padding: "32px 16px", fontSize: 15, color: T.ash }}>Cargando el plan…</div>;

  const card = (ex, ac) => (
    <ExerciseCard key={ex.id} ex={ex} accent={ac} open={expandedEx === ex.id} onToggle={() => setExpandedEx(expandedEx === ex.id ? null : ex.id)}
      done={setsFor(ex)} coachTarget={ex.exercise_id ? targets[ex.exercise_id] : null} today={today} log={log} />
  );
  const pw = sel.post_key && POST_WORKOUT[sel.post_key];

  return (
    <div>
      <div ref={dayStrip} className="scrollx" style={{ display: "flex", gap: 8, overflowX: "auto", padding: "8px 16px 4px", scrollSnapType: "x proximity" }}>
        {days.map((d, i) => (
          <Pill key={d.id} on={activeDay === i} accent={dayAccent(d)} sub={dayKind(d)} onClick={() => { setActiveDay(i); setExpandedEx(null); }}>
            {d.type === "core" ? "Core" : cap(d.day.slice(0, 3).toLowerCase())}
          </Pill>
        ))}
      </div>

      <div key={activeDay} className="fade" style={{ padding: "20px 16px 32px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: T.ash }}>
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: accent, flexShrink: 0 }} />
              {sel.day}{sel.key === todayKey ? ", hoy" : ""}{sel.is_optional ? ", opcional" : ""}
            </div>
            <h1 style={{ ...NUM, fontSize: 40, lineHeight: 1, marginTop: 6 }}>{dayTitle(sel)}</h1>
            <div style={{ fontSize: 14, color: T.ash, marginTop: 6, lineHeight: 1.4 }}>{sel.type === "strength" ? sel.focus : sel.label}</div>
          </div>
          {totalPlanned > 0 && <Ring value={totalDone} total={totalPlanned} accent={accent} />}
        </div>

        {recommendation && (
          <div style={{ marginTop: 18, padding: "12px 14px", borderRadius: 16, background: T.surface, boxShadow: `inset 4px 0 0 ${dayAccent(recDay)}` }}>
            <div style={{ fontSize: 15, fontWeight: 700 }}>
              {recommendation.kind === "rotation" ? "Rotacion del viernes" : "Sugerido para hoy"}: {recDay ? dayTitle(recDay).toLowerCase() : recommendation.title}
            </div>
            <div style={{ fontSize: 13, color: T.ash, marginTop: 4, lineHeight: 1.45, overflowWrap: "anywhere" }}>{recommendation.reason}</div>
          </div>
        )}
        {sel.tip && <p style={{ marginTop: 16, fontSize: 14, color: T.ash, lineHeight: 1.5 }}>{sel.tip}</p>}

        {sel.type === "rest" ? (
          <Card style={{ marginTop: 20, padding: 24 }}>
            <div style={{ ...NUM, fontSize: 26 }}>Descanso total</div>
            <p style={{ fontSize: 15, color: T.ash, lineHeight: 1.6, marginTop: 8 }}>El musculo crece descansando. Come bien, duerme 7 a 8 horas y bebe agua.</p>
          </Card>
        ) : (
          <>
            {main.length > 0 && <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 20 }}>{main.map((ex) => card(ex, accent))}</div>}

            {core.length > 0 && (
              <Section title="Core al final" aside="5 a 8 min">
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>{core.map((ex) => card(ex, T.core))}</div>
              </Section>
            )}

            {pw && (
              <Section title={pw.titulo} aside={pw.ventana}>
                <Card>
                  <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
                    {pw.comida.map((c, i) => (
                      <li key={i} style={{ display: "flex", gap: 10, fontSize: 15, lineHeight: 1.4 }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: T.core, marginTop: 8, flexShrink: 0 }} />{c}
                      </li>
                    ))}
                  </ul>
                  <div style={{ fontSize: 13, color: T.bone, marginTop: 12 }}>{pw.macros}</div>
                  <div style={{ fontSize: 13, color: T.ash, marginTop: 6, lineHeight: 1.5 }}>{pw.razon}</div>
                </Card>
              </Section>
            )}

            {sel.type === "strength" && (
              <Section title="Como progresar">
                <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 14, color: T.ash, lineHeight: 1.5 }}>
                  <p><b style={{ color: T.bone }}>Sobrecarga.</b> Sube peso al lograr el maximo de reps con buena forma dos sesiones seguidas.</p>
                  <p><b style={{ color: T.bone }}>Intensidad.</b> Termina cada serie con 2 reps en reserva; la ultima de cada compuesto puede quedar en 1.</p>
                  <p><b style={{ color: T.bone }}>Calentamiento.</b> 5 min de movilidad y una serie ligera por compuesto.</p>
                </div>
              </Section>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// LOG TAB — any exercise, any date, history
// ═══════════════════════════════════════════════════════════════
const fieldStyle = {
  width: "100%", minWidth: 0, height: 52, background: T.surface, border: `1.5px solid ${T.line}`, borderRadius: 14,
  color: T.bone, padding: "0 14px", fontSize: 16, fontWeight: 500, outline: "none",
};

const NewExerciseForm = ({ initialName = "", onCreated, onCancel }) => {
  const [name, setName] = useState(initialName);
  const [group, setGroup] = useState("");
  const [error, setError] = useState(null);
  const submit = () => api("POST", "/api/exercises", { name, muscle_group: group || null }).then(onCreated).catch((e) => setError(e.message));
  return (
    <Card style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ fontSize: 15, fontWeight: 700 }}>Nuevo ejercicio</div>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre" aria-label="Nombre" style={{ ...fieldStyle, background: T.bg }} />
      <input value={group} onChange={(e) => setGroup(e.target.value)} placeholder="Grupo muscular (opcional)" aria-label="Grupo muscular" style={{ ...fieldStyle, background: T.bg }} />
      <div style={{ display: "flex", gap: 8 }}>
        <Btn accent={T.core} disabled={!name.trim()} onClick={submit} style={{ flex: 1 }}>Crear ejercicio</Btn>
        <Btn variant="ghost" accent={T.ash} onClick={onCancel}>Cancelar</Btn>
      </div>
      {error && <ErrorNote>{error}</ErrorNote>}
    </Card>
  );
};

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
  return PATTERNS.map(([key, label, hint]) => ({ key, label, hint, items: buckets[key] })).filter((g) => g.items.length);
}

const fold = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

// Searchable picker: a text field that filters the grouped list as you type (accents
// ignored, name or muscle group). Closed, it shows the selected exercise; typing reopens
// it. The last row creates a new exercise, prefilled with the query when nothing matches.
const ExercisePicker = ({ groups, value, onPick, onCreate }) => {
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
  const createLabel = q && !flat.length ? `Crear "${query.trim()}"` : "Nuevo ejercicio…";

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
      <input value={open ? query : selected?.name ?? ""} placeholder="Buscar ejercicio"
        onChange={(e) => { setQuery(e.target.value); setActive(0); setOpen(true); }}
        onFocus={() => { setOpen(true); setActive(0); }} onBlur={() => { setOpen(false); setQuery(""); }} onKeyDown={onKey}
        role="combobox" aria-expanded={open} aria-label="Ejercicio" autoComplete="off" spellCheck={false} enterKeyHint="search"
        style={{ ...fieldStyle, paddingLeft: 42, borderColor: selected ? T.ash : T.line, fontWeight: selected && !open ? 650 : 500 }} />
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={T.ash} strokeWidth="2" strokeLinecap="round" style={{ position: "absolute", left: 14, top: 16, pointerEvents: "none" }}>
        <circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4" />
      </svg>
      {open && (
        // mousedown is swallowed so the input keeps focus (and the list stays open) while tapping a row
        <div onMouseDown={(e) => e.preventDefault()} role="listbox" style={{
          position: "absolute", left: 0, right: 0, top: "calc(100% + 6px)", zIndex: 25, maxHeight: "55vh", overflowY: "auto",
          background: T.raised, borderRadius: 16, boxShadow: "0 16px 40px #000A", padding: "4px 0",
        }}>
          {visible.map((g) => (
            <div key={g.label}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8, padding: "10px 14px 4px", position: "sticky", top: 0, background: T.raised }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: T[g.key] ?? T.ash, alignSelf: "center" }} />
                <span style={{ fontSize: 13, fontWeight: 700 }}>{g.label}</span>
                {g.hint && <span style={{ fontSize: 12, color: T.ash, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{g.hint}</span>}
              </div>
              {g.items.map((it, j) => {
                const i = ++idx;
                const on = i === active;
                const e = it.exercise;
                const firstOther = !it.plan && j > 0 && g.items[j - 1].plan;   // plan → catalog boundary
                return (
                  <div key={it.value} role="option" aria-selected={on} onClick={() => choose(it)} onMouseEnter={() => setActive(i)} style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, minHeight: 46, padding: "0 14px 0 30px", cursor: "pointer",
                    background: on ? T.line : "none", borderTop: firstOther ? `1px solid ${T.line}` : "none",
                  }}>
                    <span style={{ fontSize: 15, fontWeight: it.plan ? 600 : 400, color: it.plan || on ? T.bone : T.ash }}>{e.name}</span>
                    {e.muscle_group && <span style={{ fontSize: 12, color: T.faint, flexShrink: 0 }}>{e.muscle_group}</span>}
                  </div>
                );
              })}
            </div>
          ))}
          {!flat.length && <div style={{ padding: "14px", fontSize: 14, color: T.ash }}>Ningun ejercicio coincide.</div>}
          <div onClick={create} onMouseEnter={() => setActive(flat.length)} style={{
            minHeight: 48, display: "flex", alignItems: "center", padding: "0 14px", cursor: "pointer", fontSize: 15, fontWeight: 700, color: T.core,
            borderTop: `1px solid ${T.line}`, background: active === flat.length ? T.line : "none",
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
  const accent = T.bone;

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
  const accentOf = (e) => T[guessPattern(e)] ?? T.ash;

  if (!date) return <div style={{ padding: "32px 16px", fontSize: 15, color: T.ash }}>Cargando…</div>;

  const arrow = { width: 48, padding: 0, fontSize: 22 };
  return (
    <div style={{ padding: "16px 16px 32px" }}>
      {/* date */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Btn variant="ghost" accent={T.ash} aria-label="Dia anterior" onClick={() => setDate(shiftDate(date, -1))} style={arrow}>‹</Btn>
        <div style={{ flex: 1, textAlign: "center" }}>
          <div style={{ ...NUM, fontSize: 28, lineHeight: 1.05 }}>{fmtDay(date)}</div>
          <div style={{ fontSize: 13, color: T.ash }}>{date === today ? "Hoy" : date}</div>
        </div>
        <Btn variant="ghost" accent={T.ash} aria-label="Dia siguiente" onClick={() => setDate(shiftDate(date, 1))} disabled={date >= today} style={arrow}>›</Btn>
      </div>
      {date !== today && <div style={{ textAlign: "center", marginTop: 6 }}><Btn variant="quiet" size="sm" accent={T.bone} onClick={() => setDate(today)}>Volver a hoy</Btn></div>}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", marginTop: 18 }}>
        {[["series", log.sets.length], ["ejercicios", groups.length], ["kg de volumen", fmtKg(volume(log.sets))]].map(([lbl, val]) => (
          <div key={lbl} style={{ textAlign: "center" }}>
            <div style={{ ...NUM, fontSize: 30, lineHeight: 1 }}>{val}</div>
            <div style={{ fontSize: 13, color: T.ash, marginTop: 4 }}>{lbl}</div>
          </div>
        ))}
      </div>

      {/* add */}
      <Section title="Anadir serie" style={{ marginTop: 24 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <ExercisePicker groups={picker} value={exerciseId}
            onPick={(v) => { setCreating(false); setExerciseId(v); }}
            onCreate={(name) => { setExerciseId(""); setCreating(name || true); }} />
          {creating && (
            <NewExerciseForm key={creating} initialName={creating === true ? "" : creating} onCancel={() => setCreating(false)}
              onCreated={async (e) => { await exercises.refresh(); setExerciseId(String(e.id)); setCreating(false); }} />
          )}
          {selected && (
            <Card accent={accentOf(selected)} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <div style={{ width: 64, height: 52, flexShrink: 0, borderRadius: 12, background: T.bg, padding: 3, overflow: "hidden" }}>
                  <ExerciseImage exercise={selected} accent={accentOf(selected)} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 16, fontWeight: 650, lineHeight: 1.25 }}>{selected.name}</div>
                  {selected.muscle_group && <div style={{ fontSize: 13, color: T.ash, marginTop: 2 }}>{selected.muscle_group}</div>}
                </div>
              </div>
              <SetLogger key={selected.id + date} exercise={selected} accent={accentOf(selected)} sets={log.sets.filter((s) => s.exercise_id === selected.id)} log={log} date={date} />
            </Card>
          )}
          {exercises.error && <ErrorNote>{exercises.error}</ErrorNote>}
        </div>
      </Section>

      {/* the day's groups */}
      <Section title={date === today ? "Series de hoy" : "Series del dia"}>
        {groups.length === 0 ? (
          <p style={{ fontSize: 15, color: T.ash, lineHeight: 1.5 }}>Todavia no hay series este dia. Busca un ejercicio arriba para registrar la primera.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {groups.map(({ exercise, sets }) => (
              <Card key={exercise.id} accent={accentOf(exercise)} style={{ padding: 14 }}>
                <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 10 }}>
                  <div style={{ width: 52, height: 42, flexShrink: 0, borderRadius: 10, background: T.bg, padding: 2, overflow: "hidden" }}>
                    <ExerciseImage exercise={exercise} accent={accentOf(exercise)} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 650, lineHeight: 1.25 }}>{exercise.name}</div>
                    <div style={{ fontSize: 13, color: T.ash, marginTop: 2 }}>
                      {sets.every((s) => s.duration_s)
                        ? `${sets.length} series, max ${Math.max(...sets.map((s) => s.duration_s))} s`
                        : `${sets.length} series, ${fmtKg(volume(sets))} kg, max ${Math.max(...sets.map((s) => s.load_kg))} kg`}
                    </div>
                  </div>
                  <Btn variant="ghost" size="sm" accent={T.bone} aria-label={`Anadir serie de ${exercise.name}`}
                    onClick={() => { setCreating(false); setExerciseId(String(exercise.id)); window.scrollTo({ top: 0, behavior: "smooth" }); }}>Anadir</Btn>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {sets.map((s) => <SetChip key={s.id} set={s} accent={accentOf(exercise)} onRemove={() => log.remove(s.id)} />)}
                </div>
              </Card>
            ))}
          </div>
        )}
      </Section>

      {/* history */}
      {byDay.length > 0 && (
        <Section title="Ultimos 60 dias">
          <div style={{ display: "flex", flexDirection: "column" }}>
            {byDay.map((d) => {
              const on = d.date === date;
              return (
                <button key={d.date} type="button" onClick={() => setDate(d.date)} aria-current={on ? "date" : undefined} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, minHeight: 52, padding: "0 12px",
                  background: on ? T.surface : "none", border: "none", borderBottom: `1px solid ${T.line}`, borderRadius: on ? 12 : 0, textAlign: "left",
                }}>
                  <span style={{ fontSize: 15, fontWeight: 600 }}>{fmtDay(d.date)}</span>
                  <span style={{ fontSize: 13, color: T.ash }}>
                    {d.exercises} ej, {d.sets.length} series, <span style={{ ...NUM, fontSize: 16, color: T.bone }}>{fmtKg(volume(d.sets))}</span> kg
                  </span>
                </button>
              );
            })}
          </div>
        </Section>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// ROOT
// ═══════════════════════════════════════════════════════════════
const TABS = [["entreno", "Hoy"], ["registro", "Registro"], ["dash", "Cuerpo"], ["nutricion", "Comida"]];

export default function PlanRecomp() {
  const [tab, setTab] = useState("entreno");
  const [today, setToday] = useState(null);
  const exercises = useExercises();
  const plan = usePlan();
  const measurements = useMeasurements();
  const sessionsPerWeek = useSessionsPerWeek(today);
  const recommendation = useRecommendation(today);
  const latest = measurements.rows[measurements.rows.length - 1] ?? null;
  useEffect(() => { setToday(localDate()); }, []);

  return (
    <div style={{ background: T.bg, minHeight: "100vh", color: T.bone }}>
      <GlobalStyle />

      <header style={{ position: "sticky", top: 0, zIndex: 20, background: T.bg + "F2", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", paddingTop: "env(safe-area-inset-top)" }}>
        <div style={{ maxWidth: 640, margin: "0 auto", padding: "12px 16px 10px", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ ...NUM, fontSize: 24, lineHeight: 1 }}>Recomp</div>
            <div style={{ fontSize: 13, color: T.ash, marginTop: 3, minHeight: 16 }}>{today ? fmtDay(today) : ""}</div>
          </div>
          <button type="button" onClick={() => setTab("dash")} aria-label="Ver mediciones" style={{ background: "none", border: "none", textAlign: "right", padding: 0 }}>
            {latest?.weight_kg != null
              ? <div style={{ ...NUM, fontSize: 24, lineHeight: 1 }}>{Number(latest.weight_kg).toFixed(1)}<span style={unit}> kg</span></div>
              : <div style={{ fontSize: 13, color: T.ash }}>Sin medicion</div>}
            {latest?.body_fat_pct != null && <div style={{ fontSize: 13, color: T.ash, marginTop: 3 }}>{Number(latest.body_fat_pct).toFixed(1)} % grasa, meta 16 %</div>}
          </button>
        </div>
      </header>

      <main key={tab} className="fade" style={{ maxWidth: 640, margin: "0 auto", paddingBottom: "calc(84px + env(safe-area-inset-bottom))" }}>
        {tab === "dash" ? <DashboardTab measurements={measurements.rows} sessionsPerWeek={sessionsPerWeek} error={measurements.error} />
          : tab === "entreno" ? <TrainingTab plan={plan} today={today} recommendation={recommendation} />
          : tab === "registro" ? <LogTab exercises={exercises} plan={plan} today={today} />
          : <NutritionTab />}
      </main>

      <BottomNav tabs={TABS} tab={tab} onTab={setTab} accent={T.bone} />
    </div>
  );
}
