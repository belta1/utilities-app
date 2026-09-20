#!/usr/bin/env node
// Today's session from the plan, with recent history per exercise and a load target
// derived from it. Deterministic: the coach reads this, it does not compute by hand.
//
//   hoy                       today
//   hoy 2026-09-22            another date
//   hoy --day martes          force a plan day (lunes|martes|miercoles|jueves|viernes|sabado|core|domingo)
//   hoy --guardar             also write the targets to the DB (shown on the dashboard's cards)
//   hoy --json                machine-readable
//
// How a target is chosen (reps exercises), in order:
//   1. Stall: best e1RM has not improved (≥1 %) over the last 3 sessions → deload −10 %,
//      then rebuild, or change the rep range.
//   2. Last session outside the plan's rep range (e.g. did 12s, plan says 6–8) → load from
//      e1RM for (top of range + 2) reps, i.e. the load that leaves ~2 reps in reserve.
//   3. Every set at the top of the range: RIR ≥ 2 recorded → +1 step now; RIR not recorded
//      → +1 step if the previous session also topped out (the two-session rule);
//      RIR 0–1 → repeat (reps were forced).
//   4. Any set under the bottom of the range → −5 %.
//   5. Otherwise repeat the load and add reps.
// Steps: +2.5 kg barbell/cable/machine, +1 kg per dumbbell. Timed sets: +5 s once the
// plan's range is reached. e1RM is Epley: load × (1 + reps / 30), best set of a session.
import { loadModuleFile } from "/app/jsx.mjs";

const API = process.env.API_URL ?? "http://localhost:3000";
const args = process.argv.slice(2);
const json = args.includes("--json");
const save = args.includes("--guardar");
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
const semana = isoWeek(new Date(date + "T12:00:00")) % 2 === 0 ? "A" : "B";
const inRotation = (ex) => !/^Semana [AB]/.test(ex.note ?? "") || ex.note.startsWith(`Semana ${semana}`);

const call = async (method, p, body) => {
  const r = await fetch(API + p, { method, headers: body ? { "content-type": "application/json" } : undefined, body: body ? JSON.stringify(body) : undefined });
  if (!r.ok) throw new Error(`${method} ${p}: ${r.status} ${(await r.json().catch(() => ({}))).error ?? ""}`);
  return r.json();
};
const get = (p) => call("GET", p);
const catalog = await get("/api/exercises");
const byName = Object.fromEntries(catalog.map((e) => [e.name, e]));
const today = await get(`/api/sets?date=${date}`);

const range = (reps) => { const m = /(\d+)\s*[–-]\s*(\d+)/.exec(reps) ?? /(\d+)/.exec(reps); return m ? { lo: Number(m[1]), hi: Number(m[2] ?? m[1]) } : null; };
const timed = (ex) => /seg/i.test(ex.reps);
const step = (e) => (e.equipment === "Mancuernas" ? 1 : e.equipment === "Peso corporal" ? 0 : 2.5);
const roundTo = (x, s) => (s ? Math.round(x / s) * s : Math.round(x * 2) / 2);
const fmtSet = (s) => (s.duration_s ? `${s.duration_s}s` : `${s.load_kg}×${s.reps}${s.rir != null ? `r${s.rir}` : ""}`);
const e1rm = (s) => (s.reps ? s.load_kg * (1 + s.reps / 30) : 0);
const bestE1rm = (sess) => Math.max(...sess.sets.map(e1rm));
const perHand = (e) => (e.equipment === "Mancuernas" ? " c/u" : "");

