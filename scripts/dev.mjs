// Local only: no Cloudflare Access. NEVER bind to 0.0.0.0 or deploy as production.
import http from 'node:http';import {readFile,mkdir,writeFile} from 'node:fs/promises';import path from 'node:path';import {fileURLToPath} from 'node:url';
import {validateDocument} from '../public/model.js';
const base=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');const web=path.join(base,'public'),dbFile=path.join(base,'data','dev-db.json');
let projects=[];try{projects=JSON.parse(await readFile(dbFile,'utf8'));}catch{}
const persist=async()=>{await mkdir(path.dirname(dbFile),{recursive:true});await writeFile(dbFile,JSON.stringify(projects,null,2));};
const json=(res,data,status=200)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(data));};
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.txt':'text/plain'};
const server=http.createServer(async(req,res)=>{try{const u=new URL(req.url,'http://localhost:8788'),pathname=u.pathname;
 if(pathname.startsWith('/api/')){
  if(pathname==='/api/me')return json(res,{development:true,email:'local-development'});
  let payload={};if(['POST','PUT','PATCH'].includes(req.method)){let raw='';for await(const part of req){raw+=part;if(raw.length>1_500_000)return json(res,{error:'データが大きすぎます'},413);}try{payload=JSON.parse(raw);}catch{return json(res,{error:'JSON不正'},400);}}
  if(pathname==='/api/projects'&&req.method==='GET')return json(res,{projects:projects.filter(p=>!p.deleted_at).map(p=>({id:p.id,title:p.document.project.title,northStarMessage:p.document.project.northStarMessage,slideCount:p.document.slides.length,updatedAt:p.updatedAt,rev:p.rev}))});
  if(pathname==='/api/projects'&&req.method==='POST'){const d=payload.document,issues=validateDocument(d);if(issues.length)return json(res,{error:issues.join('、')},422);d.project.id=crypto.randomUUID();const item={id:d.project.id,document:d,rev:1,updatedAt:new Date().toISOString()};projects.unshift(item);await persist();return json(res,{project:{id:item.id,title:d.project.title,northStarMessage:d.project.northStarMessage,slideCount:d.slides.length,updatedAt:item.updatedAt,rev:1}},201);}
  const match=pathname.match(/^\/api\/projects\/([a-f0-9-]{36})(?:\/(snapshots|restore))?$/);if(!match)return json(res,{error:'未定義のAPI'},404);const p=projects.find(p=>p.id===match[1]&&!p.deleted_at);if(!p)return json(res,{error:'資料が見つかりません'},404);
  if(match[2]==='snapshots'&&req.method==='GET')return json(res,{snapshots:(p.snapshots||[]).map(({id,rev,note,created_at})=>({id,rev,note,created_at})).reverse()});
  if(match[2]==='snapshots'&&req.method==='POST'){p.snapshots ||= [];if(!p.snapshots.some(x=>x.rev===p.rev)){p.snapshots.push({id:crypto.randomUUID(),rev:p.rev,note:typeof payload.note==='string'?payload.note.slice(0,120):'',created_at:new Date().toISOString(),document:structuredClone(p.document)});await persist();}return json(res,{ok:true});}
  if(match[2]==='restore'&&req.method==='POST'){if(payload.expectedRev!==p.rev)return json(res,{error:'更新競合'},409);const snap=(p.snapshots||[]).find(x=>x.id===payload.snapshotId);if(!snap)return json(res,{error:'復元版がありません'},404);p.document=structuredClone(snap.document);p.rev++;await persist();return json(res,{document:p.document,rev:p.rev});}
  if(req.method==='GET')return json(res,{document:p.document,rev:p.rev});if(req.method==='DELETE'){p.deleted_at=new Date().toISOString();await persist();return json(res,{ok:true});}
  if(req.method==='PUT'){if(payload.expectedRev!==p.rev)return json(res,{error:'更新が競合しました'},409);const d=payload.document,issues=validateDocument(d);if(issues.length||d.project.id!==p.id)return json(res,{error:issues.join('、')||'資料IDが一致しません'},422);p.document=d;p.rev++;p.updatedAt=new Date().toISOString();await persist();return json(res,{rev:p.rev});}
  return json(res,{error:'許可されていない操作'},405);
 }
 const file=path.resolve(web,'.'+(pathname==='/'?'/index.html':pathname));if(!file.startsWith(web+path.sep))return json(res,{error:'許可されていません'},403);
 try{const data=await readFile(file);res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});res.end(data);}catch{const fallback=await readFile(path.join(web,'index.html'));res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end(fallback);}
 }catch(e){console.error('[dev] error',e.message);json(res,{error:'Local development error'},500);}});
server.listen(8788,'127.0.0.1',()=>console.log('ROUGH MAKER local preview: http://127.0.0.1:8788  (NO AUTH / LOCAL ONLY)'));
