function parseCmap(source) {
  const map = new Map()
  const ranges = source.matchAll(/<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>\s*\[([\s\S]*?)\]/g)
  for (const match of ranges) {
    const start = Number.parseInt(match[1], 16)
    const tokens = [...match[3].matchAll(/<([^>]+)>/g)].map((item) => item[1].trim())
    tokens.forEach((token, index) => {
      const codes = token.split(/\s+/).map((part) => Number.parseInt(part, 16)).filter((code) => code > 0)
      if (codes.length) map.set(start + index, codes)
    })
  }
  return map
}

function decodeHex(hex, map) {
  let text = ''
  for (let index = 0; index < hex.length; index += 4) {
    const glyph = Number.parseInt(hex.slice(index, index + 4), 16)
    const codes = map.get(glyph)
    if (codes) text += String.fromCodePoint(...codes)
  }
  return text
}

export function extractPdfText(buffer) {
  const source = buffer.toString('latin1')
  const objects = new Map()
  for (const match of source.matchAll(/(\d+)\s+0\s+obj\s*([\s\S]*?)\nendobj/g)) {
    objects.set(match[1], match[2])
  }
  const fontToUnicode = new Map()
  for (const [id, body] of objects) {
    const unicode = body.match(/\/ToUnicode\s+(\d+)\s+0\s+R/)
    if (unicode) fontToUnicode.set(id, unicode[1])
  }
  const fonts = new Map()
  for (const match of source.matchAll(/\/(F\d+)\s+(\d+)\s+0\s+R/g)) {
    const unicodeId = fontToUnicode.get(match[2])
    if (!unicodeId || !objects.has(unicodeId)) continue
    fonts.set(match[1], parseCmap(objects.get(unicodeId)))
  }
  let active = fonts.values().next().value || new Map()
  let text = ''
  const tokens = source.split(/(\/F\d+\s+[\d.]+\s+Tf|<([0-9A-Fa-f]{4})+>)/)
  tokens.forEach((token) => {
    if (!token) return
    const font = token.match(/^\/(F\d+)\s+[\d.]+\s+Tf$/)
    if (font && fonts.has(font[1])) {
      active = fonts.get(font[1])
      return
    }
    const hex = token.match(/^<([0-9A-Fa-f]+)>$/)
    if (hex) text += decodeHex(hex[1], active)
  })
  return text
}
