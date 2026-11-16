# leer-en-voz-alta

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
![Platform: macOS](https://img.shields.io/badge/platform-macOS-lightgrey.svg)

**Un mod de Claude Code que lee en voz alta las respuestas de Claude, palabra por palabra, con la mejor voz de tu Mac, incluidas las de Siri. Sin llamadas a ningún modelo.**

[English](README.md)

<!-- screenshot pending: docs/images/leer-command.png (see docs/SCREENSHOTS.md) -->
> **¿Buscas algo más pulido?** [Narrator](https://github.com/midudev/better-claude), de `midudev/better-claude`, habla un resumen corto y está mejor mantenido (ver [Narrator frente a este mod](#narrator-frente-a-este-mod)). Este mod es la versión "léela tal cual, en local".

## Por qué

A veces quiero escuchar la respuesta de Claude mientras miro otra cosa, sin enviar nada a ningún sitio nuevo. El mod solo tiene que limpiar el Markdown, elegir una voz y hablar.

## Características

- `/leer` lee la última respuesta. `/leer stop` la detiene.
- `/leer auto` activa o desactiva la lectura automática al terminar cada respuesta.
- **Voces naturales**: habla con `AVSpeechSynthesizer`, que alcanza las voces naturales de Siri (el comando `say` no puede), y elige la mejor voz instalada para el idioma del texto (primero Siri, luego premium, mejoradas y compactas, de tu región).
- El idioma se detecta a partir del propio texto (NaturalLanguage de macOS), así que español e inglés funcionan sin configurar nada.
- Limpia el texto para la voz: quita bloques de código, marcas de código en línea, enlaces, URLs, tablas, títulos, viñetas y emojis. Si quitó bloques de código, lo avisa al final.
- Las respuestas largas se cortan a 4000 caracteres. Solo lee las respuestas de la conversación principal, no las de subagentes.

## Comandos

| Comando | Efecto |
|---------|--------|
| `/leer` | Lee la última respuesta en voz alta |
| `/leer stop` (o `parar`) | Detiene la lectura |
| `/leer auto` | Activa o desactiva la lectura automática (`/leer auto on` u `off` para fijarla) |
| `/leer voz <nombre>` | Fija una voz, por ejemplo `/leer voz Eddy (es-MX)`; `/leer voz auto` vuelve a la mejor |
| `/leer velocidad N` | `1` es el ritmo normal de la voz; de `0.5` a `2` (por defecto `1.2`) |
| `/leer estado` | Muestra la configuración actual |

Para ver los nombres de las voces instaladas en tu Mac, usa `/narrator voices` si tienes Narrator, o añade voces en **Ajustes del Sistema → Accesibilidad → Contenido hablado → Voz del sistema → Gestionar voces** (descarga una voz Siri o Premium para tu idioma). Los mensajes de los comandos están en español.

## Instalación

Requisitos: macOS (usa `osascript` y `pkill`) y una versión de Claude Code que admita plugins con mods. No se ha determinado la versión mínima de Claude Code.

```text
/plugin marketplace add FreddyB200/claude-code-mods
/plugin install leer-en-voz-alta@claude-code-mods
```

## Uso

1. Pregúntale algo a Claude.
2. Escribe `/leer` para oír la respuesta, o `/leer auto` para oírlas todas.
3. Escribe `/leer stop` para silenciarla.

## Cómo funciona

- Un hook de `turn.complete` guarda la última respuesta en el almacén del plugin y, en modo automático, la lee.
- El texto se limpia con unas pocas expresiones regulares. Después `osascript -l JavaScript` lanza en segundo plano un pequeño programa de voz; el texto, la voz y la velocidad se pasan como **variables de entorno**, nunca dentro del script.
- El programa de voz lleva una marca única, así que `/leer stop` termina solo la lectura de este mod (`pkill -f <marca>`) y no otras voces de tu equipo.
- El programa de voz está adaptado del plugin Narrator de [`midudev/better-claude`](https://github.com/midudev/better-claude) (MIT), simplificado: sin cola entre ventanas y sin idioma fijo.

## Narrator frente a este mod

Narrator es la opción más completa. Comparación honesta:

| | Narrator | leer-en-voz-alta |
|---|---|---|
| Qué se dice | Un resumen corto en primera persona escrito por un modelo (Haiku) | La propia respuesta, limpia |
| Llamada a un modelo / datos | Envía la petición, las herramientas y la respuesta a un modelo para resumirla | Ninguna; todo en local |
| Voces | AVSpeechSynthesizer, incluidas las de Siri y premium | El mismo motor (adaptado de Narrator) |
| Plataformas | macOS, Windows, Linux | Solo macOS |
| Interfaz | Interruptor en el pie en el que se puede hacer clic, y comandos | Solo comandos |
| Mantenimiento | Desarrollo activo | Proyecto personal |

Elige este mod si quieres una herramienta mínima, sin conexión, que lea el texto tal cual; elige Narrator para los resúmenes y todo lo demás. Narrator también tiene `/narrator read`, que lee la última respuesta completa.

## Privacidad

El mod no hace llamadas de red. Guarda sus ajustes y el texto de la última respuesta en el almacén del plugin que gestiona Claude Code (en tu equipo). El texto se pasa a un proceso local de `osascript` mediante una variable de entorno. Ten en cuenta que las respuestas, como siempre, las produce Claude y por tanto ya pasaron por la API de Anthropic en tu sesión normal.

## Limitaciones

- Solo macOS.
- El aviso "Omití los bloques de código" elige su idioma con una heurística sencilla de recuento de palabras (español o inglés); la voz en sí sigue el idioma realmente detectado.
- Si fijas una voz con `/leer voz` y no está instalada, se usa la mejor voz del idioma.
- Los mensajes de los comandos están en español.
- La carpeta `.claude-plugin/types/` contiene tipos generados y está ignorada por git; `tsconfig.json` espera que existan solo para comprobar tipos.

## Estado

Versión 0.2.0, herramienta personal. La versión 0.1 (con la voz de `say`) la usó su autor y funcionó. **Sin probar:** el nuevo programa de voz con Siri de principio a fin, la instalación a través de un marketplace, el comportamiento en distintas versiones de Claude Code y la ubicación exacta del almacén. Hoja de ruta: mensajes de los comandos en inglés y un modo de inglés forzado con velocidad lenta para practicar shadowing.

## Licencia

[MIT](LICENSE) © 2026 Freddy Bautista. El programa de voz está adaptado de Narrator, también MIT, © Miguel Ángel Durán.
