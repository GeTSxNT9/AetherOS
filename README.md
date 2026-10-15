# AetherOS — Sessio Log

Aplicación web personal de entrenamiento, pensada para móvil y con funcionamiento local-first.

## Funciones
- Rutina de cinco días con variantes por ejercicio.
- Registro compacto por ejercicio de carga, repeticiones por serie y RIR por serie.
- Sugerencias orientativas de doble progresión cuando se cumplen las repeticiones objetivo y el RIR.
- Historial de sesiones por fecha y estadísticas de volumen, repeticiones, cargas, frecuencia, peso y cintura.
- Temporizador de descanso, exportación e importación de copias de seguridad.
- Icono de AetherOS y diseño adaptable a móvil.

## Publicación
Sube los archivos conservando sus rutas y activa GitHub Pages desde la rama y carpeta que uses. No borres el almacenamiento local del navegador si quieres conservar registros anteriores.

## Compatibilidad de datos
La app mantiene lectura/exportación de las claves antiguas `alpha_track_v2_` y `alpha_v4_` para preservar registros existentes. Los nuevos datos se guardan con el prefijo `aetheros_v1_`.

## Animaciones
Las animaciones se resuelven por listas explícitas de nombres del catálogo de ejercicios; si no existe una coincidencia exacta no se presenta una animación aleatoria. Los GIF de Gym visual se cargan desde el catálogo remoto y se cachean cuando el navegador lo permite. El crédito de los medios se mantiene en Opciones para no ocupar espacio en las tarjetas de ejercicios.
