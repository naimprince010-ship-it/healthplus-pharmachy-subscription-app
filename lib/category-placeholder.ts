/** First readable letter after trim (fixes names like `" Cheese"`). Fallback `?`. */
export function categoryPlaceholderLetter(name: string): string {
  const t = typeof name === 'string' ? name.trim() : ''
  if (!t) return '?'
  const grapheme = /\p{L}/u.exec(t)?.[0] ?? /[\dA-Za-z]/.exec(t)?.[0]
  return grapheme ? grapheme.toUpperCase() : '?'
}
