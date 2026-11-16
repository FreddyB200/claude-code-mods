# leer-en-voz-alta

[![Licencia: MIT](https://img.shields.io/badge/licencia-MIT-blue.svg)](LICENSE)
![Plataforma: macOS](https://img.shields.io/badge/plataforma-macOS-lightgrey.svg)

**Un mod de Claude Code que lee en voz alta las respuestas de Claude con la voz `say` de macOS. Totalmente local, sin llamadas a ningún modelo.**

[English](README.md)

<!-- screenshot pending: docs/images/leer-command.png (see docs/SCREENSHOTS.md) -->
> **¿Buscas algo más pulido?** [Narrator](https://github.com/midudev/better-claude), de `midudev/better-claude`, hace lo mismo mejor y está mejor mantenido (ver [Narrator frente a este mod](#narrator-frente-a-este-mod)). Este es un mod personal pequeño que conservo por ser simple y funcionar sin conexión.

## Por qué

A veces quiero escuchar la respuesta de Claude mientras miro otra cosa, sin enviar nada nuevo a ningún sitio. macOS ya trae un motor de voz (`say`), así que el mod solo limpia el Markdown, elige una voz y lo llama.

## Características

- `/leer` lee la última respuesta. `/leer stop` la detiene.
- `/leer auto` activa o desactiva la lectura automática al terminar cada respuesta.
- Limpia el texto para la voz: quita bloques de código, marcas de código en línea, enlaces, URLs, tablas, encabezados, viñetas y emojis. Si omitió bloques de código, lo dice al final.
- Elige voz en español o inglés con una heurística sencilla de palabras.
- Voces y velocidad configurables; las respuestas largas se cortan a 4000 caracteres.
- Solo lee respuestas de la conversación principal, no de subagentes.

## Comandos

| Comando | Efecto |
|---------|--------|
| `/leer` | Lee en voz alta la última respuesta |
| `/leer stop` (o `parar`) | Detiene la lectura |
| `/leer auto` | Alterna la lectura automática (`/leer auto on` u `off` para fijarla) |
| `/leer voz es <nombre>` | Voz en español (por defecto `Paulina`) |
| `/leer voz en <nombre>` | Voz en inglés (por defecto `Reed (English (US))`) |
| `/leer velocidad N` | Palabras por minuto, 80-400 (por defecto 190) |
| `/leer estado` | Muestra la configuración |

Lista las voces instaladas en tu Mac con `say -v ?`.

## Instalación

Requisitos: macOS (usa `/usr/bin/say` y `/usr/bin/pkill`) y una versión de Claude Code que admita plugins con mods. No se ha determinado la versión mínima de Claude Code.

```text
/plugin marketplace add FreddyB200/claude-code-mods
/plugin install leer-en-voz-alta@claude-code-mods
```

## Uso

1. Pregunta algo a Claude.
2. Escribe `/leer` para oír la respuesta, o `/leer auto` para oírlas todas.
3. Escribe `/leer stop` para silenciarla.

## Cómo funciona

- Un hook `turn.complete` guarda la última respuesta en el almacén del plugin y, en modo automático, la lee.
- El texto se limpia con unas pocas expresiones regulares y se ejecuta `say -v <voz> -r <velocidad> <texto>` en segundo plano (el texto va como argumento, nunca dentro de un script de shell).
- Para detener se ejecuta `pkill -x say`.

## Narrator frente a este mod

Narrator (`midudev/better-claude`) es la opción más capaz. Comparación honesta:

| | Narrator | leer-en-voz-alta |
|---|---|---|
| Qué se dice | Un resumen corto en primera persona escrito por un modelo (Haiku) | La propia respuesta, limpiada |
| Llamada a modelo / datos | Envía la petición, las herramientas usadas y la respuesta a un modelo para resumir | Ninguna; solo local |
| Voces | AVSpeechSynthesizer, incluidas voces Siri/premium | Solo voces de `say` |
| Plataformas | macOS, Windows, Linux | Solo macOS |
| Interfaz | Interruptor clicable en el pie, más comandos | Solo comandos con barra |
| Mantenimiento | Desarrollo activo | Proyecto personal |

Elige este mod si quieres algo mínimo, sin conexión y que lea el texto tal cual; elige Narrator para todo lo demás.

## Privacidad

El mod no hace llamadas de red. Guarda sus ajustes y el texto de la última respuesta en el almacén del plugin que gestiona Claude Code (en tu equipo). El texto se pasa al proceso local `say`. Ten en cuenta que las respuestas las produce Claude y, por tanto, ya pasaron por la API de Anthropic como parte de tu sesión normal.

## Limitaciones

- Solo macOS.
- `/leer stop` ejecuta `pkill -x say`, que detiene **todos** los procesos `say` del equipo, no solo los de este mod.
- La detección español/inglés es una heurística de palabras; otros idiomas se leen con la voz en español.
- Las voces por defecto (`Paulina`, `Reed (English (US))`) deben estar instaladas; si no, configura las tuyas con `/leer voz`.
- La carpeta `.claude-plugin/types/` contiene tipos generados y está ignorada por git; `tsconfig.json` solo los necesita para comprobar tipos.

## Estado

Versión 0.1.0, herramienta personal. Solo se ha revisado el código: la instalación mediante marketplace, el comportamiento con distintas versiones de Claude Code y la ubicación exacta del almacén están **sin probar**. Hoja de ruta: mensajes en inglés, mejor detector de idioma, detener solo su propio proceso `say`.

## Licencia

[MIT](LICENSE) © 2026 Freddy Bautista
