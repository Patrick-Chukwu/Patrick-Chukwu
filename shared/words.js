const SMALL = [
  'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
  'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen',
]
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety']
const SCALES = ['', 'thousand', 'million', 'billion', 'trillion']

const CURRENCY_NAMES = {
  NGN: { major: 'naira', minor: 'kobo', majorPlural: 'naira', minorPlural: 'kobo' },
  USD: { major: 'dollar', minor: 'cent' },
  GBP: { major: 'pound', minor: 'penny', minorPlural: 'pence' },
  EUR: { major: 'euro', minor: 'cent' },
  GHS: { major: 'cedi', minor: 'pesewa' },
  KES: { major: 'shilling', minor: 'cent' },
  ZAR: { major: 'rand', minor: 'cent' },
  CAD: { major: 'dollar', minor: 'cent' },
}

function under100(value) {
  if (value < 20) return SMALL[value]
  const ten = Math.trunc(value / 10)
  const one = value % 10
  return one ? `${TENS[ten]}-${SMALL[one]}` : TENS[ten]
}

function under1000(value) {
  if (value < 100) return under100(value)
  const hundreds = Math.trunc(value / 100)
  const rest = value % 100
  const head = `${SMALL[hundreds]} hundred`
  return rest ? `${head} and ${under100(rest)}` : head
}

export function spellInteger(value) {
  if (!Number.isSafeInteger(value) || value < 0) throw new Error('Cannot spell this number')
  if (value === 0) return 'zero'
  const chunks = []
  let rest = value
  while (rest > 0) {
    chunks.push(rest % 1000)
    rest = Math.trunc(rest / 1000)
  }
  if (chunks.length > SCALES.length) throw new Error('Amount is too large to spell')
  const parts = []
  for (let index = chunks.length - 1; index >= 0; index -= 1) {
    if (!chunks[index]) continue
    const words = under1000(chunks[index])
    parts.push(index ? `${words} ${SCALES[index]}` : words)
  }
  if (parts.length > 1 && chunks[0] > 0 && chunks[0] < 100) {
    const last = parts.pop()
    return `${parts.join(' ')} and ${last}`
  }
  return parts.join(' ')
}

function plural(name, count, explicitPlural) {
  if (count === 1) return name
  return explicitPlural || `${name}s`
}

export function amountInWords(minor, currency = 'NGN') {
  if (!Number.isSafeInteger(minor)) throw new Error('Cannot spell this amount')
  const names = CURRENCY_NAMES[currency] || { major: currency.toLowerCase(), minor: 'cent' }
  const negative = minor < 0
  const abs = Math.abs(minor)
  const major = Math.trunc(abs / 100)
  const fraction = abs % 100
  if (!Number.isSafeInteger(major)) throw new Error('Amount is too large to spell')
  let words = `${spellInteger(major)} ${plural(names.major, major, names.majorPlural)}`
  if (fraction) {
    words += ` and ${spellInteger(fraction)} ${plural(names.minor, fraction, names.minorPlural)}`
  }
  words += ' only'
  if (negative) words = `minus ${words}`
  return words.charAt(0).toUpperCase() + words.slice(1)
}
