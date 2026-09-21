#!/usr/bin/env node
// Body composition in the database — what the dashboard's TELEMETRIA tab renders.
// Filled from Samsung Health screenshots: the coach reads the numbers off the image and
// writes one row per measurement date.
//
//   medir                                      the last measurements, oldest first
//   medir --ultimas 5
//   medir 2026-09-21 peso=77.8 grasa=21.6 musculo=33.0 bmi=24.6 bmr=1687 agua=44.7
//   medir 2026-09-21 --json '{"weight_kg":77.8,"bmi":24.6}'
//   medir --borrar <id>
//
// Fields (all optional, but pass at least one). Spanish on the left is what you type:
//   peso=      weight_kg            grasa=     body_fat_pct        grasakg=  fat_mass_kg
//   musculo=   skeletal_muscle_kg   bmi=       bmi                 bmr=      bmr_kcal
//   agua=      body_water_kg        proteina=  protein_kg          mineral=  minerals_kg
//   visceral=  visceral_fat_level   nota=      note                fuente=   source
//
// The write is an upsert on the date: reading the same screenshot twice corrects the row
// instead of duplicating it, so re-entering a value you mistyped is safe.

const API = process.env.API_URL ?? "http://localhost:3000";
const call = async (method, p, body) => {
  const r = await fetch(API + p, { method, headers: body ? { "content-type": "application/json" } : undefined, body: body ? JSON.stringify(body) : undefined });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`${method} ${p}: ${r.status} ${data.error ?? ""}`);
  return data;
};
const die = (msg) => { console.error(msg); process.exit(2); };

const FIELDS = {
  peso: "weight_kg", grasa: "body_fat_pct", grasakg: "fat_mass_kg", musculo: "skeletal_muscle_kg",
  bmi: "bmi", bmr: "bmr_kcal", agua: "body_water_kg", proteina: "protein_kg",
  mineral: "minerals_kg", visceral: "visceral_fat_level", nota: "note", fuente: "source",
};
const LABELS = [
  ["weight_kg", "peso", "kg", 1], ["body_fat_pct", "grasa", "%", 1], ["fat_mass_kg", "grasa", "kg", 1],
  ["skeletal_muscle_kg", "musculo", "kg", 1], ["bmi", "bmi", "", 1], ["bmr_kcal", "bmr", "kcal", 0],
  ["body_water_kg", "agua", "kg", 1], ["protein_kg", "proteina", "kg", 1],
  ["minerals_kg", "mineral", "kg", 1], ["visceral_fat_level", "visceral", "", 1],
];

const args = process.argv.slice(2);
const json = args.includes("--json");
const opt = (name) => (args.includes(name) ? args[args.indexOf(name) + 1] : null);

const borrar = args.includes("--borrar") ? opt("--borrar") : null;

const date = args.find((a) => /^\d{4}-\d{2}-\d{2}$/.test(a));
const body = {};
if (json && date) Object.assign(body, JSON.parse(opt("--json") ?? "{}"));
for (const a of args) {
  const m = /^([a-z]+)=([\s\S]*)$/.exec(a);
  if (!m) continue;
  const field = FIELDS[m[1]];
  if (!field) die(`campo desconocido "${m[1]}"; usa ${Object.keys(FIELDS).join(", ")}`);
  body[field] = m[2];
}

const signed = (n, d) => (n > 0 ? "+" : n < 0 ? "−" : "") + Math.abs(n).toFixed(d);

// ── delete ───────────────────────────────────────────────────────
if (borrar != null) {
  if (!/^\d+$/.test(borrar)) die("uso: medir --borrar <id>");
  console.log(JSON.stringify(await call("DELETE", `/api/measurements/${borrar}`)));

// ── write ────────────────────────────────────────────────────────
} else if (date && Object.keys(body).length) {
  const before = await call("GET", "/api/measurements?limit=200");
  const previous = before.filter((m) => m.measured_on < date).pop() ?? null;
  const row = await call("PUT", "/api/measurements", { ...body, measured_on: date });
  if (json && !opt("--json")) {
    console.log(JSON.stringify(row, null, 2));
  } else {
    console.log(`medicion ${row.measured_on} guardada (id=${row.id}, fuente ${row.source})`);
    for (const [key, label, unit, digits] of LABELS) {
      if (row[key] == null) continue;
      const delta = previous?.[key] != null ? ` (${signed(row[key] - previous[key], digits)} vs ${previous.measured_on})` : "";
      console.log(`  ${label.padEnd(9)} ${Number(row[key]).toFixed(digits)} ${unit}${delta}`);
    }
    if (row.note) console.log(`  nota      ${row.note}`);
    console.log(`\nYa aparece en la pestana TELEMETRIA del dashboard.`);
  }

} else if (date) {
  die("pasa al menos una medida, p.ej.  medir 2026-09-21 peso=77.8 grasa=21.6");

// ── read ─────────────────────────────────────────────────────────
} else {
  const rows = await call("GET", `/api/measurements?limit=${encodeURIComponent(opt("--ultimas") ?? "12")}`);
  if (json) {
    console.log(JSON.stringify(rows, null, 2));
  } else if (!rows.length) {
    console.log("sin mediciones — pasale una captura de Samsung Health al coach");
  } else {
    console.log("fecha        id   peso   grasa  musculo  bmi    bmr    agua");
    for (const m of rows) {
      const c = (v, d = 1) => (v == null ? "—" : Number(v).toFixed(d));
      console.log(`${m.measured_on}  ${String(m.id).padStart(3)}  ${c(m.weight_kg).padStart(5)}  ${c(m.body_fat_pct).padStart(5)}  ${c(m.skeletal_muscle_kg).padStart(7)}  ${c(m.bmi).padStart(5)}  ${c(m.bmr_kcal, 0).padStart(5)}  ${c(m.body_water_kg).padStart(5)}`);
    }
    const now = rows[rows.length - 1], first = rows[0];
    if (rows.length > 1 && now.weight_kg != null && first.weight_kg != null) {
      console.log(`\n${first.measured_on} → ${now.measured_on}: peso ${signed(now.weight_kg - first.weight_kg, 1)} kg`
        + (now.body_fat_pct != null && first.body_fat_pct != null ? ` · grasa ${signed(now.body_fat_pct - first.body_fat_pct, 1)} pp` : "")
        + (now.skeletal_muscle_kg != null && first.skeletal_muscle_kg != null ? ` · musculo ${signed(now.skeletal_muscle_kg - first.skeletal_muscle_kg, 1)} kg` : ""));
    }
  }
}
