/* Persistencia local y compatibilidad: los datos alpha_v4_* antiguos se conservan intactos. */
(() => {
 const PREFIX='alpha_track_v2_', LEGACY='alpha_v4_';
 const read=(key,fallback=null)=>{try{const v=localStorage.getItem(PREFIX+key);return v===null?fallback:JSON.parse(v)}catch{return fallback}};
 const write=(key,value)=>localStorage.setItem(PREFIX+key,JSON.stringify(value));
 window.TrackerStore={
   getExercise(day,id){return read(`exercise_${day}_${id}`,{weight:'',reps:'',rir:'',notes:'',variant:null,sets:{}})},
   saveExercise(day,id,value){write(`exercise_${day}_${id}`,value);write('lastSaved',Date.now())},
   isDone(day,id){return !!read(`done_${day}_${id}`,false)},
   setDone(day,id,value){write(`done_${day}_${id}`,!!value)},
   getVariant(day,id){return read(`variant_${day}_${id}`,null)},
   setVariant(day,id,value){write(`variant_${day}_${id}`,value)},
   getSessionDate(){return read('sessionDate','')},
   setSessionDate(v){write('sessionDate',v)},
   exportAll(){
     const data={format:'alpha-track-backup-v2',exportedAt:new Date().toISOString(),local:{},legacy:{}};
     for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k.startsWith(PREFIX))data.local[k]=localStorage.getItem(k);else if(k.startsWith(LEGACY)||k==='alpha_last_open')data.legacy[k]=localStorage.getItem(k)}
     return data;
   },
   importAll(data){if(!data||typeof data!=='object')throw Error('Formato no válido');const local=data.local||data;Object.entries(local).forEach(([k,v])=>{if(k.startsWith(PREFIX)||k.startsWith(LEGACY)||k==='alpha_last_open')localStorage.setItem(k,String(v))});Object.entries(data.legacy||{}).forEach(([k,v])=>{if(k.startsWith(LEGACY)||k==='alpha_last_open')localStorage.setItem(k,String(v))})}
 };
})();