// Dashboard and nutrition tabs plus shared widgets. The dashboard renders the body
// measurements the page fetched from /api/measurements; the nutrition tab is static content.
import { useState } from "react";
import { T, J } from "./tokens.jsx";
import { PROFILE, GOALS, SUPS, MACROS, WEEK, typeStyle, slotColor } from "./data.jsx";

export const JointLegend = () => (
  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", padding: "8px 16px", background: "#0d0d0d", borderBottom: "1px solid #1a1a1a" }}>
    {[["Hombro", J.shoulder], ["Codo", J.elbow], ["Rodilla", J.knee], ["Cadera", J.hip]].map(([lbl, col]) => (
      <div key={lbl} style={{ display: "flex", alignItems: "center", gap: 5 }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: col }} />
        <span style={{ fontSize: 9, color: "#666", letterSpacing: 1 }}>{lbl.toUpperCase()}</span>
      </div>
    ))}
  </div>
);


// ═══════════════════════════════════════════════════════════════
// SHARED UI
// ═══════════════════════════════════════════════════════════════
export const MacroBar = ({ prot, carbs, fat, kcal }) => {
  const total = prot*4 + carbs*4 + fat*9;
  const pp = Math.round((prot*4/total)*100);
  const cp = Math.round((carbs*4/total)*100);
  const fp = 100-pp-cp;
  return (
    <div style={{ marginTop:10 }}>
      <div style={{ display:"flex", gap:3, marginBottom:4 }}>
        {[["P",pp,T.sage],["C",cp,T.gold],["G",fp,T.copper]].map(([l,p,col]) => (
          <div key={l} style={{ flex:p, background:col, height:3, borderRadius:2, opacity:0.85 }}/>
        ))}
      </div>
      <div style={{ display:"flex", gap:10, fontSize:9, fontFamily:"'JetBrains Mono',monospace" }}>
        <span style={{ color:T.sage }}>P{prot}</span>
        <span style={{ color:T.gold }}>C{carbs}</span>
        <span style={{ color:T.copper }}>G{fat}</span>
        <span style={{ color:T.ash, marginLeft:"auto" }}>{kcal} kcal</span>
      </div>
    </div>
  );
};

