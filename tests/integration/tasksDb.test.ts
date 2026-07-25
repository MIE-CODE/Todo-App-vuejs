import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import Database from 'better-sqlite3'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * Lightweight integration test against a real SQLite file.
 * We avoid booting full Nuxt here; repositories are the persistence contract.
 */
describe('tasks SQLite integration', () => {
  let dbPath = ''
  let sqlite: Database.Database

  beforeEach(() => {
    const dir = mkdtempSync(join(tmpdir(), 'nmp-tasks-'))
    dbPath = join(dir, 'test.sqlite')
    sqlite = new Database(dbPath)
    sqlite.exec(`
      CREATE TABLE users (
        id TEXT PRIMARY KEY NOT NULL,
        email TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        password_hash TEXT,
        email_verified INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE TABLE tasks (
        id TEXT PRIMARY KEY NOT NULL,
        user_id TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        status TEXT NOT NULL,
        priority TEXT NOT NULL,
        due_date TEXT,
        tags_json TEXT NOT NULL DEFAULT '[]',
        version INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        completed_at TEXT
      );
    `)

    const now = new Date().toISOString()
    sqlite
      .prepare(
        `INSERT INTO users (id, email, name, password_hash, email_verified, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .run('user_1', 'test@example.com', 'Tester', null, 1, now, now)
  })

  afterEach(() => {
    sqlite.close()
    rmSync(join(dbPath, '..'), { recursive: true, force: true })
    vi.restoreAllMocks()
  })

  it('inserts and reads a task row', () => {
    const now = new Date().toISOString()
    sqlite
      .prepare(
        `INSERT INTO tasks
          (id, user_id, title, description, status, priority, due_date, tags_json, version, created_at, updated_at, completed_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        'task_1',
        'user_1',
        'Integration task',
        null,
        'todo',
        'medium',
        null,
        JSON.stringify(['db']),
        1,
        now,
        now,
        null
      )

    const row = sqlite.prepare('SELECT title, tags_json FROM tasks WHERE id = ?').get('task_1') as {
      title: string
      tags_json: string
    }

    expect(row.title).toBe('Integration task')
    expect(JSON.parse(row.tags_json)).toEqual(['db'])
  })
})
