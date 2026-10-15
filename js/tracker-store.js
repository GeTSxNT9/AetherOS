/* AetherOS storage layer: preserves prior local records during migration. */
(() => {
 'use strict';
 const PREFIX='aetheros_v1_', LEGACY_PREFIXES=['alpha_track_v2_','alpha_v4_'];
 const read=(key,fallback=null)=>{try{const v=localStorage.getItem(PREFIX+key);return v===null?fallback:JSON.parse(v)}catch{return fallback}};
 const write=(key,value)=>localStorage.setItem(PREFIX+key,JSON.stringify(value));
 const norm=s=>String(s||'principal').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,48)||'principal';
 const legacyRead=(key,fallback)=>{for(const p of LEGACY_PREFIXES){try{const v=localStorage.getItem(p+key);if(v!==null)return JSON.parse(v)}catch{}}return fallback};
 function sessionKey(date,day){return `session_${date}_${norm(day)}`}
 function getExercise(day,id,variantName=null){
   const vkey=norm(variantName||'principal');
   let value=read(`exercise_${day}_${id}_${vkey}`,null);
   const genericCurrent=read(`exercise_${day}_${id}`,null),genericLegacy=legacyRead(`exercise_${day}_${id}`,null),generic=genericCurrent||genericLegacy;
   const hasNewVariant=localStorage.getItem(PREFIX+`variant_${day}_${id}`)!==null;
   const oldVariant=hasNewVariant?read(`variant_${day}_${id}`,null):legacyRead(`variant_${day}_${id}`,generic?.variant||null);
   if(!value&&generic){
     const owner=oldVariant?.name||generic.variant||null;
     // Migrate a generic legacy record only to the variant it actually belonged to.
     if((vkey==='principal'&&!owner&&!hasNewVariant)||(variantName&&owner===variantName))value=generic;
   }
   if(!value)value={weight:'',reps:'',rir:'',notes:'',variant:null,sets:{}};
   if(value.sets&&Object.keys(value.sets).length&&!value.reps){
     const rows=Object.keys(value.sets).sort((a,b)=>Number(a)-Number(b)).map(k=>value.sets[k]||{});
     value.weight=rows.map(x=>x.weight??'').join(',');value.reps=rows.map(x=>x.reps??'').join(',');value.rir=rows.map(x=>x.rir??'').join(',');
   }
   return value;
 }
 function saveExercise(day,id,value,variantName=null){
   const vkey=norm(variantName||'principal');
   write(`exercise_${day}_${id}_${vkey}`,{...value,variant:variantName||null,updatedAt:new Date().toISOString()});
   write('lastSaved',Date.now()); saveSession(day);
 }
 function isDone(day,id){return !!read(`done_${day}_${id}`,legacyRead(`done_${day}_${id}`,false))}
 function setDone(day,id,value){write(`done_${day}_${id}`,!!value);saveSession(day)}
 function getVariant(day,id){return read(`variant_${day}_${id}`,legacyRead(`variant_${day}_${id}`,null))}
 function setVariant(day,id,value){write(`variant_${day}_${id}`,value);saveSession(day)}
 function saveSession(day){
   if(!window.AETHER_ROUTINE)return;
   const now=new Date(),date=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`,routine=window.AETHER_ROUTINE[day];if(!routine)return;
   const key=sessionKey(date,day),old=read(key,null)||{},entries=[];
   routine.exercises.forEach(ex=>{
     const variant=getVariant(day,ex.id),activeName=variant?.name||ex.name,record=getExercise(day,ex.id,variant?.name||null);
     // Keep a prior, already logged variant if the user swaps exercise during the same session.
     (old.entries||[]).filter(e=>e.exerciseId===ex.id&&e.name!==activeName&&(e.weight!==''||e.reps!==''||e.rir!==''||e.done)).forEach(e=>entries.push(e));
     entries.push({exerciseId:ex.id,name:activeName,baseName:ex.name,variant:variant?.name||null,sets:variant?.sets||ex.sets,targetReps:variant?.reps||ex.reps,targetRir:ex.rir,weight:record.weight||'',reps:record.reps||'',rir:record.rir||'',done:isDone(day,ex.id)});
   });
   const hasAny=entries.some(e=>e.weight!==''||e.reps!==''||e.rir!==''||e.done);if(!hasAny&&!old.startedAt)return;
   write(key,{date,day,focus:routine.focus,startedAt:old.startedAt||new Date().toISOString(),updatedAt:new Date().toISOString(),entries});
 }
 function listSessions(){
   const out=[];for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k&&k.startsWith(PREFIX+'session_')){try{const v=JSON.parse(localStorage.getItem(k));if(v&&v.date&&v.entries)out.push(v)}catch{}}}
   return out.sort((a,b)=>`${b.date}${b.day}`.localeCompare(`${a.date}${a.day}`));
 }
 function saveMetric(type,value,date=(()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`})()){
   if(!['weight','waist'].includes(type))throw Error('Medida no válida');const n=Number(value);if(!Number.isFinite(n)||n<=0)throw Error('Valor no válido');
   const list=read('bodyMetrics',[]);if(!date||!/^\d{4}-\d{2}-\d{2}$/.test(date))throw Error('Fecha no válida');list.push({type,value:n,date,createdAt:new Date().toISOString()});write('bodyMetrics',list);return list;
 }
 function getMetrics(){return read('bodyMetrics',[])}
 function exportAll(){
   const out={format:'aetheros-backup-v1',exportedAt:new Date().toISOString(),data:{},legacy:{}};
   for(let i=0;i<localStorage.length;i++){
     const k=localStorage.key(i);if(!k)continue;
     if(k.startsWith(PREFIX))out.data[k]=localStorage.getItem(k);
     else if(LEGACY_PREFIXES.some(p=>k.startsWith(p))||k==='alpha_last_open')out.legacy[k]=localStorage.getItem(k);
   }
   return out;
 }
 function importAll(data){
   if(!data||typeof data!=='object'||Array.isArray(data))throw Error('El archivo no contiene un objeto de copia de seguridad.');
   const entries=data.data&&typeof data.data==='object'?data.data:data.local&&typeof data.local==='object'?data.local:data;
   const allowed=k=>k.startsWith(PREFIX)||LEGACY_PREFIXES.some(p=>k.startsWith(p))||k==='alpha_last_open';
   const staged=[];
   for(const [k,v] of Object.entries(entries)){if(!allowed(k))continue;if(typeof v!=='string')throw Error(`Formato inválido en ${k}`);if(v.length>5_000_000)throw Error('El archivo contiene un registro demasiado grande.');if(k.startsWith(PREFIX)){try{JSON.parse(v)}catch{throw Error(`JSON interno no válido en ${k}`)}}staged.push([k,v]);}
   const legacy=data.legacy&&typeof data.legacy==='object'?Object.entries(data.legacy):[];
   for(const [k,v] of legacy){if(allowed(k)&&typeof v==='string')staged.push([k,v]);}
   if(!staged.length)throw Error('No se encontraron datos compatibles para importar.');
   staged.forEach(([k,v])=>localStorage.setItem(k,v));
   return staged.length;
 }
 window.AetherStore={getExercise,saveExercise,isDone,setDone,getVariant,setVariant,getSessionDate:()=>read('sessionDate',''),setSessionDate:v=>write('sessionDate',v),saveSession,listSessions,saveMetric,getMetrics,exportAll,importAll};
})();
