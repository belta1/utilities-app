#!/usr/bin/env node
// The food log — meals counted from photos (the 'calorias' skill), and the day against the
// macro goal the dashboard shows (MACROS in pages/_lib/recomp/data.jsx).
//
//   comida                         today: each meal with its breakdown, total vs goal, what is left
//   comida 2026-11-01              one day
//   comida semana [YYYY-MM-DD]     the last 7 days, one line each, plus the average
//   comida guardar '<json>'        log a meal (see below); prints it and the new day total
//   comida corregir <id> '<json>'  change fields of a meal; passing items recomputes the totals
//   comida borrar <id>
//   … --json                       raw rows
//
// A meal:
//   {"meal":"almuerzo","eaten_on":"2026-11-01","description":"Pollo con arroz y ensalada",
//    "confidence":"media","assumptions":"1 cda aceite al cocinar; arroz blanco cocido",
//    "items":[{"name":"Pechuga de pollo a la plancha","grams":150,"kcal":248,"protein_g":46.5,"carbs_g":0,"fat_g":5.4},
//             {"name":"Arroz blanco cocido","grams":180,"kcal":234,"protein_g":4.9,"carbs_g":50.8,"fat_g":0.5}]}
// meal: desayuno | almuerzo | cena | snack | post. confidence: alta | media | baja.
// eaten_on defaults to today. Totals are summed from the items by the API.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const API = process.env.API_URL ?? "http://localhost:3000";
const call = async (method, p, body) => {
  const r = await fetch(API + p, { method, headers: body ? { "content-type": "application/json" } : undefined, body: body ? JSON.stringify(body) : undefined });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`${method} ${p}: ${r.status} ${data.error ?? ""}`);
  return data;
};
const die = (msg) => { console.error(msg); process.exit(2); };
const parse = (s) => { try { return JSON.parse(s); } catch (e) { die(`JSON invalido: ${e.message}`); } };

// The goal lives in the page data (one source for the dashboard and the coach). Read it as
// text: data.jsx is JSX and cannot be imported from plain node.
function goal() {
  const here = path.dirname(fileURLToPath(import.meta.url));
  for (const dir of [process.env.PAGES_DIR, "/app/pages", path.join(here, "../../pages")]) {
    if (!dir) continue;
    try {
      const src = readFileSync(path.join(dir, "_lib/recomp/data.jsx"), "utf8");
      const m = /export const MACROS\s*=\s*\{([^}]*)\}/.exec(src);
      if (!m) continue;
      const num = (k) => Number(new RegExp(`${k}\\s*:\\s*([\\d.]+)`).exec(m[1])?.[1]);
      return { kcal: num("kcal"), prot: num("prot"), carbs: num("carbs"), fat: num("fat") };
    } catch { /* next */ }
  }
  return null;
}

const pad = (n) => String(n).padStart(2, "0");
const localDate = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const shift = (iso, days) => { const d = new Date(`${iso}T12:00:00`); d.setDate(d.getDate() + days); return localDate(d); };
const g = (n) => Number(n ?? 0).toFixed(0);

const args = process.argv.slice(2).filter((a) => a !== "--json");
const json = process.argv.includes("--json");
const cmd = args[0];

function printMeal(m) {
  console.log(`[${m.id}] ${m.meal.toUpperCase()} — ${m.description}  (${m.eaten_on}, confianza ${m.confidence})`);
  for (const it of m.items ?? []) {
    console.log(`     ${it.name}${it.grams != null ? ` ${g(it.grams)} g` : ""}: ${g(it.kcal)} kcal · P ${g(it.protein_g)} · C ${g(it.carbs_g)} · G ${g(it.fat_g)}${it.note ? `  (${it.note})` : ""}`);
  }
  console.log(`     = ${m.kcal} kcal · P ${g(m.protein_g)} g · C ${g(m.carbs_g)} g · G ${g(m.fat_g)} g`);
  if (m.assumptions) console.log(`     supuestos confirmados: ${m.assumptions}`);
}

