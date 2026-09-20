#!/usr/bin/env node
// Today's session from the plan, with what was lifted last time and a load suggestion
// per exercise. Deterministic: the coach reads this, it does not compute it by hand.
//
//   hoy                       today
//   hoy 2026-09-22            another date
//   hoy --day martes          force a plan day (lunes|martes|miercoles|jueves|viernes|sabado|core|domingo)
//   hoy --json                machine-readable
//
// Progression rule (from the plan): when every set of the last TWO sessions reached the
// top of the rep range, add load (+2.5 kg barbell/machine/cable, +1 kg per dumbbell);
// if any set fell under the bottom of the range, keep or reduce ~5%. Otherwise repeat.
import { loadModuleFile } from "/app/jsx.mjs";

const API = process.env.API_URL ?? "http://localhost:3000";
const args = process.argv.slice(2);
const json = args.includes("--json");
const dayArg = args.includes("--day") ? args[args.indexOf("--day") + 1] : null;
const dateArg = args.find((a) => /^\d{4}-\d{2}-\d{2}$/.test(a));

const pad = (n) => String(n).padStart(2, "0");
const localDate = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const date = dateArg ?? localDate();
const dow = new Date(date + "T12:00:00").getDay();               // 0 = Sunday
const fold = (s) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

const { days, weightSuggestions } = await loadModuleFile(`${process.env.PAGES_DIR ?? "/app/pages"}/_lib/recomp/data.jsx`);
const byKey = Object.fromEntries(days.map((d) => [fold(d.day).replace("+", ""), d]));
const weekday = ["domingo", "lunes", "martes", "miercoles", "jueves", "viernes", "sabado"][dow];
const plan = byKey[fold(dayArg ?? weekday)] ?? byKey[weekday];
if (!plan) { console.error(`no plan day for "${dayArg}"; use lunes|martes|miercoles|jueves|viernes|sabado|core|domingo`); process.exit(2); }

// Friday alternates: even ISO week = Semana A (empuje), odd = Semana B (halar).
const isoWeek = (d) => { const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())); const day = t.getUTCDay() || 7; t.setUTCDate(t.getUTCDate() + 4 - day); const y0 = new Date(Date.UTC(t.getUTCFullYear(), 0, 1)); return Math.ceil(((t - y0) / 864e5 + 1) / 7); };
const week = isoWeek(new Date(date + "T12:00:00"));
const semana = week % 2 === 0 ? "A" : "B";
const inRotation = (ex) => !/^Semana [AB]/.test(ex.note ?? "") || ex.note.startsWith(`Semana ${semana}`);

const get = async (p) => { const r = await fetch(API + p); if (!r.ok) throw new Error(`${p}: ${r.status}`); return r.json(); };
const catalog = await get("/api/exercises");
const byName = Object.fromEntries(catalog.map((e) => [e.name, e]));
const today = await get(`/api/sets?date=${date}`);

const range = (reps) => { const m = /(\d+)\s*[–-]\s*(\d+)/.exec(reps) ?? /(\d+)/.exec(reps); return m ? { lo: Number(m[1]), hi: Number(m[2] ?? m[1]) } : null; };
const timed = (ex) => /seg/i.test(ex.reps);
const step = (e) => (e.equipment === "Mancuernas" ? 1 : e.equipment === "Peso corporal" ? 0 : 2.5);
const fmtSet = (s) => (s.duration_s ? `${s.duration_s}s` : `${s.load_kg}×${s.reps}`);

async function history(e) {
  const last = await get(`/api/exercises/${e.id}/last?before=${date}`);
  const prev = last ? await get(`/api/exercises/${e.id}/last?before=${last.performed_on}`) : null;
  return { last, prev };
}

