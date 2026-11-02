# AetherOS — Sessio Log

Aplicación web personal de entrenamiento, pensada para móvil y con funcionamiento local-first.

## Funciones
- Rutina de cinco días con variantes por ejercicio.
- Registro de carga, repeticiones y RIR; admite un valor común o valores separados por serie mediante punto y coma.
- Sugerencias orientativas de doble progresión basadas en las series registradas.
- Historial y estadísticas de volumen, repeticiones, cargas y frecuencia.
- Temporizador de descanso, exportación e importación de copias de seguridad.
- Icono, diseño adaptable, caché offline y carga de animaciones de ejercicios.

## Publicación
Sube los archivos conservando sus rutas y activa GitHub Pages desde la rama y carpeta que uses. No borres el almacenamiento local del navegador si quieres conservar registros anteriores.

## Datos y copias de seguridad
Los registros nuevos se guardan en el espacio local `aetheros_v2_`. La aplicación no sincroniza automáticamente los datos entre dispositivos. Exporta periódicamente una copia JSON y guárdala en un lugar seguro. La importación combina los registros compatibles con los datos locales existentes.

## Animaciones y atribución
Las animaciones se resuelven por listas explícitas de nombres del catálogo [hasaneyldrm/exercises-dataset](https://github.com/hasaneyldrm/exercises-dataset). Si no hay una coincidencia exacta, la app muestra un aviso en lugar de una animación potencialmente incorrecta. Los GIF y miniaturas se atribuyen a Gym visual; consulta el archivo `LICENSE` y `NOTICE.md` del repositorio de origen para las condiciones aplicables a los medios. Los datos y el código del repositorio de origen indican licencia MIT, pero los medios tienen términos de uso separados.

## Versión 2.6.0
- Nueva barra inferior flotante (estilo cristal) separada del borde de la pantalla y del indicador de inicio del iPhone. El temporizador de descanso queda justo encima, con el mismo ancho.
- Hoja de estilos reescrita desde cero (de ~62 KB con capas de `!important` a ~22 KB), con el mismo aspecto.
- Código JavaScript reorganizado y comentado; eliminado código sin uso y catálogo de animaciones deduplicado.
- Gráficos de barras corregidos (ahora son proporcionales) y gráfico de evolución de cargas en SVG, ordenado de más antiguo a más reciente.
- La sugerencia de doble progresión ya contempla "última serie RIR 1".
- Service worker: la versión de caché se cambia en una sola constante (`CACHE_VERSION` en `sw.js`).

## Versión 2.6.1
- Las marcas de ejercicio hecho se reinician cada día (los pesos y repeticiones se conservan).
- Dock inferior con la mitad de separación, iconos nuevos y cuadros de animación/registro menos altos.

## Versión 2.7.0
- Rutina actualizada según «Rutina de Entrenamiento Semanal» (30 ejercicios, 67 alternativas, ejecución y consejo de cada uno).
- Catálogo de animaciones revisado ejercicio por ejercicio; en Opciones hay un botón «Comprobar animaciones» que lista los que no tienen GIF.

## Versión 2.7.1
- Animaciones: la coincidencia ya no depende del orden de las palabras del nombre y hay más nombres alternativos por ejercicio.
- «Comprobar animaciones» sugiere los nombres parecidos reales del dataset para los ejercicios que sigan sin GIF.

## Versión 2.7.2
- Catálogo de animaciones ajustado con los nombres reales del dataset para los últimos ejercicios sin GIF.

## Versión 2.8.0
- Ajustes de rutina: nombres y alternativas actualizados, extensión unilateral de tríceps en polea alta y animaciones corregidas.
- Opciones: botón para descargar la lista de ejercicios del dataset.
- Pestaña «Técnica» sin la explicación del RIR.

## Versión 2.9.0
- Animaciones revisadas contra el listado real del dataset (1323 ejercicios).
- Si un ejercicio tiene varias animaciones posibles, un botón ↻ sobre el GIF permite cambiar de una a otra y la app recuerda la elección.

## Versión 2.9.1
- Curl bayesiano y curl femoral deslizante con animación aproximada.
- Opciones: «Descargar mis animaciones elegidas» (sustituye a la descarga de la lista del dataset).

## Versión 3.0.0
- Animaciones fijas (una por ejercicio) y eliminado el sistema de cambio y revisión.
- Nuevo icono de mancuerna. Los iconos (`apple-touch-icon.png`, `favicon-32.png`, `icon-192.png`, `icon-512.png`) están ahora en la raíz del repositorio; la carpeta `icons/` ya no se usa y puede borrarse.

## Cómo publicar una actualización
Sube los archivos modificados conservando sus rutas. Si cambias cualquier archivo de la app, sube también `CACHE_VERSION` en `sw.js` para que los móviles descarguen la versión nueva. Tras publicar, abre la app dos veces (la primera instala la actualización, la segunda la muestra).
