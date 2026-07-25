import { integer, sqliteTable, text, index, uniqueIndex } from 'drizzle-orm/sqlite-core'

/**
 * Drizzle schema is the source of truth for persistence shape.
 * Domain schemas (Zod) stay separate so transport and storage can evolve independently.
 */
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  /** Nullable: OAuth-only accounts may have no password. */
  passwordHash: text('password_hash'),
  avatarColor: text('avatar_color').notNull().default('#6366f1'),
  emailVerified: integer('email_verified', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull()
})

export const sessions = sqliteTable(
  'sessions',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    userAgent: text('user_agent'),
    ipAddress: text('ip_address'),
    expiresAt: text('expires_at').notNull(),
    createdAt: text('created_at').notNull(),
    lastUsedAt: text('last_used_at').notNull()
  },
  (table) => [index('sessions_user_id_idx').on(table.userId)]
)

/**
 * Linked OAuth accounts. Local providers are simulated, but the shape mirrors
 * a real provider/account-id linkage so a real adapter is a drop-in later.
 */
export const oauthIdentities = sqliteTable(
  'oauth_identities',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    provider: text('provider').notNull(),
    providerAccountId: text('provider_account_id').notNull(),
    email: text('email'),
    createdAt: text('created_at').notNull()
  },
  (table) => [
    uniqueIndex('oauth_provider_account_idx').on(table.provider, table.providerAccountId),
    index('oauth_user_id_idx').on(table.userId)
  ]
)

export const preferences = sqliteTable('preferences', {
  userId: text('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  theme: text('theme').notNull().default('system'),
  defaultPriority: text('default_priority').notNull().default('medium'),
  weekStart: text('week_start').notNull().default('monday'),
  updatedAt: text('updated_at').notNull()
})

export const tasks = sqliteTable(
  'tasks',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    description: text('description'),
    status: text('status').notNull(),
    priority: text('priority').notNull(),
    dueDate: text('due_date'),
    tagsJson: text('tags_json').notNull().default('[]'),
    version: integer('version').notNull().default(1),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
    completedAt: text('completed_at')
  },
  (table) => [
    index('tasks_user_id_idx').on(table.userId),
    index('tasks_status_idx').on(table.status),
    index('tasks_priority_idx').on(table.priority),
    index('tasks_due_date_idx').on(table.dueDate)
  ]
)

/** Catalog of purchasable plans (seeded; not user-editable). */
export const plans = sqliteTable('plans', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  priceCents: integer('price_cents').notNull(),
  currency: text('currency').notNull().default('usd'),
  entitlementsJson: text('entitlements_json').notNull().default('[]'),
  featuresJson: text('features_json').notNull().default('[]'),
  active: integer('active', { mode: 'boolean' }).notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0)
})

/** One active subscription row per user (free by default). */
export const subscriptions = sqliteTable(
  'subscriptions',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    planId: text('plan_id')
      .notNull()
      .references(() => plans.id),
    status: text('status').notNull().default('active'),
    currentPeriodEnd: text('current_period_end'),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull()
  },
  (table) => [
    uniqueIndex('subscriptions_user_id_uidx').on(table.userId),
    index('subscriptions_plan_id_idx').on(table.planId)
  ]
)

/**
 * Sandbox payment attempts. Card data is never stored — only the attempt
 * lifecycle and the plan/amount that was charged.
 */
export const paymentAttempts = sqliteTable(
  'payment_attempts',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    planId: text('plan_id')
      .notNull()
      .references(() => plans.id),
    amountCents: integer('amount_cents').notNull(),
    currency: text('currency').notNull().default('usd'),
    status: text('status').notNull().default('pending'),
    idempotencyKey: text('idempotency_key').notNull(),
    failureReason: text('failure_reason'),
    createdAt: text('created_at').notNull(),
    confirmedAt: text('confirmed_at')
  },
  (table) => [
    uniqueIndex('payment_attempts_idempotency_uidx').on(table.userId, table.idempotencyKey),
    index('payment_attempts_user_id_idx').on(table.userId)
  ]
)

export type UserRecord = typeof users.$inferSelect
export type SessionRecord = typeof sessions.$inferSelect
export type OAuthIdentityRecord = typeof oauthIdentities.$inferSelect
export type PreferencesRecord = typeof preferences.$inferSelect
export type TaskRecord = typeof tasks.$inferSelect
export type PlanRecord = typeof plans.$inferSelect
export type SubscriptionRecord = typeof subscriptions.$inferSelect
export type PaymentAttemptRecord = typeof paymentAttempts.$inferSelect
