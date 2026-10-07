// @vitest-environment jsdom
import type { ReactNode } from 'react'
import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const order: string[] = []
const authSignOut = vi.fn(async () => { order.push('signOut'); return { error: null } })
vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: async () => ({ data: { session: null } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signOut: () => authSignOut(),
    },
  },
}))
const { AuthProvider, useAuth } = await import('./AuthContext')

const wrapper = ({ children }: { children: ReactNode }) => <AuthProvider>{children}</AuthProvider>
beforeEach(() => { order.length = 0; authSignOut.mockClear(); vi.useFakeTimers() })
afterEach(() => { cleanup(); vi.useRealTimers() })

describe('AuthContext.signOut', () => {
  it('awaits before-sign-out work first, then drops the session', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper })
    await act(() => vi.advanceTimersByTimeAsync(0))
    result.current.onBeforeSignOut(async () => { await new Promise((r) => setTimeout(r, 100)); order.push('flushed') })
    let p!: Promise<unknown>
    act(() => { p = result.current.signOut() })
    await act(() => vi.advanceTimersByTimeAsync(200))
    await p
    expect(order).toEqual(['flushed', 'signOut'])
    expect(vi.getTimerCount()).toBe(0) // the cap timer was cleared when the flush won
  })

  it('never blocks sign-out on a stalled flusher (4 s cap)', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper })
    await act(() => vi.advanceTimersByTimeAsync(0))
    result.current.onBeforeSignOut(() => new Promise(() => {})) // never settles
    let done = false
    let p!: Promise<unknown>
    act(() => { p = result.current.signOut().then(() => { done = true }) })
    await act(() => vi.advanceTimersByTimeAsync(3900))
    expect(done).toBe(false)
    expect(authSignOut).not.toHaveBeenCalled()
    await act(() => vi.advanceTimersByTimeAsync(200))
    await p
    expect(done).toBe(true)
    expect(authSignOut).toHaveBeenCalledTimes(1)
  })
})
