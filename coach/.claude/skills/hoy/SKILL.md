---
name: hoy
description: Que toca hoy — la sesion del plan para hoy (o una fecha / dia dado) con un rebalanceo de objetivos, cargas y reps/segundos calculado del historial y de la regularidad. Usar al inicio de cada entreno o cuando pregunte "que hago hoy".
---

1. Run `hoy` (add the date, or `--day <dia>` if he names one). If he trains a different
   plan day than the calendar's (Tuesday's session on a Wednesday), pass `--day`.
2. Answer as a checklist, one line per exercise (the `→` line is the target; the reason in
   parentheses is the rule that produced it — quote it in 3–6 words):
   `Ejercicio — <carga objetivo> × <reps> · <n> series · <cue de 5 palabras>`
   The target is the `→` suggestion from `hoy`; where it says "sin historial", give the
   plan's starting load, which `hoy` prints from the exercise's own load ladder.
3. **The rebalance is three numbers, not one.** `hoy` may propose a new load, new
   reps/seconds, *and* a different number of sets. Say all three when they change, and
   name the reason in a few words:
   - `reentrada -15 %` — he has not trained that movement in a month; a 4-set exercise
     drops to 3 this week.
   - `repetir carga` — 15–28 days since the last time; win the reps back before adding kg.
   - `rango a 15–17 reps` / `+5 s` — the load cannot move (bodyweight, minimum plate), so
     the prescription moves instead.
   - `4ª serie` — trained regularly but the e1RM is flat: more volume at the same load.
   Lines marked `plan:` are changes to the plan itself, not just to today's target.
4. Add, at the end and once: the post-workout meal (`POST_WORKOUT[<post_key>]` in
   /app/pages/_lib/recomp/data.jsx — `hoy` prints the key) and, on a Friday, which rotation
   week it is (`hoy` prints Semana A/B).
5. If sets are already logged today, show them and continue from there — don't restart.
6. When he agrees with the rebalance (or after you adjusted one with `api PUT …/target`),
   run `hoy --guardar`. That writes the targets **and** the `plan:` lines into the plan
   itself, so the dashboard cards show the new series/reps as well as the OBJETIVO. If he
   only agrees with part of it, don't run `--guardar`: write the targets you agreed on one
   by one with `api PUT /api/exercises/<id>/target`, and leave the plan alone.
   Then nothing else: he sends sets as he goes; log them per the `registrar` skill.

Changing *which* exercise is in the plan is a different job — see the `cambiar` skill.
