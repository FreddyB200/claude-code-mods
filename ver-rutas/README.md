# ver-rutas

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
![Platform: macOS](https://img.shields.io/badge/platform-macOS-lightgrey.svg)

**A Claude Code mod that turns the file paths Claude mentions into clickable chips above the prompt, with a preview on hover.**

[Español](README.es.md)

![Chips above the Claude Code prompt showing a hover preview of a folder](docs/images/path-chips.png)

> **Looking for something more polished?** [Quick Peek](https://github.com/midudev/better-claude) from `midudev/better-claude` does the same job better and is better maintained (see [Quick Peek vs. this mod](#quick-peek-vs-this-mod)). This is a small personal mod.

## Why

Claude often answers with paths like `~/Projects/app/notes.md`. Opening them means copying, switching to Finder and pasting. This mod detects the paths that really exist on your Mac and lets you peek or jump there in one move.

## Features

- Detects paths in each finished answer: in backticks (spaces allowed) or bare, starting with `~/` or `/Users/`; strips trailing punctuation and `:line` suffixes. Only paths that exist become chips, up to 6 per answer.
- **Chips** above the prompt: icon, name and a short hint (item count for folders, size for files).
- **Hover preview**: folder contents (first 8 entries), first 6 lines of text/code files, image dimensions and size, or file type and size for anything else.
- **Click**: folders open in Finder; files are revealed (selected) in Finder.
- Fallback commands for terminals that do not report hover or clicks.

## Commands

| Command | Effect |
|---------|--------|
| `/ver` | List the paths from the last answer |
| `/ver N` | Quick Look preview of path N (folders open in Finder) |
| `/ver cerrar` | Close the Quick Look preview |
| `/abrir N` | Open path N with its default app |
| `/revelar N` | Reveal path N in Finder |

Command messages are in Spanish.

## Install

Requirements: macOS (uses `open`, `qlmanage`, `sips`, `stat`, `ls`, `head`, `file`) and a Claude Code version that supports plugins with mods and hover on UI components. The minimum Claude Code version has not been determined; hover needs a terminal that reports mouse movement.

```text
/plugin marketplace add FreddyB200/claude-code-mods
/plugin install ver-rutas@claude-code-mods
```

## Usage

Just talk to Claude. When an answer cites existing paths, chips appear above the prompt. Hover one to preview it, click it to go to Finder. Use `/ver 2` or `/abrir 2` if hover or click is not available in your terminal.

## How it works

- A `turn.complete` hook extracts candidate paths from the answer, checks them with `test -e`/`test -d` and builds a description for each using standard macOS tools.
- An `AbovePrompt` UI component renders the chips as buttons; the preview is hidden text revealed by a hover scope.
- Clicks run `open` (folders) or `open -R` (files).

## Quick Peek vs. this mod

Quick Peek (`midudev/better-claude`) is the more capable option. Honest comparison:

| | Quick Peek | ver-rutas |
|---|---|---|
| Where paths appear | Directly in Claude's reply text, as links | As chips above the prompt |
| Path forms | Absolute, `~/`, and relative paths, with `:line:column` | Absolute `/Users/...` and `~/...` only (`:line` suffix is stripped, not used) |
| Hover preview | Floating window with Quick Look thumbnail, colored code with line highlight | Text lines in the chip area: folder listing, first 6 lines, image size |
| Option-click to open the file | Yes | No (use `/abrir N`) |
| Platforms | macOS, Linux, Windows, WSL | macOS only |
| Fallback without hover | Needs fullscreen mouse support | Always-visible hint plus `/ver`, `/abrir`, `/revelar` |
| Maintenance | Actively developed | Personal project |

Choose this mod only if you prefer the chip row and the slash-command fallbacks.

## Privacy

Nothing leaves your machine from this mod: it runs local commands only. It reads the existing files and folders that Claude cites, shows the first 6 lines of text files in the preview (so avoid hovering secrets while sharing your screen), and keeps the detected paths and your home directory path in the plugin store managed by Claude Code.

## Limitations

- macOS only.
- Relative paths and bare paths outside `/Users/` are not detected (backticked absolute paths and `~/` paths are).
- Previews are text only: no image thumbnails (use `/ver N` for Quick Look).
- At most 6 chips per answer; only the last answer's paths are kept.
- Command messages and previews are in Spanish.
- Hover relies on terminal support for mouse movement.
- `.claude-plugin/types/` holds generated typings and is git-ignored; the small `types/index.d.ts` is the plugin's own.

## Status

Version 0.2.0, personal tool. Code review only: installation through a marketplace, behavior on different Claude Code versions and terminals, and non-macOS use are **untested**. Roadmap: relative paths, English messages, image thumbnails.

## License

[MIT](LICENSE) © 2026 Freddy Bautista
