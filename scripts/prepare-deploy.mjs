import {readFile,writeFile} from 'node:fs/promises';
const id=process.env.CLOUDFLARE_D1_DATABASE_ID||'';
if(!/^[0-9a-f-]{36}$/.test(id))throw Error('CLOUDFLARE_D1_DATABASE_ID is missing or invalid');
const path=new URL('../wrangler.jsonc',import.meta.url);const config=await readFile(path,'utf8');
await writeFile(path,config.replace('SET_D1_DATABASE_ID_BEFORE_DEPLOY',id));
