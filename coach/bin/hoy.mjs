#!/usr/bin/env node
// Today's session, read from the plan in the database, with recent history per exercise
// and a rebalanced target derived from it. Deterministic: the coach reads this, it does
// not compute by hand.
//
//   hoy                       today
//   hoy 2026-09-22            another date
//   hoy --day martes          force a plan day (lunes|martes|miercoles|jueves|viernes|sabado|core|domingo)
//   hoy --guardar             write the rebalance back: targets always, and the plan's
//                             own sets / reps / seconds when a rule changed them; also the
//                             day's recommendation (see below)
//   hoy --limpiar             drop today's saved recommendation (dashboard reverts to the plan day)
//   hoy --json                machine-readable
//
// Weekly coverage / substitution: before the per-exercise rebalance, hoy tallies which
// movement patterns (empuje / halar / pierna) and cardio the week owed by today vs what was
// actually trained. If today's calendar day is light (recovery / rest / cardio / optional
// core) and the week is short, it substitutes the plan day that best fills the gap — strength
// deficits beat cardio on a tie — and rebalances THAT day's exercises instead. The weekly
// plan (plan_days, keyed by weekday) is never edited; the substitution is a date-scoped row
// in daily_recommendation that the dashboard renders as "HOY SUGERIDO". --guardar writes it.
//
// The rebalance answers two questions per exercise: how hard (load) and how much
// (reps or seconds, and how many sets). Regularity comes first, because a load that was
// right three weeks ago is not right after three weeks off:
//   R1. Never done          -> the plan's starting load (exercises.load_start).
//   R2. 28+ days since      -> reentry: -15 % and rebuild; one set less if the plan has 4+.
//   R3. 15–28 days since    -> repeat the last load, no progression.
//   R4. Done, but 0 sessions in the last 28 days with history before that -> as R2.
// Then the progression ladder, on regular training (a session within two weeks):
//   1. Stall: best e1RM has not improved (>=1 %) over the last 3 sessions. Stuck at the
//      top of the range with no margin left (RIR 0-1, or none recorded) -> the range is
//      the ceiling, not the load: same weight, rep range raised in the plan. Stuck below
//      the top -> deload -10 % and rebuild.
//   2. Last session outside the plan's rep range -> load from e1RM for (top of range + 2)
//      reps above it, or a step up when every set was above it.
//   3. Every set at the top of the range: RIR >= 2 -> +1 step now; RIR not recorded -> +1
//      step if the previous session also topped out (the two-session rule); RIR 0–1 ->
//      repeat (reps were forced).
//   4. Any set under the bottom of the range -> -5 %.
//   5. Otherwise repeat the load and add reps.
// Steps: +2.5 kg barbell/cable/machine, +1 kg per dumbbell. Timed sets climb 5 s at a
// time and, once the top of the range is held, the range itself moves up 5 s in the plan.
// e1RM is Epley: load x (1 + reps/30), best set of a session; it is only trusted up to
// 12 reps, so on higher-rep ranges the reps are the target and the load stays put.
// Every rule is a fixed point: running --guardar twice changes nothing the second time.

const API = process.env.API_URL ?? "http://localhost:3000";
const args = process.argv.slice(2);
const json = args.includes("--json");
const save = args.includes("--guardar");
const clear = args.includes("--limpiar");
const dayArg = args.includes("--day") ? args[args.indexOf("--day") + 1] : null;
const dateArg = args.find((a) => /^\d{4}-\d{2}-\d{2}$/.test(a));

const pad = (n) => String(n).padStart(2, "0");
const localDate = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const date = dateArg ?? localDate();
const dow = new Date(date + "T12:00:00").getDay();               // 0 = Sunday
const fold = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const daysBetween = (a, b) => Math.round((new Date(a + "T12:00:00") - new Date(b + "T12:00:00")) / 864e5);

const call = async (method, p, body) => {
  const r = await fetch(API + p, { method, headers: body ? { "content-type": "application/json" } : undefined, body: body ? JSON.stringify(body) : undefined });
  if (!r.ok) throw new Error(`${method} ${p}: ${r.status} ${(await r.json().catch(() => ({}))).error ?? ""}`);
  return r.json();
};
const get = (p) => call("GET", p);

