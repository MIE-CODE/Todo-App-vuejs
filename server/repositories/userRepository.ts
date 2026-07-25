import { and, eq } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import type { OAuthProvider } from '#shared/constants/app'
import type { SessionUser, UserPreferences } from '#shared/types/api'
import { nowIso } from '#shared/utils/date'
import { useDatabase } from '../database/client'
import { oauthIdentities, preferences, users } from '../database/schema'
import type { UserRecord } from '../database/schema'
import { createBillingRepository } from './billingRepository'

const AVATAR_COLORS = [
  '#6366f1',
  '#8b5cf6',
  '#ec4899',
  '#f59e0b',
  '#10b981',
  '#06b6d4',
  '#ef4444'
]

function pickAvatarColor(seed: string): string {
  let hash = 0
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0
  }
  return AVATAR_COLORS[hash % AVATAR_COLORS.length] ?? '#6366f1'
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

/**
 * Repository owns all user/identity/preferences SQL.
 * Services compose these calls; handlers never touch drizzle.
 */
export function createUserRepository() {
  const { db } = useDatabase()

  return {
    async findByEmail(email: string): Promise<UserRecord | null> {
      const [row] = await db
        .select()
        .from(users)
        .where(eq(users.email, normalizeEmail(email)))
        .limit(1)
      return row ?? null
    },

    async findById(id: string): Promise<UserRecord | null> {
      const [row] = await db.select().from(users).where(eq(users.id, id)).limit(1)
      return row ?? null
    },

    async createUser(input: {
      email: string
      name: string
      passwordHash: string | null
      emailVerified: boolean
    }): Promise<UserRecord> {
      const email = normalizeEmail(input.email)
      const timestamp = nowIso()
      const id = `user_${nanoid()}`

      await db.insert(users).values({
        id,
        email,
        name: input.name,
        passwordHash: input.passwordHash,
        avatarColor: pickAvatarColor(email),
        emailVerified: input.emailVerified,
        createdAt: timestamp,
        updatedAt: timestamp
      })

      await db.insert(preferences).values({
        userId: id,
        theme: 'system',
        defaultPriority: 'medium',
        weekStart: 'monday',
        updatedAt: timestamp
      })

      await createBillingRepository().ensureFreeSubscription(id)

      const created = await this.findById(id)
      if (!created) {
        throw new Error('User creation failed')
      }
      return created
    },

    async updateProfile(id: string, input: { name?: string }): Promise<void> {
      await db
        .update(users)
        .set({ name: input.name, updatedAt: nowIso() })
        .where(eq(users.id, id))
    },

    async updatePasswordHash(id: string, passwordHash: string): Promise<void> {
      await db
        .update(users)
        .set({ passwordHash, updatedAt: nowIso() })
        .where(eq(users.id, id))
    },

    async findIdentity(provider: OAuthProvider, providerAccountId: string) {
      const [row] = await db
        .select()
        .from(oauthIdentities)
        .where(
          and(
            eq(oauthIdentities.provider, provider),
            eq(oauthIdentities.providerAccountId, providerAccountId)
          )
        )
        .limit(1)
      return row ?? null
    },

    async listIdentities(userId: string): Promise<OAuthProvider[]> {
      const rows = await db
        .select({ provider: oauthIdentities.provider })
        .from(oauthIdentities)
        .where(eq(oauthIdentities.userId, userId))
      return rows.map((row) => row.provider as OAuthProvider)
    },

    async linkIdentity(input: {
      userId: string
      provider: OAuthProvider
      providerAccountId: string
      email: string | null
    }): Promise<void> {
      await db.insert(oauthIdentities).values({
        id: `oauth_${nanoid()}`,
        userId: input.userId,
        provider: input.provider,
        providerAccountId: input.providerAccountId,
        email: input.email,
        createdAt: nowIso()
      })
    },

    async getPreferences(userId: string): Promise<UserPreferences> {
      const [row] = await db
        .select()
        .from(preferences)
        .where(eq(preferences.userId, userId))
        .limit(1)

      return {
        theme: (row?.theme as UserPreferences['theme']) ?? 'system',
        defaultPriority:
          (row?.defaultPriority as UserPreferences['defaultPriority']) ?? 'medium',
        weekStart: (row?.weekStart as UserPreferences['weekStart']) ?? 'monday'
      }
    },

    async updatePreferences(
      userId: string,
      input: Partial<UserPreferences>
    ): Promise<UserPreferences> {
      const current = await this.getPreferences(userId)
      const next: UserPreferences = { ...current, ...input }

      await db
        .update(preferences)
        .set({
          theme: next.theme,
          defaultPriority: next.defaultPriority,
          weekStart: next.weekStart,
          updatedAt: nowIso()
        })
        .where(eq(preferences.userId, userId))

      return next
    },

    /** Builds the client-safe session user (never leaks the password hash). */
    async toSessionUser(record: UserRecord): Promise<SessionUser> {
      const connectedProviders = await this.listIdentities(record.id)
      const billing = createBillingRepository()
      await billing.ensureFreeSubscription(record.id)
      const subscription = await billing.getSubscription(record.id)

      return {
        id: record.id,
        email: record.email,
        name: record.name,
        emailVerified: record.emailVerified,
        avatarColor: record.avatarColor,
        connectedProviders,
        hasPassword: Boolean(record.passwordHash),
        planId: subscription.planId,
        planStatus: subscription.status,
        entitlements: subscription.entitlements
      }
    }
  }
}
