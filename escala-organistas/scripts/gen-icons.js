// Generates all Android launcher icon PNGs from inline SVG sources.
// Run: node scripts/gen-icons.js
const sharp = require('sharp');
const path = require('path');

const RES = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'res');

const densities = [
  { name: 'mdpi',    launcher: 48,  fg: 108 },
  { name: 'hdpi',    launcher: 72,  fg: 162 },
  { name: 'xhdpi',   launcher: 96,  fg: 216 },
  { name: 'xxhdpi',  launcher: 144, fg: 324 },
  { name: 'xxxhdpi', launcher: 192, fg: 432 },
];

// Full icon SVG (192×192) — gradient bg + treble clef + piano strip
const fullIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192" width="192" height="192">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#1A3A6B"/>
      <stop offset="100%" stop-color="#2968C8"/>
    </linearGradient>
    <clipPath id="round">
      <rect width="192" height="192" rx="40" ry="40"/>
    </clipPath>
  </defs>

  <!-- Background -->
  <rect width="192" height="192" fill="url(#bg)"/>

  <!-- Piano strip at bottom -->
  <rect x="0" y="148" width="192" height="44" fill="white" opacity="0.92"/>
  <!-- Black keys -->
  <rect x="14"  y="148" width="14" height="26" rx="2" fill="#1A3A6B"/>
  <rect x="38"  y="148" width="14" height="26" rx="2" fill="#1A3A6B"/>
  <rect x="76"  y="148" width="14" height="26" rx="2" fill="#1A3A6B"/>
  <rect x="100" y="148" width="14" height="26" rx="2" fill="#1A3A6B"/>
  <rect x="124" y="148" width="14" height="26" rx="2" fill="#1A3A6B"/>
  <rect x="162" y="148" width="14" height="26" rx="2" fill="#1A3A6B"/>
  <!-- Dividers between white keys -->
  <line x1="26"  y1="148" x2="26"  y2="192" stroke="#cccccc" stroke-width="1"/>
  <line x1="52"  y1="148" x2="52"  y2="192" stroke="#cccccc" stroke-width="1"/>
  <line x1="66"  y1="148" x2="66"  y2="192" stroke="#cccccc" stroke-width="1"/>
  <line x1="90"  y1="148" x2="90"  y2="192" stroke="#cccccc" stroke-width="1"/>
  <line x1="114" y1="148" x2="114" y2="192" stroke="#cccccc" stroke-width="1"/>
  <line x1="140" y1="148" x2="140" y2="192" stroke="#cccccc" stroke-width="1"/>
  <line x1="154" y1="148" x2="154" y2="192" stroke="#cccccc" stroke-width="1"/>
  <line x1="179" y1="148" x2="179" y2="192" stroke="#cccccc" stroke-width="1"/>

  <!-- Treble clef (white, centered, ~72px tall) -->
  <g transform="translate(96, 74)" fill="white">
    <!-- Staff lines (subtle) -->
    <line x1="-32" y1="-30" x2="32" y2="-30" stroke="rgba(255,255,255,0.3)" stroke-width="1.5"/>
    <line x1="-32" y1="-20" x2="32" y2="-20" stroke="rgba(255,255,255,0.3)" stroke-width="1.5"/>
    <line x1="-32" y1="-10" x2="32" y2="-10" stroke="rgba(255,255,255,0.3)" stroke-width="1.5"/>
    <line x1="-32" y1="0"   x2="32" y2="0"   stroke="rgba(255,255,255,0.3)" stroke-width="1.5"/>
    <line x1="-32" y1="10"  x2="32" y2="10"  stroke="rgba(255,255,255,0.3)" stroke-width="1.5"/>
    <!-- Treble clef body -->
    <path d="
      M 0,-60
      C 0,-60 18,-50 18,-28
      C 18,-12 8,0 0,6
      C 10,10 18,20 18,30
      C 18,46 6,58 -4,58
      C -14,58 -22,50 -22,40
      C -22,28 -12,20 0,20
      C 6,20 12,24 14,30
      C 10,26 4,24 0,24
      C -8,24 -16,30 -16,40
      C -16,48 -10,54 -4,54
      C 2,54 14,46 14,30
      C 14,18 4,8 -6,4
      C -2,0 10,-12 10,-28
      C 10,-46 -2,-54 0,-60
      Z
      M 0,-58
      C -6,-54 -10,-44 -10,-34
      C -10,-22 -4,-14 0,-10
      C 4,-14 10,-22 10,-34
      C 10,-44 6,-54 0,-58
      Z
    " fill="white"/>
    <!-- Orange accent dot at bottom of clef -->
    <circle cx="0" cy="62" r="5" fill="#E8956D"/>
  </g>

  <!-- Orange accent glow circle behind clef (subtle) -->
  <circle cx="96" cy="74" r="44" fill="rgba(232,149,109,0.12)"/>