export const DayTotal = ({ meals, isTraining }) => {
  const t = meals.reduce((a,m) => ({ prot:a.prot+m.macros.prot, carbs:a.carbs+m.macros.carbs, fat:a.fat+m.macros.fat, kcal:a.kcal+m.macros.kcal }), { prot:0, carbs:0, fat:0, kcal:0 });
  const whey = isTraining ? 27 : 0;
  return (
    <div style={{ background:T.surface, border:`1px solid ${T.line}`, borderRadius:12, padding:"12px 14px", marginTop:12 }}>
      <div style={{ fontSize:9, letterSpacing:2, color:T.faint, marginBottom:8, fontFamily:"'JetBrains Mono',monospace" }}>TOTAL DIA{isTraining?" +WHEY":""}</div>
      <div style={{ display:"flex", gap:6 }}>
        {[["PROT",(t.prot+whey)+"g",T.sage],["CARB",t.carbs+"g",T.gold],["GRASA",t.fat+"g",T.copper],["KCAL",t.kcal,T.bone]].map(([l,v,col]) => (
          <div key={l} style={{ flex:1, background:T.raised, borderRadius:8, padding:"6px 0", textAlign:"center" }}>
            <div style={{ fontSize:8, color:T.faint, letterSpacing:1, fontFamily:"'JetBrains Mono',monospace" }}>{l}</div>
            <div style={{ fontSize:13, fontWeight:700, color:col, fontFamily:"'Space Grotesk',sans-serif" }}>{v}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// TELEMETRY — everything below reads body_measurements (/api/measurements),
// oldest first. Nothing here is hard-coded: the Samsung Health parser writes a row,
// the dashboard shows it on the next load.
// ═══════════════════════════════════════════════════════════════

const MONO = "'JetBrains Mono',monospace";
const GROT = "'Space Grotesk',sans-serif";

// "2026-08-27" -> "8/27", the compact label under each point of the sparkline.
const sparkLabel = (iso) => { const [, m, d] = iso.split("-"); return `${Number(m)}/${Number(d)}`; };
const fmtDay = (iso) => { const [, m, d] = iso.split("-"); return `${d}/${m}`; };
const round1 = (n) => Math.round(n * 10) / 10;
const signed = (n, digits = 1) => (n > 0 ? "+" : n < 0 ? "−" : "") + Math.abs(n).toFixed(digits);

// Sparkline telemetry strip. `series` is [{ date, w }]; the scale is the data's own
// range padded by 1 kg, so it stays readable however much weight has moved.
export const WeightSpark = ({ series }) => {
  const data = series;
  if (data.length < 2) return <div style={{ fontSize: 10, color: T.faint, fontFamily: MONO, padding: "18px 0" }}>Se necesitan 2 mediciones para el grafico.</div>;
  const ws = data.map((d) => d.w);
  const min = Math.floor(Math.min(...ws) - 1);
  const max = Math.ceil(Math.max(...ws) + 1);
  const W = 320, H = 64, PAD = 6;
  const pts = data.map((d, i) => ({
    x: PAD + (i / (data.length - 1)) * (W - PAD * 2),
    y: PAD + (1 - (d.w - min) / (max - min)) * (H - PAD * 2),
  }));
  const path = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const area = path + ` L${pts[pts.length - 1].x},${H} L${pts[0].x},${H} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H + 18}`} style={{ width: "100%", display: "block" }}>
      <defs>
        <linearGradient id="wfade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={T.copper} stopOpacity="0.25" />
          <stop offset="100%" stopColor={T.copper} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#wfade)" />
      <path d={path} fill="none" stroke={T.copper} strokeWidth="2" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={i === pts.length - 1 ? 4 : 2.5} fill={i === pts.length - 1 ? T.gold : T.bg} stroke={T.copper} strokeWidth="1.5" />
          {(i === 0 || i === pts.length - 1) && (
            <text x={p.x} y={p.y - 8} textAnchor={i === 0 ? "start" : "end"} fontSize="9" fill={i === pts.length - 1 ? T.gold : T.ash} fontFamily={MONO}>{data[i].w}</text>
          )}
          <text x={p.x} y={H + 13} textAnchor="middle" fontSize="7" fill={T.faint} fontFamily={MONO}>{data[i].date}</text>
        </g>
      ))}
    </svg>
  );
};

// The six cards of the metrics grid, built from the last two measurements. A metric the
// screenshot did not carry is simply left out, so partial rows are fine. `good` decides
// the colour of the delta: green when the number moved the way the goal wants.
const CARDS = [
  { key: "weight_kg", label: "PESO", unit: "kg", digits: 1, better: 0, range: "" },
  { key: "body_fat_pct", label: "GRASA", unit: "%", digits: 1, better: -1, range: "obj 15–17" },
  { key: "skeletal_muscle_kg", label: "MUSCULO", unit: "kg", digits: 1, better: 1, range: "masa magra" },
  { key: "bmi", label: "BMI", unit: "", digits: 1, better: 0, range: "normal 18.5–25" },
  { key: "bmr_kcal", label: "BMR", unit: "kcal", digits: 0, better: 1, range: "metabolismo basal" },
  { key: "body_water_kg", label: "AGUA", unit: "kg", digits: 1, better: 1, range: "hidratacion" },
];

const metricCards = (now, before) =>
  CARDS.filter((c) => now?.[c.key] != null).map((c) => {
    const delta = before?.[c.key] != null ? now[c.key] - before[c.key] : null;
    return {
      ...c,
      value: c.digits === 0 ? Number(now[c.key]).toLocaleString("es-ES") : Number(now[c.key]).toFixed(c.digits),
      delta: delta == null ? "—" : signed(delta, c.digits),
      good: delta == null || c.better === 0 || delta === 0 ? null : (delta > 0) === (c.better > 0),
    };
  });

