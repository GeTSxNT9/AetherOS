(() => {
'use strict';
const days=Object.keys(window.ALPHA_ROUTINE);
const $=id=>document.getElementById(id);
let currentDay=days[0];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const todayName=()=>['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'][new Date().getDay()];
const dateKey=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
function init(){
  const today=todayName(); currentDay=days.includes(today)?today:'Descanso';
  $('todayLabel').textContent=new Intl.DateTimeFormat('es-ES',{weekday:'long',day:'numeric',month:'long'}).format(new Date()).toUpperCase();
  $('headline').textContent=days.includes(today)?'Hoy toca progresar.':'Tu próximo entrenamiento.';
  $('subhead').textContent=days.includes(today)?'Concéntrate en la siguiente serie.':'Elige una sesión para consultar tu rutina.';
  if(TrackerStore.getSessionDate()!==dateKey()){
    days.forEach(day=>window.ALPHA_ROUTINE[day].exercises.forEach(ex=>TrackerStore.setDone(day,ex.id,false)));
    TrackerStore.setSessionDate(dateKey());
  }
  renderDayPicker(); renderSession();
  $('settingsBtn').addEventListener('click',()=>$('settingsDialog').showModal());
  $('exportBtn').addEventListener('click',exportData); $('exportSettings').addEventListener('click',exportData);
  $('importInput').addEventListener('change',importData);
  if('serviceWorker' in navigator && location.protocol!=='file:') navigator.serviceWorker.register('./sw.js').catch(()=>{});
}
function renderDayPicker(){
  $('dayPicker').innerHTML=days.map((day,i)=>`<button class="day-button ${day===currentDay?'active':''}" data-day="${day}" aria-pressed="${day===currentDay}"><span>${['L','M','X','J','V'][i]}</span><small>${day.slice(0,3)}</small></button>`).join('');
  $('dayPicker').querySelectorAll('button').forEach(btn=>btn.addEventListener('click',()=>{currentDay=btn.dataset.day;renderDayPicker();renderSession()}));
}
function renderSession(){
 const list=$('exerciseList'), isRest=!days.includes(currentDay);
 $('dayTitle').textContent=isRest?'Fin de semana':currentDay;
 $('dayFocus').textContent=isRest?'Recuperación · Actividad suave':window.ALPHA_ROUTINE[currentDay].focus;
 $('exerciseCount').textContent=isRest?'Descanso':`${window.ALPHA_ROUTINE[currentDay].exercises.length} ejercicios`;
 $('restPanel').hidden=!isRest; list.hidden=isRest;
 if(isRest){$('progressText').textContent='—';$('progressFill').style.width='0%';list.innerHTML='';return}
 const session=window.ALPHA_ROUTINE[currentDay];
 list.innerHTML=session.exercises.map((ex,index)=>renderExercise(ex,index)).join('');
 session.exercises.forEach(ex=>wireExercise(ex)); updateProgress();
}
function activeExercise(ex){const variant=TrackerStore.getVariant(currentDay,ex.id);return variant?{...ex,name:variant.name,sets:variant.sets,reps:variant.reps,selectedAlternative:true}:ex}
function renderExercise(ex,index){
 const data=TrackerStore.getExercise(currentDay,ex.id), active=activeExercise(ex), done=TrackerStore.isDone(currentDay,ex.id);
 const setData=data.sets||{};
 return `<article class="exercise-card ${done?'is-done':''}" id="card-${ex.id}">
 <div class="card-top"><div class="number">${String(index+1).padStart(2,'0')}</div><div class="exercise-heading"><span class="muscle-tag">${esc(ex.muscle)}</span><h3>${esc(active.name)}</h3><p class="prescription">${active.sets} series <span>·</span> ${esc(active.reps)} reps <span>·</span> ${esc(ex.rir||'RIR 1–2')}</p></div>
 <label class="done-control" title="Marcar ejercicio completado"><input type="checkbox" class="done-check" ${done?'checked':''} aria-label="Marcar ${esc(active.name)} como hecho"><span>✓</span></label></div>
 <div class="technique-placeholder" aria-label="Espacio reservado para animación técnica"><span class="play-symbol">▷</span><span>Demostración técnica</span><small>Animación próximamente</small></div>
 <div class="set-list">${Array.from({length:active.sets},(_,i)=>{const s=setData[i]||{};return `<div class="set-row"><span class="set-number">S${i+1}</span><label><span>Kg</span><input inputmode="decimal" type="number" min="0" step="0.5" placeholder="—" data-set="${i}" data-field="weight" value="${esc(s.weight||'')}"></label><label><span>Reps</span><input inputmode="numeric" type="number" min="0" step="1" placeholder="—" data-set="${i}" data-field="reps" value="${esc(s.reps||'')}"></label><label><span>RIR</span><input inputmode="numeric" type="number" min="0" max="10" step="1" placeholder="—" data-set="${i}" data-field="rir" value="${esc(s.rir??'')}"></label></div>`}).join('')}</div>
 <div class="card-actions"><button class="subtle-button alternatives-btn" type="button" aria-expanded="false">⇄ <span>Cambiar ejercicio</span></button><button class="subtle-button note-btn" type="button" aria-expanded="false">ⓘ <span>Técnica</span></button></div>
 <div class="alternatives-panel" hidden><p class="panel-label">ELIGE UNA SUSTITUCIÓN</p>${ex.alternatives.map((alt,i)=>`<button class="alternative-option" type="button" data-alt="${i}"><span><b>${esc(alt[0])}</b><small>${alt[1]} series · ${esc(alt[2])} reps</small></span><span>→</span></button>`).join('')}<button class="reset-variant" type="button">Volver al ejercicio principal</button></div>
 <div class="note-panel" hidden><p>${esc(ex.note||'Mantén una técnica controlada.')}</p><p class="fineprint">RIR: repeticiones que podrías completar antes del fallo técnico. Compuestos habitualmente RIR 2 (última serie RIR 1); aislamientos RIR 1–2.</p></div>
 <p class="saved-status" aria-live="polite">Guardado automáticamente</p></article>`;
}
function wireExercise(ex){
 const card=$(`card-${ex.id}`);
 card.querySelector('.done-check').addEventListener('change',e=>{TrackerStore.setDone(currentDay,ex.id,e.target.checked);card.classList.toggle('is-done',e.target.checked);updateProgress()});
 card.querySelectorAll('[data-field]').forEach(input=>input.addEventListener('input',()=>{
   const d=TrackerStore.getExercise(currentDay,ex.id);d.sets=d.sets||{};const i=input.dataset.set;d.sets[i]=d.sets[i]||{};d.sets[i][input.dataset.field]=input.value;TrackerStore.saveExercise(currentDay,ex.id,d);
   const status=card.querySelector('.saved-status');status.textContent='Guardado';clearTimeout(status._timer);status._timer=setTimeout(()=>status.textContent='Guardado automáticamente',1200);
 }));
 const altBtn=card.querySelector('.alternatives-btn'), altPanel=card.querySelector('.alternatives-panel');
 altBtn.addEventListener('click',()=>{altPanel.hidden=!altPanel.hidden;altBtn.setAttribute('aria-expanded',String(!altPanel.hidden))});
 card.querySelectorAll('[data-alt]').forEach(btn=>btn.addEventListener('click',()=>{
   const a=ex.alternatives[Number(btn.dataset.alt)];TrackerStore.setVariant(currentDay,ex.id,{name:a[0],sets:a[1],reps:a[2]});renderSession();
 }));
 card.querySelector('.reset-variant').addEventListener('click',()=>{TrackerStore.setVariant(currentDay,ex.id,null);renderSession()});
 const noteBtn=card.querySelector('.note-btn'), notePanel=card.querySelector('.note-panel');
 noteBtn.addEventListener('click',()=>{notePanel.hidden=!notePanel.hidden;noteBtn.setAttribute('aria-expanded',String(!notePanel.hidden))});
}
function updateProgress(){
 const exs=window.ALPHA_ROUTINE[currentDay].exercises, done=exs.filter(ex=>TrackerStore.isDone(currentDay,ex.id)).length;
 const pct=exs.length?Math.round(done/exs.length*100):0;$('progressText').textContent=`${pct}%`;$('progressFill').style.width=`${pct}%`;
}
function exportData(){const blob=new Blob([JSON.stringify(TrackerStore.exportAll(),null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`alpha-track-backup-${dateKey()}.json`;a.click();URL.revokeObjectURL(url)}
function importData(e){const file=e.target.files?.[0];if(!file)return;const reader=new FileReader();reader.onload=()=>{try{const data=JSON.parse(reader.result);if(confirm('Importar copia de seguridad? Se combinará con los datos locales.')){TrackerStore.importAll(data);location.reload()}}catch{alert('No se ha podido leer el archivo. Comprueba que sea una copia JSON de Alpha Track.')}e.target.value=''};reader.readAsText(file)}
document.addEventListener('DOMContentLoaded',init);
})();