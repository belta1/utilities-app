---
name: jfubuntu-postgres
description: Connect to the Postgres engine on jfubuntu (the `postgres` Docker container), run SQL from this machine or the host, and create databases, roles and grants for a new app — plus pg_hba/TLS rules, backups and the checks to run before and after. Use for "connect to the db", "create a database/user for X", "give app Y access", "why can't Z connect", or any SQL against jfubuntu.
---

# Postgres on jfubuntu

## The engine (verified 2026-09-19)

| | |
|---|---|
| Container | `postgres` (image `postgres:18`, PG 18.6), Portainer stack `postgres` |
| Reachable as | `jfubuntu:5432` from the LAN; `postgres:5432` from containers on the `pgnet` network (192.168.32.0/20) |
| TLS | `ssl=on`, self-signed cert in `/certs` → clients use `sslmode=no-verify` (pg) / `require` (libpq) |
| Auth | `scram-sha-256`; **plain TCP is rejected** (`hostnossl … reject`); `local` (inside the container) is `trust` |
| Config | `postgres -c config_file=/etc/postgresql/postgresql.conf -c hba_file=/etc/postgresql/pg_hba.conf` — these files come from the stack definition, not from `PGDATA` (`/var/lib/postgresql/18/docker`, volume `postgres_pgdata`) |
| Superuser | `postgres` — password is in the Portainer stack env; the user gives it to you, never store it |
| Roles | `belta1` (login; owns `recomp`), `authenticator` + `web_anon` (PostgREST for `finance_db`), `postgres` |
| Databases | `recomp` (jsx-render, owner `belta1`), `finance_db` (owner `postgres`, ~4 GB), `postgres` |
| Backups | container `postgres-backup-1`: `pg_dumpall` every 24 h to `/home/belta1/docker_compose/config/postgres/backups/all-*.sql.gz`, 14 days kept |
| Companions | pgAdmin at `https://jfubuntu/` (port 443), Portainer `:9000` |

Active `pg_hba.conf`:

```
local     all  all                 trust
host      all  all  127.0.0.1/32   scram-sha-256
host      all  all  ::1/128        scram-sha-256
hostssl   all  all  0.0.0.0/0      scram-sha-256
hostssl   all  all  ::/0           scram-sha-256
hostnossl all  all  0.0.0.0/0      reject
hostnossl all  all  ::/0           reject
```

So: any host, any DB, any role — **as long as the connection is TLS**. A new app on
`pgnet` needs no hba change; it needs a role, a database and `PGSSLMODE`.

## Connecting

Never put a password in a command line or a file in this repo. Take it from the user
(or from the stack env on the host) and pass it through the environment.

**From this machine (no psql installed)** — the repo's runner, same driver and env
names as the server:

```sh
export PGHOST=jfubuntu PGPORT=5432 PGDATABASE=recomp PGUSER=postgres PGSSLMODE=no-verify
export PGPASSWORD=…                           # ask; do not echo it
node scripts/sql.mjs "select current_user, current_database()"
node scripts/sql.mjs --json "select * from exercises limit 3"
node scripts/sql.mjs -f setup.sql             # one transaction, rolled back on error
```

`PGSSLMODE=no-verify` is required (self-signed cert; `require` fails certificate
verification in `pg`, `disable` is rejected by hba).

**On the host (psql inside the container, no TLS or password needed)**:

```sh
ssh belta1@jfubuntu
docker exec -it postgres psql -U postgres              # local socket = trust
docker exec -i  postgres psql -U postgres -d recomp < file.sql
```

Quoting SQL through `ssh … docker exec … -c "…"` breaks on every quote; put the SQL in
a file and pipe it, or use `scripts/sql.mjs` from here.

**From a container** (a stack on `pgnet`): `PGHOST=postgres PGPORT=5432 PGSSLMODE=no-verify`
+ role/db/password as stack env vars. The stack must join the external network:

```yaml
networks:
  pgnet:
    external: true
```

## Creating a database and role for a new app

Decide first: **same database, prefixed tables** (what jsx-render does: everything in
`recomp`, tables `<app>_…`, role `belta1`) is right for another UI on the same server
and needs nothing here. A **separate database + role** is right for a separate app,
another owner, or data you may want to dump/restore on its own.

Template — run as `postgres`, replace `<app>`; generate the password (`openssl rand
-base64 24`) and hand it to the user, do not keep it:

