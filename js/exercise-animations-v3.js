/* Alpha Track · catálogo de animaciones verificadas por nombre y material.
 * Los GIF pertenecen a Gym visual; conservar atribución y resolución original 180×180.
 * Importante: nunca se usa coincidencia difusa. Si el dataset no contiene un nombre
 * inequívoco para el movimiento, se muestra un aviso en vez de una animación incorrecta.
 */
(() => {
  'use strict';
  const DATA_URL = 'https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/data/exercises.json?v=20261014-3';
  const RAW_BASE = 'https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/';
  const MEDIA_CACHE = 'alpha-track-gymvisual-v3';
  const ASSET_VERSION = '20261014-3';
  const ATTRIBUTION = '© Gym visual — https://gymvisual.com/';
  let datasetPromise;
  const resultCache = new Map();
  const norm = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

  // Nombre de la rutina (español) → nombres exactos permitidos en el dataset.
  // Los candidatos se comprueban por igualdad normalizada, no por parecido semántico.
  const MAP = {
    'press de pecho en maquina':['lever chest press','machine chest press','leverage chest press'],
    'press de banca con barra olimpica':['barbell bench press','barbell bench press medium grip'],
    'press de banca con mancuernas':['dumbbell bench press'],
    'press con mancuernas en banco con ligera inclinacion':['incline dumbbell bench press','dumbbell incline bench press','dumbbell incline press'],
    'press de hombros en maquina':['lever shoulder press','machine shoulder press','shoulder press machine'],
    'press de hombros sentado con mancuernas':['dumbbell seated shoulder press','seated dumbbell shoulder press','seated dumbbell press'],
    'press militar de pie con barra':['barbell standing military press','standing barbell shoulder press','barbell shoulder press'],
    'press arnold con mancuernas':['arnold dumbbell press','arnold press'],
    'pec deck o aperturas en polea':['lever pec deck fly','pec deck fly','cable crossover','cable chest fly'],
    'aperturas con mancuernas en banco plano':['dumbbell fly','dumbbell flyes','flat bench dumbbell fly'],
    'aperturas con mancuernas en banco inclinado':['incline dumbbell fly','incline dumbbell flyes'],
    'press con mancuernas en banco plano':['dumbbell bench press'],
    'elevaciones laterales':['dumbbell lateral raise','lateral raise'],
    'elevaciones laterales con mancuernas de pie':['dumbbell lateral raise','standing dumbbell lateral raise'],
    'elevaciones laterales sentado en banco':['seated dumbbell lateral raise','seated lateral raise'],
    'elevacion lateral unilateral con apoyo en banco':['one arm dumbbell lateral raise','single arm dumbbell lateral raise'],
    'extension de triceps en polea':['cable triceps pushdown','triceps pushdown','cable pushdown'],
    'extension de triceps tumbado con mancuernas':['dumbbell lying triceps extension','lying dumbbell triceps extension'],
    'press frances con barra ez':['ez bar lying triceps extension','ez bar skullcrusher','ez bar skull crusher'],
    'extension por encima de la cabeza con mancuerna':['dumbbell overhead triceps extension','standing dumbbell triceps extension'],
    'extension de triceps por encima de la cabeza en polea':['cable overhead triceps extension','triceps overhead extension with rope','cable rope overhead triceps extension'],
    'extension por encima de la cabeza con una mancuerna':['dumbbell overhead triceps extension','standing dumbbell triceps extension'],
    'extension tumbado con mancuernas en banco':['dumbbell lying triceps extension','lying dumbbell triceps extension'],
    'jalon al pecho':['cable lat pulldown','lat pulldown','wide grip lat pulldown','overhand grip cable lat pulldown'],
    'jalon al pecho agarre distinto al martes':['cable lat pulldown','lat pulldown','wide grip lat pulldown','close grip lat pulldown'],
    'dominadas asistidas':['assisted pull up','assisted pull-up','band assisted pull up'],
    'dominadas con banda o estrictas':['pull up','pull-up','pullups'],
    'dominadas con agarre diferente al martes':['pull up','pull-up','pullups'],
    'remo con mancuerna a una mano apoyado en banco':['dumbbell one arm row','one arm dumbbell row','single arm dumbbell row'],
    'remo unilateral en maquina':['lever seated row','lever iso row','lever one arm row','machine one arm row'],
    'remo con mancuerna a una mano con apoyo en banco':['dumbbell one arm row','one arm dumbbell row','single arm dumbbell row'],
    'remo unilateral con mancuerna y torso apoyado en banco inclinado':['dumbbell incline row','incline dumbbell row'],
    'remo sentado en polea':['seated cable row','seated cable rows'],
    'remo con barra olimpica inclinado':['barbell bent over row','bent over barbell row'],
    'remo con barra inclinado':['barbell bent over row','bent over barbell row'],
    'remo unilateral con mancuerna apoyado en banco':['dumbbell one arm row','one arm dumbbell row','single arm dumbbell row'],
    'remo con dos mancuernas con pecho apoyado en banco inclinado':['dumbbell incline row','incline dumbbell row','chest supported dumbbell row'],
    'remo con mancuernas sentado torso inclinado y espalda estable':['bent over two dumbbell row','bent over dumbbell row'],
    'remo con pecho apoyado':['dumbbell incline row','incline dumbbell row','chest supported dumbbell row','lever seated row'],
    'pajaros en maquina reverse pec deck':['lever seated reverse fly','reverse pec deck','reverse machine fly'],
    'pajaros con mancuernas y pecho apoyado en banco inclinado':['dumbbell incline reverse fly','incline dumbbell reverse fly','bent over reverse dumbbell fly'],
    'pajaros con mancuernas inclinado de pie':['dumbbell reverse fly','reverse dumbbell fly','bent over reverse dumbbell fly'],
    'curl de biceps con barra':['barbell curl','barbell biceps curl'],
    'curl alterno con mancuernas':['alternating dumbbell biceps curl','dumbbell biceps curl','alternate dumbbell curl'],
    'curl con barra ez':['ez bar curl','ez bar biceps curl','ez barbell curl'],
    'curl sentado con mancuernas y espalda apoyada':['seated dumbbell biceps curl','seated dumbbell curl'],
    'curl martillo':['dumbbell hammer curl','hammer curl'],
    'curl martillo alterno con mancuernas':['alternating dumbbell hammer curl','dumbbell hammer curl','hammer curl'],
    'curl martillo sentado':['seated dumbbell hammer curl','seated hammer curl'],
    'curl martillo cruzado hacia el hombro contrario':['cross body dumbbell hammer curl','cross body hammer curl'],
    'hack squat':['lever hack squat','hack squat'],
    'sentadilla con barra en rack y seguros ajustados':['barbell squat','barbell full squat','barbell back squat'],
    'sentadilla goblet con mancuerna':['dumbbell goblet squat','goblet squat'],
    'sentadilla con dos mancuernas a los lados':['dumbbell squat'],
    'curl femoral sentado':['lever seated leg curl','seated leg curl','seated machine leg curl'],
    'curl femoral sentado en maquina':['lever seated leg curl','seated leg curl','seated machine leg curl'],
    'curl femoral tumbado en maquina':['lever lying leg curl','lying leg curl','lying leg curls'],
    'curl femoral deslizante con talones':['sliding leg curl','lying leg curl on floor sliders'],
    'curl femoral con fitball':['stability ball leg curl','exercise ball leg curl','swiss ball leg curl'],
    'prensa de piernas':['sled 45 leg press','lever leg press','leg press'],
    'sentadilla con dos mancuernas':['dumbbell squat'],
    'sentadilla bulgara con mancuernas y apoyo en banco':['dumbbell bulgarian split squat','bulgarian split squat','split squat with dumbbells'],
    'extension de cuadriceps':['lever leg extension','leg extension','leg extensions'],
    'sentadilla espanola con banda correa anclada':['spanish squat','band spanish squat'],
    'zancadas hacia delante o atras con mancuernas':['dumbbell lunge','dumbbell lunges','walking lunges'],
    'step up a banco plataforma estable':['dumbbell step up','step up','dumbbell step-up'],
    'gemelos en maquina':['lever seated calf raise','standing calf raise machine','calf raise machine','seated calf raise'],
    'elevacion de talones de pie con mancuernas':['standing dumbbell calf raise','dumbbell standing calf raise'],
    'elevacion de talones con barra en rack y seguridad':['standing barbell calf raise','barbell standing calf raise'],
    'elevacion unilateral con apoyo estable':['single leg calf raise','one leg calf raise','single leg standing calf raise'],
    'crunch abdominal en maquina':['lever crunch','ab crunch machine','machine crunch'],
    'crunch en el suelo':['crunch','crunches'],
    'crunch con disco ligero sobre el pecho':['weighted crunch','weighted crunches'],
    'elevacion de rodillas tumbado':['lying leg raise','lying knee raise','flat bench lying leg raise'],
    'press inclinado en maquina o con mancuernas':['lever incline chest press','incline chest press machine','incline dumbbell press','incline dumbbell bench press'],
    'press inclinado con mancuernas en banco ajustable':['incline dumbbell press','incline dumbbell bench press','dumbbell incline bench press'],
    'press inclinado con barra olimpica en banco ajustable y rack seguro':['barbell incline bench press','incline barbell bench press'],
    'press plano con mancuernas si el banco inclinado esta ocupado':['dumbbell bench press'],
    'remo con mancuerna a una mano':['dumbbell one arm row','one arm dumbbell row','single arm dumbbell row'],
    'fondos asistidos':['assisted triceps dip','assisted dip','dip chin assist'],
    'press de banca con agarre cerrado':['close grip bench press','close grip barbell bench press'],
    'flexiones con manos a anchura comoda':['push up','pushups','push-up'],
    'elevaciones laterales sentado':['seated dumbbell lateral raise','seated lateral raise'],
    'hip thrust':['barbell hip thrust','hip thrust'],
    'hip thrust con barra y banco estable':['barbell hip thrust'],
    'puente de gluteos con mancuerna sobre la pelvis':['dumbbell glute bridge','weighted glute bridge'],
    'puente de gluteos con peso corporal y pausas arriba':['glute bridge','bodyweight glute bridge'],
    'peso muerto rumano':['barbell romanian deadlift','romanian deadlift'],
    'peso muerto rumano con mancuernas':['dumbbell romanian deadlift','romanian deadlift dumbbell'],
    'peso muerto rumano con barra olimpica':['barbell romanian deadlift','romanian deadlift'],
    'buenos dias con barra ligera solo con experiencia tecnica':['barbell good morning','good morning'],
    'curl femoral tumbado':['lever lying leg curl','lying leg curl','lying leg curls'],
    'extension de cadera en polea':['cable glute kickback','cable kickback','cable hip extension'],
    'patada de gluteo con mancuerna ligera detras de la rodilla en banco':['dumbbell glute kickback','quadruped dumbbell kickback'],
    'puente de gluteos unilateral':['single leg glute bridge','single leg hip thrust'],
    'zancada hacia atras con mancuernas':['dumbbell reverse lunge','reverse dumbbell lunge','dumbbell lunge'],
    'curl bayesiano unilateral en polea':['single arm bayesian curl','bayesian cable curl','standing one arm cable curl'],
    'curl inclinado con mancuernas en banco':['incline dumbbell curl','alternate incline dumbbell curl','incline dumbbell biceps curl'],
    'curl inclinado con mancuernas':['incline dumbbell curl','alternate incline dumbbell curl','incline dumbbell biceps curl'],
    'curl alterno con mancuernas brazo ligeramente detras del torso':['incline dumbbell curl','alternate incline dumbbell curl'],
    'curl sentado con mancuernas y respaldo vertical':['seated dumbbell biceps curl','seated dumbbell curl'],
    'curl de concentracion con mancuerna':['concentration curl','dumbbell concentration curl'],
    'elevacion con barra en rack seguro':['standing barbell calf raise','barbell standing calf raise']
  };
  const ALLOWED = new Map(Object.entries(MAP).map(([k,v]) => [norm(k), v.map(norm)]));

  // GIF directos contrastados en las fichas oficiales de Gym visual.
  // Se usan para impedir que un caché antiguo o un alias del dataset cambie el movimiento.
  const VERIFIED_OVERRIDES = new Map([
    [norm('Press de pecho en máquina'), {url:'https://gymvisual.com/img/p/5/3/1/4/5314.gif?v=20261014-3', name:'Lever Chest Press (máquina sentada)', attribution:ATTRIBUTION}],
    [norm('Press de hombros en máquina'), {url:'https://gymvisual.com/img/p/9/8/3/2/9832.gif?v=20261014-3', name:'Lever Shoulder Press (máquina)', attribution:ATTRIBUTION}],
    [norm('Press militar de pie con barra'), {url:'https://gymvisual.com/img/p/5/8/5/8/5858.gif?v=20261014-3', name:'Barbell Standing Military Press', attribution:ATTRIBUTION}]
  ]);

  async function fetchAndCache(url) {
    const cache = 'caches' in window ? await caches.open(MEDIA_CACHE).catch(() => null) : null;
    if (cache) { const saved = await cache.match(url); if (saved) return saved; }
    const response = await fetch(url, {mode:'cors', cache:'force-cache'});
    if (!response.ok) throw new Error(`No se pudo cargar el recurso (${response.status})`);
    if (cache) await cache.put(url, response.clone()).catch(() => {});
    return response;
  }
  async function getDataset() {
    if (!datasetPromise) datasetPromise = fetchAndCache(DATA_URL).then(r => r.json()).then(data => Array.isArray(data) ? data : []).catch(() => []);
    return datasetPromise;
  }
  async function resolve(name) {
    const key = norm(name);
    if (resultCache.has(key)) return resultCache.get(key);
    const verified = VERIFIED_OVERRIDES.get(key);
    if (verified) { resultCache.set(key, Promise.resolve(verified)); return Promise.resolve(verified); }
    const promise = getDataset().then(items => {
      const candidates = ALLOWED.get(key);
      if (!items.length || !candidates) return null;
      const matches = items.filter(item => candidates.includes(norm(item.name)) && item.gif_url);
      if (matches.length !== 1) return null;
      const item = matches[0];
      const url = new URL(String(item.gif_url).replace(/^\.\//, ''), RAW_BASE);
      url.searchParams.set('v', ASSET_VERSION);
      return {url:url.href, name:item.name, attribution:item.attribution || ATTRIBUTION};
    });
    resultCache.set(key, promise);
    return promise;
  }
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
      img.className = 'exercise-animation'; img.alt = `Animación de ${name}`; img.loading = 'lazy'; img.decoding = 'async';
      img.src = match.url;
      img.addEventListener('error', () => {
        node.innerHTML = '<span class="play-symbol">ⓘ</span><span>Demostración técnica</span><small>Animación no disponible; conecta a internet</small>';
      }, {once:true});
      node.innerHTML = '';
      node.appendChild(img);
      const meta = document.createElement('div'); meta.className = 'animation-meta';
      const title = document.createElement('span'); title.textContent = match.name;
      const credit = document.createElement('small'); credit.textContent = match.attribution;
      meta.append(title, credit); node.appendChild(meta);
      node.setAttribute('aria-label', `Animación técnica: ${match.name}. ${match.attribution}`);
    }));
  }
  async function prefetchRoutine() {
    if (!navigator.onLine || !window.ALPHA_ROUTINE) return;
    const names = new Set();
    Object.values(window.ALPHA_ROUTINE).forEach(day => day.exercises.forEach(ex => {
      names.add(ex.name); ex.alternatives.forEach(alt => names.add(alt[0]));
    }));
    const matches = (await Promise.all([...names].map(resolve))).filter(Boolean);
    for (let i = 0; i < matches.length; i += 3) {
      await Promise.all(matches.slice(i, i + 3).map(item => fetchAndCache(item.url).catch(() => null)));
    }
  }
  async function auditRoutine() {
    const names = new Set();
    Object.values(window.ALPHA_ROUTINE || {}).forEach(day => day.exercises.forEach(ex => { names.add(ex.name); ex.alternatives.forEach(alt => names.add(alt[0])); }));
    const rows = await Promise.all([...names].map(async name => ({exercise:name, mapped:ALLOWED.has(norm(name)), result:(await resolve(name))?.name || 'SIN GIF EXACTO'})));
    return rows;
  }
  window.AlphaAnimations = {resolve, hydrate, prefetchRoutine, auditRoutine, attribution:ATTRIBUTION};
})();
