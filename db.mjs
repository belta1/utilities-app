// Postgres access, schema, and seed data. Connection comes from the standard PG*
// environment variables (PGHOST, PGPORT, PGDATABASE, PGUSER, PGPASSWORD).
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { renderToStaticMarkup } from "react-dom/server";
import { loadModuleFile } from "./jsx.mjs";
import { EXERCISES, slugify } from "./seed/exercises.mjs";

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

  -- Splitter (receipt-splitting agent, github.com/belta1/splitter-agent) shares these tables:
  -- the agent's bin/db.mjs carries the same DDL; both create-if-missing. Page: /splitter.
  CREATE TABLE IF NOT EXISTS splitter_people (
    id          serial PRIMARY KEY,
    name        text NOT NULL UNIQUE,
    aliases     text[] NOT NULL DEFAULT '{}',
    email       text,
    created_at  timestamptz NOT NULL DEFAULT now()
  );
  CREATE TABLE IF NOT EXISTS splitter_checks (
    id          text PRIMARY KEY,
    restaurant  text,
    check_date  date,
    currency    text NOT NULL DEFAULT 'CLP',
    subtotal    numeric NOT NULL,
    discount    numeric NOT NULL DEFAULT 0,
    tip         numeric NOT NULL DEFAULT 0,
    total       numeric NOT NULL,
    paid_by     text,
    result      jsonb NOT NULL,
    xlsx_path   text,
    emailed_to  text[] NOT NULL DEFAULT '{}',
    created_at  timestamptz NOT NULL DEFAULT now()
  );
  CREATE TABLE IF NOT EXISTS splitter_check_shares (
    check_id    text NOT NULL REFERENCES splitter_checks(id) ON DELETE CASCADE,
    person_id   int REFERENCES splitter_people(id),
    person_name text NOT NULL,
    subtotal    numeric NOT NULL,
    discount    numeric NOT NULL DEFAULT 0,
    tip         numeric NOT NULL DEFAULT 0,
    total       numeric NOT NULL,
    owes        numeric NOT NULL DEFAULT 0,
    settled_at  timestamptz,
    PRIMARY KEY (check_id, person_name)
  );
  CREATE INDEX IF NOT EXISTS splitter_check_shares_person_idx ON splitter_check_shares (person_id);
  CREATE TABLE IF NOT EXISTS splitter_settings (
    key         text PRIMARY KEY,
    value       jsonb NOT NULL,
    updated_at  timestamptz NOT NULL DEFAULT now()
  );
  INSERT INTO splitter_settings (key, value) VALUES
    ('default_payer', '"Jose"'),
    ('recipients', '{"to": ["joseeefcof@gmail.com"], "cc": []}')
  ON CONFLICT (key) DO NOTHING;
`;

// The database itself (PGDATABASE) must already exist; only the tables are managed here.
export async function migrate() {
  await query(SCHEMA);
}

// Images are re-rendered from seed/exercise-svgs*.jsx on every start (upsert), so a
// change to a figure ships with the next deploy. Exercises are insert-only, except
// image_key, which the seed owns.
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
      const { rows } = await client.query(
        `INSERT INTO exercises (slug, name, muscle_group, equipment, is_favorite, sort_order, image_key)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (slug) DO UPDATE SET image_key = EXCLUDED.image_key
         RETURNING (xmax = 0) AS inserted`,
        [slugify(e.name), e.name, e.group, e.equipment, e.favorite, i * 10, e.image],
      );
      if (rows[0].inserted) inserted++;
    }
    await client.query("COMMIT");
    return { images: Object.keys(images).length, exercisesInserted: inserted };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
