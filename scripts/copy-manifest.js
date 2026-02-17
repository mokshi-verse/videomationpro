// Script to copy manifest.json to dist folder after build
import { copyFileSync, existsSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

// Copy manifest.json
copyFileSync(
  resolve(root, 'manifest.json'),
  resolve(root, 'dist', 'manifest.json')
);

// Copy icons if they exist
const iconsDir = resolve(root, 'public', 'icons');
const distIconsDir = resolve(root, 'dist', 'icons');

if (existsSync(iconsDir)) {
  if (!existsSync(distIconsDir)) {
    mkdirSync(distIconsDir, { recursive: true });
  }
  
  const icons = ['icon16.svg', 'icon48.svg', 'icon128.svg'];
  icons.forEach(icon => {
    const src = resolve(iconsDir, icon);
    if (existsSync(src)) {
      copyFileSync(src, resolve(distIconsDir, icon));
    }
  });
}

