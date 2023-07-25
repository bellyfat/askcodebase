export function randomString() {
  const randomStr = Math.random().toString(36).slice(2, 7)
  return randomStr + Math.random().toString(36).slice(2, 7)
}
