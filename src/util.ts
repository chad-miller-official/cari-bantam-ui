export function waitFor(delay: number): Promise<void> {
  return new Promise(res => setTimeout(res, delay))
}

const _DATE_TIME_FORMAT = new Intl.DateTimeFormat(navigator.language, {
  month: 'long',
  day: 'numeric',
  year: 'numeric',
})

export function dateToString(date: Date) {
  return _DATE_TIME_FORMAT.format(date)
}

export function invertColor(colorHex: string): string {
  const colorHexParts = colorHex.slice(1).match(/.{2}/g)
  const [red, green, blue] = colorHexParts.map(part => parseInt(part, 16))

  // These values came from https://stackoverflow.com/a/3943023/112731
  return ((red * 0.299) + (green * 0.587) + (blue * 0.114)) > 186 ? '#000000' : '#ffffff'
}