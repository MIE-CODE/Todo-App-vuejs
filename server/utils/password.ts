import { randomBytes, scrypt, scryptSync, timingSafeEqual } from 'node:crypto'

/**
 * Password hashing using Node's built-in scrypt KDF.
 *
 * Why scrypt (not bcrypt/argon2 packages): it is memory-hard, standardized, and
 * ships inside Node core, so the app stays fully self-contained with no extra
 * native build step. The stored format is algorithm-tagged so we can migrate
 * to Argon2id later without breaking existing hashes.
 *
 * Uses scrypt's secure defaults (N=16384, r=8, p=1). Format:
 *   scrypt$<saltHex>$<derivedHex>
 */
const KEY_LEN = 64

function deriveKey(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, KEY_LEN, (error, derivedKey) => {
      if (error) {
        reject(error)
      } else {
        resolve(derivedKey)
      }
    })
  })
}

function serialize(salt: Buffer, derived: Buffer): string {
  return `scrypt$${salt.toString('hex')}$${derived.toString('hex')}`
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16)
  const derived = await deriveKey(password, salt)
  return serialize(salt, derived)
}

/** Synchronous variant used only for deterministic database seeding. */
export function hashPasswordSync(password: string): string {
  const salt = randomBytes(16)
  const derived = scryptSync(password, salt, KEY_LEN)
  return serialize(salt, derived)
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split('$')

  if (parts.length !== 3 || parts[0] !== 'scrypt') {
    return false
  }

  const saltHex = parts[1] ?? ''
  const derivedHex = parts[2] ?? ''
  const salt = Buffer.from(saltHex, 'hex')
  const expected = Buffer.from(derivedHex, 'hex')

  if (expected.length === 0) {
    return false
  }

  const derived = await deriveKey(password, salt)

  if (derived.length !== expected.length) {
    return false
  }

  return timingSafeEqual(derived, expected)
}
