import { describe, expect, it } from 'vitest'
import { loginSchema, passwordSchema, registerSchema } from '#shared/schemas/auth'

describe('auth schemas', () => {
  it('accepts a valid registration', () => {
    const result = registerSchema.safeParse({
      name: 'Grace Hopper',
      email: 'Grace@Example.com',
      password: 'Secret123'
    })
    expect(result.success).toBe(true)
  })

  it('rejects weak passwords with helpful messages', () => {
    const cases = ['short', 'alllowercase1', 'ALLUPPERCASE1', 'NoNumberHere']
    for (const password of cases) {
      expect(passwordSchema.safeParse(password).success).toBe(false)
    }
  })

  it('requires a valid email', () => {
    const result = registerSchema.safeParse({
      name: 'X',
      email: 'not-an-email',
      password: 'Secret123'
    })
    expect(result.success).toBe(false)
  })

  it('login only requires a non-empty password', () => {
    expect(loginSchema.safeParse({ email: 'a@b.com', password: 'x' }).success).toBe(true)
    expect(loginSchema.safeParse({ email: 'a@b.com', password: '' }).success).toBe(false)
  })
})
