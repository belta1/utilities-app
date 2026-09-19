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
    reps          integer NOT NULL CHECK (reps > 0),
    note          text,
    logged_at     timestamptz NOT NULL DEFAULT now()
  );
  CREATE INDEX IF NOT EXISTS workout_sets_date_idx ON workout_sets (performed_on);
  CREATE INDEX IF NOT EXISTS workout_sets_exercise_idx ON workout_sets (exercise_id, performed_on);
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
