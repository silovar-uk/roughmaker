import {validateDocument} from '../public/model.js';
const headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'};
const security={'Content-Security-Policy':"default-src 'none'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; font-src 'self'; object-src 'none'",'X-Frame-Options':'DENY','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Cache-Control':'private, no-store'};
const reply=(data,status=200)=>new Response(JSON.stringify(data),{status,headers});
const fail=(message,status=400)=>reply({error:message},status);
const b64=s=>Uint8Array.from(atob(s.replace(/-/g,'+').replace(/_/g,'/')+'='.repeat((4-s.length%4)%4)),c=>c.charCodeAt(0));
const parse64=s=>JSON.parse(new TextDecoder().decode(b64(s)));
let cachedKeys={issuer:'',until:0,keys:[]};
export async function verifyAccess(request,env){
 const {ACCESS_ISSUER:issuer,ACCESS_AUD:aud,OWNER_EMAIL:owner}=env;
 if(!issuer||!aud||!owner||!/^https:\/\/[^/]+\.cloudflareaccess\.com\/?$/.test(issuer))throw Object.assign(new Error('認証設定が完了していません'),{status:503});
 const token=request.headers.get('Cf-Access-Jwt-Assertion');if(!token)throw Object.assign(new Error('Cloudflare Accessの認証が必要です'),{status:401});
 const parts=token.split('.');if(parts.length!==3)throw Object.assign(new Error('認証トークンが不正です'),{status:401});
 let head,body;try{head=parse64(parts[0]);body=parse64(parts[1]);}catch{throw Object.assign(new Error('認証トークンが不正です'),{status:401});}
 const now=Math.floor(Date.now()/1000);if(head.alg!=='RS256'||!head.kid||body.iss!==issuer.replace(/\/$/,'')||!Array.isArray(body.aud)||!body.aud.includes(aud)||typeof body.exp!=='number'||body.exp<=now||typeof body.iat!=='number'||body.iat>now+120)throw Object.assign(new Error('認証トークンが有効ではありません'),{status:401});
 if(typeof body.email!=='string'||body.email.trim().toLowerCase()!==owner.trim().toLowerCase())throw Object.assign(new Error('このユーザーにはアクセス権がありません'),{status:403});
 if(cachedKeys.issuer!==issuer||cachedKeys.until<Date.now()){
  const u=new URL('/cdn-cgi/access/certs',issuer);const r=await fetch(u.toString(),{redirect:'error'});if(!r.ok)throw Object.assign(new Error('署名検証用証明書を取得できません'),{status:503});const result=await r.json();cachedKeys={issuer,until:Date.now()+5*60_000,keys:result.keys||[]};
 }
 const jwk=cachedKeys.keys.find(k=>k.kid===head.kid&&k.kty==='RSA');if(!jwk)throw Object.assign(new Error('有効な署名鍵が見つかりません'),{status:401});
 try{const key=await crypto.subtle.importKey('jwk',jwk,{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['verify']);const valid=await crypto.subtle.verify('RSASSA-PKCS1-v1_5',key,b64(parts[2]),new TextEncoder().encode(parts[0]+'.'+parts[1]));if(!valid)throw Error();}catch{throw Object.assign(new Error('認証トークンの署名が不正です'),{status:401});}
 return owner.trim().toLowerCase();
}
function secure(resp){const r=new Response(resp.body,resp);for(const [k,v] of Object.entries(security))r.headers.set(k,v);return r;}
async function readBody(request){if(Number(request.headers.get('Content-Length')||0)>1_500_000)throw Object.assign(new Error('データが大きすぎます'),{status:413});const raw=await request.text();if(raw.length>1_500_000)throw Object.assign(new Error('データが大きすぎます'),{status:413});try{return JSON.parse(raw);}catch{throw Object.assign(new Error('JSON形式が不正です'),{status:400});}}
const meta=r=>({id:r.id,title:r.title,northStarMessage:r.northStarMessage||'',slideCount:r.slideCount||0,createdAt:r.created_at,updatedAt:r.updated_at,rev:r.rev});
async function api(request,env,owner){
 const u=new URL(request.url),p=u.pathname,m=request.method,db=env.DB;
 if(!db)return fail('D1データベースが未設定です',503);
 if(!['GET','HEAD'].includes(m)&&request.headers.get('Origin')!==u.origin)return fail('別オリジンからの書き込みは禁止されています',403);
 if(p==='/api/me'&&m==='GET')return reply({email:owner});
 if(p==='/api/projects'&&m==='GET'){
  const r=await db.prepare('SELECT id,title,content_json,rev,created_at,updated_at FROM projects WHERE owner_email=? AND deleted_at IS NULL ORDER BY updated_at DESC LIMIT 250').bind(owner).all();
  return reply({projects:r.results.map(x=>{const d=JSON.parse(x.content_json);return meta({...x,northStarMessage:d.project.northStarMessage,slideCount:d.slides.length});})});
 }
 if(p==='/api/projects'&&m==='POST'){
  const body=await readBody(request),d=body.document,issues=validateDocument(d);if(issues.length)return fail(issues.join('、'),422);
  d.project.id=crypto.randomUUID();const now=new Date().toISOString();await db.prepare('INSERT INTO projects(id,owner_email,title,content_json,rev,created_at,updated_at) VALUES(?,?,?,?,1,?,?)').bind(d.project.id,owner,d.project.title,JSON.stringify(d),now,now).run();return reply({project:meta({id:d.project.id,title:d.project.title,northStarMessage:d.project.northStarMessage,slideCount:d.slides.length,created_at:now,updated_at:now,rev:1})},201);
 }
 const match=p.match(/^\/api\/projects\/([0-9a-f-]{36})(?:\/(snapshots|restore))?$/);if(!match)return fail('操作が見つかりません',404);
 const id=match[1],sub=match[2];const r=await db.prepare('SELECT * FROM projects WHERE id=? AND owner_email=? AND deleted_at IS NULL').bind(id,owner).first();if(!r)return fail('資料が見つかりません',404);
 if(!sub&&m==='GET')return reply({document:JSON.parse(r.content_json),rev:r.rev});
 if(!sub&&m==='PUT'){
  const body=await readBody(request);const d=body.document;if(!Number.isInteger(body.expectedRev)||!d||d.project?.id!==id)return fail('保存データが不正です',422);const issues=validateDocument(d);if(issues.length)return fail(issues.join('、'),422);
  const now=new Date().toISOString();const updated=await db.prepare('UPDATE projects SET content_json=?,title=?,rev=rev+1,updated_at=? WHERE id=? AND owner_email=? AND rev=? AND deleted_at IS NULL').bind(JSON.stringify(d),d.project.title,now,id,owner,body.expectedRev).run();
  if(!updated.meta?.changes)return fail('他の端末がこの資料を更新しています',409);return reply({rev:body.expectedRev+1,updatedAt:now});
 }
 if(!sub&&m==='DELETE'){await db.prepare('UPDATE projects SET deleted_at=?,updated_at=? WHERE id=? AND owner_email=?').bind(new Date().toISOString(),new Date().toISOString(),id,owner).run();return reply({ok:true});}
 if(sub==='snapshots'&&m==='GET'){const out=await db.prepare('SELECT id,rev,note,created_at FROM snapshots WHERE project_id=? ORDER BY created_at DESC LIMIT 50').bind(id).all();return reply({snapshots:out.results});}
 if(sub==='snapshots'&&m==='POST'){const body=await readBody(request);const note=typeof body.note==='string'?body.note.slice(0,120):'';const uid=crypto.randomUUID();await db.prepare('INSERT OR IGNORE INTO snapshots(id,project_id,rev,note,content_json,created_at) VALUES(?,?,?,?,?,?)').bind(uid,id,r.rev,note,r.content_json,new Date().toISOString()).run();return reply({ok:true});}
 if(sub==='restore'&&m==='POST'){
  const body=await readBody(request);if(!Number.isInteger(body.expectedRev)||typeof body.snapshotId!=='string')return fail('復元指定が不正です',422);
  const snap=await db.prepare('SELECT * FROM snapshots WHERE id=? AND project_id=?').bind(body.snapshotId,id).first();if(!snap)return fail('復元版が見つかりません',404);
  const d=JSON.parse(snap.content_json);const now=new Date().toISOString();const z=await db.prepare('UPDATE projects SET content_json=?,title=?,rev=rev+1,updated_at=? WHERE id=? AND owner_email=? AND rev=?').bind(snap.content_json,d.project.title,now,id,owner,body.expectedRev).run();if(!z.meta?.changes)return fail('他の端末が更新しています',409);return reply({document:d,rev:body.expectedRev+1});
 }
 return fail('操作が見つかりません',404);
}
export default {async fetch(request,env){
 try{
  const owner=await verifyAccess(request,env);const u=new URL(request.url);
  if(u.pathname.startsWith('/api/'))return secure(await api(request,env,owner));
  if(request.method!=='GET'&&request.method!=='HEAD')return secure(fail('Method Not Allowed',405));
  if(!env.ASSETS)return secure(fail('静的アセットの設定がありません',503));
  return secure(await env.ASSETS.fetch(request));
 }catch(e){return secure(fail(e.status?e.message:'サーバーエラー',e.status||500));}
}};
