/* AetherOS · animaciones de ejercicios.
 *
 * Los GIF pertenecen a Gym visual (© https://gymvisual.com/) y se cargan desde el
 * dataset público hasaneyldrm/exercises-dataset.
 *
 * Cada ejercicio (y cada alternativa) de la rutina tiene asignado el nombre EXACTO de su
 * animación en el dataset. Si en el futuro cambias o añades ejercicios en routine-data.js,
 * añade aquí una línea con el mismo nombre; sin ella se muestra un aviso en lugar del GIF.
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

  /* Ejercicio de la rutina → nombre de su animación en el dataset. */
  const CATALOG = {
    "Press de pecho en máquina": 'lever chest press',
    "Press de banca con barra": 'barbell bench press',
    "Press de banca con mancuernas": 'dumbbell bench press',
    "Press militar en máquina": 'lever military press',
    "Press militar con mancuernas": 'dumbbell seated shoulder press',
    "Aperturas en máquina Peck Deck": 'lever seated fly',
    "Aperturas en poleas": 'cable middle fly',
    "Aperturas con mancuernas": 'dumbbell fly',
    "Elevaciones laterales con mancuernas": 'dumbbell lateral raise',
    "Elevaciones laterales en polea": 'cable one arm lateral raise',
    "Elevaciones laterales en máquina": 'lever lateral raise',
    "Extensión unilateral de tríceps en polea alta": 'cable one arm tricep pushdown',
    "Press francés tumbado con mancuernas": 'dumbbell lying triceps extension',
    "Press francés con barra EZ": 'barbell lying triceps extension skull crusher',
    "Extensión de tríceps por encima de la cabeza con mancuerna": 'dumbbell seated triceps extension',
    "Jalón al pecho con agarre cerrado": 'cable lateral pulldown with v-bar',
    "Dominadas asistidas": 'assisted pull-up',
    "Dominadas con peso corporal": 'pull-up',
    "Remo unilateral en máquina": 'lever alternating narrow grip seated row',
    "Remo con mancuerna a una mano": 'dumbbell one arm bent-over row',
    "Remo unilateral en máquina con apoyo pectoral": 'lever alternating narrow grip seated row',
    "Remo sentado en polea baja": 'cable seated row',
    "Remo inclinado con barra": 'barbell bent over row',
    "Remo con mancuernas en banco inclinado": 'dumbbell incline row',
    "Aperturas inversas en máquina Peck Deck": 'lever seated reverse fly',
    "Aperturas posteriores con mancuernas en banco inclinado": 'dumbbell incline rear lateral raise',
    "Aperturas posteriores con mancuernas de pie e inclinado": 'dumbbell rear lateral raise',
    "Curl de bíceps con barra recta": 'barbell curl',
    "Curl alterno con mancuernas": 'dumbbell alternate biceps curl',
    "Curl de bíceps con barra EZ": 'ez barbell curl',
    "Curl de bíceps sentado con mancuernas": 'dumbbell seated curl',
    "Curl martillo cruzado": 'dumbbell cross body hammer curl',
    "Curl martillo sentado": 'dumbbell seated hammer curl',
    "Sentadilla Hack en máquina": 'sled hack squat',
    "Sentadilla Goblet con mancuerna": 'dumbbell goblet squat',
    "Sentadilla con barra": 'barbell full squat',
    "Curl femoral sentado": 'lever seated leg curl',
    "Curl femoral tumbado": 'lever lying leg curl',
    "Curl femoral de pie": 'standing single leg curl',
    "Curl femoral deslizante": 'low glute bridge on floor',
    "Prensa de piernas inclinada": 'sled 45° leg press',
    "Sentadilla búlgara con mancuernas": 'dumbbell single leg split squat',
    "Extensión de cuádriceps en máquina": 'lever leg extension',
    "Zancadas con mancuernas": 'dumbbell lunge',
    "Elevación de talones en máquina": 'lever seated calf raise',
    "Elevación de talones en prensa": 'sled calf press on leg press',
    "Elevación de talones de pie con mancuernas": 'dumbbell standing calf raise',
    "Crunch abdominal en máquina": 'lever seated crunch',
    "Crunch abdominal en el suelo": 'crunch floor',
    "Press de pecho inclinado en máquina": 'lever incline chest press',
    "Press inclinado con mancuernas": 'dumbbell incline bench press',
    "Press inclinado con barra": 'barbell incline bench press',
    "Jalón al pecho con agarre ancho": 'cable bar lateral pulldown',
    "Remo en máquina con apoyo pectoral": 'lever seated row',
    "Remo con dos mancuernas en banco inclinado": 'dumbbell incline row',
    "Fondos en paralelas asistidos": 'assisted triceps dip (kneeling)',
    "Press de banca con agarre cerrado": 'barbell close-grip bench press',
    "Flexiones": 'push-up',
    "Elevaciones laterales de pie": 'dumbbell lateral raise',
    "Elevaciones laterales sentado": 'dumbbell seated lateral raise',
    "Elevaciones laterales unilaterales con apoyo": 'dumbbell one arm lateral raise',
    "Extensión de tríceps por encima de la cabeza en polea": 'cable overhead triceps extension (rope attachment)',
    "Press francés con mancuernas": 'dumbbell lying triceps extension',
    "Hip Thrust en máquina": 'barbell glute bridge two legs on bench (male)',
    "Hip Thrust con barra": 'barbell glute bridge two legs on bench (male)',
    "Puente de glúteos con peso corporal": 'low glute bridge on floor',
    "Peso muerto rumano con barra": 'barbell romanian deadlift',
    "Peso muerto rumano con mancuernas": 'dumbbell romanian deadlift',
    "Extensión de cadera en polea baja": 'cable standing hip extension',
    "Patada de glúteo con mancuerna": 'cable standing hip extension',
    "Puente de glúteos unilateral": 'single leg bridge with outstretched leg',
    "Zancada hacia atrás con mancuernas": 'dumbbell rear lunge',
    "Curl bayesiano de bíceps en polea a una mano": 'cable one arm curl',
    "Curl inclinado con mancuernas": 'dumbbell incline biceps curl',
    "Curl sentado con mancuernas": 'dumbbell seated curl',
    "Curl de concentración con mancuerna": 'dumbbell concentration curl'
  };

  const ALLOWED = new Map(Object.entries(CATALOG).map(([name, datasetName]) => [norm(name), norm(datasetName)]));

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

  // Índice del dataset por nombre normalizado (se construye una sola vez).
  let indexed = { items: null, map: null };
  function indexOf(items) {
    if (indexed.items !== items) {
      const map = new Map();
      items.forEach(entry => { if (entry.gif_url && !map.has(norm(entry.name))) map.set(norm(entry.name), entry); });
      indexed = { items, map };
    }
    return indexed.map;
  }

  // ---- Animación de un ejercicio (o null si no está en el catálogo) ----
  function resolve(name) {
    const key = norm(name);
    if (resultCache.has(key)) return resultCache.get(key);
    const promise = getDataset().then(items => {
      if (!items.length) { resultCache.delete(key); return null; } // sin catálogo: se reintentará más tarde
      const wanted = ALLOWED.get(key);
      const item = wanted && indexOf(items).get(wanted);
      if (!item) return null;
      const url = new URL(String(item.gif_url).replace(/^\.\//, ''), RAW_BASE);
      url.searchParams.set('v', ASSET_VERSION);
      return { url: url.href, name: item.name, attribution: item.attribution || ATTRIBUTION };
    });
    resultCache.set(key, promise);
    return promise;
  }

  // ---- Rellena los marcadores .technique-placeholder con su GIF ----
  async function hydrate(root) {
    const nodes = [...(root || document).querySelectorAll('.technique-placeholder[data-animation-name]')];
    await Promise.all(nodes.map(async node => {
      if (node.dataset.hydrated === '1') return;
      node.dataset.hydrated = '1';
      const name = node.dataset.animationName;
      const match = await resolve(name);
      if (!node.isConnected) return;

      if (!match) {
        node.innerHTML = '<span class="play-symbol">ⓘ</span><span>Demostración técnica</span><small>Animación no disponible</small>';
        node.setAttribute('aria-label', 'No hay animación disponible para este ejercicio');
        return;
      }

      const img = document.createElement('img');
      img.className = 'exercise-animation';
      img.alt = `Animación de ${name}`;
      img.loading = 'lazy';
      img.decoding = 'async';
      img.src = match.url;
      img.addEventListener('error', () => {
        node.innerHTML = '<span class="play-symbol">ⓘ</span><span>Demostración técnica</span><small>Animación no disponible; conecta a internet</small>';
      }, { once: true });
      node.innerHTML = '';
      node.appendChild(img);
      node.setAttribute('aria-label', `Animación técnica: ${match.name}. ${match.attribution}`);
    }));
  }

  // ---- Descarga previa de todos los GIF de la rutina para usarlos sin conexión ----
  async function prefetchRoutine() {
    if (!navigator.onLine) return;
    const names = new Set();
    Object.values(window.AETHER_ROUTINE || {}).forEach(day => day.exercises.forEach(ex => {
      names.add(ex.name);
      ex.alternatives.forEach(alt => names.add(alt[0]));
    }));
    const matches = (await Promise.all([...names].map(resolve))).filter(Boolean);
    for (let i = 0; i < matches.length; i += 3) {
      await Promise.all(matches.slice(i, i + 3).map(item => fetchAndCache(item.url).catch(() => null)));
    }
  }

  window.AetherAnimations = { hydrate, prefetchRoutine };
})();
