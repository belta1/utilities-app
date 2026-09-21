---
name: cambiar
description: Cambiar un ejercicio del plan por otro del catalogo — queda reflejado en el dashboard al instante, con su figura, su carga y su ejecucion. Usar cuando diga "cambia X por Y", "saca X", "agrega Y el martes" o /cambiar.
---

El plan vive en la base de datos, asi que un cambio aqui se ve en la pestana ENTRENO del
dashboard en la siguiente carga de la pagina. No hay que tocar archivos ni desplegar nada.

1. **Ubica el slot.** `plan <dia>` (lunes, martes, miercoles, jueves, viernes, sabado,
   core, domingo) lista los ejercicios de ese dia con su `slot=<n>`. Si el no dice que
   dia, busca el ejercicio: `plan` para ver los dias, luego el que corresponda.
2. **Ubica el reemplazo en el catalogo.** `plan buscar <texto>` (sin acentos, busca por
   nombre, grupo muscular y equipamiento). Si hay varios candidatos razonables,
   **ofrecele dos o tres y deja que elija** — no adivines. Si lo que pide no existe en
   el catalogo, creal primero con
   `api POST /api/exercises '{"name":"...","muscle_group":"...","equipment":"..."}'`
   y avisale que ese ejercicio no tendra figura hasta el proximo deploy.
3. **Confirma antes de escribir**, en una linea:
   `Martes, slot 14: "Remo con barra libre" → "Remo en maquina" (3×8–10 · 90s). ¿Confirmo?`
4. **Cambia**: `plan cambiar <slot> <id o nombre>`. Si el ejercicio nuevo pide otra
   prescripcion, pasala en la misma llamada o con `plan fijar <slot> series=3 reps=10–12 pausa=75s`.
   Para sacar uno: `plan quitar <slot>`. Para agregar: `plan agregar <dia> <ejercicio> series=3 reps=8–10 pausa=90s`
   (`--core` para el finisher de core).
5. **Recalcula el objetivo**: `hoy --day <dia> --guardar`. El slot trae la figura, la
   carga (INICIO / SEM_06) y la ejecucion del ejercicio nuevo automaticamente — eso vive
   en el ejercicio, no en el slot — pero el OBJETIVO de la tarjeta hay que recalcularlo,
   porque es historial del movimiento nuevo, no del viejo.
6. **Responde en dos lineas**: que quedo en el plan, y cual es el objetivo de la proxima
   sesion para ese ejercicio. Si el ejercicio nuevo no tiene historial, di con que carga
   empezar (`load_start`, que `hoy` imprime como "inicio del plan").

Reglas:
- Respeta el patron del dia: no metas un ejercicio de pierna en el dia de empuje sin
  decirselo. Si lo pide igual, hazlo y dilo en una linea.
- Un cambio por dolor o lesion va acompanado de una nota en el slot
  (`plan fijar <slot> nota="Sustituye al peso muerto mientras la lumbar moleste"`) y de
  una linea en `data/history/coach-notes.md` con la fecha y el motivo.
- El historial del ejercicio viejo no se borra: sigue en el log y sus series cuentan en
  `semana`. Si el cambio es definitivo, dilo; si es por una sesion, mejor no toques el
  plan y solo dale el sustituto de viva voz.
