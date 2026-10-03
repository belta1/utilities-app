// Design tokens for every recomp page — "Goma y tiza": rubber-floor slate, chalk text, and the
// competition-plate colors (IWF: red 25, blue 20, yellow 15, green 10) as the movement-pattern
// accents, so a color always means the same thing: red empuje, blue halar, yellow pierna,
// green core / done. Keys are semantic; the old ones (copper, gold, sage…) are kept as aliases
// so nothing that still reads them breaks.

const push = "#EF4B4B";   // disco rojo — empuje
const pull = "#4C8DF6";   // disco azul — halar
const legs = "#F4C431";   // disco amarillo — pierna
const core = "#3CBF7C";   // disco verde — core, completado

export const T = {
  bg:      "#15191C",   // goma de piso
  surface: "#1D2226",
  raised:  "#262D32",
  line:    "#323A40",
  bone:    "#EEEBE5",   // tiza: texto principal
  ash:     "#9AA3AA",   // texto secundario
  faint:   "#5E6970",   // deshabilitado, placeholders
  push, pull, legs, core,
  cardio:   "#9FB4C4",
  recovery: "#B79BE0",
  danger:   "#FF7A7A",
  // aliases of the previous palette
  copper: push, ember: "#B83636", steel: "#9FB4C4", sage: core, gold: legs, lilac: "#B79BE0",
};

// Accent of a movement pattern ("push" | "pull" | "legs" | "core" | "cardio" | "recovery").
export const patternColor = (p) => T[p] ?? T.ash;

// Joint colors used inside the exercise figures.
export const J = {
  shoulder: "#F4C431", // hombro
  elbow:    "#EF4B4B", // codo
  knee:     "#4C8DF6", // rodilla
  hip:      "#B79BE0", // cadera
  wrist:    "#3CBF7C", // mano / pesa
};

// One family, two widths: Archivo for text, its condensed cut for numbers and session names.
export const FONT = "'Archivo',system-ui,sans-serif";
export const NUM = { fontFamily: FONT, fontStretch: "75%", fontWeight: 800, fontVariantNumeric: "tabular-nums", letterSpacing: 0 };
