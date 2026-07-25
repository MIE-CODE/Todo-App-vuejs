# Lesson 02 — Authentication, sessions, CSRF, and simulated OAuth

This lesson explains how TaskFlow authenticates users entirely locally, and the Vue/
Nuxt patterns that keep it SSR-safe and maintainable. Read it alongside the code in
`server/` and `features/auth/`.

## 1. The shape of the problem

Cookie-based auth in an SSR app has four recurring hazards:

1. **Where is the source of truth for "who is signed in"?** (Answer: the server
   session; the client mirrors it in a Pinia store.)
2. **How does the server know the user during SSR?** (Answer: forward the request
   cookies to internal API calls.)
3. **How do we stop CSRF** when the browser auto-sends cookies? (Answer: same-origin
   check + double-submit token.)
4. **How do we avoid hydration mismatches** for user-dependent UI? (Answer: load the
   session during SSR so server and client render the same thing.)

## 2. Server building blocks

- `server/utils/password.ts` — scrypt hashing/verification. Note the timing-safe
  compare and the algorithm-tagged format so we can migrate KDFs later.
- `server/utils/session.ts` — create/rotate/destroy/list/revoke sessions and resolve
  the current user from the cookie (lazily cleaning expired sessions).
- `server/utils/csrf.ts` — issue/verify the double-submit token.
- `server/utils/rateLimit.ts` — fixed-window limiter.
- `server/middleware/security.ts` — rejects cross-origin mutations.
- `server/services/authService.ts` — credential business rules (register/login/change
  password); returns the user, leaving cookie handling to handlers.
- `server/services/oauthService.ts` — provider adapters + account linking.

**Trade-off:** we keep session/cookie side effects in handlers and utils, not in the
service. The service stays pure-ish and unit-friendly; handlers own the `H3Event`.

## 3. Client building blocks

- `app/plugins/api.ts` — a configured `$api` fetch client. On the server it forwards
  cookies (SSR auth); on the client it attaches the CSRF header. Centralizing this
  means stores never re-implement it.
- `features/auth/stores/useAuthStore.ts` — the reactive source of truth. `ensureLoaded`
  fetches the session once (SSR + client) so first paint is correct.
- `features/auth/composables/useAuth.ts` — orchestrates flows with toasts + navigation
  and preserves the intended redirect after login.
- `app/plugins/auth.ts` + `app/middleware/{auth,guest}.ts` — load the session at
  startup and guard routes.

## 4. Why double-submit CSRF works here

The token lives in a **readable** cookie and is echoed in a request header. A
cross-site attacker can trigger requests (cookies auto-attach) but **cannot read our
cookie** to set the matching header, and **cannot set** a cookie on our origin. The
server only checks `cookie === header`. We add a same-origin check as defense in depth.
Because SSR `Set-Cookie` from an internal fetch may not reach the browser, the client
generates the token itself — still valid, since security comes from the same-origin
policy, not from the server "issuing" it.

## 5. The OAuth simulation

`/api/auth/oauth/:provider/start` issues a `state` and returns an authorize URL; the
browser navigates to `/api/auth/oauth/:provider/callback`, which verifies `state`,
resolves the account (link by verified email or create), starts a session, and
redirects to `/dashboard`. This is the exact shape of real OAuth minus the network
call to the provider — so a real adapter only replaces "exchange code for profile".

## 6. Exercises

1. Add a `passwordChangedAt` column and reject sessions created before it.
2. Add email+password login throttling that increases the window after repeated
   failures (exponential backoff) while keeping the limiter interface.
3. Implement "unlink provider" with the rule that an account must always retain at
   least one sign-in method (password or a linked provider).
4. Add a real Google adapter behind the same `OAuthProfile` contract and a feature
   flag, without touching `resolveOAuthLogin`.

## 7. Interview questions

- Why rotate the session id on login? What attack does it prevent?
- Why is `SameSite=Lax` not sufficient on its own, and what does the origin check add?
- Where would the in-process rate limiter break, and what would you replace it with?
- Why compute analytics on the server rather than in the Pinia store?
