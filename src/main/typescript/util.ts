export function waitFor(delay: number): Promise<void> {
  return new Promise(res => setTimeout(res, delay))
}