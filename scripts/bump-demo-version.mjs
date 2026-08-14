import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const demoDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'demo');
const htmlPath = join(demoDir, 'index.html');
const bundlePath = join(demoDir, 'dist', 'index.js');

const hash = createHash('md5').update(readFileSync(bundlePath)).digest('hex').slice(0, 10);

const html = readFileSync(htmlPath, 'utf8');
const next = html.replace(
  /(src="\.\/dist\/index\.js)(?:\?v=[a-f0-9]+)?(")/,
  `$1?v=${hash}$2`,
);

if (next !== html) {
  writeFileSync(htmlPath, next);
  console.log(`[custom-responsive-image] demo bundle re-versioned to v=${hash}`);
} else {
  console.log(`[custom-responsive-image] demo bundle already v=${hash}`);
}
