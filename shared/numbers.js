export function formatDocumentNumber(prefix, year, seq) {
  return `${prefix}-${year}-${String(seq).padStart(4, '0')}`
}
