// utils.js
export function getBreakpoint() {
  const w = window.innerWidth
  if (w < 600) return 'mobile'
  if (w < 1024) return 'tablet'
  return 'desktop'
}