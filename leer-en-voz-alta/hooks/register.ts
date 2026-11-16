// Lee en voz alta las respuestas de Claude con la mejor voz de tu Mac, incluidas las de Siri
// (el mismo motor de voz que usa el plugin Narrator).
//   /leer              lee la última respuesta
//   /leer stop         detiene la lectura
//   /leer auto         activa o desactiva la lectura automática al terminar cada respuesta
//   /leer voz <nombre> fija una voz (ej.: /leer voz Eddy (es-MX)); /leer voz auto vuelve a la mejor
//   /leer velocidad N  1 = ritmo normal de la voz; de 0.5 a 2 (por defecto 1.2)
//   /leer estado       muestra la configuración
import type { Hook, Register } from 'claude-code'

import { MACOS, MARKER } from './speaker'

type Engine = Parameters<Hook<'session.start'>>[0]

type Cfg = { auto: boolean; voice: string; speed: number; maxChars: number }

const DEFAULTS: Cfg = {
  auto: false,
  voice: '', // vacío: la mejor voz instalada para el idioma del texto
  speed: 1.2,
  maxChars: 4000,
}

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

/** Heurística simple, solo para decidir en qué idioma va el aviso final sobre los bloques de código. */
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

/** Detiene solo esta lectura (la marca va dentro del programa de voz), no la de otros plugins. */
async function stop($: Engine): Promise<void> {
  await $.process.run(['/usr/bin/pkill', '-f', MARKER])
}

/**
 * Lanza el programa de voz en segundo plano para no bloquear la sesión. El texto, la voz y la velocidad
 * van por variables de entorno, nunca dentro del script.
 */
async function speak($: Engine, answer: string): Promise<boolean> {
  const cfg = await getCfg($)
  const { text, hadCode } = clean(answer)
  if (!text) return false
  let body = text.length > cfg.maxChars ? `${text.slice(0, cfg.maxChars)}…` : text
  if (hadCode) body += isEnglish(text) ? ' I skipped the code blocks.' : ' Omití los bloques de código.'
  await stop($)
  await $.process.run(['/bin/sh', '-c', '/usr/bin/osascript -l JavaScript -e "$0" >/dev/null 2>&1 &', MACOS], {
    env: { LEER_TEXT: body, LEER_VOICE: cfg.voice, LEER_SPEED: String(cfg.speed) },
  })
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
        const name = rest.join(' ')
        if (!name) return { text: `Voz actual: ${cfg.voice || 'la mejor disponible (automática)'}. Uso: /leer voz <nombre> o /leer voz auto. Los nombres: /narrator voices.` }
        cfg.voice = name.toLowerCase() === 'auto' ? '' : name
        await setCfg($, cfg)
        return { text: cfg.voice ? `Voz fijada: ${cfg.voice}.` : 'Voz automática: la mejor disponible para el idioma de cada texto.' }
      }
      case 'velocidad': {
        const n = Number(rest[0])
        if (!Number.isFinite(n) || n < 0.5 || n > 2) return { text: 'Uso: /leer velocidad <0.5-2> (1 = ritmo normal de la voz).' }
        cfg.speed = n
        await setCfg($, cfg)
        return { text: `Velocidad: ${cfg.speed}.` }
      }
      case 'estado':
        return { text: `Automático: ${cfg.auto ? 'sí' : 'no'} · Voz: ${cfg.voice || 'automática (la mejor, incluidas las de Siri)'} · Velocidad: ${cfg.speed} · Máx.: ${cfg.maxChars} caracteres` }
      default:
        return { text: 'Comandos: /leer · /leer stop · /leer auto · /leer voz <nombre|auto> · /leer velocidad N · /leer estado' }
    }
  })
}
