// Brand artwork as SVG strings. Rendered to PNG by render.js (headless Chrome, so the Devanagari
// "रो" is shaped correctly by the bundled Mukta font). No government emblem, flag or map.
//
// Concept: a surveyed land plot (irregular four-sided outline), a measuring tape dimension line
// along its base, and "रो" (ropani) in the middle.

const GREEN = '#1B6B4A';
const GREEN_DARK = '#124D35';
const SAFFRON = '#F0B45A';
const WHITE = '#FFFFFF';

/** The mark on a 1024 canvas. `ink` colours the plot and letters; `tape` the measuring line. */
function mark({ ink = WHITE, tape = SAFFRON, fill = 'rgba(255,255,255,0.14)', withTape = true } = {}) {
  return `
  <polygon points="262,268 742,224 800,700 226,736" fill="${fill}" stroke="${ink}" stroke-width="44"
           stroke-linejoin="round"/>
  <text x="512" y="560" text-anchor="middle" font-family="Mukta" font-weight="700" font-size="300"
        fill="${ink}">रो</text>
  ${
    withTape
      ? `<g stroke="${tape}" stroke-width="30" stroke-linecap="round">
           <line x1="226" y1="842" x2="800" y2="842"/>
           <line x1="226" y1="806" x2="226" y2="878"/>
           <line x1="800" y1="806" x2="800" y2="878"/>
           <line x1="370" y1="826" x2="370" y2="858"/>
           <line x1="513" y1="826" x2="513" y2="858"/>
           <line x1="656" y1="826" x2="656" y2="858"/>
         </g>`
      : ''
  }`;
}

const svg = (w, h, body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${body}</svg>`;

const background = `
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${GREEN}"/>
      <stop offset="1" stop-color="${GREEN_DARK}"/>
    </linearGradient>
  </defs>
  <rect width="1024" height="1024" fill="url(#g)"/>`;

/** Scale the mark about the centre (adaptive icons keep art inside the central 66%). */
const scaled = (s, body) => `<g transform="translate(512 512) scale(${s}) translate(-512 -540)">${body}</g>`;

module.exports = {
  /** Full-bleed square: legacy icon and the 512 × 512 Play icon (Play applies its own mask). */
  icon: svg(1024, 1024, background + scaled(0.86, mark())),
  /** Adaptive icon foreground, transparent, art within the safe zone. */
  foreground: svg(1024, 1024, scaled(0.6, mark())),
  /** Adaptive icon background layer. */
  backgroundLayer: svg(1024, 1024, background),
  /** Android 13+ themed (monochrome) icon: single colour on transparent. */
  monochrome: svg(1024, 1024, scaled(0.6, mark({ ink: WHITE, tape: WHITE, fill: 'none' }))),
  /** Splash: rounded tile on transparent, works on light and dark splash backgrounds. */
  splash: svg(
    1024,
    1024,
    `<defs><clipPath id="r"><rect x="112" y="112" width="800" height="800" rx="180"/></clipPath></defs>
     <g clip-path="url(#r)">${background}${scaled(0.66, mark())}</g>`,
  ),
  /** 1024 × 500 Play feature graphic. */
  feature: svg(
    1024,
    500,
    `<defs>
       <linearGradient id="fg" x1="0" y1="0" x2="1" y2="1">
         <stop offset="0" stop-color="${GREEN}"/><stop offset="1" stop-color="${GREEN_DARK}"/>
       </linearGradient>
       <clipPath id="tile"><rect x="64" y="90" width="320" height="320" rx="72"/></clipPath>
     </defs>
     <rect width="1024" height="500" fill="url(#fg)"/>
     <g opacity="0.10" stroke="${WHITE}" stroke-width="6" fill="none">
       <polygon points="640,-40 1080,10 1060,330 700,300"/>
       <polygon points="700,300 1060,330 1040,560 680,540"/>
     </g>
     <g clip-path="url(#tile)">
       <rect x="64" y="90" width="320" height="320" fill="${GREEN_DARK}"/>
       <g transform="translate(64 90) scale(0.3125)">${scaled(0.86, mark())}</g>
     </g>
     <text x="440" y="210" font-family="Mukta" font-weight="700" font-size="92" fill="${WHITE}">जग्गा नापी</text>
     <text x="444" y="268" font-family="Mukta" font-weight="600" font-size="40" fill="${SAFFRON}">Ropani Calculator</text>
     <text x="444" y="334" font-family="Mukta" font-weight="500" font-size="30" fill="${WHITE}">रोपनी · आना · बिघा · कट्ठा · धुर</text>
     <text x="444" y="378" font-family="Mukta" font-weight="400" font-size="26" fill="${WHITE}" opacity="0.9">Plot area · Land price · Divide land · Offline</text>`,
  ),
};
