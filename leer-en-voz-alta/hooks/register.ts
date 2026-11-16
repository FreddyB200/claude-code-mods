// Lee en voz alta las respuestas de Claude con `say` (la voz que trae macOS).
//   /leer              lee la última respuesta
//   /leer stop         detiene la lectura
//   /leer auto         activa o desactiva la lectura automática al terminar cada respuesta
//   /leer voz es <v>   cambia la voz en español   (ej.: /leer voz es Paulina)
//   /leer voz en <v>   cambia la voz en inglés    (ej.: /leer voz en Reed (English (US)))
//   /leer velocidad N  palabras por minuto (por defecto 190)
//   /leer estado       muestra la configuración
import type { Hook, Register } from 'claude-code'

// El tipo de `$` (la interfaz del motor), tal como lo recibe cualquier hook.
type Engine = Parameters<Hook<'session.start'>>[0]

type Cfg = { auto: boolean; voiceEs: string; voiceEn: string; rate: number; maxChars: number }

const DEFAULTS: Cfg = {
  auto: false,
  voiceEs: 'Paulina',
  voiceEn: 'Reed (English (US))',
  rate: 190,
  maxChars: 4000,
}

const SAY = '/usr/bin/say'
const PKILL = '/usr/bin/pkill'

async function getCfg($: Engine): Promise<Cfg> {
  const saved = (await $.store.get('cfg')) as Partial<Cfg> | undefined
  return { ...DEFAULTS, ...(saved ?? {}) }
}

async function setCfg($: Engine, cfg: Cfg): Promise<void> {
  await $.store.set('cfg', cfg)
}

/** Quita lo que suena mal en voz alta: código, enlaces, tablas, símbolos de Markdown, emojis. */
function clean(md: string): { text: string; hadCode: boolean } {
  const hadCode = /```/.test(md)
  const text = md
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/^\s{0,3}#{1,6}\s*/gm, '')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*\d+[.)]\s+/gm, '')
    .replace(/^\s*>\s?/gm, '')
    .replace(/^\s*\|?[\s:|-]+\|?\s*$/gm, ' ')
    .replace(/\|/g, ', ')
    .replace(/(\*\*|__|\*|~~)/g, '')
    .replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{FE0F}]/gu, '')
    .replace(/\n{2,}/g, '. ')
    .replace(/\s+/g, ' ')
    .trim()
  return { text, hadCode }
}

/** Heurística simple: ¿hay más palabras comunes del inglés que del español? */
function isEnglish(t: string): boolean {
  const en = new Set(['the', 'and', 'of', 'to', 'is', 'in', 'that', 'it', 'for', 'with', 'you', 'are', 'this', 'on', 'be', 'your'])
  const es = new Set(['el', 'la', 'de', 'que', 'y', 'en', 'un', 'una', 'los', 'las', 'se', 'por', 'con', 'para', 'es', 'lo', 'del', 'tu', 'te'])
  let a = 0
  let b = 0
  for (const w of t.toLowerCase().match(/[a-záéíóúñü']+/g) ?? []) {
    if (en.has(w)) a++
    else if (es.has(w)) b++
  }
  return a > b
}

async function stop($: Engine): Promise<void> {
  await $.process.run([PKILL, '-x', 'say'])
}

/** Lanza `say` en segundo plano para no bloquear la sesión. El texto va como argumento, nunca dentro del script. */
async function speak($: Engine, answer: string): Promise<boolean> {
  const cfg = await getCfg($)
  const { text, hadCode } = clean(answer)
  if (!text) return false
  const english = isEnglish(text)
  let body = text.length > cfg.maxChars ? `${text.slice(0, cfg.maxChars)}…` : text
  if (hadCode) body += english ? ' I skipped the code blocks.' : ' Omití los bloques de código.'
  await stop($)
  await $.process.run([
    '/bin/sh',
    '-c',
    '"$0" -v "$1" -r "$2" "$3" >/dev/null 2>&1 &',
    SAY,
    english ? cfg.voiceEn : cfg.voiceEs,
    String(cfg.rate),
    ` ${body}`, // el espacio inicial evita que un texto que empiece por "-" se lea como opción
  ])
  return true
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'leer',
      description: 'Leer en voz alta la última respuesta (/leer stop, /leer auto, /leer voz, /leer estado)',
    })
    return next(e)
  })

  // Guarda la última respuesta y, si el modo automático está activo, la lee.
  on('turn.complete', async ($, e, next) => {
    if (!e.agentId && e.reason === 'answer' && e.answer.trim()) {
      await $.store.set('last', e.answer)
      if ((await getCfg($)).auto) await speak($, e.answer)
    }
    return next(e)
  })

  on('command.run', { command: 'leer' }, async ($, e) => {
    const [sub = '', ...rest] = e.args.trim().split(/\s+/)
    const cfg = await getCfg($)

    switch (sub.toLowerCase()) {
      case '': {
        const last = (await $.store.get('last')) as string | undefined
        if (!last) return { text: 'Aún no hay ninguna respuesta para leer.' }
        return { text: (await speak($, last)) ? 'Leyendo la última respuesta… (/leer stop para detener)' : 'No hay texto que leer.' }
      }
      case 'stop':
      case 'parar':
        await stop($)
        return { text: 'Lectura detenida.' }
      case 'auto': {
        cfg.auto = rest[0] ? rest[0] === 'on' || rest[0] === 'si' || rest[0] === 'sí' : !cfg.auto
        await setCfg($, cfg)
        return { text: cfg.auto ? 'Lectura automática activada: leeré cada respuesta al terminar.' : 'Lectura automática desactivada.' }
      }
      case 'voz': {
        const lang = rest[0]?.toLowerCase()
        const name = rest.slice(1).join(' ')
        if ((lang !== 'es' && lang !== 'en') || !name) return { text: 'Uso: /leer voz es <nombre>  o  /leer voz en <nombre>. Lista de voces: say -v ?' }
        if (lang === 'es') cfg.voiceEs = name
        else cfg.voiceEn = name
        await setCfg($, cfg)
        return { text: `Voz en ${lang === 'es' ? 'español' : 'inglés'}: ${name}.` }
      }
      case 'velocidad': {
        const n = Number(rest[0])
        if (!Number.isFinite(n) || n < 80 || n > 400) return { text: 'Uso: /leer velocidad <80-400> (palabras por minuto).' }
        cfg.rate = Math.round(n)
        await setCfg($, cfg)
        return { text: `Velocidad: ${cfg.rate} palabras por minuto.` }
      }
      case 'estado':
        return { text: `Automático: ${cfg.auto ? 'sí' : 'no'} · Voz es: ${cfg.voiceEs} · Voz en: ${cfg.voiceEn} · Velocidad: ${cfg.rate} · Máx.: ${cfg.maxChars} caracteres` }
      default:
        return { text: 'Comandos: /leer · /leer stop · /leer auto · /leer voz es|en <nombre> · /leer velocidad N · /leer estado' }
    }
  })
}
