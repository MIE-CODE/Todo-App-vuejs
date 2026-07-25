import { desc, eq, ne, and } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import type { H3Event } from 'h3'
import { SESSION_COOKIE_NAME } from '#shared/constants/app'
import type { SessionSummary, SessionUser } from '#shared/types/api'
import { nowIso } from '#shared/utils/date'
import { useDatabase } from '../database/client'
import { sessions, users } from '../database/schema'
import { createUserRepository } from '../repositories/userRepository'

const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 14

function cookieOptions(maxAgeSeconds: number) {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: !import.meta.dev,
    path: '/',
    maxAge: maxAgeSeconds
  }
}

/**
 * Creates a fresh session row and sets the httpOnly cookie.
 * Session ids are opaque random tokens; we never derive them from user data.
 */
export async function createSession(event: H3Event, userId: string): Promise<string> {
  const { db } = useDatabase()
  const id = `sess_${nanoid(40)}`
  const timestamp = nowIso()
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString()

  await db.insert(sessions).values({
    id,
    userId,
    userAgent: getHeader(event, 'user-agent') ?? null,
    ipAddress: getRequestIP(event, { xForwardedFor: true }) ?? null,
    expiresAt,
    createdAt: timestamp,
    lastUsedAt: timestamp
  })

  setCookie(event, SESSION_COOKIE_NAME, id, cookieOptions(SESSION_TTL_MS / 1000))
  return id
}

/**
 * Rotates the session id while preserving the login.
 * Called right after privilege changes (login) to defeat session fixation.
 */
export async function rotateSession(event: H3Event, currentId: string): Promise<string> {
  const { db } = useDatabase()
  const [existing] = await db.select().from(sessions).where(eq(sessions.id, currentId)).limit(1)

  if (!existing) {
    throw new Error('Cannot rotate a missing session')
  }

  await db.delete(sessions).where(eq(sessions.id, currentId))
  return createSession(event, existing.userId)
}

export async function destroyCurrentSession(event: H3Event): Promise<void> {
  const sessionId = getCookie(event, SESSION_COOKIE_NAME)

  if (sessionId) {
    const { db } = useDatabase()
    await db.delete(sessions).where(eq(sessions.id, sessionId))
  }

  deleteCookie(event, SESSION_COOKIE_NAME, { path: '/' })
}

export async function revokeOtherSessions(event: H3Event, userId: string): Promise<number> {
  const currentId = getCookie(event, SESSION_COOKIE_NAME)
  const { db } = useDatabase()

  const removed = await db
    .delete(sessions)
    .where(
      currentId
        ? and(eq(sessions.userId, userId), ne(sessions.id, currentId))
        : eq(sessions.userId, userId)
    )
    .returning({ id: sessions.id })

  return removed.length
}

export async function listSessions(event: H3Event, userId: string): Promise<SessionSummary[]> {
  const currentId = getCookie(event, SESSION_COOKIE_NAME)
  const { db } = useDatabase()

  const rows = await db
    .select()
    .from(sessions)
    .where(eq(sessions.userId, userId))
    .orderBy(desc(sessions.lastUsedAt))

  return rows.map((row) => ({
    id: row.id,
    current: row.id === currentId,
    userAgent: row.userAgent,
    createdAt: row.createdAt,
    lastUsedAt: row.lastUsedAt,
    expiresAt: row.expiresAt
  }))
}

/**
 * Resolves the current user from the session cookie, or null.
 * Expired sessions are cleaned up lazily and touch lastUsedAt on hit.
 */
export async function getOptionalUser(event: H3Event): Promise<SessionUser | null> {
  if (event.context.user) {
    return event.context.user
  }

  const sessionId = getCookie(event, SESSION_COOKIE_NAME)
  if (!sessionId) {
    return null
  }

  const { db } = useDatabase()
  const [row] = await db
    .select({
      sessionId: sessions.id,
      expiresAt: sessions.expiresAt,
      userId: users.id
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(eq(sessions.id, sessionId))
    .limit(1)

  if (!row) {
    deleteCookie(event, SESSION_COOKIE_NAME, { path: '/' })
    return null
  }

  if (new Date(row.expiresAt).getTime() < Date.now()) {
    await db.delete(sessions).where(eq(sessions.id, sessionId))
    deleteCookie(event, SESSION_COOKIE_NAME, { path: '/' })
    return null
  }

  await db.update(sessions).set({ lastUsedAt: nowIso() }).where(eq(sessions.id, sessionId))

  const repository = createUserRepository()
  const record = await repository.findById(row.userId)
  if (!record) {
    return null
  }

  const user = await repository.toSessionUser(record)
  event.context.user = user
  return user
}

declare module 'h3' {
  interface H3EventContext {
    user?: SessionUser
  }
}
