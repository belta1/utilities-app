import { useState } from "react";

// ═══════════════════════════════════════════════════════════════
// DESIGN TOKENS — "Telemetria de cuerpo" : grafito calido + cobre
// ═══════════════════════════════════════════════════════════════
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

// Reusable joint dot
const Jt = ({ x, y, type, r = 3 }) => (
  <circle cx={x} cy={y} r={r} fill={J[type]} opacity="0.95" />
);

const ExerciseSVG = ({ id, accent }) => {
  const c = accent || "#E0853C";
  const uid = id.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_]/g, "");

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

  const nameMap = {
    "Press banca con barra": "press_banca",
    "Press inclinado con mancuernas": "press_inclinado",
    "Press militar con mancuernas de pie": "press_militar",
    "Elevaciones laterales": "elevaciones_laterales",
    "Skull crusher con mancuernas": "skull_crusher",
    "Fondos entre bancos con peso en regazo": "fondos_banco",
    "Sentadilla con barra libre": "sentadilla",
    "Zancadas con mancuernas": "zancadas",
    "Hip thrust en banco con mancuerna": "hip_thrust",
    "Romanian Deadlift con mancuernas": "rdl",
    "Elevacion de gemelos de pie": "gemelos",
    "Remo con barra libre (Barbell Row)": "barbell_row",
    "Remo unilateral con mancuerna": "remo_unilateral",
    "Pull-over con mancuerna": "pullover",
    "Curl de biceps con barra": "curl_barra",
    "Curl martillo con mancuernas": "curl_martillo",
    "Face pull con banda elastica": "face_pull",
    "Peso muerto convencional con barra": "peso_muerto",
    "Jalon dorsal en polea alta": "jalon_dorsal",
    "Remo con mancuernas en banco inclinado": "remo_banco_inclinado",
    "Aperturas con mancuernas en banco": "aperturas",
    "Extension de triceps en polea alta": "ext_triceps_polea",
    "Extension de cuadriceps en maquina": "ext_cuadriceps",
    "Curl femoral en maquina": "curl_femoral",
    "Face pull en polea alta": "face_pull_polea",
  };

  const key = nameMap[id] ||
    (id.includes("BODY") || id.includes("GRIT") ? "lesmills_generic" : "recovery_generic");
  return svgs[key] || svgs["lesmills_generic"];
};

// ── LEGEND ──────────────────────────────────────────────────────────
const JointLegend = () => (
  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", padding: "8px 16px", background: "#0d0d0d", borderBottom: "1px solid #1a1a1a" }}>
    {[["Hombro", J.shoulder], ["Codo", J.elbow], ["Rodilla", J.knee], ["Cadera", J.hip]].map(([lbl, col]) => (
      <div key={lbl} style={{ display: "flex", alignItems: "center", gap: 5 }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: col }} />
        <span style={{ fontSize: 9, color: "#666", letterSpacing: 1 }}>{lbl.toUpperCase()}</span>
      </div>
    ))}
  </div>
);

// ═══════════════════════════════════════════════════════════════
// DASHBOARD DATA — mediciones Samsung Health
// ═══════════════════════════════════════════════════════════════
const WEIGHT_SERIES = [
  { date: "1/23", w: 86.0 }, { date: "1/24", w: 85.6 }, { date: "2/18", w: 84.9 },
  { date: "2/25", w: 80.1 }, { date: "3/5", w: 79.8 }, { date: "5/6", w: 79.7 },
  { date: "5/27", w: 79.3 }, { date: "6/3", w: 76.5 }, { date: "7/15", w: 76.2 }, { date: "8/27", w: 77.8 },
];

const METRICS_NOW = [
  { label: "PESO", value: "77.8", unit: "kg", delta: "+1.6", good: true, range: "94% magro" },
  { label: "GRASA", value: "21.6", unit: "%", delta: "-1.3", good: true, range: "obj 15–17" },
  { label: "MUSCULO", value: "33.0", unit: "kg", delta: "+1.5", good: true, range: "recuperado" },
  { label: "BMI", value: "24.6", unit: "", delta: "+0.6", good: null, range: "normal 18.5–25" },
  { label: "BMR", value: "1,687", unit: "kcal", delta: "+49", good: true, range: "sobre promedio" },
  { label: "AGUA", value: "44.7", unit: "kg", delta: "+1.7", good: true, range: "39.6–43.4" },
];

const PROFILE = { edad: 36, altura: 178, nivel: "Principiante", split: "4 fuerza + 1 cardio + 1 recovery" };

const GOALS = [
  { label: "Grasa corporal", now: 21.6, target: 16.0, unit: "%", invert: true },
  { label: "Proteina diaria", now: 143, target: 146, unit: "g", invert: false },
  { label: "Sesiones/semana", now: 5, target: 6, unit: "", invert: false },
];

