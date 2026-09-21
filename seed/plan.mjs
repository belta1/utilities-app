// The training plan: one entry per plan day, each with its prescribed exercises.
// This is the BOOTSTRAP copy — it is inserted into plan_days / plan_exercises only when
// those tables are empty. After that the database is the source of truth and the coach
// edits it (swap an exercise, rebalance reps) through /api/plan; the seed never
// overwrites those edits. `day` doubles as the key (folded, "+" stripped): Core+ → core.
export const PLAN_DAYS = [
  // ── LUNES: EMPUJE ──────────────────────────────────────────────
  {
    day: "Lunes", label: "FUERZA — Empuje", type: "strength", postKey: "empuje",
    focus: "Pecho · Hombros · Triceps", source: "Barra · Mancuernas · Multiestacion",
    exercises: [
      { name: "Press banca con barra", sets: "4", reps: "6–8", rest: "90s", note: "Omoplatos juntos. Bajar 3s. Con 36 años prioriza rango completo sobre peso maximo." },
      { name: "Press inclinado con mancuernas", sets: "3", reps: "10–12", rest: "75s", note: "Angulo 30–45°. Codos bajan al nivel del pecho." },
      { name: "Press militar con mancuernas de pie", sets: "4", reps: "8–10", rest: "75s", note: "Desde hombros al techo. Core activo, sin arquear lumbar. Mayor rango y menos estres articular que la barra." },
      { name: "Elevaciones laterales", sets: "4", reps: "12–15", rest: "60s", note: "Codo ligeramente doblado. Sube hasta nivel hombro. Sin balancear." },
      { name: "Extension de triceps en polea alta", sets: "3", reps: "12–15", rest: "60s", note: "Codos fijos a los costados, solo el antebrazo se mueve. Menos estres articular que el skull crusher." },
      { name: "Aperturas con mancuernas en banco", sets: "3", reps: "12–15", rest: "60s", note: "Cierre del dia. Estiramiento del pectoral que el press no da. Codos semi-flexionados FIJOS." },
    ],
    core: [
      { name: "Plancha frontal", sets: "3", reps: "30–40 seg", rest: "30s", note: "Cuerpo recto, ombligo adentro. No dejar caer la cadera." },
      { name: "Crunch bicicleta", sets: "3", reps: "16 totales", rest: "30s", note: "Codo toca rodilla opuesta lentamente. Sin inercia." },
      { name: "Plancha lateral", sets: "2", reps: "20–25 seg c/lado", rest: "20s", note: "Cadera arriba, cuerpo alineado. Trabaja oblicuos." },
    ],
  },

  // ── MARTES: HALAR ──────────────────────────────────────────────
  {
    day: "Martes", label: "FUERZA — Halar", type: "strength", postKey: "halar",
    focus: "Espalda · Biceps · Rear delt", source: "Barra · Mancuernas · Multiestacion",
    exercises: [
      { name: "Jalon dorsal en polea alta", sets: "4", reps: "8–12", rest: "90s", note: "HALAR VERTICAL — el constructor de ancho dorsal. Carga progresiva real, mejor que la banda. Pecho arriba, jala al pecho no a la nuca." },
      { name: "Remo con barra libre (Barbell Row)", sets: "4", reps: "6–8", rest: "90s", note: "Torso ~45°, codos al cuerpo. Jala al ombligo. Grosor de espalda." },
      { name: "Remo unilateral con mancuerna", sets: "3", reps: "10–12 por lado", rest: "75s", note: "Codo sube por encima de la espalda. Rango completo." },
      { name: "Remo con mancuernas en banco inclinado", sets: "3", reps: "10–12", rest: "75s", note: "Pecho apoyado — CERO carga lumbar. Ideal despues de barbell row. Aprieta escapulas 1s arriba." },
      { name: "Curl de biceps con barra", sets: "3", reps: "8–10", rest: "60s", note: "Codos fijos a los costados. Baja 3s lento." },
      { name: "Curl martillo con mancuernas", sets: "3", reps: "12", rest: "60s", note: "Pulgar arriba. Mismo recorrido que el curl normal." },
      { name: "Face pull en polea alta", sets: "3", reps: "15", rest: "60s", note: "Cuerda o agarre en polea alta. Codos altos, manos a los lados de las orejas. Salud del manguito." },
    ],
    core: [
      { name: "Dead bug", sets: "3", reps: "10 c/lado", rest: "30s", note: "Espalda baja pegada al piso. Extiende brazo y pierna opuesta. Muy lento." },
      { name: "Crunch clasico", sets: "3", reps: "15–20", rest: "30s", note: "Solo sube hasta las escapulas. No jalonear el cuello." },
      { name: "Elevacion de piernas tumbado", sets: "3", reps: "12", rest: "30s", note: "Piernas juntas, lumbar pegada al suelo. Bajar sin tocar." },
    ],
  },

  // ── MIERCOLES: PIERNA ──────────────────────────────────────────
  {
    day: "Miercoles", label: "FUERZA — Pierna completa", type: "strength", postKey: "pierna",
    focus: "Cuadriceps · Gluteos · Isquios · Gemelos", source: "Barra · Mancuernas · Multiestacion",
    exercises: [
      { name: "Sentadilla con barra libre", sets: "4", reps: "6–8", rest: "120s", note: "Muslos paralelos al piso. Rodillas siguen la punta del pie. Mayor descanso — es el ejercicio mas demandante." },
      { name: "Peso muerto convencional con barra", sets: "3", reps: "5–6", rest: "150s", note: "COMPUESTO REY. Barra pegada a la tibia, espalda neutra, empuja el piso. NO lo hagas si la lumbar molesta ese dia — usa RDL con mancuernas." },
      { name: "Zancadas con mancuernas", sets: "3", reps: "12 por pierna", rest: "75s", note: "Rodilla trasera casi toca el piso. Torso recto." },
      { name: "Hip thrust en banco con mancuerna", sets: "4", reps: "12", rest: "75s", note: "Cadera al techo, pausa 1s arriba. Rodillas a 90°." },
      { name: "Extension de cuadriceps en maquina", sets: "3", reps: "12–15", rest: "60s", note: "Aislamiento sin carga axial — volumen extra de cuadriceps sin castigar la lumbar. Pausa 1s arriba." },
      { name: "Curl femoral en maquina", sets: "3", reps: "12–15", rest: "60s", note: "Complementa el peso muerto. Isquio en su funcion de flexion de rodilla." },
      { name: "Elevacion de gemelos de pie", sets: "4", reps: "15–20", rest: "45s", note: "Sube en puntillas completamente. Usa escalon para mayor rango." },
    ],
    core: [
      { name: "Plancha frontal", sets: "3", reps: "35–45 seg", rest: "30s", note: "Progresion del lunes — 5 seg mas cada semana." },
      { name: "Russian twist", sets: "3", reps: "20 totales", rest: "30s", note: "Sentado a 45 grados, gira de lado a lado. Sin peso al inicio." },
      { name: "Superman", sets: "3", reps: "12", rest: "30s", note: "Boca abajo, levanta brazos y piernas 2 seg. Activa lumbar y gluteo." },
    ],
  },

  // ── JUEVES: CARDIO ─────────────────────────────────────────────
  {
    day: "Jueves", label: "LES MILLS o CYCLING", type: "lesmills", postKey: "cardio",
    focus: "Cardio zona 2 / Fat burn", source: "Les Mills On Demand / Bici",
    tip: "Zona 2 = intensidad donde puedes hablar pero te cuesta. 45-60 min. Quema grasa sin catabolizar musculo.",
    exercises: [
      { name: "BODYATTACK (45–55 min)", sets: "—", reps: "—", rest: "—", note: "Cardio atletico de alta intensidad" },
      { name: "GRIT Cardio (30 min)", sets: "—", reps: "—", rest: "—", note: "HIIT si tienes poco tiempo" },
      { name: "Cycling zona 2 (45–60 min)", sets: "—", reps: "—", rest: "—", note: "Cadencia constante ~65-75% FCmax. ~400-500 kcal" },
    ],
  },

  // ── VIERNES: EMPUJE o HALAR (rotacion) ────────────────────────
  {
    day: "Viernes", label: "FUERZA — Empuje o Halar (rotacion)", type: "strength", postKey: "halar",
    focus: "Semana A: Empuje · Semana B: Halar", source: "Barra · Mancuernas · Multiestacion",
    tip: "Alterna cada semana: Semana A repite empuje (pecho/hombros), Semana B repite halar (espalda/biceps). Esto da mas volumen al grupo mas debil.",
    exercises: [
      { name: "Press banca con barra", sets: "3", reps: "8–10", rest: "90s", note: "Semana A — empuje. Peso ligeramente menor al lunes." },
      { name: "Fondos entre bancos con peso en regazo", sets: "3", reps: "10–15", rest: "75s", note: "Semana A — COMPUESTO de empuje con peso corporal. Progresa agregando mancuerna al regazo." },
      { name: "Remo con barra libre (Barbell Row)", sets: "3", reps: "8–10", rest: "90s", note: "Semana B — halar. Mismo patron que el martes." },
      { name: "Jalon dorsal en polea alta", sets: "3", reps: "10–12", rest: "75s", note: "Semana B — segundo estimulo semanal de halar vertical. Agarre mas cerrado que el martes." },
      { name: "Elevaciones laterales", sets: "3", reps: "15", rest: "60s", note: "Siempre en ambas semanas — hombros necesitan mas volumen." },
      { name: "Face pull en polea alta", sets: "3", reps: "15", rest: "60s", note: "Siempre — salud del manguito rotador. Critico a los 36." },
    ],
    core: [
      { name: "Plancha frontal", sets: "3", reps: "40–50 seg", rest: "30s", note: "Maxima progresion semanal." },
      { name: "Dead bug", sets: "3", reps: "10 c/lado", rest: "30s", note: "Especialmente importante si tienes el dolor lumbar activo." },
      { name: "Crunch bicicleta", sets: "3", reps: "20 totales", rest: "30s", note: "Progresion: 16 el lunes, 20 el viernes." },
    ],
  },

  // ── SABADO: RECOVERY ───────────────────────────────────────────
  {
    day: "Sabado", label: "LES MILLS — BODYBALANCE", type: "recovery",
    focus: "Flexibilidad · Movilidad · Recuperacion activa", source: "Les Mills On Demand",
    tip: "A los 36 la recuperacion activa es tan importante como el entreno. No saltear este dia.",
    exercises: [
      { name: "BODYBALANCE (55 min)", sets: "—", reps: "—", rest: "—", note: "Yoga + Pilates + Tai Chi — recuperacion activa ideal" },
      { name: "STRETCH (30 min)", sets: "—", reps: "—", rest: "—", note: "Alternativa si tienes poco tiempo" },
    ],
  },

  // ── DOMINGO: DESCANSO ──────────────────────────────────────────
  // ── OPCIONAL: CORE DEDICADO ────────────────────────────────────
  {
    day: "Core+", label: "CORE DEDICADO — Opcional", type: "core", optional: true,
    focus: "Core completo · Lumbar · Anti-rotacion", source: "Sin equipo · 20-25 min",
    tip: "Dia OPCIONAL. Usalo si: (a) saltaste un core finisher, (b) quieres trabajo extra de lumbar, o (c) estas de viaje sin gym. Encaja bien el sabado despues de BODYBALANCE o el domingo si te sientes con energia.",
    exercises: [
      { name: "Plancha frontal", sets: "3", reps: "45-60 seg", rest: "45s", note: "Version larga. Si aguantas 60s facil, eleva un pie del piso alternando." },
      { name: "Dead bug", sets: "3", reps: "12 c/lado", rest: "40s", note: "El mas importante para tu lumbar. Lento y con la espalda pegada al piso." },
      { name: "Plancha lateral", sets: "3", reps: "30-40 seg c/lado", rest: "30s", note: "Oblicuos y estabilidad lateral de cadera." },
      { name: "Superman", sets: "3", reps: "15", rest: "40s", note: "Extension lumbar. Contrapeso directo al trabajo de flexion." },
      { name: "Elevacion de piernas tumbado", sets: "3", reps: "15", rest: "40s", note: "Abdomen bajo. Lumbar siempre pegada al suelo." },
      { name: "Russian twist", sets: "3", reps: "24 totales", rest: "40s", note: "Anti-rotacion. Sin peso o con una mancuerna ligera." },
    ],
  },

  {
    day: "Domingo", label: "Descanso completo", type: "rest",
    focus: "Recuperacion total", source: "", exercises: [],
  },
];