</svg>`;

// Round icon: same but with circular clip
function roundIconSvg(size) {
  const r = size / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192" width="192" height="192">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#1A3A6B"/>
      <stop offset="100%" stop-color="#2968C8"/>
    </linearGradient>
    <clipPath id="circle">
      <circle cx="96" cy="96" r="96"/>
    </clipPath>
  </defs>
  <g clip-path="url(#circle)">
    <rect width="192" height="192" fill="url(#bg)"/>
    <rect x="0" y="148" width="192" height="44" fill="white" opacity="0.92"/>
    <rect x="14"  y="148" width="14" height="26" rx="2" fill="#1A3A6B"/>
    <rect x="38"  y="148" width="14" height="26" rx="2" fill="#1A3A6B"/>
    <rect x="76"  y="148" width="14" height="26" rx="2" fill="#1A3A6B"/>
    <rect x="100" y="148" width="14" height="26" rx="2" fill="#1A3A6B"/>
    <rect x="124" y="148" width="14" height="26" rx="2" fill="#1A3A6B"/>
    <rect x="162" y="148" width="14" height="26" rx="2" fill="#1A3A6B"/>
    <line x1="26"  y1="148" x2="26"  y2="192" stroke="#cccccc" stroke-width="1"/>
    <line x1="52"  y1="148" x2="52"  y2="192" stroke="#cccccc" stroke-width="1"/>
    <line x1="66"  y1="148" x2="66"  y2="192" stroke="#cccccc" stroke-width="1"/>
    <line x1="90"  y1="148" x2="90"  y2="192" stroke="#cccccc" stroke-width="1"/>
    <line x1="114" y1="148" x2="114" y2="192" stroke="#cccccc" stroke-width="1"/>
    <line x1="140" y1="148" x2="140" y2="192" stroke="#cccccc" stroke-width="1"/>
    <line x1="154" y1="148" x2="154" y2="192" stroke="#cccccc" stroke-width="1"/>
    <line x1="179" y1="148" x2="179" y2="192" stroke="#cccccc" stroke-width="1"/>
    <circle cx="96" cy="74" r="44" fill="rgba(232,149,109,0.12)"/>
    <g transform="translate(96, 74)" fill="white">
      <line x1="-32" y1="-30" x2="32" y2="-30" stroke="rgba(255,255,255,0.3)" stroke-width="1.5"/>
      <line x1="-32" y1="-20" x2="32" y2="-20" stroke="rgba(255,255,255,0.3)" stroke-width="1.5"/>
      <line x1="-32" y1="-10" x2="32" y2="-10" stroke="rgba(255,255,255,0.3)" stroke-width="1.5"/>
      <line x1="-32" y1="0"   x2="32" y2="0"   stroke="rgba(255,255,255,0.3)" stroke-width="1.5"/>
      <line x1="-32" y1="10"  x2="32" y2="10"  stroke="rgba(255,255,255,0.3)" stroke-width="1.5"/>
      <path d="M 0,-60 C 0,-60 18,-50 18,-28 C 18,-12 8,0 0,6 C 10,10 18,20 18,30 C 18,46 6,58 -4,58 C -14,58 -22,50 -22,40 C -22,28 -12,20 0,20 C 6,20 12,24 14,30 C 10,26 4,24 0,24 C -8,24 -16,30 -16,40 C -16,48 -10,54 -4,54 C 2,54 14,46 14,30 C 14,18 4,8 -6,4 C -2,0 10,-12 10,-28 C 10,-46 -2,-54 0,-60 Z M 0,-58 C -6,-54 -10,-44 -10,-34 C -10,-22 -4,-14 0,-10 C 4,-14 10,-22 10,-34 C 10,-44 6,-54 0,-58 Z" fill="white"/>
      <circle cx="0" cy="62" r="5" fill="#E8956D"/>
    </g>
  </g>
</svg>`;
}

