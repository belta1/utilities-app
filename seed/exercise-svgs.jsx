// Animated exercise figures, extracted verbatim from pages/recomp_v2.jsx (ExerciseSVG).
// Rendered to plain SVG at seed time and stored in exercise_images; `c` becomes
// currentColor so the UI can tint each figure via CSS `color`.
const T = {
  bg:      "#14110F",   // grafito calido (piso de gimnasio)
  surface: "#1C1815",
  raised:  "#242019",
  line:    "#2E2822",
  copper:  "#E0853C",   // fuerza
  ember:   "#B45A1B",
  steel:   "#7DA7C7",   // cardio
  sage:    "#9CB380",   // recovery / nutricion
  gold:    "#F2C14E",
  lilac:   "#B58BC9",
  bone:    "#EAE3D8",   // texto principal
  ash:     "#8A8178",   // texto secundario
  faint:   "#544C42",
};

// Joint colors
const J = {
  shoulder: "#F2C14E", // yellow — hombro
  elbow:    "#E0853C", // orange — codo
  knee:     "#7DA7C7", // cyan  — rodilla
  hip:      "#B58BC9", // violet — cadera
  wrist:    "#9CB380", // green  — mano / pesa
};


const Jt = ({ x, y, type, r = 3 }) => (
  <circle cx={x} cy={y} r={r} fill={J[type]} opacity="0.95" />
);

