import type { Locale } from "../i18n";

type Props = { slug: string; locale: Locale };

export function TrailIntroSignal({ slug, locale }: Props) {
  const es = locale === "es";

  if (slug === "reading-a-nebula") {
    return (
      <div className="trail-intro-signal trail-intro-signal--nebula" aria-hidden="true">
        <svg viewBox="0 0 520 520" role="presentation">
          <g className="signal-grid"><path d="M40 104h440M40 208h440M40 312h440M40 416h440" /><path d="M104 40v440M208 40v440M312 40v440M416 40v440" /></g>
          <g className="signal-nebula__contours"><path d="M112 294c-31-69 17-158 95-170 46-8 67 18 104 5 55-19 116 23 112 86-3 50-45 65-52 107-9 52-60 91-112 71-38-15-62 11-101-12-31-19-32-55-46-87Z" /><path d="M163 284c-19-43 10-99 58-106 29-5 42 11 65 3 34-12 72 14 69 53-2 31-28 41-32 67-6 32-37 56-70 44-23-10-38 6-62-8-20-12-20-35-28-53Z" /><path d="M220 275c-8-18 4-41 24-44 12-2 17 5 27 1 14-5 30 6 29 22-1 13-12 17-14 28-2 13-15 23-29 18-10-4-16 3-26-3-8-5-8-15-11-22Z" /></g>
          <g className="signal-leaders"><path d="M74 126h76l46 48" /><path d="M446 230h-72l-43 32" /><path d="M78 430h110l48-76" /></g>
          <g className="signal-points"><circle cx="196" cy="174" r="3" /><circle cx="331" cy="262" r="3" /><circle cx="236" cy="354" r="3" /></g>
        </svg>
        <span className="signal-label signal-label--a">GAS</span>
        <span className="signal-label signal-label--b">{es ? "POLVO" : "DUST"}</span>
        <span className="signal-label signal-label--c">{es ? "CAVIDAD" : "CAVITY"}</span>
        <strong>{es ? "ESTRUCTURA / CAPAS" : "STRUCTURE / LAYERS"}</strong>
      </div>
    );
  }

  if (slug === "earth-or-another-world") {
    return (
      <div className="trail-intro-signal trail-intro-signal--world" aria-hidden="true">
        <svg viewBox="0 0 520 520" role="presentation">
          <g className="signal-grid"><path d="M40 104h440M40 208h440M40 312h440M40 416h440" /><path d="M104 40v440M208 40v440M312 40v440M416 40v440" /></g>
          <g className="signal-world__arcs"><path d="M-20 436C94 248 426 248 540 436" /><path d="M-14 416C105 232 415 232 534 416" /><path d="M-8 393C118 216 402 216 528 393" /></g>
          <g className="signal-world__terrain"><path d="m48 420 82-48 56 20 67-72 66 49 57-28 96 79" /></g>
          <g className="signal-world__measure"><path d="M72 92h376M72 82v20M166 86v12M260 82v20M354 86v12M448 82v20" /><path d="M260 118v170M248 130h24M252 208h16M248 280h24" /></g>
        </svg>
        <span className="signal-label signal-label--a">{es ? "ESCALA" : "SCALE"}</span>
        <span className="signal-label signal-label--b">{es ? "ATMÓSFERA" : "ATMOSPHERE"}</span>
        <span className="signal-label signal-label--c">{es ? "TERRENO" : "TERRAIN"}</span>
        <strong>{es ? "EVIDENCIA / CONTEXTO" : "EVIDENCE / CONTEXT"}</strong>
      </div>
    );
  }

  if (slug === "galaxies-shape-is-not-age") {
    return (
      <div className="trail-intro-signal trail-intro-signal--galaxy" aria-hidden="true">
        <svg viewBox="0 0 520 520" role="presentation">
          <g className="signal-grid"><path d="M40 104h440M40 208h440M40 312h440M40 416h440" /><path d="M104 40v440M208 40v440M312 40v440M416 40v440" /></g>
          <g className="signal-galaxy__forms">
            <path d="M96 160c48-55 142-55 190 0-48 55-142 55-190 0Z" />
            <path d="M191 160c-8-29 25-52 52-35 25 16 15 56-14 60-45 6-79-35-59-76 25-50 105-49 134 0" />
            <path d="M96 350c54-20 137-20 190 0-53 20-136 20-190 0Z" />
            <path d="M322 260c0-50 40-90 90-90s90 40 90 90-40 90-90 90-90-40-90-90Z" />
            <path d="M412 190c-48 0-77 50-48 85 27 32 86 8 77-34-10-47-81-58-111-15-37 53 9 126 72 131" />
          </g>
          <g className="signal-galaxy__axis"><path d="M72 92h226M72 420h226" /><path d="M320 382h184M412 374v16" /></g>
          <g className="signal-points"><circle cx="191" cy="160" r="3" /><circle cx="191" cy="350" r="3" /><circle cx="412" cy="260" r="3" /></g>
        </svg>
        <span className="signal-label signal-label--a">{es ? "FORMA" : "SHAPE"}</span>
        <span className="signal-label signal-label--b">{es ? "ORIENTACIÓN" : "ORIENTATION"}</span>
        <span className="signal-label signal-label--c">{es ? "ESTRUCTURA" : "STRUCTURE"}</span>
        <strong>{es ? "MORFOLOGÍA ≠ EDAD" : "MORPHOLOGY ≠ AGE"}</strong>
      </div>
    );
  }

  if (slug === "looking-back-in-time") {
    return (
      <div className="trail-intro-signal trail-intro-signal--time" aria-hidden="true">
        <svg viewBox="0 0 520 520" role="presentation">
          <g className="signal-grid"><path d="M40 104h440M40 208h440M40 312h440M40 416h440" /><path d="M104 40v440M208 40v440M312 40v440M416 40v440" /></g>
          <g className="signal-time__cone"><path d="M74 102 430 260 74 418" /><path d="M112 120 430 260 112 400" /><path d="M164 144 430 260 164 376" /></g>
          <g className="signal-time__fronts"><path d="M124 137q-48 123 0 246" /><path d="M196 166q-37 94 0 188" /><path d="M270 199q-24 61 0 122" /><path d="M342 231q-12 29 0 58" /></g>
          <g className="signal-time__axis"><path d="M70 458h360l-14-8m14 8-14 8" /><path d="M430 92v336" /></g>
          <g className="signal-points"><circle cx="430" cy="260" r="4" /><circle cx="124" cy="137" r="3" /><circle cx="124" cy="383" r="3" /></g>
        </svg>
        <span className="signal-label signal-label--a">{es ? "LUZ ANTIGUA" : "EARLY LIGHT"}</span>
        <span className="signal-label signal-label--b">{es ? "LENTE" : "LENS"}</span>
        <span className="signal-label signal-label--c">{es ? "CORRIMIENTO AL ROJO" : "REDSHIFT"}</span>
        <strong>{es ? "DISTANCIA → TIEMPO" : "DISTANCE → TIME"}</strong>
      </div>
    );
  }

  if (slug === "one-sky-different-instruments") {
    return (
      <div className="trail-intro-signal trail-intro-signal--instruments" aria-hidden="true">
        <svg viewBox="0 0 520 520" role="presentation">
          <g className="signal-grid"><path d="M40 104h440M40 208h440M40 312h440M40 416h440" /><path d="M104 40v440M208 40v440M312 40v440M416 40v440" /></g>
          <g className="signal-instruments__apertures"><circle cx="104" cy="120" r="38" /><circle cx="416" cy="120" r="38" /><circle cx="104" cy="400" r="38" /><circle cx="416" cy="400" r="38" /></g>
          <g className="signal-instruments__beams"><path d="M135 142 231 232M385 142l-96 90M135 378l96-90M385 378l-96-90" /></g>
          <g className="signal-instruments__target"><circle cx="260" cy="260" r="72" /><circle cx="260" cy="260" r="34" /><path d="M260 170v180M170 260h180" /></g>
          <g className="signal-instruments__bands"><path d="M72 474h82M170 474h82M268 474h82M366 474h82" /></g>
          <g className="signal-points"><circle cx="260" cy="260" r="4" /><circle cx="104" cy="120" r="3" /><circle cx="416" cy="120" r="3" /><circle cx="104" cy="400" r="3" /><circle cx="416" cy="400" r="3" /></g>
        </svg>
        <span className="signal-label signal-label--a">{es ? "BANDAS" : "BANDS"}</span>
        <span className="signal-label signal-label--b">{es ? "OBJETIVO COMÚN" : "SHARED TARGET"}</span>
        <span className="signal-label signal-label--c">{es ? "CAPAS" : "LAYERS"}</span>
        <strong>{es ? "INSTRUMENTOS → COMPOSICIÓN" : "INSTRUMENTS → COMPOSITE"}</strong>
      </div>
    );
  }

  if (slug === "worlds-marked-by-impact") {
    return (
      <div className="trail-intro-signal trail-intro-signal--impact" aria-hidden="true">
        <svg viewBox="0 0 520 520" role="presentation">
          <g className="signal-grid"><path d="M40 104h440M40 208h440M40 312h440M40 416h440" /><path d="M104 40v440M208 40v440M312 40v440M416 40v440" /></g>
          <g className="signal-impact__rings"><ellipse cx="270" cy="248" rx="172" ry="118" /><ellipse cx="270" cy="248" rx="116" ry="76" /><ellipse cx="270" cy="248" rx="58" ry="34" /></g>
          <g className="signal-impact__rays"><path d="M270 113V58M270 438v-77M98 248H43M497 248h-55M148 164l-48-34M393 334l52 37M150 332l-48 38M392 162l50-35" /></g>
          <g className="signal-impact__profile"><path d="M66 454h78l31-25 34 9 30-67 31-24 31 24 30 67 34-9 31 25h58" /></g>
          <g className="signal-points"><circle cx="270" cy="248" r="4" /><circle cx="239" cy="371" r="3" /><circle cx="301" cy="371" r="3" /></g>
        </svg>
        <span className="signal-label signal-label--a">{es ? "BORDE" : "RIM"}</span>
        <span className="signal-label signal-label--b">{es ? "EYECCIÓN" : "EJECTA"}</span>
        <span className="signal-label signal-label--c">{es ? "EROSIÓN" : "EROSION"}</span>
        <strong>{es ? "IMPACTO / SUPERFICIE" : "IMPACT / SURFACE"}</strong>
      </div>
    );
  }

  return (
    <div className="trail-intro-signal trail-intro-signal--spectrum" aria-hidden="true">
      <svg viewBox="0 0 520 520" role="presentation">
        <g className="signal-grid"><path d="M40 104h440M40 208h440M40 312h440M40 416h440" /><path d="M104 40v440M208 40v440M312 40v440M416 40v440" /></g>
        <g className="signal-spectrum__waves"><path d="M70 130c18-40 36 40 54 0s36 40 54 0 36 40 54 0 36 40 54 0 36 40 54 0 36 40 54 0 36 40 54 0" /><path d="M70 218c30-32 60 32 90 0s60 32 90 0 60 32 90 0 60 32 90 0" /><path d="M70 306c52-24 104 24 156 0s104 24 156 0" /><path d="M70 394c90-18 180 18 270 0" /></g>
        <g className="signal-spectrum__axis"><path d="M70 458h360l-14-8m14 8-14 8" /><path d="M70 112v300" /></g>
      </svg>
      <span className="signal-label signal-label--a">VISIBLE</span>
      <span className="signal-label signal-label--b">{es ? "INFRARROJO" : "INFRARED"}</span>
      <span className="signal-label signal-label--c">{es ? "RAYOS X / RADIO" : "X-RAY / RADIO"}</span>
      <strong>{es ? "LONGITUD DE ONDA → COLOR" : "WAVELENGTH → COLOR"}</strong>
    </div>
  );
}
