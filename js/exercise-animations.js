/* AetherOS · animaciones de ejercicios.
 *
 * Los GIF pertenecen a Gym visual (© https://gymvisual.com/) y se cargan desde el
 * dataset público hasaneyldrm/exercises-dataset.
 *
 * Cada ejercicio (y cada alternativa) de la rutina tiene asignado aquí el archivo exacto de su
 * animación. Si cambias o añades ejercicios en routine-data.js, añade una línea con el mismo
 * nombre; sin ella se muestra un aviso en lugar del GIF.
 */
(() => {
  'use strict';

  const RAW_BASE = 'https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/';
  const MEDIA_CACHE = 'aetheros-gymvisual-v1'; // debe coincidir con sw.js
  const ATTRIBUTION = '© Gym visual — https://gymvisual.com/';

  // Normaliza para comparar: sin tildes, minúsculas y sin signos.
  const norm = value => String(value || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

  /* Ejercicio de la rutina → archivo del GIF dentro del dataset. */
  const CATALOG = {
    "Press de pecho en máquina": "videos/0577-T0yTjgW.gif",
    "Press de banca con barra": "videos/0025-EIeI8Vf.gif",
    "Press de banca con mancuernas": "videos/0289-SpYC0Kp.gif",
    "Press militar en máquina": "videos/0587-CggQhII.gif",
    "Press militar con mancuernas": "videos/0405-znQUdHY.gif",
    "Aperturas en máquina Peck Deck": "videos/0596-v3xmPAR.gif",
    "Aperturas en poleas": "videos/0188-xLYSdtg.gif",
    "Aperturas con mancuernas": "videos/0308-yz9nUhF.gif",
    "Elevaciones laterales con mancuernas": "videos/0334-DsgkuIt.gif",
    "Elevaciones laterales en polea": "videos/0192-wEulIzp.gif",
    "Elevaciones laterales en máquina": "videos/0584-dRTfGZT.gif",
    "Extensión unilateral de tríceps en polea alta": "videos/1723-qRZ5S1N.gif",
    "Press francés tumbado con mancuernas": "videos/0351-mpKZGWz.gif",
    "Press francés con barra EZ": "videos/0060-h8LFzo9.gif",
    "Extensión de tríceps por encima de la cabeza con mancuerna": "videos/2188-kont8Ut.gif",
    "Jalón al pecho con agarre cerrado": "videos/2616-4c9BhzB.gif",
    "Dominadas asistidas": "videos/0017-kiJ4Z2K.gif",
    "Dominadas con peso corporal": "videos/0652-lBDjFxJ.gif",
    "Remo unilateral en máquina": "videos/0571-w2oRpuH.gif",
    "Remo con mancuerna a una mano": "videos/0292-C0MA9bC.gif",
    "Remo unilateral en máquina con apoyo pectoral": "videos/0571-w2oRpuH.gif",
    "Remo sentado en polea baja": "videos/0861-fUBheHs.gif",
    "Remo inclinado con barra": "videos/0027-eZyBC3j.gif",
    "Remo con mancuernas en banco inclinado": "videos/0327-7vG5o25.gif",
    "Aperturas inversas en máquina Peck Deck": "videos/0602-myfUsKf.gif",
    "Aperturas posteriores con mancuernas en banco inclinado": "videos/0326-vYk8lqw.gif",
    "Aperturas posteriores con mancuernas de pie e inclinado": "videos/0380-v1qBec9.gif",
    "Curl de bíceps con barra recta": "videos/0031-25GPyDY.gif",
    "Curl alterno con mancuernas": "videos/0285-BU15nH4.gif",
    "Curl de bíceps con barra EZ": "videos/0447-6TG6x2w.gif",
    "Curl de bíceps sentado con mancuernas": "videos/0391-TiaZTxx.gif",
    "Curl martillo cruzado": "videos/0298-Qyk5J3p.gif",
    "Curl martillo sentado": "videos/1678-IGtBdNT.gif",
    "Sentadilla Hack en máquina": "videos/0743-Qa55kX1.gif",
    "Sentadilla Goblet con mancuerna": "videos/1760-yn8yg1r.gif",
    "Sentadilla con barra": "videos/0043-qXTaZnJ.gif",
    "Curl femoral sentado": "videos/0599-Zg3XY7P.gif",
    "Curl femoral tumbado": "videos/0586-17lJ1kr.gif",
    "Curl femoral de pie": "videos/0795-C5jncD2.gif",
    "Curl femoral deslizante": "videos/3013-u0cNiij.gif",
    "Prensa de piernas inclinada": "videos/0739-10Z2DXU.gif",
    "Sentadilla búlgara con mancuernas": "videos/0410-qx4fgX7.gif",
    "Extensión de cuádriceps en máquina": "videos/0585-my33uHU.gif",
    "Zancadas con mancuernas": "videos/0336-RRWFUcw.gif",
    "Elevación de talones en máquina": "videos/0594-bOOdeyc.gif",
    "Elevación de talones en prensa": "videos/1391-ykHcWme.gif",
    "Elevación de talones de pie con mancuernas": "videos/0417-dPmaUaU.gif",
    "Crunch abdominal en máquina": "videos/1452-Wgaz7pm.gif",
    "Crunch abdominal en el suelo": "videos/0274-TFqbd8t.gif",
    "Press de pecho inclinado en máquina": "videos/1299-jHAnWmT.gif",
    "Press inclinado con mancuernas": "videos/0314-ns0SIbU.gif",
    "Press inclinado con barra": "videos/0047-3TZduzM.gif",
    "Jalón al pecho con agarre ancho": "videos/0150-eYnzaCm.gif",
    "Remo en máquina con apoyo pectoral": "videos/1350-7I6LNUG.gif",
    "Remo con dos mancuernas en banco inclinado": "videos/0327-7vG5o25.gif",
    "Fondos en paralelas asistidos": "videos/0019-J60bN17.gif",
    "Press de banca con agarre cerrado": "videos/0030-J6Dx1Mu.gif",
    "Flexiones": "videos/0662-I4hDWkc.gif",
    "Elevaciones laterales de pie": "videos/0334-DsgkuIt.gif",
    "Elevaciones laterales sentado": "videos/0396-hxyTtWj.gif",
    "Elevaciones laterales unilaterales con apoyo": "videos/0355-n5cWCsI.gif",
    "Extensión de tríceps por encima de la cabeza en polea": "videos/0194-2IxROQ1.gif",
    "Press francés con mancuernas": "videos/0351-mpKZGWz.gif",
    "Hip Thrust en máquina": "videos/3562-qg2PGl6.gif",
    "Hip Thrust con barra": "videos/3562-qg2PGl6.gif",
    "Puente de glúteos con peso corporal": "videos/3013-u0cNiij.gif",
    "Peso muerto rumano con barra": "videos/0085-wQ2c4XD.gif",
    "Peso muerto rumano con mancuernas": "videos/1459-rR0LJzx.gif",
    "Extensión de cadera en polea baja": "videos/0228-Kpajagk.gif",
    "Patada de glúteo con mancuerna": "videos/0228-Kpajagk.gif",
    "Puente de glúteos unilateral": "videos/3645-rmEukuS.gif",
    "Zancada hacia atrás con mancuernas": "videos/0381-SSsBDwB.gif",
    "Curl bayesiano de bíceps en polea a una mano": "videos/0190-YTur5nR.gif",
    "Curl inclinado con mancuernas": "videos/0315-F3xgbjF.gif",
    "Curl sentado con mancuernas": "videos/0391-TiaZTxx.gif",
    "Curl de concentración con mancuerna": "videos/0297-gvsWLQw.gif"
  };

  const FILES = new Map(Object.entries(CATALOG).map(([name, file]) => [norm(name), file]));
  const gifUrl = name => (FILES.has(norm(name)) ? RAW_BASE + FILES.get(norm(name)) : null);

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

  // ---- Rellena los marcadores .technique-placeholder con su GIF ----
  function hydrate(root) {
    (root || document).querySelectorAll('.technique-placeholder[data-animation-name]').forEach(node => {
      if (node.dataset.hydrated === '1') return;
      node.dataset.hydrated = '1';
      const name = node.dataset.animationName;
      const url = gifUrl(name);

      if (!url) {
        node.innerHTML = '<span class="play-symbol">ⓘ</span><span>Demostración técnica</span><small>Animación no disponible</small>';
        node.setAttribute('aria-label', 'No hay animación disponible para este ejercicio');
        return;
      }

      const img = document.createElement('img');
      img.className = 'exercise-animation';
      img.alt = `Animación de ${name}`;
      img.loading = 'lazy';
      img.decoding = 'async';
      img.src = url;
      img.addEventListener('error', () => {
        node.innerHTML = '<span class="play-symbol">ⓘ</span><span>Demostración técnica</span><small>Animación no disponible; conecta a internet</small>';
      }, { once: true });
      node.innerHTML = '';
      node.appendChild(img);
      node.setAttribute('aria-label', `Animación técnica: ${name}. ${ATTRIBUTION}`);
    });
  }

  // ---- Descarga previa de todos los GIF de la rutina para usarlos sin conexión ----
  async function prefetchRoutine() {
    if (!navigator.onLine) return;
    const urls = new Set();
    Object.values(window.AETHER_ROUTINE || {}).forEach(day => day.exercises.forEach(ex => {
      [ex.name, ...ex.alternatives.map(alt => alt[0])].forEach(name => { if (gifUrl(name)) urls.add(gifUrl(name)); });
    }));
    const list = [...urls];
    for (let i = 0; i < list.length; i += 3) {
      await Promise.all(list.slice(i, i + 3).map(url => fetchAndCache(url).catch(() => null)));
    }
  }

  window.AetherAnimations = { hydrate, prefetchRoutine };
})();
