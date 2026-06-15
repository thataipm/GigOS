// GigOS Icon Generator — run with: node scripts/generate-icons.mjs
import sharp from 'sharp';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '..', 'assets', 'images');

const BG    = '#0A0C10';
const CYAN  = '#18C8E6';
const WHITE = '#F4F7FA';

// ─── Main icon (1024×1024) ─────────────────────────────────────────────
// Matches the in-app splash logo: "GigOS" wordmark, white letters,
// cyan accent dot inside the "O" counter.
//
// Layout at font-size 210px (Arial Black / similar heavy sans):
//   Estimated char widths: G≈152, i≈62, g≈148, O≈152, S≈136  → total ≈ 650px
//   Left edge: 512 − 325 = 187    Right: 187+650 = 837
//   G: 187→339   i: 339→401   g: 401→549   O: 549→701   S: 701→837
//   O center-x ≈ 625    O center-y = baseline − (210×0.36) ≈ 565 − 76 = 489
//   baseline y = 565  (visual mid including g-descender lands near y=510)

function iconSVG(transparent = false) {
  const bg = transparent ? '' : `<rect width="1024" height="1024" fill="${BG}"/>`;

  // Cyan dot sits inside the "O" counter — small filled circle, like the logo
  const dotX = 650;
  const dotY = 493;
  const dotR = 20;

  return `<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  ${bg}
  <text x="512" y="565"
    font-family="'Arial Black', 'Franklin Gothic Heavy', Impact, sans-serif"
    font-weight="900"
    font-size="210"
    fill="${WHITE}"
    text-anchor="middle"
    letter-spacing="4">GigOS</text>
  <circle cx="${dotX}" cy="${dotY}" r="${dotR}" fill="${CYAN}"/>
</svg>`;
}

// ─── Splash image (1024×400) ───────────────────────────────────────────
// Displayed at imageWidth:200 centered over backgroundColor:#000 in app.json.
// Landscape crop keeps the wordmark readable at small rendered size.
function splashSVG() {
  return `<svg width="1024" height="400" viewBox="0 0 1024 400" xmlns="http://www.w3.org/2000/svg">
  <rect width="1024" height="400" fill="${BG}"/>
  <text x="512" y="248"
    font-family="'Arial Black', 'Franklin Gothic Heavy', Impact, sans-serif"
    font-weight="900"
    font-size="180"
    fill="${WHITE}"
    text-anchor="middle"
    letter-spacing="4">GigOS</text>
  <circle cx="648" cy="175" r="17" fill="${CYAN}"/>
</svg>`;
}

// ─── Favicon (196×196) ─────────────────────────────────────────────────
// "G" monogram with cyan dot — readable at tiny sizes.
function faviconSVG() {
  return `<svg width="196" height="196" viewBox="0 0 196 196" xmlns="http://www.w3.org/2000/svg">
  <rect width="196" height="196" rx="28" fill="${BG}"/>
  <text x="98" y="134"
    font-family="'Arial Black', 'Franklin Gothic Heavy', Impact, sans-serif"
    font-weight="900"
    font-size="128"
    fill="${WHITE}"
    text-anchor="middle">G</text>
  <circle cx="98" cy="104" r="10" fill="${CYAN}"/>
</svg>`;
}

// ─── Generate ──────────────────────────────────────────────────────────
async function run() {
  await sharp(Buffer.from(iconSVG(false))).png().toFile(path.join(OUT, 'icon.png'));
  console.log('✓ icon.png');

  await sharp(Buffer.from(iconSVG(true))).png().toFile(path.join(OUT, 'adaptive-icon.png'));
  console.log('✓ adaptive-icon.png');

  await sharp(Buffer.from(faviconSVG())).png().toFile(path.join(OUT, 'favicon.png'));
  console.log('✓ favicon.png');

  await sharp(Buffer.from(splashSVG())).png().toFile(path.join(OUT, 'splash-image.png'));
  console.log('✓ splash-image.png');

  console.log('\nDone — assets/images/');
}

run().catch(err => { console.error(err); process.exit(1); });
