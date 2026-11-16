// Rutas citadas por Claude → chips sobre el prompt.
//   · Pasa el cursor por un chip: aparece una vista previa (carpeta: su contenido; texto: sus primeras líneas;
//     imagen: dimensiones y tamaño; otros: tipo y tamaño).
//   · Clic en el chip: carpeta → se abre en Finder; archivo → se muestra seleccionado en Finder.
//   · El dato corto (nº de elementos o tamaño) se ve siempre, aunque la terminal no informe del cursor.
// Comandos de respaldo: /ver N (Quick Look), /abrir N, /revelar N, /ver cerrar.
import { atom, read, update } from 'claude-code'
import type { Hook, Register } from 'claude-code'

import type { Item } from '../types'

type Engine = Parameters<Hook<'session.start'>>[0]
type Entry = { path: string; isDir: boolean }

const MAX = 6
const items = atom({ plugin: 'ver-rutas', key: 'items' } as const, [], { shape: 'items-1' })

const IMAGE = /\.(png|jpe?g|gif|webp|heic|tiff?|bmp)$/i
const TEXT = /\.(md|txt|json|jsonl|ts|tsx|js|jsx|swift|sh|py|ya?ml|toml|csv|html|css|log|plist|sql|rs|go|java|c|h|rb|php)$/i

async function run($: Engine, argv: string[]): Promise<string> {
  const r = await $.process.run(argv)
  return r.exitCode === 0 ? r.stdout : ''
}

async function home($: Engine): Promise<string> {
  const cached = (await $.store.get('home')) as string | undefined
  if (cached) return cached
  const h = (await run($, ['/usr/bin/printenv', 'HOME'])).trim()
  if (h) await $.store.set('home', h)
  return h
}

async function exists($: Engine, path: string, flag: '-e' | '-d'): Promise<boolean> {
  const { exitCode } = await $.process.run(['/bin/test', flag, path])
  return exitCode === 0
}

/** Rutas candidatas en orden de aparición: las que van entre comillas invertidas (admiten espacios) y las sueltas. */
function candidates(answer: string): string[] {
  const found: { at: number; raw: string }[] = []
  for (const m of answer.matchAll(/`([^`\n]+)`/g)) {
    const raw = (m[1] ?? '').trim()
    if (/^(~\/|\/(?!\/))/.test(raw)) found.push({ at: m.index ?? 0, raw })
  }
  for (const m of answer.matchAll(/(?:^|[\s(])((?:~\/|\/Users\/)[^\s`'"<>)\]]+)/g)) {
    found.push({ at: m.index ?? 0, raw: m[1] ?? '' })
  }
  return found
    .sort((a, b) => a.at - b.at)
    .map(f => f.raw.replace(/[.,;:!?)]+$/, '').replace(/:\d+(:\d+)?$/, ''))
}

async function extract($: Engine, answer: string): Promise<Entry[]> {
  const h = await home($)
  const seen = new Set<string>()
  const out: Entry[] = []
  for (const raw of candidates(answer)) {
    const path = raw.startsWith('~/') ? `${h}${raw.slice(1)}` : raw
    if (seen.has(path) || path.includes('\n')) continue
    seen.add(path)
    if (!(await exists($, path, '-e'))) continue
    out.push({ path, isDir: await exists($, path, '-d') })
    if (out.length >= MAX) break
  }
  return out
}

