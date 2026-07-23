/**
 * PWA Icon Generator
 * 
 * Usage: node icons/generate-icons.js
 * 
 * Requires: npm install sharp
 * Generates PNG icons from SVG for all PWA required sizes.
 */

const fs = require('fs');
const path = require('path');

const SIZES = [48, 72, 96, 128, 144, 152, 192, 384, 512];
const SVG_PATH = path.join(__dirname, 'icon.svg');
const OUTPUT_DIR = __dirname;

async function generateIcons() {
  try {
    const sharp = require('sharp');
    const svgBuffer = fs.readFileSync(SVG_PATH);

    console.log('🎨 Generating PWA icons...\n');

    for (const size of SIZES) {
      const outputPath = path.join(OUTPUT_DIR, `icon-${size}.png`);
      
      await sharp(svgBuffer)
        .resize(size, size)
        .png()
        .toFile(outputPath);

      const stats = fs.statSync(outputPath);
      console.log(`  ✅ icon-${size}.png (${(stats.size / 1024).toFixed(1)}KB)`);
    }

    console.log('\n✨ All icons generated successfully!');
    console.log('📁 Location:', OUTPUT_DIR);

  } catch (error) {
    if (error.code === 'MODULE_NOT_FOUND') {
      console.error('❌ Please install sharp first: npm install sharp');
    } else {
      console.error('❌ Error:', error.message);
    }
  }
}

generateIcons();
