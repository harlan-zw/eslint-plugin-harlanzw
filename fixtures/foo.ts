export function useCurrentYear() {
  const d = new Date()
  return d.getFullYear()
}
