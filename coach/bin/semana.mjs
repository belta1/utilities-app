#!/usr/bin/env node
// Weekly review numbers: sessions, volume by pattern, best set per exercise vs the
// previous period, plank time, and which plan days were trained.
//
//   semana                 last 7 days ending today, compared with the 7 before
//   semana 2026-09-14      last 7 days ending that date
//   semana --days 14
//   semana --json
import { loadModuleFile } from "/app/jsx.mjs";

const API = process.env.API_URL ?? "http://localhost:3000";
const args = process.argv.slice(2);
const json = args.includes("--json");
const N = args.includes("--days") ? Number(args[args.indexOf("--days") + 1]) : 7;
const pad = (n) => String(n).padStart(2, "0");
const localDate = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const shift = (iso, n) => { const [y, m, d] = iso.split("-").map(Number); const t = new Date(y, m - 1, d + n); return localDate(t); };
const end = args.find((a) => /^\d{4}-\d{2}-\d{2}$/.test(a)) ?? localDate();
const start = shift(end, -(N - 1));
const pStart = shift(start, -N), pEnd = shift(start, -1);

const get = async (p) => { const r = await fetch(API + p); if (!r.ok) throw new Error(`${p}: ${r.status}`); return r.json(); };
const { days } = await loadModuleFile(`${process.env.PAGES_DIR ?? "/app/pages"}/_lib/recomp/data.jsx`);
const catalog = await get("/api/exercises");
const byId = Object.fromEntries(catalog.map((e) => [e.id, e]));
const cur = await get(`/api/sets?from=${start}&to=${end}`);
const prev = await get(`/api/sets?from=${pStart}&to=${pEnd}`);

const PATTERN = { Pecho: "empuje", Hombros: "empuje", Triceps: "empuje", Espalda: "halar", Biceps: "halar", Trapecio: "halar", Piernas: "pierna", Gluteos: "pierna", Isquios: "pierna", Gemelos: "pierna", "Cadena posterior": "pierna", Core: "core" };
const pattern = (e) => (/face pull|pajaros|remo|encogimiento/i.test(e.name) ? "halar" : PATTERN[e.muscle_group] ?? "otros");
const vol = (sets) => sets.reduce((s, x) => s + (x.reps ? x.load_kg * x.reps : 0), 0);

function summarize(sets) {
  const byDay = new Map();
  for (const s of sets) (byDay.get(s.performed_on) ?? byDay.set(s.performed_on, []).get(s.performed_on)).push(s);
  const byPattern = {};
  for (const s of sets) { const p = pattern(byId[s.exercise_id] ?? {}); byPattern[p] = (byPattern[p] ?? 0) + (s.reps ? s.load_kg * s.reps : 0); }
  const best = {};
  for (const s of sets) {
    const b = best[s.exercise_id];
    const key = s.duration_s ? s.duration_s : s.load_kg * (1 + s.reps / 30);   // seconds, or Epley e1RM
    if (!b || key > b.key) best[s.exercise_id] = { key, set: s };
  }
  return { sessions: byDay.size, days: [...byDay.keys()].sort(), sets: sets.length, volume: Math.round(vol(sets)), byPattern, best };
}
const C = summarize(cur), P = summarize(prev);

// Plan adherence: which strength/cardio/recovery days of the week had a session.
const weekdayOf = (iso) => ["Domingo", "Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado"][new Date(iso + "T12:00:00").getDay()];
const trained = new Set(C.days.map(weekdayOf));
const planned = days.filter((d) => d.type !== "rest" && !d.optional).map((d) => d.day);
const missed = N === 7 ? planned.filter((d) => !trained.has(d)) : [];

const fmt = (s) => (s.duration_s ? `${s.duration_s}s` : `${s.load_kg}kg×${s.reps}`);
const compare = Object.entries(C.best).map(([id, { key, set }]) => {
  const p = P.best[id];
  const e = byId[id];
  const delta = p ? key - p.key : null;                           // s for timed, kg of e1RM otherwise
  return { name: e?.name ?? id, best: fmt(set), e1rm: set.duration_s ? null : Number(key.toFixed(1)), prevBest: p ? fmt(p.set) : null, prevE1rm: p && !p.set.duration_s ? Number(p.key.toFixed(1)) : null, delta };
}).sort((a, b) => (b.delta ?? -Infinity) - (a.delta ?? -Infinity));

const out = { period: { start, end }, previous: { start: pStart, end: pEnd }, current: { ...C, best: undefined }, previousSummary: { sessions: P.sessions, sets: P.sets, volume: P.volume, byPattern: P.byPattern }, missedPlanDays: missed, bestSets: compare };
if (json) { console.log(JSON.stringify(out, null, 2)); process.exit(0); }

const pct = (a, b) => (b ? `${a >= b ? "+" : ""}${Math.round(((a - b) / b) * 100)} %` : "—");
console.log(`Semana ${start} → ${end}   (vs ${pStart} → ${pEnd})`);
console.log(`sesiones ${C.sessions} (${P.sessions})  ·  series ${C.sets} (${P.sets})  ·  volumen ${C.volume} kg (${P.volume}, ${pct(C.volume, P.volume)})`);
console.log(`dias: ${C.days.map((d) => `${weekdayOf(d).slice(0, 3)} ${d.slice(5)}`).join(", ") || "ninguno"}`);
if (N === 7) console.log(`plan sin sesion: ${missed.length ? missed.join(", ") : "ninguno — semana completa"}`);
console.log("volumen por patron:");
for (const p of ["empuje", "halar", "pierna", "core", "otros"]) if (C.byPattern[p] != null || P.byPattern[p] != null) console.log(`   ${p.padEnd(7)} ${Math.round(C.byPattern[p] ?? 0)} kg (${Math.round(P.byPattern[p] ?? 0)})`);
console.log("mejor serie por ejercicio, e1RM (vs periodo anterior):");
for (const r of compare) {
  const arrow = r.delta != null && r.delta > 0.4 ? "▲" : r.delta != null && r.delta < -0.4 ? "▼" : " ";
  const now = r.e1rm != null ? `${r.best} → e1RM ${r.e1rm}` : r.best;
  const before = r.prevBest ? `   antes ${r.prevE1rm != null ? `e1RM ${r.prevE1rm}` : r.prevBest}${r.delta != null ? ` (${r.delta > 0 ? "+" : ""}${r.delta.toFixed(1)})` : ""}` : "   (nuevo)";
  console.log(`   ${arrow} ${r.name.padEnd(40)} ${now.padStart(24)}${before}`);
}
