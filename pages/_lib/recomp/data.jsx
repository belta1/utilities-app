// Plan, nutrition and measurement data, extracted verbatim from recomp_v2.jsx.

// ═══════════════════════════════════════════════════════════════
// DASHBOARD DATA — mediciones Samsung Health
// ═══════════════════════════════════════════════════════════════
export const WEIGHT_SERIES = [
  { date: "1/23", w: 86.0 }, { date: "1/24", w: 85.6 }, { date: "2/18", w: 84.9 },
  { date: "2/25", w: 80.1 }, { date: "3/5", w: 79.8 }, { date: "5/6", w: 79.7 },
  { date: "5/27", w: 79.3 }, { date: "6/3", w: 76.5 }, { date: "7/15", w: 76.2 }, { date: "8/27", w: 77.8 },
];

export const METRICS_NOW = [
  { label: "PESO", value: "77.8", unit: "kg", delta: "+1.6", good: true, range: "94% magro" },
  { label: "GRASA", value: "21.6", unit: "%", delta: "-1.3", good: true, range: "obj 15–17" },
  { label: "MUSCULO", value: "33.0", unit: "kg", delta: "+1.5", good: true, range: "recuperado" },
  { label: "BMI", value: "24.6", unit: "", delta: "+0.6", good: null, range: "normal 18.5–25" },
  { label: "BMR", value: "1,687", unit: "kcal", delta: "+49", good: true, range: "sobre promedio" },
  { label: "AGUA", value: "44.7", unit: "kg", delta: "+1.7", good: true, range: "39.6–43.4" },
];

export const PROFILE = { edad: 36, altura: 178, nivel: "Principiante", split: "4 fuerza + 1 cardio + 1 recovery" };

export const GOALS = [
  { label: "Grasa corporal", now: 21.6, target: 16.0, unit: "%", invert: true },
  { label: "Proteina diaria", now: 143, target: 146, unit: "g", invert: false },
  { label: "Sesiones/semana", now: 5, target: 6, unit: "", invert: false },
];

export const weightSuggestions = {
  "Jalon dorsal en polea alta":         { start: "40-45 kg", target: "55-60 kg", note: "Si jalas tu peso corporal, ya estas listo para dominadas" },
  "Remo con mancuernas en banco inclinado": { start: "12-14 kg c/u", target: "18-20 kg c/u", note: "Pecho pegado al banco todo el set" },
  "Aperturas con mancuernas en banco":  { start: "8-10 kg c/u", target: "12-14 kg c/u", note: "Peso bajo a proposito — es estiramiento, no fuerza" },
  "Extension de triceps en polea alta": { start: "20-25 kg", target: "30-35 kg", note: "Reps altas, el triceps responde al volumen" },
  "Extension de cuadriceps en maquina": { start: "30-35 kg", target: "45-50 kg", note: "Nunca al fallo con peso alto — cuida la rotula" },
  "Curl femoral en maquina":            { start: "25-30 kg", target: "40-45 kg", note: "El isquio suele estar rezagado, no lo saltes" },
  "Face pull en polea alta":            { start: "15-20 kg", target: "25-30 kg", note: "Es un ejercicio de salud, no de ego. Tecnica estricta" },
  "Peso muerto convencional con barra": { start: "60-70 kg", target: "85-95 kg", note: "Incluye barra. Progresa rapido al inicio, no te apures" },
  "Fondos en paralelas o entre bancos": { start: "Peso corporal", target: "+5-10 kg lastre", note: "Domina 12 reps limpias antes de agregar peso" },
  "Press banca con barra":              { start: "40–45 kg", target: "50–55 kg", note: "Incluye barra (20 kg)" },
  "Press inclinado con mancuernas":     { start: "10–12 kg c/u", target: "14–16 kg c/u", note: "Mas dificil que banca plana" },
  "Press militar con mancuernas de pie":{ start: "8–10 kg c/u", target: "12–14 kg c/u", note: "Control de core obligatorio" },
  "Elevaciones laterales":              { start: "5–6 kg c/u", target: "8–10 kg c/u", note: "Forma > peso siempre" },
  "Skull crusher con mancuernas":       { start: "8–10 kg c/u", target: "12 kg c/u", note: "Solo se mueve el codo" },
  "Fondos entre bancos con peso en regazo": { start: "Sin peso extra", target: "5–10 kg encima", note: "Domina el peso corporal primero" },
  "Sentadilla con barra libre":         { start: "50–60 kg", target: "65–70 kg", note: "Incluye barra (20 kg)" },
  "Zancadas con mancuernas":            { start: "8–10 kg c/u", target: "12–14 kg c/u", note: "El equilibrio es el limite inicial" },
  "Hip thrust en banco con mancuerna":  { start: "16–20 kg", target: "24–28 kg", note: "O barra con discos" },
  "Romanian Deadlift con mancuernas":   { start: "14–16 kg c/u", target: "20–22 kg c/u", note: "Siente el isquio, no la espalda" },
  "Elevacion de gemelos de pie":        { start: "14–16 kg c/u", target: "20 kg c/u", note: "Reps altas, rango completo" },
  "Remo con barra libre (Barbell Row)": { start: "40–45 kg", target: "50–55 kg", note: "Incluye barra (20 kg)" },
  "Remo unilateral con mancuerna":      { start: "14–16 kg", target: "18–20 kg", note: "Apoya bien el cuerpo" },
  "Pull-over con mancuerna":            { start: "10–12 kg", target: "14–16 kg", note: "Una mancuerna con dos manos" },
  "Curl de biceps con barra":           { start: "20–25 kg", target: "30–35 kg", note: "Incluye barra" },
  "Curl martillo con mancuernas":       { start: "10–12 kg c/u", target: "14–16 kg c/u", note: "Agarre neutro vertical" },
  "Face pull con banda elastica":       { start: "Banda media", target: "Banda pesada", note: "O 2 bandas combinadas" },
};

