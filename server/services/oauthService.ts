import type { OAuthProvider } from '#shared/constants/app'
import type { SessionUser } from '#shared/types/api'
import { createUserRepository } from '../repositories/userRepository'

export interface OAuthProfile {
  provider: OAuthProvider
  providerAccountId: string
  email: string
  name: string
}

interface ProviderMeta {
  label: string
  color: string
  icon: string
}

/**
 * Local OAuth simulation.
 *
 * These adapters mimic the redirect -> consent -> callback -> account-linking
 * flow of real providers WITHOUT calling any external API, honoring the app's
 * self-contained constraint. The provider/account-id shape matches real OAuth,
 * so swapping in a genuine Google/GitHub adapter later is a contained change:
 * only the "exchange code for profile" step differs.
 */
export const OAUTH_PROVIDER_META: Record<OAuthProvider, ProviderMeta> = {
  google: { label: 'Google', color: '#ea4335', icon: 'i-simple-icons-google' },
  github: { label: 'GitHub', color: '#181717', icon: 'i-simple-icons-github' }
}

/**
 * Derives a stable synthetic provider account id from the consenting email,
 * so repeated logins with the same mock identity resolve to the same account.
 */
export function deriveProviderAccountId(provider: OAuthProvider, email: string): string {
  const normalized = email.trim().toLowerCase()
  return `${provider}_${Buffer.from(normalized).toString('hex').slice(0, 32)}`
}

/**
 * Server-defined demo identities per provider. Identity is NOT client-supplied,
 * mirroring how a real provider (not the browser) asserts who the user is.
 */
const MOCK_IDENTITIES: Record<OAuthProvider, { email: string; name: string }> = {
  google: { email: 'ada.google@taskflow.app', name: 'Ada (Google)' },
  github: { email: 'linus.github@taskflow.app', name: 'Linus (GitHub)' }
}

export function mockProviderProfile(provider: OAuthProvider): OAuthProfile {
  const identity = MOCK_IDENTITIES[provider]
  return {
    provider,
    providerAccountId: deriveProviderAccountId(provider, identity.email),
    email: identity.email,
    name: identity.name
  }
}

/**
 * Finds an existing linked account, links to a matching email account, or
 * creates a brand-new user. Returns the session user to log in.
 */
export async function resolveOAuthLogin(profile: OAuthProfile): Promise<SessionUser> {
  const users = createUserRepository()

  const identity = await users.findIdentity(profile.provider, profile.providerAccountId)
  if (identity) {
    const record = await users.findById(identity.userId)
    if (record) {
      return users.toSessionUser(record)
    }
  }

  // Link to an existing account with the same verified email, if present.
  const existing = await users.findByEmail(profile.email)
  if (existing) {
    await users.linkIdentity({
      userId: existing.id,
      provider: profile.provider,
      providerAccountId: profile.providerAccountId,
      email: profile.email
    })
    return users.toSessionUser(existing)
  }

  // Otherwise provision a new, email-verified account (provider vouches for email).
  const created = await users.createUser({
    email: profile.email,
    name: profile.name,
    passwordHash: null,
    emailVerified: true
  })

  await users.linkIdentity({
    userId: created.id,
    provider: profile.provider,
    providerAccountId: profile.providerAccountId,
    email: profile.email
  })

  return users.toSessionUser(created)
}
