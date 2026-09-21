#!/usr/bin/env node
// The training plan in the database — what the dashboard's ENTRENO tab renders.
// Every change here is live on the next page load: no deploy, no file edit.
//
//   plan                              the days and how many exercises each has
//   plan lunes                        one day, with the slot id of every exercise
//   plan buscar dominad               search the catalog (id, name, group, equipment)
//   plan cambiar <slot> <ejercicio>   swap the exercise in that slot; <ejercicio> is a
//                                     catalog id or a name (accents and case ignored)
//   plan fijar <slot> series=3 reps=8–10 pausa=90s nota="..."
//   plan agregar <dia> <ejercicio> [series=3 reps=8–10 pausa=90s] [--core]
//   plan quitar <slot>
//
// A swap carries the new exercise's figure, load ladder (INICIO / SEM_06) and execution
// detail with it, because those live on the exercise and not on the slot. What it does
// NOT carry is the coach's target: run `hoy --day <dia> --guardar` afterwards so the
// card shows an OBJETIVO computed for the new movement.

const API = process.env.API_URL ?? "http://localhost:3000";
const call = async (method, p, body) => {
  const r = await fetch(API + p, { method, headers: body ? { "content-type": "application/json" } : undefined, body: body ? JSON.stringify(body) : undefined });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`${method} ${p}: ${r.status} ${data.error ?? ""}`);
  return data;
};
const get = (p) => call("GET", p);
const fold = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const die = (msg) => { console.error(msg); process.exit(2); };

const args = process.argv.slice(2);
const json = args.includes("--json");
const core = args.includes("--core");
const rest = args.filter((a) => a !== "--json" && a !== "--core");
const [cmd, ...params] = rest;

// key=value arguments; the Spanish names are what the coach types.
const FIELDS = { series: "sets", reps: "reps", pausa: "rest", nota: "note", sets: "sets", rest: "rest", note: "note" };
function kvs(list) {
  const out = {};
  for (const a of list) {
    const m = /^([a-z]+)=([\s\S]*)$/.exec(a);
    if (!m) continue;
    const field = FIELDS[m[1]];
    if (!field) die(`campo desconocido "${m[1]}"; usa ${Object.keys(FIELDS).join(", ")}`);
    out[field] = m[2];
  }
  return out;
}

// An exercise argument is a catalog id or a name; a name must match exactly one.
async function resolveExercise(token) {
  const catalog = await get("/api/exercises");
  if (/^\d+$/.test(token)) {
    const e = catalog.find((x) => x.id === Number(token));
    return e ?? die(`no hay ejercicio con id ${token}`);
  }
  const q = fold(token);
  const exact = catalog.filter((e) => fold(e.name) === q);
  const hits = exact.length ? exact : catalog.filter((e) => fold(e.name).includes(q));
  if (!hits.length) die(`ningun ejercicio coincide con "${token}" — prueba: plan buscar ${token}`);
  if (hits.length > 1) die(`"${token}" es ambiguo:\n${hits.slice(0, 8).map((e) => `  ${e.id}  ${e.name}`).join("\n")}`);
  return hits[0];
}

const printSlot = (s) => {
  const tag = s.section === "core" ? "[core] " : "";
  console.log(`  slot=${String(s.id).padEnd(4)} ${tag}${s.name}${s.exercise_id ? `  (ej=${s.exercise_id}${s.equipment ? `, ${s.equipment}` : ""})` : "  (sin ejercicio del catalogo)"}`);
  console.log(`         ${s.sets ?? "—"}×${s.reps ?? "—"} · ${s.rest ?? "—"}${s.load_start ? ` · carga ${s.load_start} → ${s.load_target ?? "?"}` : ""}${s.image_key ? ` · fig ${s.image_key}` : " · SIN FIGURA"}`);
  if (s.note) console.log(`         ${s.note}`);
};

const showDay = (d) => {
  console.log(`${d.key} — ${d.day}: ${d.label}${d.is_optional ? " (opcional)" : ""}`);
  console.log(`${d.focus ?? ""}${d.source ? ` · ${d.source}` : ""}`);
  if (d.tip) console.log(d.tip);
  for (const s of d.exercises) printSlot(s);
};

