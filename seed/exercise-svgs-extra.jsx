// Animated figures for the exercises that had no figure of their own in recomp_v2.
// Same look as seed/exercise-svgs.jsx (100x80 box, floor line, stroke `c`, joint dots),
// but limbs tween between two poses with SMIL <animate>, so hands stay on bars and feet
// stay on the floor. `c` is currentColor at seed time; the UI tints via CSS `color`.

const J = { shoulder: "#F2C14E", elbow: "#E0853C", knee: "#7DA7C7", hip: "#B58BC9", wrist: "#9CB380" };
const FR = "#3A332B"; // frames, benches, floor
const BG = "#14110F";
const SPL = "0.45 0 0.55 1"; // ease-in-out

// Helpers are built per figure so every animation in it shares one duration.
function helpers(dur) {
  const tween = (attr, a, b) => (
    <animate attributeName={attr} values={`${a};${b};${a}`} dur={`${dur}s`} repeatCount="indefinite"
      calcMode="spline" keySplines={`${SPL};${SPL}`} keyTimes="0;0.5;1" />
  );
  const Limb = ({ a, b, c, w = 2.6, o }) => (
    <polyline points={a} fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" opacity={o}>
      {b && tween("points", a, b)}
    </polyline>
  );
  const Joint = ({ a, b, type, r = 3 }) => (
    <circle cx={a[0]} cy={a[1]} r={r} fill={J[type]} opacity="0.95">
      {b && tween("cx", a[0], b[0])}{b && tween("cy", a[1], b[1])}
    </circle>
  );
  const Head = ({ a, b, c, r = 5 }) => (
    <circle cx={a[0]} cy={a[1]} r={r} fill={c} opacity="0.85">
      {b && tween("cx", a[0], b[0])}{b && tween("cy", a[1], b[1])}
    </circle>
  );
  const Move = ({ dx = 0, dy = 0, children }) => (
    <g>
      <animateTransform attributeName="transform" type="translate" values={`0 0;${dx} ${dy};0 0`} dur={`${dur}s`}
        repeatCount="indefinite" calcMode="spline" keySplines={`${SPL};${SPL}`} keyTimes="0;0.5;1" />
      {children}
    </g>
  );
  const Rot = ({ deg, x, y, children }) => (
    <g>
      <animateTransform attributeName="transform" type="rotate" values={`0 ${x} ${y};${deg} ${x} ${y};0 ${x} ${y}`} dur={`${dur}s`}
        repeatCount="indefinite" calcMode="spline" keySplines={`${SPL};${SPL}`} keyTimes="0;0.5;1" />
      {children}
    </g>
  );
  const Disc = ({ a, b, c, r = 4.5 }) => (
    <circle cx={a[0]} cy={a[1]} r={r} fill={BG} stroke={c} strokeWidth="1.6">
      {b && tween("cx", a[0], b[0])}{b && tween("cy", a[1], b[1])}
    </circle>
  );
  return { tween, Limb, Joint, Head, Move, Rot, Disc };
}

// Static bits
const Floor = () => <line x1="8" y1="72" x2="92" y2="72" stroke={FR} strokeWidth="2" />;
const Frame = ({ d, w = 2.5 }) => <polyline points={d} fill="none" stroke={FR} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />;
const Bench = ({ x = 50, y = 56, w = 46 }) => (
  <>
    <line x1={x - w / 2} y1={y} x2={x + w / 2} y2={y} stroke={FR} strokeWidth="4" strokeLinecap="round" />
    <line x1={x - w / 2 + 6} y1={y} x2={x - w / 2 + 6} y2={72} stroke={FR} strokeWidth="2" />
    <line x1={x + w / 2 - 6} y1={y} x2={x + w / 2 - 6} y2={72} stroke={FR} strokeWidth="2" />
  </>
);
const Pulley = ({ x, y }) => <circle cx={x} cy={y} r="3" fill={BG} stroke={FR} strokeWidth="2" />;
const Cable = ({ a, b, tween }) => (
  <polyline points={a} fill="none" stroke="#6B5F52" strokeWidth="1.3" strokeDasharray="3 2">{b && tween("points", a, b)}</polyline>
);
// Front-view barbell: bar + rectangular plates
const BarF = ({ x, y, w, c }) => (
  <>
    <line x1={x - w / 2} y1={y} x2={x + w / 2} y2={y} stroke={c} strokeWidth="2.4" strokeLinecap="round" />
    <rect x={x - w / 2 - 1} y={y - 6} width="4" height="12" rx="1.2" fill={c} />
    <rect x={x + w / 2 - 3} y={y - 6} width="4" height="12" rx="1.2" fill={c} />
  </>
);
// Dumbbell, rotated `a` degrees (0 = horizontal)
const DB = ({ x, y, c, a = 0 }) => (
  <g transform={`rotate(${a} ${x} ${y})`}>
    <line x1={x - 5} y1={y} x2={x + 5} y2={y} stroke={c} strokeWidth="2" />
    <rect x={x - 6} y={y - 3.5} width="3" height="7" rx="1" fill={c} />
    <rect x={x + 3} y={y - 3.5} width="3" height="7" rx="1" fill={c} />
  </g>
);
const Pad = ({ x, y, w, h, a = 0 }) => <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx="1.5" fill={FR} transform={a ? `rotate(${a} ${x} ${y})` : undefined} />;

