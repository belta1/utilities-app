// JSON API for the workout log. Mounted under /api by server.mjs.
import { query } from "./db.mjs";
import { slugify } from "./seed/exercises.mjs";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const bad = (message) => new ApiError(400, message);

const asDate = (v, name) => {
  if (v == null || v === "") return null;
  if (!DATE_RE.test(v)) throw bad(`${name} must be YYYY-MM-DD`);
  return v;
};
const asNumber = (v, name, { min = -Infinity, integer = false } = {}) => {
  const n = typeof v === "string" ? Number(v.replace(",", ".")) : v;
  if (typeof n !== "number" || !Number.isFinite(n) || n < min || (integer && !Number.isInteger(n))) {
    throw bad(`${name} must be a${integer ? "n integer" : " number"}${min > -Infinity ? ` >= ${min}` : ""}`);
  }
  return n;
};
const asText = (v, name, { required = false, max = 200 } = {}) => {
  if (v == null || v === "") {
    if (required) throw bad(`${name} is required`);
    return null;
  }
  if (typeof v !== "string" || v.length > max) throw bad(`${name} must be a string of at most ${max} chars`);
  return v.trim();
};

const EXERCISE_COLS = `
  e.id, e.slug, e.name, e.muscle_group, e.equipment, e.is_favorite, e.sort_order, e.image_key,
  e.load_start, e.load_target, e.load_note, e.muscles, e.steps, e.common_error`;

const SET_COLS = `
  s.id, s.exercise_id, e.name AS exercise_name, e.image_key,
  to_char(s.performed_on, 'YYYY-MM-DD') AS performed_on,
  s.set_number, s.load_kg, s.reps, s.duration_s, s.rir, s.note, s.logged_at`;

// ── handlers ──────────────────────────────────────────────────────

async function listExercises() {
  const { rows } = await query(`
    SELECT ${EXERCISE_COLS}, i.svg
    FROM exercises e LEFT JOIN exercise_images i ON i.key = e.image_key
    ORDER BY e.is_favorite DESC, e.sort_order, e.name`);
  return rows;
}

async function createExercise(body) {
  const name = asText(body.name, "name", { required: true });
  if (!name) throw bad("name is required");
  const slug = slugify(name);
  if (!slug) throw bad("name must contain letters or digits");
  const { rows } = await query(
    `INSERT INTO exercises (slug, name, muscle_group, equipment, image_key)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (slug) DO UPDATE SET name = exercises.name
     RETURNING id, slug, name, muscle_group, equipment, is_favorite, sort_order, image_key`,
    [slug, name, asText(body.muscle_group, "muscle_group"), asText(body.equipment, "equipment"), asText(body.image_key, "image_key")],
  );
  return rows[0];
}

async function lastSession(exerciseId, before) {
  const { rows } = await query(
    `SELECT ${SET_COLS}
     FROM workout_sets s JOIN exercises e ON e.id = s.exercise_id
     WHERE s.exercise_id = $1
       AND s.performed_on = (
         SELECT max(performed_on) FROM workout_sets
         WHERE exercise_id = $1 AND ($2::date IS NULL OR performed_on < $2::date))
     ORDER BY s.set_number`,
    [exerciseId, before],
  );
  return rows.length ? { performed_on: rows[0].performed_on, sets: rows } : null;
}

async function listSets({ date, from, to }) {
  if (date) {
    const { rows } = await query(
      `SELECT ${SET_COLS} FROM workout_sets s JOIN exercises e ON e.id = s.exercise_id
       WHERE s.performed_on = $1 ORDER BY s.logged_at, s.id`,
      [date],
    );
    return rows;
  }
  if (!from || !to) throw bad("pass date=YYYY-MM-DD or from=&to=");
  const { rows } = await query(
    `SELECT ${SET_COLS} FROM workout_sets s JOIN exercises e ON e.id = s.exercise_id
     WHERE s.performed_on BETWEEN $1 AND $2 ORDER BY s.performed_on DESC, s.logged_at, s.id`,
    [from, to],
  );
  return rows;
}

