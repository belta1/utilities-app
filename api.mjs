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
  e.id, e.slug, e.name, e.muscle_group, e.equipment, e.is_favorite, e.sort_order, e.image_key`;

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

// ── splitter (receipt splitting; tables shared with the splitter-agent container) ──

const SHARE_COLS = `s.person_name, s.person_id, s.subtotal, s.discount, s.tip, s.total, s.owes, s.settled_at`;
const CHECK_COLS = `
  c.id, c.restaurant, to_char(c.check_date, 'YYYY-MM-DD') AS check_date, c.currency, c.subtotal, c.discount, c.tip,
  c.total, c.paid_by, c.emailed_to, c.created_at`;

async function splitterListChecks(limit) {
  const { rows } = await query(
    `SELECT ${CHECK_COLS},
            coalesce((SELECT json_agg(json_build_object('person_name', s.person_name, 'total', s.total, 'owes', s.owes,
                                                      'settled_at', s.settled_at) ORDER BY s.owes DESC, s.person_name)
                        FROM splitter_check_shares s WHERE s.check_id = c.id), '[]') AS shares
       FROM splitter_checks c ORDER BY c.check_date DESC NULLS LAST, c.created_at DESC LIMIT $1`, [limit]);
  return rows;
}

async function splitterGetCheck(id) {
  const { rows } = await query(`SELECT ${CHECK_COLS}, c.result FROM splitter_checks c WHERE c.id = $1`, [id]);
  if (!rows.length) throw new ApiError(404, "cuenta no encontrada");
  return rows[0];
}

async function splitterDeleteCheck(id) {
  const { rowCount } = await query("DELETE FROM splitter_checks WHERE id = $1", [id]);
  if (!rowCount) throw new ApiError(404, "cuenta no encontrada");
  return { deleted: id };
}

// Mark one person's part of one check as paid back (or not).
async function splitterSettle(checkId, person, body) {
  const settled = body.settled !== false;
  const { rows } = await query(
    `UPDATE splitter_check_shares s SET settled_at = CASE WHEN $3 THEN coalesce(settled_at, now()) ELSE NULL END
      WHERE check_id = $1 AND lower(person_name) = lower($2) RETURNING ${SHARE_COLS}`,
    [checkId, person, settled]);
  if (!rows.length) throw new ApiError(404, "esa persona no esta en la cuenta");
  return rows[0];
}

// What each person still owes, grouped by person then by the check's payer.
async function splitterBalances() {
  const { rows } = await query(
    `SELECT s.person_name, c.paid_by, sum(s.owes) AS owes, count(*)::int AS checks,
            json_agg(json_build_object('id', c.id, 'restaurant', c.restaurant, 'check_date', to_char(c.check_date, 'YYYY-MM-DD'),
                                       'owes', s.owes) ORDER BY c.check_date DESC, c.created_at DESC) AS detail
       FROM splitter_check_shares s JOIN splitter_checks c ON c.id = s.check_id
      WHERE s.settled_at IS NULL AND s.owes > 0
      GROUP BY s.person_name, c.paid_by ORDER BY sum(s.owes) DESC, s.person_name`);
  return rows;
}

async function splitterListPeople() {
  const { rows } = await query(
    `SELECT p.id, p.name, p.aliases, p.email, count(s.check_id)::int AS checks,
            coalesce(sum(s.owes) FILTER (WHERE s.settled_at IS NULL), 0) AS owes,
            to_char(max(c.check_date), 'YYYY-MM-DD') AS last_check
       FROM splitter_people p LEFT JOIN splitter_check_shares s ON s.person_id = p.id LEFT JOIN splitter_checks c ON c.id = s.check_id
      GROUP BY p.id ORDER BY p.name`);
  return rows;
}

const asAliases = (v) => {
  if (v == null) return null;
  const list = Array.isArray(v) ? v : String(v).split(",");
  return [...new Set(list.map((a) => String(a).trim()).filter(Boolean))];
};

async function splitterCreatePerson(body) {
  const name = asText(body.name, "name", { required: true, max: 60 });
  const { rows } = await query(
    `INSERT INTO splitter_people (name, email, aliases) VALUES ($1, $2, coalesce($3::text[], '{}'))
     ON CONFLICT (name) DO UPDATE SET email = coalesce(EXCLUDED.email, splitter_people.email)
     RETURNING id, name, aliases, email`,
    [name, asText(body.email, "email", { max: 120 }), asAliases(body.aliases)]);
  return rows[0];
}

async function splitterUpdatePerson(id, body) {
  const { rows } = await query(
    `UPDATE splitter_people SET name = coalesce($2, name), email = CASE WHEN $3::text IS NULL THEN email WHEN $3 = '' THEN NULL ELSE $3 END,
            aliases = coalesce($4::text[], aliases)
      WHERE id = $1 RETURNING id, name, aliases, email`,
    [id, asText(body.name, "name", { max: 60 }), body.email == null ? null : String(body.email).trim(), asAliases(body.aliases)]);
  if (!rows.length) throw new ApiError(404, "persona no encontrada");
  return rows[0];
}

async function splitterDeletePerson(id) {
  const used = await query("SELECT 1 FROM splitter_check_shares WHERE person_id = $1 LIMIT 1", [id]);
  if (used.rows.length) throw bad("la persona tiene cuentas; no se puede borrar");
  const { rowCount } = await query("DELETE FROM splitter_people WHERE id = $1", [id]);
  if (!rowCount) throw new ApiError(404, "persona no encontrada");
  return { deleted: id };
}

async function splitterGetSettings() {
  const { rows } = await query("SELECT key, value FROM splitter_settings");
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
async function splitterPutSettings(body) {
  const updates = [];
  if (body.default_payer !== undefined) updates.push(["default_payer", asText(body.default_payer, "default_payer", { required: true, max: 60 })]);
  if (body.recipients !== undefined) {
    const r = body.recipients || {};
    const clean = (list, name) => {
      const out = asAliases(list) ?? [];
      for (const e of out) if (!EMAIL_RE.test(e)) throw bad(`${name}: '${e}' no es un email`);
      return out;
    };
    const to = clean(r.to, "to");
    if (!to.length) throw bad("recipients.to necesita al menos un email");
    updates.push(["recipients", { to, cc: clean(r.cc, "cc") }]);
  }
  for (const [key, value] of updates) {
    await query(
      "INSERT INTO splitter_settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()",
      [key, JSON.stringify(value)]);
  }
  return splitterGetSettings();
}

const routes = [
  ["GET", /^\/api\/exercises$/, () => listExercises()],
  ["POST", /^\/api\/exercises$/, (_m, _q, body) => createExercise(body)],
  ["GET", /^\/api\/exercises\/(\d+)\/last$/, (m, q) => lastSession(Number(m[1]), asDate(q.get("before"), "before"))],
  ["GET", /^\/api\/exercises\/(\d+)\/sessions$/, (m, q) => sessions(Number(m[1]), asDate(q.get("before"), "before"), Math.min(asNumber(q.get("limit") ?? 6, "limit", { min: 1, integer: true }), 50))],
  ["GET", /^\/api\/targets$/, () => listTargets()],
  ["PUT", /^\/api\/exercises\/(\d+)\/target$/, (m, _q, body) => putTarget(Number(m[1]), body)],
  ["DELETE", /^\/api\/exercises\/(\d+)\/target$/, (m) => deleteTarget(Number(m[1]))],
  ["GET", /^\/api\/sets$/, (_m, q) => listSets({ date: asDate(q.get("date"), "date"), from: asDate(q.get("from"), "from"), to: asDate(q.get("to"), "to") })],
  ["POST", /^\/api\/sets$/, (_m, _q, body) => createSet(body)],
  ["PATCH", /^\/api\/sets\/(\d+)$/, (m, _q, body) => updateSet(Number(m[1]), body)],
  ["DELETE", /^\/api\/sets\/(\d+)$/, (m) => deleteSet(Number(m[1]))],
  ["GET",    /^\/api\/splitter\/checks$/, (_m, q) => splitterListChecks(Math.min(asNumber(q.get("limit") ?? 30, "limit", { min: 1, integer: true }), 200))],
  ["GET",    /^\/api\/splitter\/checks\/([A-Za-z0-9._-]+)$/, (m) => splitterGetCheck(m[1])],
  ["DELETE", /^\/api\/splitter\/checks\/([A-Za-z0-9._-]+)$/, (m) => splitterDeleteCheck(m[1])],
  ["PATCH",  /^\/api\/splitter\/checks\/([A-Za-z0-9._-]+)\/shares\/([^/]+)$/, (m, _q, body) => splitterSettle(m[1], decodeURIComponent(m[2]), body)],
  ["GET",    /^\/api\/splitter\/balances$/, () => splitterBalances()],
  ["GET",    /^\/api\/splitter\/people$/, () => splitterListPeople()],
  ["POST",   /^\/api\/splitter\/people$/, (_m, _q, body) => splitterCreatePerson(body)],
  ["PATCH",  /^\/api\/splitter\/people\/(\d+)$/, (m, _q, body) => splitterUpdatePerson(Number(m[1]), body)],
  ["DELETE", /^\/api\/splitter\/people\/(\d+)$/, (m) => splitterDeletePerson(Number(m[1]))],
  ["GET",    /^\/api\/splitter\/settings$/, () => splitterGetSettings()],
  ["PUT",    /^\/api\/splitter\/settings$/, (_m, _q, body) => splitterPutSettings(body)],
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
