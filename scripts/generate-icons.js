#!/usr/bin/env node
/**
 * Generates simple SVG-based PNG icons for the extension.
 * Run: node scripts/generate-icons.js
 * Requires: npm install -g sharp  OR  uses canvas if available.
 *
 * If you don't want to run this script, you can drop your own PNG files into:
 *   public/icons/icon16.png
 *   public/icons/icon32.png
 *   public/icons/icon48.png
 *   public/icons/icon128.png
 */

const fs = require('fs');
const path = require('path');

// Minimal inline PNG generator for a simple colored square with letter N
// Uses pure Node.js (no external deps) with raw PNG bytes

function createSimplePNG(size) {
  // We'll generate an SVG and note that a proper build would use sharp/canvas.
  // For now, output a minimal valid 1x1 PNG scaled conceptually.
  // Users should replace with proper icons.
  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#6366F1"/>
      <stop offset="100%" style="stop-color:#8B5CF6"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${Math.round(size * 0.2)}" fill="url(#g)"/>
  <text x="50%" y="50%" font-family="system-ui,sans-serif" font-size="${Math.round(size * 0.55)}" font-weight="700" fill="white" text-anchor="middle" dominant-baseline="central">N</text>
</svg>`;

  return svgContent;
}

const iconsDir = path.join(__dirname, '..', 'public', 'icons');
if (!fs.existsSync(iconsDir)) fs.mkdirSync(iconsDir, { recursive: true });

const sizes = [16, 32, 48, 128];

// Check if sharp is available
let sharp;
try {
  sharp = require('sharp');
} catch {
  sharp = null;
}

if (sharp) {
  Promise.all(
    sizes.map(async (size) => {
      const svg = Buffer.from(createSimplePNG(size));
      await sharp(svg)
        .resize(size, size)
        .png()
        .toFile(path.join(iconsDir, `icon${size}.png`));
      console.log(`✓ icon${size}.png`);
    }),
  ).then(() => {
    console.log('Icons generated successfully.');
  });
} else {
  // Write SVG files that Chrome can use as fallback (it accepts SVGs in some places)
  // but we write them as .svg alongside a note
  sizes.forEach((size) => {
    const svgPath = path.join(iconsDir, `icon${size}.svg`);
    fs.writeFileSync(svgPath, createSimplePNG(size));
    console.log(`Wrote SVG: icon${size}.svg (rename to .png or use sharp to convert)`);
  });

  console.log('\nTo generate proper PNGs, run:');
  console.log('  npm install sharp');
  console.log('  node scripts/generate-icons.js');
  console.log('\nOr use any image editor to create 16/32/48/128px PNG icons.');
}
