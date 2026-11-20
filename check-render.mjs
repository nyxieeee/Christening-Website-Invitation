import {build} from 'esbuild';
import {mkdir} from 'node:fs/promises';
await mkdir('.qa',{recursive:true});
await build({entryPoints:['tests/render-smoke.tsx'],outfile:'.qa/render-smoke.mjs',bundle:true,platform:'node',format:'esm',packages:'external',define:{'import.meta.env':'{}'}});
await import('./.qa/render-smoke.mjs?run='+Date.now());
