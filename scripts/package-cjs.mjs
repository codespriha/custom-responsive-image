import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const cjsDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist', 'cjs');
mkdirSync(cjsDir, { recursive: true });
writeFileSync(join(cjsDir, 'package.json'), JSON.stringify({ type: 'commonjs' }, null, 2) + '\n');
console.log('[custom-responsive-image] wrote dist/cjs/package.json (type: commonjs)');