// A set is `reps` (with a load) or `duration_s` (timed, e.g. a plank; load_kg 0 unless
// weighted) — exactly one of the two. Empty strings count as absent so forms can pass both.
const optional = (v) => v == null || v === "";
function asSetMeasure(body) {
  const reps = optional(body.reps) ? null : asNumber(body.reps, "reps", { min: 1, integer: true });
  const duration = optional(body.duration_s) ? null : asNumber(body.duration_s, "duration_s", { min: 1, integer: true });
  if ((reps == null) === (duration == null)) throw bad("pass reps or duration_s (not both)");
  return { reps, duration };
}

async function createSet(body) {
  const exerciseId = asNumber(body.exercise_id, "exercise_id", { min: 1, integer: true });
  const loadKg = optional(body.load_kg) ? 0 : asNumber(body.load_kg, "load_kg", { min: 0 });
  const { reps, duration } = asSetMeasure(body);
  const date = asDate(body.date, "date");
  const note = asText(body.note, "note", { max: 500 });
  const rir = asRir(body.rir);
  const { rows } = await query(
    `WITH ins AS (
       INSERT INTO workout_sets (exercise_id, performed_on, set_number, load_kg, reps, duration_s, note, rir)
       SELECT $1, d, coalesce((SELECT max(set_number) FROM workout_sets WHERE exercise_id = $1 AND performed_on = d), 0) + 1, $3, $4, $5, $6, $7
       FROM (SELECT coalesce($2::date, current_date) AS d) x
       RETURNING *)
     SELECT ${SET_COLS} FROM ins s JOIN exercises e ON e.id = s.exercise_id`,
    [exerciseId, date, loadKg, reps, duration, note, rir],
  );
  return rows[0];
}

// reps in reserve: 0 (failure) to 5, or null when not recorded
function asRir(v) {
  if (optional(v)) return null;
  const n = asNumber(v, "rir", { min: 0, integer: true });
  if (n > 5) throw bad("rir must be 0–5");
  return n;
}

// Last N sessions of an exercise (newest first), each with its sets in order — what a
// progression model needs, in one call. `before` excludes that date and later ones.
async function sessions(exerciseId, before, limit) {
  const { rows } = await query(
    `SELECT ${SET_COLS}
     FROM workout_sets s JOIN exercises e ON e.id = s.exercise_id
     WHERE s.exercise_id = $1
       AND s.performed_on IN (
         SELECT DISTINCT performed_on FROM workout_sets
         WHERE exercise_id = $1 AND ($2::date IS NULL OR performed_on < $2::date)
         ORDER BY performed_on DESC LIMIT $3)
     ORDER BY s.performed_on DESC, s.set_number`,
    [exerciseId, before, limit],
  );
  const out = [];
  for (const s of rows) {
    if (!out.length || out[out.length - 1].performed_on !== s.performed_on) out.push({ performed_on: s.performed_on, sets: [] });
    out[out.length - 1].sets.push(s);
  }
  return out;
}

// ── exercise reference material ───────────────────────────────────

const asTextArray = (v, name, { max = 12 } = {}) => {
  if (v == null || (Array.isArray(v) && !v.length)) return null;
  if (!Array.isArray(v) || v.length > max) throw bad(`${name} must be an array of at most ${max} strings`);
  return v.map((x, i) => asText(x, `${name}[${i}]`, { required: true, max: 300 }));
};

// The load ladder, the figure and the execution detail live on the exercise, not on the
// plan slot, so swapping an exercise into a slot carries them along. Only the keys
// present in the body are touched; pass null to clear one.
const EXERCISE_PATCH = {
  name: (v) => asText(v, "name", { required: true }),
  muscle_group: (v) => asText(v, "muscle_group"),
  equipment: (v) => asText(v, "equipment"),
  image_key: (v) => asText(v, "image_key", { max: 60 }),
  load_start: (v) => asText(v, "load_start", { max: 60 }),
  load_target: (v) => asText(v, "load_target", { max: 60 }),
  load_note: (v) => asText(v, "load_note", { max: 300 }),
  muscles: (v) => asText(v, "muscles", { max: 200 }),
  steps: (v) => asTextArray(v, "steps"),
  common_error: (v) => asText(v, "common_error", { max: 300 }),
};

