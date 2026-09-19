// Dashboard and nutrition tabs plus shared widgets, extracted verbatim from recomp_v2.jsx.
import { useState } from "react";
import { T, J } from "./tokens.jsx";
import { WEIGHT_SERIES, METRICS_NOW, PROFILE, GOALS, SUPS, MACROS, WEEK, typeStyle, slotColor } from "./data.jsx";

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

// Sparkline telemetry strip
export const WeightSpark = () => {
  const data = WEIGHT_SERIES;
  const min = 74, max = 88;
  const W = 320, H = 64, PAD = 6;
  const pts = data.map((d, i) => ({
    x: PAD + (i / (data.length - 1)) * (W - PAD*2),
    y: PAD + (1 - (d.w - min) / (max - min)) * (H - PAD*2),
  }));
  const path = pts.map((p,i) => `${i===0?"M":"L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const area = path + ` L${pts[pts.length-1].x},${H} L${pts[0].x},${H} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H+18}`} style={{ width:"100%", display:"block" }}>
      <defs>
        <linearGradient id="wfade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={T.copper} stopOpacity="0.25"/>
          <stop offset="100%" stopColor={T.copper} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <path d={area} fill="url(#wfade)"/>
      <path d={path} fill="none" stroke={T.copper} strokeWidth="2" strokeLinejoin="round"/>
      {pts.map((p,i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={i===pts.length-1?4:2.5} fill={i===pts.length-1?T.gold:T.bg} stroke={T.copper} strokeWidth="1.5"/>
          {(i===0||i===pts.length-1) && (
            <text x={p.x} y={p.y-8} textAnchor={i===0?"start":"end"} fontSize="9" fill={i===pts.length-1?T.gold:T.ash} fontFamily="'JetBrains Mono',monospace">{data[i].w}</text>
          )}
          <text x={p.x} y={H+13} textAnchor="middle" fontSize="7" fill={T.faint} fontFamily="'JetBrains Mono',monospace">{data[i].date}</text>
        </g>
      ))}
    </svg>
  );
};

// ═══════════════════════════════════════════════════════════════
// DASHBOARD TAB
// ═══════════════════════════════════════════════════════════════
export const DashboardTab = () => (
  <div style={{ padding:"16px 14px 30px" }} className="fadein">

    {/* Telemetry: weight trend */}
    <div style={{ background:T.surface, border:`1px solid ${T.line}`, borderRadius:14, padding:"14px 14px 8px", marginBottom:14 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:6 }}>
        <div style={{ fontSize:9, letterSpacing:2, color:T.faint, fontFamily:"'JetBrains Mono',monospace" }}>// PESO_KG — ENE→JUN 2026</div>
        <div style={{ fontSize:11, color:T.gold, fontFamily:"'JetBrains Mono',monospace" }}>−9.5 kg</div>
      </div>
      <WeightSpark/>
    </div>

    {/* Metrics grid */}
    <div style={{ fontSize:9, letterSpacing:2, color:T.faint, marginBottom:8, fontFamily:"'JetBrains Mono',monospace" }}>// ULTIMA MEDICION — 27/08</div>
    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:16 }}>
      {METRICS_NOW.map((m,i) => (
        <div key={i} style={{ background:T.surface, border:`1px solid ${T.line}`, borderRadius:12, padding:"12px 13px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4 }}>
            <div style={{ fontSize:9, letterSpacing:1.5, color:T.faint, fontFamily:"'JetBrains Mono',monospace" }}>{m.label}</div>
            <div style={{ fontSize:9, fontFamily:"'JetBrains Mono',monospace",
              color: m.good===true?T.sage : m.good===false?T.copper : T.ash }}>{m.delta}</div>
          </div>
          <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:24, fontWeight:700, color:T.bone, lineHeight:1 }}>
            {m.value}<span style={{ fontSize:11, color:T.ash, marginLeft:3 }}>{m.unit}</span>
          </div>
          <div style={{ fontSize:8, color:T.faint, marginTop:4, fontFamily:"'JetBrains Mono',monospace" }}>{m.range}</div>
        </div>
      ))}
    </div>

    {/* Interpretation note */}
    <div style={{ background:"#241A10", border:`1px solid ${T.ember}44`, borderRadius:12, padding:"11px 14px", marginBottom:16, fontSize:11, color:"#E8C49A", lineHeight:1.7 }}>
      Recomposicion confirmada: +1.5 kg musculo y -0.7 kg grasa en el mismo periodo. El 94% del peso ganado fue masa magra. Mantener sueño y proteina. Proxima medicion: <span style={{ color:T.gold }}>3 semanas</span>.
    </div>

    {/* Goals */}
    <div style={{ fontSize:9, letterSpacing:2, color:T.faint, marginBottom:8, fontFamily:"'JetBrains Mono',monospace" }}>// OBJETIVOS — 12 SEMANAS</div>
    <div style={{ background:T.surface, border:`1px solid ${T.line}`, borderRadius:14, padding:"14px", marginBottom:16 }}>
      {GOALS.map((g,i) => {
        const pct = g.invert
          ? Math.min(100, Math.max(0, Math.round(((20.3 - g.now) / (20.3 - g.target)) * 100)))
          : Math.min(100, Math.round((g.now / g.target) * 100));
        return (
          <div key={i} style={{ marginBottom:i<GOALS.length-1?12:0 }}>
            <div style={{ display:"flex", justifyContent:"space-between", fontSize:10, marginBottom:4 }}>
              <span style={{ color:T.ash }}>{g.label}</span>
              <span style={{ color:T.bone, fontFamily:"'JetBrains Mono',monospace" }}>{g.now}{g.unit} <span style={{ color:T.faint }}>→ {g.target}{g.unit}</span></span>
            </div>
            <div style={{ background:T.raised, borderRadius:3, height:5, overflow:"hidden" }}>
              <div style={{ width:`${pct}%`, height:"100%", background:`linear-gradient(90deg, ${T.ember}, ${T.copper})`, borderRadius:3 }}/>
            </div>
          </div>
        );
      })}
    </div>

    {/* Week structure */}
    <div style={{ fontSize:9, letterSpacing:2, color:T.faint, marginBottom:8, fontFamily:"'JetBrains Mono',monospace" }}>// ESTRUCTURA SEMANAL</div>
    <div style={{ display:"flex", gap:5, marginBottom:14 }}>
      {[["L","E", T.copper],["M","H", T.copper],["X","P", T.copper],["J","C", T.steel],["V","R", T.copper],["S","B", T.sage],["D","—", T.faint],["+","C", T.gold]].map(([d,s,col],i) => (
        <div key={i} style={{ flex:1, background:T.surface, border:`1px solid ${T.line}`, borderTop:`2px solid ${col}`, borderRadius:9, padding:"8px 0", textAlign:"center" }}>
          <div style={{ fontSize:10, color:T.ash, fontFamily:"'JetBrains Mono',monospace" }}>{d}</div>
          <div style={{ fontSize:13, fontWeight:700, color:col, fontFamily:"'Space Grotesk',sans-serif", marginTop:2 }}>{s}</div>
        </div>
      ))}
    </div>
    <div style={{ fontSize:9, color:T.faint, fontFamily:"'JetBrains Mono',monospace", lineHeight:1.8 }}>
      E=Empuje · H=Halar · P=Pierna · C=Cardio · R=Rotacion E/H · B=Balance · <span style={{ color:T.gold }}>+C=Core opcional</span>
    </div>

    {/* Profile footer */}
    <div style={{ marginTop:16, padding:"11px 14px", background:T.surface, border:`1px solid ${T.line}`, borderRadius:12, display:"flex", justifyContent:"space-between", fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:T.ash }}>
      <span>36A</span><span>178 CM</span><span>H</span><span>146G PROT</span><span>~2,450 KCAL</span>
    </div>
  </div>
);

// ═══════════════════════════════════════════════════════════════
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
