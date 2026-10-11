export const SCHEMA_VERSION='1.0.0';
export const ROLES={background:'背景',question:'問い',fact:'事実',finding:'発見',cause:'原因',implication:'示唆',proposal:'提案',conclusion:'結論',risk:'リスク',supplement:'補足'};
export const LINKS={none:'接続なし',therefore:'だから',because:'なぜなら',however:'しかし',example:'具体的には',parallel:'一方で',answer:'その答えは',sequence:'続いて'};
export const CATEGORIES={claim:'主張',compare:'比較・評価',trend:'変化・推移',parts:'構成・内訳',cause:'課題・因果',relation:'関係・構造',process:'工程・計画',decision:'意思決定'};
export const EVIDENCE_TYPES={data:'データ',quote:'文献・引用',interview:'ヒアリング',logic:'論理・試算',case:'事例'};
export const EVIDENCE_STATES={pending:'未収集',collecting:'収集中',ready:'準備済',notNeeded:'不要'};
export const BLUEPRINTS={
 blank:{label:'白紙から作る',sections:[{title:'第1章',roles:[]}]},
 pyramid:{label:'結論先行',sections:[{title:'結論',roles:['conclusion','finding','finding','finding']},{title:'実行と意思決定',roles:['proposal','risk','conclusion']}]},
 problem:{label:'問題解決',sections:[{title:'現状と課題',roles:['background','question','finding']},{title:'原因と打ち手',roles:['cause','implication','proposal']},{title:'実行計画',roles:['proposal','conclusion']}]},
 hypothesis:{label:'仮説検証',sections:[{title:'仮説',roles:['question','finding']},{title:'検証',roles:['fact','fact','implication']},{title:'判断',roles:['conclusion','proposal']}]},
 market:{label:'市場評価',sections:[{title:'外部環境',roles:['background','finding','finding']},{title:'参入余地',roles:['finding','cause','implication']},{title:'判断',roles:['proposal','conclusion']}]},
 options:{label:'選択肢比較',sections:[{title:'評価の前提',roles:['question','background']},{title:'選択肢比較',roles:['fact','fact','finding']},{title:'推奨',roles:['risk','conclusion']}]},
 investment:{label:'投資判断',sections:[{title:'投資目的',roles:['question','proposal']},{title:'収益・費用',roles:['fact','finding','risk']},{title:'決裁事項',roles:['conclusion']}]},
 reporting:{label:'定例報告',sections:[{title:'要点',roles:['conclusion','fact']},{title:'差異と原因',roles:['finding','cause']},{title:'対応',roles:['proposal','conclusion']}]},
 rfp:{label:'提案依頼回答',sections:[{title:'背景と要求',roles:['background','question']},{title:'提案',roles:['proposal','proposal']},{title:'実行と費用',roles:['fact','proposal','conclusion']}]}
};
const id=()=>crypto.randomUUID();
export function newTile(role='finding',kind='content'){return {id:id(),kind,role,message:'',layoutId:'',slots:{},orphanedSlots:{},evidenceNeeds:[],logicToNext:'none',notes:'',status:'rough'};}
export function newDocument(title='無題の資料',blueprint='blank'){
 const def=BLUEPRINTS[blueprint]||BLUEPRINTS.blank;const sections=[],slides=[];
 for(const s of def.sections){const section={id:id(),title:s.title,orderedSlideIds:[]};for(const role of s.roles){const slide=newTile(role);slides.push(slide);section.orderedSlideIds.push(slide.id);}sections.push(section);}
 const projId=id();return {schemaVersion:SCHEMA_VERSION,project:{id:projId,title,audience:'',decisionToMake:'',northStarMessage:'',slideAspectRatio:'16:9'},story:{id:id(),name:'基本案',sectionIds:sections.map(s=>s.id),orderedSlideIds:slides.map(s=>s.id)},sections,slides};
}
export const clone=x=>structuredClone(x);
export function allIds(doc){return doc.sections.flatMap(s=>s.orderedSlideIds);}
export function syncOrder(doc){doc.story.sectionIds=doc.sections.map(s=>s.id);doc.story.orderedSlideIds=allIds(doc);return doc;}
export function getSlide(doc,id){return doc.slides.find(s=>s.id===id);}
export function insertSlide(doc,sectionId,afterId=null,slide=newTile()){
 const section=doc.sections.find(s=>s.id===sectionId);if(!section)throw Error('章が見つかりません');
 const pos=afterId?section.orderedSlideIds.indexOf(afterId)+1:section.orderedSlideIds.length;
 section.orderedSlideIds.splice(pos,0,slide.id);doc.slides.push(slide);return syncOrder(doc);
}
export function deleteSlide(doc,slideId){for(const s of doc.sections)s.orderedSlideIds=s.orderedSlideIds.filter(id=>id!==slideId);doc.slides=doc.slides.filter(s=>s.id!==slideId);return syncOrder(doc);}
export function duplicateSlide(doc,slideId){const sec=doc.sections.find(s=>s.orderedSlideIds.includes(slideId));if(!sec)return doc;const copy=clone(getSlide(doc,slideId));copy.id=id();copy.evidenceNeeds=copy.evidenceNeeds.map(e=>({...e,id:id()}));insertSlide(doc,sec.id,slideId,copy);return doc;}
export function moveSlide(doc,slideId,sectionId,index){
 const before=allIds(doc),links=new Map(before.map((x,i)=>[x,{next:before[i+1],type:getSlide(doc,x)?.logicToNext}]));
 const target=doc.sections.find(s=>s.id===sectionId);if(!target||!getSlide(doc,slideId))throw Error('移動できません');
 for(const s of doc.sections)s.orderedSlideIds=s.orderedSlideIds.filter(x=>x!==slideId);
 target.orderedSlideIds.splice(Math.min(Math.max(index,0),target.orderedSlideIds.length),0,slideId);
 syncOrder(doc);const after=allIds(doc);
 for(let i=0;i<after.length;i++){const tile=getSlide(doc,after[i]);if(links.get(tile.id)?.next!==after[i+1])tile.logicToNext='none';}
 return doc;
}
export function changeLayout(tile,template){
 const old={...tile.orphanedSlots,...tile.slots},next={};for(const key of template.slots.split('|').filter(Boolean)){next[key]=old[key]||'';delete old[key];}
 tile.slots=next;tile.orphanedSlots=old;tile.layoutId=template.template_id;
}
export function validateDocument(doc){
 const issues=[];
 if(!doc||typeof doc!=='object'||doc.schemaVersion!==SCHEMA_VERSION)issues.push('未対応のデータ形式です');
 if(!doc?.project||typeof doc.project.id!=='string'||typeof doc.project.title!=='string'||doc.project.title.length>160)issues.push('資料情報が不正です');
 if(!doc?.story||!Array.isArray(doc.story.sectionIds)||!Array.isArray(doc.story.orderedSlideIds))issues.push('構成案が不正です');
 if(!Array.isArray(doc?.sections)||doc.sections.length>150||!Array.isArray(doc?.slides)||doc.slides.length>800)issues.push('スライド構造が不正です');
 if(issues.length)return issues;
 const ids=allIds(doc),slideIds=doc.slides.map(s=>s.id);
 if(ids.length!==new Set(ids).size||slideIds.length!==new Set(slideIds).size||ids.length!==slideIds.length||slideIds.some(i=>!ids.includes(i)))issues.push('スライドIDの重複または欠損があります');
 if(JSON.stringify(ids)!==JSON.stringify(doc.story.orderedSlideIds)||JSON.stringify(doc.sections.map(s=>s.id))!==JSON.stringify(doc.story.sectionIds))issues.push('章とスライドの順序が一致しません');
 for(const s of doc.slides){if(typeof s.message!=='string'||s.message.length>1200||typeof s.notes!=='string'||s.notes.length>5000||!Array.isArray(s.evidenceNeeds)||s.evidenceNeeds.length>100||typeof s.layoutId!=='string')issues.push(`不正なスライド: ${s.id}`);}
 return issues;
}
export function inspectLogic(doc){
 const issues=[],seen=new Map(),ids=allIds(doc);
 if(!doc.project.northStarMessage.trim())issues.push({level:'未入力',id:null,message:'資料全体の最終結論が未設定'});
 doc.sections.filter(s=>s.orderedSlideIds.length===0).forEach(s=>issues.push({level:'要確認',id:null,message:`空の章「${s.title}」があります`}));
 ids.forEach((id,i)=>{const s=getSlide(doc,id);if(!s)return;if(s.kind!=='content')return;
 if(!s.message.trim())issues.push({level:'未入力',id,message:`${i+1}枚目：主張が未入力`});
 if(!s.layoutId)issues.push({level:'未入力',id,message:`${i+1}枚目：ラフ構図が未設定`});
 if(!s.evidenceNeeds.length)issues.push({level:'要確認',id,message:`${i+1}枚目：必要な根拠が未登録`});
 if(s.message.trim().length>70)issues.push({level:'要確認',id,message:`${i+1}枚目：主張が長いため分割を検討`});
 const normalized=s.message.replace(/\s/g,'');if(normalized&&seen.has(normalized))issues.push({level:'要確認',id,message:`${i+1}枚目：${seen.get(normalized)}枚目と主張が重複`});else if(normalized)seen.set(normalized,i+1);
 if(i<ids.length-1&&s.logicToNext==='none')issues.push({level:'参考',id,message:`${i+1}枚目：次の主張への論理接続が未指定`});
 });return issues;
}
export function searchTemplates(templates,query='',category='all',favorites=[],recent=[]){
 const norm=v=>String(v||'').normalize('NFKC').toLowerCase().replace(/[\sーｰ・]/g,'').replace(/[ァ-ヶ]/g,c=>String.fromCharCode(c.charCodeAt(0)-96));
 const q=norm(query);const synonym={増加:['trend','推移','成長','折れ線'],成長:['trend','上昇','推移'],比較:['compare','比較','マトリクス'],売上:['trend','売上','棒グラフ'],選択:['decision','意思決定'],原因:['cause','課題','因果'],構造:['relation','parts','構成'],競合:['compare','比較'],市場:['trend','market','市場'],費用:['decision','費用'],割合:['parts','構成比'],投資:['decision','投資']};
 const related=Object.entries(synonym).filter(([a])=>q&&norm(a).includes(q)||q&&q.includes(norm(a))).flatMap(([,arr])=>arr.map(norm));
 return templates.filter(t=>category==='all'||t.category===category).map(t=>{const name=norm(t.name),intent=norm(t.intent),tags=norm(t.search_tags),id=norm(t.template_id);let score=(favorites.includes(t.template_id)?5:0)+(recent.includes(t.template_id)?4:0)+(t.phase==='P0'?2:0);if(q){score+=(name.includes(q)?30:0)+(intent.includes(q)?20:0)+(tags.includes(q)?15:0)+(id.includes(q)?9:0)+related.reduce((s,v)=>s+(name.includes(v)||intent.includes(v)||tags.includes(v)||id.includes(v)?6:0),0);}return {t,score};}).filter(x=>!q||x.score>12).sort((a,b)=>b.score-a.score||a.t.name.localeCompare(b.t.name,'ja')).map(x=>x.t);
}
export function toMarkdown(doc){let out=`# ${doc.project.title}\n\n最終結論：${doc.project.northStarMessage||'未設定'}\n\n`;for(const sec of doc.sections){out+=`## ${sec.title}\n\n`;for(const id of sec.orderedSlideIds){const t=getSlide(doc,id);out+=`- **${t.message||'（主張未設定）'}** [${ROLES[t.role]||t.role}]\n  - 構図：${t.layoutId||'未設定'}\n  - 根拠：${t.evidenceNeeds.map(e=>e.label+'（'+(EVIDENCE_STATES[e.status]||e.status)+'）').join('、')||'未設定'}\n  - 接続：${LINKS[t.logicToNext]||'なし'}\n`;}}return out;}
export function toTSV(doc){const rows=[['章','順番','役割','主張','構図ID','根拠','次への接続']];let i=0;for(const sec of doc.sections)for(const id of sec.orderedSlideIds){const s=getSlide(doc,id);rows.push([sec.title,++i,ROLES[s.role]||s.role,s.message,s.layoutId,s.evidenceNeeds.map(e=>e.label).join(' / '),LINKS[s.logicToNext]||'']);}return rows.map(r=>r.map(x=>String(x??'').replace(/\t/g,' ').replace(/\r?\n/g,' ')).join('\t')).join('\n');}