async function updateExercise(id, body) {
  const fields = [];
  const params = [id];
  for (const [key, parse] of Object.entries(EXERCISE_PATCH)) {
    if (!(key in body)) continue;
    params.push(parse(body[key]));
    fields.push(`${key} = $${params.length}`);
  }
  if (!fields.length) throw bad(`nothing to update; keys: ${Object.keys(EXERCISE_PATCH).join(", ")}`);
  const { rows } = await query(
    `WITH upd AS (UPDATE exercises SET ${fields.join(", ")} WHERE id = $1 RETURNING *)
     SELECT ${EXERCISE_COLS}, i.svg FROM upd e LEFT JOIN exercise_images i ON i.key = e.image_key`,
    params,
  );
  if (!rows.length) throw new ApiError(404, "exercise not found");
  return rows[0];
}

// The figures the seed rendered — what image_key may be set to.
async function listImages() {
  const { rows } = await query("SELECT key, length(svg) AS bytes FROM exercise_images ORDER BY key");
  return rows;
}

// ── the plan: what the training tab renders ───────────────────────

// Each slot carries its exercise's figure, load ladder and detail, so the page needs no
// second lookup and a swapped exercise shows its own image and numbers immediately.
const PLAN_SLOT = `json_build_object(
  'id', p.id, 'section', p.section, 'position', p.position,
  'exercise_id', p.exercise_id, 'name', p.name,
  'sets', p.sets, 'reps', p.reps, 'rest', p.rest, 'note', p.note,
  'slug', e.slug, 'muscle_group', e.muscle_group, 'equipment', e.equipment,
  'image_key', e.image_key, 'svg', i.svg,
  'load_start', e.load_start, 'load_target', e.load_target, 'load_note', e.load_note,
  'muscles', e.muscles, 'steps', e.steps, 'common_error', e.common_error)`;

const PLAN_FROM = `
  FROM plan_days d
  LEFT JOIN plan_exercises p ON p.plan_day_id = d.id
  LEFT JOIN exercises e ON e.id = p.exercise_id
  LEFT JOIN exercise_images i ON i.key = e.image_key`;

async function listPlan(key) {
  const { rows } = await query(
    `SELECT d.id, d.key, d.day, d.label, d.type, d.focus, d.source, d.tip, d.post_key,
            d.is_optional, d.sort_order,
            coalesce(json_agg(${PLAN_SLOT} ORDER BY (p.section = 'core'), p.position, p.id)
                     FILTER (WHERE p.id IS NOT NULL), '[]') AS exercises
     ${PLAN_FROM}
     WHERE $1::text IS NULL OR d.key = $1
     GROUP BY d.id
     ORDER BY d.sort_order, d.id`,
    [key],
  );
  return rows;
}

async function getPlanDay(key) {
  const rows = await listPlan(key);
  if (!rows.length) throw new ApiError(404, `no plan day "${key}"`);
  return rows[0];
}

// One slot, shaped exactly like the ones inside a plan day.
async function planSlot(id) {
  const { rows } = await query(
    `SELECT ${PLAN_SLOT} AS slot, d.key AS day_key
     FROM plan_exercises p
     JOIN plan_days d ON d.id = p.plan_day_id
     LEFT JOIN exercises e ON e.id = p.exercise_id
     LEFT JOIN exercise_images i ON i.key = e.image_key
     WHERE p.id = $1`,
    [id],
  );
  if (!rows.length) throw new ApiError(404, "plan exercise not found");
  return { ...rows[0].slot, day_key: rows[0].day_key };
}

const PLAN_PATCH = {
  sets: (v) => asText(v, "sets", { max: 20 }),
  reps: (v) => asText(v, "reps", { max: 40 }),
  rest: (v) => asText(v, "rest", { max: 20 }),
  note: (v) => asText(v, "note", { max: 500 }),
  position: (v) => asNumber(v, "position", { min: 0, integer: true }),
  section: (v) => {
    const t = asText(v, "section", { required: true });
    if (t !== "main" && t !== "core") throw bad("section must be main or core");
    return t;
  },
};