export const days = [
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

export const SUPS = [
  { time: "Pre-entreno (30 min antes)", items: ["L-Arginina 1 capsula", "Creatina 1 scoop (5 g) con agua"], note: "La creatina puede tomarse en cualquier momento — pre es conveniente" },
  { time: "Post-entreno (desayuno)", items: ["Proteina whey 1 scoop (25–30 g) en leche o agua"], note: "Ventana anabolica: dentro de 60 min del entreno" },
];

// Macro targets
export const MACROS = { kcal: 2400, prot: 146, carbs: 235, fat: 70 };

// Weekly meal plan — 7 days x 3 meals
// Proteina estimada por comida para llegar a 143g/dia
// Entreno manana → desayuno = comida mas carga proteica (whey ya suma ~27g)
export const WEEK = [
  {
    day: "Lun", tipo: "fuerza",
    meals: [
      {
        slot: "Desayuno", time: "07:30", icon: "🌅",
        name: "Omelette proteico + tostada",
        items: ["3 huevos revueltos con espinaca y tomate", "1 rebanada pan masa madre integral", "1/2 palta en rodajas", "1 scoop proteina en vaso de leche (post-entreno)"],
        macros: { prot: 52, carbs: 28, fat: 22, kcal: 520 },
        note: "La palta aporta grasas buenas. El whey ya cubre la ventana anabolica."
      },
      {
        slot: "Almuerzo", time: "13:00", icon: "☀️",
        name: "Pechuga a la plancha + papas + ensalada",
        items: ["180 g pechuga de pollo a la plancha con oregano y limon", "150 g papas cocidas en cuadros", "Ensalada: tomate + cebolla + un hilo de aceite oliva"],
        macros: { prot: 48, carbs: 32, fat: 10, kcal: 410 },
        note: "Comida principal del dia — proteina completa + carbohidratos complejos."
      },
      {
        slot: "Cena", time: "20:00", icon: "🌙",
        name: "Posta salteada con garbanzos",
        items: ["150 g posta salteada en cubos con ajo y comino", "100 g garbanzos cocidos", "Espinaca salteada con aceite oliva", "Yogurt griego 150 g de postre"],
        macros: { prot: 48, carbs: 22, fat: 14, kcal: 410 },
        note: "Cena baja en carbs. Garbanzos dan fibra y proteina vegetal extra."
      },
    ]
  },
  {
    day: "Mar", tipo: "fuerza",
    meals: [
      {
        slot: "Desayuno", time: "07:30", icon: "🌅",
        name: "Yogurt griego con manzana y huevos",
        items: ["200 g yogurt griego natural", "1 manzana verde en cubos", "2 huevos duros", "1 scoop proteina con agua (post-entreno Les Mills)"],
        macros: { prot: 50, carbs: 30, fat: 12, kcal: 440 },
        note: "BODYPUMP quema ~300 kcal — reponer glucogeno con la manzana y el yogurt."
      },
      {
        slot: "Almuerzo", time: "13:00", icon: "☀️",
        name: "Lomo de cerdo + arroz o papa",
        items: ["170 g lomo de cerdo al horno con ajo y romero", "130 g papas asadas con cascara", "Tomate con cebolla morada y limon"],
        macros: { prot: 44, carbs: 30, fat: 12, kcal: 410 },
        note: "Cerdo es proteina de alta calidad — similar al pollo en valor biologico."
      },
      {
        slot: "Cena", time: "20:00", icon: "🌙",
        name: "Huevos revueltos con queso + ensalada",
        items: ["3 huevos revueltos con 30 g queso rallado", "Espinaca fresca con palta (1/2)", "1 rebanada pan masa madre integral"],
        macros: { prot: 42, carbs: 18, fat: 22, kcal: 440 },
        note: "Cena moderada. La palta y el huevo aportan grasas buenas para recuperacion."
      },
    ]
  },
  {
    day: "Mie", tipo: "fuerza",
    meals: [
      {
        slot: "Desayuno", time: "07:30", icon: "🌅",
        name: "Huevos + palta + pan + whey",
        items: ["2 huevos fritos en aceite oliva con sal y pimienta", "1/2 palta aplastada con limon en tostada", "1 rebanada pan masa madre integral", "1 scoop proteina con leche descremada"],
        macros: { prot: 50, carbs: 26, fat: 24, kcal: 530 },
        note: "Dia de piernas — cargar bien el desayuno. La pierna demanda mas glucogeno."
      },
      {
        slot: "Almuerzo", time: "13:00", icon: "☀️",
        name: "Pechuga al horno + garbanzos + zapallo",
        items: ["180 g pechuga de pollo al horno con paprika y ajo", "100 g garbanzos salteados con cebolla", "Crema de zapallo (150 ml) sin crema de leche"],
        macros: { prot: 52, carbs: 34, fat: 10, kcal: 430 },
        note: "El zapallo en crema liviana aporta betacaroteno y carbohidratos de bajo IG."
      },
      {
        slot: "Cena", time: "20:00", icon: "🌙",
        name: "Posta al jugo con ensalada verde",
        items: ["140 g posta cocida lentamente con cebolla y tomate", "Espinaca + tomate cherry + hilo aceite oliva", "Yogurt griego 100 g de postre"],
        macros: { prot: 42, carbs: 14, fat: 12, kcal: 340 },
        note: "Cena ligera — musculos ya recibieron nutrientes en desayuno y almuerzo."
      },
    ]
  },
  {
    day: "Jue", tipo: "lesmills",
    meals: [
      {
        slot: "Desayuno", time: "08:00", icon: "🌅",
        name: "Yogurt griego + huevos duros",
        items: ["200 g yogurt griego natural", "1 manzana verde en cubos", "2 huevos duros", "Cafe o te sin azucar"],
        macros: { prot: 36, carbs: 28, fat: 10, kcal: 350 },
        note: "Sin entreno hoy — sin whey ni L-Arginina. Creatina opcional con el desayuno. Desayuno mas liviano."
      },
      {
        slot: "Almuerzo", time: "13:00", icon: "☀️",
        name: "Lentejas con pollo desmenuzado",
        items: ["150 g lentejas cocidas con zanahoria y comino", "100 g pechuga de pollo desmenuzada mezclada", "Tomate + cebolla en vinagre"],
        macros: { prot: 50, carbs: 38, fat: 6, kcal: 410 },
        note: "Mantener proteina alta incluso en descanso — preserva la masa muscular."
      },
      {
        slot: "Cena", time: "20:00", icon: "🌙",
        name: "Filete de cerdo + ensalada palta-tomate",
        items: ["150 g filete de cerdo a la plancha con limon", "1/2 palta en laminas con tomate y sal", "Espinaca salteada con ajo", "Yogurt griego 100 g"],
        macros: { prot: 44, carbs: 10, fat: 20, kcal: 390 },
        note: "Cena baja en carbs para compensar el menor gasto del dia. Total ~2,150 kcal — correcto para descanso."
      },
    ]
  },
  {
    day: "Vie", tipo: "fuerza",
    meals: [
      {
        slot: "Desayuno", time: "07:30", icon: "🌅",
        name: "Batido proteico completo + huevos",
        items: ["1 scoop proteina + 200 ml leche + 1/2 manzana verde licuada", "2 huevos duros", "1 rebanada pan masa madre con palta"],
        macros: { prot: 54, carbs: 30, fat: 20, kcal: 530 },
        note: "Viernes = dia de espalda y biceps — el batido liquido se absorbe mas rapido."
      },
      {
        slot: "Almuerzo", time: "13:00", icon: "☀️",
        name: "Posta con papas y crema de zapallo",
        items: ["170 g posta en cubos salteada con cebolla y ajo", "120 g papas cocidas", "Crema de zapallo (150 ml) como entrada"],
        macros: { prot: 46, carbs: 34, fat: 10, kcal: 410 },
        note: "Almuerzo completo para recuperar el entreno de la manana."
      },
      {
        slot: "Cena", time: "20:00", icon: "🌙",
        name: "Lentejas guisadas livianas",
        items: ["180 g lentejas guisadas con tomate, cebolla y comino", "Espinaca fresca de acompanamiento", "1 huevo duro encima"],
        macros: { prot: 40, carbs: 36, fat: 8, kcal: 380 },
        note: "Viernes = noche de legumbres. Las lentejas tienen caseina vegetal — digestion lenta, ideal para la noche."
      },
    ]
  },
  {
    day: "Sab", tipo: "recovery",
    meals: [
      {
        slot: "Desayuno", time: "08:30", icon: "🌅",
        name: "Desayuno tranquilo — yogurt bowl",
        items: ["200 g yogurt griego con manzana verde en cubos", "2 huevos revueltos con tomate", "1 rebanada pan masa madre con palta"],
        macros: { prot: 44, carbs: 30, fat: 18, kcal: 460 },
        note: "Sin entreno intenso — desayuno mas pausado. Sin whey este dia."
      },
      {
        slot: "Almuerzo", time: "13:30", icon: "☀️",
        name: "Pollo al horno + lentejas + ensalada",
        items: ["170 g pechuga de pollo al horno con paprika", "120 g lentejas guisadas con cebolla", "Tomate + espinaca + aceite oliva"],
        macros: { prot: 52, carbs: 32, fat: 8, kcal: 410 },
        note: "Sabado = dia de lentejas. Recuperacion activa con BODYBALANCE — sin deficit agresivo."
      },
      {
        slot: "Cena", time: "20:00", icon: "🌙",
        name: "Cerdo salteado con zapallo y queso",
        items: ["150 g lomo de cerdo salteado con ajo", "Crema de zapallo 200 ml", "30 g queso rallado encima", "Yogurt griego 100 g de postre"],
        macros: { prot: 46, carbs: 22, fat: 18, kcal: 440 },
        note: "Cena reconfortante. Zapallo + cerdo + queso = alta saciedad."
      },
    ]
  },
  {
    day: "Dom", tipo: "descanso",
    meals: [
      {
        slot: "Desayuno", time: "09:00", icon: "🌅",
        name: "Desayuno libre — tostadas completas",
        items: ["2 rebanadas pan masa madre integral tostado", "2 huevos fritos con tomate", "1 palta entera", "Yogurt griego 100 g con manzana verde"],
        macros: { prot: 36, carbs: 36, fat: 22, kcal: 490 },
        note: "Domingo sin entrenar — calorias similares, sin necesidad de whey."
      },
      {
        slot: "Almuerzo", time: "14:00", icon: "☀️",
        name: "Lentejas dominicales con posta",
        items: ["200 g lentejas guisadas al estilo chileno con cebolla y tomate", "100 g posta desmenuzada mezclada", "Ensalada de tomate y cebolla morada"],
        macros: { prot: 48, carbs: 42, fat: 6, kcal: 420 },
        note: "Domingo = comida mas libre. Mas carbs permitidos porque no hay deficit de entreno."
      },
      {
        slot: "Cena", time: "20:00", icon: "🌙",
        name: "Huevos con queso + espinaca salteada",
        items: ["3 huevos revueltos con 30 g queso", "Espinaca salteada con ajo y aceite oliva", "1/2 palta", "Yogurt griego 150 g"],
        macros: { prot: 44, carbs: 10, fat: 24, kcal: 430 },
        note: "Cena proteica sin carbs para compensar el almuerzo mas cargado."
      },
    ]
  },
];

// ── COLORES ──────────────────────────────────────────────────────────
export const typeStyle = {
  fuerza:   { accent: "#E0853C", bg: "#2A1A0D", badge: "FUERZA" },
  lesmills: { accent: "#7DA7C7", bg: "#15212B", badge: "CARDIO" },
  recovery: { accent: "#9CB380", bg: "#1A2114", badge: "RECOVERY" },
  descanso: { accent: "#8A8178", bg: "#1C1815", badge: "DESCANSO" },
};

export const slotColor = { "Desayuno": "#F2C14E", "Almuerzo": "#E0853C", "Cena": "#B58BC9" };

// ── MACRO BAR ────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════
// DETALLE DE EJECUCION POR EJERCICIO
// ═══════════════════════════════════════════════════════════════
export const EXERCISE_DETAIL = {
  "Jalon dorsal en polea alta": {
    musculos: "Dorsal ancho · Redondo mayor · Romboides · Biceps",
    pasos: ["Sentado, muslos fijos bajo el rodillo, agarre prono ancho", "Pecho arriba y leve inclinacion atras (~15°), NO te balancees", "Deprime las escapulas primero: hombros lejos de las orejas", "Jala la barra al pecho llevando los CODOS al piso. Sube controlado 3s"],
    error: "Jalar detras de la nuca — mala mecanica de hombro sin ventaja alguna. Siempre al pecho.",
  },
  "Remo con mancuernas en banco inclinado": {
    musculos: "Dorsal · Romboides · Trapecio medio · Deltoide posterior",
    pasos: ["Banco inclinado ~30-40°, tumbate boca abajo con el pecho apoyado", "Mancuernas colgando, brazos extendidos hacia el piso", "Jala llevando los codos hacia el techo, pegados al cuerpo", "Aprieta escapulas 1s arriba y baja controlado 3s"],
    error: "Despegar el pecho del banco para ayudarte con impulso — pierde todo el beneficio de la version apoyada.",
  },
  "Aperturas con mancuernas en banco": {
    musculos: "Pectoral mayor (fibras esternales) · Deltoide anterior",
    pasos: ["Tumbado en banco plano, mancuernas arriba con palmas enfrentadas", "Codos semi-flexionados y FIJOS en ese angulo todo el set", "Abre en arco amplio hasta sentir estiramiento en el pecho", "Cierra por el mismo arco, como abrazando un barril"],
    error: "Doblar y extender los codos — eso lo convierte en un press. El codo mantiene su angulo siempre.",
  },
  "Extension de triceps en polea alta": {
    musculos: "Triceps (las tres cabezas)",
    pasos: ["De pie frente a la polea, agarre o cuerda a la altura del pecho", "Codos FIJOS pegados a los costados durante todo el movimiento", "Extiende hasta bloquear, apretando el triceps 1s abajo", "Sube controlado solo hasta 90° en el codo, sin dejar subir el codo"],
    error: "Dejar que los codos se despeguen del cuerpo — convierte el ejercicio en un empuje de pecho.",
  },
  "Extension de cuadriceps en maquina": {
    musculos: "Cuadriceps (recto femoral, vastos)",
    pasos: ["Ajusta el respaldo: rodilla alineada con el eje de giro de la maquina", "Rodillo sobre el empeine, no sobre la tibia", "Extiende hasta casi bloquear, pausa 1s arriba apretando el cuadriceps", "Baja controlado 3s sin dejar caer el peso"],
    error: "Usar impulso o bloquear de golpe con peso alto — la rotula lo paga. Reps altas, peso moderado.",
  },
  "Curl femoral en maquina": {
    musculos: "Isquiotibiales · Gemelo (asistente)",
    pasos: ["Tumbado o sentado segun la maquina, rodillo sobre el tendon de Aquiles", "Cadera pegada al banco, no la levantes al jalar", "Flexiona la rodilla llevando el talon al gluteo", "Pausa 1s en maxima contraccion, baja 3s controlado"],
    error: "Levantar la cadera para completar la rep — pierde tension en el isquio y carga la lumbar.",
  },
  "Face pull en polea alta": {
    musculos: "Deltoide posterior · Manguito rotador · Trapecio medio",
    pasos: ["Polea a la altura de la cara, agarre con cuerda", "Brazos extendidos al frente, un paso atras para tensar", "Jala hacia la frente ABRIENDO los codos hacia arriba y afuera", "Termina con las manos a los lados de las orejas, codos altos"],
    error: "Jalar con codos bajos hacia el pecho — eso es remo. El codo debe quedar por encima de la muneca.",
  },
  "Peso muerto convencional con barra": {
    musculos: "Erectores espinales · Gluteos · Isquios · Trapecio · Antebrazo",
    pasos: ["Pies bajo la barra al ancho de cadera, barra sobre el medio del pie", "Agarra fuera de las rodillas, baja la cadera hasta que las tibias toquen la barra", "Pecho arriba, espalda NEUTRA, lats activados (axilas apretadas)", "Empuja el piso con los pies. La barra sube pegada a la tibia y al muslo"],
    error: "Redondear la lumbar o tirar con la espalda en vez de empujar con las piernas. Con tu historial lumbar: solo 3x5-6, tecnica antes que peso, y saltalo si hay molestia.",
  },
  "Fondos en paralelas o entre bancos": {
    musculos: "Pectoral inferior · Triceps · Deltoide anterior",
    pasos: ["Sujetate en paralelas con brazos extendidos (o manos en el banco)", "Torso inclinado ~20° adelante para pecho, vertical para triceps", "Baja hasta que el hombro quede a la altura del codo (~90°)", "Empuja hasta extension sin bloquear de golpe"],
    error: "Bajar demasiado hasta sentir tiron en el hombro delantero — el rango extra no aporta y lesiona.",
  },
  "Press banca con barra": {
    musculos: "Pectoral mayor · Deltoide anterior · Triceps",
    pasos: ["Tumbado, omoplatos juntos y pegados al banco, pies firmes al piso", "Agarre algo mas ancho que los hombros, barra sobre el pecho", "Baja 3 seg hasta tocar el pecho, codos a 45° del torso", "Empuja explosivo hasta extender, sin bloquear codos de golpe"],
    error: "Rebotar la barra en el pecho o abrir los codos a 90° — castiga el hombro.",
  },
  "Press inclinado con mancuernas": {
    musculos: "Pectoral superior · Deltoide anterior",
    pasos: ["Banco a 30-45°, mancuernas apoyadas en los muslos", "Impulsa con las piernas para llevarlas a posicion inicial", "Baja hasta que las mancuernas queden a nivel del pecho", "Sube juntando levemente las mancuernas arriba"],
    error: "Inclinar demasiado el banco (>45°) convierte el ejercicio en press de hombro.",
  },
  "Press militar con mancuernas de pie": {
    musculos: "Deltoides · Triceps · Core (isometrico)",
    pasos: ["De pie, pies al ancho de cadera, gluteos y abdomen apretados", "Mancuernas a la altura de las orejas, palmas al frente", "Empuja vertical hasta extension casi completa", "Baja con control 2-3 seg al punto inicial"],
    error: "Arquear la lumbar para empujar — si pasa, el peso es excesivo.",
  },
  "Elevaciones laterales": {
    musculos: "Deltoide lateral",
    pasos: ["De pie, mancuernas a los costados, codos levemente doblados", "Sube los brazos hacia los lados hasta nivel del hombro", "Pausa 1 seg arriba, como sirviendo dos jarras", "Baja lento 2-3 seg resistiendo la gravedad"],
    error: "Balancear el torso o subir mas alla del hombro — usa menos peso.",
  },
  "Skull crusher con mancuernas": {
    musculos: "Triceps (cabeza larga)",
    pasos: ["Tumbado, brazos verticales con mancuernas sobre el pecho", "Hombros bloqueados: SOLO el codo se mueve", "Dobla el codo bajando las mancuernas hacia la frente", "Extiende de vuelta sin mover el brazo superior"],
    error: "Mover el hombro junto al codo — lo convierte en pullover y pierde el triceps.",
  },
  "Fondos entre bancos con peso en regazo": {
    musculos: "Triceps · Pectoral inferior",
    pasos: ["Manos al borde del banco, dedos hacia adelante", "Piernas extendidas al banco del frente, mancuerna en el regazo", "Baja doblando codos hasta 90°, espalda rozando el banco", "Empuja con el triceps hasta extension completa"],
    error: "Alejarse del banco al bajar — estresa el hombro innecesariamente.",
  },
  "Sentadilla con barra libre": {
    musculos: "Cuadriceps · Gluteos · Core · Erectores",
    pasos: ["Barra sobre el trapecio (no el cuello), pies al ancho de hombros", "Pecho arriba, core apretado, mirada al frente", "Baja empujando la cadera atras, rodillas siguen la punta del pie", "Profundidad: muslos paralelos. Sube empujando el piso"],
    error: "Levantar talones o colapsar las rodillas hacia adentro — revisa movilidad de tobillo.",
  },
  "Romanian Deadlift con mancuernas": {
    musculos: "Isquiotibiales · Gluteos · Lumbar (isometrico)",
    pasos: ["De pie, mancuernas al frente de los muslos, rodillas semi-flexionadas", "Bisagra: empuja la cadera ATRAS, no bajes doblando rodillas", "Mancuernas bajan rozando las piernas, espalda recta siempre", "Cuando sientas tension en el isquio, vuelve apretando gluteos"],
    error: "Redondear la espalda baja — con tu lumbar sensible, ante duda usa menos peso.",
  },
  "Zancadas con mancuernas": {
    musculos: "Cuadriceps · Gluteos · Estabilizadores",
    pasos: ["De pie con mancuernas a los costados", "Paso largo al frente, torso vertical", "Baja hasta que la rodilla trasera casi toque el piso", "Empuja con el talon delantero para volver"],
    error: "Paso corto: la rodilla delantera pasa la punta del pie y carga la rotula.",
  },
  "Hip thrust en banco con mancuerna": {
    musculos: "Gluteo mayor · Isquios",
    pasos: ["Espalda alta apoyada en el banco, mancuerna sobre la cadera", "Pies al piso, rodillas a 90°", "Empuja la cadera al techo apretando gluteos", "Pausa 1 seg arriba — cuerpo en linea recta hombro-rodilla"],
    error: "Hiperextender la lumbar arriba — el movimiento termina cuando el torso esta horizontal.",
  },
  "Elevacion de gemelos de pie": {
    musculos: "Gastrocnemio · Soleo",
    pasos: ["Punta de los pies en el escalon, talones en el aire", "Mancuernas a los costados", "Sube a puntillas lo mas alto posible, pausa 1 seg", "Baja lento hasta estirar el gemelo bajo el nivel del escalon"],
    error: "Rebotar con inercia — el gemelo responde a rango completo y tiempo bajo tension.",
  },
  "Remo con barra libre (Barbell Row)": {
    musculos: "Dorsal ancho · Romboides · Trapecio · Biceps",
    pasos: ["Torso inclinado ~45°, rodillas semi-flexionadas, barra colgando", "Espalda recta como mesa, core apretado", "Jala la barra al ombligo con los codos pegados al cuerpo", "Aprieta los omoplatos 1 seg arriba, baja con control"],
    error: "Usar impulso de cadera para subir la barra — si necesitas impulso, baja el peso.",
  },
  "Remo unilateral con mancuerna": {
    musculos: "Dorsal ancho · Romboides",
    pasos: ["Rodilla y mano apoyadas en el banco, espalda paralela al piso", "Mancuerna colgando, brazo extendido", "Jala hacia el costado de la cadera, codo pegado al cuerpo", "El codo sube por encima de la linea de la espalda"],
    error: "Rotar el torso para subir mas — mantiene la cadera cuadrada al piso.",
  },
  "Pull-over con mancuerna": {
    musculos: "Dorsal ancho · Serrato · Pectoral",
    pasos: ["Tumbado, una mancuerna sujeta con ambas manos sobre el pecho", "Brazos casi extendidos (codo levemente doblado, fijo)", "Baja en arco por detras de la cabeza hasta sentir estiramiento", "Vuelve por el mismo arco contrayendo el dorsal"],
    error: "Doblar y extender codos durante el arco — eso es triceps, no dorsal.",
  },
  "Curl de biceps con barra": {
    musculos: "Biceps braquial",
    pasos: ["De pie, agarre supino al ancho de hombros", "Codos FIJOS pegados a los costados", "Sube la barra contrayendo biceps, sin mover los codos", "Baja 3 seg lento — la fase excentrica construye mas musculo"],
    error: "Balancear el torso o adelantar los codos — roba trabajo al biceps.",
  },
  "Curl martillo con mancuernas": {
    musculos: "Braquial · Braquiorradial · Biceps",
    pasos: ["De pie, mancuernas con agarre neutro (pulgares arriba)", "Codos fijos a los costados", "Sube manteniendo el agarre vertical todo el recorrido", "Alterna brazos o sube ambos a la vez"],
    error: "Girar la muneca al subir — pierde el enfasis en el braquial.",
  },
  "Face pull con banda elastica": {
    musculos: "Deltoide posterior · Manguito rotador · Romboides",
    pasos: ["Banda anclada a la altura de la cara", "Agarra con ambas manos, brazos extendidos al frente", "Jala hacia la frente ABRIENDO los codos hacia arriba y afuera", "Termina con las manos a los lados de las orejas"],
    error: "Jalar hacia el cuello con codos abajo — eso es remo, no face pull. Critico a los 36 para proteger el hombro.",
  },
};

// ═══════════════════════════════════════════════════════════════
// POST-ENTRENO: que comer despues de cada tipo de sesion
// ═══════════════════════════════════════════════════════════════
export const POST_WORKOUT = {
  empuje: {
    titulo: "Post-entreno empuje",
    ventana: "Dentro de 60 min",
    comida: ["1 scoop whey en leche descremada (~27g prot)", "1 rebanada pan masa madre con 1/2 palta", "1 manzana verde"],
    macros: "~38g prot · 35g carbs · 13g grasa · ~410 kcal",
    razon: "Pecho y hombros son grupos medianos — proteina rapida + carbs moderados bastan para la sintesis.",
  },
  halar: {
    titulo: "Post-entreno halar",
    ventana: "Dentro de 60 min",
    comida: ["1 scoop whey en agua o leche (~27g prot)", "2 huevos duros o revueltos", "1 rebanada pan masa madre integral"],
    macros: "~45g prot · 28g carbs · 14g grasa · ~420 kcal",
    razon: "La espalda es el grupo superior mas grande — proteina alta. Los huevos suman leucina extra.",
  },
  pierna: {
    titulo: "Post-entreno pierna",
    ventana: "Dentro de 45 min — el mas critico",
    comida: ["1 scoop whey en leche (~27g prot)", "1 papa mediana cocida o 1.5 rebanadas pan", "1 yogurt griego 150g con manzana verde"],
    macros: "~48g prot · 55g carbs · 8g grasa · ~480 kcal",
    razon: "Pierna vacia el glucogeno como ningun otro dia — los carbs altos NO son opcionales aqui. Sin reponer, el cortisol se come tu musculo.",
  },
  cardio: {
    titulo: "Post-cardio (BODYATTACK / cycling)",
    ventana: "Dentro de 45 min",
    comida: ["1 scoop whey en agua (~27g prot)", "1 manzana verde o 1 platano", "500-700 ml agua extra con una pizca de sal"],
    macros: "~30g prot · 30g carbs · 2g grasa · ~250 kcal",
    razon: "Cardio = reposicion de glucogeno + rehidratacion. La fruta entrega azucar rapida que va directo al musculo, no a grasa.",
  },
};
