// Body ("Cuerpo") and food ("Comida") tabs. The body tab renders the measurements the page
// fetched from /api/measurements; the food tab is static content from ./data.jsx.
// Style: "Goma y tiza" — see ./tokens.jsx and ./kit.jsx.
import { useState } from "react";
import { T, NUM } from "./tokens.jsx";
import { Card, Section } from "./kit.jsx";
import { PROFILE, GOALS, SUPS, MACROS, WEEK } from "./data.jsx";

const unit = { fontSize: 13, color: T.ash, fontWeight: 500, fontStretch: "100%" };
const MACRO_COLORS = { prot: T.core, carbs: T.legs, fat: T.push };

// ═══════════════════════════════════════════════════════════════
// SHARED UI
// ═══════════════════════════════════════════════════════════════
export const MacroBar = ({ prot, carbs, fat, kcal }) => {
  const total = prot * 4 + carbs * 4 + fat * 9;
  const pp = Math.round((prot * 4 / total) * 100);
  const cp = Math.round((carbs * 4 / total) * 100);
  const fp = 100 - pp - cp;
  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ display: "flex", gap: 3, marginBottom: 6 }}>
        {[[pp, MACRO_COLORS.prot], [cp, MACRO_COLORS.carbs], [fp, MACRO_COLORS.fat]].map(([p, col], i) => (
          <div key={i} style={{ flex: p, background: col, height: 6, borderRadius: 3 }} />
        ))}
      </div>
      <div style={{ display: "flex", gap: 12, fontSize: 13, color: T.ash, flexWrap: "wrap" }}>
        <span><b style={{ color: T.bone }}>{prot}</b> g prot</span>
        <span><b style={{ color: T.bone }}>{carbs}</b> g carbs</span>
        <span><b style={{ color: T.bone }}>{fat}</b> g grasa</span>
        <span style={{ marginLeft: "auto" }}><b style={{ color: T.bone }}>{kcal}</b> kcal</span>
      </div>
    </div>
  );
};

export const DayTotal = ({ meals, isTraining }) => {
  const t = meals.reduce((a, m) => ({ prot: a.prot + m.macros.prot, carbs: a.carbs + m.macros.carbs, fat: a.fat + m.macros.fat, kcal: a.kcal + m.macros.kcal }), { prot: 0, carbs: 0, fat: 0, kcal: 0 });
  const whey = isTraining ? 27 : 0;
  return (
    <Section title={`Total del dia${isTraining ? ", con whey" : ""}`}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
        {[["proteina", t.prot + whey, "g", MACRO_COLORS.prot], ["carbs", t.carbs, "g", MACRO_COLORS.carbs], ["grasa", t.fat, "g", MACRO_COLORS.fat], ["kcal", t.kcal, "", T.bone]].map(([l, v, u, col]) => (
          <div key={l}>
            <div style={{ ...NUM, fontSize: 28, lineHeight: 1, color: col }}>{v}<span style={unit}>{u}</span></div>
            <div style={{ fontSize: 13, color: T.ash, marginTop: 4 }}>{l}</div>
          </div>
        ))}
      </div>
    </Section>
  );
};

// ═══════════════════════════════════════════════════════════════
// BODY — everything below reads body_measurements (/api/measurements), oldest first.
// Nothing here is hard-coded: the Samsung Health parser writes a row, the tab shows it
// on the next load.
// ═══════════════════════════════════════════════════════════════

// "2026-08-27" -> "27/8", the compact label under each point of the chart.
const sparkLabel = (iso) => { const [, m, d] = iso.split("-"); return `${Number(d)}/${Number(m)}`; };
const fmtDay = (iso) => { const [, m, d] = iso.split("-"); return `${d}/${m}`; };
const round1 = (n) => Math.round(n * 10) / 10;
const signed = (n, digits = 1) => (n > 0 ? "+" : n < 0 ? "−" : "") + Math.abs(n).toFixed(digits);

