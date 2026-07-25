import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import Database from 'better-sqlite3'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  PLAN_ENTITLEMENTS,
  PLAN_FEATURES,
  PLAN_NAMES,
  PLAN_PRICES_CENTS,
  SANDBOX_CARDS
} from '../../shared/constants/billing'

/**
 * Billing persistence invariants: pending/failed never activate a plan;
 * confirmed payments upgrade the subscription in the same transaction.
 */
describe('billing SQLite integration', () => {
  let dbPath = ''
  let sqlite: Database.Database

  beforeEach(() => {
    const dir = mkdtempSync(join(tmpdir(), 'taskflow-billing-'))
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
      CREATE TABLE plans (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        price_cents INTEGER NOT NULL,
        currency TEXT NOT NULL DEFAULT 'usd',
        entitlements_json TEXT NOT NULL DEFAULT '[]',
        features_json TEXT NOT NULL DEFAULT '[]',
        active INTEGER NOT NULL DEFAULT 1,
        sort_order INTEGER NOT NULL DEFAULT 0
      );
      CREATE TABLE subscriptions (
        id TEXT PRIMARY KEY NOT NULL,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        plan_id TEXT NOT NULL REFERENCES plans(id),
        status TEXT NOT NULL DEFAULT 'active',
        current_period_end TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE UNIQUE INDEX subscriptions_user_id_uidx ON subscriptions(user_id);
      CREATE TABLE payment_attempts (
        id TEXT PRIMARY KEY NOT NULL,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        plan_id TEXT NOT NULL REFERENCES plans(id),
        amount_cents INTEGER NOT NULL,
        currency TEXT NOT NULL DEFAULT 'usd',
        status TEXT NOT NULL DEFAULT 'pending',
        idempotency_key TEXT NOT NULL,
        failure_reason TEXT,
        created_at TEXT NOT NULL,
        confirmed_at TEXT
      );
      CREATE UNIQUE INDEX payment_attempts_idempotency_uidx
        ON payment_attempts(user_id, idempotency_key);
    `)

    const now = new Date().toISOString()
    for (const [index, planId] of (['free', 'plus', 'pro'] as const).entries()) {
      sqlite
        .prepare(
          `INSERT INTO plans
            (id, name, description, price_cents, entitlements_json, features_json, sort_order)
           VALUES (?, ?, ?, ?, ?, ?, ?)`
        )
        .run(
          planId,
          PLAN_NAMES[planId],
          PLAN_NAMES[planId],
          PLAN_PRICES_CENTS[planId],
          JSON.stringify(PLAN_ENTITLEMENTS[planId]),
          JSON.stringify(PLAN_FEATURES[planId]),
          index
        )
    }

    sqlite
      .prepare(
        `INSERT INTO users (id, email, name, email_verified, created_at, updated_at)
         VALUES ('user_1', 'a@example.com', 'A', 1, ?, ?)`
      )
      .run(now, now)

    sqlite
      .prepare(
        `INSERT INTO subscriptions (id, user_id, plan_id, status, created_at, updated_at)
         VALUES ('sub_1', 'user_1', 'free', 'active', ?, ?)`
      )
      .run(now, now)
  })

  afterEach(() => {
    sqlite.close()
    rmSync(join(dbPath, '..'), { recursive: true, force: true })
  })

  function confirmAttempt(success: boolean) {
    const now = new Date().toISOString()
    sqlite
      .prepare(
        `INSERT INTO payment_attempts
          (id, user_id, plan_id, amount_cents, status, idempotency_key, created_at)
         VALUES ('pay_1', 'user_1', 'plus', 900, 'pending', 'idem_1', ?)`
      )
      .run(now)

    const run = sqlite.transaction(() => {
      if (!success) {
        sqlite
          .prepare(
            `UPDATE payment_attempts
             SET status = 'failed', failure_reason = ?, confirmed_at = ?
             WHERE id = 'pay_1'`
          )
          .run('declined', now)
        return
      }

      sqlite
        .prepare(
          `UPDATE payment_attempts
           SET status = 'confirmed', confirmed_at = ?
           WHERE id = 'pay_1'`
        )
        .run(now)
      sqlite
        .prepare(
          `UPDATE subscriptions
           SET plan_id = 'plus', updated_at = ?
           WHERE user_id = 'user_1'`
        )
        .run(now)
    })
    run()
  }

  it('keeps the free plan when a payment fails', () => {
    confirmAttempt(false)
    const sub = sqlite
      .prepare('SELECT plan_id, status FROM subscriptions WHERE user_id = ?')
      .get('user_1') as { plan_id: string; status: string }
    const pay = sqlite
      .prepare('SELECT status FROM payment_attempts WHERE id = ?')
      .get('pay_1') as { status: string }

    expect(sub.plan_id).toBe('free')
    expect(pay.status).toBe('failed')
    expect(SANDBOX_CARDS.decline).toContain('0002')
  })

  it('upgrades the subscription only when payment is confirmed', () => {
    confirmAttempt(true)
    const sub = sqlite
      .prepare('SELECT plan_id FROM subscriptions WHERE user_id = ?')
      .get('user_1') as { plan_id: string }
    const pay = sqlite
      .prepare('SELECT status FROM payment_attempts WHERE id = ?')
      .get('pay_1') as { status: string }

    expect(pay.status).toBe('confirmed')
    expect(sub.plan_id).toBe('plus')
  })

  it('enforces idempotency uniqueness per user', () => {
    const now = new Date().toISOString()
    const insert = sqlite.prepare(
      `INSERT INTO payment_attempts
        (id, user_id, plan_id, amount_cents, status, idempotency_key, created_at)
       VALUES (?, 'user_1', 'plus', 900, 'pending', 'same_key', ?)`
    )
    insert.run('pay_a', now)
    expect(() => insert.run('pay_b', now)).toThrow()
  })
})
