import type { LoginInput, RegisterInput } from '#shared/schemas/auth'
import type { SessionUser } from '#shared/types/api'
import { createUserRepository, normalizeEmail } from '../repositories/userRepository'
import { conflictError, unauthorizedError, validationError } from '../utils/errors'
import { hashPassword, verifyPassword } from '../utils/password'

/**
 * AuthService encodes credential business rules.
 * It returns the user id on success; session creation stays in handlers so the
 * H3 event (cookies) is not threaded through the service layer.
 */
export function createAuthService() {
  const users = createUserRepository()

  return {
    async register(input: RegisterInput): Promise<SessionUser> {
      const email = normalizeEmail(input.email)
      const existing = await users.findByEmail(email)

      if (existing) {
        throw conflictError('An account with this email already exists')
      }

      const passwordHash = await hashPassword(input.password)
      const record = await users.createUser({
        email,
        name: input.name,
        passwordHash,
        emailVerified: false
      })

      return users.toSessionUser(record)
    },

    async login(input: LoginInput): Promise<SessionUser> {
      const record = await users.findByEmail(input.email)

      // Generic error + always run a verify to reduce user-enumeration timing signal.
      const dummyHash = `scrypt$${'0'.repeat(32)}$${'0'.repeat(128)}`
      const hash = record?.passwordHash ?? dummyHash
      const valid = await verifyPassword(input.password, hash)

      if (!record || !record.passwordHash || !valid) {
        throw unauthorizedError('Invalid email or password')
      }

      return users.toSessionUser(record)
    },

    async changePassword(
      userId: string,
      currentPassword: string | undefined,
      newPassword: string
    ): Promise<void> {
      const record = await users.findById(userId)
      if (!record) {
        throw unauthorizedError()
      }

      // Accounts that already have a password must confirm the current one.
      if (record.passwordHash) {
        if (!currentPassword) {
          throw validationError('Current password is required', {
            currentPassword: ['Current password is required']
          })
        }

        const valid = await verifyPassword(currentPassword, record.passwordHash)
        if (!valid) {
          throw validationError('Current password is incorrect', {
            currentPassword: ['Current password is incorrect']
          })
        }
      }

      const passwordHash = await hashPassword(newPassword)
      await users.updatePasswordHash(userId, passwordHash)
    }
  }
}
