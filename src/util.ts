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