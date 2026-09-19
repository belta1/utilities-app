---
name: new-webui
description: Create a new web UI in this jsx-render repo — a page in pages/, optionally with its own API routes and Postgres tables — in the RECOMP house style, verify it, and deploy it. Use for "add a page/tab/dashboard/app for X", "new UI for …", or a new app that should live on the same server.
---

# New web UI on jsx-render

One `.jsx` file in `pages/` is a whole app: server-rendered, hydrated, styled by itself,
talking to `/api/*`. Follow these steps in order; each has a check.

## 1. Scope it (30 seconds, no questions unless the answer changes the shape)

Decide, and say which in one line:

- **Page only** — reads existing API or needs no data (calculators, plans, static
  content). Touches `pages/` only. Deploy = copy the file.
- **Page + data** — needs new tables and routes. Touches `db.mjs`, `api.mjs`, `pages/`.
  Deploy = copy the page **and** push + redeploy the image.
- **New tab in RECOMP** — extend `pages/recomp_v3.jsx` (tabs array in the root
  component, a `<XTab>` component) instead of a new page. Keep new data in `_lib/recomp/`.

Name the page after the app, lowercase, no spaces: `pages/<name>.jsx` → `/<name>`.
Page names starting with `_` are hidden; folders nest routes.

## 2. Start from the template

Copy `template.jsx` (next to this file) to `pages/<name>.jsx` and rename the exported
component. It already has: the `<style>` block with fonts and resets, the sticky header
with tabs, the `api()` helper, a `useData` hook, a card grid, loading / empty / error
states, and SSR-safe `today`.

Reuse from `pages/_lib/recomp/`:
- `tokens.jsx` → `T` (colors), `J` (joint colors). Import these; do not restate hex values.
- `ui.jsx` → `MacroBar`, `WeightSpark`, `DashboardTab`, `NutritionTab` if relevant.

For a different app with its own palette, create `pages/_lib/<name>/tokens.jsx` with
the same keys (`bg surface raised line copper steel sage gold lilac bone ash faint`)
so components can be shared — keep the same *roles*, change the values.

Hard rules (breaking any of these produces a page that renders on the server and dies
in the browser, or the reverse):
- Nothing browser-only during render: `window`, `document`, `location`, `localStorage`,
  `new Date()` for "today", `Math.random()`. Do it in `useEffect`, store in state.
- Fetch in `useEffect`, never at module top level.
- Only relative imports under `pages/` and packages present in `package.json`.
- No CSS / image / JSON imports. Inline SVG or `<style>` instead.
- Spanish copy without accents; labels as `// NOMBRE_SECCION` in mono.

## 3. Data (only for "page + data")

**Tables** — append to `SCHEMA` in `db.mjs`:

```sql
CREATE TABLE IF NOT EXISTS <app>_items (
  id          serial PRIMARY KEY,
  name        text NOT NULL,
  amount      numeric(8,2) NOT NULL CHECK (amount >= 0),
  happened_on date NOT NULL DEFAULT current_date,
  note        text,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS <app>_items_date_idx ON <app>_items (happened_on);
```

Prefix table names with the app. No migrations exist: a later column is
`ALTER TABLE … ADD COLUMN IF NOT EXISTS …` appended to `SCHEMA`. Seeds go in `seed()`
and must be idempotent (`ON CONFLICT … DO UPDATE` / `DO NOTHING`).

**Routes** — in `api.mjs`, write handlers next to the existing ones and register them
in `routes`. Namespace by app: `/api/<app>/…`.

```js
const ITEM_COLS = `i.id, i.name, i.amount, to_char(i.happened_on, 'YYYY-MM-DD') AS happened_on, i.note`;

async function listItems({ from, to }) {
  if (!from || !to) throw bad("pass from=&to=");
  const { rows } = await query(`SELECT ${ITEM_COLS} FROM <app>_items i WHERE i.happened_on BETWEEN $1 AND $2 ORDER BY i.happened_on DESC, i.id`, [from, to]);
  return rows;
}
async function createItem(body) {
  const name = asText(body.name, "name", { required: true });
  const amount = asNumber(body.amount, "amount", { min: 0 });
  const date = asDate(body.date, "date");
  const { rows } = await query(
    `INSERT INTO <app>_items (name, amount, happened_on, note) VALUES ($1, $2, coalesce($3::date, current_date), $4)
     RETURNING id, name, amount, to_char(happened_on, 'YYYY-MM-DD') AS happened_on, note`,
    [name, amount, date, asText(body.note, "note", { max: 500 })]);
  return rows[0];
}
async function deleteItem(id) {
  const { rowCount } = await query("DELETE FROM <app>_items WHERE id = $1", [id]);
  if (!rowCount) throw new ApiError(404, "item not found");
  return { deleted: id };
}

// in `routes`:
["GET",    /^\/api\/<app>\/items$/,       (_m, q) => listItems({ from: asDate(q.get("from"), "from"), to: asDate(q.get("to"), "to") })],
["POST",   /^\/api\/<app>\/items$/,       (_m, _q, body) => createItem(body)],
["DELETE", /^\/api\/<app>\/items\/(\d+)$/, (m) => deleteItem(Number(m[1]))],
```

Validation helpers: `asDate(v, name)`, `asNumber(v, name, { min, integer })`,
`asText(v, name, { required, max })`; errors: `bad("…")` (400), `new ApiError(404, …)`.
Dates out as `YYYY-MM-DD` (`to_char`), never raw `date` columns (they'd serialize as
midnight UTC timestamps). `numeric` is already parsed to numbers.

## 4. Verify before deploying

Start the server against a Postgres (see CLAUDE.md → Running locally), then:

```sh
curl -s localhost:3000/<name> | head -c 400                       # SSR output, no stack trace
curl -s -o /dev/null -w "%{http_code}\n" localhost:3000/<name>.js  # 200 = bundle built
curl -s localhost:3000/api/<app>/items?from=2026-01-01&to=2026-12-31
```

Then open it in a browser (headless Chrome via `playwright-core` if no display): click
through every tab, submit every form once, watch the console for hydration warnings
("Hydration failed", "Text content does not match") — those are step-2 rule violations.
Delete any rows you created in a shared DB.

## 5. Deploy

- Page: `scp -r pages/_lib pages/<name>.jsx belta1@jfubuntu:/home/belta1/docker_compose/config/jsx_server/`
  → live immediately at `http://jfubuntu:3000/<name>`; it appears on `/` automatically.
- Server (`db.mjs` / `api.mjs` / `seed/`): commit, push `main`, wait for the
  **docker image** Actions run, then Portainer → Stacks → `utilities-app` →
  **Pull and redeploy**. Confirm with `curl -I http://jfubuntu:3000/health`.

## 6. Document

Add the page to README → *9. Project layout* and, if it has an API, to *6. API*. One
line each; the README is the reference, keep it true.
