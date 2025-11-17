import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const publicDir = join(__dirname, '..', 'public');
const iconSvgPath = join(publicDir, 'icon.svg');

// Read SVG file
const svgBuffer = readFileSync(iconSvgPath);

const icons = [
  // PWA icons
  { name: 'icon-192.png', size: 192 },
  { name: 'icon-512.png', size: 512 },

  // Apple touch icon (con padding para modo oscuro)
  { name: 'apple-touch-icon.png', size: 180, padding: 20 },

  // Favicons
  { name: 'favicon-16x16.png', size: 16 },
  { name: 'favicon-32x32.png', size: 32 },

  // Additional iOS sizes
  { name: 'apple-touch-icon-120x120.png', size: 120, padding: 12 },
  { name: 'apple-touch-icon-152x152.png', size: 152, padding: 16 },
  { name: 'apple-touch-icon-167x167.png', size: 167, padding: 17 },
  { name: 'apple-touch-icon-180x180.png', size: 180, padding: 20 },

  // Android icons with different sizes
  { name: 'icon-72.png', size: 72 },
  { name: 'icon-96.png', size: 96 },
  { name: 'icon-128.png', size: 128 },
  { name: 'icon-144.png', size: 144 },
  { name: 'icon-152.png', size: 152 },
  { name: 'icon-384.png', size: 384 },

  // Maskable icons (with safe zone)
  { name: 'maskable-icon-192.png', size: 192, maskable: true },
  { name: 'maskable-icon-512.png', size: 512, maskable: true },
];

async function generateIcon({ name, size, padding = 0, maskable = false }) {
  try {
    const outputPath = join(publicDir, name);

    if (maskable) {
      // For maskable icons, add extra padding (safe zone is 40% of icon)
      const safeZonePadding = Math.floor(size * 0.1);
      await sharp(svgBuffer)
        .resize(size - safeZonePadding * 2, size - safeZonePadding * 2)
        .extend({
          top: safeZonePadding,
          bottom: safeZonePadding,
          left: safeZonePadding,
          right: safeZonePadding,
          background: { r: 103, g: 126, b: 234, alpha: 1 } // gradient start color
        })
        .png({ quality: 100, compressionLevel: 9 })
        .toFile(outputPath);
    } else if (padding > 0) {
      // For iOS icons with padding (looks better on dark backgrounds)
      await sharp(svgBuffer)
        .resize(size - padding * 2, size - padding * 2)
        .extend({
          top: padding,
          bottom: padding,
          left: padding,
          right: padding,
          background: { r: 103, g: 126, b: 234, alpha: 1 } // gradient start color
        })
        .png({ quality: 100, compressionLevel: 9 })
        .toFile(outputPath);
    } else {
      // Standard icon
      await sharp(svgBuffer)
        .resize(size, size)
        .png({ quality: 100, compressionLevel: 9 })
        .toFile(outputPath);
    }

    console.log(`✓ Generated ${name} (${size}x${size})`);
  } catch (error) {
    console.error(`✗ Failed to generate ${name}:`, error.message);
  }
}

async function generateAllIcons() {
  console.log('🎨 Generating PWA icons...\n');

  for (const icon of icons) {
    await generateIcon(icon);
  }

  console.log('\n✨ All icons generated successfully!');
}

generateAllIcons();