// ── figures ──────────────────────────────────────────────────────
// Each: { dur?, draw({ c, Limb, Joint, Head, Move, Rot, Disc, tween }) }
const FIGS = {
  // ═══ CORE ═══════════════════════════════════════════════════════
  flexiones: { draw: ({ c, Limb, Joint, Head }) => (
    <>
      <Floor />
      <Head c={c} a={[19, 39]} b={[19, 50]} />
      <Limb c={c} a="28,42 84,70" b="28,53 84,70" w={3} />
      <Limb c={c} a="28,42 27,56 26,70" b="28,53 40,62 26,70" w={2.2} />
      <Joint type="shoulder" a={[28, 42]} b={[28, 53]} />
      <Joint type="elbow" a={[27, 56]} b={[40, 62]} r={2.5} />
      <Joint type="hip" a={[56, 56]} b={[56, 61]} />
      <Joint type="knee" a={[70, 63]} b={[70, 66]} r={2.5} />
    </>
  ) },
  plancha_frontal: { dur: 3.2, draw: ({ c, Limb, Joint, Head }) => (
    <>
      <Floor />
      <Head c={c} a={[17, 42]} b={[17, 40]} />
      <Limb c={c} a="26,46 84,70" b="26,44 84,70" w={3} />
      <Limb c={c} a="26,46 24,70 10,70" b="26,44 24,70 10,70" w={2.2} />
      <Joint type="shoulder" a={[26, 46]} b={[26, 44]} />
      <Joint type="elbow" a={[24, 70]} r={2.5} />
      <Joint type="hip" a={[55, 58]} b={[55, 57]} />
      <Joint type="knee" a={[70, 64]} r={2.5} />
    </>
  ) },
  plancha_con_peso: { dur: 3.2, draw: ({ c, Limb, Joint, Head }) => (
    <>
      <Floor />
      <Head c={c} a={[17, 42]} b={[17, 40]} />
      <Limb c={c} a="26,46 84,70" b="26,44 84,70" w={3} />
      <Limb c={c} a="26,46 24,70 10,70" b="26,44 24,70 10,70" w={2.2} />
      <rect x="38" y="45" width="13" height="4.5" rx="1" fill={c} transform="rotate(22 44 47)" />
      <Joint type="shoulder" a={[26, 46]} b={[26, 44]} />
      <Joint type="elbow" a={[24, 70]} r={2.5} />
      <Joint type="hip" a={[55, 58]} b={[55, 57]} />
      <Joint type="knee" a={[70, 64]} r={2.5} />
    </>
  ) },
  plancha_lateral: { dur: 3, draw: ({ c, Limb, Joint, Head }) => (
    <>
      <Floor />
      <Head c={c} a={[22, 35]} />
      <Limb c={c} a="28,42 56,56 84,70" b="28,42 56,60 84,70" w={3} />
      <Limb c={c} a="28,42 24,70 38,70" w={2.2} />
      <Limb c={c} a="28,42 30,18" w={2.2} />
      <Joint type="shoulder" a={[28, 42]} />
      <Joint type="elbow" a={[24, 70]} r={2.5} />
      <Joint type="hip" a={[56, 56]} b={[56, 60]} />
      <Joint type="knee" a={[70, 63]} b={[70, 65]} r={2.5} />
    </>
  ) },
  crunch_bicicleta: { dur: 1.8, draw: ({ c, Limb, Joint, Head }) => (
    <>
      <Floor />
      <Head c={c} a={[17, 62]} b={[21, 50]} />
      <Limb c={c} a="46,66 24,64" b="46,66 27,53" w={3} />
      <Limb c={c} a="24,64 14,58 20,54" b="27,53 17,47 23,43" w={2} />
      <Limb c={c} a="46,66 56,50 68,58" b="46,66 66,60 86,56" w={2.6} />
      <Limb c={c} a="46,66 66,60 86,56" b="46,66 56,50 68,58" w={2.6} o="0.6" />
      <Joint type="shoulder" a={[25, 63]} b={[28, 52]} />
      <Joint type="hip" a={[46, 66]} />
      <Joint type="knee" a={[56, 50]} b={[66, 60]} />
      <Joint type="knee" a={[66, 60]} b={[56, 50]} r={2.5} />
    </>
  ) },
  crunch_clasico: { draw: ({ c, Limb, Joint, Head }) => (
    <>
      <Floor />
      <Head c={c} a={[15, 62]} b={[23, 46]} />
      <Limb c={c} a="46,66 22,64" b="46,66 28,50" w={3} />
      <Limb c={c} a="30,63 37,58" b="35,52 43,50" w={2} />
      <Limb c={c} a="46,66 60,50 74,70" w={2.6} />
      <Joint type="shoulder" a={[24, 64]} b={[29, 51]} />
      <Joint type="hip" a={[46, 66]} />
      <Joint type="knee" a={[60, 50]} />
    </>
  ) },
  dead_bug: { dur: 2.6, draw: ({ c, Limb, Joint, Head }) => (
    <>
      <Floor />
      <Head c={c} a={[15, 66]} />
      <Limb c={c} a="22,66 50,66" w={3} />
      <Limb c={c} a="50,66 60,52 74,54" w={2.6} o="0.55" />
      <Limb c={c} a="50,66 58,50 74,50" b="50,66 66,58 86,62" w={2.6} />
      <Limb c={c} a="24,66 24,44" b="24,66 8,50" w={2.2} />
      <Joint type="shoulder" a={[24, 66]} />
      <Joint type="wrist" a={[24, 44]} b={[8, 50]} r={2.5} />
      <Joint type="hip" a={[50, 66]} />
      <Joint type="knee" a={[58, 50]} b={[66, 58]} />
    </>
  ) },
  elevacion_de_piernas_tumbado: { dur: 2.6, draw: ({ c, Limb, Joint, Head }) => (
    <>
      <Floor />
      <Head c={c} a={[15, 66]} />
      <Limb c={c} a="22,66 50,66" w={3} />
      <Limb c={c} a="22,66 34,70" w={1.8} />
      <Limb c={c} a="50,64 86,64" b="50,64 60,30" w={2.6} o="0.6" />
      <Limb c={c} a="50,66 86,66" b="50,66 62,32" w={2.6} />
      <Joint type="shoulder" a={[24, 66]} />
      <Joint type="hip" a={[50, 66]} />
      <Joint type="knee" a={[68, 66]} b={[56, 49]} />
    </>
  ) },
  russian_twist: { dur: 1.8, draw: ({ c, Limb, Joint, Head, Move }) => (
    <>
      <Floor />
      <Head c={c} a={[50, 32]} />
      <Limb c={c} a="50,66 50,40" w={3} />
      <Limb c={c} a="50,66 40,52 36,60" w={2.6} />
      <Limb c={c} a="50,66 60,52 64,60" w={2.6} />
      <Limb c={c} a="50,44 28,52" b="50,44 72,52" w={2.2} />
      <Move dx={44}><DB c={c} x={26} y={52} a={90} /></Move>
      <Joint type="shoulder" a={[50, 44]} />
      <Joint type="wrist" a={[28, 52]} b={[72, 52]} r={2.5} />
      <Joint type="hip" a={[50, 66]} />
      <Joint type="knee" a={[40, 52]} r={2.5} />
      <Joint type="knee" a={[60, 52]} r={2.5} />
    </>
  ) },
  superman: { dur: 2.6, draw: ({ c, Limb, Joint, Head }) => (
    <>
      <Floor />
      <Head c={c} a={[29, 65]} b={[28, 59]} />
      <Limb c={c} a="36,66 62,66" w={3} />
      <Limb c={c} a="36,66 12,66" b="36,66 12,56" w={2.2} />
      <Limb c={c} a="62,64 88,64" b="62,64 88,56" w={2.6} o="0.6" />
      <Limb c={c} a="62,66 88,66" b="62,66 88,58" w={2.6} />
      <Joint type="shoulder" a={[36, 66]} />
      <Joint type="hip" a={[62, 66]} />
      <Joint type="knee" a={[75, 66]} b={[75, 62]} r={2.5} />
    </>
  ) },
  elevacion_de_piernas_colgado: { dur: 2.6, draw: ({ c, Limb, Joint, Head }) => (
    <>
      <Frame d="28,8 72,8" w={3} />
      <Head c={c} a={[50, 15]} r={4} />
      <Limb c={c} a="42,8 50,22" w={2.2} />
      <Limb c={c} a="58,8 50,22" w={2.2} />
      <Limb c={c} a="50,20 50,46" w={3} />
      <Limb c={c} a="48,46 48,72" b="48,46 74,42" w={2.6} o="0.6" />
      <Limb c={c} a="52,46 52,72" b="52,46 78,46" w={2.6} />
      <Joint type="wrist" a={[42, 8]} r={2.5} />
      <Joint type="wrist" a={[58, 8]} r={2.5} />
      <Joint type="shoulder" a={[50, 22]} />
      <Joint type="hip" a={[50, 46]} />
      <Joint type="knee" a={[52, 59]} b={[65, 45]} />
    </>
  ) },
  rueda_abdominal: { dur: 2.6, draw: ({ c, Limb, Joint, Head }) => (
    <>
      <Floor />
      <Head c={c} a={[37, 36]} b={[30, 46]} />
      <Limb c={c} a="66,70 86,70" w={2.6} />
      <Limb c={c} a="66,70 60,50" b="66,70 64,52" w={2.6} />
      <Limb c={c} a="60,50 40,42" b="64,52 34,52" w={3} />
      <Limb c={c} a="40,42 22,60" b="34,52 12,64" w={2.2} />
      <circle cx="20" cy="66" r="5.5" fill={BG} stroke={c} strokeWidth="2">
        <animate attributeName="cx" values="20;10;20" dur="2.6s" repeatCount="indefinite" calcMode="spline" keySplines={`${SPL};${SPL}`} keyTimes="0;0.5;1" />
      </circle>
      <Joint type="knee" a={[66, 70]} />
      <Joint type="hip" a={[60, 50]} b={[64, 52]} />
      <Joint type="shoulder" a={[40, 42]} b={[34, 52]} />
      <Joint type="wrist" a={[22, 60]} b={[12, 64]} r={2.5} />
    </>
  ) },
  crunch_en_polea: { draw: ({ c, Limb, Joint, Head, tween }) => (
    <>
      <Floor />
      <Frame d="86,6 86,72" />
      <Pulley x={86} y={8} />
      <Cable tween={tween} a="86,8 66,28" b="86,8 72,40" />
      <Head c={c} a={[60, 27]} b={[66, 44]} />
      <Limb c={c} a="44,70 24,70" w={2.6} />
      <Limb c={c} a="44,70 46,52" w={2.6} />
      <Limb c={c} a="46,52 56,32" b="46,52 62,44" w={3} />
      <Limb c={c} a="56,32 66,28" b="62,44 72,40" w={2.2} />
      <Joint type="knee" a={[44, 70]} />
      <Joint type="hip" a={[46, 52]} />
      <Joint type="shoulder" a={[56, 32]} b={[62, 44]} />
      <Joint type="wrist" a={[66, 28]} b={[72, 40]} r={2.5} />
    </>
  ) },
  farmer_walk: { dur: 1.6, draw: ({ c, Limb, Joint, Head }) => (
    <>
      <Floor />
      <Head c={c} a={[50, 12]} />
      <Limb c={c} a="50,18 50,44" w={3} />
      <Limb c={c} a="50,22 40,50" w={2.2} />
      <Limb c={c} a="50,22 60,50" w={2.2} />
      <DB c={c} x={39} y={53} a={90} />
      <DB c={c} x={61} y={53} a={90} />
      <Limb c={c} a="50,44 44,58 40,72" b="50,44 52,58 56,72" w={2.6} />
      <Limb c={c} a="50,44 56,58 60,72" b="50,44 48,58 44,72" w={2.6} o="0.6" />
      <Joint type="shoulder" a={[50, 22]} />
      <Joint type="wrist" a={[40, 50]} r={2.5} />
      <Joint type="wrist" a={[60, 50]} r={2.5} />
      <Joint type="hip" a={[50, 44]} />
      <Joint type="knee" a={[44, 58]} b={[52, 58]} />
    </>
  ) },

  // ═══ PECHO ══════════════════════════════════════════════════════
  press_banca_con_mancuernas: { draw: ({ c, Limb, Joint, Head, Move }) => (
    <>
      <Bench x={50} y={56} w={52} />
      <Floor />
      <Head c={c} a={[26, 50]} r={4.5} />
      <Limb c={c} a="32,50 66,50" w={3} />
      <Limb c={c} a="66,50 78,60 80,72" w={2.6} />
      <Limb c={c} a="39,50 39,38 39,26" b="39,50 49,44 41,38" w={2.2} o="0.6" />
      <Limb c={c} a="35,50 35,38 35,26" b="35,50 45,44 37,38" w={2.2} />
      <Move dx={2} dy={12}><DB c={c} x={35} y={24} /><DB c={c} x={41} y={24} /></Move>
      <Joint type="shoulder" a={[36, 50]} />
      <Joint type="elbow" a={[35, 38]} b={[45, 44]} r={2.5} />
      <Joint type="hip" a={[66, 50]} />
      <Joint type="knee" a={[78, 60]} />
    </>
  ) },
  press_declinado_con_barra: { draw: ({ c, Limb, Joint, Head, Move, Disc }) => (
    <>
      <Frame d="22,60 78,50" w={4} />
      <Frame d="30,59 30,72" /><Frame d="70,51 70,72" />
      <Floor />
      <Head c={c} a={[24, 54]} r={4.5} />
      <Limb c={c} a="30,54 66,48" w={3} />
      <Limb c={c} a="66,48 76,56 78,72" w={2.6} />
      <Limb c={c} a="36,53 36,40 38,28" b="36,53 46,48 40,40" w={2.2} />
      <Disc c={c} a={[38, 28]} b={[40, 40]} />
      <Joint type="shoulder" a={[36, 53]} />
      <Joint type="elbow" a={[36, 40]} b={[46, 48]} r={2.5} />
      <Joint type="hip" a={[66, 48]} />
      <Joint type="knee" a={[76, 56]} />
    </>
  ) },
  press_cerrado_en_banca: { draw: ({ c, Limb, Joint, Head, Disc }) => (
    <>
      <Bench x={50} y={56} w={52} />
      <Floor />
      <Head c={c} a={[26, 50]} r={4.5} />
      <Limb c={c} a="32,50 66,50" w={3} />
      <Limb c={c} a="66,50 78,60 80,72" w={2.6} />
      <Limb c={c} a="36,50 36,38 36,26" b="36,50 44,46 38,36" w={2.2} />
      <Disc c={c} a={[36, 26]} b={[38, 36]} />
      <Joint type="shoulder" a={[36, 50]} />
      <Joint type="elbow" a={[36, 38]} b={[44, 46]} r={2.5} />
      <Joint type="hip" a={[66, 50]} />
      <Joint type="knee" a={[78, 60]} />
    </>
  ) },
  cruce_de_poleas: { draw: ({ c, Limb, Joint, Head, tween }) => (
    <>
      <Floor />
      <Frame d="10,6 10,72" /><Frame d="90,6 90,72" />
      <Pulley x={10} y={10} /><Pulley x={90} y={10} />
      <Cable tween={tween} a="10,10 18,12" b="10,10 48,46" />
      <Cable tween={tween} a="90,10 82,12" b="90,10 52,46" />
      <Head c={c} a={[50, 12]} />
      <Limb c={c} a="50,18 50,44" w={3} />
      <Limb c={c} a="50,44 44,72" w={2.6} /><Limb c={c} a="50,44 56,72" w={2.6} />
      <Limb c={c} a="50,22 32,18 18,12" b="50,22 34,34 48,46" w={2.2} />
      <Limb c={c} a="50,22 68,18 82,12" b="50,22 66,34 52,46" w={2.2} />
      <Joint type="shoulder" a={[50, 22]} />
      <Joint type="elbow" a={[32, 18]} b={[34, 34]} r={2.5} />
      <Joint type="elbow" a={[68, 18]} b={[66, 34]} r={2.5} />
      <Joint type="wrist" a={[18, 12]} b={[48, 46]} r={2.5} />
      <Joint type="wrist" a={[82, 12]} b={[52, 46]} r={2.5} />
      <Joint type="hip" a={[50, 44]} />
    </>
  ) },
  pec_deck: { draw: ({ c, Limb, Joint, Head, tween }) => (
    <>
      <Floor />
      <Frame d="38,54 62,54" w={4} /><Frame d="50,54 50,72" />
      <Head c={c} a={[50, 12]} />
      <Limb c={c} a="50,18 50,52" w={3} />
      <Limb c={c} a="50,52 40,60 38,72" w={2.6} /><Limb c={c} a="50,52 60,60 62,72" w={2.6} />
      <rect x="24" y="4" width="8" height="20" rx="2" fill={FR}><animate attributeName="x" values="24;38;24" dur="2.4s" repeatCount="indefinite" calcMode="spline" keySplines={`${SPL};${SPL}`} keyTimes="0;0.5;1" /></rect>
      <rect x="68" y="4" width="8" height="20" rx="2" fill={FR}><animate attributeName="x" values="68;54;68" dur="2.4s" repeatCount="indefinite" calcMode="spline" keySplines={`${SPL};${SPL}`} keyTimes="0;0.5;1" /></rect>
      <Limb c={c} a="50,22 28,22 28,6" b="50,22 42,24 42,8" w={2.2} />
      <Limb c={c} a="50,22 72,22 72,6" b="50,22 58,24 58,8" w={2.2} />
      <Joint type="shoulder" a={[50, 22]} />
      <Joint type="elbow" a={[28, 22]} b={[42, 24]} r={2.5} />
      <Joint type="elbow" a={[72, 22]} b={[58, 24]} r={2.5} />
      <Joint type="hip" a={[50, 52]} />
    </>
  ) },
  fondos_en_paralelas: { draw: ({ c, Limb, Joint, Head }) => (
    <>
      <Frame d="30,30 30,72" w={3} /><Frame d="70,30 70,72" w={3} />
      <Frame d="22,30 38,30" w={3} /><Frame d="62,30 78,30" w={3} />
      <Head c={c} a={[50, 18]} b={[50, 28]} />
      <Limb c={c} a="50,24 50,46" b="50,34 50,56" w={3} />
      <Limb c={c} a="50,46 44,58 48,66" b="50,56 44,68 48,74" w={2.6} />
      <Limb c={c} a="30,30 40,28 50,24" b="30,30 28,44 50,34" w={2.2} />
      <Limb c={c} a="70,30 60,28 50,24" b="70,30 72,44 50,34" w={2.2} />
      <Joint type="wrist" a={[30, 30]} r={2.5} /><Joint type="wrist" a={[70, 30]} r={2.5} />
      <Joint type="elbow" a={[40, 28]} b={[28, 44]} r={2.5} />
      <Joint type="elbow" a={[60, 28]} b={[72, 44]} r={2.5} />
      <Joint type="shoulder" a={[50, 24]} b={[50, 34]} />
      <Joint type="hip" a={[50, 46]} b={[50, 56]} />
    </>
  ) },

  // ═══ ESPALDA ════════════════════════════════════════════════════
  dominadas: { draw: ({ c, Limb, Joint, Head }) => (
    <>
      <Frame d="26,8 74,8" w={3} />
      <Head c={c} a={[50, 20]} b={[50, 8]} r={4.5} />
      <Limb c={c} a="50,26 50,50" b="50,14 50,38" w={3} />
      <Limb c={c} a="50,50 46,62 54,68" b="50,38 46,50 54,56" w={2.6} />
      <Limb c={c} a="40,8 44,18 50,26" b="40,8 34,18 50,14" w={2.2} />
      <Limb c={c} a="60,8 56,18 50,26" b="60,8 66,18 50,14" w={2.2} />
      <Joint type="wrist" a={[40, 8]} r={2.5} /><Joint type="wrist" a={[60, 8]} r={2.5} />
      <Joint type="elbow" a={[44, 18]} b={[34, 18]} r={2.5} />
      <Joint type="elbow" a={[56, 18]} b={[66, 18]} r={2.5} />
      <Joint type="shoulder" a={[50, 26]} b={[50, 14]} />
      <Joint type="hip" a={[50, 50]} b={[50, 38]} />
    </>
  ) },
  jalon_dorsal_agarre_cerrado: { draw: ({ c, Limb, Joint, Head, tween }) => (
    <>
      <Floor />
      <Frame d="84,6 84,72" /><Pulley x={84} y={8} />
      <Frame d="40,56 66,56" w={4} /><Frame d="44,46 60,46" w={3} />
      <Cable tween={tween} a="84,8 54,10" b="84,8 58,30" />
      <Head c={c} a={[51, 22]} />
      <Limb c={c} a="56,56 52,30" w={3} />
      <Limb c={c} a="56,56 72,58 74,72" w={2.6} />
      <Limb c={c} a="52,30 54,20 54,10" b="52,30 66,36 58,30" w={2.2} />
      <Joint type="hip" a={[56, 56]} />
      <Joint type="knee" a={[72, 58]} />
      <Joint type="shoulder" a={[52, 30]} />
      <Joint type="elbow" a={[54, 20]} b={[66, 36]} r={2.5} />
      <Joint type="wrist" a={[54, 10]} b={[58, 30]} r={2.5} />
    </>
  ) },
  remo_en_polea_baja: { draw: ({ c, Limb, Joint, Head, tween }) => (
    <>
      <Floor />
      <Frame d="80,36 80,72" /><Pulley x={80} y={42} />
      <Frame d="74,48 78,60" w={3} />
      <Cable tween={tween} a="80,42 58,42" b="80,42 44,48" />
      <Head c={c} a={[32, 24]} />
      <Limb c={c} a="40,58 34,32" w={3} />
      <Limb c={c} a="40,58 62,54 76,54" w={2.6} />
      <Limb c={c} a="34,36 46,40 58,42" b="34,36 26,46 44,48" w={2.2} />
      <Joint type="hip" a={[40, 58]} />
      <Joint type="knee" a={[62, 54]} />
      <Joint type="shoulder" a={[34, 36]} />
      <Joint type="elbow" a={[46, 40]} b={[26, 46]} r={2.5} />
      <Joint type="wrist" a={[58, 42]} b={[44, 48]} r={2.5} />
    </>
  ) },
  remo_en_maquina: { draw: ({ c, Limb, Joint, Head }) => (
    <>
      <Floor />
      <Frame d="40,56 64,56" w={4} /><Frame d="52,56 52,72" />
      <Pad x={45} y={40} w={4} h={22} />
      <Frame d="80,28 80,64" /><Frame d="72,38 80,38" />
      <Head c={c} a={[49, 24]} />
      <Limb c={c} a="54,56 50,32" w={3} />
      <Limb c={c} a="54,56 70,60 72,72" w={2.6} />
      <Limb c={c} a="50,34 62,36 72,38" b="50,34 38,46 50,48" w={2.2} />
      <Joint type="hip" a={[54, 56]} />
      <Joint type="knee" a={[70, 60]} />
      <Joint type="shoulder" a={[50, 34]} />
      <Joint type="elbow" a={[62, 36]} b={[38, 46]} r={2.5} />
      <Joint type="wrist" a={[72, 38]} b={[50, 48]} r={2.5} />
    </>
  ) },
  remo_pendlay: { draw: ({ c, Limb, Joint, Head, Disc }) => (
    <>
      <Floor />
      <Head c={c} a={[18, 40]} />
      <Limb c={c} a="46,72 48,56 52,44" w={2.6} /><Limb c={c} a="54,72 56,56 52,44" w={2.6} o="0.6" />
      <Limb c={c} a="52,44 24,42" w={3} />
      <Limb c={c} a="26,44 26,56 26,68" b="26,44 34,52 26,50" w={2.2} />
      <Disc c={c} a={[26, 68]} b={[26, 50]} />
      <Joint type="knee" a={[48, 56]} />
      <Joint type="hip" a={[52, 44]} />
      <Joint type="shoulder" a={[26, 44]} />
      <Joint type="elbow" a={[26, 56]} b={[34, 52]} r={2.5} />
    </>
  ) },
  pull_over_en_polea: { draw: ({ c, Limb, Joint, Head, tween }) => (
    <>
      <Floor />
      <Frame d="86,6 86,72" /><Pulley x={86} y={8} />
      <Cable tween={tween} a="86,8 62,10" b="86,8 62,46" />
      <Head c={c} a={[37, 17]} />
      <Limb c={c} a="44,72 46,56 48,44" w={2.6} /><Limb c={c} a="52,72 54,56 48,44" w={2.6} o="0.6" />
      <Limb c={c} a="48,44 40,24" w={3} />
      <Limb c={c} a="40,26 62,10" b="40,26 62,46" w={2.2} />
      <Joint type="knee" a={[46, 56]} />
      <Joint type="hip" a={[48, 44]} />
      <Joint type="shoulder" a={[40, 26]} />
      <Joint type="wrist" a={[62, 10]} b={[62, 46]} r={2.5} />
    </>
  ) },
  peso_muerto_sumo: { draw: ({ c, Limb, Joint, Head, Move }) => (
    <>
      <Floor />
      <Head c={c} a={[50, 18]} b={[50, 8]} />
      <Limb c={c} a="50,44 50,24" b="50,34 50,14" w={3} />
      <Limb c={c} a="50,44 30,56 26,72" b="50,34 30,54 26,72" w={2.6} />
      <Limb c={c} a="50,44 70,56 74,72" b="50,34 70,54 74,72" w={2.6} />
      <Limb c={c} a="48,26 46,60" b="48,16 46,50" w={2.2} />
      <Limb c={c} a="52,26 54,60" b="52,16 54,50" w={2.2} />
      <Move dy={-10}><BarF c={c} x={50} y={60} w={64} /></Move>
      <Joint type="shoulder" a={[50, 26]} b={[50, 16]} />
      <Joint type="hip" a={[50, 44]} b={[50, 34]} />
      <Joint type="knee" a={[30, 56]} b={[30, 54]} />
      <Joint type="knee" a={[70, 56]} b={[70, 54]} />
    </>
  ) },
  hiperextensiones: { draw: ({ c, Limb, Joint, Head }) => (
    <>
      <Floor />
      <Frame d="20,70 44,42" w={4} /><Frame d="44,42 44,72" /><Frame d="14,64 26,68" w={3} />
      <Head c={c} a={[66, 66]} b={[76, 34]} />
      <Limb c={c} a="22,66 44,42" w={2.6} />
      <Limb c={c} a="44,42 62,60" b="44,42 70,36" w={3} />
      <Limb c={c} a="52,50 58,46" b="56,38 62,36" w={2} />
      <Joint type="knee" a={[32, 55]} r={2.5} />
      <Joint type="hip" a={[44, 42]} />
      <Joint type="shoulder" a={[60, 58]} b={[68, 38]} />
    </>
  ) },
  encogimientos_con_mancuernas: { dur: 2, draw: ({ c, Limb, Joint, Head, Move }) => (
    <>
      <Floor />
      <Head c={c} a={[50, 12]} b={[50, 10]} />
      <Limb c={c} a="50,18 50,44" w={3} />
      <Limb c={c} a="50,44 44,72" w={2.6} /><Limb c={c} a="50,44 56,72" w={2.6} />
      <Limb c={c} a="50,22 38,50" b="50,19 38,47" w={2.2} />
      <Limb c={c} a="50,22 62,50" b="50,19 62,47" w={2.2} />
      <Move dy={-3}><DB c={c} x={37} y={53} a={90} /><DB c={c} x={63} y={53} a={90} /></Move>
      <Joint type="shoulder" a={[50, 22]} b={[50, 19]} />
      <Joint type="wrist" a={[38, 50]} b={[38, 47]} r={2.5} />
      <Joint type="wrist" a={[62, 50]} b={[62, 47]} r={2.5} />
      <Joint type="hip" a={[50, 44]} />
    </>
  ) },

  // ═══ HOMBROS ════════════════════════════════════════════════════
  press_militar_con_barra: { draw: ({ c, Limb, Joint, Head, Move }) => (
    <>
      <Floor />
      <Head c={c} a={[50, 22]} />
      <Limb c={c} a="50,28 50,50" w={3} />
      <Limb c={c} a="50,50 44,72" w={2.6} /><Limb c={c} a="50,50 56,72" w={2.6} />
      <Limb c={c} a="50,30 34,36 36,26" b="50,30 40,16 38,4" w={2.2} />
      <Limb c={c} a="50,30 66,36 64,26" b="50,30 60,16 62,4" w={2.2} />
      <Move dy={-22}><BarF c={c} x={50} y={26} w={52} /></Move>
      <Joint type="shoulder" a={[50, 30]} />
      <Joint type="elbow" a={[34, 36]} b={[40, 16]} r={2.5} />
      <Joint type="elbow" a={[66, 36]} b={[60, 16]} r={2.5} />
      <Joint type="hip" a={[50, 50]} />
    </>
  ) },
  press_arnold: { draw: ({ c, Limb, Joint, Head, Move, Rot }) => (
    <>
      <Floor />
      <Frame d="36,54 64,54" w={4} /><Frame d="50,54 50,72" />
      <Head c={c} a={[50, 20]} />
      <Limb c={c} a="50,26 50,52" w={3} />
      <Limb c={c} a="50,52 40,62 38,72" w={2.6} /><Limb c={c} a="50,52 60,62 62,72" w={2.6} />
      <Limb c={c} a="50,30 40,40 44,28" b="50,30 38,18 40,4" w={2.2} />
      <Limb c={c} a="50,30 60,40 56,28" b="50,30 62,18 60,4" w={2.2} />
      <Move dx={-4} dy={-24}><Rot deg={-90} x={44} y={28}><DB c={c} x={44} y={27} a={90} /></Rot></Move>
      <Move dx={4} dy={-24}><Rot deg={90} x={56} y={28}><DB c={c} x={56} y={27} a={90} /></Rot></Move>
      <Joint type="shoulder" a={[50, 30]} />
      <Joint type="elbow" a={[40, 40]} b={[38, 18]} r={2.5} />
      <Joint type="elbow" a={[60, 40]} b={[62, 18]} r={2.5} />
      <Joint type="hip" a={[50, 52]} />
    </>
  ) },
  elevaciones_frontales: { draw: ({ c, Limb, Joint, Head, Move }) => (
    <>
      <Floor />
      <Head c={c} a={[50, 15]} />
      <Limb c={c} a="50,22 50,44" w={3} />
      <Limb c={c} a="46,72 46,58 50,44" w={2.6} /><Limb c={c} a="54,72 54,58 50,44" w={2.6} o="0.6" />
      <Limb c={c} a="50,24 52,50" b="50,24 76,26" w={2.2} />
      <Move dx={24} dy={-24}><DB c={c} x={52} y={52} a={90} /></Move>
      <Joint type="shoulder" a={[50, 24]} />
      <Joint type="wrist" a={[52, 50]} b={[76, 26]} r={2.5} />
      <Joint type="hip" a={[50, 44]} />
      <Joint type="knee" a={[46, 58]} r={2.5} />
    </>
  ) },
  pajaros_con_mancuernas: { draw: ({ c, Limb, Joint, Head, Move }) => (
    <>
      <Floor />
      <Head c={c} a={[20, 33]} />
      <Limb c={c} a="44,72 46,56 50,44" w={2.6} /><Limb c={c} a="56,72 56,56 50,44" w={2.6} o="0.6" />
      <Limb c={c} a="50,44 26,36" w={3} />
      <Limb c={c} a="30,38 20,58" b="30,38 8,40" w={2.2} />
      <Limb c={c} a="30,38 40,58" b="30,38 52,40" w={2.2} />
      <Move dx={-12} dy={-18}><DB c={c} x={20} y={60} /></Move>
      <Move dx={12} dy={-18}><DB c={c} x={40} y={60} /></Move>
      <Joint type="knee" a={[46, 56]} r={2.5} />
      <Joint type="hip" a={[50, 44]} />
      <Joint type="shoulder" a={[30, 38]} />
      <Joint type="wrist" a={[20, 58]} b={[8, 40]} r={2.5} />
      <Joint type="wrist" a={[40, 58]} b={[52, 40]} r={2.5} />
    </>
  ) },
  remo_al_menton: { draw: ({ c, Limb, Joint, Head, Move }) => (
    <>
      <Floor />
      <Head c={c} a={[50, 14]} />
      <Limb c={c} a="50,20 50,46" w={3} />
      <Limb c={c} a="50,46 44,72" w={2.6} /><Limb c={c} a="50,46 56,72" w={2.6} />
      <Limb c={c} a="50,24 46,40 44,52" b="50,24 32,24 44,22" w={2.2} />
      <Limb c={c} a="50,24 54,40 56,52" b="50,24 68,24 56,22" w={2.2} />
      <Move dy={-30}><BarF c={c} x={50} y={52} w={36} /></Move>
      <Joint type="shoulder" a={[50, 24]} />
      <Joint type="elbow" a={[46, 40]} b={[32, 24]} r={2.5} />
      <Joint type="elbow" a={[54, 40]} b={[68, 24]} r={2.5} />
      <Joint type="hip" a={[50, 46]} />
    </>
  ) },

  // ═══ BICEPS ═════════════════════════════════════════════════════
  curl_alterno_con_mancuernas: { dur: 2, draw: ({ c, Limb, Joint, Head, Move }) => (
    <>
      <Floor />
      <Head c={c} a={[50, 14]} />
      <Limb c={c} a="50,20 50,46" w={3} />
      <Limb c={c} a="50,46 44,72" w={2.6} /><Limb c={c} a="50,46 56,72" w={2.6} />
      <Limb c={c} a="50,24 42,44 40,54" b="50,24 42,44 44,26" w={2.2} />
      <Limb c={c} a="50,24 58,44 56,26" b="50,24 58,44 60,54" w={2.2} />
      <Move dx={4} dy={-28}><DB c={c} x={40} y={55} /></Move>
      <Move dx={4} dy={28}><DB c={c} x={56} y={27} /></Move>
      <Joint type="shoulder" a={[50, 24]} />
      <Joint type="elbow" a={[42, 44]} r={2.5} /><Joint type="elbow" a={[58, 44]} r={2.5} />
      <Joint type="wrist" a={[40, 54]} b={[44, 26]} r={2.5} />
      <Joint type="wrist" a={[56, 26]} b={[60, 54]} r={2.5} />
      <Joint type="hip" a={[50, 46]} />
    </>
  ) },
  curl_inclinado_con_mancuernas: { draw: ({ c, Limb, Joint, Head, Move }) => (
    <>
      <Floor />
      <Frame d="28,58 50,58" w={4} /><Frame d="50,58 70,26" w={4} /><Frame d="34,58 34,72" /><Frame d="58,50 58,72" />
      <Head c={c} a={[70, 22]} />
      <Limb c={c} a="46,58 66,28" w={3} />
      <Limb c={c} a="46,58 32,62 30,72" w={2.6} />
      <Limb c={c} a="62,32 58,46 56,60" b="62,32 58,46 64,34" w={2.2} />
      <Move dx={8} dy={-26}><DB c={c} x={56} y={62} /></Move>
      <Joint type="hip" a={[46, 58]} />
      <Joint type="knee" a={[32, 62]} r={2.5} />
      <Joint type="shoulder" a={[62, 32]} />
      <Joint type="elbow" a={[58, 46]} r={2.5} />
      <Joint type="wrist" a={[56, 60]} b={[64, 34]} r={2.5} />
    </>
  ) },
  curl_predicador: { draw: ({ c, Limb, Joint, Head, Move }) => (
    <>
      <Floor />
      <Frame d="24,58 44,58" w={4} /><Frame d="34,58 34,72" />
      <Frame d="40,38 68,50" w={5} /><Frame d="62,48 62,72" />
      <Head c={c} a={[46, 24]} />
      <Limb c={c} a="36,58 44,32" w={3} />
      <Limb c={c} a="36,58 26,62 24,72" w={2.6} />
      <Limb c={c} a="44,34 58,46" w={2.2} />
      <Limb c={c} a="58,46 72,58" b="58,46 56,30" w={2.2} />
      <Move dx={-16} dy={-28}><BarF c={c} x={72} y={58} w={14} /></Move>
      <Joint type="hip" a={[36, 58]} />
      <Joint type="knee" a={[26, 62]} r={2.5} />
      <Joint type="shoulder" a={[44, 34]} />
      <Joint type="elbow" a={[58, 46]} r={2.5} />
      <Joint type="wrist" a={[72, 58]} b={[56, 30]} r={2.5} />
    </>
  ) },
  curl_concentrado: { draw: ({ c, Limb, Joint, Head, Move }) => (
    <>
      <Bench x={50} y={58} w={34} />
      <Floor />
      <Head c={c} a={[40, 26]} />
      <Limb c={c} a="48,58 42,34" w={3} />
      <Limb c={c} a="48,58 32,60 30,72" w={2.6} /><Limb c={c} a="48,58 66,60 68,72" w={2.6} o="0.6" />
      <Limb c={c} a="42,36 40,54" w={2.2} />
      <Limb c={c} a="40,54 46,70" b="40,54 36,40" w={2.2} />
      <Move dx={-10} dy={-30}><DB c={c} x={46} y={70} /></Move>
      <Joint type="hip" a={[48, 58]} />
      <Joint type="knee" a={[32, 60]} r={2.5} />
      <Joint type="shoulder" a={[42, 36]} />
      <Joint type="elbow" a={[40, 54]} r={2.5} />
      <Joint type="wrist" a={[46, 70]} b={[36, 40]} r={2.5} />
    </>
  ) },
  curl_en_polea_baja: { draw: ({ c, Limb, Joint, Head, tween }) => (
    <>
      <Floor />
      <Frame d="86,40 86,72" /><Pulley x={86} y={66} />
      <Cable tween={tween} a="86,66 54,52" b="86,66 46,28" />
      <Head c={c} a={[46, 15]} />
      <Limb c={c} a="46,22 46,44" w={3} />
      <Limb c={c} a="42,72 42,58 46,44" w={2.6} /><Limb c={c} a="50,72 50,58 46,44" w={2.6} o="0.6" />
      <Limb c={c} a="46,24 48,44 54,52" b="46,24 48,44 46,28" w={2.2} />
      <Joint type="shoulder" a={[46, 24]} />
      <Joint type="elbow" a={[48, 44]} r={2.5} />
      <Joint type="wrist" a={[54, 52]} b={[46, 28]} r={2.5} />
      <Joint type="hip" a={[46, 44]} />
      <Joint type="knee" a={[42, 58]} r={2.5} />
    </>
  ) },

  // ═══ TRICEPS ════════════════════════════════════════════════════
  press_frances_con_barra: { draw: ({ c, Limb, Joint, Head, Disc }) => (
    <>
      <Bench x={50} y={56} w={52} />
      <Floor />
      <Head c={c} a={[26, 50]} r={4.5} />
      <Limb c={c} a="32,50 66,50" w={3} />
      <Limb c={c} a="66,50 78,60 80,72" w={2.6} />
      <Limb c={c} a="36,50 36,32" w={2.2} />
      <Limb c={c} a="36,32 38,14" b="36,32 22,26" w={2.2} />
      <Disc c={c} a={[38, 14]} b={[22, 26]} />
      <Joint type="shoulder" a={[36, 50]} />
      <Joint type="elbow" a={[36, 32]} r={2.5} />
      <Joint type="wrist" a={[38, 14]} b={[22, 26]} r={2.5} />
      <Joint type="hip" a={[66, 50]} />
      <Joint type="knee" a={[78, 60]} />
    </>
  ) },
  extension_de_triceps_con_cuerda: { draw: ({ c, Limb, Joint, Head, tween }) => (
    <>
      <Floor />
      <Frame d="86,6 86,72" /><Pulley x={86} y={8} />
      <Cable tween={tween} a="86,8 58,30" b="86,8 60,54" />
      <Head c={c} a={[46, 15]} />
      <Limb c={c} a="46,22 46,44" w={3} />
      <Limb c={c} a="42,72 42,58 46,44" w={2.6} /><Limb c={c} a="50,72 50,58 46,44" w={2.6} o="0.6" />
      <Limb c={c} a="46,24 50,40" w={2.2} />
      <Limb c={c} a="50,40 58,30" b="50,40 60,54" w={2.2} />
      <Joint type="shoulder" a={[46, 24]} />
      <Joint type="elbow" a={[50, 40]} r={2.5} />
      <Joint type="wrist" a={[58, 30]} b={[60, 54]} r={2.5} />
      <Joint type="hip" a={[46, 44]} />
      <Joint type="knee" a={[42, 58]} r={2.5} />
    </>
  ) },
  extension_de_triceps_sobre_cabeza: { draw: ({ c, Limb, Joint, Head, Move }) => (
    <>
      <Floor />
      <Head c={c} a={[50, 24]} />
      <Limb c={c} a="50,30 50,50" w={3} />
      <Limb c={c} a="50,50 44,72" w={2.6} /><Limb c={c} a="50,50 56,72" w={2.6} />
      <Limb c={c} a="50,32 44,16" w={2.2} /><Limb c={c} a="50,32 56,16" w={2.2} />
      <Limb c={c} a="44,16 48,4" b="44,16 40,30" w={2.2} />
      <Limb c={c} a="56,16 52,4" b="56,16 60,30" w={2.2} />
      <Move dy={26}><DB c={c} x={50} y={3} /></Move>
      <Joint type="shoulder" a={[50, 32]} />
      <Joint type="elbow" a={[44, 16]} r={2.5} /><Joint type="elbow" a={[56, 16]} r={2.5} />
      <Joint type="wrist" a={[48, 4]} b={[40, 30]} r={2.5} />
      <Joint type="hip" a={[50, 50]} />
    </>
  ) },
  patada_de_triceps: { draw: ({ c, Limb, Joint, Head, Move }) => (
    <>
      <Floor />
      <Head c={c} a={[20, 33]} />
      <Limb c={c} a="44,72 46,56 50,44" w={2.6} /><Limb c={c} a="56,72 56,56 50,44" w={2.6} o="0.6" />
      <Limb c={c} a="50,44 26,36" w={3} />
      <Limb c={c} a="30,38 42,44" w={2.2} />
      <Limb c={c} a="42,44 42,60" b="42,44 60,42" w={2.2} />
      <Move dx={18} dy={-18}><DB c={c} x={42} y={62} a={90} /></Move>
      <Joint type="knee" a={[46, 56]} r={2.5} />
      <Joint type="hip" a={[50, 44]} />
      <Joint type="shoulder" a={[30, 38]} />
      <Joint type="elbow" a={[42, 44]} r={2.5} />
      <Joint type="wrist" a={[42, 60]} b={[60, 42]} r={2.5} />
    </>
  ) },

  // ═══ PIERNAS / GLUTEOS ══════════════════════════════════════════
  prensa_de_piernas: { draw: ({ c, Limb, Joint, Head, Move }) => (
    <>
      <Floor />
      <Frame d="14,62 36,34" w={5} /><Frame d="14,62 38,68" w={4} /><Frame d="26,66 26,72" />
      <Move dx={10} dy={-10}><Frame d="56,40 66,60" w={5} /></Move>
      <Head c={c} a={[17, 30]} />
      <Limb c={c} a="34,62 20,36" w={3} />
      <Limb c={c} a="34,62 42,42 58,50" b="34,62 52,48 68,40" w={2.6} />
      <Limb c={c} a="34,60 40,40 56,48" b="34,60 50,46 66,38" w={2.6} o="0.5" />
      <Limb c={c} a="24,42 30,54" w={2} />
      <Joint type="shoulder" a={[22, 40]} />
      <Joint type="hip" a={[34, 62]} />
      <Joint type="knee" a={[42, 42]} b={[52, 48]} />
    </>
  ) },
  sentadilla_goblet: { draw: ({ c, Limb, Joint, Head, Move }) => (
    <>
      <Floor />
      <Move dy={12}>
        <Head c={c} a={[50, 14]} />
        <Limb c={c} a="50,20 50,44" w={3} />
        <Limb c={c} a="50,22 46,31" w={2.2} /><Limb c={c} a="50,22 54,31" w={2.2} />
        <DB c={c} x={50} y={32} a={90} />
        <Joint type="shoulder" a={[50, 22]} />
      </Move>
      <Limb c={c} a="50,44 42,58 40,72" b="50,56 36,60 40,72" w={2.6} />
      <Limb c={c} a="50,44 58,58 60,72" b="50,56 64,60 60,72" w={2.6} />
      <Joint type="hip" a={[50, 44]} b={[50, 56]} />
      <Joint type="knee" a={[42, 58]} b={[36, 60]} />
      <Joint type="knee" a={[58, 58]} b={[64, 60]} />
    </>
  ) },
  sentadilla_bulgara: { draw: ({ c, Limb, Joint, Head, Move }) => (
    <>
      <Bench x={78} y={54} w={22} />
      <Floor />
      <Move dy={10}>
        <Head c={c} a={[50, 15]} />
        <Limb c={c} a="50,22 50,44" w={3} />
        <Limb c={c} a="50,24 46,50" w={2.2} />
        <DB c={c} x={46} y={53} a={90} />
        <Joint type="shoulder" a={[50, 24]} />
      </Move>
      <Limb c={c} a="50,44 42,58 36,72" b="50,54 34,60 36,72" w={2.6} />
      <Limb c={c} a="50,44 62,58 78,52" b="50,54 60,66 78,52" w={2.6} o="0.6" />
      <Joint type="hip" a={[50, 44]} b={[50, 54]} />
      <Joint type="knee" a={[42, 58]} b={[34, 60]} />
      <Joint type="knee" a={[62, 58]} b={[60, 66]} r={2.5} />
    </>
  ) },
  sentadilla_hack: { draw: ({ c, Limb, Joint, Head, Move }) => (
    <>
      <Floor />
      <Frame d="24,72 72,14" w={3} /><Frame d="34,72 78,20" w={3} />
      <Frame d="36,70 56,70" w={4} />
      <Move dx={-8} dy={8}>
        <Head c={c} a={[68, 17]} />
        <Limb c={c} a="46,44 64,22" w={3} />
        <Limb c={c} a="60,26 56,36" w={2} />
        <Joint type="shoulder" a={[60, 26]} />
      </Move>
      <Limb c={c} a="46,44 42,58 46,70" b="38,52 30,62 46,70" w={2.6} />
      <Limb c={c} a="48,42 46,56 50,70" b="40,50 34,60 50,70" w={2.6} o="0.5" />
      <Joint type="hip" a={[46, 44]} b={[38, 52]} />
      <Joint type="knee" a={[42, 58]} b={[30, 62]} />
    </>
  ) },
  zancadas_caminando: { draw: ({ c, Limb, Joint, Head, Move }) => (
    <>
      <Floor />
      <Move dy={8}>
        <Head c={c} a={[50, 15]} />
        <Limb c={c} a="50,22 50,44" w={3} />
        <Limb c={c} a="50,24 47,50" w={2.2} />
        <DB c={c} x={47} y={53} a={90} />
        <Joint type="shoulder" a={[50, 24]} />
      </Move>
      <Limb c={c} a="50,44 62,56 64,72" b="50,52 64,64 64,72" w={2.6} />
      <Limb c={c} a="50,44 40,58 30,72" b="50,52 38,66 32,72" w={2.6} o="0.6" />
      <Joint type="hip" a={[50, 44]} b={[50, 52]} />
      <Joint type="knee" a={[62, 56]} b={[64, 64]} />
      <Joint type="knee" a={[40, 58]} b={[38, 66]} r={2.5} />
    </>
  ) },
  step_up_con_mancuernas: { draw: ({ c, Limb, Joint, Head, Move }) => (
    <>
      <Floor />
      <Frame d="60,60 90,60 90,72 60,72" w={2.5} />
      <Move dx={12} dy={-12}>
        <Head c={c} a={[44, 22]} />
        <Limb c={c} a="44,28 44,48" w={3} />
        <Limb c={c} a="44,30 40,54" w={2.2} />
        <DB c={c} x={40} y={57} a={90} />
        <Joint type="shoulder" a={[44, 30]} />
      </Move>
      <Limb c={c} a="44,48 52,58 62,60" b="56,36 60,50 62,60" w={2.6} />
      <Limb c={c} a="44,48 42,60 40,72" b="56,36 50,48 48,58" w={2.6} o="0.6" />
      <Joint type="hip" a={[44, 48]} b={[56, 36]} />
      <Joint type="knee" a={[52, 58]} b={[60, 50]} />
      <Joint type="knee" a={[42, 60]} b={[50, 48]} r={2.5} />
    </>
  ) },
  peso_muerto_rumano_con_barra: { draw: ({ c, Limb, Joint, Head, Disc }) => (
    <>
      <Floor />
      <Head c={c} a={[50, 15]} b={[20, 32]} />
      <Limb c={c} a="46,72 47,58 50,44" w={2.6} /><Limb c={c} a="54,72 55,58 50,44" w={2.6} o="0.6" />
      <Limb c={c} a="50,44 50,22" b="50,44 26,34" w={3} />
      <Limb c={c} a="50,24 52,52" b="28,36 32,60" w={2.2} />
      <Disc c={c} a={[52, 52]} b={[32, 60]} />
      <Joint type="knee" a={[47, 58]} r={2.5} />
      <Joint type="hip" a={[50, 44]} />
      <Joint type="shoulder" a={[50, 24]} b={[28, 36]} />
      <Joint type="wrist" a={[52, 52]} b={[32, 60]} r={2.5} />
    </>
  ) },
  buenos_dias: { draw: ({ c, Limb, Joint, Head, Disc }) => (
    <>
      <Floor />
      <Head c={c} a={[50, 15]} b={[22, 32]} />
      <Limb c={c} a="46,72 46,58 50,44" w={2.6} /><Limb c={c} a="54,72 54,58 50,44" w={2.6} o="0.6" />
      <Limb c={c} a="50,44 50,22" b="50,44 28,34" w={3} />
      <Limb c={c} a="50,24 42,26" b="28,36 24,44" w={2} />
      <Disc c={c} a={[50, 22]} b={[29, 33]} r={5} />
      <Joint type="knee" a={[46, 58]} r={2.5} />
      <Joint type="hip" a={[50, 44]} />
      <Joint type="shoulder" a={[50, 24]} b={[28, 36]} />
    </>
  ) },
  hip_thrust_con_barra: { draw: ({ c, Limb, Joint, Head, Disc }) => (
    <>
      <Bench x={22} y={50} w={24} />
      <Floor />
      <Head c={c} a={[23, 46]} r={4.5} />
      <Limb c={c} a="30,48 54,62" b="30,48 56,46" w={3} />
      <Limb c={c} a="54,62 66,54 70,72" b="56,46 68,52 70,72" w={2.6} />
      <Limb c={c} a="34,50 46,58" b="34,50 48,46" w={2} />
      <Disc c={c} a={[52, 58]} b={[54, 42]} r={5} />
      <Joint type="shoulder" a={[32, 49]} />
      <Joint type="hip" a={[54, 62]} b={[56, 46]} />
      <Joint type="knee" a={[66, 54]} b={[68, 52]} />
    </>
  ) },
  curl_femoral_tumbado: { draw: ({ c, Limb, Joint, Head }) => (
    <>
      <Bench x={50} y={54} w={60} />
      <Floor />
      <Head c={c} a={[18, 50]} r={4.5} />
      <Limb c={c} a="24,50 60,50" w={3} />
      <Limb c={c} a="26,50 24,64" w={2} />
      <Limb c={c} a="60,50 80,52" w={2.6} />
      <Limb c={c} a="80,52 92,62" b="80,52 78,30" w={2.6} />
      <circle cx="90" cy="60" r="3" fill={FR}>
        <animate attributeName="cx" values="90;79;90" dur="2.4s" repeatCount="indefinite" calcMode="spline" keySplines={`${SPL};${SPL}`} keyTimes="0;0.5;1" />
        <animate attributeName="cy" values="60;35;60" dur="2.4s" repeatCount="indefinite" calcMode="spline" keySplines={`${SPL};${SPL}`} keyTimes="0;0.5;1" />
      </circle>
      <Joint type="shoulder" a={[26, 50]} />
      <Joint type="hip" a={[60, 50]} />
      <Joint type="knee" a={[80, 52]} />
    </>
  ) },
  gemelos_sentado: { dur: 1.8, draw: ({ c, Limb, Joint, Head, Move }) => (
    <>
      <Floor />
      <Frame d="40,54 62,54" w={4} /><Frame d="52,54 52,72" />
      <Head c={c} a={[51, 22]} />
      <Limb c={c} a="56,54 52,30" w={3} />
      <Limb c={c} a="56,54 76,56" b="56,54 76,52" w={2.6} />
      <Limb c={c} a="76,56 74,71" b="76,52 75,65" w={2.6} />
      <Limb c={c} a="70,72 84,72" b="72,66 84,72" w={2.4} />
      <Move dy={-4}><Pad x={76} y={50} w={12} h={4} /></Move>
      <Joint type="hip" a={[56, 54]} />
      <Joint type="shoulder" a={[52, 32]} />
      <Joint type="knee" a={[76, 56]} b={[76, 52]} />
    </>
  ) },
  abduccion_de_cadera_en_maquina: { draw: ({ c, Limb, Joint, Head }) => (
    <>
      <Floor />
      <Frame d="38,52 62,52" w={4} /><Frame d="50,52 50,72" />
      <Head c={c} a={[50, 20]} />
      <Limb c={c} a="50,26 50,50" w={3} />
      <Limb c={c} a="50,50 44,62 44,72" b="50,50 30,60 28,72" w={2.6} />
      <Limb c={c} a="50,50 56,62 56,72" b="50,50 70,60 72,72" w={2.6} />
      <rect x="37" y="58" width="4" height="9" rx="1.2" fill={FR}><animate attributeName="x" values="37;23;37" dur="2.4s" repeatCount="indefinite" calcMode="spline" keySplines={`${SPL};${SPL}`} keyTimes="0;0.5;1" /></rect>
      <rect x="59" y="58" width="4" height="9" rx="1.2" fill={FR}><animate attributeName="x" values="59;73;59" dur="2.4s" repeatCount="indefinite" calcMode="spline" keySplines={`${SPL};${SPL}`} keyTimes="0;0.5;1" /></rect>
      <Joint type="shoulder" a={[50, 28]} />
      <Joint type="hip" a={[50, 50]} />
      <Joint type="knee" a={[44, 62]} b={[30, 60]} />
      <Joint type="knee" a={[56, 62]} b={[70, 60]} />
    </>
  ) },
  kettlebell_swing: { dur: 1.6, draw: ({ c, Limb, Joint, Head }) => (
    <>
      <Floor />
      <Head c={c} a={[26, 27]} b={[50, 15]} />
      <Limb c={c} a="46,72 42,58 50,44" b="46,72 47,58 50,44" w={2.6} />
      <Limb c={c} a="54,72 54,58 50,44" w={2.6} o="0.6" />
      <Limb c={c} a="50,44 32,30" b="50,44 50,22" w={3} />
      <Limb c={c} a="36,34 46,58" b="50,24 78,26" w={2.2} />
      <circle cx="47" cy="62" r="4.5" fill={c} opacity="0.9">
        <animate attributeName="cx" values="47;80;47" dur="1.6s" repeatCount="indefinite" calcMode="spline" keySplines={`${SPL};${SPL}`} keyTimes="0;0.5;1" />
        <animate attributeName="cy" values="62;28;62" dur="1.6s" repeatCount="indefinite" calcMode="spline" keySplines={`${SPL};${SPL}`} keyTimes="0;0.5;1" />
      </circle>
      <Joint type="knee" a={[42, 58]} b={[47, 58]} r={2.5} />
      <Joint type="hip" a={[50, 44]} />
      <Joint type="shoulder" a={[36, 34]} b={[50, 24]} />
      <Joint type="wrist" a={[46, 58]} b={[78, 26]} r={2.5} />
    </>
  ) },
};

export const EXTRA_SVG_KEYS = Object.keys(FIGS);

export function buildExtraSvgs(c) {
  const out = {};
  for (const [key, { dur = 2.4, draw }] of Object.entries(FIGS)) {
    const H = helpers(dur);
    out[key] = <svg viewBox="0 0 100 80" fill="none">{draw({ c, ...H })}</svg>;
  }
  return out;
}
