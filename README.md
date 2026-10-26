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

## Cómo publicar una actualización
Sube los archivos modificados conservando sus rutas. Si cambias cualquier archivo de la app, sube también `CACHE_VERSION` en `sw.js` para que los móviles descarguen la versión nueva. Tras publicar, abre la app dos veces (la primera instala la actualización, la segunda la muestra).