// --limpiar: remove today's recommendation and stop, so the dashboard falls back to the plan.
if (clear) {
  try { await call("DELETE", `/api/recommendation/${date}`); console.log(`${date}: recomendacion eliminada — el dashboard vuelve al dia del plan.`); }
  catch { console.log(`${date}: no habia recomendacion que eliminar.`); }
  process.exit(0);
}

const weekday = ["domingo", "lunes", "martes", "miercoles", "jueves", "viernes", "sabado"][dow];
const key = fold(dayArg ?? weekday).replace(/\+/g, "").trim();
let calendarPlan;
try {
  calendarPlan = await get(`/api/plan/${encodeURIComponent(key)}`);
} catch (err) {
  const all = await get("/api/plan").catch(() => []);
  console.error(`no plan day "${key}"; use ${all.map((d) => d.key).join("|") || "lunes|martes|miercoles|jueves|viernes|sabado|core|domingo"}`);
  process.exit(2);
}
let plan = calendarPlan;                              // may become the substituted day below

// Friday alternates: even ISO week = Semana A (empuje), odd = Semana B (halar).
const isoWeek = (d) => { const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())); const day = t.getUTCDay() || 7; t.setUTCDate(t.getUTCDate() + 4 - day); const y0 = new Date(Date.UTC(t.getUTCFullYear(), 0, 1)); return Math.ceil(((t - y0) / 864e5 + 1) / 7); };
const semana = isoWeek(new Date(date + "T12:00:00")) % 2 === 0 ? "A" : "B";
const inRotation = (ex) => !/^Semana [AB]/.test(ex.note ?? "") || ex.note.startsWith(`Semana ${semana}`);

const today = await get(`/api/sets?date=${date}`);

// ── weekly coverage: what the week still owes, so a light day can be repurposed ────
// Same pattern map as semana.mjs. Expected = the non-optional plan days due Mon→today,
// each classified by its dominant lift (a cardio day counts as "cardio"); actual = the
// sessions actually logged this week, classified the same way. The gap drives the swap.
const PATTERN = { Pecho: "empuje", Hombros: "empuje", Triceps: "empuje", Espalda: "halar", Biceps: "halar", Trapecio: "halar", Piernas: "pierna", Gluteos: "pierna", Isquios: "pierna", Gemelos: "pierna", "Cadena posterior": "pierna", Core: "core" };
const patternOf = (e) => (/face pull|pajaros|remo|encogimiento/i.test(e?.name ?? "") ? "halar" : PATTERN[e?.muscle_group] ?? "otros");
const dominant = (ps) => { const c = {}; for (const p of ps) if (p && p !== "core" && p !== "otros") c[p] = (c[p] ?? 0) + 1; let best = null, n = 0; for (const [p, v] of Object.entries(c)) if (v > n) { best = p; n = v; } return best; };
const WK = { domingo: 0, lunes: 1, martes: 2, miercoles: 3, jueves: 4, viernes: 5, sabado: 6 };
const CANONICAL = { empuje: "lunes", halar: "martes", pierna: "miercoles", cardio: "jueves" };
const shiftIso = (iso, n) => { const [y, m, d] = iso.split("-").map(Number); return localDate(new Date(y, m - 1, d + n)); };
const weekPos = (i) => (i + 6) % 7;                          // Monday = 0 … Sunday = 6
const todayPos = weekPos(dow);
const weekStart = shiftIso(date, -todayPos);

const allDays = await get("/api/plan").catch(() => []);
const catalog = await get("/api/exercises").catch(() => []);
const byId = Object.fromEntries(catalog.map((e) => [e.id, e]));
const weekSets = await get(`/api/sets?from=${weekStart}&to=${date}`).catch(() => []);

// dominant pattern of a plan day: strength → its main lifts (Friday honours the rotation);
// cardio day → "cardio"; recovery / core / rest → none.
const dayPattern = (d) => (d.type === "lesmills" ? "cardio" : d.type === "strength"
  ? dominant((d.exercises ?? []).filter((x) => x.section !== "core" && inRotation(x)).map(patternOf)) : null);

const expected = {}, actual = {};
for (const d of allDays) {
  if (d.is_optional || d.type === "rest") continue;
  const idx = WK[d.key];
  if (idx == null || weekPos(idx) > todayPos) continue;      // not due yet this week
  const p = dayPattern(d);
  if (p) expected[p] = (expected[p] ?? 0) + 1;
}
const byDate = {};
for (const s of weekSets) (byDate[s.performed_on] ??= []).push(s);
for (const sets of Object.values(byDate)) {
  const p = dominant(sets.map((s) => patternOf(byId[s.exercise_id] ?? {})));
  if (p) actual[p] = (actual[p] ?? 0) + 1;
}
const coverage = ["empuje", "halar", "pierna", "cardio"]
  .filter((p) => expected[p])
  .map((p) => ({ pattern: p, expected: expected[p], actual: actual[p] ?? 0, deficit: Math.max(0, expected[p] - (actual[p] ?? 0)) }));

