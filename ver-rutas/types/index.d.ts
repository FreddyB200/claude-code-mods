export type Item = {
  path: string
  name: string
  isDir: boolean
  icon: string
  /** Dato corto que se ve siempre junto al nombre: nº de elementos, tamaño, dimensiones. */
  hint: string
  /** Líneas de la vista previa que aparece al pasar el cursor. */
  preview: string[]
}

declare module 'claude-code' {
  interface PluginState {
    'ver-rutas': { items: Item[] }
  }
}
