# leer-en-voz-alta

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
![Platform: macOS](https://img.shields.io/badge/platform-macOS-lightgrey.svg)

**A Claude Code mod that reads Claude's answers aloud with the macOS `say` voice. Fully local, no model call.**

[Español](README.es.md)

<!-- screenshot pending: docs/images/leer-command.png (see docs/SCREENSHOTS.md) -->
> **Looking for something more polished?** [Narrator](https://github.com/midudev/better-claude) from `midudev/better-claude` does the same job better and is better maintained (see [Narrator vs. this mod](#narrator-vs-this-mod)). This one is a small personal mod that I kept because it is simple and offline.

## Why

Sometimes I want to listen to Claude's answer while I look at something else, without sending anything anywhere new. macOS already ships a speech engine (`say`), so the mod only has to clean the Markdown, pick a voice and call it.

## Features

- `/leer` reads the last answer. `/leer stop` stops it.
- `/leer auto` toggles automatic reading at the end of every answer.
- Cleans text for speech: drops code blocks, inline code marks, links, URLs, tables, headings, list markers and emojis. If code blocks were dropped, it says so at the end ("I skipped the code blocks").
- Picks a Spanish or English voice with a simple word-count heuristic.
- Configurable voices and speed; long answers are cut at 4000 characters.
- Only reads answers from the main conversation, not from sub-agents.

## Commands

| Command | Effect |
|---------|--------|
| `/leer` | Read the last answer aloud |
| `/leer stop` (or `parar`) | Stop reading |
| `/leer auto` | Toggle automatic reading (`/leer auto on` or `off` to set it) |
| `/leer voz es <name>` | Set the Spanish voice (default `Paulina`) |
| `/leer voz en <name>` | Set the English voice (default `Reed (English (US))`) |
| `/leer velocidad N` | Words per minute, 80-400 (default 190) |
| `/leer estado` | Show the current settings |

List the voices installed on your Mac with `say -v ?`. Command messages are in Spanish.

## Install

Requirements: macOS (uses `/usr/bin/say` and `/usr/bin/pkill`) and a Claude Code version that supports plugins with mods. The minimum Claude Code version has not been determined.

```text
/plugin marketplace add FreddyB200/claude-code-mods
/plugin install leer-en-voz-alta@claude-code-mods
```

## Usage

1. Ask Claude something.
2. Type `/leer` to hear the answer, or `/leer auto` to hear every answer.
3. Type `/leer stop` to silence it.

## How it works

- A `turn.complete` hook stores the last answer in the plugin's store and, in auto mode, speaks it.
- Text is cleaned with a few regular expressions, then `say -v <voice> -r <rate> <text>` runs in the background (the text is passed as an argument, never inside a shell script).
- Stopping runs `pkill -x say`.

## Narrator vs. this mod

Narrator (`midudev/better-claude`) is the more capable option. Honest comparison:

| | Narrator | leer-en-voz-alta |
|---|---|---|
| What is spoken | A short first-person summary written by a model (Haiku) | The answer itself, cleaned |
| Model call / data | Sends the request, tool use and answer to a model to summarize | None; local only |
| Voices | AVSpeechSynthesizer, including Siri/premium voices | `say` voices only |
| Platforms | macOS, Windows, Linux | macOS only |
| Interface | Footer switch you can click, plus commands | Slash commands only |
| Maintenance | Actively developed | Personal project |

Pick this mod if you want a tiny, offline, read-it-verbatim tool; pick Narrator for everything else.

## Privacy

The mod makes no network calls. It stores its settings and the last answer's text in the plugin store managed by Claude Code (on your machine). The text is passed to the local `say` process. Note that the answers themselves are, as always, produced by Claude and therefore already went through Anthropic's API as part of your normal session.

## Limitations

- macOS only.
- `/leer stop` runs `pkill -x say`, which stops **every** `say` process on the machine, not just this mod's.
- The Spanish/English detection is a simple word-count heuristic; other languages are read with the Spanish voice.
- The default voices (`Paulina`, `Reed (English (US))`) must be installed; if not, `say` falls back to a system voice or errors, set your own with `/leer voz`.
- Command output is in Spanish.
- The `.claude-plugin/types/` folder holds generated typings and is git-ignored; `tsconfig.json` expects them to exist only for type-checking.

## Status

Version 0.1.0, personal tool. Reading code only: installation through a marketplace, behavior on different Claude Code versions and the exact store location are **untested**. Roadmap: English command messages, a better language detector, stopping only its own `say` process.

## License

[MIT](LICENSE) © 2026 Freddy Bautista
