// Postgres access, schema, and seed data. Connection comes from the standard PG*
// environment variables (PGHOST, PGPORT, PGDATABASE, PGUSER, PGPASSWORD).
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { renderToStaticMarkup } from "react-dom/server";
import { loadModuleFile } from "./jsx.mjs";
import { EXERCISES, slugify } from "./seed/exercises.mjs";
import { EXERCISE_LOADS, EXERCISE_DETAIL } from "./seed/exercise-meta.mjs";
import { PLAN_DAYS } from "./seed/plan.mjs";

const APP_DIR = path.dirname(fileURLToPath(import.meta.url));

export const pool = new pg.Pool({ max: 5 });
export const query = (text, params) => pool.query(text, params);

// An idle client dropped by Postgres (or a TLS reset) emits here; without a listener
// the event is unhandled and takes the whole process down, mid-request included.
pool.on("error", (err) => console.error("pg pool:", err.message));

// numeric comes back as a string by default; the API wants numbers.
pg.types.setTypeParser(1700, Number);

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS exercise_images (
    key         text PRIMARY KEY,
    svg         text NOT NULL,
    updated_at  timestamptz NOT NULL DEFAULT now()
  );
  CREATE TABLE IF NOT EXISTS exercises (
    id            serial PRIMARY KEY,
    slug          text UNIQUE NOT NULL,
    name          text NOT NULL,
    muscle_group  text,
    equipment     text,
    is_favorite   boolean NOT NULL DEFAULT false,
    sort_order    integer NOT NULL DEFAULT 1000,
    image_key     text REFERENCES exercise_images(key) ON DELETE SET NULL,
    created_at    timestamptz NOT NULL DEFAULT now()
  );
  CREATE TABLE IF NOT EXISTS workout_sets (
    id            serial PRIMARY KEY,
    exercise_id   integer NOT NULL REFERENCES exercises(id),
    performed_on  date NOT NULL DEFAULT current_date,
    set_number    integer NOT NULL,
    load_kg       numeric(6,2) NOT NULL CHECK (load_kg >= 0),
    reps          integer CHECK (reps > 0),
    duration_s    integer CHECK (duration_s > 0),
    note          text,
    logged_at     timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT workout_sets_reps_or_time CHECK (reps IS NOT NULL OR duration_s IS NOT NULL)
  );
  CREATE INDEX IF NOT EXISTS workout_sets_date_idx ON workout_sets (performed_on);
  CREATE INDEX IF NOT EXISTS workout_sets_exercise_idx ON workout_sets (exercise_id, performed_on);

  -- Timed sets (planks): a set is reps or seconds, load_kg stays (0 for bodyweight).
  -- Upgrades a table created before duration_s existed; no-ops afterwards.
  ALTER TABLE workout_sets ADD COLUMN IF NOT EXISTS duration_s integer CHECK (duration_s > 0);
  ALTER TABLE workout_sets ALTER COLUMN reps DROP NOT NULL;
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'workout_sets_reps_or_time') THEN
      ALTER TABLE workout_sets ADD CONSTRAINT workout_sets_reps_or_time CHECK (reps IS NOT NULL OR duration_s IS NOT NULL);
    END IF;
  END $$;

  -- Reps in reserve at the end of the set (0 = failure). Optional; the coach's
  -- progression uses it when present.
  ALTER TABLE workout_sets ADD COLUMN IF NOT EXISTS rir smallint CHECK (rir BETWEEN 0 AND 5);

  -- Reference material shown on a training card. It lives on the exercise, not on the
  -- plan slot, so swapping an exercise into a slot brings its figure, its load ladder
  -- (INICIO / SEM_06) and its execution detail along with it. seed/exercise-meta.mjs
  -- refreshes these on every start, but only where it has a value: anything the coach
  -- wrote through the API for an exercise the seed says nothing about survives.
  ALTER TABLE exercises ADD COLUMN IF NOT EXISTS load_start    text;
  ALTER TABLE exercises ADD COLUMN IF NOT EXISTS load_target   text;
  ALTER TABLE exercises ADD COLUMN IF NOT EXISTS load_note     text;
  ALTER TABLE exercises ADD COLUMN IF NOT EXISTS muscles       text;
  ALTER TABLE exercises ADD COLUMN IF NOT EXISTS steps         text[];
  ALTER TABLE exercises ADD COLUMN IF NOT EXISTS common_error  text;

  -- The plan the training tab renders: one row per day, one row per prescribed slot.
  -- seed/plan.mjs fills these once, when they are empty; after that the DB is the
  -- source of truth and the coach edits it (swap an exercise, rebalance reps) through
  -- /api/plan. key is the day folded to ascii with "+" stripped: "Core+" -> "core".
  CREATE TABLE IF NOT EXISTS plan_days (
    id           serial PRIMARY KEY,
    key          text UNIQUE NOT NULL,
    day          text NOT NULL,
    label        text NOT NULL,
    type         text NOT NULL,
    focus        text,
    source       text,
    tip          text,
    post_key     text,
    is_optional  boolean NOT NULL DEFAULT false,
    sort_order   integer NOT NULL DEFAULT 1000
  );
  -- One prescribed exercise. section is 'main' or 'core' (the core finisher list).
  -- exercise_id points at the catalog — null only for the cardio/recovery placeholders
  -- ("BODYATTACK (45-55 min)"), which are not logged; name is what the card shows.
  CREATE TABLE IF NOT EXISTS plan_exercises (
    id           serial PRIMARY KEY,
    plan_day_id  integer NOT NULL REFERENCES plan_days(id) ON DELETE CASCADE,
    section      text NOT NULL DEFAULT 'main' CHECK (section IN ('main', 'core')),
    position     integer NOT NULL,
    exercise_id  integer REFERENCES exercises(id),
    name         text NOT NULL,
    sets         text,
    reps         text,
    rest         text,
    note         text,
    updated_at   timestamptz NOT NULL DEFAULT now()
  );
  CREATE INDEX IF NOT EXISTS plan_exercises_day_idx ON plan_exercises (plan_day_id, section, position);

  -- Body composition, one row per measurement day. Written by the Samsung Health parser
  -- (the coach reads a screenshot and POSTs it) and read by the dashboard's telemetry.
  CREATE TABLE IF NOT EXISTS body_measurements (
    id                  serial PRIMARY KEY,
    measured_on         date UNIQUE NOT NULL,
    weight_kg           numeric(5,2),
    body_fat_pct        numeric(4,1),
    fat_mass_kg         numeric(5,2),
    skeletal_muscle_kg  numeric(5,2),
    bmi                 numeric(4,1),
    bmr_kcal            integer,
    body_water_kg       numeric(5,2),
    protein_kg          numeric(5,2),
    minerals_kg         numeric(5,2),
    visceral_fat_level  numeric(4,1),
    source              text NOT NULL DEFAULT 'samsung_health',
    note                text,
    updated_at          timestamptz NOT NULL DEFAULT now()
  );

  -- What to lift next time, per exercise, written by the coach (or hoy --guardar) and
  -- shown on the training tab. One row per exercise; overwritten, never appended.
  CREATE TABLE IF NOT EXISTS exercise_targets (
    exercise_id   integer PRIMARY KEY REFERENCES exercises(id) ON DELETE CASCADE,
    load_kg       numeric(6,2) CHECK (load_kg >= 0),
    reps          text,
    reason        text,
    set_by        text NOT NULL DEFAULT 'coach',
    set_on        date NOT NULL DEFAULT current_date,
    updated_at    timestamptz NOT NULL DEFAULT now()
  );
