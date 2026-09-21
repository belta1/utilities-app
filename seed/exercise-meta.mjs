// Per-exercise reference material shown on the training cards: the load ladder
// (INICIO / SEM_06 + a note) and the execution detail (muscles, steps, common error).
// Keyed by exercise name; both are refreshed into the `exercises` row on every start,
// so a figure or a cue edited here ships with the next deploy. Because they live on the
// exercise and not on the plan slot, swapping an exercise in the plan brings its image,
// its load ladder and its detail along with it.
export const EXERCISE_LOADS = {
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
