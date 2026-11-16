// El programa que habla: JavaScript for Automation (lo ejecuta `osascript`) con AVSpeechSynthesizer, que
// alcanza las voces de Siri (el comando `say` no). Lee LEER_TEXT (lo que dice), LEER_VOICE (nombre de una
// voz; vacío: la mejor para el idioma) y LEER_SPEED (1 = el ritmo normal de la voz). El idioma lo
// detecta del propio texto.
//
// Adaptado del plugin Narrator de https://github.com/midudev/better-claude (licencia MIT,
// © Miguel Ángel Durán). Se quitaron las partes de la cola entre ventanas y del idioma fijo.

/** Marca única dentro del programa: `pkill -f` la usa para detener solo esta lectura. */
export const MARKER = 'LEER_EN_VOZ_ALTA_PROCESS'

export const MACOS = String.raw`
// ${MARKER}
ObjC.import('AVFoundation')
ObjC.import('NaturalLanguage')

function run () {
  const env = $.NSProcessInfo.processInfo.environment
  const read = key => { const value = env.objectForKey(key); return value.isNil() ? '' : ObjC.unwrap(value) }
  const text = read('LEER_TEXT')
  const wanted = read('LEER_VOICE').toLowerCase()
  const speed = Number(read('LEER_SPEED')) || 1
  if (!text) return

  const found = $.NLLanguageRecognizer.dominantLanguageForString(text)
  const language = found.isNil() ? 'en' : ObjC.unwrap(found)

  const all = $.AVSpeechSynthesisVoice.speechVoices
  const voices = []
  for (let i = 0; i < all.count; i++) {
    const voice = all.objectAtIndex(i)
    voices.push({ voice, id: ObjC.unwrap(voice.identifier), name: ObjC.unwrap(voice.name), lang: ObjC.unwrap(voice.language), quality: Number(voice.quality) })
  }

  // Las regiones preferidas para un idioma: la tuya (es-MX antes que es-ES) y la habitual.
  const regionsFor = language => {
    const regions = []
    const preferred = $.NSLocale.preferredLanguages
    for (let i = 0; i < preferred.count; i++) {
      const [lang, region] = ObjC.unwrap(preferred.objectAtIndex(i)).split('-')
      if (lang === language && region) regions.push(region)
    }
    const country = $.NSLocale.currentLocale.countryCode
    if (!country.isNil()) regions.push(ObjC.unwrap(country))
    regions.push({ de: 'DE', en: 'US', es: 'ES', fr: 'FR', it: 'IT', ja: 'JP', pt: 'BR', zh: 'CN' }[language] || '')
    return regions
  }
  // Primero las voces naturales de Siri, luego premium sobre mejorada sobre compacta, luego la región preferida.
  // Las voces de fantasía (Bahh, Grandpa...) van al final.
  const best = language => {
    const regions = regionsFor(language)
    const near = v => { const at = regions.indexOf(v.lang.split('-')[1]); return at < 0 ? 0 : 50 - at * 10 }
    const score = v =>
      (v.id.includes('.siri.') ? 1000 : 0) + v.quality * 100 + near(v) - (v.id.includes('.super-compact.') ? 1 : 0) -
      (/\.(speech\.synthesis|eloquence)\./.test(v.id) ? 10000 : 0)
    return voices.filter(v => v.lang.split('-')[0] === language).sort((a, b) => score(b) - score(a))[0]
  }
  // Un nombre que comparten varios idiomas (Eddy) se lee en el idioma del texto.
  const isNamed = v => [v.id, v.name, v.name + ' (' + v.lang + ')'].some(name => name.toLowerCase() === wanted)
  const inLanguage = v => (v.lang.split('-')[0] === language ? 1 : 0)
  const named = wanted && voices.filter(isNamed).sort((a, b) => inLanguage(b) - inLanguage(a) || b.quality - a.quality)[0]
  const picked = named || best(language) || best('en')

  const synth = $.AVSpeechSynthesizer.alloc.init
  const utterance = $.AVSpeechUtterance.speechUtteranceWithString(text)
  if (picked) utterance.voice = picked.voice
  // El ritmo normal de la voz es 0.5; cada 0.1 por encima habla 0.6 veces más rápido y cada 0.1 por debajo 0.088 más lento.
  utterance.rate = Math.min(Math.max(speed >= 1 ? 0.5 + (speed - 1) / 6 : 0.5 - (1 - speed) / 0.88, 0), 1)
  synth.speakUtterance(utterance)

  // El proceso debe seguir vivo mientras habla.
  const loop = $.NSRunLoop.currentRunLoop
  let started = false
  for (let i = 0; i < 6000; i++) {
    loop.runUntilDate($.NSDate.dateWithTimeIntervalSinceNow(0.1))
    if (synth.speaking) started = true
    else if (started || i > 30) break
  }
}
`
