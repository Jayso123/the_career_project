/** Where to go after login: the protected path we bounced from, else /dashboard. */
export function redirectTarget(state: unknown): string {
  const from = (state as { from?: unknown } | null)?.from
  return typeof from === 'string' && from.startsWith('/') && !from.startsWith('//') && !from.startsWith('/\\') ? from : '/dashboard'
}

/** Booking router state to restore after login (set by the pay flow when a guest clicks Pay). */
export function redirectState(state: unknown): unknown {
  const booking = (state as { booking?: unknown } | null)?.booking
  return redirectTarget(state) === '/payment' && booking && typeof booking === 'object' ? booking : undefined
}
