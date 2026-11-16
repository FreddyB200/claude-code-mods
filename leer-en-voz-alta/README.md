# leer-en-voz-alta

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
![Platform: macOS](https://img.shields.io/badge/platform-macOS-lightgrey.svg)

**A Claude Code mod that reads Claude's answers aloud, word for word, with the best voice your Mac has, Siri's included. No model call.**

[Español](README.es.md)

<!-- screenshot pending: docs/images/leer-command.png (see docs/SCREENSHOTS.md) -->
> **Looking for something more polished?** [Narrator](https://github.com/midudev/better-claude) from `midudev/better-claude` speaks a short summary instead and is better maintained (see [Narrator vs. this mod](#narrator-vs-this-mod)). This mod is the "read it verbatim, locally" counterpart.

## Why

Sometimes I want to listen to Claude's answer while I look at something else, without sending anything anywhere new. The mod only has to clean the Markdown, pick a voice and speak.

## Features

- `/leer` reads the last answer. `/leer stop` stops it.
- `/leer auto` toggles automatic reading at the end of every answer.
- **Natural voices**: it speaks through `AVSpeechSynthesizer`, which reaches Siri's natural voices (the `say` command cannot), and picks the best installed voice for the language of the text (Siri first, then premium, enhanced and compact ones, in your region).
- The language is detected from the text itself (macOS NaturalLanguage), so Spanish and English both just work.
- Cleans text for speech: drops code blocks, inline code marks, links, URLs, tables, headings, list markers and emojis. If code blocks were dropped, it says so at the end.
- Long answers are cut at 4000 characters. Only reads answers from the main conversation, not from sub-agents.

## Commands

| Command | Effect |
|---------|--------|
| `/leer` | Read the last answer aloud |
| `/leer stop` (or `parar`) | Stop reading |
| `/leer auto` | Toggle automatic reading (`/leer auto on` or `off` to set it) |
| `/leer voz <name>` | Pin a voice, for example `/leer voz Eddy (es-MX)`; `/leer voz auto` goes back to the best one |
| `/leer velocidad N` | `1` is the voice's normal pace; from `0.5` to `2` (default `1.2`) |
| `/leer estado` | Show the current settings |

To see the voice names installed on your Mac, use `/narrator voices` if you have Narrator, or add voices in **System Settings → Accessibility → Spoken Content → System voice → Manage Voices** (download a Siri or Premium voice for your language). Command messages are in Spanish.

## Install

Requirements: macOS (uses `osascript` and `pkill`) and a Claude Code version that supports plugins with mods. The minimum Claude Code version has not been determined.

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
- Text is cleaned with a few regular expressions. Then `osascript -l JavaScript` runs a small speaker program in the background; the text, voice and speed are passed as **environment variables**, never inside the script.
- The speaker script contains a unique marker, so `/leer stop` ends only this mod's reading (`pkill -f <marker>`) and not other speech on your machine.
- The speaker program is adapted from the Narrator plugin of [`midudev/better-claude`](https://github.com/midudev/better-claude) (MIT), simplified: no queue between windows and no fixed language.

## Narrator vs. this mod

Narrator is the more capable option. Honest comparison:

| | Narrator | leer-en-voz-alta |
|---|---|---|
| What is spoken | A short first-person summary written by a model (Haiku) | The answer itself, cleaned |
| Model call / data | Sends the request, tool use and answer to a model to summarize | None; local only |
| Voices | AVSpeechSynthesizer, including Siri/premium voices | The same engine (adapted from Narrator) |
| Platforms | macOS, Windows, Linux | macOS only |
| Interface | Footer switch you can click, plus commands | Slash commands only |
| Maintenance | Actively developed | Personal project |

Pick this mod if you want a tiny, offline, read-it-verbatim tool; pick Narrator for summaries and everything else. Narrator also has `/narrator read`, which reads the last answer in full.

## Privacy

The mod makes no network calls. It stores its settings and the last answer's text in the plugin store managed by Claude Code (on your machine). The text is passed to a local `osascript` process through an environment variable. Note that the answers themselves are, as always, produced by Claude and therefore already went through Anthropic's API as part of your normal session.

## Limitations

- macOS only.
- The "I skipped the code blocks" note picks its language with a simple word-count heuristic (Spanish or English); the voice itself follows the real detected language.
- If you pin a voice with `/leer voz` and it is not installed, the best voice for the language is used instead.
- Command output is in Spanish.
- The `.claude-plugin/types/` folder holds generated typings and is git-ignored; `tsconfig.json` expects them to exist only for type-checking.

## Status

Version 0.2.0, personal tool. Version 0.1 (with the `say` voice) was used by its author and worked. **Untested:** the new Siri-capable speaker end to end, installation through a marketplace, behavior on different Claude Code versions and the exact store location. Roadmap: English command messages and a forced English mode with slower speed for shadowing practice.

## License

[MIT](LICENSE) © 2026 Freddy Bautista. The speaker program is adapted from Narrator, also MIT, © Miguel Ángel Durán.
