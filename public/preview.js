// Semantic wireframes: geometric placeholders only, never invented data.
const box=(x,y,w,h,fill='none',stroke='currentColor',rx=3)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>`;
const line=(x1,y1,x2,y2,style='')=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="currentColor" stroke-width="1.8" ${style}/>`;
const path=(d,fill='none')=>`<path d="${d}" fill="${fill}" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>`;
const circ=(x,y,r)=>`<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="currentColor" stroke-width="1.8"/>`;
const txt=(x,y,s)=>`<text x="${x}" y="${y}" fill="currentColor" font-size="8" text-anchor="middle" font-family="sans-serif">${s}</text>`;
function diagram(c,n){
 let s='';
 switch(c){
 case 'claim':{
  if(n===2)return box(20,23,140,51,'#dbeaf6')+txt(90,54,'KEY MESSAGE');
  if(n===3||n===5)return box(10,30,62,42,'#e4eef7')+path('M78 51 H102 M97 46 L102 51 L97 56')+box(109,30,62,42,'#e4eef7')+txt(40,53,'FACT')+txt(140,53,'SO WHAT');
  s=box(39,14,102,23,'#dbeaf6')+line(90,37,90,48)+line(32,48,148,48);
  for(let i=0;i<(n===1?2:3);i++){const count=n===1?2:3,w=count===2?60:46,x=count===2?25+i*71:11+i*56;s+=line(x+w/2,48,x+w/2,55)+box(x,55,w,33,'#f0f4f8');}return s;}
 case 'compare':{
  if(n===3)return box(10,12,72,75,'#f0f4f8')+box(99,12,72,75,'#deecf7')+txt(46,21,'BEFORE')+txt(135,21,'AFTER')+path('M86 50 H94');
  if(n===4||n===5||n===6||n===7)return line(20,82,20,14)+line(20,82,163,82)+Array.from({length:4},(_,i)=>box(36+i*31,70-i*13,10,12+i*13,'#dbeaf6')+box(47+i*31,76-i*10,10,6+i*10,'#ebeff4')).join('');
  let x=20,y=16;return Array.from({length:n===0?2:3},(_,i)=>box(x+i*(n===0?76:50),y,n===0?64:44,70,i===0?'#e4eef7':'#f0f4f8')).join('')+(n===1?line(96,14,96,88)+line(20,50,170,50):'');}
 case 'trend':{
  const a=line(22,14,22,84)+line(22,84,164,84);
  if(n===1||n===6)return a+Array.from({length:5},(_,i)=>box(37+i*25,68-(i%3)*15,16,16+(i%3)*15,'#dcecf7')).join('');
  if(n===4)return a+Array.from({length:5},(_,i)=>box(33+i*25,57-(i%2)*15,18,27+(i%2)*15,'#dcecf7')).join('');
  if(n===7)return a+Array.from({length:4},(_,i)=>line(42+i*29,25,42+i*29,72)+box(36+i*29,39,12,23,'#e6f0f7')).join('');
  const points=n===5?'25,67 53,57 81,48 109,37 155,26':'25,73 53,61 81,63 109,42 155,25';return a+path(`M${points.replaceAll(' ',' L')}`)+(n===2?path('M25 62 L53 65 L81 45 L109 48 L155 34'):'');}
 case 'parts':{
  if(n===1)return circ(90,50,35)+circ(90,50,19)+path('M90 15 V32 M125 50 H110')+txt(90,54,'100%');
  if(n===0||n===3)return box(22,35,136,26,'#dcebf6')+line(70,35,70,61)+line(117,35,117,61);
  if(n===4)return box(22,16,75,68,'#e1ecf5')+box(101,16,58,32,'#f0f4f8')+box(101,52,28,32,'#e3eaf0')+box(133,52,26,32,'#e3eaf0');
  if(n===7)return Array.from({length:4},(_,i)=>box(14+i*11,15+i*18,150-i*22,15,'#e1ecf5')).join('');
  if(n===5)return box(16,17,34,20,'#f0f4f8')+box(16,61,34,20,'#f0f4f8')+box(129,32,34,37,'#dcebf6')+path('M50 27 C90 27 90 40 129 40 M50 71 C90 71 90 60 129 60');
  return box(64,12,58,23,'#dcebf6')+path('M90 35 V50 M35 50 H149')+Array.from({length:3},(_,i)=>line(38+i*51,50,38+i*51,60)+box(14+i*51,60,47,26,'#f0f4f8')).join('');}
 case 'cause':{
  if(n===2)return line(25,48,155,48)+path('M145 43 L155 48 L145 53')+Array.from({length:3},(_,i)=>line(40+i*33,48,65+i*33,20)+line(40+i*33,48,65+i*33,78)).join('');
  if(n===6||n===7)return Array.from({length:9},(_,i)=>box(31+(i%3)*40,10+Math.floor(i/3)*27,34,21,(i===4?'#c8dff0':'#f0f4f8'))).join('');
  return box(10,32,49,33,'#f0f4f8')+path('M61 48 H90 M86 44 L90 48 L86 52')+box(93,32,75,33,'#dcebf6')+(n===0?line(134,32,134,16)+box(108,4,50,12,'#f0f4f8'):'');}
 case 'relation':{
  if(n===0)return circ(73,50,32)+circ(107,50,32);
  if(n===3)return Array.from({length:4},(_,i)=>box(12+(i%2)*79,10+Math.floor(i/2)*42,72,36,i===0?'#dcebf6':'#f0f4f8')).join('');
  if(n===7)return Array.from({length:3},(_,i)=>box(24,9+i*29,132,23,i===1?'#e0edf6':'#f0f4f8')).join('');
  return Array.from({length:4},(_,i)=>box(7+i*44,35,39,27,i%2?'#eff3f8':'#dcebf6')).join('')+path('M43 49 H51 M87 49 H95 M131 49 H139');}
 case 'process':{
  if(n===5)return circ(90,50,29)+path('M84 18 L94 19 L91 26 M113 65 L109 73 L102 68')+txt(90,53,'LOOP');
  if(n===2||n===3)return Array.from({length:3},(_,i)=>box(14,20+i*24,148,15,'#f0f4f8')+box(49+i*22,20+i*24,47,15,'#dcebf6')).join('');
  return Array.from({length:4},(_,i)=>box(5+i*45,30,35,35,i===0?'#dcebf6':'#f0f4f8')+(i<3?path(`M${40+i*45} 48 H${50+i*45}`):'')).join('');}
 case 'decision':{
  if(n===1||n===2)return Array.from({length:3},(_,i)=>box(12+i*56,11,49,76,i===0?'#dcebf6':'#f0f4f8')).join('');
  if(n===4)return line(20,81,20,15)+line(20,81,159,81)+circ(50,56,10)+circ(100,31,11)+circ(139,53,8);
  return box(17,18,146,22,'#dcebf6')+Array.from({length:3},(_,i)=>box(17+i*51,52,44,33,'#f0f4f8')).join('');}
 default:return box(20,15,140,70,'#f0f4f8');
 }
}
export function skeletonSvg(template,compact=false){const cat=template?.category||'claim',index=template?.index??0;return `<svg class="skeleton-svg${compact?' compact':''}" viewBox="0 0 180 100" xmlns="http://www.w3.org/2000/svg" aria-label="${template?.name||'ラフ構図'}" role="img"><g color="#7594aa">${diagram(cat,index)}</g></svg>`;}
