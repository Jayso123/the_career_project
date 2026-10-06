/** Where to go after login: the protected path we bounced from, else /dashboard. */
export function redirectTarget(state: unknown): string {
  const from = (state as { from?: unknown } | null)?.from
  return typeof from === 'string' && from.startsWith('/') && !from.startsWith('//') && !from.startsWith('/\\') ? from : '/dashboard'
}