export function buildSvgs(c, uid) {
  const svgs = {

    // ── PESO MUERTO CONVENCIONAL ────────────────────────────────
    peso_muerto: (
      <svg viewBox="0 0 100 80" fill="none">
        <style>{`
          @keyframes dl_${uid} { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-20px)} }
          .dl_${uid} { animation: dl_${uid} 2.6s ease-in-out infinite; }
          @keyframes dlb_${uid} { 0%,100%{transform:rotate(0deg)} 50%{transform:rotate(-34deg)} }
          .dlb_${uid} { animation: dlb_${uid} 2.6s ease-in-out infinite; transform-origin:50px 46px; }
        `}</style>
        <line x1="8" y1="72" x2="92" y2="72" stroke="#3A332B" strokeWidth="2"/>
        {/* legs static */}
        <line x1="50" y1="46" x2="44" y2="60" stroke={c} strokeWidth="3" strokeLinecap="round"/>
        <line x1="44" y1="60" x2="46" y2="72" stroke={c} strokeWidth="2.8" strokeLinecap="round"/>
        <line x1="50" y1="46" x2="56" y2="60" stroke={c} strokeWidth="3" strokeLinecap="round"/>
        <line x1="56" y1="60" x2="54" y2="72" stroke={c} strokeWidth="2.8" strokeLinecap="round"/>
        <Jt x={44} y={60} type="knee" r={4}/>
        <Jt x={56} y={60} type="knee" r={4}/>
        <Jt x={50} y={46} type="hip" r={4.5}/>
        {/* torso hinges */}
        <g className={`dlb_${uid}`}>
          <line x1="50" y1="46" x2="34" y2="28" stroke={c} strokeWidth="3.5" strokeLinecap="round"/>
          <ellipse cx="30" cy="23" rx="6" ry="6" fill={c} opacity="0.9"/>
          <Jt x={40} y={35} type="shoulder" r={4}/>
        </g>
        {/* arms + bar rise together */}
        <g className={`dl_${uid}`}>
          <line x1="40" y1="35" x2="42" y2="50" stroke={c} strokeWidth="2.5" strokeLinecap="round"/>
          <line x1="42" y1="50" x2="44" y2="62" stroke={c} strokeWidth="2.5" strokeLinecap="round"/>
          <Jt x={42} y={50} type="elbow" r={3.5}/>
          <line x1="18" y1="64" x2="82" y2="64" stroke={c} strokeWidth="2.5" strokeLinecap="round"/>
          <rect x="13" y="59" width="10" height="10" rx="2" fill="#14110F" stroke={c} strokeWidth="1.5"/>
          <rect x="77" y="59" width="10" height="10" rx="2" fill="#14110F" stroke={c} strokeWidth="1.5"/>
        </g>
        <text x="50" y="78" textAnchor="middle" fontSize="6" fill={c} opacity="0.55" fontFamily="monospace">espalda neutra · barra pegada</text>
      </svg>
    ),

    // ── JALON DORSAL EN POLEA ALTA ──────────────────────────────
    jalon_dorsal: (
      <svg viewBox="0 0 100 80" fill="none">
        <style>{`
          @keyframes jd_${uid} { 0%,100%{transform:translateY(-10px)} 50%{transform:translateY(4px)} }
          .jd_${uid} { animation: jd_${uid} 2.2s ease-in-out infinite; }
        `}</style>
        {/* machine frame */}
        <line x1="86" y1="4" x2="86" y2="72" stroke="#3A332B" strokeWidth="3" strokeLinecap="round"/>
        <line x1="50" y1="6" x2="86" y2="6" stroke="#3A332B" strokeWidth="3" strokeLinecap="round"/>
        <circle cx="50" cy="6" r="3.5" fill="#14110F" stroke="#3A332B" strokeWidth="2"/>
        {/* weight stack */}
        <rect x="79" y="30" width="14" height="30" rx="2" fill="#242019" stroke="#3A332B" strokeWidth="1"/>
        {[34,40,46,52].map(y => <line key={y} x1="80" y1={y} x2="92" y2={y} stroke="#3A332B" strokeWidth="1"/>)}
        {/* seat + thigh pad */}
        <rect x="30" y="58" width="34" height="6" rx="2" fill="#242019" stroke={c} strokeWidth="1.2"/>
        <rect x="34" y="48" width="22" height="4" rx="2" fill="#242019" stroke={c} strokeWidth="1"/>
        <line x1="46" y1="64" x2="46" y2="74" stroke="#3A332B" strokeWidth="2"/>
        {/* seated body: head, torso, legs under pad */}
        <ellipse cx="44" cy="26" rx="6" ry="6" fill={c} opacity="0.9"/>
        <line x1="44" y1="32" x2="46" y2="56" stroke={c} strokeWidth="3.5" strokeLinecap="round"/>
        <Jt x={46} y={56} type="hip" r={4}/>
        <line x1="46" y1="56" x2="62" y2="60" stroke={c} strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="62" y1="60" x2="64" y2="72" stroke={c} strokeWidth="2.5" strokeLinecap="round"/>
        <Jt x={62} y={60} type="knee" r={3.5}/>
        {/* animated: cable + bar + arms */}
        <g className={`jd_${uid}`}>
          <line x1="50" y1="6" x2="50" y2="22" stroke={c} strokeWidth="1.4" strokeDasharray="3 2" opacity="0.7"/>
          <line x1="30" y1="22" x2="70" y2="22" stroke={c} strokeWidth="2.5" strokeLinecap="round"/>
          {/* upper arms shoulder->elbow, forearms elbow->bar */}
          <line x1="40" y1="36" x2="34" y2="30" stroke={c} strokeWidth="2.5" strokeLinecap="round"/>
          <line x1="34" y1="30" x2="32" y2="22" stroke={c} strokeWidth="2.5" strokeLinecap="round"/>
          <line x1="48" y1="36" x2="58" y2="30" stroke={c} strokeWidth="2.5" strokeLinecap="round"/>
          <line x1="58" y1="30" x2="66" y2="22" stroke={c} strokeWidth="2.5" strokeLinecap="round"/>
          <Jt x={40} y={36} type="shoulder" r={4}/>
          <Jt x={48} y={36} type="shoulder" r={4}/>
          <Jt x={34} y={30} type="elbow" r={3.5}/>
          <Jt x={58} y={30} type="elbow" r={3.5}/>
          <Jt x={32} y={22} type="wrist" r={2.5}/>
          <Jt x={66} y={22} type="wrist" r={2.5}/>
        </g>
        <text x="30" y="76" textAnchor="middle" fontSize="6" fill={c} opacity="0.55" fontFamily="monospace">codos al piso</text>
      </svg>
    ),

    // ── REMO CON MANCUERNAS EN BANCO INCLINADO ──────────────────
    remo_banco_inclinado: (
      <svg viewBox="0 0 100 80" fill="none">
        <style>{`
          @keyframes rb_${uid} { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-16px)} }
          .rb_${uid} { animation: rb_${uid} 2.2s ease-in-out infinite; }
        `}</style>
        {/* incline bench: pad angled, legs */}
        <rect x="22" y="24" width="46" height="7" rx="3" fill="#242019" stroke={c} strokeWidth="1.3"
          transform="rotate(28 22 31)"/>
        <line x1="26" y1="34" x2="22" y2="70" stroke="#3A332B" strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="62" y1="56" x2="66" y2="70" stroke="#3A332B" strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="8" y1="70" x2="92" y2="70" stroke="#3A332B" strokeWidth="1.6"/>
        {/* body lying prone on the pad, head upper-left */}
        <ellipse cx="26" cy="20" rx="6" ry="6" fill={c} opacity="0.9"/>
        <line x1="31" y1="24" x2="60" y2="48" stroke={c} strokeWidth="3.5" strokeLinecap="round"/>
        <Jt x={52} y={41} type="hip" r={4}/>
        {/* legs down to floor */}
        <line x1="60" y1="48" x2="66" y2="62" stroke={c} strokeWidth="2.6" strokeLinecap="round"/>
        <line x1="66" y1="62" x2="70" y2="70" stroke={c} strokeWidth="2.6" strokeLinecap="round"/>
        <Jt x={66} y={62} type="knee" r={3.8}/>
        {/* chest contact marker */}
        <circle cx="38" cy="31" r="3" fill="none" stroke={T.sage} strokeWidth="1.4"/>
        {/* animated arms + dumbbells: elbows drive to ceiling */}
        <g className={`rb_${uid}`}>
          <line x1="34" y1="30" x2="30" y2="46" stroke={c} strokeWidth="2.5" strokeLinecap="round"/>
          <line x1="30" y1="46" x2="28" y2="58" stroke={c} strokeWidth="2.5" strokeLinecap="round"/>
          <line x1="40" y1="35" x2="44" y2="50" stroke={c} strokeWidth="2.5" strokeLinecap="round"/>
          <line x1="44" y1="50" x2="46" y2="60" stroke={c} strokeWidth="2.5" strokeLinecap="round"/>
          <Jt x={34} y={30} type="shoulder" r={4}/>
          <Jt x={40} y={35} type="shoulder" r={4}/>
          <Jt x={30} y={46} type="elbow" r={3.8}/>
          <Jt x={44} y={50} type="elbow" r={3.8}/>
          {/* dumbbells */}
          <line x1="22" y1="60" x2="34" y2="60" stroke={c} strokeWidth="2.2" strokeLinecap="round"/>
          <rect x="19" y="56" width="6" height="8" rx="1.5" fill="#14110F" stroke={c} strokeWidth="1.3"/>
          <rect x="31" y="56" width="6" height="8" rx="1.5" fill="#14110F" stroke={c} strokeWidth="1.3"/>
          <line x1="40" y1="62" x2="52" y2="62" stroke={c} strokeWidth="2.2" strokeLinecap="round"/>
          <rect x="37" y="58" width="6" height="8" rx="1.5" fill="#14110F" stroke={c} strokeWidth="1.3"/>
          <rect x="49" y="58" width="6" height="8" rx="1.5" fill="#14110F" stroke={c} strokeWidth="1.3"/>
        </g>
        <text x="52" y="78" textAnchor="middle" fontSize="6" fill={c} opacity="0.55" fontFamily="monospace">pecho pegado · sin carga lumbar</text>
      </svg>
    ),

    // ── APERTURAS CON MANCUERNAS ────────────────────────────────
    aperturas: (
      <svg viewBox="0 0 100 80" fill="none">
        <style>{`
          @keyframes ap_l_${uid} { 0%,100%{transform:rotate(0deg)} 50%{transform:rotate(-42deg)} }
          @keyframes ap_r_${uid} { 0%,100%{transform:rotate(0deg)} 50%{transform:rotate(42deg)} }
          .ap_l_${uid} { animation: ap_l_${uid} 2.4s ease-in-out infinite; transform-origin:44px 50px; }
          .ap_r_${uid} { animation: ap_r_${uid} 2.4s ease-in-out infinite; transform-origin:56px 50px; }
        `}</style>
        {/* flat bench */}
        <rect x="10" y="52" width="80" height="7" rx="3" fill="#242019" stroke={c} strokeWidth="1.3"/>
        <rect x="15" y="59" width="6" height="13" rx="2" fill={c} opacity="0.25"/>
        <rect x="79" y="59" width="6" height="13" rx="2" fill={c} opacity="0.25"/>
        <line x1="6" y1="72" x2="94" y2="72" stroke="#3A332B" strokeWidth="1.6"/>
        {/* body lying */}
        <ellipse cx="50" cy="44" rx="6" ry="6" fill={c} opacity="0.9"/>
        <line x1="50" y1="50" x2="50" y2="66" stroke={c} strokeWidth="3.2" strokeLinecap="round"/>
        <Jt x={50} y={58} type="hip" r={3.8}/>
        <line x1="50" y1="66" x2="42" y2="72" stroke={c} strokeWidth="2.4" strokeLinecap="round"/>
        <line x1="50" y1="66" x2="58" y2="72" stroke={c} strokeWidth="2.4" strokeLinecap="round"/>
        {/* LEFT arm — opens in arc, elbow angle stays fixed */}
        <g className={`ap_l_${uid}`}>
          <line x1="44" y1="50" x2="34" y2="34" stroke={c} strokeWidth="2.5" strokeLinecap="round"/>
          <line x1="34" y1="34" x2="30" y2="22" stroke={c} strokeWidth="2.5" strokeLinecap="round"/>
          <Jt x={44} y={50} type="shoulder" r={4}/>
          <Jt x={34} y={34} type="elbow" r={3.8}/>
          <line x1="24" y1="22" x2="36" y2="22" stroke={c} strokeWidth="2.2" strokeLinecap="round"/>
          <rect x="21" y="18" width="6" height="8" rx="1.5" fill="#14110F" stroke={c} strokeWidth="1.3"/>
          <rect x="33" y="18" width="6" height="8" rx="1.5" fill="#14110F" stroke={c} strokeWidth="1.3"/>
        </g>
        {/* RIGHT arm */}
        <g className={`ap_r_${uid}`}>
          <line x1="56" y1="50" x2="66" y2="34" stroke={c} strokeWidth="2.5" strokeLinecap="round"/>
          <line x1="66" y1="34" x2="70" y2="22" stroke={c} strokeWidth="2.5" strokeLinecap="round"/>
          <Jt x={56} y={50} type="shoulder" r={4}/>
          <Jt x={66} y={34} type="elbow" r={3.8}/>
          <line x1="64" y1="22" x2="76" y2="22" stroke={c} strokeWidth="2.2" strokeLinecap="round"/>
          <rect x="61" y="18" width="6" height="8" rx="1.5" fill="#14110F" stroke={c} strokeWidth="1.3"/>
          <rect x="73" y="18" width="6" height="8" rx="1.5" fill="#14110F" stroke={c} strokeWidth="1.3"/>
        </g>
        <text x="50" y="78" textAnchor="middle" fontSize="6" fill={c} opacity="0.55" fontFamily="monospace">codo fijo · arco amplio</text>
      </svg>
    ),

    // ── EXTENSION TRICEPS EN POLEA ──────────────────────────────
    ext_triceps_polea: (
      <svg viewBox="0 0 100 80" fill="none">
        <style>{`
          @keyframes et_${uid} { 0%,100%{transform:rotate(0deg)} 50%{transform:rotate(48deg)} }
          .et_l_${uid} { animation: et_${uid} 2s ease-in-out infinite; transform-origin:40px 38px; }
          .et_r_${uid} { animation: et_${uid} 2s ease-in-out infinite; transform-origin:48px 38px; }
        `}</style>
        {/* frame + pulley */}
        <line x1="78" y1="4" x2="78" y2="74" stroke="#3A332B" strokeWidth="3" strokeLinecap="round"/>
        <circle cx="78" cy="10" r="3.5" fill="#14110F" stroke="#3A332B" strokeWidth="2"/>
        <rect x="71" y="30" width="14" height="28" rx="2" fill="#242019" stroke="#3A332B" strokeWidth="1"/>
        {/* standing body */}
        <ellipse cx="34" cy="14" rx="6.5" ry="6.5" fill={c} opacity="0.9"/>
        <line x1="34" y1="21" x2="36" y2="48" stroke={c} strokeWidth="3.5" strokeLinecap="round"/>
        <Jt x={36} y={48} type="hip" r={4}/>
        <line x1="36" y1="48" x2="30" y2="70" stroke={c} strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="36" y1="48" x2="44" y2="70" stroke={c} strokeWidth="2.5" strokeLinecap="round"/>
        <Jt x={32} y={59} type="knee" r={3.5}/>
        <Jt x={41} y={59} type="knee" r={3.5}/>
        <line x1="16" y1="74" x2="60" y2="74" stroke="#3A332B" strokeWidth="1.5"/>
        {/* UPPER ARMS fixed vertical at sides */}
        <line x1="36" y1="28" x2="40" y2="38" stroke={c} strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="38" y1="28" x2="48" y2="38" stroke={c} strokeWidth="2.5" strokeLinecap="round"/>
        <Jt x={36} y={28} type="shoulder" r={4}/>
        <Jt x={38} y={28} type="shoulder" r={4}/>
        {/* FOREARMS animate — only elbow moves */}
        <g className={`et_l_${uid}`}>
          <line x1="40" y1="38" x2="42" y2="54" stroke={c} strokeWidth="2.5" strokeLinecap="round"/>
          <Jt x={40} y={38} type="elbow" r={4}/>
          <Jt x={42} y={54} type="wrist" r={2.5}/>
        </g>
        <g className={`et_r_${uid}`}>
          <line x1="48" y1="38" x2="50" y2="54" stroke={c} strokeWidth="2.5" strokeLinecap="round"/>
          <Jt x={48} y={38} type="elbow" r={4}/>
          <Jt x={50} y={54} type="wrist" r={2.5}/>
        </g>
        {/* cable from pulley to hands */}
        <line x1="78" y1="10" x2="50" y2="46" stroke={c} strokeWidth="1.4" strokeDasharray="3 2" opacity="0.7"/>
        <text x="34" y="78" textAnchor="middle" fontSize="6" fill={c} opacity="0.55" fontFamily="monospace">codo fijo al costado</text>
      </svg>
    ),

    // ── EXTENSION DE CUADRICEPS ─────────────────────────────────
    ext_cuadriceps: (
      <svg viewBox="0 0 100 80" fill="none">
        <style>{`
          @keyframes ec_${uid} { 0%,100%{transform:rotate(0deg)} 50%{transform:rotate(-70deg)} }
          .ec_${uid} { animation: ec_${uid} 2.2s ease-in-out infinite; transform-origin:58px 50px; }
        `}</style>
        {/* machine: seat, backrest, pivot */}
        <rect x="20" y="18" width="6" height="34" rx="2" fill="#242019" stroke={c} strokeWidth="1.2"/>
        <rect x="26" y="48" width="34" height="6" rx="2" fill="#242019" stroke={c} strokeWidth="1.2"/>
        <line x1="42" y1="54" x2="42" y2="72" stroke="#3A332B" strokeWidth="2.5"/>
        <line x1="30" y1="72" x2="76" y2="72" stroke="#3A332B" strokeWidth="2.5" strokeLinecap="round"/>
        {/* weight stack */}
        <rect x="66" y="20" width="14" height="26" rx="2" fill="#242019" stroke="#3A332B" strokeWidth="1"/>
        {[24,30,36].map(y => <line key={y} x1="67" y1={y} x2="79" y2={y} stroke="#3A332B" strokeWidth="1"/>)}
        {/* seated body */}
        <ellipse cx="30" cy="22" rx="6" ry="6" fill={c} opacity="0.9"/>
        <line x1="30" y1="28" x2="34" y2="46" stroke={c} strokeWidth="3.5" strokeLinecap="round"/>
        <line x1="30" y1="32" x2="24" y2="44" stroke={c} strokeWidth="2.2" strokeLinecap="round"/>
        <Jt x={30} y={32} type="shoulder" r={3.5}/>
        {/* thigh on seat */}
        <line x1="34" y1="48" x2="58" y2="50" stroke={c} strokeWidth="3" strokeLinecap="round"/>
        <Jt x={34} y={48} type="hip" r={4}/>
        <Jt x={58} y={50} type="knee" r={4.5}/>
        {/* SHIN animates up */}
        <g className={`ec_${uid}`}>
          <line x1="58" y1="50" x2="60" y2="68" stroke={c} strokeWidth="2.8" strokeLinecap="round"/>
          {/* roller pad on instep */}
          <circle cx="61" cy="66" r="4.5" fill="#14110F" stroke={c} strokeWidth="1.8"/>
        </g>
        <text x="50" y="78" textAnchor="middle" fontSize="6" fill={c} opacity="0.55" fontFamily="monospace">pausa 1s arriba</text>
      </svg>
    ),

    // ── CURL FEMORAL ────────────────────────────────────────────
    curl_femoral: (
      <svg viewBox="0 0 100 80" fill="none">
        <style>{`
          @keyframes cf_${uid} { 0%,100%{transform:rotate(0deg)} 50%{transform:rotate(-75deg)} }
          .cf_${uid} { animation: cf_${uid} 2.2s ease-in-out infinite; transform-origin:62px 44px; }
        `}</style>
        {/* bench */}
        <rect x="12" y="44" width="56" height="7" rx="3" fill="#242019" stroke={c} strokeWidth="1.2"/>
        <line x1="20" y1="51" x2="20" y2="70" stroke="#3A332B" strokeWidth="2.5"/>
        <line x1="60" y1="51" x2="60" y2="70" stroke="#3A332B" strokeWidth="2.5"/>
        <line x1="10" y1="70" x2="90" y2="70" stroke="#3A332B" strokeWidth="1.5"/>
        {/* stack */}
        <rect x="76" y="26" width="13" height="24" rx="2" fill="#242019" stroke="#3A332B" strokeWidth="1"/>
        {[30,35,40].map(y => <line key={y} x1="77" y1={y} x2="88" y2={y} stroke="#3A332B" strokeWidth="1"/>)}
        {/* prone body: head left, hips right */}
        <ellipse cx="16" cy="38" rx="6" ry="6" fill={c} opacity="0.9"/>
        <line x1="22" y1="40" x2="62" y2="44" stroke={c} strokeWidth="3.5" strokeLinecap="round"/>
        <Jt x={48} y={43} type="hip" r={4}/>
        {/* arms gripping bench edge */}
        <line x1="26" y1="41" x2="22" y2="50" stroke={c} strokeWidth="2" strokeLinecap="round"/>
        <Jt x={26} y={41} type="shoulder" r={3.5}/>
        {/* SHIN animates up (knee flexion) */}
        <Jt x={62} y={44} type="knee" r={4.5}/>
        <g className={`cf_${uid}`}>
          <line x1="62" y1="44" x2="84" y2="46" stroke={c} strokeWidth="2.8" strokeLinecap="round"/>
          <circle cx="82" cy="46" r="4.5" fill="#14110F" stroke={c} strokeWidth="1.8"/>
        </g>
        <text x="46" y="78" textAnchor="middle" fontSize="6" fill={c} opacity="0.55" fontFamily="monospace">cadera pegada al banco</text>
      </svg>
    ),

    // ── FACE PULL EN POLEA ──────────────────────────────────────
    face_pull_polea: (
      <svg viewBox="0 0 100 80" fill="none">
        <style>{`
          @keyframes fpp_${uid} { 0%,100%{transform:translateX(12px)} 50%{transform:translateX(-2px)} }
          .fpp_${uid} { animation: fpp_${uid} 2s ease-in-out infinite; }
        `}</style>
        {/* frame + pulley at face height */}
        <line x1="84" y1="4" x2="84" y2="74" stroke="#3A332B" strokeWidth="3" strokeLinecap="round"/>
        <circle cx="84" cy="22" r="4" fill="#14110F" stroke="#3A332B" strokeWidth="2"/>
        <rect x="77" y="34" width="14" height="26" rx="2" fill="#242019" stroke="#3A332B" strokeWidth="1"/>
        {[38,44,50].map(y => <line key={y} x1="78" y1={y} x2="90" y2={y} stroke="#3A332B" strokeWidth="1"/>)}
        {/* standing body */}
        <ellipse cx="26" cy="20" rx="6.5" ry="6.5" fill={c} opacity="0.9"/>
        <line x1="26" y1="27" x2="27" y2="50" stroke={c} strokeWidth="3.5" strokeLinecap="round"/>
        <Jt x={27} y={50} type="hip" r={4}/>
        <line x1="27" y1="50" x2="20" y2="72" stroke={c} strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="27" y1="50" x2="36" y2="72" stroke={c} strokeWidth="2.5" strokeLinecap="round"/>
        <Jt x={23} y={61} type="knee" r={3.5}/>
        <Jt x={32} y={61} type="knee" r={3.5}/>
        <line x1="8" y1="74" x2="60" y2="74" stroke="#3A332B" strokeWidth="1.5"/>
        {/* animated arms — elbows HIGH, hands to ears */}
        <g className={`fpp_${uid}`}>
          <line x1="28" y1="30" x2="46" y2="20" stroke={c} strokeWidth="2.5" strokeLinecap="round"/>
          <line x1="46" y1="20" x2="62" y2="22" stroke={c} strokeWidth="2.5" strokeLinecap="round"/>
          <line x1="28" y1="36" x2="46" y2="30" stroke={c} strokeWidth="2.5" strokeLinecap="round"/>
          <line x1="46" y1="30" x2="62" y2="26" stroke={c} strokeWidth="2.5" strokeLinecap="round"/>
          <line x1="62" y1="22" x2="82" y2="22" stroke={c} strokeWidth="1.4" strokeDasharray="3 2" opacity="0.75"/>
          <line x1="62" y1="26" x2="82" y2="23" stroke={c} strokeWidth="1.4" strokeDasharray="3 2" opacity="0.75"/>
          <Jt x={28} y={30} type="shoulder" r={4}/>
          <Jt x={28} y={36} type="shoulder" r={4}/>
          <Jt x={46} y={20} type="elbow" r={4}/>
          <Jt x={46} y={30} type="elbow" r={4}/>
        </g>
        <text x="34" y="78" textAnchor="middle" fontSize="6" fill={c} opacity="0.55" fontFamily="monospace">codos arriba</text>
      </svg>
    ),

    // ── PRESS BANCA ────────────────────────────────────────────────
    press_banca: (
      <svg viewBox="0 0 80 60" fill="none">
        <style>{`
          @keyframes pb_${uid} { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-11px)} }
          .pb_mv_${uid} { animation: pb_${uid} 2.2s ease-in-out infinite; transform-origin:40px 43px; }
        `}</style>
        {/* bench */}
        <rect x="8" y="43" width="64" height="5" rx="2" fill="#242019" stroke={c} strokeWidth="1"/>
        <rect x="10" y="48" width="5" height="9" rx="1" fill={c} opacity="0.3"/>
        <rect x="65" y="48" width="5" height="9" rx="1" fill={c} opacity="0.3"/>
        {/* torso + head */}
        <ellipse cx="40" cy="37" rx="5" ry="5" fill={c} opacity="0.85"/>
        <line x1="40" y1="42" x2="40" y2="54" stroke={c} strokeWidth="2.5" strokeLinecap="round"/>
        {/* hips */}
        <Jt x={40} y={48} type="hip"/>
        {/* legs */}
        <line x1="40" y1="54" x2="33" y2="59" stroke={c} strokeWidth="1.8" strokeLinecap="round"/>
        <line x1="40" y1="54" x2="47" y2="59" stroke={c} strokeWidth="1.8" strokeLinecap="round"/>
        {/* animated: upper arms + bar */}
        <g className={`pb_mv_${uid}`}>
          {/* upper arm L: shoulder→elbow */}
          <line x1="35" y1="43" x2="27" y2="36" stroke={c} strokeWidth="2" strokeLinecap="round"/>
          {/* forearm L: elbow→wrist/bar */}
          <line x1="27" y1="36" x2="20" y2="24" stroke={c} strokeWidth="2" strokeLinecap="round"/>
          {/* upper arm R */}
          <line x1="45" y1="43" x2="53" y2="36" stroke={c} strokeWidth="2" strokeLinecap="round"/>
          {/* forearm R */}
          <line x1="53" y1="36" x2="60" y2="24" stroke={c} strokeWidth="2" strokeLinecap="round"/>
          {/* bar */}
          <line x1="14" y1="24" x2="66" y2="24" stroke={c} strokeWidth="2.5" strokeLinecap="round"/>
          <circle cx="14" cy="24" r="4" fill="#14110F" stroke={c} strokeWidth="1.5"/>
          <circle cx="66" cy="24" r="4" fill="#14110F" stroke={c} strokeWidth="1.5"/>
          {/* joints on animated group */}
          <Jt x={35} y={43} type="shoulder"/>
          <Jt x={45} y={43} type="shoulder"/>
          <Jt x={27} y={36} type="elbow"/>
          <Jt x={53} y={36} type="elbow"/>
          <Jt x={20} y={24} type="wrist"/>
          <Jt x={60} y={24} type="wrist"/>
        </g>
      </svg>
    ),

    // ── PRESS INCLINADO ────────────────────────────────────────────
    press_inclinado: (
      <svg viewBox="0 0 80 60" fill="none">
        <style>{`
          @keyframes pi_${uid} { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-9px)} }
          .pi_mv_${uid} { animation: pi_${uid} 2.2s ease-in-out infinite; transform-origin:26px 25px; }
        `}</style>
        {/* inclined bench */}
        <rect x="6" y="37" width="52" height="5" rx="2" transform="rotate(-22 6 37)" fill="#242019" stroke={c} strokeWidth="1" opacity="0.8"/>
        <line x1="55" y1="22" x2="60" y2="54" stroke={c} strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/>
        <line x1="8" y1="42" x2="10" y2="54" stroke={c} strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/>
        {/* head + torso */}
        <ellipse cx="20" cy="14" rx="5" ry="5" fill={c} opacity="0.85"/>
        <line x1="20" y1="19" x2="36" y2="34" stroke={c} strokeWidth="2.5" strokeLinecap="round"/>
        {/* legs */}
        <line x1="36" y1="34" x2="30" y2="50" stroke={c} strokeWidth="2" strokeLinecap="round"/>
        <line x1="36" y1="34" x2="44" y2="50" stroke={c} strokeWidth="2" strokeLinecap="round"/>
        {/* shoulder joints fixed */}
        <Jt x={25} y={22} type="shoulder"/>
        <Jt x={29} y={25} type="shoulder"/>
        {/* animated arms */}
        <g className={`pi_mv_${uid}`}>
          {/* L arm: shoulder→elbow→dumbbell */}
          <line x1="25" y1="22" x2="16" y2="16" stroke={c} strokeWidth="1.8" strokeLinecap="round"/>
          <line x1="16" y1="16" x2="9" y2="8" stroke={c} strokeWidth="1.8" strokeLinecap="round"/>
          <circle cx="7" cy="6" r="4" fill="#14110F" stroke={c} strokeWidth="1.5"/>
          {/* R arm */}
          <line x1="29" y1="25" x2="38" y2="18" stroke={c} strokeWidth="1.8" strokeLinecap="round"/>
          <line x1="38" y1="18" x2="46" y2="10" stroke={c} strokeWidth="1.8" strokeLinecap="round"/>
          <circle cx="48" cy="8" r="4" fill="#14110F" stroke={c} strokeWidth="1.5"/>
          {/* joints */}
          <Jt x={16} y={16} type="elbow"/>
          <Jt x={38} y={18} type="elbow"/>
          <Jt x={9} y={8} type="wrist"/>
          <Jt x={46} y={10} type="wrist"/>
        </g>
      </svg>
    ),

    // ── PRESS MILITAR ──────────────────────────────────────────────
    press_militar: (
      <svg viewBox="0 0 80 60" fill="none">
        <style>{`
          @keyframes pm_${uid} { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-11px)} }
          .pm_mv_${uid} { animation: pm_${uid} 2s ease-in-out infinite; transform-origin:40px 23px; }
        `}</style>
        {/* head */}
        <ellipse cx="40" cy="9" rx="6" ry="6" fill={c} opacity="0.85"/>
        {/* torso */}
        <line x1="40" y1="15" x2="40" y2="38" stroke={c} strokeWidth="2.5" strokeLinecap="round"/>
        {/* legs */}
        <line x1="40" y1="38" x2="32" y2="56" stroke={c} strokeWidth="2" strokeLinecap="round"/>
        <line x1="40" y1="38" x2="48" y2="56" stroke={c} strokeWidth="2" strokeLinecap="round"/>
        {/* knee joints */}
        <Jt x={36} y={47} type="knee"/>
        <Jt x={44} y={47} type="knee"/>
        {/* hip */}
        <Jt x={40} y={38} type="hip"/>
        {/* animated arms + dumbbells */}
        <g className={`pm_mv_${uid}`}>
          {/* L: shoulder→elbow→wrist */}
          <line x1="40" y1="23" x2="28" y2="20" stroke={c} strokeWidth="2" strokeLinecap="round"/>
          <line x1="28" y1="20" x2="18" y2="14" stroke={c} strokeWidth="2" strokeLinecap="round"/>
          {/* R */}
          <line x1="40" y1="23" x2="52" y2="20" stroke={c} strokeWidth="2" strokeLinecap="round"/>
          <line x1="52" y1="20" x2="62" y2="14" stroke={c} strokeWidth="2" strokeLinecap="round"/>
          {/* dumbbells */}
          <circle cx="15" cy="12" r="4" fill="#14110F" stroke={c} strokeWidth="1.5"/>
          <circle cx="65" cy="12" r="4" fill="#14110F" stroke={c} strokeWidth="1.5"/>
          {/* joints */}
          <Jt x={40} y={23} type="shoulder"/>
          <Jt x={40} y={23} type="shoulder"/>
          <Jt x={28} y={20} type="elbow"/>
          <Jt x={52} y={20} type="elbow"/>
          <Jt x={18} y={14} type="wrist"/>
          <Jt x={62} y={14} type="wrist"/>
        </g>
      </svg>
    ),

    // ── ELEVACIONES LATERALES ──────────────────────────────────────
    elevaciones_laterales: (
      <svg viewBox="0 0 80 60" fill="none">
        <style>{`
          @keyframes el_l_${uid} { 0%,100%{transform:rotate(0deg)} 50%{transform:rotate(-30deg)} }
          @keyframes el_r_${uid} { 0%,100%{transform:rotate(0deg)} 50%{transform:rotate(30deg)} }
          .el_l_${uid} { animation: el_l_${uid} 2s ease-in-out infinite; transform-origin:38px 22px; }
          .el_r_${uid} { animation: el_r_${uid} 2s ease-in-out infinite; transform-origin:42px 22px; }
        `}</style>
        <ellipse cx="40" cy="9" rx="6" ry="6" fill={c} opacity="0.85"/>
        <line x1="40" y1="15" x2="40" y2="38" stroke={c} strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="40" y1="38" x2="32" y2="56" stroke={c} strokeWidth="2" strokeLinecap="round"/>
        <line x1="40" y1="38" x2="48" y2="56" stroke={c} strokeWidth="2" strokeLinecap="round"/>
        <Jt x={40} y={38} type="hip"/>
        <Jt x={36} y={47} type="knee"/>
        <Jt x={44} y={47} type="knee"/>
        {/* L arm */}
        <g className={`el_l_${uid}`}>
          <line x1="38" y1="22" x2="26" y2="26" stroke={c} strokeWidth="2" strokeLinecap="round"/>
          <line x1="26" y1="26" x2="14" y2="28" stroke={c} strokeWidth="2" strokeLinecap="round"/>
          <circle cx="11" cy="28" r="4" fill="#14110F" stroke={c} strokeWidth="1.5"/>
          <Jt x={38} y={22} type="shoulder"/>
          <Jt x={26} y={26} type="elbow" r={2.5}/>
          <Jt x={14} y={28} type="wrist" r={2}/>
        </g>
        {/* R arm */}
        <g className={`el_r_${uid}`}>
          <line x1="42" y1="22" x2="54" y2="26" stroke={c} strokeWidth="2" strokeLinecap="round"/>
          <line x1="54" y1="26" x2="66" y2="28" stroke={c} strokeWidth="2" strokeLinecap="round"/>
          <circle cx="69" cy="28" r="4" fill="#14110F" stroke={c} strokeWidth="1.5"/>
          <Jt x={42} y={22} type="shoulder"/>
          <Jt x={54} y={26} type="elbow" r={2.5}/>
          <Jt x={66} y={28} type="wrist" r={2}/>
        </g>
      </svg>
    ),

    // ── SKULL CRUSHER ──────────────────────────────────────────────
    skull_crusher: (
      <svg viewBox="0 0 80 60" fill="none">
        <style>{`
          @keyframes sc_${uid} { 0%,100%{transform:rotate(0deg)} 50%{transform:rotate(35deg)} }
          .sc_l_${uid} { animation: sc_${uid} 2s ease-in-out infinite; transform-origin:33px 43px; }
          @keyframes sc_r_${uid} { 0%,100%{transform:rotate(0deg)} 50%{transform:rotate(-35deg)} }
          .sc_r_${uid} { animation: sc_r_${uid} 2s ease-in-out infinite; transform-origin:47px 43px; }
        `}</style>
        <rect x="8" y="43" width="64" height="5" rx="2" fill="#242019" stroke={c} strokeWidth="1"/>
        <rect x="10" y="48" width="5" height="9" rx="1" fill={c} opacity="0.3"/>
        <rect x="65" y="48" width="5" height="9" rx="1" fill={c} opacity="0.3"/>
        {/* head */}
        <ellipse cx="40" cy="37" rx="5" ry="5" fill={c} opacity="0.85"/>
        <line x1="40" y1="42" x2="40" y2="55" stroke={c} strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="40" y1="55" x2="33" y2="59" stroke={c} strokeWidth="1.8" strokeLinecap="round"/>
        <line x1="40" y1="55" x2="47" y2="59" stroke={c} strokeWidth="1.8" strokeLinecap="round"/>
        {/* upper arms — fixed vertical */}
        <line x1="33" y1="43" x2="33" y2="32" stroke={c} strokeWidth="2" strokeLinecap="round"/>
        <line x1="47" y1="43" x2="47" y2="32" stroke={c} strokeWidth="2" strokeLinecap="round"/>
        <Jt x={33} y={43} type="shoulder"/>
        <Jt x={47} y={43} type="shoulder"/>
        {/* animated forearms */}
        <g className={`sc_l_${uid}`}>
          <line x1="33" y1="32" x2="33" y2="20" stroke={c} strokeWidth="2" strokeLinecap="round"/>
          <Jt x={33} y={32} type="elbow"/>
          <Jt x={33} y={20} type="wrist" r={2}/>
        </g>
        <g className={`sc_r_${uid}`}>
          <line x1="47" y1="32" x2="47" y2="20" stroke={c} strokeWidth="2" strokeLinecap="round"/>
          <Jt x={47} y={32} type="elbow"/>
          <Jt x={47} y={20} type="wrist" r={2}/>
        </g>
        {/* bar between wrists — simplified */}
        <line x1="33" y1="20" x2="47" y2="20" stroke={c} strokeWidth="2" strokeLinecap="round" opacity="0.5"/>
      </svg>
    ),

    // ── FONDOS ENTRE BANCOS ────────────────────────────────────────
    fondos_banco: (
      <svg viewBox="0 0 80 60" fill="none">
        <style>{`
          @keyframes fb_${uid} { 0%,100%{transform:translateY(0)} 50%{transform:translateY(9px)} }
          .fb_mv_${uid} { animation: fb_${uid} 2s ease-in-out infinite; transform-origin:36px 24px; }
        `}</style>
        <rect x="2" y="32" width="24" height="5" rx="2" fill="#242019" stroke={c} strokeWidth="1"/>
        <rect x="54" y="46" width="24" height="5" rx="2" fill="#242019" stroke={c} strokeWidth="1"/>
        <g className={`fb_mv_${uid}`}>
          {/* head */}
          <ellipse cx="36" cy="18" rx="5" ry="5" fill={c} opacity="0.85"/>
          {/* torso */}
          <line x1="36" y1="23" x2="36" y2="40" stroke={c} strokeWidth="2.5" strokeLinecap="round"/>
          {/* L arm */}
          <line x1="36" y1="28" x2="24" y2="30" stroke={c} strokeWidth="2" strokeLinecap="round"/>
          <line x1="24" y1="30" x2="18" y2="36" stroke={c} strokeWidth="2" strokeLinecap="round"/>
          {/* R arm */}
          <line x1="36" y1="28" x2="52" y2="32" stroke={c} strokeWidth="2" strokeLinecap="round"/>
          <line x1="52" y1="32" x2="60" y2="38" stroke={c} strokeWidth="2" strokeLinecap="round"/>
          {/* legs */}
          <line x1="36" y1="40" x2="50" y2="46" stroke={c} strokeWidth="2" strokeLinecap="round"/>
          <line x1="36" y1="40" x2="56" y2="50" stroke={c} strokeWidth="2" strokeLinecap="round"/>
          {/* dumbbell on lap */}
          <circle cx="50" cy="43" r="3.5" fill="#14110F" stroke={c} strokeWidth="1.5"/>
          {/* joints */}
          <Jt x={36} y={28} type="shoulder"/>
          <Jt x={36} y={28} type="shoulder"/>
          <Jt x={24} y={30} type="elbow"/>
          <Jt x={52} y={32} type="elbow"/>
          <Jt x={18} y={36} type="wrist" r={2}/>
          <Jt x={60} y={38} type="wrist" r={2}/>
          <Jt x={36} y={40} type="hip"/>
        </g>
      </svg>
    ),

    // ── SENTADILLA ─────────────────────────────────────────────────
    sentadilla: (
      <svg viewBox="0 0 80 60" fill="none">
        <style>{`
          @keyframes sq_${uid} { 0%,100%{transform:translateY(0)} 50%{transform:translateY(10px)} }
          .sq_mv_${uid} { animation: sq_${uid} 2.2s ease-in-out infinite; transform-origin:40px 21px; }
        `}</style>
        {/* bar */}
        <line x1="12" y1="21" x2="68" y2="21" stroke={c} strokeWidth="2.5" strokeLinecap="round"/>
        <circle cx="12" cy="21" r="4" fill="#14110F" stroke={c} strokeWidth="1.5"/>
        <circle cx="68" cy="21" r="4" fill="#14110F" stroke={c} strokeWidth="1.5"/>
        <g className={`sq_mv_${uid}`}>
          {/* head */}
          <ellipse cx="40" cy="14" rx="5" ry="5" fill={c} opacity="0.85"/>
          {/* torso */}
          <line x1="40" y1="19" x2="38" y2="37" stroke={c} strokeWidth="2.5" strokeLinecap="round"/>
          {/* arms on bar */}
          <line x1="40" y1="23" x2="28" y2="21" stroke={c} strokeWidth="1.8" strokeLinecap="round"/>
          <line x1="40" y1="23" x2="52" y2="21" stroke={c} strokeWidth="1.8" strokeLinecap="round"/>
          {/* thighs */}
          <line x1="38" y1="37" x2="26" y2="48" stroke={c} strokeWidth="2" strokeLinecap="round"/>
          <line x1="38" y1="37" x2="50" y2="48" stroke={c} strokeWidth="2" strokeLinecap="round"/>
          {/* shins */}
          <line x1="26" y1="48" x2="22" y2="58" stroke={c} strokeWidth="2" strokeLinecap="round"/>
          <line x1="50" y1="48" x2="54" y2="58" stroke={c} strokeWidth="2" strokeLinecap="round"/>
          {/* joints */}
          <Jt x={40} y={23} type="shoulder"/>
          <Jt x={40} y={23} type="shoulder"/>
          <Jt x={28} y={21} type="elbow" r={2}/>
          <Jt x={52} y={21} type="elbow" r={2}/>
          <Jt x={38} y={37} type="hip"/>
          <Jt x={26} y={48} type="knee"/>
          <Jt x={50} y={48} type="knee"/>
        </g>
        <line x1="10" y1="58" x2="70" y2="58" stroke="#3A332B" strokeWidth="1"/>
      </svg>
    ),

    // ── ZANCADAS ───────────────────────────────────────────────────
    zancadas: (
      <svg viewBox="0 0 80 60" fill="none">
        <style>{`
          @keyframes lu_${uid} { 0%,100%{transform:translateY(0)} 50%{transform:translateY(9px)} }
          .lu_mv_${uid} { animation: lu_${uid} 2s ease-in-out infinite; transform-origin:38px 15px; }
        `}</style>
        <g className={`lu_mv_${uid}`}>
          {/* head */}
          <ellipse cx="38" cy="9" rx="5" ry="5" fill={c} opacity="0.85"/>
          {/* torso */}
          <line x1="38" y1="14" x2="38" y2="33" stroke={c} strokeWidth="2.5" strokeLinecap="round"/>
          {/* arms with dumbbells */}
          <line x1="38" y1="24" x2="24" y2="28" stroke={c} strokeWidth="2" strokeLinecap="round"/>
          <circle cx="20" cy="30" r="4" fill="#14110F" stroke={c} strokeWidth="1.5"/>
          <line x1="38" y1="24" x2="52" y2="28" stroke={c} strokeWidth="2" strokeLinecap="round"/>
          <circle cx="56" cy="30" r="4" fill="#14110F" stroke={c} strokeWidth="1.5"/>
          {/* front leg: thigh + shin */}
          <line x1="38" y1="33" x2="26" y2="46" stroke={c} strokeWidth="2.2" strokeLinecap="round"/>
          <line x1="26" y1="46" x2="20" y2="58" stroke={c} strokeWidth="2" strokeLinecap="round"/>
          {/* back leg */}
          <line x1="38" y1="33" x2="52" y2="46" stroke={c} strokeWidth="2.2" strokeLinecap="round"/>
          <line x1="52" y1="46" x2="58" y2="58" stroke={c} strokeWidth="2" strokeLinecap="round"/>
          {/* joints */}
          <Jt x={38} y={24} type="shoulder"/>
          <Jt x={38} y={24} type="shoulder"/>
          <Jt x={24} y={28} type="elbow" r={2}/>
          <Jt x={52} y={28} type="elbow" r={2}/>
          <Jt x={38} y={33} type="hip"/>
          <Jt x={26} y={46} type="knee"/>
          <Jt x={52} y={46} type="knee"/>
        </g>
        <line x1="10" y1="58" x2="70" y2="58" stroke="#3A332B" strokeWidth="1"/>
      </svg>
    ),

    // ── HIP THRUST ─────────────────────────────────────────────────
    hip_thrust: (
      <svg viewBox="0 0 80 60" fill="none">
        <style>{`
          @keyframes ht_${uid} { 0%,100%{transform:rotate(0deg)} 50%{transform:rotate(-20deg)} }
          .ht_mv_${uid} { animation: ht_${uid} 2s ease-in-out infinite; transform-origin:22px 36px; }
        `}</style>
        {/* bench */}
        <rect x="2" y="30" width="28" height="7" rx="2" fill="#242019" stroke={c} strokeWidth="1"/>
        {/* head + upper torso resting on bench */}
        <ellipse cx="16" cy="23" rx="5" ry="5" fill={c} opacity="0.85"/>
        <line x1="16" y1="28" x2="22" y2="36" stroke={c} strokeWidth="2.5" strokeLinecap="round"/>
        <Jt x={22} y={36} type="shoulder"/>
        {/* animated: hips + legs */}
        <g className={`ht_mv_${uid}`}>
          {/* hip-to-knee */}
          <line x1="22" y1="36" x2="46" y2="28" stroke={c} strokeWidth="2.5" strokeLinecap="round"/>
          {/* dumbbell on hips */}
          <circle cx="36" cy="24" r="5" fill="#14110F" stroke={c} strokeWidth="1.5"/>
          <line x1="31" y1="24" x2="41" y2="24" stroke={c} strokeWidth="2"/>
          {/* thigh → knee → shin */}
          <line x1="46" y1="28" x2="58" y2="44" stroke={c} strokeWidth="2.2" strokeLinecap="round"/>
          <line x1="58" y1="44" x2="70" y2="46" stroke={c} strokeWidth="2" strokeLinecap="round"/>
          {/* joints */}
          <Jt x={46} y={28} type="hip"/>
          <Jt x={58} y={44} type="knee"/>
          <Jt x={70} y={46} type="wrist" r={2}/>
        </g>
        <line x1="10" y1="56" x2="74" y2="56" stroke="#3A332B" strokeWidth="1"/>
      </svg>
    ),

    // ── ROMANIAN DEADLIFT ──────────────────────────────────────────
    rdl: (
      <svg viewBox="0 0 80 60" fill="none">
        <style>{`
          @keyframes rdl_${uid} { 0%,100%{transform:rotate(0deg)} 50%{transform:rotate(25deg)} }
          .rdl_mv_${uid} { animation: rdl_${uid} 2.2s ease-in-out infinite; transform-origin:40px 36px; }
        `}</style>
        {/* static legs */}
        <line x1="40" y1="36" x2="33" y2="56" stroke={c} strokeWidth="2.2" strokeLinecap="round"/>
        <line x1="40" y1="36" x2="47" y2="56" stroke={c} strokeWidth="2.2" strokeLinecap="round"/>
        <Jt x={37} y={46} type="knee"/>
        <Jt x={44} y={46} type="knee"/>
        <Jt x={40} y={36} type="hip"/>
        <line x1="10" y1="58" x2="70" y2="58" stroke="#3A332B" strokeWidth="1"/>
        {/* animated torso + arms */}
        <g className={`rdl_mv_${uid}`}>
          {/* torso */}
          <line x1="40" y1="36" x2="22" y2="22" stroke={c} strokeWidth="2.5" strokeLinecap="round"/>
          {/* head */}
          <ellipse cx="18" cy="17" rx="5" ry="5" fill={c} opacity="0.85"/>
          {/* L arm: shoulder→elbow→dumbbell */}
          <line x1="28" y1="28" x2="30" y2="40" stroke={c} strokeWidth="2" strokeLinecap="round"/>
          <line x1="30" y1="40" x2="31" y2="50" stroke={c} strokeWidth="2" strokeLinecap="round"/>
          <circle cx="31" cy="54" r="4" fill="#14110F" stroke={c} strokeWidth="1.5"/>
          {/* R arm */}
          <line x1="32" y1="30" x2="38" y2="40" stroke={c} strokeWidth="2" strokeLinecap="round"/>
          <line x1="38" y1="40" x2="42" y2="50" stroke={c} strokeWidth="2" strokeLinecap="round"/>
          <circle cx="42" cy="54" r="4" fill="#14110F" stroke={c} strokeWidth="1.5"/>
          {/* joints */}
          <Jt x={28} y={28} type="shoulder"/>
          <Jt x={32} y={30} type="shoulder"/>
          <Jt x={30} y={40} type="elbow"/>
          <Jt x={38} y={40} type="elbow"/>
        </g>
      </svg>
    ),

    // ── GEMELOS ────────────────────────────────────────────────────
    gemelos: (
      <svg viewBox="0 0 80 60" fill="none">
        <style>{`
          @keyframes ca_${uid} { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-9px)} }
          .ca_mv_${uid} { animation: ca_${uid} 1.8s ease-in-out infinite; transform-origin:40px 45px; }
        `}</style>
        {/* step */}
        <rect x="22" y="44" width="36" height="6" rx="2" fill="#242019" stroke={c} strokeWidth="1"/>
        <rect x="14" y="50" width="52" height="7" rx="2" fill="#242019" stroke={c} strokeWidth="1"/>
        <g className={`ca_mv_${uid}`}>
          {/* head */}
          <ellipse cx="40" cy="7" rx="5" ry="5" fill={c} opacity="0.85"/>
          {/* torso */}
          <line x1="40" y1="12" x2="40" y2="33" stroke={c} strokeWidth="2.5" strokeLinecap="round"/>
          {/* arms + dumbbells */}
          <line x1="40" y1="23" x2="26" y2="27" stroke={c} strokeWidth="2" strokeLinecap="round"/>
          <line x1="26" y1="27" x2="20" y2="33" stroke={c} strokeWidth="2" strokeLinecap="round"/>
          <circle cx="17" cy="35" r="4" fill="#14110F" stroke={c} strokeWidth="1.5"/>
          <line x1="40" y1="23" x2="54" y2="27" stroke={c} strokeWidth="2" strokeLinecap="round"/>
          <line x1="54" y1="27" x2="60" y2="33" stroke={c} strokeWidth="2" strokeLinecap="round"/>
          <circle cx="63" cy="35" r="4" fill="#14110F" stroke={c} strokeWidth="1.5"/>
          {/* thighs → knees */}
          <line x1="40" y1="33" x2="34" y2="44" stroke={c} strokeWidth="2.2" strokeLinecap="round"/>
          <line x1="40" y1="33" x2="46" y2="44" stroke={c} strokeWidth="2.2" strokeLinecap="round"/>
          {/* shins — tiptoe position */}
          <line x1="34" y1="44" x2="31" y2="44" stroke={c} strokeWidth="2" strokeLinecap="round"/>
          <line x1="46" y1="44" x2="49" y2="44" stroke={c} strokeWidth="2" strokeLinecap="round"/>
          {/* joints */}
          <Jt x={40} y={23} type="shoulder"/>
          <Jt x={40} y={23} type="shoulder"/>
          <Jt x={26} y={27} type="elbow" r={2}/>
          <Jt x={54} y={27} type="elbow" r={2}/>
          <Jt x={40} y={33} type="hip"/>
          <Jt x={34} y={44} type="knee"/>
          <Jt x={46} y={44} type="knee"/>
        </g>
      </svg>
    ),

    // ── BARBELL ROW ────────────────────────────────────────────────
    barbell_row: (
      <svg viewBox="0 0 80 60" fill="none">
        <style>{`
          @keyframes br_${uid} { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-11px)} }
          .br_mv_${uid} { animation: br_${uid} 2s ease-in-out infinite; transform-origin:40px 44px; }
        `}</style>
        {/* torso inclinado */}
        <ellipse cx="18" cy="16" rx="5" ry="5" fill={c} opacity="0.85"/>
        <line x1="18" y1="21" x2="40" y2="38" stroke={c} strokeWidth="2.5" strokeLinecap="round"/>
        {/* legs */}
        <line x1="40" y1="38" x2="32" y2="56" stroke={c} strokeWidth="2.2" strokeLinecap="round"/>
        <line x1="40" y1="38" x2="48" y2="56" stroke={c} strokeWidth="2.2" strokeLinecap="round"/>
        <Jt x={40} y={38} type="hip"/>
        <Jt x={36} y={47} type="knee"/>
        <Jt x={44} y={47} type="knee"/>
        <line x1="10" y1="58" x2="70" y2="58" stroke="#3A332B" strokeWidth="1"/>
        {/* animated arms + bar */}
        <g className={`br_mv_${uid}`}>
          {/* L arm */}
          <line x1="26" y1="28" x2="30" y2="36" stroke={c} strokeWidth="2" strokeLinecap="round"/>
          <line x1="30" y1="36" x2="28" y2="44" stroke={c} strokeWidth="2" strokeLinecap="round"/>
          {/* R arm */}
          <line x1="34" y1="32" x2="40" y2="38" stroke={c} strokeWidth="2" strokeLinecap="round"/>
          <line x1="40" y1="38" x2="42" y2="44" stroke={c} strokeWidth="2" strokeLinecap="round"/>
          {/* bar */}
          <line x1="16" y1="44" x2="62" y2="44" stroke={c} strokeWidth="2.5" strokeLinecap="round"/>
          <circle cx="14" cy="44" r="4" fill="#14110F" stroke={c} strokeWidth="1.5"/>
          <circle cx="64" cy="44" r="4" fill="#14110F" stroke={c} strokeWidth="1.5"/>
          {/* joints */}
          <Jt x={26} y={28} type="shoulder"/>
          <Jt x={34} y={32} type="shoulder"/>
          <Jt x={30} y={36} type="elbow"/>
          <Jt x={40} y={38} type="elbow"/>
          <Jt x={28} y={44} type="wrist" r={2}/>
          <Jt x={42} y={44} type="wrist" r={2}/>
        </g>
      </svg>
    ),

    // ── REMO UNILATERAL ────────────────────────────────────────────
    remo_unilateral: (
      <svg viewBox="0 0 80 60" fill="none">
        <style>{`
          @keyframes ru_${uid} { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-11px)} }
          .ru_mv_${uid} { animation: ru_${uid} 2s ease-in-out infinite; transform-origin:20px 30px; }
        `}</style>
        {/* bench */}
        <rect x="2" y="32" width="28" height="5" rx="2" fill="#242019" stroke={c} strokeWidth="1"/>
        {/* head */}
        <ellipse cx="14" cy="19" rx="5" ry="5" fill={c} opacity="0.85"/>
        {/* torso */}
        <line x1="14" y1="24" x2="20" y2="36" stroke={c} strokeWidth="2.5" strokeLinecap="round"/>
        {/* support arm on bench */}
        <line x1="14" y1="28" x2="9" y2="32" stroke={c} strokeWidth="2" strokeLinecap="round"/>
        <Jt x={14} y={28} type="shoulder"/>
        <Jt x={9} y={32} type="elbow"/>
        {/* legs */}
        <line x1="20" y1="36" x2="13" y2="52" stroke={c} strokeWidth="2" strokeLinecap="round"/>
        <line x1="20" y1="36" x2="30" y2="52" stroke={c} strokeWidth="2" strokeLinecap="round"/>
        <Jt x={20} y={36} type="hip"/>
        <Jt x={17} y={44} type="knee"/>
        <Jt x={25} y={44} type="knee"/>
        {/* animated pulling arm */}
        <g className={`ru_mv_${uid}`}>
          <line x1="20" y1="30" x2="44" y2="36" stroke={c} strokeWidth="2" strokeLinecap="round"/>
          <line x1="44" y1="36" x2="48" y2="48" stroke={c} strokeWidth="2" strokeLinecap="round"/>
          <circle cx="49" cy="52" r="4" fill="#14110F" stroke={c} strokeWidth="1.5"/>
          <Jt x={20} y={30} type="shoulder"/>
          <Jt x={44} y={36} type="elbow"/>
          <Jt x={48} y={48} type="wrist" r={2}/>
        </g>
      </svg>
    ),

    // ── PULLOVER ───────────────────────────────────────────────────
    pullover: (
      <svg viewBox="0 0 80 60" fill="none">
        <style>{`
          @keyframes po_${uid} { 0%,100%{transform:rotate(0deg)} 50%{transform:rotate(-32deg)} }
          .po_mv_${uid} { animation: po_${uid} 2.2s ease-in-out infinite; transform-origin:40px 40px; }
        `}</style>
        <rect x="8" y="43" width="64" height="5" rx="2" fill="#242019" stroke={c} strokeWidth="1"/>
        <rect x="10" y="48" width="5" height="9" rx="1" fill={c} opacity="0.3"/>
        <rect x="65" y="48" width="5" height="9" rx="1" fill={c} opacity="0.3"/>
        <ellipse cx="40" cy="37" rx="5" ry="5" fill={c} opacity="0.85"/>
        <line x1="40" y1="42" x2="40" y2="55" stroke={c} strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="40" y1="55" x2="33" y2="59" stroke={c} strokeWidth="1.8" strokeLinecap="round"/>
        <line x1="40" y1="55" x2="47" y2="59" stroke={c} strokeWidth="1.8" strokeLinecap="round"/>
        {/* shoulder joints */}
        <Jt x={34} y={40} type="shoulder"/>
        <Jt x={46} y={40} type="shoulder"/>
        {/* animated arms arc */}
        <g className={`po_mv_${uid}`}>
          {/* L arm */}
          <line x1="34" y1="40" x2="24" y2="30" stroke={c} strokeWidth="2" strokeLinecap="round"/>
          <line x1="24" y1="30" x2="20" y2="20" stroke={c} strokeWidth="2" strokeLinecap="round"/>
          {/* R arm */}
          <line x1="46" y1="40" x2="56" y2="30" stroke={c} strokeWidth="2" strokeLinecap="round"/>
          <line x1="56" y1="30" x2="60" y2="20" stroke={c} strokeWidth="2" strokeLinecap="round"/>
          {/* dumbbell */}
          <circle cx="37" cy="14" r="5" fill="#14110F" stroke={c} strokeWidth="1.5"/>
          <circle cx="43" cy="14" r="5" fill="#14110F" stroke={c} strokeWidth="1.5"/>
          <line x1="20" y1="20" x2="60" y2="20" stroke={c} strokeWidth="1.5" opacity="0.6"/>
          {/* joints */}
          <Jt x={24} y={30} type="elbow"/>
          <Jt x={56} y={30} type="elbow"/>
          <Jt x={20} y={20} type="wrist" r={2}/>
          <Jt x={60} y={20} type="wrist" r={2}/>
        </g>
      </svg>
    ),

    // ── CURL BARRA ─────────────────────────────────────────────────
    curl_barra: (
      <svg viewBox="0 0 80 60" fill="none">
        <style>{`
          @keyframes cb_${uid} { 0%,100%{transform:rotate(0deg)} 50%{transform:rotate(-38deg)} }
          .cb_mv_${uid} { animation: cb_${uid} 2s ease-in-out infinite; transform-origin:40px 26px; }
        `}</style>
        <ellipse cx="40" cy="9" rx="5" ry="5" fill={c} opacity="0.85"/>
        <line x1="40" y1="14" x2="40" y2="36" stroke={c} strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="40" y1="36" x2="32" y2="56" stroke={c} strokeWidth="2" strokeLinecap="round"/>
        <line x1="40" y1="36" x2="48" y2="56" stroke={c} strokeWidth="2" strokeLinecap="round"/>
        <Jt x={40} y={36} type="hip"/>
        <Jt x={36} y={46} type="knee"/>
        <Jt x={44} y={46} type="knee"/>
        {/* shoulder joints fixed */}
        <Jt x={34} y={26} type="shoulder"/>
        <Jt x={46} y={26} type="shoulder"/>
        {/* animated forearms */}
        <g className={`cb_mv_${uid}`}>
          {/* L: elbow→wrist */}
          <line x1="34" y1="26" x2="26" y2="34" stroke={c} strokeWidth="2" strokeLinecap="round"/>
          <line x1="26" y1="34" x2="22" y2="44" stroke={c} strokeWidth="2" strokeLinecap="round"/>
          {/* R */}
          <line x1="46" y1="26" x2="54" y2="34" stroke={c} strokeWidth="2" strokeLinecap="round"/>
          <line x1="54" y1="34" x2="58" y2="44" stroke={c} strokeWidth="2" strokeLinecap="round"/>
          {/* bar */}
          <line x1="18" y1="46" x2="62" y2="46" stroke={c} strokeWidth="2.5" strokeLinecap="round"/>
          <circle cx="16" cy="46" r="4" fill="#14110F" stroke={c} strokeWidth="1.5"/>
          <circle cx="64" cy="46" r="4" fill="#14110F" stroke={c} strokeWidth="1.5"/>
          {/* joints */}
          <Jt x={26} y={34} type="elbow"/>
          <Jt x={54} y={34} type="elbow"/>
          <Jt x={22} y={44} type="wrist" r={2}/>
          <Jt x={58} y={44} type="wrist" r={2}/>
        </g>
      </svg>
    ),

    // ── CURL MARTILLO ──────────────────────────────────────────────
    curl_martillo: (
      <svg viewBox="0 0 80 60" fill="none">
        <style>{`
          @keyframes cm_${uid} { 0%,100%{transform:rotate(0deg)} 50%{transform:rotate(-38deg)} }
          .cm_mv_${uid} { animation: cm_${uid} 2s ease-in-out infinite; transform-origin:32px 26px; }
        `}</style>
        <ellipse cx="40" cy="9" rx="5" ry="5" fill={c} opacity="0.85"/>
        <line x1="40" y1="14" x2="40" y2="36" stroke={c} strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="40" y1="36" x2="33" y2="56" stroke={c} strokeWidth="2" strokeLinecap="round"/>
        <line x1="40" y1="36" x2="47" y2="56" stroke={c} strokeWidth="2" strokeLinecap="round"/>
        <Jt x={40} y={36} type="hip"/>
        <Jt x={36} y={46} type="knee"/>
        <Jt x={44} y={46} type="knee"/>
        {/* resting arm R */}
        <line x1="40" y1="24" x2="52" y2="30" stroke={c} strokeWidth="2" strokeLinecap="round"/>
        <line x1="52" y1="30" x2="55" y2="46" stroke={c} strokeWidth="2" strokeLinecap="round"/>
        <circle cx="56" cy="50" r="4" fill="#14110F" stroke={c} strokeWidth="1.5"/>
        <Jt x={40} y={24} type="shoulder"/>
        <Jt x={52} y={30} type="elbow"/>
        {/* animated L arm */}
        <g className={`cm_mv_${uid}`}>
          <line x1="32" y1="26" x2="26" y2="34" stroke={c} strokeWidth="2" strokeLinecap="round"/>
          <line x1="26" y1="34" x2="24" y2="46" stroke={c} strokeWidth="2" strokeLinecap="round"/>
          {/* vertical dumbbell */}
          <rect x="20" y="46" width="8" height="13" rx="2" fill="#14110F" stroke={c} strokeWidth="1.5"/>
          <rect x="18" y="46" width="12" height="3" rx="1" fill={c} opacity="0.6"/>
          <rect x="18" y="56" width="12" height="3" rx="1" fill={c} opacity="0.6"/>
          <Jt x={32} y={26} type="shoulder"/>
          <Jt x={26} y={34} type="elbow"/>
          <Jt x={24} y={46} type="wrist" r={2}/>
        </g>
      </svg>
    ),

    // ── FACE PULL ──────────────────────────────────────────────────
    face_pull: (
      <svg viewBox="0 0 80 60" fill="none">
        <style>{`
          @keyframes fp_${uid} { 0%,100%{transform:translateX(0)} 50%{transform:translateX(-11px)} }
          .fp_mv_${uid} { animation: fp_${uid} 2s ease-in-out infinite; transform-origin:28px 26px; }
        `}</style>
        {/* anchor */}
        <rect x="66" y="18" width="8" height="16" rx="2" fill="#242019" stroke="#3A332B" strokeWidth="1"/>
        <circle cx="70" cy="26" r="3" fill={c} opacity="0.5"/>
        {/* head */}
        <ellipse cx="26" cy="17" rx="5" ry="5" fill={c} opacity="0.85"/>
        {/* torso */}
        <line x1="26" y1="22" x2="26" y2="44" stroke={c} strokeWidth="2.5" strokeLinecap="round"/>
        {/* legs */}
        <line x1="26" y1="44" x2="18" y2="58" stroke={c} strokeWidth="2" strokeLinecap="round"/>
        <line x1="26" y1="44" x2="34" y2="58" stroke={c} strokeWidth="2" strokeLinecap="round"/>
        <Jt x={26} y={44} type="hip"/>
        <Jt x={22} y={51} type="knee"/>
        <Jt x={30} y={51} type="knee"/>
        {/* animated arms pulling */}
        <g className={`fp_mv_${uid}`}>
          {/* L arm: shoulder→elbow→wrist (band) */}
          <line x1="26" y1="26" x2="40" y2="22" stroke={c} strokeWidth="2" strokeLinecap="round"/>
          <line x1="40" y1="22" x2="66" y2="26" stroke={c} strokeWidth="1.3" strokeDasharray="3 2" opacity="0.7"/>
          {/* R arm */}
          <line x1="26" y1="28" x2="40" y2="30" stroke={c} strokeWidth="2" strokeLinecap="round"/>
          <line x1="40" y1="30" x2="66" y2="26" stroke={c} strokeWidth="1.3" strokeDasharray="3 2" opacity="0.7"/>
          {/* joints */}
          <Jt x={26} y={26} type="shoulder"/>
          <Jt x={26} y={28} type="shoulder"/>
          <Jt x={40} y={22} type="elbow"/>
          <Jt x={40} y={30} type="elbow"/>
        </g>
      </svg>
    ),

    // ── LES MILLS generic ──────────────────────────────────────────
    lesmills_generic: (
      <svg viewBox="0 0 80 60" fill="none">
        <style>{`
          @keyframes lm_${uid} { 0%,100%{transform:translateY(0)} 40%,60%{transform:translateY(-11px)} }
          .lm_mv_${uid} { animation: lm_${uid} 1.4s ease-in-out infinite; transform-origin:40px 30px; }
        `}</style>
        <g className={`lm_mv_${uid}`}>
          <ellipse cx="40" cy="7" rx="6" ry="6" fill={c} opacity="0.85"/>
          <line x1="40" y1="13" x2="40" y2="34" stroke={c} strokeWidth="2.5" strokeLinecap="round"/>
          <line x1="40" y1="21" x2="22" y2="11" stroke={c} strokeWidth="2" strokeLinecap="round"/>
          <line x1="40" y1="21" x2="58" y2="11" stroke={c} strokeWidth="2" strokeLinecap="round"/>
          <line x1="40" y1="34" x2="26" y2="48" stroke={c} strokeWidth="2" strokeLinecap="round"/>
          <line x1="26" y1="48" x2="20" y2="54" stroke={c} strokeWidth="2" strokeLinecap="round"/>
          <line x1="40" y1="34" x2="54" y2="48" stroke={c} strokeWidth="2" strokeLinecap="round"/>
          <line x1="54" y1="48" x2="60" y2="54" stroke={c} strokeWidth="2" strokeLinecap="round"/>
          <Jt x={40} y={21} type="shoulder"/>
          <Jt x={40} y={21} type="shoulder"/>
          <Jt x={22} y={11} type="elbow" r={2}/>
          <Jt x={58} y={11} type="elbow" r={2}/>
          <Jt x={40} y={34} type="hip"/>
          <Jt x={26} y={48} type="knee"/>
          <Jt x={54} y={48} type="knee"/>
        </g>
        <circle cx="40" cy="7" r="14" fill="none" stroke={c} strokeWidth="0.5" opacity="0.12"/>
      </svg>
    ),

    // ── RECOVERY generic ───────────────────────────────────────────
    recovery_generic: (
      <svg viewBox="0 0 80 60" fill="none">
        <style>{`
          @keyframes yg_${uid} { 0%,100%{transform:rotate(0deg)} 50%{transform:rotate(9deg)} }
          .yg_mv_${uid} { animation: yg_${uid} 3s ease-in-out infinite; transform-origin:40px 22px; }
        `}</style>
        <g className={`yg_mv_${uid}`}>
          <ellipse cx="40" cy="9" rx="5" ry="5" fill={c} opacity="0.85"/>
          <line x1="40" y1="14" x2="40" y2="34" stroke={c} strokeWidth="2.5" strokeLinecap="round"/>
          <line x1="40" y1="22" x2="16" y2="22" stroke={c} strokeWidth="2" strokeLinecap="round"/>
          <line x1="40" y1="22" x2="64" y2="22" stroke={c} strokeWidth="2" strokeLinecap="round"/>
          <line x1="40" y1="34" x2="28" y2="46" stroke={c} strokeWidth="2" strokeLinecap="round"/>
          <line x1="28" y1="46" x2="24" y2="58" stroke={c} strokeWidth="2" strokeLinecap="round"/>
          <line x1="40" y1="34" x2="58" y2="40" stroke={c} strokeWidth="2" strokeLinecap="round"/>
          <line x1="58" y1="40" x2="68" y2="50" stroke={c} strokeWidth="2" strokeLinecap="round"/>
          <Jt x={40} y={22} type="shoulder"/>
          <Jt x={40} y={22} type="shoulder"/>
          <Jt x={16} y={22} type="elbow" r={2}/>
          <Jt x={64} y={22} type="elbow" r={2}/>
          <Jt x={40} y={34} type="hip"/>
          <Jt x={28} y={46} type="knee"/>
          <Jt x={58} y={40} type="knee"/>
        </g>
        <circle cx="40" cy="30" r="22" fill="none" stroke={c} strokeWidth="0.5" opacity="0.15"/>
      </svg>
    ),
  };
  return svgs;
}

export const SVG_KEYS = Object.keys(buildSvgs("currentColor", "k"));