```sql
-- role: login only, no CREATEDB/CREATEROLE, no superuser
CREATE ROLE <app> LOGIN PASSWORD '<generated>';

-- database owned by the role: it can create its own tables, nobody else can connect
CREATE DATABASE <app>_db OWNER <app> ENCODING 'UTF8' TEMPLATE template0;
REVOKE CONNECT ON DATABASE <app>_db FROM PUBLIC;
```

Then, connected to `<app>_db` (PG 15+ removed CREATE on `public` from PUBLIC; the
owner has it, other roles need explicit grants):

```sql
-- only if a second, read-only role should see the data (e.g. dashboards / PostgREST)
CREATE ROLE <app>_ro NOLOGIN;
GRANT CONNECT ON DATABASE <app>_db TO <app>_ro;
GRANT USAGE ON SCHEMA public TO <app>_ro;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO <app>_ro;
ALTER DEFAULT PRIVILEGES FOR ROLE <app> IN SCHEMA public GRANT SELECT ON TABLES TO <app>_ro;
```

`CREATE DATABASE` cannot run inside a transaction: use the host `psql`, or
`node scripts/sql.mjs --no-tx -f setup.sql` (statements run one by one, stopping at the
first error, instead of the default single rolled-back transaction).

Verify from the outside, as the new role, before telling the user it works:

```sh
PGHOST=jfubuntu PGDATABASE=<app>_db PGUSER=<app> PGPASSWORD=… PGSSLMODE=no-verify \
  node scripts/sql.mjs "create table t(x int); insert into t values (1); drop table t; select current_user"
```

Wiring an app: its stack gets `PGHOST=postgres PGDATABASE=<app>_db PGUSER=<app>
PGPASSWORD=<generated> PGSSLMODE=no-verify` and joins `pgnet`. For a jsx-render style
server, tables are created by the app itself on start (`CREATE TABLE IF NOT EXISTS`),
so the role only needs to own the database.

Existing-app changes: add a role to an existing database with `GRANT CONNECT ON
DATABASE … ; GRANT USAGE ON SCHEMA public …; GRANT SELECT/INSERT/… ON ALL TABLES IN
SCHEMA public …` plus `ALTER DEFAULT PRIVILEGES` for future tables. Change a password
with `ALTER ROLE x PASSWORD '…'` — and update the stack env that uses it, or that app
stops at its next restart.

## Inspecting

```sql
select rolname, rolcanlogin, rolsuper, rolcreatedb from pg_roles where rolname not like 'pg\_%';
select datname, pg_get_userbyid(datdba) owner, pg_size_pretty(pg_database_size(datname)) from pg_database where not datistemplate;
select grantee, table_name, string_agg(privilege_type, ',') from information_schema.role_table_grants where table_schema='public' group by 1,2;
select usename, application_name, client_addr, state, backend_start from pg_stat_activity where datname = current_database();
show hba_file; show ssl; show password_encryption;
```

Or on the host: `\l` `\du` `\dp` `\dn+` in psql.

## Changing pg_hba / postgresql.conf

The active files are `/etc/postgresql/*.conf` inside the container and come from the
`postgres` stack (Portainer → Stacks → postgres → Editor; look for `configs:` or a
mounted path). Edit them **there** and redeploy — editing inside the container with
`docker exec` + `select pg_reload_conf();` works until the container is recreated.
Rules are matched top to bottom; keep the `hostnossl … reject` lines last. After a
change, test a connection that should pass and one that should fail.

## Backups and restore

- A full dump exists daily in `/home/belta1/docker_compose/config/postgres/backups/`.
  Before anything destructive (DROP, mass UPDATE/DELETE, restore), take a fresh one:
  `docker exec postgres pg_dump -U postgres -Fc <db> > /home/belta1/<db>-$(date +%F).dump`
- Restore one database: `docker exec -i postgres pg_restore -U postgres -d <db> --clean --if-exists < file.dump`
- Restore everything: `gunzip -c all-….sql.gz | docker exec -i postgres psql -U postgres`

## Rules

- Confirm with the user before `DROP`, `ALTER ROLE … PASSWORD`, `REVOKE` on something
  in use, or any statement touching `finance_db` (4 GB of someone's finance data,
  served by PostgREST as `web_anon`).
- Prefer the app's API for data changes in `recomp`; rows you insert while testing show
  up in the user's UI — delete them and say so.
- No passwords in the repo, in memory files, in commit messages or in chat replies.
  Token-like strings the user pastes into chat should be rotated afterwards; say so once.
- Least privilege: one login role per app, owner of its own database, nothing else.
