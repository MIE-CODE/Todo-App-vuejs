import type { MaybeRefOrGetter, Ref } from 'vue'
import { computed, nextTick, onBeforeUnmount, ref, toValue, watch } from 'vue'
import { unrefElement, useEventListener } from '@vueuse/core'

export interface FloatingPanelStyle {
  position: 'fixed'
  top: string
  bottom: string
  left: string
  width: string
  maxHeight: string
  zIndex: string
}

/**
 * Positions a teleported overlay under (or above) a trigger element using
 * `position: fixed`, so dropdowns escape overflow/clipping parents and stay
 * above the rest of the UI without expanding layout.
 */
export function useFloatingPanel(
  triggerRef: Ref<HTMLElement | null | undefined>,
  open: MaybeRefOrGetter<boolean>,
  options: {
    /** Preferred panel width; defaults to the trigger width. */
    width?: MaybeRefOrGetter<number | 'trigger'>
    /** Max height used for flip + scroll. */
    maxHeight?: number
    gap?: number
    zIndex?: number
  } = {}
) {
  const maxHeight = options.maxHeight ?? 240
  const gap = options.gap ?? 4
  const zIndex = options.zIndex ?? 100

  const panelStyle = ref<FloatingPanelStyle>({
    position: 'fixed',
    top: '0px',
    bottom: 'auto',
    left: '0px',
    width: '0px',
    maxHeight: `${maxHeight}px`,
    zIndex: String(zIndex)
  })

  const placement = ref<'bottom' | 'top'>('bottom')

  function updatePosition() {
    const el = unrefElement(triggerRef)
    if (!el) {
      return
    }

    const rect = el.getBoundingClientRect()
    const widthOpt = toValue(options.width) ?? 'trigger'
    const width = widthOpt === 'trigger' ? rect.width : widthOpt

    // Keep the panel inside the viewport horizontally.
    const left = Math.min(
      Math.max(8, rect.left),
      Math.max(8, window.innerWidth - width - 8)
    )

    const spaceBelow = window.innerHeight - rect.bottom - gap
    const spaceAbove = rect.top - gap
    const placeTop = spaceBelow < Math.min(maxHeight, 200) && spaceAbove > spaceBelow

    placement.value = placeTop ? 'top' : 'bottom'

    const available = placeTop ? spaceAbove : spaceBelow
    const panelMax = Math.max(120, Math.min(maxHeight, available))

    panelStyle.value = placeTop
      ? {
          position: 'fixed',
          top: 'auto',
          bottom: `${window.innerHeight - rect.top + gap}px`,
          left: `${left}px`,
          width: `${width}px`,
          maxHeight: `${panelMax}px`,
          zIndex: String(zIndex)
        }
      : {
          position: 'fixed',
          top: `${rect.bottom + gap}px`,
          bottom: 'auto',
          left: `${left}px`,
          width: `${width}px`,
          maxHeight: `${panelMax}px`,
          zIndex: String(zIndex)
        }
  }

  const stops: Array<() => void> = []

  function bindReposition() {
    unbindReposition()
    stops.push(useEventListener(window, 'resize', updatePosition, { passive: true }))
    // Capture scroll from any nested overflow container (kanban columns, main, …).
    stops.push(useEventListener(window, 'scroll', updatePosition, { capture: true, passive: true }))
  }

  function unbindReposition() {
    while (stops.length) {
      stops.pop()?.()
    }
  }

  watch(
    () => toValue(open),
    async (isOpen) => {
      if (isOpen) {
        await nextTick()
        updatePosition()
        bindReposition()
      } else {
        unbindReposition()
      }
    }
  )

  onBeforeUnmount(() => {
    unbindReposition()
  })

  return {
    panelStyle: computed(() => panelStyle.value),
    placement,
    updatePosition
  }
}
