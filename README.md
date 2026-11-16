# claude-code-mods

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
![Platform: macOS](https://img.shields.io/badge/platform-macOS-lightgrey.svg)

**Small personal mods for Claude Code: listen to answers and jump to the files Claude mentions.**

[Español](README.es.md)

| Mod | What it does | Version |
|-----|--------------|---------|
| [leer-en-voz-alta](leer-en-voz-alta) | Reads Claude's answers aloud with the macOS `say` voice (`/leer`, `/leer auto`, `/leer stop`). Fully local. | 0.1.0 |
| [ver-rutas](ver-rutas) | Paths cited by Claude become chips above the prompt with hover previews; also `/ver N`, `/abrir N`, `/revelar N`. | 0.2.0 |

## Install

This repo is a Claude Code plugin marketplace (`.claude-plugin/marketplace.json`).

```text
/plugin marketplace add FreddyB200/claude-code-mods
/plugin install leer-en-voz-alta@claude-code-mods
/plugin install ver-rutas@claude-code-mods
```

Both mods are macOS-only and need a Claude Code version that supports plugins with mods (minimum version not determined).

## A note on alternatives

Both mods overlap with better-maintained ones from [`midudev/better-claude`](https://github.com/midudev/better-claude): **Narrator** (reads/narrates answers) and **Quick Peek** (path links with hover previews). They are more capable and cross-platform. Each mod's README has an honest comparison. These two are kept as small, simple, offline-friendly personal tools.

## Status

Written by reading and using the code locally; installation through the marketplace has not been tested end to end. Each mod's README lists what is untested.

## License

[MIT](LICENSE) © 2026 Freddy Bautista