function suggest(ex, e, sessions) {
  const r = range(ex.reps);
  const last = sessions[0], prev = sessions[1];
  if (timed(ex)) {
    const best = last ? Math.max(...last.sets.map((s) => s.duration_s ?? 0)) : null;
    if (!best) return { load: null, reps: ex.reps, why: "primera vez" };
    const next = r && best < r.hi ? r.hi : best + 5;
    return { load: null, reps: `${next} s`, why: best < (r?.hi ?? 0) ? `ultima ${best}s → llegar a ${r.hi}` : `ultima ${best}s → +5 s` };
  }
  if (!last) {
    const w = weightSuggestions[ex.name];
    return { load: null, reps: ex.reps, why: w ? `sin historial — inicio del plan: ${w.start}` : "sin historial — a criterio", start: w?.start };
  }
  const inc = step(e);
  const load = Math.max(...last.sets.map((s) => s.load_kg));
  const e1 = sessions.map(bestE1rm);
  const trend = e1.length >= 2 ? `e1RM ${e1[0].toFixed(1)} (antes ${e1[1].toFixed(1)})` : `e1RM ${e1[0].toFixed(1)}`;

  // 1. stall: three sessions without a ≥1 % gain over the best before them
  if (e1.length >= 4 && e1.slice(0, 3).every((v) => v < Math.max(...e1.slice(3)) * 1.01)) {
    const dl = roundTo(load * 0.9, inc);
    if (dl < load) return { load: dl, reps: ex.reps, why: `estancado 3 sesiones (${trend}) → descarga -10 % y reconstruir, o cambiar rango`, stall: true };
    // too light for a meaningful deload step: change the stimulus instead
    return { load, reps: `${(r?.hi ?? 12) + 3}+`, why: `estancado 3 sesiones (${trend}) con carga minima → mismo peso, subir reps a ${(r?.hi ?? 12) + 3} o cambiar variante`, stall: true };
  }
  // 2. history outside the plan's range. Above it on every set: proven room → at least one
  //    step up, or the e1RM load for (top + 1) reps if that is more. Below it on every
  //    set: the e1RM load that leaves ~2 reps in reserve at the top of the range.
  const lastReps = last.sets.map((s) => s.reps).filter(Boolean);
  if (r && lastReps.length && lastReps.every((n) => n > r.hi + 2)) {
    const target = Math.max(load + inc, roundTo(e1[0] / (1 + (r.hi + 1) / 30), inc));
    return { load: target, reps: ex.reps, why: `ultima sesion sobre el rango ${r.lo}–${r.hi} (${lastReps.join("/")} reps) → subir a ${target} kg${perHand(e)} (e1RM ${e1[0].toFixed(1)})` };
  }
  if (r && lastReps.length && lastReps.every((n) => n < r.lo - 2)) {
    const target = roundTo(e1[0] / (1 + (r.hi + 2) / 30), inc);
    return { load: target, reps: ex.reps, why: `ultima sesion bajo el rango ${r.lo}–${r.hi} (${lastReps.join("/")} reps) → carga por e1RM ${e1[0].toFixed(1)} para ${r.hi}+2` };
  }
  const top = (sess) => sess && r && sess.sets.every((s) => s.reps >= r.hi);
  const rirs = last.sets.map((s) => s.rir).filter((v) => v != null);
  const minRir = rirs.length ? Math.min(...rirs) : null;
  // 3. topped out
  if (top(last)) {
    if (minRir != null && minRir >= 2) return { load: load + inc, reps: ex.reps, why: `tope ${r.hi} con RIR ${minRir} → +${inc} kg${perHand(e)}` };
    if (minRir != null) return { load, reps: ex.reps, why: `tope ${r.hi} pero RIR ${minRir} — repetir, sube cuando quede margen` };
    if (top(prev)) return { load: load + inc, reps: ex.reps, why: `2 sesiones en el tope (${r.hi}) → +${inc} kg${perHand(e)}` };
    return { load, reps: ex.reps, why: `tope alcanzado 1 vez — repetir; si se repite (o RIR ≥ 2), sube` };
  }
  // 4. under the range
  if (r && last.sets.some((s) => s.reps < r.lo)) {
    return { load: roundTo(load * 0.95, inc), reps: ex.reps, why: `series bajo ${r.lo} reps → -5 %` };
  }
  // 5. in range
  return { load, reps: ex.reps, why: `dentro del rango — repetir y ganar reps (${trend})` };
}

const rows = [];
for (const ex of [...(plan.exercises ?? []), ...(plan.core ?? [])].filter(inRotation)) {
  const e = byName[ex.name];
  if (!e) { rows.push({ name: ex.name, plan: `${ex.sets}×${ex.reps}`, note: "no esta en el catalogo" }); continue; }
  const sessions = await get(`/api/exercises/${e.id}/sessions?before=${date}&limit=6`);
  const done = today.filter((s) => s.exercise_id === e.id);
  const s = ex.sets === "—" ? null : suggest(ex, e, sessions);
  rows.push({
    id: e.id, name: ex.name, core: (plan.core ?? []).includes(ex), plan: ex.sets === "—" ? "—" : `${ex.sets}×${ex.reps} · ${ex.rest}`,
    history: sessions.slice(0, 3).map((x) => `${x.performed_on}: ${x.sets.map(fmtSet).join(" ")}`),
    e1rm: sessions.slice(0, 4).map((x) => Number(bestE1rm(x).toFixed(1))),
    done: done.map(fmtSet), suggestion: s,
  });
}

let saved = 0;
if (save) {
  for (const r of rows) {
    if (!r.suggestion) continue;
    await call("PUT", `/api/exercises/${r.id}/target`, { load_kg: r.suggestion.load, reps: r.suggestion.reps, reason: r.suggestion.why, set_by: "hoy", set_on: date });
    saved++;
  }
}

const out = { date, weekday, plan: { day: plan.day, label: plan.label, type: plan.type, focus: plan.focus, tip: plan.tip ?? null, semana: plan.day === "Viernes" ? semana : null }, setsToday: today.length, exercises: rows, targetsSaved: saved };
if (json) { console.log(JSON.stringify(out, null, 2)); process.exit(0); }

console.log(`${date} (${weekday}) — ${plan.day}: ${plan.label}${out.plan.semana ? ` · Semana ${out.plan.semana}` : ""}`);
console.log(`${plan.focus}${plan.tip ? `\n${plan.tip}` : ""}`);
if (plan.type === "rest") { console.log("Descanso. Nada que registrar."); process.exit(0); }
console.log(`Series registradas hoy: ${today.length}${save ? ` · objetivos guardados: ${saved}` : ""}\n`);
for (const r of rows) {
  console.log(`${r.core ? "[core] " : ""}${r.name}  (${r.plan})${r.id ? `  id=${r.id}` : ""}`);
  if (r.note) console.log(`   ! ${r.note}`);
  for (const h of r.history ?? []) console.log(`   ${h}`);
  if (r.e1rm?.length > 1) console.log(`   e1RM: ${r.e1rm.join(" ← ")}`);
  if (r.done.length) console.log(`   hoy:    ${r.done.join(" ")}`);
  if (r.suggestion) console.log(`   → ${r.suggestion.load != null ? `${r.suggestion.load} kg × ` : ""}${r.suggestion.reps}   (${r.suggestion.why})`);
}
