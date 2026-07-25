<script setup lang="ts">
import { useAuth } from '#features/auth/composables/useAuth'

definePageMeta({
  layout: 'marketing'
})

const { isAuthenticated } = useAuth()

const title = 'TaskFlow — plan your day, finish what matters'
const description
  = 'A fast, focused todo app with priorities, due dates, a calendar, and productivity analytics. Free and private.'

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description,
  twitterCard: 'summary_large_image'
})

const features = [
  {
    title: 'Organize with priorities & tags',
    description: 'Capture tasks in seconds, then sort by priority, status, due date, or tag.',
    icon: 'i-lucide-list-checks'
  },
  {
    title: 'See your week at a glance',
    description: 'A due-date calendar keeps deadlines visible so nothing slips through.',
    icon: 'i-lucide-calendar-days'
  },
  {
    title: 'Understand your focus',
    description: 'Free dashboards stay honest. Plus and Pro unlock Focus Orbit after payment is confirmed.',
    icon: 'i-lucide-orbit'
  }
]

const steps = [
  {
    step: '01',
    title: 'Capture in seconds',
    description: 'Type a title, set a priority, add a due date. No wizards, no clutter — just the fields that matter.'
  },
  {
    step: '02',
    title: 'Sort and focus',
    description: 'Filter by status, priority, or tag. Drag between board columns when your plan changes mid-day.'
  },
  {
    step: '03',
    title: 'Review and improve',
    description: 'Check the calendar for what’s due, then use analytics to see what’s actually getting done.'
  }
]

const workflow = [
  {
    title: 'Priorities that stick',
    description: 'High, medium, and low priority stay visible on every card so urgent work never hides in a flat list.',
    icon: 'i-lucide-flag'
  },
  {
    title: 'Tags for context',
    description: 'Group work by project, energy, or place — then filter the board down to exactly what you need now.',
    icon: 'i-lucide-tags'
  },
  {
    title: 'Due dates you can trust',
    description: 'Deadlines feed the calendar and overdue counts, so “someday” and “today” stay distinct.',
    icon: 'i-lucide-alarm-clock'
  },
  {
    title: 'Board or list',
    description: 'Flip between a kanban board and a clean list without losing filters, search, or task detail.',
    icon: 'i-lucide-columns-3'
  }
]

const productSurfaces = [
  {
    title: 'Dashboard',
    description: 'A calm overview of open work, overdue items, and what’s due soon — your day in one glance.',
    icon: 'i-lucide-layout-dashboard'
  },
  {
    title: 'Tasks',
    description: 'Create, edit, complete, and undo. Optimistic updates keep the UI snappy while the server catches up.',
    icon: 'i-lucide-check-square'
  },
  {
    title: 'Calendar',
    description: 'Month grid built from your due dates. Spot collisions early and rebalance the week.',
    icon: 'i-lucide-calendar-range'
  },
  {
    title: 'Focus Orbit',
    description: 'Premium animated planning — unlocked only after sandbox payment is confirmed.',
    icon: 'i-lucide-orbit'
  },
  {
    title: 'Settings',
    description: 'Preferences, sessions, password, and subscription management in one place.',
    icon: 'i-lucide-settings'
  }
]

const privacyPoints = [
  {
    title: 'Self-contained',
    description: 'Runs on your stack with SQLite. No third-party productivity APIs in the critical path.',
    icon: 'i-lucide-hard-drive'
  },
  {
    title: 'Session-based auth',
    description: 'Secure cookies, CSRF protection, and rate limits — not a toy login bolted on later.',
    icon: 'i-lucide-shield-check'
  },
  {
    title: 'Your data stays yours',
    description: 'Tasks, preferences, and sessions live in your database. Export and own the source of truth.',
    icon: 'i-lucide-lock'
  }
]

const audiences = [
  {
    title: 'Solo makers',
    description: 'Ship personal projects without drowning in a tool that wants a team plan.',
    icon: 'i-lucide-sparkles'
  },
  {
    title: 'Students',
    description: 'Track assignments, exams, and side work with due dates that actually surface on a calendar.',
    icon: 'i-lucide-graduation-cap'
  },
  {
    title: 'Busy professionals',
    description: 'Keep work and life lists separate with tags and priorities — then measure what you finished.',
    icon: 'i-lucide-briefcase'
  }
]