function fmtSize(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / 1024 / 1024).toFixed(1)} MB`
}

function clip(s: string, n: number): string {
  return s.length > n ? `${s.slice(0, n - 1)}…` : s
}

/** Todo lo que el chip y su vista previa necesitan, calculado al terminar la respuesta. */
async function describe($: Engine, e: Entry): Promise<Item> {
  const base = e.path.split('/').filter(Boolean).pop() ?? e.path

  if (e.isDir) {
    const names = (await run($, ['/bin/ls', '-1AF', e.path])).split('\n').filter(Boolean)
    const shown = names.slice(0, 8)
    const more = names.length > shown.length ? [`  … y ${names.length - shown.length} más`] : []
    return {
      path: e.path,
      name: `${clip(base, 26)}/`,
      isDir: true,
      icon: '📁',
      hint: `${names.length}`,
      preview: [`📁 ${names.length} elementos`, ...shown.map(s => `  ${clip(s, 80)}`), ...more],
    }
  }

  const bytes = Number((await run($, ['/usr/bin/stat', '-f', '%z', e.path])).trim()) || 0
  const size = fmtSize(bytes)

  if (IMAGE.test(e.path)) {
    const s = await run($, ['/usr/bin/sips', '-g', 'pixelWidth', '-g', 'pixelHeight', e.path])
    const w = /pixelWidth:\s*(\d+)/.exec(s)?.[1]
    const h = /pixelHeight:\s*(\d+)/.exec(s)?.[1]
    const info = [w && h ? `${w}×${h}` : '', size].filter(Boolean).join(' · ')
    return {
      path: e.path,
      name: clip(base, 28),
      isDir: false,
      icon: '🖼',
      hint: info,
      preview: [`🖼 ${info}`, '  Vista previa de la imagen: /ver N (Quick Look)'],
    }
  }

  if (TEXT.test(e.path) && bytes < 2_000_000) {
    const head = (await run($, ['/usr/bin/head', '-n', '6', e.path])).split('\n').slice(0, 6)
    return {
      path: e.path,
      name: clip(base, 28),
      isDir: false,
      icon: '📄',
      hint: size,
      preview: [`📄 ${size}`, ...head.map(l => `  ${clip(l, 100)}`)],
    }
  }

  const kind = (await run($, ['/usr/bin/file', '-b', e.path])).trim()
  return {
    path: e.path,
    name: clip(base, 28),
    isDir: false,
    icon: '📄',
    hint: size,
    preview: [`📄 ${size}`, `  ${clip(kind, 100)}`],
  }
}

async function go($: Engine, it: Item): Promise<void> {
  await $.process.run(it.isDir ? ['/usr/bin/open', it.path] : ['/usr/bin/open', '-R', it.path])
}

async function closePreview($: Engine): Promise<void> {
  await $.process.run(['/usr/bin/pkill', '-x', 'qlmanage'])
}

/** Quick Look en segundo plano para no bloquear la sesión; la ruta va como argumento, nunca dentro del script. */
async function quickLook($: Engine, e: Entry): Promise<void> {
  if (e.isDir) {
    await $.process.run(['/usr/bin/open', e.path])
    return
  }
  await closePreview($)
  await $.process.run(['/bin/sh', '-c', '/usr/bin/qlmanage -p "$0" >/dev/null 2>&1 &', e.path])
}

async function listing($: Engine, entries: Entry[]): Promise<string> {
  const h = await home($)
  return entries
    .map((e, i) => `  ${i + 1}. ${e.isDir ? '📁' : '📄'} ${h && e.path.startsWith(`${h}/`) ? `~${e.path.slice(h.length)}` : e.path}`)
    .join('\n')
}

async function pick($: Engine, args: string): Promise<{ entry?: Entry; text?: string }> {
  const entries = ((await $.store.get('paths')) as Entry[] | undefined) ?? []
  if (entries.length === 0) return { text: 'La última respuesta no citó ninguna ruta que exista en tu Mac.' }
  const n = Number.parseInt(args.trim(), 10)
  if (!Number.isInteger(n) || n < 1 || n > entries.length) {
    return { text: `Indica un número del 1 al ${entries.length}:\n${await listing($, entries)}` }
  }
  return { entry: entries[n - 1] }
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({ name: 'ver', description: 'Vista previa (Quick Look) de la ruta N citada por Claude; /ver cerrar' })
    await $.command.register({ name: 'abrir', description: 'Abrir la ruta N citada por Claude con su app predeterminada' })
    await $.command.register({ name: 'revelar', description: 'Mostrar en Finder la ruta N citada por Claude' })
    return next(e)
  })

  // Al terminar cada respuesta: detecta las rutas y prepara los chips. Sin rutas, los chips desaparecen.
  on('turn.complete', async ($, e, next) => {
    const result = await next(e)
    if (e.agentId || e.reason !== 'answer') return result
    const entries = e.answer.trim() ? await extract($, e.answer) : []
    await $.store.set('paths', entries)
    const described: Item[] = []
    for (const entry of entries) described.push(await describe($, entry))
    await update($, items, () => described)
    return result
  })

  // Chips sobre el prompt. La vista previa va encima de los chips para que estos no se muevan al mostrarla.
  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const list = await read($, items)
    if (e.props.hasSurvey || list.length === 0) return next(e)

    const { Box, Text, Button } = $.ui.resolve(e)

    return (
      <Box flexDirection="column">
        {list.map((it, i) => (
          <Box key={`preview-${i}`} flexDirection="column" display="none" hover={{ scope: `p${i}`, display: 'flex' }}>
            {it.preview.map((line, j) => (
              <Text key={`line-${j}`} dimColor>
                {line}
              </Text>
            ))}
          </Box>
        ))}
        <Box>
          <Text dimColor>📎 </Text>
          {list.map((it, i) => (
            <Box key={`chip-${i}`} marginRight={2} hover={{ scope: `p${i}` }}>
              <Button
                key={`open-${i}`}
                label={`${it.icon} ${it.name}${it.hint ? ` · ${it.hint}` : ''}`}
                onPress={() => go($, it)}
              />
            </Box>
          ))}
        </Box>
      </Box>
    )
  })

  on('command.run', { command: 'ver' }, async ($, e) => {
    const arg = e.args.trim().toLowerCase()
    if (arg === 'cerrar' || arg === 'stop') {
      await closePreview($)
      return { text: 'Vista previa cerrada.' }
    }
    if (arg === '') {
      const entries = ((await $.store.get('paths')) as Entry[] | undefined) ?? []
      if (entries.length === 0) return { text: 'La última respuesta no citó ninguna ruta que exista en tu Mac.' }
      return { text: `Rutas de la última respuesta (/ver N):\n${await listing($, entries)}` }
    }
    const { entry, text } = await pick($, e.args)
    if (!entry) return { text: text ?? '' }
    await quickLook($, entry)
    return { text: entry.isDir ? `Abierta la carpeta en Finder: ${entry.path}` : `Vista previa (Quick Look): ${entry.path}. Se cierra con Esc o con /ver cerrar.` }
  })

  on('command.run', { command: 'abrir' }, async ($, e) => {
    const { entry, text } = await pick($, e.args)
    if (!entry) return { text: text ?? '' }
    await $.process.run(['/usr/bin/open', entry.path])
    return { text: `Abierto: ${entry.path}` }
  })

  on('command.run', { command: 'revelar' }, async ($, e) => {
    const { entry, text } = await pick($, e.args)
    if (!entry) return { text: text ?? '' }
    await $.process.run(['/usr/bin/open', '-R', entry.path])
    return { text: `Mostrado en Finder: ${entry.path}` }
  })
}
