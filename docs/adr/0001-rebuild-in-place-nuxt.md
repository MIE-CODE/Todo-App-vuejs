# ADR 0001 — Rebuild in place on Nuxt 4

## Status
Accepted

## Context
The repository started as a Vue CLI + Vuex + JavaScript todo demo. The curriculum target is a production-grade Nuxt/TypeScript platform with Nitro, Pinia, tests, and feature architecture.

## Decision
Rebuild in place on Nuxt 4 + Nuxt UI + pnpm, preserving Git history. Do not mechanically port Vuex mutations or Options API components.

## Consequences
- Fastest path to correct architecture
- Old Vue CLI files are deleted rather than migrated
- Learners must understand *why* the old stack was insufficient
