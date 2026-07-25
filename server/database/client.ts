import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { hashPasswordSync } from '../utils/password'
import * as schema from './schema'

let sqlite: Database.Database | null = null
let db: ReturnType<typeof drizzle<typeof schema>> | null = null

/**
 * Singleton SQLite connection for the Nitro process.
 * Opening a new connection per request is wasteful and can lock the file.
 */
export function useDatabase() {
  if (db && sqlite) {
    return { db, sqlite }
  }

  const config = useRuntimeConfig()
  const databasePath = resolve(process.cwd(), config.databasePath)

  mkdirSync(dirname(databasePath), { recursive: true })

  sqlite = new Database(databasePath)
  sqlite.pragma('journal_mode = WAL')
  sqlite.pragma('foreign_keys = ON')

  db = drizzle(sqlite, { schema })

  ensureSchema(sqlite)
  seedIfEmpty(sqlite)

  return { db, sqlite }
}

function ensureSchema(connection: Database.Database) {
  connection.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY NOT NULL,
      email TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      password_hash TEXT,
      avatar_color TEXT NOT NULL DEFAULT '#6366f1',
      email_verified INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY NOT NULL,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      user_agent TEXT,
      ip_address TEXT,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      last_used_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions(user_id);

    CREATE TABLE IF NOT EXISTS oauth_identities (
      id TEXT PRIMARY KEY NOT NULL,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      provider TEXT NOT NULL,
      provider_account_id TEXT NOT NULL,
      email TEXT,
      created_at TEXT NOT NULL
    );
    CREATE UNIQUE INDEX IF NOT EXISTS oauth_provider_account_idx
      ON oauth_identities(provider, provider_account_id);
    CREATE INDEX IF NOT EXISTS oauth_user_id_idx ON oauth_identities(user_id);

    CREATE TABLE IF NOT EXISTS preferences (
      user_id TEXT PRIMARY KEY NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      theme TEXT NOT NULL DEFAULT 'system',
      default_priority TEXT NOT NULL DEFAULT 'medium',
      week_start TEXT NOT NULL DEFAULT 'monday',
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY NOT NULL,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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

    CREATE INDEX IF NOT EXISTS tasks_user_id_idx ON tasks(user_id);
    CREATE INDEX IF NOT EXISTS tasks_status_idx ON tasks(status);
    CREATE INDEX IF NOT EXISTS tasks_priority_idx ON tasks(priority);
    CREATE INDEX IF NOT EXISTS tasks_due_date_idx ON tasks(due_date);
  `)
}

function daysFromNow(days: number): string {
  const date = new Date()
  date.setUTCHours(12, 0, 0, 0)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString()
}

/**
 * Seeds a realistic demo account so the product is explorable immediately.
 * Credentials: demo@taskflow.app / Demo123!pass
 */
function seedIfEmpty(connection: Database.Database) {
  const userCount = connection.prepare('SELECT COUNT(*) as count FROM users').get() as {
    count: number
  }

  if (userCount.count > 0) {
    return
  }

  const now = new Date().toISOString()
  const demoUserId = 'user_demo_001'

  connection
    .prepare(
      `INSERT INTO users (id, email, name, password_hash, avatar_color, email_verified, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      demoUserId,
      'demo@taskflow.app',
      'Demo User',
      hashPasswordSync('Demo123!pass'),
      '#6366f1',
      1,
      now,
      now
    )

  connection
    .prepare(
      `INSERT INTO preferences (user_id, theme, default_priority, week_start, updated_at)
       VALUES (?, ?, ?, ?, ?)`
    )
    .run(demoUserId, 'system', 'medium', 'monday', now)

  const seedTasks = [
    {
      id: 'task_seed_001',
      title: 'Plan the week ahead',
      description: 'Block focus time and set the top three priorities.',
      status: 'in_progress',
      priority: 'high',
      dueDate: daysFromNow(0),
      tags: ['planning'],
      completed: false
    },
    {
      id: 'task_seed_002',
      title: 'Reply to outstanding emails',
      description: 'Clear the inbox down to zero before lunch.',
      status: 'todo',
      priority: 'medium',
      dueDate: daysFromNow(1),
      tags: ['communication'],
      completed: false
    },
    {
      id: 'task_seed_003',
      title: 'Grocery run',
      description: 'Milk, eggs, coffee, and vegetables for the week.',
      status: 'todo',
      priority: 'low',
      dueDate: daysFromNow(2),
      tags: ['home', 'errands'],
      completed: false
    },
    {
      id: 'task_seed_004',
      title: 'Finish quarterly report',
      description: 'Compile metrics and write the executive summary.',
      status: 'todo',
      priority: 'urgent',
      dueDate: daysFromNow(3),
      tags: ['work'],
      completed: false
    },
    {
      id: 'task_seed_005',
      title: 'Morning workout',
      description: '30 minutes of cardio.',
      status: 'done',
      priority: 'medium',
      dueDate: daysFromNow(-1),
      tags: ['health'],
      completed: true
    },
    {
      id: 'task_seed_006',
      title: 'Read a chapter',
      description: 'Continue the current book before bed.',
      status: 'done',
      priority: 'low',
      dueDate: daysFromNow(-2),
      tags: ['personal'],
      completed: true
    },
    {
      id: 'task_seed_007',
      title: 'Book dentist appointment',
      description: 'Schedule the routine checkup.',
      status: 'todo',
      priority: 'medium',
      dueDate: daysFromNow(5),
      tags: ['health', 'errands'],
      completed: false
    }
  ]

  const insertTask = connection.prepare(
    `INSERT INTO tasks
      (id, user_id, title, description, status, priority, due_date, tags_json, version, created_at, updated_at, completed_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )

  for (const task of seedTasks) {
    insertTask.run(
      task.id,
      demoUserId,
      task.title,
      task.description,
      task.status,
      task.priority,
      task.dueDate,
      JSON.stringify(task.tags),
      1,
      now,
      now,
      task.completed ? task.dueDate : null
    )
  }
}
