// Run SQL against a Postgres from this machine, using the server's own `pg` driver —
// handy where psql is not installed (Windows). Connection comes from the standard PG*
// variables, exactly like server.mjs; PGSSLMODE=no-verify for jfubuntu's self-signed cert.
//
//   node scripts/sql.mjs "select now()"
//   node scripts/sql.mjs -f setup.sql               # a file, statements run one by one
//   node scripts/sql.mjs --json "select * from exercises limit 3"
//   node scripts/sql.mjs --no-tx "create database x" # CREATE/DROP DATABASE can't be in a transaction
//
// Statements run in one transaction and are rolled back on the first error, so a
// half-applied setup file cannot happen (--no-tx runs them one by one, stopping at
// the first error). Never put a password on the command line.
import { readFile } from "node:fs/promises";
import pg from "pg";

const args = process.argv.slice(2);
const json = args.includes("--json");
const tx = !args.includes("--no-tx");
const fileIdx = args.indexOf("-f");
const text = fileIdx >= 0 ? await readFile(args[fileIdx + 1], "utf8") : args.filter((a) => !a.startsWith("--")).join(" ");
if (!text.trim()) {
  console.error('usage: node scripts/sql.mjs [--json] [--no-tx] "<sql>" | -f file.sql   (PGHOST/PGDATABASE/PGUSER/PGPASSWORD from env)');
  process.exit(2);
}

const client = new pg.Client(); // PG* env; PGSSLMODE handled by pg
await client.connect();
try {
  if (tx) await client.query("BEGIN");
  // Split on ";" followed by whitespace/end — fine for DDL/DML without $$ bodies or ";" in strings.
  const statements = text.split(/;(?=\s|$)/).map((s) => s.trim()).filter(Boolean);
  for (const sql of statements) {
    const res = await client.query(sql);
    if (json) console.log(JSON.stringify(res.rows));
    else if (res.rows?.length) console.table(res.rows);
    else console.log(`${res.command ?? "OK"}${res.rowCount != null ? ` (${res.rowCount})` : ""}`);
  }
  if (tx) await client.query("COMMIT");
} catch (err) {
  if (tx) await client.query("ROLLBACK").catch(() => {});
  console.error(`error: ${err.message}${err.position ? ` (at char ${err.position})` : ""}`);
  process.exitCode = 1;
} finally {
  await client.end();
}