// Weight line. `series` is [{ date, w }]; the scale is the data's own range padded by
// 1 kg, so it stays readable however much weight has moved.
export const WeightSpark = ({ series }) => {
  const data = series;
  if (data.length < 2) return <div style={{ fontSize: 14, color: T.ash, padding: "18px 0" }}>Con dos mediciones aparece la curva.</div>;
  const ws = data.map((d) => d.w);
  const min = Math.floor(Math.min(...ws) - 1);
  const max = Math.ceil(Math.max(...ws) + 1);
  const W = 340, H = 110, PAD = 8;
  const pts = data.map((d, i) => ({
    x: PAD + (i / (data.length - 1)) * (W - PAD * 2),
    y: PAD + (1 - (d.w - min) / (max - min)) * (H - PAD * 2),
  }));
  const path = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const area = path + ` L${pts[pts.length - 1].x},${H} L${pts[0].x},${H} Z`;
  const every = Math.ceil(data.length / 6);              // at most ~6 date labels
  return (
    <svg viewBox={`0 0 ${W} ${H + 20}`} style={{ width: "100%", display: "block" }} role="img" aria-label="Peso en el tiempo">
      <defs>
        <linearGradient id="wfade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={T.bone} stopOpacity="0.14" />
          <stop offset="100%" stopColor={T.bone} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#wfade)" />
      <path d={path} fill="none" stroke={T.bone} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {pts.map((p, i) => {
        const last = i === pts.length - 1;
        return (
          <g key={i}>
            {last && <circle cx={p.x} cy={p.y} r="7" fill={T.legs} opacity=".25" />}
            <circle cx={p.x} cy={p.y} r={last ? 4.5 : 2.5} fill={last ? T.legs : T.bg} stroke={last ? T.legs : T.bone} strokeWidth="1.5" />
            {(i % every === 0 || last) && (
              <text x={p.x} y={H + 16} textAnchor={i === 0 ? "start" : last ? "end" : "middle"} fontSize="11" fill={T.ash} fontFamily="Archivo, sans-serif">{data[i].date}</text>
            )}
          </g>
        );
      })}
    </svg>
  );
};

// The metric grid, built from the last two measurements. A metric the screenshot did not
// carry is simply left out, so partial rows are fine. `good` decides the color of the
// delta: green when the number moved the way the goal wants.
const CARDS = [
  { key: "body_fat_pct", label: "Grasa", unit: "%", digits: 1, better: -1, range: "objetivo 15 a 17 %" },
  { key: "skeletal_muscle_kg", label: "Musculo", unit: "kg", digits: 1, better: 1, range: "masa muscular esqueletica" },
  { key: "bmi", label: "IMC", unit: "", digits: 1, better: 0, range: "normal 18,5 a 25" },
  { key: "bmr_kcal", label: "Metabolismo basal", unit: "kcal", digits: 0, better: 1, range: "en reposo" },
  { key: "body_water_kg", label: "Agua", unit: "kg", digits: 1, better: 1, range: "hidratacion" },
];

const metricCards = (now, before) =>
  CARDS.filter((c) => now?.[c.key] != null).map((c) => {
    const delta = before?.[c.key] != null ? now[c.key] - before[c.key] : null;
    return {
      ...c,
      value: c.digits === 0 ? Number(now[c.key]).toLocaleString("es-ES") : Number(now[c.key]).toFixed(c.digits),
      delta: delta == null ? null : signed(delta, c.digits),
      good: delta == null || c.better === 0 || delta === 0 ? null : (delta > 0) === (c.better > 0),
    };
  });

const deltaColor = (good) => (good === true ? T.core : good === false ? T.push : T.ash);

