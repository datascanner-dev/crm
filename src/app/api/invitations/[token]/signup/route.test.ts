import { describe, it, expect, vi, beforeEach } from 'vitest'

const h = vi.hoisted(() => ({
  rateLimitOk: true,
  peek: { data: { ok: true }, error: null } as { data: unknown; error: unknown },
  createUser: {
    data: { user: { id: 'user-new' } },
    error: null,
  } as { data: { user: { id: string } | null }; error: { message: string; code?: string } | null },
  signInError: null as { message: string } | null,
  redeemError: null as { message: string; code?: string } | null,
  calls: [] as string[],
}))

vi.mock('next/server', () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) =>
      new Response(JSON.stringify(body), {
        status: init?.status ?? 200,
        headers: { 'Content-Type': 'application/json' },
      }),
  },
}))

vi.mock('@/lib/rate-limit', () => ({
  RATE_LIMITS: { invitationSignup: { limit: 5, windowMs: 900_000 } },
  getClientIp: () => '203.0.113.1',
  checkRateLimit: () => ({ success: h.rateLimitOk }),
  rateLimitResponse: () => new Response(null, { status: 429 }),
}))

vi.mock('@/lib/ai/admin-client', () => ({
  supabaseAdmin: () => ({
    rpc: async (name: string) => {
      h.calls.push(`admin.rpc:${name}`)
      return h.peek
    },
    auth: {
      admin: {
        createUser: async (args: { email_confirm: boolean }) => {
          h.calls.push(`createUser:confirm=${args.email_confirm}`)
          return h.createUser
        },
        deleteUser: async (id: string) => {
          h.calls.push(`deleteUser:${id}`)
          return { error: null }
        },
      },
    },
  }),
}))

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    auth: {
      signInWithPassword: async () => {
        h.calls.push('signIn')
        return { error: h.signInError }
      },
      signOut: async () => ({ error: null }),
    },
    rpc: async (name: string) => {
      h.calls.push(`user.rpc:${name}`)
      return { data: 'acc-1', error: h.redeemError }
    },
  }),
}))

import { POST } from './route'

const VALID = { full_name: 'Maria Silva', email: 'Maria@Example.com', password: 'segredo123' }

function call(body: unknown, token = 'tok-abc') {
  return POST(
    new Request('http://localhost/api/invitations/tok-abc/signup', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    }),
    { params: Promise.resolve({ token }) },
  )
}

describe('POST /api/invitations/[token]/signup', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://supabase.test'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service'
    h.rateLimitOk = true
    h.peek = { data: { ok: true }, error: null }
    h.createUser = { data: { user: { id: 'user-new' } }, error: null }
    h.signInError = null
    h.redeemError = null
    h.calls = []
  })

  it('creates a confirmed user and redeems the invite', async () => {
    const res = await call(VALID)
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true })
    expect(h.calls).toEqual([
      'admin.rpc:peek_invitation',
      'createUser:confirm=true',
      'signIn',
      'user.rpc:redeem_invitation',
    ])
  })

  it('rejects bad input before touching Supabase', async () => {
    for (const body of [
      { ...VALID, email: 'not-an-email' },
      { ...VALID, password: '123' },
      { ...VALID, full_name: '   ' },
      null,
    ]) {
      const res = await call(body)
      expect(res.status).toBe(400)
    }
    expect(h.calls).toEqual([])
  })

  it('refuses an invalid invite without creating a user', async () => {
    h.peek = { data: { ok: false, reason: 'expired' }, error: null }
    const res = await call(VALID)
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: 'invite_invalid' })
    expect(h.calls).not.toContain('createUser:confirm=true')
  })

  it('reports an email that already has an account', async () => {
    h.createUser = {
      data: { user: null },
      error: { message: 'A user with this email address has already been registered', code: 'email_exists' },
    }
    const res = await call(VALID)
    expect(res.status).toBe(409)
    expect(await res.json()).toEqual({ error: 'email_taken' })
  })

  it('deletes the new user when the invite was used in the meantime', async () => {
    h.redeemError = { message: 'invitation used', code: '22023' }
    const res = await call(VALID)
    expect(res.status).toBe(400)
    expect(h.calls).toContain('deleteUser:user-new')
  })

  it('deletes the new user when sign-in fails', async () => {
    h.signInError = { message: 'boom' }
    const res = await call(VALID)
    expect(res.status).toBe(500)
    expect(h.calls).toContain('deleteUser:user-new')
    expect(h.calls).not.toContain('user.rpc:redeem_invitation')
  })

  it('is rate limited', async () => {
    h.rateLimitOk = false
    const res = await call(VALID)
    expect(res.status).toBe(429)
    expect(h.calls).toEqual([])
  })
})
