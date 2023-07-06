export function randomString() {
  return Math.random().toString(36).slice(0, 5) + Math.random().toString(36).slice(0, 5)
}