function suggest(ex, e, { last, prev }) {
  const r = range(ex.reps);
  if (timed(ex)) {
    const best = last ? Math.max(...last.sets.map((s) => s.duration_s ?? 0)) : null;
    if (!best) return { load: 0, target: ex.reps, why: "primera vez" };
    const next = r && best < r.hi ? r.hi : best + 5;
    return { load: 0, target: `${next} s`, why: best < (r?.hi ?? 0) ? `ultima ${best}s → llegar a ${r.hi}` : `ultima ${best}s → +5 s` };
  }
  if (!last) {
    const w = weightSuggestions[ex.name];
    return { load: null, target: w ? w.start : "a criterio", why: w ? "sin historial — inicio del plan" : "sin historial" };
  }
  const load = Math.max(...last.sets.map((s) => s.load_kg));
  const top = (sess) => sess && r && sess.sets.every((s) => s.reps >= r.hi);
  const under = r && last.sets.some((s) => s.reps < r.lo);
  const inc = step(e);
  if (top(last) && top(prev)) return { load: load + inc, target: `${load + inc} kg × ${ex.reps}`, why: `2 sesiones en el tope (${r.hi}) → +${inc} kg${e.equipment === "Mancuernas" ? " c/u" : ""}` };
  if (top(last)) return { load, target: `${load} kg × ${ex.reps}`, why: `tope alcanzado 1 vez — repetir; si se repite, sube` };
  if (under) return { load: Math.round(load * 0.95 * 2) / 2, target: `${Math.round(load * 0.95 * 2) / 2} kg × ${ex.reps}`, why: `hubo series bajo ${r.lo} reps → -5 %` };
  return { load, target: `${load} kg × ${ex.reps}`, why: "dentro del rango — repetir y ganar reps" };
}

const rows = [];
for (const ex of [...(plan.exercises ?? []), ...(plan.core ?? [])].filter(inRotation)) {
  const e = byName[ex.name];
  if (!e) { rows.push({ name: ex.name, plan: `${ex.sets}×${ex.reps}`, note: "no esta en el catalogo" }); continue; }
  const h = await history(e);
  const done = today.filter((s) => s.exercise_id === e.id);
  rows.push({
    name: ex.name, core: (plan.core ?? []).includes(ex), plan: ex.sets === "—" ? "—" : `${ex.sets}×${ex.reps} · ${ex.rest}`,
    last: h.last ? `${h.last.performed_on}: ${h.last.sets.map(fmtSet).join(" ")}` : null,
    prev: h.prev ? `${h.prev.performed_on}: ${h.prev.sets.map(fmtSet).join(" ")}` : null,
    done: done.map(fmtSet), suggestion: ex.sets === "—" ? null : suggest(ex, e, h), id: e.id,
  });
}

const out = { date, weekday, plan: { day: plan.day, label: plan.label, type: plan.type, focus: plan.focus, tip: plan.tip ?? null, semana: plan.day === "Viernes" ? semana : null }, setsToday: today.length, exercises: rows };
if (json) { console.log(JSON.stringify(out, null, 2)); process.exit(0); }

console.log(`${date} (${weekday}) — ${plan.day}: ${plan.label}${out.plan.semana ? ` · Semana ${out.plan.semana}` : ""}`);
console.log(`${plan.focus}${plan.tip ? `\n${plan.tip}` : ""}`);
if (plan.type === "rest") { console.log("Descanso. Nada que registrar."); process.exit(0); }
console.log(`Series registradas hoy: ${today.length}\n`);
for (const r of rows) {
  console.log(`${r.core ? "[core] " : ""}${r.name}  (${r.plan})${r.id ? `  id=${r.id}` : ""}`);
  if (r.note) console.log(`   ! ${r.note}`);
  if (r.last) console.log(`   ultima: ${r.last}`);
  if (r.prev) console.log(`   previa: ${r.prev}`);
  if (r.done.length) console.log(`   hoy:    ${r.done.join(" ")}`);
  if (r.suggestion) console.log(`   → ${r.suggestion.target}   (${r.suggestion.why})`);
}