// Swap the exercise in a slot (`exercise_id`, which also renames the slot to the catalog
// name unless a `name` is given) and/or rewrite its prescription. This is the whole of
// "cambiar ejercicio": one call, and the card shows the new figure, load ladder and
// execution detail on the next request.
async function updatePlanExercise(id, body) {
  const fields = [];
  const params = [id];
  const set = (col, value) => { params.push(value); fields.push(`${col} = $${params.length}`); };
  if ("exercise_id" in body) {
    const exerciseId = optional(body.exercise_id) ? null : asNumber(body.exercise_id, "exercise_id", { min: 1, integer: true });
    set("exercise_id", exerciseId);
    if (exerciseId != null && optional(body.name)) {
      const { rows } = await query("SELECT name FROM exercises WHERE id = $1", [exerciseId]);
      if (!rows.length) throw bad(`no exercise with id ${exerciseId}`);
      set("name", rows[0].name);
    }
  }
  if (!optional(body.name)) set("name", asText(body.name, "name", { required: true }));
  for (const [key, parse] of Object.entries(PLAN_PATCH)) if (key in body) set(key, parse(body[key]));
  if (!fields.length) throw bad("nothing to update");
  set("updated_at", new Date());
  const { rowCount } = await query(`UPDATE plan_exercises SET ${fields.join(", ")} WHERE id = $1`, params);
  if (!rowCount) throw new ApiError(404, "plan exercise not found");
  return planSlot(id);
}

async function createPlanExercise(key, body) {
  const { rows: [day] } = await query("SELECT id FROM plan_days WHERE key = $1", [key]);
  if (!day) throw new ApiError(404, `no plan day "${key}"`);
  const section = "section" in body ? PLAN_PATCH.section(body.section) : "main";
  const exerciseId = optional(body.exercise_id) ? null : asNumber(body.exercise_id, "exercise_id", { min: 1, integer: true });
  let name = asText(body.name, "name");
  if (!name) {
    if (exerciseId == null) throw bad("pass exercise_id and/or name");
    const { rows } = await query("SELECT name FROM exercises WHERE id = $1", [exerciseId]);
    if (!rows.length) throw bad(`no exercise with id ${exerciseId}`);
    name = rows[0].name;
  }
  const { rows: [ins] } = await query(
    `INSERT INTO plan_exercises (plan_day_id, section, position, exercise_id, name, sets, reps, rest, note)
     VALUES ($1, $2,
       coalesce($3, (SELECT coalesce(max(position), 0) + 10 FROM plan_exercises WHERE plan_day_id = $1 AND section = $2)),
       $4, $5, $6, $7, $8, $9)
     RETURNING id`,
    [day.id, section, "position" in body ? PLAN_PATCH.position(body.position) : null, exerciseId, name,
      asText(body.sets, "sets", { max: 20 }), asText(body.reps, "reps", { max: 40 }),
      asText(body.rest, "rest", { max: 20 }), asText(body.note, "note", { max: 500 })],
  );
  return planSlot(ins.id);
}

async function deletePlanExercise(id) {
  const { rowCount } = await query("DELETE FROM plan_exercises WHERE id = $1", [id]);
  if (!rowCount) throw new ApiError(404, "plan exercise not found");
  return { deleted: id };
}

// ── body measurements (Samsung Health) ────────────────────────────

const MEASUREMENT_COLS = `m.id, to_char(m.measured_on, 'YYYY-MM-DD') AS measured_on,
  m.weight_kg, m.body_fat_pct, m.fat_mass_kg, m.skeletal_muscle_kg, m.bmi, m.bmr_kcal,
  m.body_water_kg, m.protein_kg, m.minerals_kg, m.visceral_fat_level, m.source, m.note, m.updated_at`;

// Every metric is optional — a Samsung Health screenshot does not always show all of
// them — but a row must carry at least one, otherwise it is only a date.
const MEASUREMENT_FIELDS = {
  weight_kg: { min: 20 },
  body_fat_pct: { min: 0 },
  fat_mass_kg: { min: 0 },
  skeletal_muscle_kg: { min: 0 },
  bmi: { min: 0 },
  bmr_kcal: { min: 0, integer: true },
  body_water_kg: { min: 0 },
  protein_kg: { min: 0 },
  minerals_kg: { min: 0 },
  visceral_fat_level: { min: 0 },
};

