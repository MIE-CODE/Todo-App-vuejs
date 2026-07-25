# ADR 0004 — Local-first authentication (scrypt, rotating sessions, simulated OAuth)

## Status
Accepted

## Context
TaskFlow must offer solid authentication — including social login — while staying
fully self-contained (no external identity providers or BaaS). We also want the door
open to real OAuth later without rewrites.

## Decision
- **Password hashing:** Node's built-in `scrypt` (memory-hard) via a small,
  algorithm-tagged module (`scrypt$salt$hash`). No extra native dependency; a future
  move to Argon2id is a contained change because the format is versioned.
- **Sessions:** server-side rows keyed by opaque random tokens stored in an
  `httpOnly`, `SameSite=Lax`, `Secure`-in-prod cookie. Sessions rotate on login
  (defeats fixation), expire, refresh `lastUsedAt`, and support "sign out other
  sessions".
- **CSRF:** double-submit token (readable cookie mirrored into a request header) plus
  a same-origin check on all mutating API requests. The client generates the token so
  it works even when SSR `Set-Cookie` does not propagate.
- **Rate limiting:** in-process fixed-window limiter on auth endpoints (swap for a
  shared store in a multi-node deploy; call sites stay identical).
- **Social login:** local **provider adapters** (`google`, `github`) that simulate
  redirect → callback → account-linking using a server-defined identity and an
  anti-forgery `state` cookie. Identity is never taken from the browser, mirroring
  real OAuth where the provider asserts the user.

## Consequences
- Realistic, secure-by-default auth with zero external services.
- Account linking by verified email is built in; a real OAuth adapter only needs to
  replace the "exchange code for profile" step.
- `NUXT_ALLOW_DEV_SESSION` and all demo auto-sessions were removed; the seeded demo
  account is a normal password account.