`;

// The database itself (PGDATABASE) must already exist; only the tables are managed here.
export async function migrate() {
  await query(SCHEMA);
}

// `key` for a plan day: the day name folded to ascii, "+" stripped. Core+ -> core.
export const planKey = (day) => day.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\+/g, "").trim();

// Images are re-rendered from seed/exercise-svgs*.jsx on every start (upsert), so a
// change to a figure ships with the next deploy. Exercises are insert-only, except
// image_key and the reference material (load ladder, muscles, steps, common error),
// which the seed owns wherever it has a value. The plan is different: it is inserted
// once, when plan_days is empty, and never touched again — after that it is the coach
// who edits it through /api/plan, and a deploy must not undo a swap he made.
export async function seed() {
  const seedDir = path.join(APP_DIR, "seed");
  const { buildSvgs, SVG_KEYS } = await loadModuleFile(path.join(seedDir, "exercise-svgs.jsx"));
  const { buildExtraSvgs } = await loadModuleFile(path.join(seedDir, "exercise-svgs-extra.jsx"));
  const images = Object.fromEntries(SVG_KEYS.map((key) => [key, buildSvgs("currentColor", key)[key]]));
  Object.assign(images, buildExtraSvgs("currentColor"));

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const [key, element] of Object.entries(images)) {
      await client.query(
        `INSERT INTO exercise_images (key, svg) VALUES ($1, $2)
         ON CONFLICT (key) DO UPDATE SET svg = EXCLUDED.svg, updated_at = now()`,
        [key, renderToStaticMarkup(element)],
      );
    }
    let inserted = 0;
    for (const [i, e] of EXERCISES.entries()) {
      const load = EXERCISE_LOADS[e.name] ?? {};
      const detail = EXERCISE_DETAIL[e.name] ?? {};
      const { rows } = await client.query(
        `INSERT INTO exercises (slug, name, muscle_group, equipment, is_favorite, sort_order, image_key,
                                load_start, load_target, load_note, muscles, steps, common_error)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         ON CONFLICT (slug) DO UPDATE SET
           image_key    = EXCLUDED.image_key,
           load_start   = coalesce(EXCLUDED.load_start, exercises.load_start),
           load_target  = coalesce(EXCLUDED.load_target, exercises.load_target),
           load_note    = coalesce(EXCLUDED.load_note, exercises.load_note),
           muscles      = coalesce(EXCLUDED.muscles, exercises.muscles),
           steps        = coalesce(EXCLUDED.steps, exercises.steps),
           common_error = coalesce(EXCLUDED.common_error, exercises.common_error)
         RETURNING (xmax = 0) AS inserted`,
        [slugify(e.name), e.name, e.group, e.equipment, e.favorite, i * 10, e.image,
         load.start ?? null, load.target ?? null, load.note ?? null,
         detail.musculos ?? null, detail.pasos ?? null, detail.error ?? null],
      );
      if (rows[0].inserted) inserted++;
    }
    const planDays = await seedPlan(client);
    await client.query("COMMIT");
    return { images: Object.keys(images).length, exercisesInserted: inserted, planDays };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

// Bootstrap the plan from seed/plan.mjs, once. Returns the number of days inserted (0
// on every start after the first). Slots are matched to the catalog by name; the ones
// that have no match (the Les Mills / cycling placeholders) keep exercise_id null and
// are shown, but not logged.
async function seedPlan(client) {
  const { rows: [{ count }] } = await client.query("SELECT count(*)::int AS count FROM plan_days");
  if (count > 0) return 0;
  const { rows: catalog } = await client.query("SELECT id, name FROM exercises");
  const byName = new Map(catalog.map((e) => [e.name, e.id]));
  for (const [i, d] of PLAN_DAYS.entries()) {
    const { rows: [day] } = await client.query(
      `INSERT INTO plan_days (key, day, label, type, focus, source, tip, post_key, is_optional, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
      [planKey(d.day), d.day, d.label, d.type, d.focus ?? null, d.source ?? null, d.tip ?? null,
       d.postKey ?? null, d.optional === true, i * 10],
    );
    for (const [section, list] of [["main", d.exercises ?? []], ["core", d.core ?? []]]) {
      for (const [j, x] of list.entries()) {
        await client.query(
          `INSERT INTO plan_exercises (plan_day_id, section, position, exercise_id, name, sets, reps, rest, note)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [day.id, section, (j + 1) * 10, byName.get(x.name) ?? null, x.name, x.sets ?? null, x.reps ?? null, x.rest ?? null, x.note ?? null],
        );
      }
    }
  }
  return PLAN_DAYS.length;
}
