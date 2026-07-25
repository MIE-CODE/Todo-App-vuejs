// https://nuxt.com/docs/api/configuration/nuxt-config
import { fileURLToPath } from 'node:url'

const sharedPath = fileURLToPath(new URL('./shared', import.meta.url))
const featuresPath = fileURLToPath(new URL('./features', import.meta.url))

export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
    '@nuxt/image',
    '@nuxt/fonts',
    '@pinia/nuxt',
    '@vueuse/nuxt',
    '@nuxt/test-utils/module'
  ],

  components: [
    {
      path: '~/components',
      pathPrefix: false
    },
    {
      // Recursively registers every feature's components (auth, tasks, dashboard, …).
      path: '../features',
      pattern: '**/components/**/*.vue',
      pathPrefix: false
    }
  ],

  imports: {
    dirs: [
      'composables/**',
      '../shared/composables/**',
      '../features/**/composables/**',
      '../features/**/stores/**'
    ]
  },

  devtools: {
    enabled: true
  },

  app: {
    pageTransition: { name: 'page', mode: 'out-in' },
    head: {
      htmlAttrs: {
        lang: 'en'
      },
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' }
      ],
      link: [
        { rel: 'icon', href: '/favicon.ico' }
      ]
    }
  },

  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    /**
     * Server-only secrets and paths.
     * Never expose session secrets to the client.
     */
    sessionSecret: process.env.NUXT_SESSION_SECRET || 'dev-only-change-me-in-production',
    databasePath: process.env.NUXT_DATABASE_PATH || '.data/app.sqlite',
    public: {
      appName: 'TaskFlow',
      appUrl: process.env.NUXT_PUBLIC_APP_URL || 'http://localhost:3000',
      defaultLocale: 'en'
    }
  },

  alias: {
    '#shared': sharedPath,
    '#features': featuresPath
  },

  routeRules: {
    // Authenticated pages render per-request; the landing page stays SSR too.
    '/tasks/**': { ssr: true }
  },

  future: {
    compatibilityVersion: 4
  },

  compatibilityDate: '2026-06-30',

  nitro: {
    experimental: {
      asyncContext: true
    },
    alias: {
      '#shared': sharedPath,
      '#features': featuresPath
    }
  },

  typescript: {
    strict: true,
    typeCheck: false
  },

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  },

  fonts: {
    families: [
      { name: 'Public Sans', provider: 'google' }
    ]
  },

  image: {
    quality: 80,
    format: ['webp', 'avif']
  },

  pinia: {
    storesDirs: ['./features/**/stores/**', './app/stores/**']
  },
})
