// Import a phone-notes training log into the workout log through the API.
//
//   node scripts/import-sesiones.mjs sesiones/sesiones.txt                 # dry run: shows what would be logged
//   node scripts/import-sesiones.mjs sesiones/sesiones.txt --apply         # POST it
//   API_URL=http://jfubuntu:3000 node scripts/import-sesiones.mjs f.txt --apply
//
// Format (WhatsApp "message to self" style):
//   [07:27, 9/1/2026]           session header, M/D/YYYY
//   peso muerto                 exercise (a load may follow on the same line: "Press pie 6.5 kg")
//   42.5 k                      load line: "<n> k" / "<n> kg"  (optional)
//   8                           one line per set: reps, or seconds ("55 sec" or bare for timed exercises)
//   8
//
// Names are matched to the catalog through ALIASES (accent- and case-insensitive),
// else by exact catalog name. Unknown names abort the run before anything is posted.
// A (date, exercise) that already has sets in the DB is skipped, so re-running is safe.
import { readFile } from "node:fs/promises";

const API = process.env.API_URL ?? "http://localhost:3000";
const [file, ...flags] = process.argv.slice(2);
const apply = flags.includes("--apply");
if (!file) { console.error("usage: node scripts/import-sesiones.mjs <file.txt> [--apply]"); process.exit(2); }

const fold = (s) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, " ").trim();

// shorthand seen in the notes → catalog name. Add to it as new shorthands appear.
const ALIASES = {
  "peso muerto": "Peso muerto convencional con barra",
  "peso mueto": "Peso muerto convencional con barra",
  "jalon": "Jalon dorsal en polea alta",
  "jalon dorsal": "Jalon dorsal en polea alta",
  "remo mancuerna": "Remo unilateral con mancuerna",
  "curl martillo": "Curl martillo con mancuernas",
  "remo banco": "Remo con mancuernas en banco inclinado",
  "remo banco inclinado": "Remo con mancuernas en banco inclinado",
  "remo inclinado": "Remo con mancuernas en banco inclinado",
  "curl polea": "Curl en polea baja",
  "pull bicep polea": "Curl en polea baja",
  "pull polea": "Curl en polea baja",
  "press banca": "Press banca con barra",
  "elev lat": "Elevaciones laterales",
  "press pie": "Press militar con mancuernas de pie",
  "ext delantera hombro": "Elevaciones frontales",
  "curl triceps": "Skull crusher con mancuernas",
  "press inclinado": "Press inclinado con mancuernas",
  "curl bicep": "Curl alterno con mancuernas",
  "plancha": "Plancha frontal",
  "plancha frontal": "Plancha frontal",
};
// exercises whose bare numbers are seconds, not reps
const TIMED = new Set(["Plancha frontal", "Plancha lateral", "Plancha con peso"]);

// ── parse ─────────────────────────────────────────────────────────
const HEADER = /^\[(\d{1,2}):(\d{2}),\s*(\d{1,2})\/(\d{1,2})\/(\d{4})\]/;
const LOAD = /^(\d+(?:[.,]\d+)?)\s*k(?:g)?\.?$/i;
const SET = /^(\d+)\s*(sec|seg|s)?$/i;
const INLINE_LOAD = /\s+(\d+(?:[.,]\d+)?)\s*k(?:g)?\.?$/i;

const sessions = [];
let session = null, ex = null;
for (const raw of (await readFile(file, "utf8")).split(/\r?\n/)) {
  const line = raw.trim();
  if (!line) continue;
  let m;
  if ((m = HEADER.exec(line))) {
    const [, , , mo, d, y] = m;
    session = { date: `${y}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`, exercises: [] };
    sessions.push(session); ex = null;
  } else if ((m = LOAD.exec(line)) && ex) {
    ex.load = Number(m[1].replace(",", "."));
  } else if ((m = SET.exec(line)) && ex) {
    ex.sets.push({ n: Number(m[1]), timed: !!m[2] });
  } else if (session) {
    let name = line, load = null;
    if ((m = INLINE_LOAD.exec(line))) { name = line.slice(0, m.index); load = Number(m[1].replace(",", ".")); }
    ex = { raw: name.trim(), load, sets: [] };
    session.exercises.push(ex);
  }
}

// ── resolve names ─────────────────────────────────────────────────
const catalog = await (await fetch(`${API}/api/exercises`)).json();
const byFold = new Map(catalog.map((e) => [fold(e.name), e]));
const unknown = new Set();
for (const s of sessions) for (const e of s.exercises) {
  const target = ALIASES[fold(e.raw)] ?? e.raw;
  e.exercise = byFold.get(fold(target));
  if (!e.exercise) unknown.add(e.raw);
  e.timed = e.exercise ? TIMED.has(e.exercise.name) || e.sets.some((x) => x.timed) : false;
}
if (unknown.size) {
  console.error(`unknown exercises (add them to ALIASES or to the catalog):\n  ${[...unknown].join("\n  ")}`);
  process.exit(1);
}

// ── plan ──────────────────────────────────────────────────────────
const plan = [];
for (const s of sessions) {
  const existing = await (await fetch(`${API}/api/sets?date=${s.date}`)).json();
  const have = new Set(existing.map((x) => x.exercise_id));
  for (const e of s.exercises) {
    const skip = have.has(e.exercise.id);
    plan.push({ date: s.date, e, skip });
    const sets = e.sets.map((x) => (e.timed ? `${x.n}s` : `${x.n}`)).join(" ");
    console.log(`${s.date}  ${e.raw.padEnd(24)} → ${e.exercise.name.padEnd(40)} ${e.timed ? "" : `${e.load ?? 0} kg`.padStart(8)}  [${sets}]${skip ? "  (already logged, skip)" : ""}`);
  }
}
const todo = plan.filter((p) => !p.skip);
const nSets = todo.reduce((n, p) => n + p.e.sets.length, 0);
if (!apply) console.log(`\ndry run: ${todo.length} exercises / ${nSets} sets would be posted to ${API}. Add --apply to do it.`);

// ── apply ─────────────────────────────────────────────────────────
let posted = 0;
for (const { date, e } of apply ? todo : []) {
  for (const x of e.sets) {
    const body = { exercise_id: e.exercise.id, date, load_kg: e.load ?? 0, ...(e.timed ? { duration_s: x.n } : { reps: x.n }) };
    const res = await fetch(`${API}/api/sets`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    if (!res.ok) { console.error(`failed: ${date} ${e.exercise.name}: ${(await res.json().catch(() => ({}))).error ?? res.statusText}`); process.exit(1); }
    posted++;
  }
}
if (apply) console.log(`posted ${posted} sets to ${API}`);
