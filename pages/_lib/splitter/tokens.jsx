// Design tokens for /splitter (cuentas de restaurante). Same keys as recomp/tokens.jsx so
// widgets stay shareable; different values: grafito frio + ambar de marcador, y papel
// termico para la boleta.
export const T = {
  bg:      "#131517",   // grafito frio
  surface: "#1A1D20",
  raised:  "#22262A",
  line:    "#2B3035",
  copper:  "#E9B44C",   // ambar: acento primario (marcador sobre la boleta)
  ember:   "#E07A5F",   // deuda pendiente
  steel:   "#7DA7C7",   // personas
  sage:    "#8FC7A4",   // pagado / al dia
  gold:    "#F5D98B",
  lilac:   "#B58BC9",
  bone:    "#EDE6D6",   // texto principal; tambien el papel de la boleta
  ash:     "#8C8A80",
  faint:   "#52534C",
};

// Only the boleta uses ink-on-paper colors.
export const PAPER = {
  bg:    "#EDE6D6",
  ink:   "#2A2722",
  soft:  "#7A7368",
  rule:  "#C9C0AE",
  stamp: "#B8453A",     // sello PAGADO
};
