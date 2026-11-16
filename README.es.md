# claude-code-mods

[![Licencia: MIT](https://img.shields.io/badge/licencia-MIT-blue.svg)](LICENSE)
![Plataforma: macOS](https://img.shields.io/badge/plataforma-macOS-lightgrey.svg)

**Pequeños mods personales para Claude Code: escucha las respuestas y salta a los archivos que menciona Claude.**

[English](README.md)

| Mod | Qué hace | Versión |
|-----|----------|---------|
| [leer-en-voz-alta](leer-en-voz-alta) | Lee en voz alta las respuestas de Claude con la voz `say` de macOS (`/leer`, `/leer auto`, `/leer stop`). Totalmente local. | 0.1.0 |
| [ver-rutas](ver-rutas) | Las rutas que cita Claude aparecen como chips sobre el prompt con vista previa al pasar el cursor; también `/ver N`, `/abrir N`, `/revelar N`. | 0.2.0 |

## Instalación

Este repositorio es un marketplace de plugins de Claude Code (`.claude-plugin/marketplace.json`).

```text
/plugin marketplace add FreddyB200/claude-code-mods
/plugin install leer-en-voz-alta@claude-code-mods
/plugin install ver-rutas@claude-code-mods
```

Ambos mods son solo para macOS y necesitan una versión de Claude Code que admita plugins con mods (versión mínima sin determinar).

## Nota sobre alternativas

Los dos mods se solapan con otros mejor mantenidos de [`midudev/better-claude`](https://github.com/midudev/better-claude): **Narrator** (lee/narra las respuestas) y **Quick Peek** (enlaces a rutas con vista previa). Son más capaces y multiplataforma. El README de cada mod incluye una comparación honesta. Estos dos se mantienen como herramientas personales pequeñas, simples y que funcionan sin conexión.

## Estado

Escritos y usados en local; la instalación mediante el marketplace no se ha probado de principio a fin. El README de cada mod indica lo que está sin probar.

## Licencia

[MIT](LICENSE) © 2026 Freddy Bautista
