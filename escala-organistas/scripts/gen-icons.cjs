// Generates all Android launcher icon PNGs from the reference treble-clef PNG.
// Run: node scripts/gen-icons.cjs
const sharp = require('sharp');
const path = require('path');

const RES      = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'res');
const CLEF_REF = path.join(__dirname, 'treble-clef-ref.png');

const densities = [
  { name: 'mdpi',    launcher: 48,  fg: 108 },
  { name: 'hdpi',    launcher: 72,  fg: 162 },
  { name: 'xhdpi',   launcher: 96,  fg: 216 },
  { name: 'xxhdpi',  launcher: 144, fg: 324 },
  { name: 'xxxhdpi', launcher: 192, fg: 432 },
];

// ─── Background SVG (192×192) — gradient + piano keys only ───────────────
const bgSvgStr = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192" width="192" height="192">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#1A3A6B"/>
      <stop offset="100%" stop-color="#2968C8"/>
    </linearGradient>
  </defs>
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
</svg>`;

// ─── Foreground SVG (108×108) — gradient + piano keys only ───────────────
const fgSvgStr = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 108 108" width="108" height="108">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#1A3A6B"/>
      <stop offset="100%" stop-color="#2968C8"/>
    </linearGradient>
  </defs>
  <rect width="108" height="108" fill="url(#bg)"/>
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
</svg>`;

// ─── Convert black-on-white PNG → white-on-transparent ───────────────────
// Dark pixels become opaque white; bright/white pixels become transparent.
async function makeWhiteClef(targetSize) {
  const { data, info } = await sharp(CLEF_REF)
    .resize(targetSize, targetSize, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const rgba = Buffer.alloc(info.width * info.height * 4);
  for (let i = 0; i < info.width * info.height; i++) {
    const r = data[i * 4];
    const g = data[i * 4 + 1];
    const b = data[i * 4 + 2];
    const brightness = (r + g + b) / 3;
    const alpha = Math.round(255 - brightness); // dark → opaque, bright → transparent
    rgba[i * 4]     = 255; // R white
    rgba[i * 4 + 1] = 255; // G white
    rgba[i * 4 + 2] = 255; // B white
    rgba[i * 4 + 3] = alpha;
  }

  return sharp(rgba, {
    raw: { width: info.width, height: info.height, channels: 4 },
  }).png().toBuffer();
}

async function generate() {
  // Render base background PNGs at design size
  const bgPng = await sharp(Buffer.from(bgSvgStr)).png().toBuffer();
  const fgPng = await sharp(Buffer.from(fgSvgStr)).png().toBuffer();

  // Clef fits inside the area above piano keys:
  //   launcher: 148px available (y 0–148), use 130px → 9px top margin
  //   foreground: 80px available (y 0–80), use 72px → 4px top margin
  const CLEF_MAIN = 130;
  const CLEF_FG   = 72;

  const clefMain = await makeWhiteClef(CLEF_MAIN);
  const clefFg   = await makeWhiteClef(CLEF_FG);

  // Center horizontally; center vertically in the above-piano area
  const mainLeft = Math.round((192 - CLEF_MAIN) / 2);
  const mainTop  = Math.max(0, Math.round((148 - CLEF_MAIN) / 2));

  const fgLeft = Math.round((108 - CLEF_FG) / 2);
  const fgTop  = Math.max(0, Math.round((80 - CLEF_FG) / 2));

  // Compose square launcher
  const launcher192 = await sharp(bgPng)
    .composite([{ input: clefMain, left: mainLeft, top: mainTop }])
    .png()
    .toBuffer();

  // Compose foreground
  const fg108 = await sharp(fgPng)
    .composite([{ input: clefFg, left: fgLeft, top: fgTop }])
    .png()
    .toBuffer();

  // Round launcher: clip launcher192 to a circle via dest-in mask
  const circleMask = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="192" height="192">
       <circle cx="96" cy="96" r="96" fill="white"/>
     </svg>`,
  );
  const round192 = await sharp(launcher192)
    .ensureAlpha()
    .composite([{ input: circleMask, blend: 'dest-in' }])
    .png()
    .toBuffer();

  for (const d of densities) {
    const dir = path.join(RES, `mipmap-${d.name}`);

    await sharp(launcher192).resize(d.launcher, d.launcher).png()
      .toFile(path.join(dir, 'ic_launcher.png'));

    await sharp(round192).resize(d.launcher, d.launcher).png()
      .toFile(path.join(dir, 'ic_launcher_round.png'));

    await sharp(fg108).resize(d.fg, d.fg).png()
      .toFile(path.join(dir, 'ic_launcher_foreground.png'));

    console.log(`  mipmap-${d.name}: ${d.launcher}px launcher, ${d.fg}px foreground`);
  }
  console.log('All icons generated successfully!');
}

generate().catch((err) => { console.error(err); process.exit(1); });