const weightSuggestions = {
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

const days = [
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

const SUPS = [
  { time: "Pre-entreno (30 min antes)", items: ["L-Arginina 1 capsula", "Creatina 1 scoop (5 g) con agua"], note: "La creatina puede tomarse en cualquier momento — pre es conveniente" },
  { time: "Post-entreno (desayuno)", items: ["Proteina whey 1 scoop (25–30 g) en leche o agua"], note: "Ventana anabolica: dentro de 60 min del entreno" },
];

// Macro targets
const MACROS = { kcal: 2400, prot: 146, carbs: 235, fat: 70 };

// Weekly meal plan — 7 days x 3 meals
// Proteina estimada por comida para llegar a 143g/dia
// Entreno manana → desayuno = comida mas carga proteica (whey ya suma ~27g)
const WEEK = [
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
const typeStyle = {
  fuerza:   { accent: "#E0853C", bg: "#2A1A0D", badge: "FUERZA" },
  lesmills: { accent: "#7DA7C7", bg: "#15212B", badge: "CARDIO" },
  recovery: { accent: "#9CB380", bg: "#1A2114", badge: "RECOVERY" },
  descanso: { accent: "#8A8178", bg: "#1C1815", badge: "DESCANSO" },
};

const slotColor = { "Desayuno": "#F2C14E", "Almuerzo": "#E0853C", "Cena": "#B58BC9" };

// ── MACRO BAR ────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════
// DETALLE DE EJECUCION POR EJERCICIO
// ═══════════════════════════════════════════════════════════════
const EXERCISE_DETAIL = {
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
const POST_WORKOUT = {
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

// ═══════════════════════════════════════════════════════════════
// SHARED UI
// ═══════════════════════════════════════════════════════════════
const MacroBar = ({ prot, carbs, fat, kcal }) => {
  const total = prot*4 + carbs*4 + fat*9;
  const pp = Math.round((prot*4/total)*100);
  const cp = Math.round((carbs*4/total)*100);
  const fp = 100-pp-cp;
  return (
    <div style={{ marginTop:10 }}>
      <div style={{ display:"flex", gap:3, marginBottom:4 }}>
        {[["P",pp,T.sage],["C",cp,T.gold],["G",fp,T.copper]].map(([l,p,col]) => (
          <div key={l} style={{ flex:p, background:col, height:3, borderRadius:2, opacity:0.85 }}/>
        ))}
      </div>
      <div style={{ display:"flex", gap:10, fontSize:9, fontFamily:"'JetBrains Mono',monospace" }}>
        <span style={{ color:T.sage }}>P{prot}</span>
        <span style={{ color:T.gold }}>C{carbs}</span>
        <span style={{ color:T.copper }}>G{fat}</span>
        <span style={{ color:T.ash, marginLeft:"auto" }}>{kcal} kcal</span>
      </div>
    </div>
  );
};

const DayTotal = ({ meals, isTraining }) => {
  const t = meals.reduce((a,m) => ({ prot:a.prot+m.macros.prot, carbs:a.carbs+m.macros.carbs, fat:a.fat+m.macros.fat, kcal:a.kcal+m.macros.kcal }), { prot:0, carbs:0, fat:0, kcal:0 });
  const whey = isTraining ? 27 : 0;
  return (
    <div style={{ background:T.surface, border:`1px solid ${T.line}`, borderRadius:12, padding:"12px 14px", marginTop:12 }}>
      <div style={{ fontSize:9, letterSpacing:2, color:T.faint, marginBottom:8, fontFamily:"'JetBrains Mono',monospace" }}>TOTAL DIA{isTraining?" +WHEY":""}</div>
      <div style={{ display:"flex", gap:6 }}>
        {[["PROT",(t.prot+whey)+"g",T.sage],["CARB",t.carbs+"g",T.gold],["GRASA",t.fat+"g",T.copper],["KCAL",t.kcal,T.bone]].map(([l,v,col]) => (
          <div key={l} style={{ flex:1, background:T.raised, borderRadius:8, padding:"6px 0", textAlign:"center" }}>
            <div style={{ fontSize:8, color:T.faint, letterSpacing:1, fontFamily:"'JetBrains Mono',monospace" }}>{l}</div>
            <div style={{ fontSize:13, fontWeight:700, color:col, fontFamily:"'Space Grotesk',sans-serif" }}>{v}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Sparkline telemetry strip
const WeightSpark = () => {
  const data = WEIGHT_SERIES;
  const min = 74, max = 88;
  const W = 320, H = 64, PAD = 6;
  const pts = data.map((d, i) => ({
    x: PAD + (i / (data.length - 1)) * (W - PAD*2),
    y: PAD + (1 - (d.w - min) / (max - min)) * (H - PAD*2),
  }));
  const path = pts.map((p,i) => `${i===0?"M":"L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const area = path + ` L${pts[pts.length-1].x},${H} L${pts[0].x},${H} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H+18}`} style={{ width:"100%", display:"block" }}>
      <defs>
        <linearGradient id="wfade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={T.copper} stopOpacity="0.25"/>
          <stop offset="100%" stopColor={T.copper} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <path d={area} fill="url(#wfade)"/>
      <path d={path} fill="none" stroke={T.copper} strokeWidth="2" strokeLinejoin="round"/>
      {pts.map((p,i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={i===pts.length-1?4:2.5} fill={i===pts.length-1?T.gold:T.bg} stroke={T.copper} strokeWidth="1.5"/>
          {(i===0||i===pts.length-1) && (
            <text x={p.x} y={p.y-8} textAnchor={i===0?"start":"end"} fontSize="9" fill={i===pts.length-1?T.gold:T.ash} fontFamily="'JetBrains Mono',monospace">{data[i].w}</text>
          )}
          <text x={p.x} y={H+13} textAnchor="middle" fontSize="7" fill={T.faint} fontFamily="'JetBrains Mono',monospace">{data[i].date}</text>
        </g>
      ))}
    </svg>
  );
};

// ═══════════════════════════════════════════════════════════════
// DASHBOARD TAB
// ═══════════════════════════════════════════════════════════════
const DashboardTab = () => (
  <div style={{ padding:"16px 14px 30px" }} className="fadein">

    {/* Telemetry: weight trend */}
    <div style={{ background:T.surface, border:`1px solid ${T.line}`, borderRadius:14, padding:"14px 14px 8px", marginBottom:14 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:6 }}>
        <div style={{ fontSize:9, letterSpacing:2, color:T.faint, fontFamily:"'JetBrains Mono',monospace" }}>// PESO_KG — ENE→JUN 2026</div>
        <div style={{ fontSize:11, color:T.gold, fontFamily:"'JetBrains Mono',monospace" }}>−9.5 kg</div>
      </div>
      <WeightSpark/>
    </div>

    {/* Metrics grid */}
    <div style={{ fontSize:9, letterSpacing:2, color:T.faint, marginBottom:8, fontFamily:"'JetBrains Mono',monospace" }}>// ULTIMA MEDICION — 27/08</div>
    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:16 }}>
      {METRICS_NOW.map((m,i) => (
        <div key={i} style={{ background:T.surface, border:`1px solid ${T.line}`, borderRadius:12, padding:"12px 13px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4 }}>
            <div style={{ fontSize:9, letterSpacing:1.5, color:T.faint, fontFamily:"'JetBrains Mono',monospace" }}>{m.label}</div>
            <div style={{ fontSize:9, fontFamily:"'JetBrains Mono',monospace",
              color: m.good===true?T.sage : m.good===false?T.copper : T.ash }}>{m.delta}</div>
          </div>
          <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:24, fontWeight:700, color:T.bone, lineHeight:1 }}>
            {m.value}<span style={{ fontSize:11, color:T.ash, marginLeft:3 }}>{m.unit}</span>
          </div>
          <div style={{ fontSize:8, color:T.faint, marginTop:4, fontFamily:"'JetBrains Mono',monospace" }}>{m.range}</div>
        </div>
      ))}
    </div>

    {/* Interpretation note */}
    <div style={{ background:"#241A10", border:`1px solid ${T.ember}44`, borderRadius:12, padding:"11px 14px", marginBottom:16, fontSize:11, color:"#E8C49A", lineHeight:1.7 }}>
      Recomposicion confirmada: +1.5 kg musculo y -0.7 kg grasa en el mismo periodo. El 94% del peso ganado fue masa magra. Mantener sueño y proteina. Proxima medicion: <span style={{ color:T.gold }}>3 semanas</span>.
    </div>

    {/* Goals */}
    <div style={{ fontSize:9, letterSpacing:2, color:T.faint, marginBottom:8, fontFamily:"'JetBrains Mono',monospace" }}>// OBJETIVOS — 12 SEMANAS</div>
    <div style={{ background:T.surface, border:`1px solid ${T.line}`, borderRadius:14, padding:"14px", marginBottom:16 }}>
      {GOALS.map((g,i) => {
        const pct = g.invert
          ? Math.min(100, Math.max(0, Math.round(((20.3 - g.now) / (20.3 - g.target)) * 100)))
          : Math.min(100, Math.round((g.now / g.target) * 100));
        return (
          <div key={i} style={{ marginBottom:i<GOALS.length-1?12:0 }}>
            <div style={{ display:"flex", justifyContent:"space-between", fontSize:10, marginBottom:4 }}>
              <span style={{ color:T.ash }}>{g.label}</span>
              <span style={{ color:T.bone, fontFamily:"'JetBrains Mono',monospace" }}>{g.now}{g.unit} <span style={{ color:T.faint }}>→ {g.target}{g.unit}</span></span>
            </div>
            <div style={{ background:T.raised, borderRadius:3, height:5, overflow:"hidden" }}>
              <div style={{ width:`${pct}%`, height:"100%", background:`linear-gradient(90deg, ${T.ember}, ${T.copper})`, borderRadius:3 }}/>
            </div>
          </div>
        );
      })}
    </div>

    {/* Week structure */}
    <div style={{ fontSize:9, letterSpacing:2, color:T.faint, marginBottom:8, fontFamily:"'JetBrains Mono',monospace" }}>// ESTRUCTURA SEMANAL</div>
    <div style={{ display:"flex", gap:5, marginBottom:14 }}>
      {[["L","E", T.copper],["M","H", T.copper],["X","P", T.copper],["J","C", T.steel],["V","R", T.copper],["S","B", T.sage],["D","—", T.faint],["+","C", T.gold]].map(([d,s,col],i) => (
        <div key={i} style={{ flex:1, background:T.surface, border:`1px solid ${T.line}`, borderTop:`2px solid ${col}`, borderRadius:9, padding:"8px 0", textAlign:"center" }}>
          <div style={{ fontSize:10, color:T.ash, fontFamily:"'JetBrains Mono',monospace" }}>{d}</div>
          <div style={{ fontSize:13, fontWeight:700, color:col, fontFamily:"'Space Grotesk',sans-serif", marginTop:2 }}>{s}</div>
        </div>
      ))}
    </div>
    <div style={{ fontSize:9, color:T.faint, fontFamily:"'JetBrains Mono',monospace", lineHeight:1.8 }}>
      E=Empuje · H=Halar · P=Pierna · C=Cardio · R=Rotacion E/H · B=Balance · <span style={{ color:T.gold }}>+C=Core opcional</span>
    </div>

    {/* Profile footer */}
    <div style={{ marginTop:16, padding:"11px 14px", background:T.surface, border:`1px solid ${T.line}`, borderRadius:12, display:"flex", justifyContent:"space-between", fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:T.ash }}>
      <span>36A</span><span>178 CM</span><span>H</span><span>146G PROT</span><span>~2,450 KCAL</span>
    </div>
  </div>
);

// ═══════════════════════════════════════════════════════════════
// TRAINING TAB
// ═══════════════════════════════════════════════════════════════
const TrainingTab = () => {
  const [activeDay, setActiveDay] = useState(0);
  const [expandedEx, setExpandedEx] = useState(null);
  const typeLabel = { strength:"FUERZA", lesmills:"CARDIO", recovery:"BALANCE", core:"CORE", rest:"OFF" };
  const sel = days[activeDay];
  const accent = sel.type==="strength"?T.copper:sel.type==="lesmills"?T.steel:sel.type==="recovery"?T.sage:sel.type==="core"?T.gold:T.faint;

  return (
    <div>
      {/* Joint legend */}
      <div style={{ display:"flex", gap:12, flexWrap:"wrap", padding:"9px 16px", background:T.surface, borderBottom:`1px solid ${T.line}` }}>
        {[["Hombro",J.shoulder],["Codo",J.elbow],["Rodilla",J.knee],["Cadera",J.hip]].map(([lbl,col]) => (
          <div key={lbl} style={{ display:"flex", alignItems:"center", gap:5 }}>
            <div style={{ width:7, height:7, borderRadius:"50%", background:col }}/>
            <span style={{ fontSize:8, color:T.ash, letterSpacing:1.5, fontFamily:"'JetBrains Mono',monospace" }}>{lbl.toUpperCase()}</span>
          </div>
        ))}
      </div>

      <div style={{ padding:"14px 14px 0" }}>
        <div style={{ display:"flex", gap:6, overflowX:"auto", paddingBottom:4, marginBottom:14 }}>
          {days.map((d,i) => {
            const ac = d.type==="strength"?T.copper:d.type==="lesmills"?T.steel:d.type==="recovery"?T.sage:d.type==="core"?T.gold:T.faint;
            const on = activeDay===i;
            return (
              <button key={i} onClick={() => { setActiveDay(i); setExpandedEx(null); }} style={{
                flexShrink:0, padding:"8px 11px", borderRadius:10, minWidth:56, textAlign:"center", cursor:"pointer",
                background:on?T.raised:T.surface, border:`1px solid ${on?ac:T.line}`, borderTop:`2px solid ${on?ac:T.line}`,
                color:on?T.bone:T.ash, transition:"all .2s",
              }}>
                <div style={{ fontSize:12, fontFamily:"'Space Grotesk',sans-serif", fontWeight:700 }}>{d.day.slice(0,3).toUpperCase()}</div>
                <div style={{ fontSize:7, marginTop:2, letterSpacing:1, color:on?ac:T.faint, fontFamily:"'JetBrains Mono',monospace" }}>{typeLabel[d.type]}</div>
              </button>
            );
          })}
        </div>
      </div>

      <div key={activeDay} style={{ padding:"0 14px 26px" }} className="fadein">
        {/* Session header — log line style */}
        <div style={{ background:T.surface, border:`1px solid ${T.line}`, borderLeft:`3px solid ${accent}`, borderRadius:13, padding:"13px 16px", marginBottom:10 }}>
          <div style={{ fontSize:8, letterSpacing:2, color:T.faint, marginBottom:4, fontFamily:"'JetBrains Mono',monospace" }}>// SESION_{String(activeDay+1).padStart(2,"0")} — {sel.day.toUpperCase()}</div>
          <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:16, fontWeight:700, color:T.bone, lineHeight:1.2 }}>{sel.label}</div>
          <div style={{ display:"flex", justifyContent:"space-between", marginTop:5, alignItems:"center" }}>
            <div style={{ fontSize:10, color:T.ash }}>{sel.focus}</div>
            {sel.optional
              ? <div style={{ fontSize:8, color:T.gold, border:`1px solid ${T.gold}55`, borderRadius:6, padding:"2px 7px", fontFamily:"'JetBrains Mono',monospace" }}>OPCIONAL</div>
              : sel.source && <div style={{ fontSize:8, color:T.faint, fontFamily:"'JetBrains Mono',monospace" }}>{sel.source}</div>}
          </div>
        </div>

        {sel.type==="rest" ? (
          <div style={{ background:T.surface, borderRadius:13, padding:26, textAlign:"center", border:`1px solid ${T.line}` }}>
            <div style={{ fontSize:34, marginBottom:8 }}>◼</div>
            <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:16, fontWeight:700, color:T.bone, marginBottom:6 }}>Descanso total</div>
            <div style={{ fontSize:11, color:T.ash, lineHeight:1.8 }}>El musculo crece descansando.<br/>Come bien · 7–8 h sueno · Hidratacion.</div>
          </div>
        ) : (
          <>
            {sel.tip && <div style={{ background:"#241A10", border:`1px solid ${T.ember}44`, borderRadius:11, padding:"10px 14px", marginBottom:10, fontSize:11, color:"#E8C49A", lineHeight:1.7 }}>{sel.tip}</div>}
            {sel.type==="strength" && <div style={{ fontSize:9, color:T.faint, marginBottom:8, fontFamily:"'JetBrains Mono',monospace" }}>tap ejercicio → pesos sugeridos</div>}

            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {sel.exercises.map((ex,i) => {
                const isExp = expandedEx===i;
                const w = weightSuggestions[ex.name];
                return (
                  <div key={i} onClick={() => setExpandedEx(isExp?null:i)}
                    style={{ background:isExp?T.raised:T.surface, border:`1px solid ${isExp?accent+"66":T.line}`, borderRadius:12, padding:"11px 12px", cursor:"pointer", transition:"all .2s" }}>
                    <div style={{ display:"flex", alignItems:"flex-start", gap:10 }}>
                      <div style={{ flexShrink:0, width:86, height:68, background:T.bg, borderRadius:9, border:`1px solid ${accent}26`, padding:3, overflow:"hidden" }}>
                        <ExerciseSVG id={ex.name} accent={accent}/>
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:12, fontWeight:600, lineHeight:1.35, color:T.bone, marginBottom:ex.note?3:0, fontFamily:"'Space Grotesk',sans-serif" }}>{ex.name}</div>
                        {ex.note && <div style={{ fontSize:10, color:T.ash, lineHeight:1.5 }}>{ex.note}</div>}
                      </div>
                      {ex.sets!=="—" && <div style={{ fontSize:12, color:isExp?accent:T.faint, flexShrink:0, alignSelf:"center" }}>{isExp?"▲":"▼"}</div>}
                    </div>
                    {ex.sets!=="—" && (
                      <div style={{ display:"flex", gap:5, marginTop:9 }}>
                        {[["SER",ex.sets,accent],["REPS",ex.reps,T.bone],["PAUSA",ex.rest,T.ash]].map(([lbl,val,col],j) => (
                          <div key={j} style={{ background:T.bg, borderRadius:7, padding:"5px 8px", flex:1, textAlign:"center", border:`1px solid ${T.line}` }}>
                            <div style={{ fontSize:7, color:T.faint, letterSpacing:1.5, fontFamily:"'JetBrains Mono',monospace" }}>{lbl}</div>
                            <div style={{ fontSize:12, fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, color:col }}>{val}</div>
                          </div>
                        ))}
                      </div>
                    )}
                    {isExp && (
                      <div style={{ marginTop:9 }}>
                        {/* CARGA */}
                        {w && (
                          <div style={{ background:T.bg, border:`1px solid ${accent}33`, borderRadius:9, padding:"10px 12px", marginBottom:8 }}>
                            <div style={{ fontSize:8, letterSpacing:2, color:T.faint, marginBottom:7, fontFamily:"'JetBrains Mono',monospace" }}>// CARGA</div>
                            <div style={{ display:"flex", gap:7, marginBottom:7 }}>
                              <div style={{ flex:1, background:T.surface, borderRadius:7, padding:"6px 9px" }}>
                                <div style={{ fontSize:8, color:T.faint, marginBottom:2, fontFamily:"'JetBrains Mono',monospace" }}>INICIO</div>
                                <div style={{ fontSize:12, fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, color:accent }}>{w.start}</div>
                              </div>
                              <div style={{ flex:1, background:T.surface, borderRadius:7, padding:"6px 9px" }}>
                                <div style={{ fontSize:8, color:T.faint, marginBottom:2, fontFamily:"'JetBrains Mono',monospace" }}>SEM_06</div>
                                <div style={{ fontSize:12, fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, color:T.bone }}>{w.target}</div>
                              </div>
                            </div>
                            <div style={{ fontSize:10, color:T.sage, lineHeight:1.5 }}>{w.note}</div>
                          </div>
                        )}
                        {/* EJECUCION paso a paso */}
                        {EXERCISE_DETAIL[ex.name] && (
                          <div style={{ background:T.bg, border:`1px solid ${T.line}`, borderRadius:9, padding:"10px 12px" }}>
                            <div style={{ fontSize:8, letterSpacing:2, color:T.faint, marginBottom:4, fontFamily:"'JetBrains Mono',monospace" }}>// MUSCULOS</div>
                            <div style={{ fontSize:10, color:T.gold, marginBottom:9 }}>{EXERCISE_DETAIL[ex.name].musculos}</div>
                            <div style={{ fontSize:8, letterSpacing:2, color:T.faint, marginBottom:5, fontFamily:"'JetBrains Mono',monospace" }}>// EJECUCION</div>
                            {EXERCISE_DETAIL[ex.name].pasos.map((p,pi) => (
                              <div key={pi} style={{ display:"flex", gap:8, marginBottom:5 }}>
                                <div style={{ flexShrink:0, width:16, height:16, borderRadius:4, background:accent+"22", border:`1px solid ${accent}44`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:8, color:accent, fontFamily:"'JetBrains Mono',monospace" }}>{pi+1}</div>
                                <div style={{ fontSize:10, color:T.bone, lineHeight:1.5, paddingTop:1 }}>{p}</div>
                              </div>
                            ))}
                            <div style={{ marginTop:8, fontSize:10, color:"#D98A8A", background:"#241414", border:"1px solid #4A2828", borderRadius:7, padding:"6px 9px", lineHeight:1.5 }}>
                              ✕ {EXERCISE_DETAIL[ex.name].error}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {sel.core && (
              <div style={{ marginTop:12 }}>
                <div style={{ fontSize:9, letterSpacing:2, color:T.gold, marginBottom:8, fontFamily:"'JetBrains Mono',monospace" }}>// CORE_FINISHER — 5-8 MIN</div>
                <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
                  {sel.core.map((ex,ci) => (
                    <div key={ci} style={{ background:T.surface, border:`1px solid ${T.gold}22`, borderRadius:11, padding:"10px 13px" }}>
                      <div style={{ fontSize:12, fontWeight:600, color:T.gold, marginBottom:3, fontFamily:"'Space Grotesk',sans-serif" }}>{ex.name}</div>
                      <div style={{ fontSize:10, color:T.ash, lineHeight:1.5, marginBottom:8 }}>{ex.note}</div>
                      <div style={{ display:"flex", gap:5 }}>
                        {[["SER",ex.sets,T.gold],["REPS",ex.reps,T.bone],["PAUSA",ex.rest,T.ash]].map(([lbl,val,col],j) => (
                          <div key={j} style={{ background:T.bg, borderRadius:7, padding:"5px 8px", flex:1, textAlign:"center", border:`1px solid ${T.line}` }}>
                            <div style={{ fontSize:7, color:T.faint, letterSpacing:1.5, fontFamily:"'JetBrains Mono',monospace" }}>{lbl}</div>
                            <div style={{ fontSize:11, fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, color:col }}>{val}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {sel.postKey && POST_WORKOUT[sel.postKey] && (
              <div style={{ marginTop:12, background:"#16201A", border:`1px solid ${T.sage}33`, borderRadius:12, padding:"13px 15px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:8 }}>
                  <div style={{ fontSize:9, letterSpacing:2, color:T.sage, fontFamily:"'JetBrains Mono',monospace" }}>// {POST_WORKOUT[sel.postKey].titulo.toUpperCase()}</div>
                  <div style={{ fontSize:8, color:T.gold, fontFamily:"'JetBrains Mono',monospace" }}>{POST_WORKOUT[sel.postKey].ventana}</div>
                </div>
                {POST_WORKOUT[sel.postKey].comida.map((c,ci) => (
                  <div key={ci} style={{ fontSize:11, color:T.bone, lineHeight:1.9, paddingLeft:9, borderLeft:`1px solid ${T.sage}55` }}>· {c}</div>
                ))}
                <div style={{ marginTop:8, fontSize:9, color:T.sage, fontFamily:"'JetBrains Mono',monospace" }}>{POST_WORKOUT[sel.postKey].macros}</div>
                <div style={{ marginTop:6, fontSize:10, color:T.ash, lineHeight:1.6 }}>{POST_WORKOUT[sel.postKey].razon}</div>
              </div>
            )}
            {sel.type==="strength" && (
              <div style={{ marginTop:10, background:T.surface, border:`1px solid ${T.line}`, borderRadius:11, padding:"11px 13px", fontSize:10, color:T.ash, lineHeight:1.8 }}>
                <span style={{ color:T.copper, fontWeight:600 }}>Overload:</span> sube peso al lograr el max de reps con buena forma 2 sesiones seguidas.<br/>
                <span style={{ color:T.copper, fontWeight:600 }}>Intensidad (RPE):</span> termina cada serie con 2 reps en reserva. La ultima serie de cada compuesto puede llegar a 1 en reserva.<br/>
                <span style={{ color:T.copper, fontWeight:600 }}>Calentamiento:</span> 5 min movilidad + 1 serie ligera por compuesto.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// NUTRITION TAB
// ═══════════════════════════════════════════════════════════════
const NutritionTab = () => {
  const [activeDay, setActiveDay] = useState(0);
  const [showSups, setShowSups] = useState(false);
  const [expandedMeal, setExpandedMeal] = useState(null);
  const day = WEEK[activeDay];
  const ts = typeStyle[day.tipo];
  const isTraining = day.tipo==="fuerza" || day.tipo==="lesmills";

  return (
    <div>
      <div style={{ padding:"12px 14px 0", borderBottom:`1px solid ${T.line}`, background:T.surface }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
          <div style={{ fontSize:9, color:T.faint, letterSpacing:2, fontFamily:"'JetBrains Mono',monospace" }}>// 2,450 KCAL · 146G PROT</div>
          <button onClick={() => setShowSups(!showSups)} style={{
            background:showSups?"#241A10":T.raised, border:`1px solid ${showSups?T.copper:T.line}`,
            borderRadius:8, padding:"5px 10px", cursor:"pointer", fontSize:9,
            color:showSups?T.copper:T.ash, letterSpacing:1, fontFamily:"'JetBrains Mono',monospace",
          }}>{showSups?"− SUPLEMENTOS":"+ SUPLEMENTOS"}</button>
        </div>

        {showSups && (
          <div style={{ background:"#241A10", border:`1px solid ${T.ember}55`, borderRadius:12, padding:"12px 14px", marginBottom:10 }}>
            <div style={{ fontSize:9, letterSpacing:2, color:T.copper, marginBottom:8, fontFamily:"'JetBrains Mono',monospace" }}>// STACK_DIARIO</div>
            {SUPS.map((s,i) => (
              <div key={i} style={{ marginBottom:i<SUPS.length-1?9:0 }}>
                <div style={{ fontSize:10, color:T.gold, marginBottom:3, fontWeight:600 }}>{s.time}</div>
                {s.items.map((item,j) => <div key={j} style={{ fontSize:11, color:"#E8C49A", paddingLeft:10, lineHeight:1.8 }}>· {item}</div>)}
                <div style={{ fontSize:9, color:T.ash, paddingLeft:10, marginTop:2 }}>↳ {s.note}</div>
              </div>
            ))}
            {!isTraining && <div style={{ marginTop:9, fontSize:10, color:T.gold, background:T.bg, border:`1px solid ${T.gold}33`, borderRadius:8, padding:"6px 10px" }}>Dia sin entreno — omitir L-Arginina y whey. Creatina opcional.</div>}
          </div>
        )}

        <div style={{ display:"flex", gap:5, overflowX:"auto", paddingBottom:8 }}>
          {WEEK.map((d,i) => {
            const ts2 = typeStyle[d.tipo];
            const on = activeDay===i;
            return (
              <button key={i} onClick={() => { setActiveDay(i); setExpandedMeal(null); }} style={{
                flexShrink:0, padding:"7px 10px", borderRadius:9, minWidth:48, textAlign:"center", cursor:"pointer",
                background:on?ts2.bg:T.bg, border:`1px solid ${on?ts2.accent:T.line}`, borderTop:`2px solid ${on?ts2.accent:T.line}`,
                color:on?T.bone:T.ash, transition:"all .2s",
              }}>
                <div style={{ fontSize:11, fontFamily:"'Space Grotesk',sans-serif", fontWeight:700 }}>{d.day}</div>
                <div style={{ fontSize:7, marginTop:2, color:on?ts2.accent:T.faint, fontFamily:"'JetBrains Mono',monospace" }}>{ts2.badge.slice(0,5)}</div>
              </button>
            );
          })}
        </div>
      </div>

      <div key={activeDay} style={{ padding:"14px 14px 30px" }} className="fadein">
        <div style={{ display:"flex", alignItems:"center", gap:9, marginBottom:12 }}>
          <div style={{ width:3, height:26, background:ts.accent, borderRadius:2 }}/>
          <div>
            <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:15, fontWeight:700, color:T.bone }}>
              {["Lunes","Martes","Miercoles","Jueves","Viernes","Sabado","Domingo"][activeDay]}
            </div>
            <div style={{ fontSize:8, color:ts.accent, letterSpacing:2, fontFamily:"'JetBrains Mono',monospace" }}>{ts.badge}{isTraining?" · ENTRENO AM":""}</div>
          </div>
          {isTraining && <div style={{ marginLeft:"auto", background:ts.bg, border:`1px solid ${ts.accent}44`, borderRadius:7, padding:"3px 8px", fontSize:8, color:ts.accent, fontFamily:"'JetBrains Mono',monospace" }}>SUPLE ON</div>}
        </div>

        {day.meals.map((meal,i) => {
          const isExp = expandedMeal===i;
          const sc = slotColor[meal.slot];
          return (
            <div key={i} onClick={() => setExpandedMeal(isExp?null:i)}
              style={{ background:isExp?T.raised:T.surface, border:`1px solid ${isExp?sc+"66":T.line}`, borderRadius:12, padding:"12px 13px", marginBottom:8, borderLeft:`3px solid ${sc}`, cursor:"pointer", transition:"all .2s" }}>
              <div style={{ display:"flex", alignItems:"flex-start", gap:9 }}>
                <div style={{ flexShrink:0, width:32, height:32, background:T.bg, borderRadius:7, display:"flex", alignItems:"center", justifyContent:"center", fontSize:15, border:`1px solid ${T.line}` }}>{meal.icon}</div>
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:2 }}>
                    <span style={{ fontSize:8, color:sc, letterSpacing:1.5, fontWeight:600, fontFamily:"'JetBrains Mono',monospace" }}>{meal.slot.toUpperCase()}</span>
                    <span style={{ fontSize:8, color:T.faint, fontFamily:"'JetBrains Mono',monospace" }}>{meal.time}</span>
                  </div>
                  <div style={{ fontSize:12, fontWeight:600, lineHeight:1.3, color:T.bone, fontFamily:"'Space Grotesk',sans-serif" }}>{meal.name}</div>
                </div>
                <div style={{ fontSize:11, color:isExp?sc:T.faint, flexShrink:0, alignSelf:"center" }}>{isExp?"▲":"▼"}</div>
              </div>
              <MacroBar {...meal.macros}/>
              {isExp && (
                <div style={{ marginTop:10, paddingTop:10, borderTop:`1px solid ${T.line}` }}>
                  <div style={{ marginBottom:7 }}>
                    {meal.items.map((item,j) => <div key={j} style={{ fontSize:11, color:T.bone, lineHeight:2, paddingLeft:8, borderLeft:`1px solid ${sc}55` }}>· {item}</div>)}
                  </div>
                  <div style={{ fontSize:10, color:T.sage, background:T.bg, borderRadius:8, padding:"6px 10px", lineHeight:1.5, border:`1px solid ${T.line}` }}>{meal.note}</div>
                  {meal.slot==="Desayuno" && isTraining && (
                    <div style={{ marginTop:7, fontSize:10, color:T.gold, background:"#241A10", border:`1px solid ${T.gold}33`, borderRadius:8, padding:"6px 10px", lineHeight:1.6 }}>
                      L-Arginina + Creatina 30 min pre-entreno · Whey en este desayuno
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        <DayTotal meals={day.meals} isTraining={isTraining}/>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// ROOT — PLAN RECOMP v2
// ═══════════════════════════════════════════════════════════════
export default function PlanRecomp() {
  const [tab, setTab] = useState("dash");
  return (
    <div style={{ fontFamily:"'JetBrains Mono','Courier New',monospace", background:T.bg, minHeight:"100vh", color:T.bone }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=JetBrains+Mono:wght@400;600&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:4px;height:4px}::-webkit-scrollbar-track{background:#14110F}::-webkit-scrollbar-thumb{background:#3A332B;border-radius:2px}
        button{font-family:inherit}
        .fadein{animation:fi .3s ease}
        @keyframes fi{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        @media (prefers-reduced-motion: reduce){ *{animation:none!important;transition:none!important} }
      `}</style>

      {/* STICKY HEADER */}
      <div style={{ padding:"18px 16px 0", borderBottom:`1px solid ${T.line}`, background:T.bg, position:"sticky", top:0, zIndex:10 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:12 }}>
          <div>
            <div style={{ fontSize:8, letterSpacing:3, color:T.faint, marginBottom:3 }}>// BODY_RECOMP — JF</div>
            <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:24, fontWeight:700, lineHeight:0.95, letterSpacing:"-0.5px", color:T.bone }}>
              RECOMP<span style={{ color:T.copper }}>_</span>v2
            </div>
          </div>
          <div style={{ textAlign:"right", fontSize:9, color:T.ash, lineHeight:1.6 }}>
            <div><span style={{ color:T.gold }}>77.8</span> kg · <span style={{ color:T.copper }}>21.6</span>%</div>
            <div style={{ color:T.faint }}>obj: 15% en 12 sem</div>
          </div>
        </div>
        <div style={{ display:"flex" }}>
          {[["dash","TELEMETRIA"],["entreno","ENTRENO"],["nutricion","NUTRICION"]].map(([t,lbl]) => (
            <button key={t} onClick={() => setTab(t)} style={{
              flex:1, background:"none", border:"none", cursor:"pointer", padding:"9px 4px",
              fontSize:10, letterSpacing:2, transition:"all .2s",
              color:tab===t?T.copper:T.faint,
              borderBottom:tab===t?`2px solid ${T.copper}`:`2px solid transparent`,
            }}>{lbl}</button>
          ))}
        </div>
      </div>

      <div key={tab}>
        {tab==="dash" ? <DashboardTab/> : tab==="entreno" ? <TrainingTab/> : <NutritionTab/>}
      </div>

      <div style={{ padding:"10px 18px 26px", textAlign:"center", fontSize:8, color:T.faint, letterSpacing:2 }}>
        DATA 27/08 · RECOMPOSICION CONFIRMADA · REV EN 3 SEMANAS
      </div>
    </div>
  );
}
