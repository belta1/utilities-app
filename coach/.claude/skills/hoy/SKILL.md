---
name: hoy
description: Que toca hoy — la sesion del plan para hoy (o una fecha / dia dado) con cargas objetivo calculadas del historial. Usar al inicio de cada entreno o cuando pregunte "que hago hoy".
---

1. Run `hoy` (add the date, or `--day <dia>` if he names one). If he trains a different
   plan day than the calendar's (Tuesday's session on a Wednesday), pass `--day`.
2. Answer as a checklist, one line per exercise:
   `Ejercicio — <carga objetivo> × <reps> · <n> series · <cue de 5 palabras>`
   The target is the `→` suggestion from `hoy`; where it says "sin historial", give
   `weightSuggestions.start` and say it is the plan's starting load.
3. Add, at the end and once: the post-workout meal (`POST_WORKOUT[<postKey>]` in
   /pages/_lib/recomp/data.jsx) and, on a Friday, which rotation week it is (`hoy` prints Semana A/B).
4. If sets are already logged today, show them and continue from there — don't restart.
5. Offer nothing else. He'll send sets as he goes; log them per the `registrar` skill.