async function listMeasurements(limit) {
  const { rows } = await query(
    `SELECT ${MEASUREMENT_COLS} FROM body_measurements m ORDER BY m.measured_on DESC LIMIT $1`,
    [limit],
  );
  return rows.reverse();                          // oldest first — the chart's order
}

// Upsert on the measurement date, so re-reading the same screenshot corrects the row
// instead of duplicating it. Only the metrics present in the body are written.
async function putMeasurement(body) {
  const date = asDate(body.measured_on ?? body.date, "measured_on");
  if (!date) throw bad("measured_on is required (YYYY-MM-DD)");
  const cols = ["measured_on"];
  const params = [date];
  for (const [key, opts] of Object.entries(MEASUREMENT_FIELDS)) {
    if (optional(body[key])) continue;
    cols.push(key);
    params.push(asNumber(body[key], key, opts));
  }
  if (cols.length === 1) throw bad(`pass at least one metric: ${Object.keys(MEASUREMENT_FIELDS).join(", ")}`);
  const source = asText(body.source, "source", { max: 40 });
  if (source) { cols.push("source"); params.push(source); }
  const note = asText(body.note, "note", { max: 500 });
  if (note) { cols.push("note"); params.push(note); }
  const updates = cols.slice(1).map((c) => `${c} = EXCLUDED.${c}`).concat("updated_at = now()");
  const { rows } = await query(
    `WITH up AS (
       INSERT INTO body_measurements (${cols.join(", ")})
       VALUES (${params.map((_, i) => `$${i + 1}`).join(", ")})
       ON CONFLICT (measured_on) DO UPDATE SET ${updates.join(", ")}
       RETURNING *)
     SELECT ${MEASUREMENT_COLS} FROM up m`,
    params,
  );
  return rows[0];
}

async function deleteMeasurement(id) {
  const { rowCount } = await query("DELETE FROM body_measurements WHERE id = $1", [id]);
  if (!rowCount) throw new ApiError(404, "measurement not found");
  return { deleted: id };
}

// ── targets: what to lift next time, per exercise ─────────────────

const TARGET_COLS = `t.exercise_id, e.name AS exercise_name, t.load_kg, t.reps, t.reason, t.set_by,
  to_char(t.set_on, 'YYYY-MM-DD') AS set_on, t.updated_at`;

async function listTargets() {
  const { rows } = await query(`SELECT ${TARGET_COLS} FROM exercise_targets t JOIN exercises e ON e.id = t.exercise_id ORDER BY e.name`);
  return rows;
}

async function putTarget(exerciseId, body) {
  const loadKg = optional(body.load_kg) ? null : asNumber(body.load_kg, "load_kg", { min: 0 });
  const reps = asText(body.reps, "reps", { max: 40 });
  if (loadKg == null && !reps) throw bad("pass load_kg and/or reps");
  const { rows } = await query(
    `WITH up AS (
       INSERT INTO exercise_targets (exercise_id, load_kg, reps, reason, set_by, set_on)
       VALUES ($1, $2, $3, $4, coalesce($5, 'coach'), coalesce($6::date, current_date))
       ON CONFLICT (exercise_id) DO UPDATE SET load_kg = EXCLUDED.load_kg, reps = EXCLUDED.reps,
         reason = EXCLUDED.reason, set_by = EXCLUDED.set_by, set_on = EXCLUDED.set_on, updated_at = now()
       RETURNING *)
     SELECT ${TARGET_COLS} FROM up t JOIN exercises e ON e.id = t.exercise_id`,
    [exerciseId, loadKg, reps, asText(body.reason, "reason", { max: 300 }), asText(body.set_by, "set_by", { max: 40 }), asDate(body.set_on, "set_on")],
  );
  return rows[0];
}

async function deleteTarget(exerciseId) {
  const { rowCount } = await query("DELETE FROM exercise_targets WHERE exercise_id = $1", [exerciseId]);
  if (!rowCount) throw new ApiError(404, "no target for that exercise");
  return { deleted: exerciseId };
}

// ── daily recommendation: what to train today when it differs from the plan ──