const faqs = [
  {
    label: 'Is TaskFlow free?',
    content: 'Yes. Free covers tasks, board, and calendar. Plus and Pro unlock Focus Orbit after a sandbox payment is confirmed.'
  },
  {
    label: 'How does the sandbox payment work?',
    content: 'Checkout is fully local. Use card 4242 4242 4242 4242 to confirm, or 4000 0000 0000 0002 to simulate a decline. Card details are never stored, and premium stays locked until payment status is confirmed.'
  },
  {
    label: 'Do I need an internet account provider?',
    content: 'Email and password work out of the box. OAuth providers can be wired when you’re ready — the app doesn’t depend on them.'
  },
  {
    label: 'Where is my data stored?',
    content: 'In a local SQLite database managed by the app. Nothing is sent to external task APIs.'
  },
  {
    label: 'Can I try before registering?',
    content: 'Use the demo account on the sign-in page: demo@taskflow.app / Demo123!pass.'
  },
  {
    label: 'Does it work on mobile?',
    content: 'Yes. Layouts are responsive from phone to desktop, including the task board, calendar, and Focus Orbit.'
  },
  {
    label: 'What makes it different from a notes app?',
    content: 'TaskFlow is built around status, priority, due dates, and completion — not freeform documents.'
  }
]

const mockTasks = [
  { title: 'Ship landing polish', priority: 'High', done: false },
  { title: 'Review calendar conflicts', priority: 'Medium', done: false },
  { title: 'Close overdue invoices', priority: 'High', done: true },
  { title: 'Plan Friday deep work', priority: 'Low', done: false }
]

const ctaTo = computed(() => (isAuthenticated.value ? '/dashboard' : '/register'))
const ctaLabel = computed(() => (isAuthenticated.value ? 'Go to dashboard' : 'Get started free'))
const ctaSecondary = computed(() => (isAuthenticated.value ? 'Open TaskFlow' : 'Create your account'))
</script>

