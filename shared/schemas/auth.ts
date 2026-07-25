import { z } from 'zod'
import {
  OAUTH_PROVIDERS,
  TASK_PRIORITIES,
  THEME_PREFERENCES,
  WEEK_START_DAYS
} from '#shared/constants/app'

/**
 * Auth boundary schemas. Validation lives here so both the Nitro handlers and
 * the client forms share one source of truth for rules and messages.
 */
export const emailSchema = z
  .string()
  .trim()
  .min(1, 'Email is required')
  .email('Enter a valid email address')
  .max(200)

export const passwordSchema = z
  .string()
  .min(8, 'Use at least 8 characters')
  .max(200, 'Password is too long')
  .regex(/[a-z]/, 'Include a lowercase letter')
  .regex(/[A-Z]/, 'Include an uppercase letter')
  .regex(/[0-9]/, 'Include a number')

export const registerSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(80),
  email: emailSchema,
  password: passwordSchema
})

export type RegisterInput = z.infer<typeof registerSchema>

export const loginSchema = z.object({
  email: emailSchema,
  /** Login does not re-check strength; it only needs to be present. */
  password: z.string().min(1, 'Password is required').max(200)
})

export type LoginInput = z.infer<typeof loginSchema>

export const changePasswordSchema = z.object({
  currentPassword: z.string().max(200).optional(),
  newPassword: passwordSchema
})

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>

export const updateProfileSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(80)
})

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>

export const updatePreferencesSchema = z.object({
  theme: z.enum(THEME_PREFERENCES).optional(),
  defaultPriority: z.enum(TASK_PRIORITIES).optional(),
  weekStart: z.enum(WEEK_START_DAYS).optional()
})

export type UpdatePreferencesInput = z.infer<typeof updatePreferencesSchema>

export const oauthProviderSchema = z.enum(OAUTH_PROVIDERS)

export const oauthCallbackSchema = z.object({
  state: z.string().min(1),
  account: z.string().min(1),
  email: emailSchema,
  name: z.string().trim().min(1).max(80)
})

export type OAuthCallbackInput = z.infer<typeof oauthCallbackSchema>
