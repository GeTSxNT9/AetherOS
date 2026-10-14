/* Alpha Track · animaciones Gym visual
 * El dataset (metadatos) se publica bajo MIT; los GIF son © Gym visual.
 * Mantener la atribución y la resolución original 180×180.
 */
(() => {
  'use strict';
  const DATA_URL = 'https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/data/exercises.json';
  const RAW_BASE = 'https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/';
  const ATTRIBUTION = '© Gym visual — https://gymvisual.com/';
  let datasetPromise;
  const resultCache = new Map();
  const norm = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

  // Términos ingleses concretos para evitar asociar un ejercicio a una animación parecida pero incorrecta.
  const aliases = [
    [/press de pecho en maquina|press de banca con barra|press de banca con mancuernas|press con mancuernas en banco plano/i, 'barbell bench press'],
    [/press de hombros en maquina|press de hombros sentado|press militar|press arnold/i, 'lever shoulder press'],
    [/pec deck|aperturas en polea|aperturas con mancuernas/i, 'pec deck fly'],
    [/elevaciones laterales|elevacion lateral/i, 'dumbbell lateral raise'],
    [/extension de triceps en polea|extension de triceps tumbado|press frances|extension por encima de la cabeza/i, 'cable pushdown'],
    [/jalon al pecho/i, 'lat pulldown'],
    [/dominadas/i, 'pull up'],
    [/remo unilateral en maquina|remo con mancuerna a una mano|remo unilateral con mancuerna/i, 'dumbbell one arm row'],
    [/remo sentado en polea/i, 'seated cable row'],
    [/remo con pecho apoyado|remo con dos mancuernas con pecho apoyado/i, 'lever seated row'],
    [/remo con barra olimpica inclinado|remo con barra inclinado/i, 'barbell bent over row'],
    [/pajaros en maquina|reverse pec deck|pajaros con mancuernas/i, 'reverse pec deck'],
    [/curl de biceps con barra|curl con barra ez|curl alterno con mancuernas|curl sentado con mancuernas|curl inclinado con mancuernas|curl de concentracion/i, 'dumbbell biceps curl'],
    [/curl martillo/i, 'hammer curl'],
    [/hack squat/i, 'hack squat'],
    [/sentadilla con barra|sentadilla goblet|sentadilla con dos mancuernas|sentadilla bulgara/i, 'barbell squat'],
    [/curl femoral sentado|curl femoral tumbado|curl femoral deslizante|curl femoral con fitball/i, 'lying leg curl'],
    [/prensa de piernas/i, 'sled 45 leg press'],
    [/extension de cuadriceps|sentadilla espanola|zancadas|step up/i, 'lever leg extension'],
    [/gemelos en maquina|elevacion de talones/i, 'standing calf raise'],
    [/crunch abdominal en maquina|crunch en el suelo|crunch con disco|elevacion de rodillas tumbado/i, 'crunch'],
    [/press inclinado/i, 'incline bench press'],
    [/fondos asistidos|press de banca con agarre cerrado|flexiones/i, 'assisted triceps dip'],
    [/hip thrust|puente de gluteos/i, 'barbell hip thrust'],
    [/peso muerto rumano|buenos dias/i, 'dumbbell romanian deadlift'],
    [/extension de cadera en polea|patada de gluteo|puente de gluteos unilateral|zancada hacia atras/i, 'cable kickback'],
    [/curl bayesiano/i, 'bayesian cable curl']
  ];

  function queryFor(name) {
    const n = norm(name);
    for (const [pattern, query] of aliases) if (pattern.test(n)) return query;
    return n;
  }
  async function fetchAndCache(url) {
    const cache = 'caches' in window ? await caches.open('alpha-track-gymvisual-v1').catch(() => null) : null;
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
  function score(name, query) {
    const n = norm(name), q = norm(query), tokens = q.split(' ').filter(t => t.length > 2);
    if (!n || !tokens.length) return 0;
    let points = tokens.reduce((sum, token) => sum + (n.includes(token) ? 2 : 0), 0);
    if (n === q) points += 12;
    if (n.includes(q) || q.includes(n)) points += 5;
    // Preferimos nombres con varios términos coincidentes y no elegimos coincidencias débiles.
    return points / tokens.length;
  }
  async function resolve(name) {
    const key = norm(name);
    if (resultCache.has(key)) return resultCache.get(key);
    const promise = getDataset().then(items => {
      if (!items.length) return null;
      const query = queryFor(name);
      let best = null, bestScore = 0;
      for (const item of items) {
        const candidate = score(item.name, query);
        if (candidate > bestScore) { bestScore = candidate; best = item; }
      }
      // Umbral conservador: es mejor no mostrar una animación que mostrar la del movimiento equivocado.
      if (!best || bestScore < 1.35 || !best.gif_url) return null;
      return {url: new URL(best.gif_url.replace(/^\.\//, ''), RAW_BASE).href, name:best.name, attribution:best.attribution || ATTRIBUTION};
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
        node.innerHTML = '<span class="play-symbol">ⓘ</span><span>Demostración técnica</span><small>Sin animación coincidente</small>';
        node.setAttribute('aria-label', 'No se encontró una animación exacta para este ejercicio');
        return;
      }
      const img = document.createElement('img');
      img.className = 'exercise-animation'; img.alt = `Animación de ${name}`; img.loading = 'lazy'; img.decoding = 'async';
      img.src = match.url;
      img.addEventListener('error', () => {
        node.innerHTML = '<span class="play-symbol">ⓘ</span><span>Demostración técnica</span><small>No disponible sin conexión</small>';
      }, {once:true});
      node.innerHTML = '';
      node.appendChild(img);
      const meta = document.createElement('div'); meta.className = 'animation-meta';
      const title = document.createElement('span'); title.textContent = match.name;
      const credit = document.createElement('small'); credit.textContent = match.attribution;
      meta.append(title, credit); node.appendChild(meta);
      node.setAttribute('aria-label', `Animación técnica: ${name}. ${match.attribution}`);
    }));
  }
  async function prefetchRoutine() {
    if (!navigator.onLine || !window.ALPHA_ROUTINE) return;
    const names = new Set();
    Object.values(window.ALPHA_ROUTINE).forEach(day => day.exercises.forEach(ex => {
      names.add(ex.name); ex.alternatives.forEach(alt => names.add(alt[0]));
    }));
    const matches = (await Promise.all([...names].map(resolve))).filter(Boolean);
    // Descarga en lotes pequeños para no saturar la conexión. El service worker guarda cada GIF.
    for (let i = 0; i < matches.length; i += 3) {
      await Promise.all(matches.slice(i, i + 3).map(item => fetchAndCache(item.url).catch(() => null)));
    }
  }
  window.AlphaAnimations = {resolve, hydrate, prefetchRoutine, attribution:ATTRIBUTION};
})();