// A calendar day is "light" when it is not a full strength day — those are the days worth
// repurposing. What is already logged today counts as covered, so we never double it up.
const light = ["recovery", "rest", "lesmills"].includes(calendarPlan.type) || (calendarPlan.type === "core" && calendarPlan.is_optional);
const doneToday = dominant(today.map((s) => patternOf(byId[s.exercise_id] ?? {})));

let recommendation = null;
if (light) {
  const strengthGap = coverage.filter((c) => c.deficit > 0 && c.pattern !== "cardio").sort((a, b) => b.deficit - a.deficit)[0];
  const cardioGap = coverage.find((c) => c.pattern === "cardio" && c.deficit > 0);
  const pick = strengthGap ?? cardioGap;                     // strength beats cardio on a tie
  const recKey = pick && CANONICAL[pick.pattern];
  const recDay = recKey && allDays.find((d) => d.key === recKey);
  if (pick && recDay && recKey !== calendarPlan.key && pick.pattern !== doneToday) {
    plan = await get(`/api/plan/${recKey}`);
    const others = coverage.filter((c) => c.deficit > 0 && c.pattern !== pick.pattern).map((c) => c.pattern);
    recommendation = {
      plan_key: recKey, source_key: calendarPlan.key, kind: "substitution",
      title: `${plan.label} (sustituto)`,
      reason: `Falto ${pick.pattern} esta semana (${pick.actual}/${pick.expected})${others.length ? ` y ${others.join(", ")}` : ""}; hoy toca ${calendarPlan.label} -> sustituyo por ${plan.label}.`,
    };
  }
}

const range = (reps) => { const m = /(\d+)\s*[–-]\s*(\d+)/.exec(reps ?? "") ?? /(\d+)/.exec(reps ?? ""); return m ? { lo: Number(m[1]), hi: Number(m[2] ?? m[1]) } : null; };
const timed = (ex) => /seg/i.test(ex.reps ?? "");
const step = (ex) => (ex.equipment === "Mancuernas" ? 1 : ex.equipment === "Peso corporal" ? 0 : 2.5);
const roundTo = (x, s) => (s ? Math.round(x / s) * s : Math.round(x * 2) / 2);
const fmtSet = (s) => (s.duration_s ? `${s.duration_s}s` : `${s.load_kg}×${s.reps}${s.rir != null ? `r${s.rir}` : ""}`);
const e1rm = (s) => (s.reps ? s.load_kg * (1 + s.reps / 30) : 0);
const bestE1rm = (sess) => Math.max(...sess.sets.map(e1rm));
const perHand = (ex) => (ex.equipment === "Mancuernas" ? " c/u" : "");

// How regularly this exercise has actually been trained, which decides whether the
// progression ladder applies at all.
function regularity(sessions) {
  if (!sessions.length) return { gap: null, last: null, inLast28: 0, avgGap: null };
  const last = sessions[0].performed_on;
  const inLast28 = sessions.filter((s) => daysBetween(date, s.performed_on) <= 28).length;
  const gaps = sessions.slice(0, 5).map((s, i, a) => (i ? daysBetween(a[i - 1].performed_on, s.performed_on) : null)).filter((n) => n != null);
  return { gap: daysBetween(date, last), last, inLast28, avgGap: gaps.length ? Math.round(gaps.reduce((a, b) => a + b, 0) / gaps.length) : null };
}

