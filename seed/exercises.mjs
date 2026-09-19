// Exercise catalog. `favorite: true` = defined in the original recomp_v2 plan; these
// sort first in the picker. `image` is a key from exercise-svgs.jsx (the original figures)
// or, when omitted, the exercise slug, which names its figure in exercise-svgs-extra.jsx.
// Rows are insert-only except image_key, which the seed owns and refreshes on every start.

export const slugify = (name) =>
  name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

const fav = (name, group, equipment, image) => ({ name, group, equipment, image: image ?? slugify(name), favorite: true });
const ex = (name, group, equipment, image) => ({ name, group, equipment, image: image ?? slugify(name), favorite: false });

export const EXERCISES = [
  // ── Plan original: Lunes — empuje ──────────────────────────────
  fav("Press banca con barra", "Pecho", "Barra", "press_banca"),
  fav("Press inclinado con mancuernas", "Pecho", "Mancuernas", "press_inclinado"),
  fav("Press militar con mancuernas de pie", "Hombros", "Mancuernas", "press_militar"),
  fav("Elevaciones laterales", "Hombros", "Mancuernas", "elevaciones_laterales"),
  fav("Extension de triceps en polea alta", "Triceps", "Polea", "ext_triceps_polea"),
  fav("Aperturas con mancuernas en banco", "Pecho", "Mancuernas", "aperturas"),
  // ── Martes — traccion ──────────────────────────────────────────
  fav("Jalon dorsal en polea alta", "Espalda", "Polea", "jalon_dorsal"),
  fav("Remo con barra libre (Barbell Row)", "Espalda", "Barra", "barbell_row"),
  fav("Remo unilateral con mancuerna", "Espalda", "Mancuernas", "remo_unilateral"),
  fav("Remo con mancuernas en banco inclinado", "Espalda", "Mancuernas", "remo_banco_inclinado"),
  fav("Curl de biceps con barra", "Biceps", "Barra", "curl_barra"),
  fav("Curl martillo con mancuernas", "Biceps", "Mancuernas", "curl_martillo"),
  fav("Face pull en polea alta", "Hombros", "Polea", "face_pull_polea"),
  // ── Miercoles — pierna ─────────────────────────────────────────
  fav("Sentadilla con barra libre", "Piernas", "Barra", "sentadilla"),
  fav("Peso muerto convencional con barra", "Cadena posterior", "Barra", "peso_muerto"),
  fav("Zancadas con mancuernas", "Piernas", "Mancuernas", "zancadas"),
  fav("Hip thrust en banco con mancuerna", "Gluteos", "Mancuernas", "hip_thrust"),
  fav("Extension de cuadriceps en maquina", "Piernas", "Maquina", "ext_cuadriceps"),
  fav("Curl femoral en maquina", "Isquios", "Maquina", "curl_femoral"),
  fav("Elevacion de gemelos de pie", "Gemelos", "Mancuernas", "gemelos"),
  // ── Viernes / variantes del plan ───────────────────────────────
  fav("Fondos entre bancos con peso en regazo", "Triceps", "Peso corporal", "fondos_banco"),
  fav("Skull crusher con mancuernas", "Triceps", "Mancuernas", "skull_crusher"),
  fav("Romanian Deadlift con mancuernas", "Isquios", "Mancuernas", "rdl"),
  fav("Pull-over con mancuerna", "Pecho", "Mancuernas", "pullover"),
  fav("Face pull con banda elastica", "Hombros", "Banda", "face_pull"),
  // ── Core del plan ──────────────────────────────────────────────
  fav("Plancha frontal", "Core", "Peso corporal"),
  fav("Plancha lateral", "Core", "Peso corporal"),
  fav("Crunch bicicleta", "Core", "Peso corporal"),
  fav("Crunch clasico", "Core", "Peso corporal"),
  fav("Dead bug", "Core", "Peso corporal"),
  fav("Elevacion de piernas tumbado", "Core", "Peso corporal"),
  fav("Russian twist", "Core", "Peso corporal"),
  fav("Superman", "Core", "Peso corporal"),

  // ── Otros ejercicios comunes ───────────────────────────────────
  // Pecho
  ex("Press banca con mancuernas", "Pecho", "Mancuernas"),
  ex("Press declinado con barra", "Pecho", "Barra"),
  ex("Press cerrado en banca", "Triceps", "Barra"),
  ex("Cruce de poleas", "Pecho", "Polea"),
  ex("Pec deck", "Pecho", "Maquina"),
  ex("Fondos en paralelas", "Pecho", "Peso corporal"),
  ex("Flexiones", "Pecho", "Peso corporal"),
  // Espalda
  ex("Dominadas", "Espalda", "Peso corporal"),
  ex("Jalon dorsal agarre cerrado", "Espalda", "Polea"),
  ex("Remo en polea baja", "Espalda", "Polea"),
  ex("Remo en maquina", "Espalda", "Maquina"),
  ex("Remo Pendlay", "Espalda", "Barra"),
  ex("Pull-over en polea", "Espalda", "Polea"),
  ex("Peso muerto sumo", "Cadena posterior", "Barra"),
  ex("Hiperextensiones", "Cadena posterior", "Peso corporal"),
  ex("Encogimientos con mancuernas", "Trapecio", "Mancuernas"),
  // Hombros
  ex("Press militar con barra", "Hombros", "Barra"),
  ex("Press Arnold", "Hombros", "Mancuernas"),
  ex("Elevaciones frontales", "Hombros", "Mancuernas"),
  ex("Pajaros con mancuernas", "Hombros", "Mancuernas"),
  ex("Remo al menton", "Hombros", "Barra"),
  // Biceps
  ex("Curl alterno con mancuernas", "Biceps", "Mancuernas"),
  ex("Curl inclinado con mancuernas", "Biceps", "Mancuernas"),
  ex("Curl predicador", "Biceps", "Barra"),
  ex("Curl concentrado", "Biceps", "Mancuernas"),
  ex("Curl en polea baja", "Biceps", "Polea"),
  // Triceps
  ex("Press frances con barra", "Triceps", "Barra"),
  ex("Extension de triceps sobre cabeza", "Triceps", "Mancuernas"),
  ex("Extension de triceps con cuerda", "Triceps", "Polea"),
  ex("Patada de triceps", "Triceps", "Mancuernas"),
  // Piernas / gluteos
  ex("Prensa de piernas", "Piernas", "Maquina"),
  ex("Sentadilla goblet", "Piernas", "Mancuernas"),
  ex("Sentadilla bulgara", "Piernas", "Mancuernas"),
  ex("Sentadilla hack", "Piernas", "Maquina"),
  ex("Zancadas caminando", "Piernas", "Mancuernas"),
  ex("Step-up con mancuernas", "Piernas", "Mancuernas"),
  ex("Peso muerto rumano con barra", "Isquios", "Barra"),
  ex("Buenos dias", "Isquios", "Barra"),
  ex("Hip thrust con barra", "Gluteos", "Barra"),
  ex("Curl femoral tumbado", "Isquios", "Maquina"),
  ex("Gemelos sentado", "Gemelos", "Maquina"),
  ex("Abduccion de cadera en maquina", "Gluteos", "Maquina"),
  ex("Kettlebell swing", "Cadena posterior", "Kettlebell"),
  // Core
  ex("Rueda abdominal", "Core", "Peso corporal"),
  ex("Crunch en polea", "Core", "Polea"),
  ex("Plancha con peso", "Core", "Peso corporal"),
  ex("Elevacion de piernas colgado", "Core", "Peso corporal"),
  ex("Farmer walk", "Core", "Mancuernas"),
];

