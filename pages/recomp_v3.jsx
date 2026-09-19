// RECOMP v3 — v2 plus a workout log backed by Postgres (/api/*).
// Exercise catalog and animated figures come from the DB; the plan, dashboard and
// nutrition content is shared with v2 through ./_lib/recomp/*.
import { useState, useEffect, useMemo, useCallback } from "react";
import { T, J } from "./_lib/recomp/tokens.jsx";
import { days, weightSuggestions, EXERCISE_DETAIL, POST_WORKOUT } from "./_lib/recomp/data.jsx";
import { DashboardTab, NutritionTab } from "./_lib/recomp/ui.jsx";

const MONO = "'JetBrains Mono',monospace";
const GROT = "'Space Grotesk',sans-serif";

// ═══════════════════════════════════════════════════════════════
// API + DATE HELPERS
// ═══════════════════════════════════════════════════════════════
async function api(method, url, body) {
  const res = await fetch(url, {
    method,
    headers: body ? { "content-type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
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
const volume = (sets) => sets.reduce((sum, s) => sum + s.load_kg * s.reps, 0);

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
    add: (exercise_id, load_kg, reps) => run(() => api("POST", "/api/sets", { exercise_id, load_kg, reps, date })),
    remove: (id) => run(() => api("DELETE", `/api/sets/${id}`)),
  };
}

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
      {set.load_kg}<span style={{ fontSize: 9, color: T.ash }}>kg</span> × {set.reps}
    </span>
    {onRemove && <button onClick={onRemove} title="Borrar serie" style={{ background: "none", border: "none", color: T.faint, cursor: "pointer", fontSize: 11, padding: "0 2px" }}>✕</button>}
  </div>
);

// Inline "add a set" form for one exercise. Empty fields fall back to the placeholder,
// which is the previous set today, else the last set of the previous session.
const SetLogger = ({ exercise, accent, sets, log, date }) => {
  const [kg, setKg] = useState("");
  const [reps, setReps] = useState("");
  const last = useLastSession(exercise.id, date);
  const prev = sets[sets.length - 1] ?? last?.sets?.[last.sets.length - 1];
  const kgVal = kg === "" ? prev?.load_kg : Number(kg.replace(",", "."));
  const repsVal = reps === "" ? prev?.reps : Number(reps);
  const ok = Number.isFinite(kgVal) && kgVal >= 0 && Number.isInteger(repsVal) && repsVal > 0;

  return (
    <div style={{ background: T.bg, border: `1px solid ${accent}55`, borderRadius: 9, padding: "10px 12px" }} onClick={(e) => e.stopPropagation()}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 7 }}>
        <Label color={accent}>// REGISTRO_HOY</Label>
        {last && (
          <div style={{ fontSize: 9, color: T.ash, fontFamily: MONO }}>
            ultima vez {fmtDate(last.performed_on)}: <span style={{ color: T.bone }}>{last.sets.map((s) => `${s.load_kg}×${s.reps}`).join(" · ")}</span>
          </div>
        )}
      </div>
      {sets.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 8 }}>
          {sets.map((s) => <SetChip key={s.id} set={s} accent={accent} onRemove={() => log.remove(s.id)} />)}
        </div>
      )}
      <div style={{ display: "flex", gap: 7, alignItems: "flex-end" }}>
        <NumField label="CARGA KG" value={kg} onChange={setKg} placeholder={prev ? String(prev.load_kg) : "kg"} step={0.5} accent={accent} />
        <NumField label="REPS" value={reps} onChange={setReps} placeholder={prev ? String(prev.reps) : "reps"} accent={accent} />
        <Btn accent={accent} disabled={!ok || log.busy} onClick={() => log.add(exercise.id, kgVal, repsVal)}>+ SERIE {sets.length + 1}</Btn>
      </div>
      {log.error && <div style={{ marginTop: 6, fontSize: 10, color: "#D98A8A" }}>{log.error}</div>}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// TRAINING TAB — v2 plan cards, images from DB, logger inside each card
// ═══════════════════════════════════════════════════════════════
const dayAccent = (type) => type === "strength" ? T.copper : type === "lesmills" ? T.steel : type === "recovery" ? T.sage : type === "core" ? T.gold : T.faint;