// Foreground SVG for adaptive icon (108×108 canvas, content in safe zone 27–81)
const foregroundSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 108 108" width="108" height="108">
  <!-- Transparent background — Android composites with ic_launcher_background color -->

  <!-- Piano strip at bottom of safe zone -->
  <rect x="0" y="80" width="108" height="28" fill="white" opacity="0.92"/>
  <rect x="6"  y="80" width="8"  height="16" rx="1" fill="#1A3A6B"/>
  <rect x="22" y="80" width="8"  height="16" rx="1" fill="#1A3A6B"/>
  <rect x="42" y="80" width="8"  height="16" rx="1" fill="#1A3A6B"/>
  <rect x="56" y="80" width="8"  height="16" rx="1" fill="#1A3A6B"/>
  <rect x="70" y="80" width="8"  height="16" rx="1" fill="#1A3A6B"/>
  <rect x="90" y="80" width="8"  height="16" rx="1" fill="#1A3A6B"/>
  <line x1="14" y1="80" x2="14" y2="108" stroke="#cccccc" stroke-width="0.5"/>
  <line x1="30" y1="80" x2="30" y2="108" stroke="#cccccc" stroke-width="0.5"/>
  <line x1="38" y1="80" x2="38" y2="108" stroke="#cccccc" stroke-width="0.5"/>
  <line x1="50" y1="80" x2="50" y2="108" stroke="#cccccc" stroke-width="0.5"/>
  <line x1="64" y1="80" x2="64" y2="108" stroke="#cccccc" stroke-width="0.5"/>
  <line x1="78" y1="80" x2="78" y2="108" stroke="#cccccc" stroke-width="0.5"/>
  <line x1="86" y1="80" x2="86" y2="108" stroke="#cccccc" stroke-width="0.5"/>
  <line x1="99" y1="80" x2="99" y2="108" stroke="#cccccc" stroke-width="0.5"/>

  <!-- Orange glow -->
  <circle cx="54" cy="42" r="24" fill="rgba(232,149,109,0.15)"/>

  <!-- Treble clef centered in safe zone -->
  <g transform="translate(54, 42)" fill="white">
    <line x1="-18" y1="-17" x2="18" y2="-17" stroke="rgba(255,255,255,0.3)" stroke-width="1"/>
    <line x1="-18" y1="-11" x2="18" y2="-11" stroke="rgba(255,255,255,0.3)" stroke-width="1"/>
    <line x1="-18" y1="-6"  x2="18" y2="-6"  stroke="rgba(255,255,255,0.3)" stroke-width="1"/>
    <line x1="-18" y1="0"   x2="18" y2="0"   stroke="rgba(255,255,255,0.3)" stroke-width="1"/>
    <line x1="-18" y1="6"   x2="18" y2="6"   stroke="rgba(255,255,255,0.3)" stroke-width="1"/>
    <path d="M 0,-34 C 0,-34 10,-28 10,-16 C 10,-7 4.5,0 0,3.5 C 5.6,5.6 10,11.2 10,17 C 10,26 3.4,32.7 -2.3,32.7 C -8,32.7 -12.5,28.2 -12.5,22.6 C -12.5,15.8 -6.8,11.2 0,11.2 C 3.4,11.2 6.8,13.5 7.9,17 C 5.6,14.7 2.3,13.5 0,13.5 C -4.5,13.5 -9,17 -9,22.6 C -9,27 -5.6,30.4 -2.3,30.4 C 1.1,30.4 7.9,26 7.9,17 C 7.9,10.1 2.3,4.5 -3.4,2.3 C -1.1,0 5.6,-6.8 5.6,-16 C 5.6,-26 -1.1,-30.4 0,-34 Z M 0,-33 C -3.4,-30.4 -5.6,-24.8 -5.6,-19.2 C -5.6,-12.4 -2.3,-8 0,-5.6 C 2.3,-8 5.6,-12.4 5.6,-19.2 C 5.6,-24.8 3.4,-30.4 0,-33 Z" fill="white"/>
    <circle cx="0" cy="35" r="3" fill="#E8956D"/>
  </g>
</svg>`;

async function generate() {
  for (const d of densities) {
    const dir = path.join(RES, `mipmap-${d.name}`);

    await sharp(Buffer.from(fullIconSvg))
      .resize(d.launcher, d.launcher)
      .png()
      .toFile(path.join(dir, 'ic_launcher.png'));

    await sharp(Buffer.from(roundIconSvg(d.launcher)))
      .resize(d.launcher, d.launcher)
      .png()
      .toFile(path.join(dir, 'ic_launcher_round.png'));

    await sharp(Buffer.from(foregroundSvg))
      .resize(d.fg, d.fg)
      .png()
      .toFile(path.join(dir, 'ic_launcher_foreground.png'));

    console.log(`  mipmap-${d.name}: ${d.launcher}px launcher, ${d.fg}px foreground`);
  }
  console.log('All icons generated successfully!');
}

generate().catch((err) => { console.error(err); process.exit(1); });