async function printDay(date, { totalsOnly = false } = {}) {
  const rows = await call("GET", `/api/food?date=${date}`);
  if (json) return console.log(JSON.stringify(rows, null, 2));
  if (!rows.length) return console.log(`${date}: sin comidas registradas — mandale una foto del plato al coach`);
  if (!totalsOnly) { console.log(`Comidas del ${date}\n`); rows.forEach(printMeal); }
  const t = rows.reduce((a, m) => ({ kcal: a.kcal + m.kcal, p: a.p + m.protein_g, c: a.c + m.carbs_g, f: a.f + m.fat_g }), { kcal: 0, p: 0, c: 0, f: 0 });
  const goalNow = goal();
  console.log(`${totalsOnly ? `Dia ${date}, ${rows.length} comida(s)` : ""}\nTotal: ${t.kcal} kcal · P ${g(t.p)} g · C ${g(t.c)} g · G ${g(t.f)} g`);
  if (goalNow) {
    console.log(`Meta:  ${goalNow.kcal} kcal · P ${goalNow.prot} g · C ${goalNow.carbs} g · G ${goalNow.fat} g`);
    console.log(`Queda: ${goalNow.kcal - t.kcal} kcal · P ${g(goalNow.prot - t.p)} g · C ${g(goalNow.carbs - t.c)} g · G ${g(goalNow.fat - t.f)} g`);
  }
  const low = rows.filter((m) => m.confidence === "baja").length;
  if (low) console.log(`(${low} comida${low > 1 ? "s" : ""} con confianza baja: el total es aproximado)`);
}

if (cmd === "guardar") {
  if (!args[1]) die("uso: comida guardar '<json>'");
  const row = await call("POST", "/api/food", parse(args[1]));
  if (json) console.log(JSON.stringify(row, null, 2));
  else { printMeal(row); console.log(""); await printDay(row.eaten_on, { totalsOnly: true }); console.log("\nYa aparece en la pestana Comida del dashboard."); }

} else if (cmd === "corregir") {
  if (!/^\d+$/.test(args[1] ?? "") || !args[2]) die("uso: comida corregir <id> '<json>'");
  const row = await call("PATCH", `/api/food/${args[1]}`, parse(args[2]));
  if (json) console.log(JSON.stringify(row, null, 2));
  else { printMeal(row); console.log(""); await printDay(row.eaten_on, { totalsOnly: true }); }

} else if (cmd === "borrar") {
  if (!/^\d+$/.test(args[1] ?? "")) die("uso: comida borrar <id>");
  console.log(JSON.stringify(await call("DELETE", `/api/food/${args[1]}`)));

} else if (cmd === "semana") {
  const to = args[1] ?? localDate();
  const from = shift(to, -6);
  const days = await call("GET", `/api/food/days?from=${from}&to=${to}`);
  if (json) { console.log(JSON.stringify(days, null, 2)); process.exit(0); }
  if (!days.length) { console.log(`${from} → ${to}: sin comidas registradas`); process.exit(0); }
  const goalNow = goal();
  console.log(`fecha       comidas   kcal   prot  carbs  grasa`);
  for (const d of days) console.log(`${d.eaten_on}  ${String(d.meals).padStart(7)}  ${String(d.kcal).padStart(5)}  ${g(d.protein_g).padStart(5)}  ${g(d.carbs_g).padStart(5)}  ${g(d.fat_g).padStart(5)}`);
  const avg = (k) => days.reduce((a, d) => a + Number(d[k]), 0) / days.length;
  console.log(`\npromedio de ${days.length} dia(s) con registro: ${g(avg("kcal"))} kcal · P ${g(avg("protein_g"))} g`
    + (goalNow ? `  (meta ${goalNow.kcal} kcal · P ${goalNow.prot} g)` : ""));
  console.log("Solo cuenta lo registrado: un dia con comidas sin foto queda corto.");

} else {
  if (cmd && !/^\d{4}-\d{2}-\d{2}$/.test(cmd)) die("uso: comida [YYYY-MM-DD] | semana | guardar | corregir | borrar");
  await printDay(cmd ?? localDate());
}