<template>
  <div class="landing space-y-24 pb-8 sm:space-y-28">
    <!-- Hero — kept as the original composition -->
    <section class="landing-hero space-y-6 text-center">
      <Reveal from="down">
        <UBadge
          color="primary"
          variant="subtle"
        >
          Your day, organized
        </UBadge>
      </Reveal>
      <Reveal :delay="80">
        <h1 class="mx-auto max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
          Plan your day and finish what matters
        </h1>
      </Reveal>
      <Reveal :delay="140">
        <p class="mx-auto max-w-2xl text-lg text-muted">
          TaskFlow is a focused todo app for people who want clarity, not clutter.
          Priorities, due dates, a calendar, and honest analytics — nothing more.
        </p>
      </Reveal>
      <Reveal :delay="200">
        <div class="flex flex-wrap items-center justify-center gap-3">
          <UButton
            size="lg"
            :to="ctaTo"
            icon="i-lucide-arrow-right"
            trailing
          >
            {{ ctaLabel }}
          </UButton>
          <UButton
            v-if="!isAuthenticated"
            size="lg"
            color="neutral"
            variant="soft"
            to="/login"
          >
            Sign in
          </UButton>
        </div>
      </Reveal>
    </section>

    <!-- Features -->
    <section class="grid gap-4 md:grid-cols-3">
      <Reveal
        v-for="(feature, index) in features"
        :key="feature.title"
        :delay="index * 90"
      >
        <UCard class="h-full transition-transform duration-300 hover:-translate-y-1">
          <div class="space-y-3">
            <span class="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <UIcon
                :name="feature.icon"
                class="size-5"
              />
            </span>
            <h2 class="text-lg font-semibold">
              {{ feature.title }}
            </h2>
            <p class="text-sm text-muted">
              {{ feature.description }}
            </p>
          </div>
        </UCard>
      </Reveal>
    </section>

    <!-- How it works -->
    <section class="space-y-10">
      <Reveal class="mx-auto max-w-2xl space-y-3 text-center">
        <p class="text-sm font-medium text-primary">
          How it works
        </p>
        <h2 class="text-3xl font-semibold tracking-tight">
          Three steps from idea to done
        </h2>
        <p class="text-muted">
          TaskFlow stays out of the way. Capture quickly, focus the list, then review what you actually finished.
        </p>
      </Reveal>

      <div class="grid gap-6 md:grid-cols-3">
        <Reveal
          v-for="(item, index) in steps"
          :key="item.step"
          :delay="index * 100"
        >
          <div class="relative space-y-3 rounded-2xl border border-default bg-elevated/30 p-6">
            <span class="font-mono text-sm font-semibold text-primary">
              {{ item.step }}
            </span>
            <h3 class="text-xl font-semibold">
              {{ item.title }}
            </h3>
            <p class="text-sm text-muted">
              {{ item.description }}
            </p>
          </div>
        </Reveal>
      </div>
    </section>

    <!-- Product preview -->
    <section class="grid items-center gap-10 lg:grid-cols-2">
      <Reveal from="left">
        <div class="space-y-4">
          <p class="text-sm font-medium text-primary">
            Inside the board
          </p>
          <h2 class="text-3xl font-semibold tracking-tight">
            A task list that feels instant
          </h2>
          <p class="text-muted">
            Optimistic updates, undo, and clear priority cues keep momentum high.
            Open a task for detail, or stay on the board and knock items out.
          </p>
          <ul class="space-y-3 text-sm">
            <li
              v-for="point in ['Instant create & complete', 'Undo when you mis-click', 'Filters that survive refresh']"
              :key="point"
              class="flex items-center gap-2"
            >
              <UIcon
                name="i-lucide-check"
                class="size-4 shrink-0 text-primary"
              />
              {{ point }}
            </li>
          </ul>
        </div>
      </Reveal>

      <Reveal
        from="right"
        :delay="120"
      >
        <div class="overflow-hidden rounded-2xl border border-default bg-elevated/50 p-4 shadow-sm">
          <div class="mb-4 flex items-center justify-between gap-3">
            <div class="flex items-center gap-2">
              <span class="size-2.5 rounded-full bg-primary" />
              <span class="text-sm font-medium">Today</span>
            </div>
            <UBadge
              color="neutral"
              variant="subtle"
            >
              4 tasks
            </UBadge>
          </div>
          <ul class="space-y-2">
            <li
              v-for="(task, index) in mockTasks"
              :key="task.title"
              class="landing-mock-row flex items-center gap-3 rounded-xl border border-default bg-default px-3 py-2.5"
              :style="{ animationDelay: `${index * 80}ms` }"
            >
              <span
                class="flex size-5 shrink-0 items-center justify-center rounded-full border"
                :class="task.done ? 'border-primary bg-primary text-white' : 'border-muted'"
              >
                <UIcon
                  v-if="task.done"
                  name="i-lucide-check"
                  class="size-3"
                />
              </span>
              <span
                class="flex-1 text-sm"
                :class="task.done ? 'text-muted line-through' : ''"
              >
                {{ task.title }}
              </span>
              <UBadge
                :color="task.priority === 'High' ? 'error' : task.priority === 'Medium' ? 'warning' : 'neutral'"
                variant="subtle"
                size="sm"
              >
                {{ task.priority }}
              </UBadge>
            </li>
          </ul>
        </div>
      </Reveal>
    </section>

    <!-- Workflow deep-dive -->
    <section class="space-y-10">
      <Reveal class="mx-auto max-w-2xl space-y-3 text-center">
        <p class="text-sm font-medium text-primary">
          Built for real workdays
        </p>
        <h2 class="text-3xl font-semibold tracking-tight">
          Priorities, tags, and due dates — together
        </h2>
        <p class="text-muted">
          Most todo apps give you a list. TaskFlow gives you the levers you actually use when the day gets busy.
        </p>
      </Reveal>

      <div class="grid gap-4 sm:grid-cols-2">
        <Reveal
          v-for="(item, index) in workflow"
          :key="item.title"
          :delay="index * 70"
        >
          <div class="flex h-full gap-4 rounded-2xl border border-default p-5 transition-colors duration-300 hover:bg-elevated/40">
            <span class="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <UIcon
                :name="item.icon"
                class="size-5"
              />
            </span>
            <div class="space-y-1">
              <h3 class="font-semibold">
                {{ item.title }}
              </h3>
              <p class="text-sm text-muted">
                {{ item.description }}
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>

    <!-- Product surfaces -->
    <section class="space-y-10">
      <Reveal class="mx-auto max-w-2xl space-y-3 text-center">
        <p class="text-sm font-medium text-primary">
          The product
        </p>
        <h2 class="text-3xl font-semibold tracking-tight">
          Everything you need after you sign in
        </h2>
        <p class="text-muted">
          Dashboard, tasks, calendar, Focus Orbit, and settings — one app, one data model, with premium gates that stick.
        </p>
      </Reveal>

      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Reveal
          v-for="(surface, index) in productSurfaces"
          :key="surface.title"
          :delay="index * 80"
        >
          <UCard class="h-full transition-transform duration-300 hover:-translate-y-1">
            <div class="space-y-3">
              <span class="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <UIcon
                  :name="surface.icon"
                  class="size-5"
                />
              </span>
              <h3 class="font-semibold">
                {{ surface.title }}
              </h3>
              <p class="text-sm text-muted">
                {{ surface.description }}
              </p>
            </div>
          </UCard>
        </Reveal>
      </div>
    </section>

    <!-- Calendar showcase -->
    <section class="space-y-10">
      <Reveal class="mx-auto max-w-2xl space-y-3 text-center">
        <p class="text-sm font-medium text-primary">
          Calendar preview
        </p>
        <h2 class="text-3xl font-semibold tracking-tight">
          Deadlines you can see coming
        </h2>
        <p class="text-muted">
          A month grid filled with sample due dates — the same view you’ll use after you sign in.
        </p>
      </Reveal>

      <Reveal :delay="100">
        <LandingCalendarShowcase />
      </Reveal>
    </section>

    <!-- Focus Orbit + pricing -->
    <section class="space-y-10">
      <Reveal class="mx-auto max-w-2xl space-y-3 text-center">
        <p class="text-sm font-medium text-primary">
          Premium Focus Orbit
        </p>
        <h2 class="text-3xl font-semibold tracking-tight">
          See gravity in your workload
        </h2>
        <p class="text-muted">
          Free keeps you organized. Plus and Pro unlock an animated Focus Orbit —
          but only after sandbox payment is confirmed.
        </p>
      </Reveal>

      <Reveal :delay="80">
        <LandingPricing />
      </Reveal>
    </section>

    <!-- Privacy -->
    <section class="space-y-10">
      <Reveal class="mx-auto max-w-2xl space-y-3 text-center">
        <p class="text-sm font-medium text-primary">
          Private by design
        </p>
        <h2 class="text-3xl font-semibold tracking-tight">
          Your tasks stay on your stack
        </h2>
        <p class="text-muted">
          TaskFlow is self-contained — SQLite, session cookies, and no external productivity APIs in the loop.
        </p>
      </Reveal>

      <div class="grid gap-4 md:grid-cols-3">
        <Reveal
          v-for="(point, index) in privacyPoints"
          :key="point.title"
          :delay="index * 90"
        >
          <div class="h-full space-y-3 rounded-2xl border border-default p-6">
            <span class="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <UIcon
                :name="point.icon"
                class="size-5"
              />
            </span>
            <h3 class="text-lg font-semibold">
              {{ point.title }}
            </h3>
            <p class="text-sm text-muted">
              {{ point.description }}
            </p>
          </div>
        </Reveal>
      </div>
    </section>

    <!-- Audiences -->
    <section class="space-y-10">
      <Reveal class="mx-auto max-w-2xl space-y-3 text-center">
        <p class="text-sm font-medium text-primary">
          Who it’s for
        </p>
        <h2 class="text-3xl font-semibold tracking-tight">
          Simple enough for one person. Serious enough for a full week.
        </h2>
      </Reveal>

      <div class="grid gap-4 md:grid-cols-3">
        <Reveal
          v-for="(audience, index) in audiences"
          :key="audience.title"
          :delay="index * 90"
        >
          <UCard class="h-full">
            <div class="space-y-3">
              <span class="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <UIcon
                  :name="audience.icon"
                  class="size-5"
                />
              </span>
              <h3 class="text-lg font-semibold">
                {{ audience.title }}
              </h3>
              <p class="text-sm text-muted">
                {{ audience.description }}
              </p>
            </div>
          </UCard>
        </Reveal>
      </div>
    </section>

    <!-- Quote / principle -->
    <Reveal>
      <section class="rounded-2xl border border-default bg-gradient-to-br from-primary/10 via-elevated/40 to-transparent px-8 py-12 text-center sm:px-12">
        <UIcon
          name="i-lucide-quote"
          class="mx-auto size-8 text-primary/60"
        />
        <blockquote class="mx-auto mt-4 max-w-2xl text-2xl font-semibold tracking-tight sm:text-3xl">
          Clarity beats clutter. Finish what matters — then stop looking at the list.
        </blockquote>
        <p class="mt-4 text-sm text-muted">
          The TaskFlow principle
        </p>
      </section>
    </Reveal>

    <!-- FAQ -->
    <section class="space-y-8">
      <Reveal class="mx-auto max-w-2xl space-y-3 text-center">
        <p class="text-sm font-medium text-primary">
          FAQ
        </p>
        <h2 class="text-3xl font-semibold tracking-tight">
          Questions, answered
        </h2>
      </Reveal>

      <Reveal :delay="80">
        <UAccordion
          :items="faqs"
          type="multiple"
          class="mx-auto max-w-3xl"
        />
      </Reveal>
    </section>

    <!-- Mid CTA strip -->
    <Reveal>
      <section class="flex flex-col items-center justify-between gap-6 rounded-2xl border border-default bg-elevated/40 px-8 py-8 text-center sm:flex-row sm:text-left">
        <div class="space-y-1">
          <h2 class="text-xl font-semibold">
            Prefer to look around first?
          </h2>
          <p class="text-sm text-muted">
            Sign in with the demo account — demo@taskflow.app / Demo123!pass
          </p>
        </div>
        <UButton
          size="lg"
          color="neutral"
          variant="soft"
          to="/login"
          icon="i-lucide-log-in"
        >
          Try the demo
        </UButton>
      </section>
    </Reveal>

    <!-- Final CTA — original closing section -->
    <Reveal>
      <section class="rounded-2xl border border-default bg-elevated/40 p-8 text-center sm:p-10">
        <h2 class="text-2xl font-semibold sm:text-3xl">
          Ready to get organized?
        </h2>
        <p class="mx-auto mt-2 max-w-xl text-muted">
          Create a free account, or explore instantly with the demo login
          (demo@taskflow.app / Demo123!pass).
        </p>
        <div class="mt-5 flex flex-wrap items-center justify-center gap-3">
          <UButton
            size="lg"
            :to="ctaTo"
          >
            {{ ctaSecondary }}
          </UButton>
          <UButton
            v-if="!isAuthenticated"
            size="lg"
            color="neutral"
            variant="ghost"
            to="/login"
          >
            Sign in
          </UButton>
        </div>
      </section>
    </Reveal>
  </div>
</template>

<style scoped>
.landing-hero :deep(.reveal--visible) {
  transition-duration: 0.65s;
}

.landing-mock-row {
  animation: landing-fade-in 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
}

.landing-bar {
  transform-origin: bottom;
  animation: landing-grow 0.7s cubic-bezier(0.22, 1, 0.36, 1) both;
}

@keyframes landing-fade-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: none;
  }
}

@keyframes landing-grow {
  from {
    transform: scaleY(0.15);
    opacity: 0.4;
  }

  to {
    transform: scaleY(1);
    opacity: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .landing-mock-row,
  .landing-bar {
    animation: none;
  }
}
</style>
