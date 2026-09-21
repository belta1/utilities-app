// Nutrition and profile content for the RECOMP pages.
//
// The plan (days, load ladders, execution detail) and the body measurements now live in
// the database and reach the page through /api/plan and /api/measurements — this file
// keeps only the content that is written, not measured: the weekly menu, macros,
// supplements and the post-workout meals.

export const PROFILE = { edad: 36, altura: 178, nivel: "Principiante", split: "4 fuerza + 1 cardio + 1 recovery" };

// 12-week goals. `metric` names a column of the latest body measurement, so the bar
// tracks the real number; `now` is the fallback while the DB has no measurement yet.
// `from` is where the goal started, and is what the progress bar measures against.
export const GOALS = [
  { label: "Grasa corporal", metric: "body_fat_pct", now: 21.6, from: 22.9, target: 16.0, unit: "%", invert: true },
  { label: "Musculo esqueletico", metric: "skeletal_muscle_kg", now: 33.0, from: 31.5, target: 35.0, unit: "kg", invert: false },
  { label: "Sesiones/semana", now: 5, from: 0, target: 6, unit: "", invert: false },
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
