export function displayCategoryName(name: string) {
  const hasLatinLetters = /[A-Za-z]/.test(name)
  if (!hasLatinLetters || name !== name.toUpperCase()) return name
  return name.toLowerCase().replace(/\b[a-z]/g, (letter) => letter.toUpperCase())
}
