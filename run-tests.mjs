import { runTests } from './tests.js';
const r = runTests();
const failed = r.filter(x => !x.ok);
for (const f of failed) console.log('FAIL', f.name, '\n  got ', JSON.stringify(f.got), '\n  want', JSON.stringify(f.want));
console.log(`${r.length - failed.length}/${r.length} passed`);
process.exit(failed.length ? 1 : 0);
