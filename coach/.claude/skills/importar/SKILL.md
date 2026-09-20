---
name: importar
description: Importar un log del telefono (formato WhatsApp "[HH:MM, M/D/YYYY]" + ejercicio / carga / una linea por serie) al registro. Usar cuando pegue varias sesiones de golpe.
---

1. Save what he pasted, verbatim, to `data/notas/<YYYY-MM>-<n>.txt`.
2. `importar data/notas/<file>` — dry run only. Read the mapping it prints. If it stops on
   unknown names, resolve them with him (two options, or create the exercise), fix the
   spelling in the file, and note the missing alias in `data/history/coach-notes.md` under
   "App" (the alias table lives in the app repo and is edited on his PC).
3. Show the mapping table (date · his name → catalog name · load · sets) and ask
   **¿aplico?**.
4. Only after his yes: `importar notas/<file> --apply`. Then summarize per day from
   `api GET /api/sets?date=…`. Entries already in the log for a (date, exercise) are
   skipped by the tool — say so if it happens.
