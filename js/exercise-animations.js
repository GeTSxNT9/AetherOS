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
    'Press de banca con barra olímpica': ['barbell bench press', 'barbell bench press medium grip'],
    'Press de banca con mancuernas': ['dumbbell bench press'],
    'Press con mancuernas en banco con ligera inclinación': ['incline dumbbell bench press', 'dumbbell incline bench press', 'dumbbell incline press'],
    'Press de hombros sentado con mancuernas': ['dumbbell seated shoulder press', 'seated dumbbell shoulder press', 'seated dumbbell press'],
    'Press militar de pie con barra': ['barbell standing military press', 'standing barbell shoulder press', 'barbell shoulder press'],
    'Press Arnold con mancuernas': ['arnold dumbbell press', 'arnold press'],
    'Aperturas con mancuernas en banco plano': ['dumbbell fly', 'dumbbell flyes', 'flat bench dumbbell fly'],
    'Aperturas con mancuernas en banco inclinado': ['incline dumbbell fly', 'incline dumbbell flyes'],
    'Press con mancuernas en banco plano': ['dumbbell bench press'],
    'Elevaciones laterales': ['dumbbell lateral raise', 'lateral raise'],
    'Elevaciones laterales con mancuernas de pie': ['dumbbell lateral raise', 'standing dumbbell lateral raise'],
    'Elevaciones laterales sentado en banco': ['seated dumbbell lateral raise', 'seated lateral raise'],
    'Elevación lateral unilateral con apoyo en banco': ['one arm dumbbell lateral raise', 'single arm dumbbell lateral raise'],
    'Extensión de tríceps en polea': ['cable triceps pushdown', 'triceps pushdown', 'cable pushdown'],
    'Extensión de tríceps tumbado con mancuernas': ['dumbbell lying triceps extension', 'lying dumbbell triceps extension'],
    'Press francés con barra EZ': ['ez bar lying triceps extension', 'ez bar skullcrusher', 'ez bar skull crusher'],
    'Extensión por encima de la cabeza con mancuerna': ['dumbbell overhead triceps extension', 'standing dumbbell triceps extension'],
    'Extensión de tríceps por encima de la cabeza en polea': ['cable overhead triceps extension', 'triceps overhead extension with rope', 'cable rope overhead triceps extension'],
    'Extensión por encima de la cabeza con una mancuerna': ['dumbbell overhead triceps extension', 'standing dumbbell triceps extension'],
    'Extensión tumbado con mancuernas en banco': ['dumbbell lying triceps extension', 'lying dumbbell triceps extension'],
    'Dominadas asistidas': ['assisted pull up', 'assisted pull up', 'band assisted pull up'],
    'Dominadas con banda o estrictas': ['pull up', 'pull up', 'pullups'],
    'Dominadas con agarre diferente al martes': ['pull up', 'pull up', 'pullups'],
    'Remo con mancuerna a una mano apoyado en banco': ['dumbbell one arm row', 'one arm dumbbell row', 'single arm dumbbell row'],
    'Remo unilateral en máquina': ['lever one arm seated row seated row machine', 'lever one arm low row plate loaded', 'lever one arm bent over row plate loaded', 'one arm machine row'],
    'Remo con mancuerna a una mano con apoyo en banco': ['dumbbell one arm row', 'one arm dumbbell row', 'single arm dumbbell row'],
    'Remo unilateral con mancuerna y torso apoyado en banco inclinado': ['dumbbell incline row', 'incline dumbbell row'],
    'Remo sentado en polea': ['seated cable row', 'seated cable rows'],
    'Remo con barra olímpica inclinado': ['barbell bent over row', 'bent over barbell row'],
    'Remo con barra inclinado': ['barbell bent over row', 'bent over barbell row'],
    'Remo unilateral con mancuerna apoyado en banco': ['dumbbell one arm row', 'one arm dumbbell row', 'single arm dumbbell row'],
    'Remo con dos mancuernas con pecho apoyado en banco inclinado': ['dumbbell incline row', 'incline dumbbell row', 'chest supported dumbbell row'],
    'Remo con mancuernas sentado, torso inclinado y espalda estable': ['bent over two dumbbell row', 'bent over dumbbell row'],
    'Pájaros con mancuernas y pecho apoyado en banco inclinado': ['dumbbell incline reverse fly', 'incline dumbbell reverse fly', 'bent over reverse dumbbell fly'],
    'Pájaros con mancuernas inclinado de pie': ['dumbbell reverse fly', 'reverse dumbbell fly', 'bent over reverse dumbbell fly'],
    'Curl de bíceps con barra': ['barbell curl', 'barbell biceps curl', 'standing barbell curl'],
    'Curl alterno con mancuernas': ['alternating dumbbell biceps curl', 'dumbbell biceps curl', 'alternate dumbbell curl'],
    'Curl con barra EZ': ['ez bar curl', 'ez bar biceps curl', 'ez barbell curl'],
    'Curl sentado con mancuernas y espalda apoyada': ['seated dumbbell biceps curl', 'seated dumbbell curl'],
    'Curl martillo': ['dumbbell hammer curl', 'hammer curl'],
    'Curl martillo alterno con mancuernas': ['alternating dumbbell hammer curl', 'dumbbell hammer curl', 'hammer curl'],
    'Curl martillo sentado': ['seated dumbbell hammer curl', 'seated hammer curl'],
    'Curl martillo cruzado hacia el hombro contrario': ['cross body dumbbell hammer curl', 'cross body hammer curl'],
    'Sentadilla con barra en rack y seguros ajustados': ['barbell squat', 'barbell full squat', 'barbell back squat'],
    'Sentadilla goblet con mancuerna': ['dumbbell goblet squat', 'goblet squat'],
    'Sentadilla con dos mancuernas a los lados': ['dumbbell squat'],
    'Curl femoral sentado': ['lever seated leg curl', 'seated leg curl', 'seated machine leg curl'],
    'Curl femoral sentado en máquina': ['lever seated leg curl', 'seated leg curl', 'seated machine leg curl'],
    'Curl femoral tumbado en máquina': ['lever lying leg curl', 'lying leg curl', 'lying leg curls'],
    'Curl femoral deslizante con talones': ['sliding leg curl', 'lying leg curl on floor sliders'],
    'Curl femoral con fitball': ['stability ball leg curl', 'exercise ball leg curl', 'swiss ball leg curl'],
    'Prensa de piernas': ['sled 45 leg press', 'lever leg press', 'leg press'],
    'Sentadilla con dos mancuernas': ['dumbbell squat'],
    'Sentadilla búlgara con mancuernas y apoyo en banco': ['dumbbell bulgarian split squat', 'bulgarian split squat', 'split squat with dumbbells'],
    'Extensión de cuádriceps': ['lever leg extension', 'leg extension', 'leg extensions'],
    'Sentadilla española con banda/correa anclada': ['spanish squat', 'band spanish squat'],
    'Zancadas hacia delante o atrás con mancuernas': ['dumbbell lunge', 'dumbbell lunges', 'walking lunges'],
    'Step-up a banco/plataforma estable': ['dumbbell step up', 'step up', 'dumbbell step up'],
    'Gemelos en máquina': ['lever seated calf raise', 'standing calf raise machine', 'calf raise machine', 'seated calf raise'],
    'Elevación de talones de pie con mancuernas': ['standing dumbbell calf raise', 'dumbbell standing calf raise'],
    'Elevación de talones con barra en rack y seguridad': ['standing barbell calf raise', 'barbell standing calf raise'],
    'Elevación unilateral con apoyo estable': ['single leg calf raise', 'one leg calf raise', 'single leg standing calf raise'],
    'Crunch en el suelo': ['crunch', 'crunches'],
    'Crunch con disco ligero sobre el pecho': ['weighted crunch', 'weighted crunches'],
    'Elevación de rodillas tumbado': ['lying leg raise', 'lying knee raise', 'flat bench lying leg raise'],
    'Press inclinado de pecho en máquina': ['lever incline chest press', 'incline chest press machine', 'lever incline chest press plate loaded'],
    'Press inclinado con mancuernas en banco ajustable': ['incline dumbbell press', 'incline dumbbell bench press', 'dumbbell incline bench press'],
    'Press inclinado con barra olímpica en banco ajustable y rack seguro': ['barbell incline bench press', 'incline barbell bench press'],
    'Press plano con mancuernas si el banco inclinado está ocupado': ['dumbbell bench press'],
    'Remo con mancuerna a una mano': ['dumbbell one arm row', 'one arm dumbbell row', 'single arm dumbbell row'],
    'Fondos asistidos': ['assisted triceps dip', 'assisted dip', 'dip chin assist'],
    'Press de banca con agarre cerrado': ['close grip bench press', 'close grip barbell bench press'],
    'Flexiones con manos a anchura cómoda': ['push up', 'pushups', 'push up'],
    'Elevaciones laterales sentado': ['seated dumbbell lateral raise', 'seated lateral raise'],
    'Hip thrust': ['barbell hip thrust', 'hip thrust', 'smith machine hip thrust'],
    'Hip thrust con barra y banco estable': ['barbell hip thrust'],
    'Puente de glúteos con mancuerna sobre la pelvis': ['dumbbell glute bridge', 'weighted glute bridge'],
    'Puente de glúteos con peso corporal y pausas arriba': ['glute bridge', 'bodyweight glute bridge'],
    'Peso muerto rumano': ['barbell romanian deadlift', 'romanian deadlift'],
    'Peso muerto rumano con mancuernas': ['dumbbell romanian deadlift', 'romanian deadlift dumbbell'],
    'Peso muerto rumano con barra olímpica': ['barbell romanian deadlift', 'romanian deadlift'],
    'Buenos días con barra ligera (solo con experiencia técnica)': ['barbell good morning', 'good morning'],
    'Curl femoral tumbado': ['lever lying leg curl', 'lying leg curl', 'lying leg curls'],
    'Patada de glúteo con mancuerna ligera detrás de la rodilla en banco': ['dumbbell glute kickback', 'quadruped dumbbell kickback'],
    'Puente de glúteos unilateral': ['single leg glute bridge', 'single leg hip thrust'],
    'Zancada hacia atrás con mancuernas': ['dumbbell reverse lunge', 'reverse dumbbell lunge', 'dumbbell lunge'],
    'Curl alterno con mancuernas, brazo ligeramente detrás del torso': ['incline dumbbell curl', 'alternate incline dumbbell curl'],
    'Curl sentado con mancuernas y respaldo vertical': ['seated dumbbell biceps curl', 'seated dumbbell curl'],
    'Curl de concentración con mancuerna': ['concentration curl', 'dumbbell concentration curl'],
    'Elevación con barra en rack seguro': ['standing barbell calf raise', 'barbell standing calf raise'],
    'Press de pecho sentado en máquina': ['lever stack seated chest press male', 'lever chest press plate loaded', 'lever chest press version 2', 'lever chest press'],
    'Press militar en máquina': ['lever military press plate loaded', 'lever shoulder press plate loaded version 3', 'lever shoulder press', 'lever shoulder press plate loaded'],
    'Jalón al pecho en polea': ['cable lat pulldown', 'lat pulldown', 'wide grip lat pulldown', 'cable pulldown'],
    'Jalón al pecho con agarre estrecho': ['cable close grip front lat pulldown', 'cable close grip front lat pulldown female', 'lat pulldown close grip'],
    'Sentadilla hack en máquina': ['sled hack squat', 'hack squat', 'lever hack squat'],
    'Abdominales en máquina (crunch)': ['lever crunch', 'ab crunch machine', 'machine crunch', 'lever seated crunch'],
    'Remo con pecho apoyado en banco inclinado': ['dumbbell incline row', 'chest supported row', 'incline bench dumbbell row', 'lever chest supported row'],
    'Patada de glúteo en polea': ['cable glute kickback', 'cable hip extension', 'standing cable glute kickback'],
    'Aperturas de pecho en máquina (pec deck)': ['lever pec deck fly', 'pec deck fly', 'lever pec deck fly machine'],
    'Aperturas de pecho en poleas (crossover)': ['cable crossover variation', 'cable crossover', 'cable chest fly', 'cable standing fly'],
    'Aperturas inversas en máquina (deltoides posterior)': ['lever reverse pec deck fly', 'reverse pec deck fly', 'lever reverse fly'],
    'Curl de bíceps con mancuernas en banco inclinado': ['dumbbell incline biceps curl', 'dumbbell incline curl', 'dumbbell incline alternate bicep curl'],
    'Curl de bíceps en polea con brazo detrás del torso (bayesiano)': ['single arm bayesian curl', 'bayesian cable curl', 'standing one arm cable curl behind body']
  };

  const ALLOWED = new Map(Object.entries(CATALOG).map(([name, candidates]) => [norm(name), candidates.map(norm)]));

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
    }
    return datasetPromise;
  }

  // ---- Búsqueda exacta de la animación de un ejercicio ----
  function resolve(name) {
    const key = norm(name);
    if (resultCache.has(key)) return resultCache.get(key);
    const promise = getDataset().then(items => {
      const candidates = ALLOWED.get(key);
      if (!items.length || !candidates) return null;
      const item = candidates
        .map(candidate => items.find(entry => norm(entry.name) === candidate && entry.gif_url))
        .find(Boolean);
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
        node.innerHTML = '<span class="play-symbol">ⓘ</span><span>Demostración técnica</span><small>Sin coincidencia exacta verificada</small>';
        node.setAttribute('aria-label', 'No hay una animación inequívoca verificada para este ejercicio');
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
    if (!navigator.onLine || !window.AETHER_ROUTINE) return;
    const names = new Set();
    Object.values(window.AETHER_ROUTINE).forEach(day => day.exercises.forEach(ex => {
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