const RECOMMENDATION_COLS = `to_char(r.recommended_on, 'YYYY-MM-DD') AS recommended_on,
  r.plan_key, r.source_key, r.kind, r.title, r.reason, r.set_by, r.updated_at`;

async function getRecommendation(date) {
  if (!date) throw bad("date is required (YYYY-MM-DD)");
  const { rows } = await query(
    `SELECT ${RECOMMENDATION_COLS} FROM daily_recommendation r WHERE r.recommended_on = $1`,
    [date],
  );
  return rows[0] ?? null;
}

// Upsert on the date. plan_key (and source_key, when given) must name a real plan day, so a
// swapped/renamed plan stays consistent and the dashboard can always render the target day.
async function putRecommendation(body) {
  const date = asDate(body.recommended_on ?? body.date, "recommended_on");
  if (!date) throw bad("recommended_on is required (YYYY-MM-DD)");
  const planKey = asText(body.plan_key, "plan_key", { required: true, max: 40 });
  const sourceKey = asText(body.source_key, "source_key", { max: 40 });
  const reason = asText(body.reason, "reason", { required: true, max: 500 });
  const { rows: keys } = await query("SELECT key FROM plan_days");
  const known = new Set(keys.map((k) => k.key));
  if (!known.has(planKey)) throw bad(`no plan day "${planKey}"`);
  if (sourceKey && !known.has(sourceKey)) throw bad(`no plan day "${sourceKey}"`);
  const { rows } = await query(
    `WITH up AS (
       INSERT INTO daily_recommendation (recommended_on, plan_key, source_key, kind, title, reason, set_by)
       VALUES ($1, $2, $3, coalesce($4, 'substitution'), $5, $6, coalesce($7, 'hoy'))
       ON CONFLICT (recommended_on) DO UPDATE SET plan_key = EXCLUDED.plan_key, source_key = EXCLUDED.source_key,
         kind = EXCLUDED.kind, title = EXCLUDED.title, reason = EXCLUDED.reason, set_by = EXCLUDED.set_by, updated_at = now()
       RETURNING *)
     SELECT ${RECOMMENDATION_COLS} FROM up r`,
    [date, planKey, sourceKey, asText(body.kind, "kind", { max: 40 }), asText(body.title, "title", { max: 120 }),
     reason, asText(body.set_by, "set_by", { max: 40 })],
  );
  return rows[0];
}

async function deleteRecommendation(date) {
  if (!date) throw bad("date is required (YYYY-MM-DD)");
  const { rowCount } = await query("DELETE FROM daily_recommendation WHERE recommended_on = $1", [date]);
  if (!rowCount) throw new ApiError(404, "no recommendation for that date");
  return { deleted: date };
}

async function updateSet(id, body) {
  const fields = [];
  const params = [id];
  const set = (col, value) => {
    params.push(value);
    fields.push(`${col} = $${params.length}`);
  };
  if (body.load_kg != null) set("load_kg", asNumber(body.load_kg, "load_kg", { min: 0 }));
  if ("reps" in body || "duration_s" in body) {
    // switching a set between reps and time clears the other column
    const { reps, duration } = asSetMeasure(body);
    set("reps", reps);
    set("duration_s", duration);
  }
  if ("note" in body) set("note", asText(body.note, "note", { max: 500 }));
  if ("rir" in body) set("rir", asRir(body.rir));
  if (!fields.length) throw bad("nothing to update");
  const { rows } = await query(
    `WITH upd AS (UPDATE workout_sets SET ${fields.join(", ")} WHERE id = $1 RETURNING *)
     SELECT ${SET_COLS} FROM upd s JOIN exercises e ON e.id = s.exercise_id`,
    params,
  );
  if (!rows.length) throw new ApiError(404, "set not found");
  return rows[0];
}

async function deleteSet(id) {
  const { rowCount } = await query("DELETE FROM workout_sets WHERE id = $1", [id]);
  if (!rowCount) throw new ApiError(404, "set not found");
  return { deleted: id };
}

// ── router ────────────────────────────────────────────────────────

