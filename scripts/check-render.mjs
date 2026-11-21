import {build} from 'esbuild';
import {mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const projectRoot=new URL('../',import.meta.url);
process.chdir(fileURLToPath(projectRoot));
await mkdir('.qa',{recursive:true});
await build({entryPoints:['tests/render-smoke.tsx'],outfile:'.qa/render-smoke.mjs',bundle:true,platform:'node',format:'esm',packages:'external',define:{'import.meta.env':'{}'}});
await import(new URL('.qa/render-smoke.mjs?run='+Date.now(),projectRoot).href);
