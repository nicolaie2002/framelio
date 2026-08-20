import { cp, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDirectory = resolve(fileURLToPath(new URL('..', import.meta.url)));
const sourceDirectory = resolve(rootDirectory, 'node_modules/@ffmpeg/core/dist/umd');
const destinationDirectory = resolve(rootDirectory, 'public/ffmpeg');

await mkdir(destinationDirectory, { recursive: true });
await Promise.all([
  cp(resolve(sourceDirectory, 'ffmpeg-core.js'), resolve(destinationDirectory, 'ffmpeg-core.js')),
  cp(resolve(sourceDirectory, 'ffmpeg-core.wasm'), resolve(destinationDirectory, 'ffmpeg-core.wasm')),
]);