// `planSets` / `planReps` are set only when the rule wants the plan itself rewritten;
// `hoy --guardar` then PATCHes the slot so the dashboard card shows the new prescription.
function suggest(ex, sessions, reg) {
  const r = range(ex.reps);
  const last = sessions[0], prev = sessions[1];
  const sets = Number(ex.sets) || null;

  if (timed(ex)) {
    const best = last ? Math.max(...last.sets.map((s) => s.duration_s ?? 0)) : null;
    if (!best) return { load: null, reps: ex.reps, why: "primera vez — empieza en el rango del plan" };
    if (reg.gap > 28) {
      const back = Math.max(15, Math.round((best * 0.8) / 5) * 5);
      return { load: null, reps: `${back} seg`, planReps: `${back}-${back + 10} seg`, why: `${reg.gap} dias sin hacerlo → reentrada, de ${best}s a ${back}s` };
    }
    if (reg.gap > 14) return { load: null, reps: `${best} seg`, why: `${reg.gap} dias sin hacerlo → repetir ${best}s antes de subir` };
    // Climb by 5 s at a time, never jump to the top of the range; once the top is
    // reached the range itself moves up 5 s, so the plan keeps pace with him.
    const next = r && best < r.lo ? Math.min(best + 5, r.lo) : best + 5;
    return {
      load: null, reps: `${next} seg`,
      planReps: r && best >= r.hi ? `${r.lo + 5}-${r.hi + 5} seg` : undefined,
      why: r && best < r.lo ? `ultima ${best}s → subir a ${next}s, rango ${r.lo}–${r.hi}s`
        : r && best < r.hi ? `ultima ${best}s → +5 s dentro del rango ${r.lo}–${r.hi}s`
          : `ultima ${best}s → tope del rango, +5 s y el plan sube a ${r ? `${r.lo + 5}-${r.hi + 5}` : "?"} s`,
    };
  }

  // R1 — no history at all: the plan's starting load.
  if (!last) {
    return { load: null, reps: ex.reps, why: ex.load_start ? `sin historial — inicio del plan: ${ex.load_start}` : "sin historial — a criterio", start: ex.load_start };
  }

  const inc = step(ex);
  const load = Math.max(...last.sets.map((s) => s.load_kg));
  const e1 = sessions.map(bestE1rm);
  const trend = e1.length >= 2 ? `e1RM ${e1[0].toFixed(1)} (antes ${e1[1].toFixed(1)})` : `e1RM ${e1[0].toFixed(1)}`;

  // R2/R4 — a long layoff. Rebuild rather than pick up where he left off, and take a set
  // off a 4+ set prescription for the first week back.
  if (reg.gap > 28 || reg.inLast28 === 0) {
    const back = roundTo(load * 0.85, inc);
    return {
      load: Math.min(back, load), reps: ex.reps,
      planSets: sets && sets >= 4 ? String(sets - 1) : undefined,
      why: `${reg.gap} dias sin hacerlo → reentrada -15 % (${load} → ${Math.min(back, load)} kg${perHand(ex)})${sets && sets >= 4 ? `, ${sets - 1} series esta vez` : ""}`,
      regression: true,
    };
  }
  // R3 — irregular but not cold: hold the load, win the reps back first.
  if (reg.gap > 14) {
    return { load, reps: ex.reps, why: `${reg.gap} dias sin hacerlo → repetir ${load} kg${perHand(ex)} y recuperar reps` };
  }

  const top = (sess) => sess && r && sess.sets.every((s) => s.reps >= r.hi);
  const rirs = last.sets.map((s) => s.rir).filter((v) => v != null);
  const minRir = rirs.length ? Math.min(...rirs) : null;
  const lastReps = last.sets.map((s) => s.reps).filter(Boolean);
  // Every set below the bottom of the range: the range is ahead of him, which is what
  // rule 1 leaves behind when it raises one. Not a stall — don't let rule 1 see it.
  const belowRange = r && lastReps.length && lastReps.every((n) => n < r.lo);
  // Epley is only worth trusting up to ~12 reps; above that the range is the target and
  // the load stays where it is.
  const highRep = r && r.hi > 12;

  // 1. stall: three sessions without a >=1 % gain over the best before them. Which way
  //    out depends on where the reps sat. Already at the top of the range with no margin
  //    left (RIR 0–1) means the range is the ceiling, not the load — widen it, in the
  //    plan, and keep the weight. Stuck below the top is fatigue: deload and rebuild.
  if (!belowRange && e1.length >= 4 && e1.slice(0, 3).every((v) => v < Math.max(...e1.slice(3)) * 1.01)) {
    const dl = roundTo(load * 0.9, inc);
    if (top(last) && (minRir == null || minRir <= 1)) {
      const lo = r.hi + 3, hi = lo + 2;
      return { load, reps: `${lo}–${hi}`, planReps: `${lo}–${hi}`, why: `estancado 3 sesiones en el tope de ${r.lo}–${r.hi} sin margen (${trend}) → mismo peso, rango a ${lo}–${hi} reps`, stall: true };
    }
    if (dl < load) return { load: dl, reps: ex.reps, why: `estancado 3 sesiones (${trend}) → descarga -10 % y reconstruir`, stall: true };
    // too light even to deload a step: change the stimulus instead, in the plan
    const lo = (r?.hi ?? 12) + 3, hi = lo + 2;
    return { load, reps: `${lo}–${hi}`, planReps: `${lo}–${hi}`, why: `estancado 3 sesiones (${trend}) con carga minima → mismo peso, rango a ${lo}–${hi} reps`, stall: true };
  }
  // 2. history outside the plan's range
  if (r && lastReps.length && lastReps.every((n) => n > r.hi + 2)) {
    const target = Math.max(load + inc, roundTo(e1[0] / (1 + (r.hi + 1) / 30), inc));
    return { load: target, reps: ex.reps, why: `ultima sesion sobre el rango ${r.lo}–${r.hi} (${lastReps.join("/")} reps) → subir a ${target} kg${perHand(ex)} (e1RM ${e1[0].toFixed(1)})` };
  }
  if (belowRange && highRep) {
    return { load, reps: ex.reps, why: `rango ${r.lo}–${r.hi} por encima de lo hecho (${lastReps.join("/")} reps) → misma carga, subir reps hasta ${r.lo}` };
  }
  if (r && lastReps.length && lastReps.every((n) => n < r.lo - 2)) {
    const target = roundTo(e1[0] / (1 + (r.hi + 2) / 30), inc);
    return { load: target, reps: ex.reps, why: `ultima sesion bajo el rango ${r.lo}–${r.hi} (${lastReps.join("/")} reps) → carga por e1RM ${e1[0].toFixed(1)} para ${r.hi}+2` };
  }
  // 3. topped out
  if (top(last)) {
    if (minRir != null && minRir >= 2) return { load: load + inc, reps: ex.reps, why: `tope ${r.hi} con RIR ${minRir} → +${inc} kg${perHand(ex)}` };
    if (minRir != null) return { load, reps: ex.reps, why: `tope ${r.hi} pero RIR ${minRir} — repetir, sube cuando quede margen` };
    if (top(prev)) return { load: load + inc, reps: ex.reps, why: `2 sesiones en el tope (${r.hi}) → +${inc} kg${perHand(ex)}` };
    return { load, reps: ex.reps, why: `tope alcanzado 1 vez — repetir; si se repite (o RIR ≥ 2), sube` };
  }
  // 4. under the range
  if (r && last.sets.some((s) => s.reps < r.lo)) {
    return { load: roundTo(load * 0.95, inc), reps: ex.reps, why: `series bajo ${r.lo} reps → -5 %` };
  }
  // 5. in range. Training it 3+ times in four weeks earns an extra set on a short
  //    prescription — the cheapest volume there is when the load is not moving.
  if (reg.inLast28 >= 3 && sets && sets <= 3 && e1.length >= 3 && e1[0] <= e1[1]) {
    return { load, reps: ex.reps, planSets: String(sets + 1), why: `${reg.inLast28} sesiones en 4 semanas y carga estancada → misma carga, ${sets + 1} series` };
  }
  return { load, reps: ex.reps, why: `dentro del rango — repetir y ganar reps (${trend})` };
}

