/* AetherOS · animaciones de ejercicios (catálogo verificado por nombre).
 *
 * Los GIF pertenecen a Gym visual (© https://gymvisual.com/) y se cargan desde el
 * dataset público hasaneyldrm/exercises-dataset.
 *
 * Regla de oro: NUNCA se usa coincidencia difusa. Cada ejercicio de la rutina (y cada
 * variante) tiene una lista de nombres EXACTOS del dataset; si ninguno existe, se
 * muestra un aviso en lugar de una animación que podría ser de otro movimiento.
 */
(() => {
  'use strict';

  const DATA_URL = 'https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/data/exercises.json?v=aetheros-1';
  const RAW_BASE = 'https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/';
  const MEDIA_CACHE = 'aetheros-gymvisual-v1'; // debe coincidir con sw.js
  const ASSET_VERSION = 'aetheros-1';
  const ATTRIBUTION = '© Gym visual — https://gymvisual.com/';

  let datasetPromise;
  const resultCache = new Map();

  // Normaliza para comparar: sin tildes, minúsculas y sin signos.
  const norm = value => String(value || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

  /* Nombre del ejercicio en la rutina → nombres exactos admitidos en el dataset,
   * por orden de prioridad (gana el primero que exista).
   * Para añadir un ejercicio nuevo basta con una línea más aquí. */
  const CATALOG = {
    "Press de pecho en máquina": ['lever chest press', 'lever stack seated chest press male', 'lever chest press plate loaded', 'lever chest press version 2'],
    "Press de banca con barra": ['barbell bench press', 'barbell bench press medium grip'],
    "Press de banca con mancuernas": ['dumbbell bench press'],
    "Press militar en máquina": ['lever shoulder press v. 2', 'lever military press', 'lever shoulder press v. 3', 'lever shoulder press'],
    "Press militar con mancuernas": ['dumbbell seated shoulder press', 'dumbbell seated shoulder press (parallel grip)'],
    "Aperturas en máquina Peck Deck": ['lever pec deck fly', 'pec deck fly', 'lever pec deck fly machine', 'lever seated fly'],
    "Aperturas en poleas": ['cable cross-over variation', 'cable standing fly', 'cable standing up straight crossovers', 'cable middle fly'],
    "Aperturas con mancuernas": ['dumbbell fly', 'dumbbell flyes', 'flat bench dumbbell fly'],
    "Elevaciones laterales con mancuernas": ['dumbbell lateral raise', 'lateral raise'],
    "Elevaciones laterales en polea": ['cable lateral raise', 'cable one arm lateral raise'],
    "Elevaciones laterales en máquina": ['lever lateral raise', 'lever seated lateral raise'],
    "Press francés tumbado con mancuernas": ['dumbbell lying triceps extension', 'lying dumbbell triceps extension'],
    "Press francés con mancuernas": ['dumbbell lying triceps extension', 'lying dumbbell triceps extension'],
    "Press francés con barra EZ": ['barbell lying triceps extension skull crusher', 'barbell lying triceps extension', 'ez barbell decline triceps extension', 'ez barbell incline triceps extension', 'ez bar standing french press'],
    "Extensión de tríceps por encima de la cabeza con mancuerna": ['dumbbell standing triceps extension', 'dumbbell seated triceps extension', 'dumbbells seated triceps extension'],
    "Extensión de tríceps por encima de la cabeza en polea": ['cable overhead triceps extension rope attachment', 'cable standing overhead triceps extension', 'cable seated overhead triceps extension', 'cable overhead triceps extension', 'triceps overhead extension with rope', 'cable rope overhead triceps extension'],
    "Jalón al pecho con agarre ancho": ['cable bar lateral pulldown', 'cable pulldown (pro lat bar)', 'cable pulldown', 'lever front pulldown'],
    "Dominadas con peso corporal": ['pull up', 'pullups'],
    "Remo unilateral en máquina": ['lever alternating narrow grip seated row', 'lever seated row', 'lever narrow grip seated row', 'lever one arm bent over row'],
    "Remo unilateral en máquina con apoyo pectoral": ['lever seated row', 'lever narrow grip seated row', 'lever alternating narrow grip seated row', 'lever bent over row'],
    "Remo con mancuerna a una mano": ['dumbbell one arm row', 'one arm dumbbell row', 'single arm dumbbell row', 'dumbbell one arm bent over row'],
    "Remo sentado en polea baja": ['seated cable row', 'seated cable rows', 'cable seated row'],
    "Remo inclinado con barra": ['barbell bent over row', 'bent over barbell row'],
    "Remo con mancuernas en banco inclinado": ['dumbbell incline row', 'incline dumbbell row', 'chest supported dumbbell row', 'incline bench dumbbell row'],
    "Remo con dos mancuernas en banco inclinado": ['dumbbell incline row', 'incline dumbbell row', 'chest supported dumbbell row', 'incline bench dumbbell row'],
    "Remo en máquina con apoyo pectoral": ['lever seated row', 'lever narrow grip seated row', 'lever bent over row', 'lever t bar row'],
    "Aperturas inversas en máquina Peck Deck": ['lever reverse pec deck fly', 'reverse pec deck fly', 'lever reverse fly', 'lever seated reverse fly'],
    "Aperturas posteriores con mancuernas en banco inclinado": ['dumbbell incline reverse fly', 'incline dumbbell reverse fly', 'dumbbell incline rear lateral raise', 'dumbbell incline rear delt fly', 'dumbbell lying rear delt raise'],
    "Aperturas posteriores con mancuernas de pie e inclinado": ['dumbbell rear lateral raise', 'dumbbell rear fly', 'dumbbell reverse fly', 'dumbbell rear delt raise'],
    "Curl de bíceps con barra recta": ['barbell curl', 'barbell biceps curl', 'standing barbell curl'],
    "Curl alterno con mancuernas": ['dumbbell alternate biceps curl', 'dumbbell biceps curl'],
    "Curl de bíceps con barra EZ": ['ez bar curl', 'ez bar biceps curl', 'ez barbell curl'],
    "Curl de bíceps sentado con mancuernas": ['seated dumbbell biceps curl', 'seated dumbbell curl', 'dumbbell seated biceps curl', 'dumbbell seated curl', 'dumbbell seated alternate curl'],
    "Curl sentado con mancuernas": ['seated dumbbell biceps curl', 'seated dumbbell curl', 'dumbbell seated biceps curl', 'dumbbell seated curl', 'dumbbell seated alternate curl'],
    "Curl martillo cruzado": ['dumbbell cross body hammer curl', 'cross body dumbbell hammer curl', 'cross body hammer curl'],
    "Curl martillo sentado": ['seated dumbbell hammer curl', 'seated hammer curl', 'dumbbell seated hammer curl', 'dumbbell alternate seated hammer curl', 'dumbbell seated alternate hammer curl'],
    "Sentadilla Hack en máquina": ['sled hack squat', 'hack squat', 'lever hack squat'],
    "Sentadilla Goblet con mancuerna": ['dumbbell goblet squat', 'goblet squat'],
    "Sentadilla con barra": ['barbell squat', 'barbell full squat', 'barbell back squat'],
    "Curl femoral sentado": ['lever seated leg curl', 'seated leg curl', 'seated machine leg curl'],
    "Curl femoral tumbado": ['lever lying leg curl', 'lying leg curl', 'lying leg curls'],
    "Curl femoral de pie": ['standing single leg curl'],
    "Curl femoral deslizante": ['low glute bridge on floor', 'glute bridge march'],
    "Prensa de piernas inclinada": ['sled 45 leg press', 'lever leg press', 'leg press'],
    "Sentadilla búlgara con mancuernas": ['dumbbell bulgarian split squat', 'bulgarian split squat', 'split squat with dumbbells', 'dumbbell single leg split squat', 'dumbbell split squat', 'single leg split squat'],
    "Extensión de cuádriceps en máquina": ['lever leg extension', 'leg extension', 'leg extensions'],
    "Zancadas con mancuernas": ['dumbbell lunge', 'dumbbell lunges', 'walking lunges'],
    "Elevación de talones en máquina": ['lever seated calf raise', 'standing calf raise machine', 'calf raise machine', 'seated calf raise', 'lever standing calf raise'],
    "Elevación de talones en prensa": ['sled calf press on leg press', 'sled 45 calf press', 'calf press on the leg press machine', 'calf press'],
    "Elevación de talones de pie con mancuernas": ['standing dumbbell calf raise', 'dumbbell standing calf raise'],
    "Press de pecho inclinado en máquina": ['lever incline chest press', 'incline chest press machine', 'lever incline chest press plate loaded'],
    "Press inclinado con mancuernas": ['incline dumbbell press', 'incline dumbbell bench press', 'dumbbell incline bench press', 'dumbbell incline press'],
    "Press inclinado con barra": ['barbell incline bench press', 'incline barbell bench press'],
    "Fondos en paralelas asistidos": ['assisted triceps dip (kneeling)', 'assisted chest dip (kneeling)', 'lever seated dip'],
    "Press de banca con agarre cerrado": ['barbell close grip bench press', 'barbell close-grip bench press', 'close grip bench press', 'close grip barbell bench press'],
    "Flexiones": ['push up', 'pushups'],
    "Elevaciones laterales de pie": ['standing dumbbell lateral raise', 'dumbbell lateral raise'],
    "Elevaciones laterales sentado": ['seated dumbbell lateral raise', 'seated lateral raise', 'dumbbell seated lateral raise'],
    "Elevaciones laterales unilaterales con apoyo": ['one arm dumbbell lateral raise', 'single arm dumbbell lateral raise', 'dumbbell one arm lateral raise', 'dumbbell single arm lateral raise', 'cable one arm lateral raise'],
    "Hip Thrust en máquina": ['barbell glute bridge', 'barbell glute bridge two legs on bench (male)', 'glute bridge two legs on bench (male)'],
    "Hip Thrust con barra": ['barbell glute bridge', 'barbell glute bridge two legs on bench (male)', 'glute bridge two legs on bench (male)'],
    "Puente de glúteos con peso corporal": ['glute bridge', 'bodyweight glute bridge', 'bridge', 'low glute bridge on floor'],
    "Peso muerto rumano con barra": ['barbell romanian deadlift', 'romanian deadlift'],
    "Peso muerto rumano con mancuernas": ['dumbbell romanian deadlift', 'romanian deadlift dumbbell'],
    "Extensión de cadera en polea baja": ['cable standing hip extension'],
    "Patada de glúteo con mancuerna": ['cable standing hip extension'],
    "Puente de glúteos unilateral": ['single leg bridge with outstretched leg', 'single leg glute bridge', 'single leg hip thrust', 'single leg bridge'],
    "Zancada hacia atrás con mancuernas": ['dumbbell reverse lunge', 'reverse dumbbell lunge', 'dumbbell rear lunge'],
    "Curl bayesiano de bíceps en polea a una mano": ['cable one arm curl', 'cable curl', 'cable concentration curl'],
    "Curl inclinado con mancuernas": ['dumbbell incline biceps curl', 'dumbbell incline curl', 'dumbbell incline alternate bicep curl', 'incline dumbbell curl'],
    "Curl de concentración con mancuerna": ['concentration curl', 'dumbbell concentration curl'],
    "Jalón al pecho con agarre cerrado": ['cable lateral pulldown with v-bar', 'twin handle parallel grip lat pulldown', 'cable underhand pulldown', 'reverse grip machine lat pulldown'],
    "Dominadas asistidas": ['assisted pull up', 'band assisted pull up'],
    "Crunch abdominal en máquina": ['lever crunch', 'ab crunch machine', 'machine crunch', 'lever seated crunch'],
    "Crunch abdominal en el suelo": ['crunch floor', 'crunch', 'crunches'],
    "Extensión unilateral de tríceps en polea alta": ['cable one arm tricep pushdown', 'cable one arm triceps pushdown', 'cable standing one arm triceps pushdown', 'cable pushdown one arm', 'cable triceps pushdown', 'triceps pushdown', 'cable pushdown']
  };

  // Clave sin orden: "seated dumbbell curl" y "dumbbell seated curl" son el mismo ejercicio.
  const tokenKey = value => norm(value).split(' ').filter(Boolean).sort().join(' ');

  const ALLOWED = new Map(Object.entries(CATALOG).map(([name, candidates]) => [norm(name), candidates]));

  // ---- Descarga con caché local (funciona sin conexión tras la primera carga) ----
  async function fetchAndCache(url) {
    const cache = 'caches' in window ? await caches.open(MEDIA_CACHE).catch(() => null) : null;
    if (cache) {
      const saved = await cache.match(url);
      if (saved) return saved;
    }
    const response = await fetch(url, { mode: 'cors', cache: 'force-cache' });
    if (!response.ok) throw new Error(`No se pudo cargar el recurso (${response.status})`);
    if (cache) await cache.put(url, response.clone()).catch(() => {});
    return response;
  }

  function getDataset() {
    if (!datasetPromise) {
      datasetPromise = fetchAndCache(DATA_URL)
        .then(response => response.json())
        .then(data => (Array.isArray(data) ? data : []))
        .catch(() => []);
      datasetPromise.then(items => { if (!items.length) datasetPromise = undefined; }); // permite reintentar
    }
    return datasetPromise;
  }

  // Índice del dataset por clave sin orden (se construye una sola vez).
  let indexed = { items: null, map: null };
  function indexOf(items) {
    if (indexed.items !== items) {
      const map = new Map();
      items.forEach(entry => { if (entry.gif_url && !map.has(tokenKey(entry.name))) map.set(tokenKey(entry.name), entry); });
      indexed = { items, map };
    }
    return indexed.map;
  }

  // Animación elegida por el usuario para cada ejercicio (se guarda con el prefijo de tracker-store.js,
  // así también entra en las copias de seguridad).
  const prefKey = name => `aetheros_v2_anim_${norm(name).replace(/ /g, '-')}`;
  const readPref = name => {
    try { return Number(JSON.parse(localStorage.getItem(prefKey(name)))) || 0; } catch { return 0; }
  };
  const savePref = (name, index) => {
    try { localStorage.setItem(prefKey(name), JSON.stringify(index)); } catch { /* sin almacenamiento */ }
  };

  // ---- Búsqueda exacta: todas las animaciones disponibles de un ejercicio (la primera es la principal) ----
  function resolveAll(name) {
    const key = norm(name);
    if (resultCache.has(key)) return resultCache.get(key);
    const promise = getDataset().then(items => {
      if (!items.length) { resultCache.delete(key); return []; } // sin catálogo: no se da por "sin coincidencia"
      const index = indexOf(items);
      const seen = new Set();
      return (ALLOWED.get(key) || [])
        .map(candidate => index.get(tokenKey(candidate)))
        .filter(item => item && !seen.has(item.gif_url) && seen.add(item.gif_url))
        .map(item => {
          const url = new URL(String(item.gif_url).replace(/^\.\//, ''), RAW_BASE);
          url.searchParams.set('v', ASSET_VERSION);
          return { url: url.href, name: item.name, attribution: item.attribution || ATTRIBUTION };
        });
    });
    resultCache.set(key, promise);
    return promise;
  }

  // La animación que se muestra: la elegida por el usuario o, si no, la principal.
  const resolve = name => resolveAll(name).then(list => list[Math.min(readPref(name), list.length - 1)] || null);

  // ---- Rellena los marcadores .technique-placeholder con su GIF ----
  async function hydrate(root) {
    const nodes = [...(root || document).querySelectorAll('.technique-placeholder[data-animation-name]')];
    await Promise.all(nodes.map(async node => {
      if (node.dataset.hydrated === '1') return;
      node.dataset.hydrated = '1';
      const name = node.dataset.animationName;
      const matches = await resolveAll(name);
      if (!node.isConnected) return;

      if (!matches.length) {
        node.innerHTML = '<span class="play-symbol">ⓘ</span><span>Demostración técnica</span><small>Sin coincidencia exacta verificada</small>';
        node.setAttribute('aria-label', 'No hay una animación inequívoca verificada para este ejercicio');
        return;
      }

      let current = Math.min(readPref(name), matches.length - 1);
      const img = document.createElement('img');
      img.className = 'exercise-animation';
      img.alt = `Animación de ${name}`;
      img.loading = 'lazy';
      img.decoding = 'async';
      node.innerHTML = '';
      node.appendChild(img);

      const button = matches.length > 1 ? document.createElement('button') : null;
      const show = () => {
        const match = matches[current];
        img.src = match.url;
        node.setAttribute('aria-label', `Animación técnica: ${match.name}. ${match.attribution}`);
        if (button) button.textContent = `↻ ${current + 1}/${matches.length}`;
      };
      img.addEventListener('error', () => {
        node.innerHTML = '<span class="play-symbol">ⓘ</span><span>Demostración técnica</span><small>Animación no disponible; conecta a internet</small>';
      }, { once: true });

      if (button) { // varias animaciones posibles: un toque pasa a la siguiente y se recuerda
        button.type = 'button';
        button.className = 'anim-cycle';
        button.setAttribute('aria-label', 'Cambiar a otra animación de este ejercicio');
        button.addEventListener('click', () => {
          current = (current + 1) % matches.length;
          savePref(name, current);
          show();
        });
        node.appendChild(button);
      }
      show();
    }));
  }

  // Todos los nombres de la rutina: ejercicios principales y alternativas.
  function routineNames() {
    const names = new Set();
    Object.values(window.AETHER_ROUTINE || {}).forEach(day => day.exercises.forEach(ex => {
      names.add(ex.name);
      ex.alternatives.forEach(alt => names.add(alt[0]));
    }));
    return names;
  }

  // ---- Descarga previa de todos los GIF de la rutina para usarlos sin conexión ----
  async function prefetchRoutine() {
    if (!navigator.onLine) return;
    const matches = (await Promise.all([...routineNames()].map(resolve))).filter(Boolean);
    for (let i = 0; i < matches.length; i += 3) {
      await Promise.all(matches.slice(i, i + 3).map(item => fetchAndCache(item.url).catch(() => null)));
    }
  }

  // Nombres del dataset parecidos a los candidatos de un ejercicio (solo para la revisión).
  function suggestions(name, items) {
    const stop = new Set(['with', 'on', 'the', 'a', 'of', 'version']);
    const tokens = text => new Set(norm(text).split(' ').filter(t => t && !stop.has(t)));
    const wanted = (ALLOWED.get(norm(name)) || [name]).map(tokens);
    const scored = items.filter(entry => entry.gif_url).map(entry => {
      const have = tokens(entry.name);
      const score = Math.max(...wanted.map(set => [...set].filter(t => have.has(t)).length / new Set([...set, ...have]).size));
      return { name: entry.name, score };
    }).filter(x => x.score >= 0.5).sort((a, b) => b.score - a.score);
    return scored.slice(0, 3).map(x => x.name);
  }

  // Informe "ejercicio => animación que se está mostrando" (una línea por ejercicio y alternativa).
  async function chosenReport() {
    const lines = await Promise.all([...routineNames()].map(async name => {
      const list = await resolveAll(name);
      const shown = list[Math.min(readPref(name), list.length - 1)];
      return `${name} => ${shown ? shown.name : '(sin animación)'}${list.length > 1 ? `  [opción ${Math.min(readPref(name), list.length - 1) + 1} de ${list.length}]` : ''}`;
    }));
    return lines.join('\n');
  }

  // ---- Revisión: qué nombres de la rutina no tienen animación en el dataset ----
  async function audit() {
    const items = await getDataset();
    const names = [...routineNames()];
    const found = await Promise.all(names.map(resolve));
    const missing = names.filter((_, i) => !found[i]).map(name => ({ name, similar: items.length ? suggestions(name, items) : [] }));
    return { datasetOk: items.length > 0, total: names.length, missing };
  }

  window.AetherAnimations = { hydrate, prefetchRoutine, audit, chosenReport };
})();
