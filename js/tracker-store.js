/* AetherOS · almacenamiento local.
 * Todo se guarda en localStorage con el prefijo "aetheros_v2_" (nunca se envía a ningún servidor).
 * ¡No cambies PREFIX ni la forma de las claves o perderás los registros ya guardados! */
(() => {
  'use strict';

  const PREFIX = 'aetheros_v2_';
  const MAX_RECORD_SIZE = 5_000_000;

  const read = (key, fallback = null) => {
    try {
      const raw = localStorage.getItem(PREFIX + key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch {
      return fallback;
    }
  };
  const write = (key, value) => localStorage.setItem(PREFIX + key, JSON.stringify(value));

  // Convierte un nombre en una clave segura ("Press de banca" → "press-de-banca").
  const slug = text => String(text || 'principal')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    .slice(0, 48) || 'principal';

  const todayKey = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  };

  // ---------- Registro por ejercicio ----------
  function getExercise(day, id, variantName = null) {
    const variantKey = slug(variantName || 'principal');
    let value = read(`exercise_${day}_${id}_${variantKey}`, null);

    // Compatibilidad con versiones antiguas, que guardaban un único registro por ejercicio.
    const generic = read(`exercise_${day}_${id}`, null);
    const hasNewVariant = localStorage.getItem(`${PREFIX}variant_${day}_${id}`) !== null;
    const oldVariant = hasNewVariant ? read(`variant_${day}_${id}`, null) : generic?.variant || null;
    if (!value && generic) {
      const owner = oldVariant?.name || generic.variant || null;
      const isMainExercise = variantKey === 'principal' && !owner && !hasNewVariant;
      if (isMainExercise || (variantName && owner === variantName)) value = generic;
    }

    if (!value) value = { weight: '', reps: '', rir: '', notes: '', variant: null, sets: {} };

    // Formato más antiguo: un objeto por serie → se convierte a listas separadas por comas.
    if (value.sets && Object.keys(value.sets).length && !value.reps) {
      const rows = Object.keys(value.sets).sort((a, b) => Number(a) - Number(b)).map(k => value.sets[k] || {});
      value.weight = rows.map(row => row.weight ?? '').join(',');
      value.reps = rows.map(row => row.reps ?? '').join(',');
      value.rir = rows.map(row => row.rir ?? '').join(',');
    }
    return value;
  }

  function saveExercise(day, id, value, variantName = null) {
    const variantKey = slug(variantName || 'principal');
    write(`exercise_${day}_${id}_${variantKey}`, { ...value, variant: variantName || null, updatedAt: new Date().toISOString() });
    saveSession(day);
  }

  // La marca de "hecho" guarda la fecha en que se marcó: al cambiar de día deja de contar
  // y los ejercicios vuelven a aparecer sin marcar (los pesos y repeticiones se conservan).
  const isDone = (day, id) => read(`done_${day}_${id}`, false) === todayKey();
  function setDone(day, id, value) {
    write(`done_${day}_${id}`, value ? todayKey() : false);
    saveSession(day);
  }

  const getVariant = (day, id) => read(`variant_${day}_${id}`, null);
  function setVariant(day, id, value) {
    write(`variant_${day}_${id}`, value);
    saveSession(day);
  }

  // ---------- Sesiones (una por día de la semana y fecha) ----------
  const hasData = entry => entry.weight !== '' || entry.reps !== '' || entry.rir !== '' || entry.done;

  function saveSession(day) {
    const routine = window.AETHER_ROUTINE?.[day];
    if (!routine) return;

    const date = todayKey();
    const key = `session_${date}_${slug(day)}`;
    const previous = read(key, null) || {};
    const entries = [];

    routine.exercises.forEach(ex => {
      const variant = getVariant(day, ex.id);
      const activeName = variant?.name || ex.name;
      const record = getExercise(day, ex.id, variant?.name || null);

      // Si hoy cambiaste de variante, se conserva lo que ya habías registrado con la anterior.
      (previous.entries || [])
        .filter(e => e.exerciseId === ex.id && e.name !== activeName && hasData(e))
        .forEach(e => entries.push(e));

      entries.push({
        exerciseId: ex.id,
        name: activeName,
        baseName: ex.name,
        variant: variant?.name || null,
        sets: variant?.sets || ex.sets,
        targetReps: variant?.reps || ex.reps,
        targetRir: ex.rir,
        weight: record.weight || '',
        reps: record.reps || '',
        rir: record.rir || '',
        done: isDone(day, ex.id)
      });
    });

    if (!entries.some(hasData) && !previous.startedAt) return;
    write(key, {
      date,
      day,
      focus: routine.focus,
      startedAt: previous.startedAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      entries
    });
  }

  function listSessions() {
    const sessions = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith(`${PREFIX}session_`)) continue;
      try {
        const value = JSON.parse(localStorage.getItem(key));
        if (value && value.date && value.entries) sessions.push(value);
      } catch { /* registro dañado: se ignora */ }
    }
    return sessions.sort((a, b) => `${b.date}${b.day}`.localeCompare(`${a.date}${a.day}`));
  }

  // ---------- Copia de seguridad ----------
  function exportAll() {
    const backup = { format: 'aetheros-backup-v2', exportedAt: new Date().toISOString(), data: {} };
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(PREFIX)) backup.data[key] = localStorage.getItem(key);
    }
    return backup;
  }

  function importAll(data) {
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      throw Error('El archivo no contiene un objeto de copia de seguridad.');
    }
    const source = data.data && typeof data.data === 'object' ? data.data
      : data.local && typeof data.local === 'object' ? data.local
      : data;

    // Primero se valida todo; solo si es correcto se escribe, para no dejar datos a medias.
    const staged = [];
    for (const [key, value] of Object.entries(source)) {
      if (!key.startsWith(PREFIX)) continue;
      if (typeof value !== 'string') throw Error(`Formato inválido en ${key}`);
      if (value.length > MAX_RECORD_SIZE) throw Error('El archivo contiene un registro demasiado grande.');
      try { JSON.parse(value); } catch { throw Error(`JSON interno no válido en ${key}`); }
      staged.push([key, value]);
    }
    if (!staged.length) throw Error('No se encontraron datos compatibles para importar.');
    staged.forEach(([key, value]) => localStorage.setItem(key, value));
    return staged.length;
  }

  window.AetherStore = { getExercise, saveExercise, isDone, setDone, getVariant, setVariant, saveSession, listSessions, exportAll, importAll };
})();