const routes = [
  ["GET", /^\/api\/exercises$/, () => listExercises()],
  ["POST", /^\/api\/exercises$/, (_m, _q, body) => createExercise(body)],
  ["GET", /^\/api\/exercises\/(\d+)\/last$/, (m, q) => lastSession(Number(m[1]), asDate(q.get("before"), "before"))],
  ["GET", /^\/api\/exercises\/(\d+)\/sessions$/, (m, q) => sessions(Number(m[1]), asDate(q.get("before"), "before"), Math.min(asNumber(q.get("limit") ?? 6, "limit", { min: 1, integer: true }), 50))],
  ["PATCH", /^\/api\/exercises\/(\d+)$/, (m, _q, body) => updateExercise(Number(m[1]), body)],
  ["GET", /^\/api\/images$/, () => listImages()],
  ["GET", /^\/api\/plan$/, () => listPlan(null)],
  ["GET", /^\/api\/plan\/([a-z]+)$/, (m) => getPlanDay(m[1])],
  ["POST", /^\/api\/plan\/([a-z]+)\/exercises$/, (m, _q, body) => createPlanExercise(m[1], body)],
  ["PATCH", /^\/api\/plan\/exercises\/(\d+)$/, (m, _q, body) => updatePlanExercise(Number(m[1]), body)],
  ["DELETE", /^\/api\/plan\/exercises\/(\d+)$/, (m) => deletePlanExercise(Number(m[1]))],
  ["GET", /^\/api\/measurements$/, (_m, q) => listMeasurements(Math.min(asNumber(q.get("limit") ?? 24, "limit", { min: 1, integer: true }), 200))],
  ["PUT", /^\/api\/measurements$/, (_m, _q, body) => putMeasurement(body)],
  ["DELETE", /^\/api\/measurements\/(\d+)$/, (m) => deleteMeasurement(Number(m[1]))],
  ["GET", /^\/api\/recommendation$/, (_m, q) => getRecommendation(asDate(q.get("date"), "date"))],
  ["PUT", /^\/api\/recommendation$/, (_m, _q, body) => putRecommendation(body)],
  ["DELETE", /^\/api\/recommendation\/(\d{4}-\d{2}-\d{2})$/, (m) => deleteRecommendation(asDate(m[1], "date"))],
  ["GET", /^\/api\/targets$/, () => listTargets()],
  ["PUT", /^\/api\/exercises\/(\d+)\/target$/, (m, _q, body) => putTarget(Number(m[1]), body)],
  ["DELETE", /^\/api\/exercises\/(\d+)\/target$/, (m) => deleteTarget(Number(m[1]))],
  ["GET", /^\/api\/sets$/, (_m, q) => listSets({ date: asDate(q.get("date"), "date"), from: asDate(q.get("from"), "from"), to: asDate(q.get("to"), "to") })],
  ["POST", /^\/api\/sets$/, (_m, _q, body) => createSet(body)],
  ["PATCH", /^\/api\/sets\/(\d+)$/, (m, _q, body) => updateSet(Number(m[1]), body)],
  ["DELETE", /^\/api\/sets\/(\d+)$/, (m) => deleteSet(Number(m[1]))],
];

// Returns true if the request was an /api route (handled, including errors).
export async function handleApi(req, res, url, readBody) {
  if (!url.pathname.startsWith("/api/")) return false;
  const sendJson = (status, body) => {
    res.writeHead(status, { "content-type": "application/json; charset=utf-8" });
    res.end(JSON.stringify(body));
  };
  try {
    const route = routes.find(([method, re]) => method === req.method && re.test(url.pathname));
    if (!route) return sendJson(404, { error: "not found" }), true;
    let body = {};
    if (req.method === "POST" || req.method === "PATCH" || req.method === "PUT") {
      const raw = await readBody(req);
      try {
        body = raw ? JSON.parse(raw) : {};
      } catch {
        throw bad("body must be JSON");
      }
      if (typeof body !== "object" || body === null) throw bad("body must be a JSON object");
    }
    const result = await route[2](url.pathname.match(route[1]), url.searchParams, body);
    sendJson(200, result);
  } catch (err) {
    const status = err.status ?? (err.code === "23503" ? 400 : 500);
    if (status === 500) console.error(err);
    sendJson(status, { error: status === 500 ? "internal error" : err.message });
  }
  return true;
}
