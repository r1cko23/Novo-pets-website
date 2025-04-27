// vercel-build.js
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Run the build scripts
console.log('Building client...');
execSync('vite build', { stdio: 'inherit' });

console.log('Building server...');
execSync('esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist', { stdio: 'inherit' });

// Ensure the client build is in the right place for production
console.log('Setting up public assets...');
const publicDir = path.join(process.cwd(), 'dist', 'public');
const clientDist = path.join(process.cwd(), 'dist', 'client');

// Create public directory if it doesn't exist
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Copy client assets to public folder
execSync('cp -r dist/client/* dist/public/', { stdio: 'inherit' });

console.log('Build completed successfully!'); 