import {allIds,getSlide,toMarkdown,toTSV,ROLES,LINKS} from './model.js';
import {skeletonSvg} from './preview.js';
export function downloadText(content,name,type){const blob=new Blob([content],{type});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);}
export function exportName(doc,ext){const d=new Date();const stamp=new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Tokyo',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'}).format(d).replaceAll('-','').replace(' ','_').replace(':','');const safe=doc.project.title.replace(/[\\/:*?"<>|]/g,'').trim().slice(0,42)||'untitled';return `roughmaker_${safe}_${stamp}.${ext}`;}
const safe=(s)=>String(s??'').slice(0,250);
export function buildPptx(doc,templates,constructor){
 const P=constructor||globalThis.PptxGenJS;if(!P)throw Error('PPTXライブラリが読み込めません');
 const p=new P();p.layout='LAYOUT_WIDE';p.author='ROUGH MAKER';p.subject='Rough storyboard: not a finished presentation';p.title=doc.project.title;p.lang='ja-JP';
 const ST=p.ShapeType;const addRect=(sl,x,y,w,h,fill='F0F5F9',line='ABC4D5',rad=false)=>sl.addShape(rad?ST.roundRect:ST.rect,{x,y,w,h,rectRadius:0.08,line:{color:line,width:1},fill:{color:fill}});
 const addLine=(sl,x,y,w,h,color='7394AD',dashed=false)=>sl.addShape(ST.line,{x,y,w,h,line:{color,width:1.7,dash:dashed?'dash':'solid'}});
 const label=(sl,s,x,y,w,h,opts={})=>sl.addText(safe(s),{x,y,w,h,fontFace:'Yu Gothic',fontSize:opts.size||14,bold:!!opts.bold,color:opts.color||'294258',margin:0.06,breakLine:false,valign:'mid',align:opts.align||'left'});
 const slot=(sl,key,value,x,y,w,h)=>{addRect(sl,x,y,w,h,'F5F8FB','C4D5E3',true);label(sl,value||key,x+0.1,y+0.08,w-0.2,h-0.16,{size:12,align:'center',color:'60798E'});};
 let page=0;for(const id of allIds(doc)){
  const t=getSlide(doc,id);const temp=templates.find(v=>v.template_id===t.layoutId);const s=p.addSlide();s.background={color:'FFFFFF'};const sec=doc.sections.find(x=>x.orderedSlideIds.includes(id));const y=2.02,top=0.45;
  label(s,sec?.title||'',0.68,0.24,10,0.27,{size:10,color:'6D8092'});
  label(s,t.message||'（メッセージ未設定）',0.68,top,11.8,1.12,{size:24,bold:true});addLine(s,0.68,1.72,11.9,0,'CEDCE7');
  const keys=temp?.slots.split('|').filter(Boolean)||Object.keys(t.slots);const vals=keys.map(k=>t.slots[k]||k);
  const cat=temp?.category||'claim';const idx=temp?.index||0;
  if(cat==='trend'||temp?.family==='chart'){
   addLine(s,1.65,5.84,0,-2.82);addLine(s,1.65,5.84,9.8,0);
   if(/line|area|index/.test(t.layoutId)){
    const points=[[2.0,5.3],[3.7,4.85],[5.4,4.5],[7.1,3.75],[9,3.23],[11.1,2.58]];
    for(let i=0;i<points.length-1;i++)addLine(s,points[i][0],points[i][1],points[i+1][0]-points[i][0],points[i+1][1]-points[i][1],'7BABC9',true);
   }else if(/donut|radar|bubble|scatter/.test(t.layoutId)){for(let i=0;i<4;i++)addRect(s,2.3+i*2,3+i%2*0.35,1.05,1.05,'F0F5F9');}
   else for(let i=0;i<4;i++)addRect(s,2.6+i*2,3.3+i%2*0.42,1.1,2.1-i%2*0.42,'E8F1F8','A4C0D4');
   label(s,vals[0]||'横軸',4.0,6.06,4,0.36,{size:12,align:'center'});label(s,vals[1]||'縦軸',0.7,2.5,1.0,0.35,{size:11});
  }else if(cat==='parts'&&/donut/.test(t.layoutId)){
   s.addShape(ST.arc,{x:5.15,y:2.67,w:2.7,h:2.7,adjustPoint:0.35,rotate:25,line:{color:'8FBAD9',width:8}});label(s,'構成比',5.73,3.65,1.5,0.5,{size:14,align:'center'});
  }else if(cat==='compare'||cat==='decision'){
   const count=Math.min(3,Math.max(2,vals.length));for(let i=0;i<count;i++)slot(s,keys[i]||String.fromCharCode(65+i),vals[i],1.4+i*(10.4/count),2.5,10.0/count,3.25);
  }else if(cat==='process'||cat==='relation'||cat==='cause'||cat==='claim'||cat==='parts'){
   const count=Math.min(5,Math.max(2,vals.length));const width=10.3/count-0.18;
   for(let i=0;i<count;i++){const x=1.45+i*(10.3/count);slot(s,keys[i]||String.fromCharCode(65+i),vals[i],x,3.08,width,1.6);if(i<count-1)addLine(s,x+width,3.9,0.14,0);}
  }else{for(let i=0;i<3;i++)slot(s,keys[i]||`要素${i+1}`,vals[i],1.6+i*3.5,3.3,3.25,1.9);}
  // Leave explanatory metadata editable in the document.
  const ev=t.evidenceNeeds.map(e=>`${e.label||'根拠'}（${e.status}）`).join(' / ')||'根拠未設定';
  addLine(s,0.68,6.52,11.9,0,'DAE3EC');label(s,`必要な根拠：${ev}`,0.75,6.59,10.5,0.37,{size:10,color:'748596'});label(s,String(++page).padStart(2,'0'),12.0,6.65,0.6,0.32,{size:11,color:'748596'});
  if(typeof s.addNotes==='function')s.addNotes(`役割：${ROLES[t.role]||t.role}\n接続：${LINKS[t.logicToNext]||'なし'}\n構図：${t.layoutId||'未設定'}\n${t.notes||''}`);
 }
 return p;
}
export async function exportPptx(doc,templates){const pptx=buildPptx(doc,templates);await pptx.writeFile({fileName:exportName(doc,'pptx'),compression:true});}
export function exportDocument(doc,type,templates){if(type==='pptx')return exportPptx(doc,templates);const content=type==='json'?JSON.stringify(doc,null,2):type==='md'?toMarkdown(doc):toTSV(doc);downloadText(content,exportName(doc,type),type==='json'?'application/json':type==='md'?'text/markdown':'text/tab-separated-values');}