const slots = (plan.exercises ?? []).filter(inRotation);
const rows = [];
for (const ex of slots) {
  if (!ex.exercise_id) { rows.push({ slotId: ex.id, name: ex.name, core: ex.section === "core", plan: "—", note: ex.note, history: [], done: [], suggestion: null }); continue; }
  const sessions = await get(`/api/exercises/${ex.exercise_id}/sessions?before=${date}&limit=8`);
  const reg = regularity(sessions);
  const done = today.filter((s) => s.exercise_id === ex.exercise_id);
  const s = ex.sets === "—" ? null : suggest(ex, sessions, reg);
  rows.push({
    id: ex.exercise_id, slotId: ex.id, name: ex.name, core: ex.section === "core",
    plan: ex.sets === "—" ? "—" : `${ex.sets}×${ex.reps} · ${ex.rest}`,
    regularity: reg,
    history: sessions.slice(0, 3).map((x) => `${x.performed_on}: ${x.sets.map(fmtSet).join(" ")}`),
    e1rm: sessions.slice(0, 4).map((x) => Number(bestE1rm(x).toFixed(1))),
    done: done.map(fmtSet), suggestion: s,
  });
}

let saved = 0, replanned = 0, recSaved = false;
if (save) {
  for (const r of rows) {
    if (!r.suggestion) continue;
    await call("PUT", `/api/exercises/${r.id}/target`, { load_kg: r.suggestion.load, reps: r.suggestion.reps, reason: r.suggestion.why, set_by: "hoy", set_on: date });
    saved++;
    const patch = {};
    if (r.suggestion.planReps) patch.reps = r.suggestion.planReps;
    if (r.suggestion.planSets) patch.sets = r.suggestion.planSets;
    if (Object.keys(patch).length) { await call("PATCH", `/api/plan/exercises/${r.slotId}`, patch); replanned++; }
  }
  // Persist (or clear) the day's recommendation so the dashboard's "HOY SUGERIDO" matches.
  if (recommendation) { await call("PUT", "/api/recommendation", { recommended_on: date, ...recommendation }); recSaved = true; }
  else { await call("DELETE", `/api/recommendation/${date}`).catch(() => {}); }
}