// The program's week, in plate colors (same mapping as the training tab).
const WEEK_PLAN = [
  ["L", "Empuje", T.push], ["M", "Halar", T.pull], ["X", "Pierna", T.legs], ["J", "Cardio", T.cardio],
  ["V", "Rotacion", T.bone], ["S", "Balance", T.recovery], ["D", "Descanso", T.faint],
];

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
  const gold = (s) => <b style={{ color: T.bone }}>{s}</b>;

  return (
    <div style={{ padding: "20px 16px 32px" }}>
      {error && <div role="alert" style={{ marginBottom: 14, padding: "10px 14px", borderRadius: 12, background: T.danger + "1A", color: T.danger, fontSize: 14 }}>No se pudieron cargar las mediciones: {error}</div>}

      {!measurements.length ? (
        <Card style={{ padding: 24 }}>
          <div style={{ ...NUM, fontSize: 26 }}>Todavia no hay mediciones</div>
          <p style={{ fontSize: 15, color: T.ash, lineHeight: 1.55, marginTop: 8 }}>Manda al coach una captura de Samsung Health y tu peso, grasa y musculo aparecen aqui.</p>
        </Card>
      ) : (
        <>
          {/* weight */}
          <div>
            <div style={{ fontSize: 14, color: T.ash }}>Peso, {fmtDay(now.measured_on)}</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap", marginTop: 2 }}>
              {now.weight_kg != null && <div style={{ ...NUM, fontSize: 64, lineHeight: 1 }}>{Number(now.weight_kg).toFixed(1)}<span style={{ ...unit, fontSize: 18 }}> kg</span></div>}
              {swing != null && <div style={{ fontSize: 15, color: T.ash }}><b style={{ color: T.bone }}>{signed(swing)} kg</b> desde el {fmtDay(first.measured_on)}</div>}
            </div>
            <div style={{ marginTop: 14 }}><WeightSpark series={series} /></div>
          </div>

          {/* metrics */}
          <Section title={`Ultima medicion${before ? `, comparada con el ${fmtDay(before.measured_on)}` : ""}`}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {cards.map((m) => (
                <Card key={m.key} style={{ padding: 14 }}>
                  <div style={{ fontSize: 13, color: T.ash }}>{m.label}</div>
                  <div style={{ ...NUM, fontSize: 32, lineHeight: 1.05, marginTop: 4 }}>{m.value}<span style={unit}> {m.unit}</span></div>
                  <div style={{ fontSize: 13, marginTop: 4, color: deltaColor(m.good) }}>{m.delta ?? "sin comparar"}</div>
                  <div style={{ fontSize: 12, color: T.faint, marginTop: 2 }}>{m.range}</div>
                </Card>
              ))}
            </div>
          </Section>

          {/* reading — derived from the last two rows, never written by hand */}
          {before && (muscleDelta != null || fatPctDelta != null) && (
            <p style={{ marginTop: 18, fontSize: 15, lineHeight: 1.6, color: T.ash }}>
              {muscleDelta != null && fatPctDelta != null && muscleDelta > 0 && fatPctDelta < 0
                ? <>Recomposicion confirmada: {gold(`${signed(muscleDelta)} kg`)} de musculo y {gold(`${signed(fatPctDelta)} pp`)} de grasa desde el {fmtDay(before.measured_on)}. Mantener sueno y proteina.</>
                : <>Desde el {fmtDay(before.measured_on)}: {muscleDelta != null && <>musculo {gold(`${signed(muscleDelta)} kg`)}</>}{muscleDelta != null && fatPctDelta != null && ", "}{fatPctDelta != null && <>grasa {gold(`${signed(fatPctDelta)} pp`)}</>}. Revisa adherencia y proteina antes de tocar el plan.</>}
              {now.note && <span style={{ display: "block", marginTop: 6, fontSize: 13 }}>Nota: {now.note}</span>}
            </p>
          )}
        </>
      )}

      {/* goals */}
      <Section title="Objetivos a 12 semanas">
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {goals.map((g, i) => {
            const span = g.target - g.from;
            const pct = span === 0 ? 100 : Math.min(100, Math.max(0, Math.round(((g.now - g.from) / span) * 100)));
            return (
              <div key={i}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, marginBottom: 6 }}>
                  <span style={{ fontSize: 15 }}>{g.label}</span>
                  <span style={{ fontSize: 13, color: T.ash, whiteSpace: "nowrap" }}>
                    <span style={{ ...NUM, fontSize: 20, color: T.bone }}>{round1(g.now)}</span>{g.unit} de {g.target}{g.unit}
                  </span>
                </div>
                <div style={{ background: T.surface, borderRadius: 5, height: 10, overflow: "hidden" }} role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={g.label}>
                  <div style={{ width: `${pct}%`, height: "100%", background: pct >= 100 ? T.core : T.bone, borderRadius: 5, transition: "width .4s ease" }} />
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      {/* week */}
      <Section title="La semana del programa" aside="core opcional cualquier dia">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6 }}>
          {WEEK_PLAN.map(([d, name, col]) => (
            <div key={d} style={{ textAlign: "center" }}>
              <div style={{ ...NUM, fontSize: 18, color: T.ash }}>{d}</div>
              <div title={name} style={{ height: 34, borderRadius: 10, marginTop: 4, background: col === T.faint ? T.surface : col, border: col === T.faint ? `1.5px dashed ${T.line}` : "none" }} />
              <div style={{ fontSize: 11, color: T.ash, marginTop: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</div>
            </div>
          ))}
        </div>
      </Section>

      <p style={{ marginTop: 28, fontSize: 13, color: T.faint, lineHeight: 1.6 }}>
        Edad {PROFILE.edad}, {PROFILE.altura} cm, {MACROS.prot} g de proteina y unas {MACROS.kcal.toLocaleString("es-ES")} kcal al dia.
        {now && <> Mediciones de Samsung Health, la ultima del {fmtDay(now.measured_on)}.</>}
      </p>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// FOOD
// ═══════════════════════════════════════════════════════════════
const DAY_NAMES = ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado", "Domingo"];
const TIPO_NAME = { fuerza: "Fuerza", lesmills: "Cardio", recovery: "Recuperacion", descanso: "Descanso" };
// Same plate colors as the training days (Lun empuje, Mar halar, Mie pierna, Vie rotacion).
const dayColor = (i, tipo) => tipo === "fuerza" ? [T.push, T.pull, T.legs, T.bone, T.bone][i] ?? T.bone
  : tipo === "lesmills" ? T.cardio : tipo === "recovery" ? T.recovery : T.faint;
const SLOT_COLOR = { Desayuno: T.legs, Almuerzo: T.push, Cena: T.recovery };

export const NutritionTab = () => {
  const [activeDay, setActiveDay] = useState(0);
  const [showSups, setShowSups] = useState(false);
  const [expandedMeal, setExpandedMeal] = useState(null);
  const day = WEEK[activeDay];
  const isTraining = day.tipo === "fuerza" || day.tipo === "lesmills";
  const accent = dayColor(activeDay, day.tipo);

  return (
    <div>
      <div className="scrollx" style={{ display: "flex", gap: 8, overflowX: "auto", padding: "8px 16px 4px" }}>
        {WEEK.map((d, i) => {
          const on = activeDay === i;
          const col = dayColor(i, d.tipo);
          return (
            <button key={i} type="button" aria-pressed={on} className="press" onClick={() => { setActiveDay(i); setExpandedMeal(null); }} style={{
              flexShrink: 0, minWidth: 56, minHeight: 52, padding: "6px 12px", borderRadius: 16, border: "none",
              background: on ? (col === T.faint ? T.raised : col) : T.surface, color: on && col !== T.faint ? T.bg : T.bone,
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 1,
            }}>
              <span style={{ fontSize: 15, fontWeight: 700 }}>{d.day}</span>
              <span style={{ fontSize: 11, fontWeight: 500, opacity: on ? 0.75 : 1, color: on && col !== T.faint ? T.bg : T.ash }}>{TIPO_NAME[d.tipo]}</span>
            </button>
          );
        })}
      </div>

      <div key={activeDay} className="fade" style={{ padding: "20px 16px 32px" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: T.ash }}>
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: accent }} />
              {TIPO_NAME[day.tipo]}{isTraining ? ", entreno en la manana" : ""}
            </div>
            <h1 style={{ ...NUM, fontSize: 40, lineHeight: 1, marginTop: 6 }}>{DAY_NAMES[activeDay]}</h1>
          </div>
          <button type="button" aria-expanded={showSups} onClick={() => setShowSups(!showSups)} className="press" style={{
            minHeight: 40, padding: "0 14px", borderRadius: 12, border: `1.5px solid ${showSups ? T.bone : T.line}`, background: "none",
            fontSize: 14, fontWeight: 600, color: T.bone, flexShrink: 0,
          }}>Suplementos</button>
        </div>
        <div style={{ fontSize: 14, color: T.ash, marginTop: 8 }}>Meta diaria: {MACROS.kcal.toLocaleString("es-ES")} kcal y {MACROS.prot} g de proteina</div>

        {showSups && (
          <Card className="open" style={{ marginTop: 16 }}>
            {SUPS.map((s, i) => (
              <div key={i} style={{ marginTop: i ? 14 : 0 }}>
                <div style={{ fontSize: 15, fontWeight: 700 }}>{s.time}</div>
                <ul style={{ listStyle: "none", marginTop: 4 }}>
                  {s.items.map((item, j) => <li key={j} style={{ fontSize: 15, lineHeight: 1.6 }}>{item}</li>)}
                </ul>
                <div style={{ fontSize: 13, color: T.ash, marginTop: 2, lineHeight: 1.45 }}>{s.note}</div>
              </div>
            ))}
            {!isTraining && <div style={{ marginTop: 14, fontSize: 14, color: T.legs, lineHeight: 1.45 }}>Dia sin entreno: omite L-Arginina y whey. La creatina es opcional.</div>}
          </Card>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 20 }}>
          {day.meals.map((meal, i) => {
            const open = expandedMeal === i;
            const sc = SLOT_COLOR[meal.slot] ?? T.ash;
            return (
              <Card key={i} accent={sc} style={{ padding: 0, background: open ? T.raised : T.surface, transition: "background .2s" }}>
                <button type="button" aria-expanded={open} onClick={() => setExpandedMeal(open ? null : i)} style={{ width: "100%", textAlign: "left", background: "none", border: "none", padding: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 40, height: 40, flexShrink: 0, background: T.bg, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>{meal.icon}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, color: T.ash }}>{meal.slot}, {meal.time}</div>
                      <div style={{ fontSize: 16, fontWeight: 650, lineHeight: 1.25, marginTop: 2 }}>{meal.name}</div>
                    </div>
                    <span style={{ color: T.ash, fontSize: 20, transform: open ? "rotate(45deg)" : "none", transition: "transform .2s" }}>+</span>
                  </div>
                  <MacroBar {...meal.macros} />
                </button>
                {open && (
                  <div className="open" style={{ padding: "0 16px 16px" }}>
                    <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 6, borderTop: `1px solid ${T.line}`, paddingTop: 12 }}>
                      {meal.items.map((item, j) => (
                        <li key={j} style={{ display: "flex", gap: 10, fontSize: 15, lineHeight: 1.4 }}>
                          <span style={{ width: 6, height: 6, borderRadius: "50%", background: sc, marginTop: 8, flexShrink: 0 }} />{item}
                        </li>
                      ))}
                    </ul>
                    <p style={{ fontSize: 14, color: T.ash, marginTop: 12, lineHeight: 1.5 }}>{meal.note}</p>
                    {meal.slot === "Desayuno" && isTraining && (
                      <p style={{ fontSize: 14, color: T.legs, marginTop: 8, lineHeight: 1.5 }}>L-Arginina y creatina 30 min antes de entrenar; el whey va en este desayuno.</p>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>

        <DayTotal meals={day.meals} isTraining={isTraining} />
      </div>
    </div>
  );
};
