---
name: registrar
description: Registrar series en el log — desde texto libre ("banca 40x8 x4", "plancha 60s", "3 series de 12 con 15") o una lista pegada. Usar cuando diga que hizo algo, o /registrar.
---

1. Parse what he wrote into rows: exercise · load_kg · reps **or** duration_s · count.
   Conventions: `40x8 x4` = 40 kg, 8 reps, 4 sets · `12 12 10` = three sets, same load · `rir2` / `r2` / "me quedaban 2" = reps in reserve for those sets ·
   `60s` / `60 seg` / plank names = timed · dumbbell loads are per hand · no load given →
   look up the last session's load (`api GET /api/exercises/<id>/last`) and say so.
2. Resolve names against `api GET /api/exercises` (81 in the catalog; ignore accents and
   case; his shorthand is in the ALIASES table of
   `/app/scripts/import-sesiones.mjs`). Ambiguous → ask with two options. Not in
   the catalog → offer to create it with `api POST /api/exercises`.
3. Date: today unless he says otherwise ("ayer", "el martes").
4. Always show the table (exercise · kg · reps/seg · n) and ask **¿confirmo?** before
   writing anything. Mid-workout, one set at a time, keep it to one line:
   "Press banca 40×8 → ¿confirmo?".
5. After his yes, POST each set:
   `api POST /api/sets '{"exercise_id":ID,"load_kg":KG,"reps":N,"date":"YYYY-MM-DD"}'`
   (or `"duration_s":S` instead of reps). Then `api GET /api/sets?date=…` and answer with
   what the log now holds for those exercises, one line each. On an API error, show it
   verbatim and stop.
6. If he gave no RIR, ask once, briefly ("¿cuantas te quedaban?") — it is optional but it drives the next target.
7. If the sets hit the top of the rep range, say what that means for next time
   ("una mas asi y subes a 42.5").