const out = {
  date, weekday,
  calendar: { key: calendarPlan.key, day: calendarPlan.day, label: calendarPlan.label, type: calendarPlan.type },
  plan: { key: plan.key, day: plan.day, label: plan.label, type: plan.type, focus: plan.focus, tip: plan.tip ?? null, post_key: plan.post_key, semana: plan.key === "viernes" ? semana : null },
  coverage, recommendation,
  setsToday: today.length, exercises: rows, targetsSaved: saved, planUpdated: replanned, recommendationSaved: recSaved,
};
if (json) { console.log(JSON.stringify(out, null, 2)); process.exit(0); }

console.log(`${date} (${weekday}) — ${calendarPlan.day}: ${calendarPlan.label}${out.plan.semana ? ` · Semana ${out.plan.semana}` : ""}`);
console.log(`${calendarPlan.focus}${calendarPlan.tip ? `\n${calendarPlan.tip}` : ""}`);
if (coverage.length) console.log(`cobertura semana: ${coverage.map((c) => `${c.pattern} ${c.actual}/${c.expected}${c.deficit ? " ✗" : ""}`).join(" · ")}`);
if (recommendation) {
  console.log(`\n⚑ HOY SUGERIDO → ${plan.label}`);
  console.log(`   ${recommendation.reason}`);
  console.log(`   (--limpiar para volver a ${calendarPlan.label}${save ? "" : " · --guardar para fijarlo en el dashboard"})`);
}
if (plan.type === "rest") { console.log("\nDescanso. Nada que registrar."); process.exit(0); }
console.log(`\nSeries registradas hoy: ${today.length}${save ? ` · objetivos guardados: ${saved} · plan reescrito: ${replanned}${recommendation ? " · recomendacion fijada" : ""}` : ""}\n`);
for (const r of rows) {
  console.log(`${r.core ? "[core] " : ""}${r.name}  (${r.plan})${r.id ? `  id=${r.id} slot=${r.slotId}` : ""}`);
  if (!r.id) { console.log(`   ! sin ejercicio del catalogo — no se registra`); continue; }
  if (r.regularity?.gap != null) console.log(`   regularidad: ultima hace ${r.regularity.gap} d · ${r.regularity.inLast28} sesiones en 28 d${r.regularity.avgGap ? ` · cada ~${r.regularity.avgGap} d` : ""}`);
  for (const h of r.history ?? []) console.log(`   ${h}`);
  if (r.e1rm?.length > 1 && r.e1rm.some((v) => v > 0)) console.log(`   e1RM: ${r.e1rm.join(" ← ")}`);
  if (r.done.length) console.log(`   hoy:    ${r.done.join(" ")}`);
  if (r.suggestion) {
    console.log(`   → ${r.suggestion.load != null ? `${r.suggestion.load} kg × ` : ""}${r.suggestion.reps}   (${r.suggestion.why})`);
    if (r.suggestion.planSets) console.log(`   plan:   series ${r.plan.split("×")[0]} → ${r.suggestion.planSets}${save ? "" : "  (usa --guardar para escribirlo)"}`);
    if (r.suggestion.planReps) console.log(`   plan:   reps → ${r.suggestion.planReps}${save ? "" : "  (usa --guardar para escribirlo)"}`);
  }
}
