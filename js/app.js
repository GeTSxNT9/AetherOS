/* AetherOS · lógica principal de la interfaz.
 * Pantallas: Entrenar (rutina + registro), Historial y Estadísticas. */
(() => {
  'use strict';

  const ROUTINE = window.AETHER_ROUTINE;
  const DAYS = Object.keys(ROUTINE);
  const DAY_INITIALS = ['L', 'M', 'X', 'J', 'V'];
  const WEEKDAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const REST_SECONDS = 120;
  const VIEWS = ['training', 'history', 'stats'];

  const $ = id => document.getElementById(id);
  let currentDay = DAYS[0];
  let timerSeconds = REST_SECONDS;
  let timerInterval = null;

  // ======================================================================
  // Utilidades
  // ======================================================================
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const norm = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const formatKg = value => Math.round(value).toLocaleString('es-ES');

  const dateKey = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  // Semana ISO ("2026 S43") a partir de una fecha "AAAA-MM-DD".
  function isoWeekKey(dateString) {
    const [year, month, day] = String(dateString).split('-').map(Number);
    const d = new Date(Date.UTC(year, month - 1, day));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const week = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return `${d.getUTCFullYear()} S${String(week).padStart(2, '0')}`;
  }

  // "8 10 12" / "8,10,12" / "8;10;12" → [8, 10, 12]
  const parseNums = value => String(value ?? '').trim().split(/[,;\s]+/)
    .map(x => x.trim()).filter(Boolean).map(Number).filter(n => Number.isFinite(n) && n >= 0);

  // Pesos: las series se separan con ";" (o espacios). Se admiten comas antiguas, y una
  // única coma decimal sigue siendo válida (p. ej. "40,5" = 40.5 kg).
  function parseWeights(value) {
    const raw = String(value ?? '').trim();
    if (!raw) return [];
    let parts;
    if (raw.includes(';') || /\s/.test(raw)) {
      parts = raw.split(/[;\s]+/);
    } else if ((raw.match(/,/g) || []).length > 1) {
      parts = raw.split(',');
    } else if (raw.includes(',')) {
      const decimals = raw.split(',')[1];
      parts = decimals.length === 1 ? [raw.replace(',', '.')] : raw.split(',');
    } else {
      parts = [raw];
    }
    return parts.map(x => Number(x.trim().replace(',', '.'))).filter(n => Number.isFinite(n) && n >= 0);
  }

  // Un valor único se repite en todas las series; varios valores se usan tal cual.
  function seriesValues(value, parser, sets) {
    const values = parser(value);
    if (!values.length) return [];
    if (values.length === 1) return Array(Math.max(1, Number(sets) || 1)).fill(values[0]);
    return values;
  }

  // ======================================================================
  // Cálculos de volumen y repeticiones
  // ======================================================================
  function entryVolume(entry) {
    const sets = Math.max(1, Number(entry.sets) || 1);
    const weights = parseWeights(entry.weight);
    const reps = parseNums(entry.reps);
    if (!weights.length || !reps.length) return 0;

    const perSet = weights.length > 1 || reps.length > 1;
    if (!perSet) return weights[0] * reps[0] * sets;

    let total = 0;
    const count = Math.max(weights.length, reps.length);
    for (let i = 0; i < count; i++) {
      total += weights[Math.min(i, weights.length - 1)] * reps[Math.min(i, reps.length - 1)];
    }
    return total;
  }

  function entryReps(entry) {
    const values = parseNums(entry.reps);
    const sum = values.reduce((a, b) => a + b, 0);
    return values.length === 1 ? sum * (Number(entry.sets) || 1) : sum;
  }

  const sessionVolume = session => session.entries.reduce((sum, e) => sum + entryVolume(e), 0);
  const sessionReps = session => session.entries.reduce((sum, e) => sum + entryReps(e), 0);
  const flattenEntries = sessions => sessions.flatMap(s => s.entries.map(e => ({ ...e, date: s.date, day: s.day })));

  // ======================================================================
  // Entrenar: ejercicios, variantes y progresión
  // ======================================================================
  function activeExercise(ex) {
    const variant = AetherStore.getVariant(currentDay, ex.id);
    return variant
      ? { ...ex, name: variant.name, sets: Number(variant.sets) || ex.sets, reps: variant.reps || ex.reps, selectedAlternative: true }
      : ex;
  }

  const readRecord = (ex, active) => AetherStore.getExercise(currentDay, ex.id, active.selectedAlternative ? active.name : null);

  // Doble progresión: si todas las series llegan al máximo del rango con el RIR previsto,
  // se sugiere subir un poco el peso en la siguiente sesión.
  function progression(ex, active, record) {
    const range = String(active.reps).match(/(\d+)\s*[–-]\s*(\d+)/);
    if (!range) return null;

    const top = Number(range[2]);
    const sets = active.sets;
    const reps = seriesValues(record.reps, parseNums, sets);
    const rir = seriesValues(record.rir, parseNums, sets);
    const weights = parseWeights(record.weight);
    if (!reps.length || !rir.length || !weights.length) return null;
    if (reps.length < sets || rir.length < sets) return null;

    const expectedRir = Number((String(ex.rir).match(/\d+/) || ['2'])[0]);
    const lastSetRir1 = /ultima serie\s*1/.test(norm(ex.rir)); // p. ej. "2 (última serie 1)"
    const reachedTop = reps.slice(0, sets).every(value => value >= top);
    const rirOk = rir.slice(0, sets).every((value, index) => {
      const target = lastSetRir1 && index === sets - 1 ? 1 : expectedRir;
      return value >= target && value <= target + 1;
    });
    if (!reachedTop || !rirOk) return null;

    const muscle = norm(ex.muscle);
    const name = norm(active.name);
    const lowerBody = muscle.includes('pierna') || muscle.includes('gluteo') || name.includes('sentadilla') || name.includes('prensa') || name.includes('hip thrust');
    const step = name.includes('mancuerna') ? 1 : (lowerBody ? 5 : 2.5);
    const current = Math.max(...weights);
    return { current, proposed: Math.round((current + step) * 2) / 2, step, top, sets };
  }

  const progressionMarkup = suggestion => suggestion
    ? `<div class="progression-tip"><strong>✓ Doble progresión completada</strong><p>${suggestion.sets} series de ${suggestion.top} reps con RIR adecuado. Para la próxima sesión, prueba <b>${suggestion.proposed} kg</b> (subida prudente de ${suggestion.step} kg).</p></div>`
    : '';

  function exerciseMarkup(ex, index) {
    const active = activeExercise(ex);
    const record = readRecord(ex, active);
    const done = AetherStore.isDone(currentDay, ex.id);
    const field = (label, key) =>
      `<label><span>${label}</span><input inputmode="${key === 'weight' ? 'decimal' : 'text'}" type="text" data-field="${key}" value="${esc(record[key] || '')}"></label>`;
    const alternatives = ex.alternatives.map((alt, i) =>
      `<button class="alternative-option" type="button" data-alt="${i}"><span><b>${esc(alt[0])}</b><small>${alt[1]} series · ${esc(alt[2])} reps</small></span><span>→</span></button>`).join('');

    return `<article class="exercise-card ${done ? 'is-done' : ''}" id="card-${ex.id}">
  <div class="card-top">
    <div class="number">${String(index + 1).padStart(2, '0')}</div>
    <div class="exercise-heading"><span class="muscle-tag">${esc(ex.muscle)}</span><h3>${esc(active.name)}</h3><p class="prescription"><b>${active.sets} series</b><span>·</span>${esc(active.reps)} reps<span>·</span>RIR objetivo ${esc(ex.rir || '1–2')}</p></div>
    <label class="done-control" title="Marcar ejercicio completado"><input type="checkbox" class="done-check" ${done ? 'checked' : ''} aria-label="Marcar ${esc(active.name)} como hecho"><span>✓</span></label>
  </div>
  <div class="exercise-log-row">
    <div class="technique-placeholder" data-animation-name="${esc(active.name)}" aria-label="Demostración técnica"><span class="play-symbol">▷</span><span>Buscando animación</span><small>GIF</small></div>
    <div class="single-entry"><div class="entry-label"><b>Registro</b></div><div class="entry-fields">${field('Peso', 'weight')}${field('Reps', 'reps')}${field('RIR', 'rir')}</div></div>
  </div>
  <div class="progression-slot">${progressionMarkup(progression(ex, active, record))}</div>
  <div class="card-actions"><button class="subtle-button alternatives-btn" type="button" aria-expanded="false">⇄ <span>Cambiar variante</span></button><button class="subtle-button note-btn" type="button" aria-expanded="false">ⓘ <span>Técnica</span></button></div>
  <div class="alternatives-panel" hidden><p class="panel-label">ELIGE LA VARIANTE QUE HAS HECHO</p>${alternatives}<button class="reset-variant" type="button">Volver al ejercicio principal</button></div>
  <div class="note-panel" hidden><p>${esc(ex.note || 'Mantén una técnica controlada.')}</p><p class="fineprint">RIR significa las repeticiones que podrías haber hecho antes del fallo técnico.</p></div>
</article>`;
  }

  // Botón que abre/cierra un panel y mantiene aria-expanded al día.
  function wireToggle(button, panel) {
    button.addEventListener('click', () => {
      panel.hidden = !panel.hidden;
      button.setAttribute('aria-expanded', String(!panel.hidden));
    });
  }

  function wireExercise(ex) {
    const card = $(`card-${ex.id}`);
    const active = activeExercise(ex);

    card.querySelector('.done-check').addEventListener('change', event => {
      AetherStore.setDone(currentDay, ex.id, event.target.checked);
      card.classList.toggle('is-done', event.target.checked);
      updateProgress();
    });

    card.querySelectorAll('[data-field]').forEach(input => input.addEventListener('change', () => {
      const record = readRecord(ex, active);
      record[input.dataset.field] = input.value.trim();
      AetherStore.saveExercise(currentDay, ex.id, record, active.selectedAlternative ? active.name : null);
      card.querySelector('.progression-slot').innerHTML = progressionMarkup(progression(ex, active, record));
    }));

    wireToggle(card.querySelector('.alternatives-btn'), card.querySelector('.alternatives-panel'));
    wireToggle(card.querySelector('.note-btn'), card.querySelector('.note-panel'));

    card.querySelectorAll('[data-alt]').forEach(button => button.addEventListener('click', () => {
      const [name, sets, reps] = ex.alternatives[Number(button.dataset.alt)];
      AetherStore.setVariant(currentDay, ex.id, { name, sets, reps });
      renderSession();
    }));
    card.querySelector('.reset-variant').addEventListener('click', () => {
      AetherStore.setVariant(currentDay, ex.id, null);
      renderSession();
    });
  }

  function renderSession() {
    const session = ROUTINE[currentDay];
    $('dayTitle').textContent = currentDay;
    $('dayFocus').textContent = session.focus;
    $('exerciseCount').textContent = `${session.exercises.length} ejercicios`;
    $('exerciseList').innerHTML = session.exercises.map(exerciseMarkup).join('');
    session.exercises.forEach(wireExercise);
    updateProgress();
    if (window.AetherAnimations) window.AetherAnimations.hydrate($('exerciseList'));
  }

  function updateProgress() {
    const exercises = ROUTINE[currentDay].exercises;
    const done = exercises.filter(ex => AetherStore.isDone(currentDay, ex.id)).length;
    const percent = exercises.length ? Math.round(done / exercises.length * 100) : 0;
    $('progressText').textContent = `${percent}%`;
    $('progressFill').style.width = `${percent}%`;
  }

  function renderDayPicker() {
    const picker = $('dayPicker');
    picker.innerHTML = DAYS.map((day, i) =>
      `<button class="day-button ${day === currentDay ? 'active' : ''}" type="button" data-day="${day}" aria-pressed="${day === currentDay}"><span>${DAY_INITIALS[i]}</span><small>${day.slice(0, 3)}</small></button>`).join('');
    picker.querySelectorAll('button').forEach(button => button.addEventListener('click', () => {
      currentDay = button.dataset.day;
      renderDayPicker();
      renderSession();
    }));
  }

  // ======================================================================
  // Temporizador de descanso
  // ======================================================================
  function wireTimer() {
    const display = $('timerDisplay');
    const startButton = $('timerStart');

    const paint = () => {
      display.textContent = `${String(Math.floor(timerSeconds / 60)).padStart(2, '0')}:${String(timerSeconds % 60).padStart(2, '0')}`;
    };
    const stop = () => {
      clearInterval(timerInterval);
      timerInterval = null;
    };
    const reset = () => {
      stop();
      timerSeconds = REST_SECONDS;
      paint();
      startButton.textContent = 'Iniciar';
    };

    startButton.addEventListener('click', () => {
      if (timerInterval) { // en marcha → pausar
        stop();
        startButton.textContent = 'Reanudar';
        return;
      }
      if (timerSeconds <= 0) reset();
      startButton.textContent = 'Pausar';
      timerInterval = setInterval(() => {
        timerSeconds = Math.max(0, timerSeconds - 1);
        paint();
        if (timerSeconds === 0) {
          stop();
          startButton.textContent = 'Iniciar';
          if ('vibrate' in navigator) navigator.vibrate([180, 80, 180]);
        }
      }, 1000);
    });
    $('timerReset').addEventListener('click', reset);
    paint();
  }

  // ======================================================================
  // Copia de seguridad
  // ======================================================================
  function exportData() {
    const blob = new Blob([JSON.stringify(AetherStore.exportAll(), null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `aetheros-backup-${dateKey()}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function importData(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (!confirm('La copia se combinará con los datos locales. Se conservarán los datos que no coincidan. ¿Continuar?')) return;
        const count = AetherStore.importAll(data);
        alert(`Importación completada: ${count} registros. Se recargará la aplicación.`);
        location.reload();
      } catch (error) {
        alert(`No se ha importado la copia: ${error.message || 'formato no válido'}`);
      } finally {
        event.target.value = '';
      }
    };
    reader.readAsText(file);
  }

  // ======================================================================
  // Historial
  // ======================================================================
  function historyCardMarkup(session) {
    const withData = session.entries.filter(e => e.weight !== '' || e.reps !== '' || e.rir !== '' || e.done);
    const completed = session.entries.filter(e => e.done).length;
    const longDate = new Date(`${session.date}T12:00:00`).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const rows = session.entries.map(e =>
      `<div><b>${esc(e.name)}</b><span>${esc(e.sets)} series · ${esc(e.weight || '—')} kg · Reps ${esc(e.reps || '—')} · RIR ${esc(e.rir || '—')}</span></div>`).join('');

    return `<article class="history-card"><div class="history-head"><div><b>${esc(longDate)}</b><small>${esc(session.day)} · ${esc(session.focus || '')}</small></div><strong>${formatKg(sessionVolume(session))} kg</strong></div><p>${withData.length} ejercicios con registros · ${completed} completados</p><details><summary>Ver ejercicios y resultados</summary><div class="history-entries">${rows}</div></details></article>`;
  }

  function renderHistory() {
    const sessions = AetherStore.listSessions();
    $('historyList').innerHTML = sessions.length
      ? sessions.map(historyCardMarkup).join('')
      : '<div class="empty-state">Todavía no hay sesiones guardadas. Registra peso, repeticiones o RIR durante un entrenamiento y aparecerá aquí.</div>';
  }

  // ======================================================================
  // Estadísticas
  // ======================================================================
  // Barras horizontales: etiqueta · barra proporcional · valor.
  function barChart(items, format = x => x) {
    if (!items.length) return '<div class="empty-state">Aún faltan datos para mostrar este gráfico.</div>';
    const max = Math.max(1, ...items.map(x => x.value));
    return `<div class="bar-chart">${items.map(x =>
      `<div class="bar-item"><small>${esc(x.label)}</small><div class="bar-track"><span style="width:${Math.max(3, x.value / max * 100)}%"></span></div><b>${esc(format(x.value))}</b></div>`).join('')}</div>`;
  }

  // Línea con puntos (SVG) para la evolución de la carga máxima.
  function lineChart(items) {
    if (items.length < 2) return '<div class="empty-state">Registra al menos dos valores para ver una evolución.</div>';

    const W = 320, H = 160, left = 14, right = 14, top = 26, bottom = 30;
    const values = items.map(x => x.value);
    const max = Math.max(...values), min = Math.min(...values), span = max - min || 1;
    const x = i => left + (W - left - right) * i / (items.length - 1);
    const y = value => top + (H - top - bottom) * (1 - (value - min) / span);
    const points = items.map((item, i) => [x(i), y(item.value)]);
    const line = points.map(([px, py]) => `${px.toFixed(1)},${py.toFixed(1)}`).join(' ');
    const area = `${left},${H - bottom} ${line} ${W - right},${H - bottom}`;

    // Se evita que las etiquetas de fecha se solapen cuando hay muchos puntos.
    const step = Math.ceil(items.length / 6);
    const showLabel = i => i === items.length - 1 || (i % step === 0 && items.length - 1 - i >= step);

    const dots = points.map(([px, py], i) => `<circle class="dot" cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="3.6"/>${
      items.length <= 8 || i === 0 || i === items.length - 1 || items[i].value === max
        ? `<text class="value" x="${px.toFixed(1)}" y="${(py - 9).toFixed(1)}">${esc(items[i].value)}</text>` : ''}`).join('');
    const labels = items.map((item, i) => showLabel(i) ? `<text x="${x(i).toFixed(1)}" y="${H - 10}">${esc(item.label)}</text>` : '').join('');

    return `<svg class="line-chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Evolución de la carga máxima"><line class="grid" x1="${left}" y1="${H - bottom}" x2="${W - right}" y2="${H - bottom}"/><polygon class="area" points="${area}"/><polyline class="path" points="${line}"/>${dots}${labels}</svg>`;
  }

  const lastN = (items, n) => items.slice(-n);
  const byWeek = (sessions, valueOf) => {
    const totals = {};
    sessions.forEach(s => { const key = isoWeekKey(s.date); totals[key] = (totals[key] || 0) + valueOf(s); });
    return lastN(Object.entries(totals), 8).map(([label, value]) => ({ label, value }));
  };

  function renderStats() {
    const sessions = AetherStore.listSessions();
    const chronological = sessions.slice().reverse(); // de más antigua a más reciente
    const entries = flattenEntries(chronological);

    $('statsSummary').innerHTML = [
      ['Sesiones', sessions.length],
      ['Volumen total', `${formatKg(sessions.reduce((sum, s) => sum + sessionVolume(s), 0))} kg`],
      ['Repeticiones', sessions.reduce((sum, s) => sum + sessionReps(s), 0)],
      ['Ejercicios registrados', entries.length]
    ].map(([label, value]) => `<div class="stat-tile"><small>${label}</small><b>${value}</b></div>`).join('');

    $('volumeChart').innerHTML = barChart(
      lastN(chronological, 8).map(s => ({ label: `${s.date.slice(5)} ${s.day.slice(0, 3)}`, value: sessionVolume(s) })), formatKg);
    $('weeklyVolumeChart').innerHTML = barChart(byWeek(chronological, sessionVolume), formatKg);

    // Selector de ejercicio para la evolución de cargas
    const select = $('exerciseStatFilter');
    const previous = select.value;
    const names = [...new Set(entries.map(e => e.name))].sort();
    select.innerHTML = '<option value="">Selecciona un ejercicio</option>' + names.map(n => `<option value="${esc(n)}">${esc(n)}</option>`).join('');
    if (names.includes(previous)) select.value = previous;
    const chosen = select.value || names[0];
    if (chosen && !select.value) select.value = chosen;

    const loads = entries
      .filter(e => e.name === chosen && parseWeights(e.weight).length)
      .slice(-12)
      .map(e => ({ label: e.date.slice(5), value: Math.max(...parseWeights(e.weight)) }));
    $('loadChart').innerHTML = lineChart(loads);

    $('repChart').innerHTML = '<h4>Repeticiones por sesión</h4>' +
      barChart(lastN(chronological, 8).map(s => ({ label: s.date.slice(5), value: sessionReps(s) })), v => v);
    $('frequencyChart').innerHTML = '<h4>Frecuencia semanal</h4>' +
      barChart(byWeek(chronological, () => 1), v => `${v} ses.`);
  }

  // ======================================================================
  // Navegación y arranque
  // ======================================================================
  function showView(view) {
    VIEWS.forEach(v => { $(`${v}View`).hidden = v !== view; });
    document.querySelectorAll('[data-view]').forEach(button => {
      const active = button.dataset.view === view;
      button.classList.toggle('active', active);
      if (active) button.setAttribute('aria-current', 'page'); else button.removeAttribute('aria-current');
    });
    if (view === 'history') renderHistory();
    if (view === 'stats') renderStats();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function init() {
    const today = WEEKDAYS[new Date().getDay()];
    const isTrainingDay = DAYS.includes(today);
    currentDay = isTrainingDay ? today : DAYS[0];

    $('todayLabel').textContent = new Intl.DateTimeFormat('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date()).toUpperCase();
    $('headline').textContent = isTrainingDay ? 'Hoy toca progresar.' : 'Tu próximo entrenamiento.';
    $('subhead').textContent = 'Entrena con intención. Registra cada paso.';

    renderDayPicker();
    renderSession();
    wireTimer();
    document.querySelectorAll('[data-view]').forEach(button => button.addEventListener('click', () => showView(button.dataset.view)));

    $('settingsBtn').addEventListener('click', () => $('settingsDialog').showModal());
    $('exportBtn').addEventListener('click', exportData);
    $('exportSettings').addEventListener('click', exportData);
    $('importInput').addEventListener('change', importData);
    $('refreshHistory').addEventListener('click', renderHistory);
    $('exerciseStatFilter').addEventListener('change', renderStats);

    if ('serviceWorker' in navigator && location.protocol !== 'file:') {
      navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' }).then(reg => reg.update()).catch(() => {});
    }
    if (window.AetherAnimations) window.AetherAnimations.prefetchRoutine().catch(() => {});
  }

  document.addEventListener('DOMContentLoaded', init);
})();