const TrainingTab = ({ exercises, today }) => {
  const [activeDay, setActiveDay] = useState(0);
  const [expandedEx, setExpandedEx] = useState(null);
  const log = useSets(today);
  const typeLabel = { strength: "FUERZA", lesmills: "CARDIO", recovery: "BALANCE", core: "CORE", rest: "OFF" };
  const sel = days[activeDay];
  const accent = dayAccent(sel.type);
  const setsFor = (name) => log.sets.filter((s) => s.exercise_name === name);

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
        <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4, marginBottom: 14 }}>
          {days.map((d, i) => {
            const ac = dayAccent(d.type);
            const on = activeDay === i;
            return (
              <button key={i} onClick={() => { setActiveDay(i); setExpandedEx(null); }} style={{
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
            {sel.optional
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
              {sel.exercises.map((ex, i) => {
                const isExp = expandedEx === i;
                const w = weightSuggestions[ex.name];
                const dbEx = exercises.byName[ex.name];
                const done = setsFor(ex.name);
                const target = Number(ex.sets) || 0;
                return (
                  <div key={i} onClick={() => setExpandedEx(isExp ? null : i)}
                    style={{ background: isExp ? T.raised : T.surface, border: `1px solid ${isExp ? accent + "66" : done.length ? accent + "33" : T.line}`, borderRadius: 12, padding: "11px 12px", cursor: "pointer", transition: "all .2s" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                      <div style={{ flexShrink: 0, width: 86, height: 68, background: T.bg, borderRadius: 9, border: `1px solid ${accent}26`, padding: 3, overflow: "hidden" }}>
                        <ExerciseImage exercise={dbEx} accent={accent} />
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
                        {[["SER", ex.sets, accent], ["REPS", ex.reps, T.bone], ["PAUSA", ex.rest, T.ash]].map(([lbl, val, col], j) => (
                          <div key={j} style={{ background: T.bg, borderRadius: 7, padding: "5px 8px", flex: 1, textAlign: "center", border: `1px solid ${T.line}` }}>
                            <div style={{ fontSize: 7, color: T.faint, letterSpacing: 1.5, fontFamily: MONO }}>{lbl}</div>
                            <div style={{ fontSize: 12, fontFamily: GROT, fontWeight: 700, color: col }}>{val}</div>
                          </div>
                        ))}
                      </div>
                    )}
                    {isExp && (
                      <div style={{ marginTop: 9, display: "flex", flexDirection: "column", gap: 8 }}>
                        {dbEx && today && <SetLogger exercise={dbEx} accent={accent} sets={done} log={log} date={today} />}
                        {w && (
                          <div style={{ background: T.bg, border: `1px solid ${accent}33`, borderRadius: 9, padding: "10px 12px" }}>
                            <Label style={{ marginBottom: 7 }}>// CARGA</Label>
                            <div style={{ display: "flex", gap: 7, marginBottom: 7 }}>
                              <div style={{ flex: 1, background: T.surface, borderRadius: 7, padding: "6px 9px" }}>
                                <Label style={{ marginBottom: 2, letterSpacing: 0 }}>INICIO</Label>
                                <div style={{ fontSize: 12, fontFamily: GROT, fontWeight: 700, color: accent }}>{w.start}</div>
                              </div>
                              <div style={{ flex: 1, background: T.surface, borderRadius: 7, padding: "6px 9px" }}>
                                <Label style={{ marginBottom: 2, letterSpacing: 0 }}>SEM_06</Label>
                                <div style={{ fontSize: 12, fontFamily: GROT, fontWeight: 700, color: T.bone }}>{w.target}</div>
                              </div>
                            </div>
                            <div style={{ fontSize: 10, color: T.sage, lineHeight: 1.5 }}>{w.note}</div>
                          </div>
                        )}
                        {EXERCISE_DETAIL[ex.name] && (
                          <div style={{ background: T.bg, border: `1px solid ${T.line}`, borderRadius: 9, padding: "10px 12px" }}>
                            <Label style={{ marginBottom: 4 }}>// MUSCULOS</Label>
                            <div style={{ fontSize: 10, color: T.gold, marginBottom: 9 }}>{EXERCISE_DETAIL[ex.name].musculos}</div>
                            <Label style={{ marginBottom: 5 }}>// EJECUCION</Label>
                            {EXERCISE_DETAIL[ex.name].pasos.map((p, pi) => (
                              <div key={pi} style={{ display: "flex", gap: 8, marginBottom: 5 }}>
                                <div style={{ flexShrink: 0, width: 16, height: 16, borderRadius: 4, background: accent + "22", border: `1px solid ${accent}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, color: accent, fontFamily: MONO }}>{pi + 1}</div>
                                <div style={{ fontSize: 10, color: T.bone, lineHeight: 1.5, paddingTop: 1 }}>{p}</div>
                              </div>
                            ))}
                            <div style={{ marginTop: 8, fontSize: 10, color: "#D98A8A", background: "#241414", border: "1px solid #4A2828", borderRadius: 7, padding: "6px 9px", lineHeight: 1.5 }}>
                              ✕ {EXERCISE_DETAIL[ex.name].error}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {sel.core && (
              <div style={{ marginTop: 12 }}>
                <Label color={T.gold} style={{ fontSize: 9, marginBottom: 8 }}>// CORE_FINISHER — 5-8 MIN</Label>
                <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                  {sel.core.map((ex, ci) => (
                    <div key={ci} style={{ background: T.surface, border: `1px solid ${T.gold}22`, borderRadius: 11, padding: "10px 13px" }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: T.gold, marginBottom: 3, fontFamily: GROT }}>{ex.name}</div>
                      <div style={{ fontSize: 10, color: T.ash, lineHeight: 1.5, marginBottom: 8 }}>{ex.note}</div>
                      <div style={{ display: "flex", gap: 5 }}>
                        {[["SER", ex.sets, T.gold], ["REPS", ex.reps, T.bone], ["PAUSA", ex.rest, T.ash]].map(([lbl, val, col], j) => (
                          <div key={j} style={{ background: T.bg, borderRadius: 7, padding: "5px 8px", flex: 1, textAlign: "center", border: `1px solid ${T.line}` }}>
                            <div style={{ fontSize: 7, color: T.faint, letterSpacing: 1.5, fontFamily: MONO }}>{lbl}</div>
                            <div style={{ fontSize: 11, fontFamily: GROT, fontWeight: 700, color: col }}>{val}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {sel.postKey && POST_WORKOUT[sel.postKey] && (
              <div style={{ marginTop: 12, background: "#16201A", border: `1px solid ${T.sage}33`, borderRadius: 12, padding: "13px 15px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
                  <Label color={T.sage} style={{ fontSize: 9 }}>// {POST_WORKOUT[sel.postKey].titulo.toUpperCase()}</Label>
                  <div style={{ fontSize: 8, color: T.gold, fontFamily: MONO }}>{POST_WORKOUT[sel.postKey].ventana}</div>
                </div>
                {POST_WORKOUT[sel.postKey].comida.map((c, ci) => (
                  <div key={ci} style={{ fontSize: 11, color: T.bone, lineHeight: 1.9, paddingLeft: 9, borderLeft: `1px solid ${T.sage}55` }}>· {c}</div>
                ))}
                <div style={{ marginTop: 8, fontSize: 9, color: T.sage, fontFamily: MONO }}>{POST_WORKOUT[sel.postKey].macros}</div>
                <div style={{ marginTop: 6, fontSize: 10, color: T.ash, lineHeight: 1.6 }}>{POST_WORKOUT[sel.postKey].razon}</div>
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
// LOG TAB — any exercise, any date, history
// ═══════════════════════════════════════════════════════════════
const NEW_EXERCISE = "__new__";

const NewExerciseForm = ({ onCreated, onCancel }) => {
  const [name, setName] = useState("");
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

const LogTab = ({ exercises, today }) => {
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

  const favorites = exercises.list.filter((e) => e.is_favorite);
  const others = exercises.list.filter((e) => !e.is_favorite);

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
        <select value={creating ? NEW_EXERCISE : exerciseId}
          onChange={(e) => { if (e.target.value === NEW_EXERCISE) setCreating(true); else { setCreating(false); setExerciseId(e.target.value); } }}
          style={{ ...inputStyle, fontSize: 13, appearance: "auto" }}>
          <option value="">— elegir ejercicio —</option>
          <optgroup label="PLAN">{favorites.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}</optgroup>
          <optgroup label="OTROS">{others.map((e) => <option key={e.id} value={e.id}>{e.name}{e.muscle_group ? ` · ${e.muscle_group}` : ""}</option>)}</optgroup>
          <option value={NEW_EXERCISE}>+ nuevo ejercicio…</option>
        </select>
        {creating && (
          <NewExerciseForm onCancel={() => setCreating(false)}
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
                    {sets.length} series · {fmtKg(volume(sets))} kg · max {Math.max(...sets.map((s) => s.load_kg))} kg
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
  const [tab, setTab] = useState("dash");
  const [today, setToday] = useState(null);
  const exercises = useExercises();
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
            <div><span style={{ color: T.gold }}>77.8</span> kg · <span style={{ color: T.copper }}>21.6</span>%</div>
            <div style={{ color: T.faint }}>obj: 15% en 12 sem</div>
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
        {tab === "dash" ? <DashboardTab />
          : tab === "entreno" ? <TrainingTab exercises={exercises} today={today} />
          : tab === "registro" ? <LogTab exercises={exercises} today={today} />
          : <NutritionTab />}
      </div>

      <div style={{ padding: "10px 18px 26px", textAlign: "center", fontSize: 8, color: T.faint, letterSpacing: 2 }}>
        DATA 27/08 · RECOMPOSICION CONFIRMADA · REV EN 3 SEMANAS
      </div>
    </div>
  );
}
