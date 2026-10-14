# Alpha Track — rediseño modular

PWA instalable en JavaScript vainilla, sin frameworks ni dependencias externas.

## Archivos
- `index.html`: estructura y carga de módulos.
- `css/alpha-track.css`: interfaz minimalista oscura, responsive y accesible.
- `js/routine-data.js`: rutina de 5 días y alternativas de sustitución.
- `js/tracker-store.js`: persistencia local, exportación/importación y conservación de claves antiguas.
- `js/app.js`: navegación, detección de día, registro por serie y progreso.
- `manifest.json`, `sw.js`: instalación y caché offline.

## Publicación
Sube el contenido de esta carpeta a la raíz de GitHub Pages (o a la carpeta publicada del repositorio). Abre la URL con HTTPS y carga una vez la app para que el service worker almacene los archivos. En iOS: Safari → Compartir → Añadir a pantalla de inicio.

## Datos y privacidad
Los registros nuevos se guardan en `localStorage` del navegador. No hay servidor ni sincronización en la nube. Los valores de la versión anterior con prefijo `alpha_v4_` no se borran y se incluyen en la exportación. Exporta una copia antes de borrar datos del navegador o cambiar de dispositivo.

## Alcance de la fuente
La rutina y sus series/rangos y alternativas proceden del archivo de rutina facilitado. El archivo proporcionado incluye la rutina completa de alternativas. No se han incluido GIF/WebP reales porque no venían adjuntos; la interfaz reserva un espacio por ejercicio hasta añadir recursos técnicos optimizados. No se añaden progresiones semanales diferentes no especificadas en el documento: el plan está estructurado para 6 semanas con doble progresión.

## Verificación
La PWA debe servirse por HTTP(S), no abriendo `index.html` como archivo local, para habilitar el service worker. Los datos permanecen en el navegador donde se registran.