switch (cmd) {
  case undefined: {
    const days = await get("/api/plan");
    if (json) { console.log(JSON.stringify(days, null, 2)); break; }
    for (const d of days) {
      const nMain = d.exercises.filter((x) => x.section !== "core").length;
      const nCore = d.exercises.filter((x) => x.section === "core").length;
      console.log(`${d.key.padEnd(10)} ${d.day.padEnd(10)} ${String(nMain).padStart(2)} ejercicios${nCore ? ` + ${nCore} core` : ""}   ${d.label}`);
    }
    break;
  }
  case "buscar": {
    const q = fold(params.join(" "));
    if (!q) die("uso: plan buscar <texto>");
    const catalog = await get("/api/exercises");
    const hits = catalog.filter((e) => fold(`${e.name} ${e.muscle_group ?? ""} ${e.equipment ?? ""}`).includes(q));
    if (json) { console.log(JSON.stringify(hits, null, 2)); break; }
    if (!hits.length) console.log(`nada coincide con "${params.join(" ")}"`);
    for (const e of hits) console.log(`${String(e.id).padStart(4)}  ${e.name.padEnd(42)} ${(e.muscle_group ?? "").padEnd(18)} ${e.equipment ?? ""}${e.image_key ? "" : "  (sin figura)"}`);
    break;
  }
  case "cambiar": {
    const [slot, ...who] = params;
    if (!/^\d+$/.test(slot ?? "") || !who.length) die("uso: plan cambiar <slot> <id o nombre del ejercicio>");
    const e = await resolveExercise(who.filter((a) => !/^[a-z]+=/.test(a)).join(" "));
    const before = await get("/api/plan").then((ds) => ds.flatMap((d) => d.exercises).find((x) => x.id === Number(slot)));
    if (!before) die(`no existe el slot ${slot} — mira "plan <dia>"`);
    const after = await call("PATCH", `/api/plan/exercises/${slot}`, { exercise_id: e.id, ...kvs(who) });
    if (json) { console.log(JSON.stringify(after, null, 2)); break; }
    console.log(`${after.day_key}: "${before.name}" → "${after.name}"`);
    printSlot(after);
    console.log(`\nLa tarjeta ya muestra la figura, la carga y la ejecucion del nuevo ejercicio.`);
    if (after.note && !("note" in kvs(who))) console.log(`Ojo: la nota sigue siendo la del ejercicio anterior — reescribela con  plan fijar ${after.id} nota="..."  si ya no aplica.`);
    if (!after.load_start) console.log(`Sin carga de referencia (INICIO / SEM_06): agregala con  api PATCH /api/exercises/${after.exercise_id} '{"load_start":"...","load_target":"..."}'`);
    if (!after.image_key) console.log(`Sin figura: la tarjeta muestra el dibujo generico hasta el proximo deploy.`);
    console.log(`Corre  hoy --day ${after.day_key} --guardar  para recalcular el OBJETIVO.`);
    break;
  }
  case "fijar": {
    const [slot, ...kv] = params;
    if (!/^\d+$/.test(slot ?? "")) die("uso: plan fijar <slot> series=3 reps=8–10 pausa=90s");
    const patch = kvs(kv);
    if (!Object.keys(patch).length) die(`nada que cambiar; usa ${Object.keys(FIELDS).join(", ")}`);
    const after = await call("PATCH", `/api/plan/exercises/${slot}`, patch);
    if (json) { console.log(JSON.stringify(after, null, 2)); break; }
    printSlot(after);
    break;
  }
  case "agregar": {
    const [day, ...who] = params;
    if (!day || !who.length) die("uso: plan agregar <dia> <ejercicio> [series=3 reps=8–10 pausa=90s] [--core]");
    const kv = kvs(who);
    const name = who.filter((a) => !/^[a-z]+=/.test(a)).join(" ");
    const e = await resolveExercise(name);
    const after = await call("POST", `/api/plan/${encodeURIComponent(fold(day))}/exercises`, { exercise_id: e.id, section: core ? "core" : "main", ...kv });
    if (json) { console.log(JSON.stringify(after, null, 2)); break; }
    console.log(`${after.day_key}: agregado`);
    printSlot(after);
    break;
  }
  case "quitar": {
    const [slot] = params;
    if (!/^\d+$/.test(slot ?? "")) die("uso: plan quitar <slot>");
    console.log(JSON.stringify(await call("DELETE", `/api/plan/exercises/${slot}`)));
    break;
  }
  default: {
    const days = await get("/api/plan");
    const d = days.find((x) => x.key === fold(cmd).replace(/\+/g, ""));
    if (!d) die(`no hay dia "${cmd}"; usa ${days.map((x) => x.key).join("|")}`);
    if (json) { console.log(JSON.stringify(d, null, 2)); break; }
    showDay(d);
  }
}
