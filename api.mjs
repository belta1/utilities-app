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
  s.set_number, s.load_kg, s.reps, s.note, s.logged_at`;

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

async function createSet(body) {
  const exerciseId = asNumber(body.exercise_id, "exercise_id", { min: 1, integer: true });
  const loadKg = asNumber(body.load_kg, "load_kg", { min: 0 });
  const reps = asNumber(body.reps, "reps", { min: 1, integer: true });
  const date = asDate(body.date, "date");
  const note = asText(body.note, "note", { max: 500 });
  const { rows } = await query(
    `WITH ins AS (
       INSERT INTO workout_sets (exercise_id, performed_on, set_number, load_kg, reps, note)
       SELECT $1, d, coalesce((SELECT max(set_number) FROM workout_sets WHERE exercise_id = $1 AND performed_on = d), 0) + 1, $3, $4, $5
       FROM (SELECT coalesce($2::date, current_date) AS d) x
       RETURNING *)
     SELECT ${SET_COLS} FROM ins s JOIN exercises e ON e.id = s.exercise_id`,
    [exerciseId, date, loadKg, reps, note],
  );
  return rows[0];
}

async function updateSet(id, body) {
  const fields = [];
  const params = [id];
  const set = (col, value) => {
    params.push(value);
    fields.push(`${col} = $${params.length}`);
  };
  if (body.load_kg != null) set("load_kg", asNumber(body.load_kg, "load_kg", { min: 0 }));
  if (body.reps != null) set("reps", asNumber(body.reps, "reps", { min: 1, integer: true }));
  if ("note" in body) set("note", asText(body.note, "note", { max: 500 }));
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
    if (req.method === "POST" || req.method === "PATCH") {
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
