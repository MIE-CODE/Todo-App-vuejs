import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import Database from 'better-sqlite3'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { hashPasswordSync, verifyPassword } from '../../server/utils/password'

/**
 * Integration test for the auth persistence layer against a real SQLite file.
 * Mirrors the DDL in server/database/client.ts and validates the register/login,
 * session lifecycle, and OAuth account-linking invariants end to end at the DB.
 */
describe('auth SQLite integration', () => {
  let dbPath = ''
  let sqlite: Database.Database

  beforeEach(() => {
    const dir = mkdtempSync(join(tmpdir(), 'taskflow-auth-'))
    dbPath = join(dir, 'test.sqlite')
    sqlite = new Database(dbPath)
    sqlite.pragma('foreign_keys = ON')
    sqlite.exec(`
      CREATE TABLE users (
        id TEXT PRIMARY KEY NOT NULL,
        email TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        password_hash TEXT,
        avatar_color TEXT NOT NULL DEFAULT '#6366f1',
        email_verified INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE TABLE sessions (
        id TEXT PRIMARY KEY NOT NULL,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        expires_at TEXT NOT NULL,
        created_at TEXT NOT NULL,
        last_used_at TEXT NOT NULL
      );
      CREATE TABLE oauth_identities (
        id TEXT PRIMARY KEY NOT NULL,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        provider TEXT NOT NULL,
        provider_account_id TEXT NOT NULL,
        email TEXT,
        created_at TEXT NOT NULL
      );
      CREATE UNIQUE INDEX oauth_provider_account_idx
        ON oauth_identities(provider, provider_account_id);
    `)
  })

  afterEach(() => {
    sqlite.close()
    rmSync(join(dbPath, '..'), { recursive: true, force: true })
  })

  function insertUser(email: string, password: string | null) {
    const now = new Date().toISOString()
    const id = `user_${email}`
    sqlite
      .prepare(
        `INSERT INTO users (id, email, name, password_hash, email_verified, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .run(id, email, 'Tester', password ? hashPasswordSync(password) : null, 1, now, now)
    return id
  }

  it('stores a verifiable password hash and never plaintext', async () => {
    insertUser('a@example.com', 'Secret123')
    const row = sqlite
      .prepare('SELECT password_hash FROM users WHERE email = ?')
      .get('a@example.com') as { password_hash: string }

    expect(row.password_hash).not.toContain('Secret123')
    expect(await verifyPassword('Secret123', row.password_hash)).toBe(true)
    expect(await verifyPassword('Wrong', row.password_hash)).toBe(false)
  })

  it('cascades session deletion when a user is removed', () => {
    const userId = insertUser('b@example.com', 'Secret123')
    const now = new Date().toISOString()
    sqlite
      .prepare(
        `INSERT INTO sessions (id, user_id, expires_at, created_at, last_used_at)
         VALUES (?, ?, ?, ?, ?)`
      )
      .run('sess_1', userId, now, now, now)

    sqlite.prepare('DELETE FROM users WHERE id = ?').run(userId)
    const count = sqlite.prepare('SELECT COUNT(*) c FROM sessions').get() as { c: number }
    expect(count.c).toBe(0)
  })

  it('enforces one identity per provider account', () => {
    const userId = insertUser('c@example.com', null)
    const now = new Date().toISOString()
    const insert = sqlite.prepare(
      `INSERT INTO oauth_identities (id, user_id, provider, provider_account_id, email, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    insert.run('oauth_1', userId, 'github', 'gh_123', 'c@example.com', now)

    expect(() => insert.run('oauth_2', userId, 'github', 'gh_123', 'c@example.com', now)).toThrow()
    // A different provider with the same account id is allowed.
    expect(() =>
      insert.run('oauth_3', userId, 'google', 'gh_123', 'c@example.com', now)
    ).not.toThrow()
  })
})
