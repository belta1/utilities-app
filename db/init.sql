-- One-time setup: creates the database and its owner. Run as the Postgres superuser
-- against the postgres container, then use the same password as PGPASSWORD:
--
--   docker exec -i postgres psql -U postgres < db/init.sql
--
-- Tables are created by the server itself on startup (see db.mjs), nothing else needed.
CREATE USER recomp WITH PASSWORD 'change-me';
CREATE DATABASE recomp OWNER recomp;
