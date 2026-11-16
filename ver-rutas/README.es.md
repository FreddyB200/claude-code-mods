# ver-rutas

[![Licencia: MIT](https://img.shields.io/badge/licencia-MIT-blue.svg)](LICENSE)
![Plataforma: macOS](https://img.shields.io/badge/plataforma-macOS-lightgrey.svg)

**Un mod de Claude Code que convierte las rutas de archivo que cita Claude en chips clicables sobre el prompt, con vista previa al pasar el cursor.**

[English](README.md)

![Chips sobre el prompt de Claude Code con la vista previa de una carpeta](docs/images/path-chips.png)

> **¿Buscas algo más pulido?** [Quick Peek](https://github.com/midudev/better-claude), de `midudev/better-claude`, hace lo mismo mejor y está mejor mantenido (ver [Quick Peek frente a este mod](#quick-peek-frente-a-este-mod)). Este es un mod personal pequeño.

## Por qué

Claude suele responder con rutas como `~/Projects/app/notas.md`. Abrirlas implica copiar, ir al Finder y pegar. Este mod detecta las rutas que existen de verdad en tu Mac y te deja echar un vistazo o saltar allí de una vez.

## Características

- Detecta rutas en cada respuesta terminada: entre comillas invertidas (admiten espacios) o sueltas, que empiecen por `~/` o `/Users/`; quita la puntuación final y los sufijos `:línea`. Solo las rutas que existen se convierten en chips, hasta 6 por respuesta.
- **Chips** sobre el prompt: icono, nombre y un dato corto (nº de elementos en carpetas, tamaño en archivos).
- **Vista previa al pasar el cursor**: contenido de la carpeta (primeros 8 elementos), primeras 6 líneas de archivos de texto o código, dimensiones y tamaño de imágenes, o tipo y tamaño en el resto.
- **Clic**: las carpetas se abren en Finder; los archivos se muestran seleccionados en Finder.
- Comandos de respaldo para terminales que no informan del cursor o de los clics.

## Comandos

| Comando | Efecto |
|---------|--------|
| `/ver` | Lista las rutas de la última respuesta |
| `/ver N` | Vista previa Quick Look de la ruta N (las carpetas se abren en Finder) |
| `/ver cerrar` | Cierra la vista previa de Quick Look |
| `/abrir N` | Abre la ruta N con su app predeterminada |
| `/revelar N` | Muestra la ruta N en Finder |

## Instalación

Requisitos: macOS (usa `open`, `qlmanage`, `sips`, `stat`, `ls`, `head`, `file`) y una versión de Claude Code que admita plugins con mods y hover en componentes de interfaz. No se ha determinado la versión mínima; el hover necesita una terminal que informe del movimiento del ratón.

```text
/plugin marketplace add FreddyB200/claude-code-mods
/plugin install ver-rutas@claude-code-mods
```

## Uso

Habla con Claude con normalidad. Cuando una respuesta cita rutas existentes, aparecen chips sobre el prompt. Pasa el cursor para ver la vista previa y haz clic para ir a Finder. Usa `/ver 2` o `/abrir 2` si tu terminal no admite hover o clic.

## Cómo funciona

- Un hook `turn.complete` extrae rutas candidatas de la respuesta, las comprueba con `test -e`/`test -d` y construye una descripción de cada una con herramientas estándar de macOS.
- Un componente de interfaz `AbovePrompt` dibuja los chips como botones; la vista previa es texto oculto que se muestra con un ámbito de hover.
- El clic ejecuta `open` (carpetas) u `open -R` (archivos).

## Quick Peek frente a este mod

Quick Peek (`midudev/better-claude`) es la opción más capaz. Comparación honesta:

| | Quick Peek | ver-rutas |
|---|---|---|
| Dónde aparecen las rutas | Dentro del propio texto de la respuesta, como enlaces | Como chips sobre el prompt |
| Formas de ruta | Absolutas, `~/` y relativas, con `:línea:columna` | Solo absolutas `/Users/...` y `~/...` (el sufijo `:línea` se quita, no se usa) |
| Vista previa | Ventana flotante con miniatura de Quick Look y código coloreado con la línea resaltada | Líneas de texto en la zona de chips: listado de carpeta, 6 primeras líneas, tamaño de imagen |
| Option-clic para abrir el archivo | Sí | No (usa `/abrir N`) |
| Plataformas | macOS, Linux, Windows, WSL | Solo macOS |
| Respaldo sin hover | Necesita ratón en pantalla completa | Dato siempre visible y `/ver`, `/abrir`, `/revelar` |
| Mantenimiento | Desarrollo activo | Proyecto personal |

Elige este mod solo si prefieres la fila de chips y los comandos de respaldo.

## Privacidad

Este mod no envía nada fuera de tu equipo: solo ejecuta comandos locales. Lee los archivos y carpetas existentes que cita Claude, muestra las 6 primeras líneas de los archivos de texto en la vista previa (evita pasar el cursor por secretos mientras compartes pantalla) y guarda las rutas detectadas y la ruta de tu carpeta personal en el almacén del plugin que gestiona Claude Code.

## Limitaciones

- Solo macOS.
- No detecta rutas relativas ni sueltas fuera de `/Users/` (sí las absolutas entre comillas invertidas y las de `~/`).
- Las vistas previas son solo texto: sin miniaturas de imagen (usa `/ver N` para Quick Look).
- Máximo 6 chips por respuesta; solo se conservan las rutas de la última respuesta.
- Los mensajes y las vistas previas están en español.
- El hover depende de que la terminal informe del movimiento del ratón.
- `.claude-plugin/types/` contiene tipos generados y está ignorada por git; `types/index.d.ts` es propio del plugin.

## Estado

Versión 0.2.0, herramienta personal. Solo se ha revisado el código: la instalación mediante marketplace, el comportamiento con distintas versiones de Claude Code y terminales, y el uso fuera de macOS están **sin probar**. Hoja de ruta: rutas relativas, mensajes en inglés, miniaturas de imagen.

## Licencia

[MIT](LICENSE) © 2026 Freddy Bautista