// ═══════════════════════════════════════════════════════════════
// DASHBOARD TAB
// ═══════════════════════════════════════════════════════════════
// `measurements` is the /api/measurements payload, oldest first. `sessionsPerWeek` is
// what the log says about the last 7 days; it fills the goal bar that has no metric.
export const DashboardTab = ({ measurements = [], sessionsPerWeek = null, error = null }) => {
  const now = measurements[measurements.length - 1] ?? null;
  const before = measurements[measurements.length - 2] ?? null;
  const first = measurements[0] ?? null;
  const series = measurements.filter((m) => m.weight_kg != null).map((m) => ({ date: sparkLabel(m.measured_on), w: Number(m.weight_kg) }));
  const swing = series.length > 1 ? round1(series[series.length - 1].w - series[0].w) : null;
  const cards = metricCards(now, before);
  const goals = GOALS.map((g) => ({ ...g, now: g.metric && now?.[g.metric] != null ? Number(now[g.metric]) : g.label === "Sesiones/semana" && sessionsPerWeek != null ? sessionsPerWeek : g.now }));
  const muscleDelta = now && before && now.skeletal_muscle_kg != null && before.skeletal_muscle_kg != null ? now.skeletal_muscle_kg - before.skeletal_muscle_kg : null;
  const fatPctDelta = now && before && now.body_fat_pct != null && before.body_fat_pct != null ? now.body_fat_pct - before.body_fat_pct : null;

  return (
    <div style={{ padding: "16px 14px 30px" }} className="fadein">

      {error && <div style={{ background: "#241414", border: "1px solid #4A2828", borderRadius: 11, padding: "10px 13px", marginBottom: 12, fontSize: 11, color: "#D98A8A" }}>{error}</div>}

      {!measurements.length ? (
        <div style={{ background: T.surface, border: `1px solid ${T.line}`, borderRadius: 14, padding: "26px 18px", textAlign: "center", marginBottom: 14 }}>
          <div style={{ fontSize: 9, letterSpacing: 2, color: T.faint, fontFamily: MONO, marginBottom: 8 }}>// SIN MEDICIONES</div>
          <div style={{ fontSize: 11, color: T.ash, lineHeight: 1.8 }}>Pasale al coach una captura de Samsung Health<br />y la telemetria aparece aqui.</div>
        </div>
      ) : (
        <>
          {/* Telemetry: weight trend */}
          <div style={{ background: T.surface, border: `1px solid ${T.line}`, borderRadius: 14, padding: "14px 14px 8px", marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
              <div style={{ fontSize: 9, letterSpacing: 2, color: T.faint, fontFamily: MONO }}>
                // PESO_KG — {first ? `${fmtDay(first.measured_on)}→${fmtDay(now.measured_on)}` : ""}
              </div>
              {swing != null && <div style={{ fontSize: 11, color: T.gold, fontFamily: MONO }}>{signed(swing)} kg</div>}
            </div>
            <WeightSpark series={series} />
          </div>

          {/* Metrics grid */}
          <div style={{ fontSize: 9, letterSpacing: 2, color: T.faint, marginBottom: 8, fontFamily: MONO }}>
            // ULTIMA MEDICION — {fmtDay(now.measured_on)}{before ? ` · vs ${fmtDay(before.measured_on)}` : ""}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
            {cards.map((m) => (
              <div key={m.key} style={{ background: T.surface, border: `1px solid ${T.line}`, borderRadius: 12, padding: "12px 13px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <div style={{ fontSize: 9, letterSpacing: 1.5, color: T.faint, fontFamily: MONO }}>{m.label}</div>
                  <div style={{ fontSize: 9, fontFamily: MONO, color: m.good === true ? T.sage : m.good === false ? T.copper : T.ash }}>{m.delta}</div>
                </div>
                <div style={{ fontFamily: GROT, fontSize: 24, fontWeight: 700, color: T.bone, lineHeight: 1 }}>
                  {m.value}<span style={{ fontSize: 11, color: T.ash, marginLeft: 3 }}>{m.unit}</span>
                </div>
                <div style={{ fontSize: 8, color: T.faint, marginTop: 4, fontFamily: MONO }}>{m.range}</div>
              </div>
            ))}
          </div>

          {/* Interpretation — read off the last two rows, never written by hand */}
          {before && (muscleDelta != null || fatPctDelta != null) && (
            <div style={{ background: "#241A10", border: `1px solid ${T.ember}44`, borderRadius: 12, padding: "11px 14px", marginBottom: 16, fontSize: 11, color: "#E8C49A", lineHeight: 1.7 }}>
              {muscleDelta != null && fatPctDelta != null && muscleDelta > 0 && fatPctDelta < 0
                ? <>Recomposicion confirmada: <span style={{ color: T.gold }}>{signed(muscleDelta)} kg</span> de musculo y <span style={{ color: T.gold }}>{signed(fatPctDelta)} pp</span> de grasa desde el {fmtDay(before.measured_on)}. Mantener sueno y proteina.</>
                : <>Desde el {fmtDay(before.measured_on)}: {muscleDelta != null && <>musculo <span style={{ color: T.gold }}>{signed(muscleDelta)} kg</span></>}{muscleDelta != null && fatPctDelta != null && " · "}{fatPctDelta != null && <>grasa <span style={{ color: T.gold }}>{signed(fatPctDelta)} pp</span></>}. Revisa adherencia y proteina antes de tocar el plan.</>}
              {now.note && <div style={{ marginTop: 6, fontSize: 10, color: T.ash }}>↳ {now.note}</div>}
            </div>
          )}
        </>
      )}

      {/* Goals */}
      <div style={{ fontSize: 9, letterSpacing: 2, color: T.faint, marginBottom: 8, fontFamily: MONO }}>// OBJETIVOS — 12 SEMANAS</div>
      <div style={{ background: T.surface, border: `1px solid ${T.line}`, borderRadius: 14, padding: "14px", marginBottom: 16 }}>
        {goals.map((g, i) => {
          const span = g.target - g.from;
          const pct = span === 0 ? 100 : Math.min(100, Math.max(0, Math.round(((g.now - g.from) / span) * 100)));
          return (
            <div key={i} style={{ marginBottom: i < goals.length - 1 ? 12 : 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, marginBottom: 4 }}>
                <span style={{ color: T.ash }}>{g.label}</span>
                <span style={{ color: T.bone, fontFamily: MONO }}>{round1(g.now)}{g.unit} <span style={{ color: T.faint }}>→ {g.target}{g.unit}</span></span>
              </div>
              <div style={{ background: T.raised, borderRadius: 3, height: 5, overflow: "hidden" }}>
                <div style={{ width: `${pct}%`, height: "100%", background: `linear-gradient(90deg, ${T.ember}, ${T.copper})`, borderRadius: 3 }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Week structure */}
      <div style={{ fontSize: 9, letterSpacing: 2, color: T.faint, marginBottom: 8, fontFamily: MONO }}>// ESTRUCTURA SEMANAL</div>
      <div style={{ display: "flex", gap: 5, marginBottom: 14 }}>
        {[["L", "E", T.copper], ["M", "H", T.copper], ["X", "P", T.copper], ["J", "C", T.steel], ["V", "R", T.copper], ["S", "B", T.sage], ["D", "—", T.faint], ["+", "C", T.gold]].map(([d, sg, col], i) => (
          <div key={i} style={{ flex: 1, background: T.surface, border: `1px solid ${T.line}`, borderTop: `2px solid ${col}`, borderRadius: 9, padding: "8px 0", textAlign: "center" }}>
            <div style={{ fontSize: 10, color: T.ash, fontFamily: MONO }}>{d}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: col, fontFamily: GROT, marginTop: 2 }}>{sg}</div>
          </div>
        ))}
      </div>
      <div style={{ fontSize: 9, color: T.faint, fontFamily: MONO, lineHeight: 1.8 }}>
        E=Empuje · H=Halar · P=Pierna · C=Cardio · R=Rotacion E/H · B=Balance · <span style={{ color: T.gold }}>+C=Core opcional</span>
      </div>

      {/* Profile footer */}
      <div style={{ marginTop: 16, padding: "11px 14px", background: T.surface, border: `1px solid ${T.line}`, borderRadius: 12, display: "flex", justifyContent: "space-between", fontFamily: MONO, fontSize: 10, color: T.ash }}>
        <span>{PROFILE.edad}A</span><span>{PROFILE.altura} CM</span><span>H</span><span>{MACROS.prot}G PROT</span><span>~{MACROS.kcal.toLocaleString("es-ES")} KCAL</span>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// TRAINING TAB
// ═══════════════════════════════════════════════════════════════// ═══════════════════════════════════════════════════════════════
// TRAINING TAB
// ═══════════════════════════════════════════════════════════════


// ═══════════════════════════════════════════════════════════════
// NUTRITION TAB
// ═══════════════════════════════════════════════════════════════
export const NutritionTab = () => {
  const [activeDay, setActiveDay] = useState(0);
  const [showSups, setShowSups] = useState(false);
  const [expandedMeal, setExpandedMeal] = useState(null);
  const day = WEEK[activeDay];
  const ts = typeStyle[day.tipo];
  const isTraining = day.tipo==="fuerza" || day.tipo==="lesmills";

  return (
    <div>
      <div style={{ padding:"12px 14px 0", borderBottom:`1px solid ${T.line}`, background:T.surface }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
          <div style={{ fontSize:9, color:T.faint, letterSpacing:2, fontFamily:"'JetBrains Mono',monospace" }}>// 2,450 KCAL · 146G PROT</div>
          <button onClick={() => setShowSups(!showSups)} style={{
            background:showSups?"#241A10":T.raised, border:`1px solid ${showSups?T.copper:T.line}`,
            borderRadius:8, padding:"5px 10px", cursor:"pointer", fontSize:9,
            color:showSups?T.copper:T.ash, letterSpacing:1, fontFamily:"'JetBrains Mono',monospace",
          }}>{showSups?"− SUPLEMENTOS":"+ SUPLEMENTOS"}</button>
        </div>

        {showSups && (
          <div style={{ background:"#241A10", border:`1px solid ${T.ember}55`, borderRadius:12, padding:"12px 14px", marginBottom:10 }}>
            <div style={{ fontSize:9, letterSpacing:2, color:T.copper, marginBottom:8, fontFamily:"'JetBrains Mono',monospace" }}>// STACK_DIARIO</div>
            {SUPS.map((s,i) => (
              <div key={i} style={{ marginBottom:i<SUPS.length-1?9:0 }}>
                <div style={{ fontSize:10, color:T.gold, marginBottom:3, fontWeight:600 }}>{s.time}</div>
                {s.items.map((item,j) => <div key={j} style={{ fontSize:11, color:"#E8C49A", paddingLeft:10, lineHeight:1.8 }}>· {item}</div>)}
                <div style={{ fontSize:9, color:T.ash, paddingLeft:10, marginTop:2 }}>↳ {s.note}</div>
              </div>
            ))}
            {!isTraining && <div style={{ marginTop:9, fontSize:10, color:T.gold, background:T.bg, border:`1px solid ${T.gold}33`, borderRadius:8, padding:"6px 10px" }}>Dia sin entreno — omitir L-Arginina y whey. Creatina opcional.</div>}
          </div>
        )}

        <div style={{ display:"flex", gap:5, overflowX:"auto", paddingBottom:8 }}>
          {WEEK.map((d,i) => {
            const ts2 = typeStyle[d.tipo];
            const on = activeDay===i;
            return (
              <button key={i} onClick={() => { setActiveDay(i); setExpandedMeal(null); }} style={{
                flexShrink:0, padding:"7px 10px", borderRadius:9, minWidth:48, textAlign:"center", cursor:"pointer",
                background:on?ts2.bg:T.bg, border:`1px solid ${on?ts2.accent:T.line}`, borderTop:`2px solid ${on?ts2.accent:T.line}`,
                color:on?T.bone:T.ash, transition:"all .2s",
              }}>
                <div style={{ fontSize:11, fontFamily:"'Space Grotesk',sans-serif", fontWeight:700 }}>{d.day}</div>
                <div style={{ fontSize:7, marginTop:2, color:on?ts2.accent:T.faint, fontFamily:"'JetBrains Mono',monospace" }}>{ts2.badge.slice(0,5)}</div>
              </button>
            );
          })}
        </div>
      </div>

      <div key={activeDay} style={{ padding:"14px 14px 30px" }} className="fadein">
        <div style={{ display:"flex", alignItems:"center", gap:9, marginBottom:12 }}>
          <div style={{ width:3, height:26, background:ts.accent, borderRadius:2 }}/>
          <div>
            <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:15, fontWeight:700, color:T.bone }}>
              {["Lunes","Martes","Miercoles","Jueves","Viernes","Sabado","Domingo"][activeDay]}
            </div>
            <div style={{ fontSize:8, color:ts.accent, letterSpacing:2, fontFamily:"'JetBrains Mono',monospace" }}>{ts.badge}{isTraining?" · ENTRENO AM":""}</div>
          </div>
          {isTraining && <div style={{ marginLeft:"auto", background:ts.bg, border:`1px solid ${ts.accent}44`, borderRadius:7, padding:"3px 8px", fontSize:8, color:ts.accent, fontFamily:"'JetBrains Mono',monospace" }}>SUPLE ON</div>}
        </div>

        {day.meals.map((meal,i) => {
          const isExp = expandedMeal===i;
          const sc = slotColor[meal.slot];
          return (
            <div key={i} onClick={() => setExpandedMeal(isExp?null:i)}
              style={{ background:isExp?T.raised:T.surface, border:`1px solid ${isExp?sc+"66":T.line}`, borderRadius:12, padding:"12px 13px", marginBottom:8, borderLeft:`3px solid ${sc}`, cursor:"pointer", transition:"all .2s" }}>
              <div style={{ display:"flex", alignItems:"flex-start", gap:9 }}>
                <div style={{ flexShrink:0, width:32, height:32, background:T.bg, borderRadius:7, display:"flex", alignItems:"center", justifyContent:"center", fontSize:15, border:`1px solid ${T.line}` }}>{meal.icon}</div>
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:2 }}>
                    <span style={{ fontSize:8, color:sc, letterSpacing:1.5, fontWeight:600, fontFamily:"'JetBrains Mono',monospace" }}>{meal.slot.toUpperCase()}</span>
                    <span style={{ fontSize:8, color:T.faint, fontFamily:"'JetBrains Mono',monospace" }}>{meal.time}</span>
                  </div>
                  <div style={{ fontSize:12, fontWeight:600, lineHeight:1.3, color:T.bone, fontFamily:"'Space Grotesk',sans-serif" }}>{meal.name}</div>
                </div>
                <div style={{ fontSize:11, color:isExp?sc:T.faint, flexShrink:0, alignSelf:"center" }}>{isExp?"▲":"▼"}</div>
              </div>
              <MacroBar {...meal.macros}/>
              {isExp && (
                <div style={{ marginTop:10, paddingTop:10, borderTop:`1px solid ${T.line}` }}>
                  <div style={{ marginBottom:7 }}>
                    {meal.items.map((item,j) => <div key={j} style={{ fontSize:11, color:T.bone, lineHeight:2, paddingLeft:8, borderLeft:`1px solid ${sc}55` }}>· {item}</div>)}
                  </div>
                  <div style={{ fontSize:10, color:T.sage, background:T.bg, borderRadius:8, padding:"6px 10px", lineHeight:1.5, border:`1px solid ${T.line}` }}>{meal.note}</div>
                  {meal.slot==="Desayuno" && isTraining && (
                    <div style={{ marginTop:7, fontSize:10, color:T.gold, background:"#241A10", border:`1px solid ${T.gold}33`, borderRadius:8, padding:"6px 10px", lineHeight:1.6 }}>
                      L-Arginina + Creatina 30 min pre-entreno · Whey en este desayuno
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        <DayTotal meals={day.meals} isTraining={isTraining}/>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// ROOT — PLAN RECOMP v2
// ═══════════════════════════════════════════════════════════════
