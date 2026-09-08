<script setup lang="ts">
import { onBeforeUnmount, onMounted, onUpdated, ref } from 'vue'

// Keep one highlight alive across selection changes, including changes from code.
const root = ref<HTMLElement | null>(null)
const indicator = ref<HTMLElement | null>(null)
let resizeObserver: ResizeObserver | undefined
let previousButton: HTMLButtonElement | undefined
let ready = false

function updateIndicator() {
  const container = root.value
  const highlight = indicator.value
  if (!container || !highlight) return
  const buttons = Array.from(container.querySelectorAll<HTMLButtonElement>(':scope > button'))
  const active = buttons.find((button) => button.classList.contains('active'))
  for (const button of buttons) {
    button.setAttribute('aria-pressed', String(button === active))
  }
  if (!active || !active.offsetWidth) {
    highlight.style.opacity = '0'
    previousButton = undefined
    ready = false
    return
  }
  const bounds = container.getBoundingClientRect()
  const buttonBounds = active.getBoundingClientRect()
  // Fractional grid tracks must stay fractional (e.g. four tabs on a narrow screen).
  const left = buttonBounds.left - bounds.left - container.clientLeft + container.scrollLeft
  const top = buttonBounds.top - bounds.top - container.clientTop + container.scrollTop
  const transform = `translate(${left}px, ${top}px)`
  const width = `${buttonBounds.width}px`
  const height = `${buttonBounds.height}px`
  if (active === previousButton && highlight.style.transform === transform &&
    highlight.style.width === width && highlight.style.height === height) return

  // Resizing/revealing a group places the highlight immediately. Only selection moves it.
  const animate = ready && active !== previousButton
  highlight.style.transitionDuration = animate ? '' : '0s'
  highlight.style.width = width
  highlight.style.height = height
  highlight.style.transform = transform
  highlight.style.opacity = '1'
  if (!animate) {
    // Commit the initial geometry before enabling transitions.
    highlight.getBoundingClientRect()
    highlight.style.transitionDuration = ''
  }
  previousButton = active
  ready = true
}

onMounted(() => {
  updateIndicator()
  resizeObserver = new ResizeObserver(updateIndicator)
  if (root.value) {
    resizeObserver.observe(root.value)
    root.value.querySelectorAll('button').forEach((button) => resizeObserver?.observe(button))
  }
})
onUpdated(updateIndicator)
onBeforeUnmount(() => resizeObserver?.disconnect())
</script>

<template>
  <div ref="root" class="animated-segments">
    <span ref="indicator" class="segment-indicator" aria-hidden="true" />
    <slot />
  </div>
</template>

<style scoped>
.animated-segments {
  position: relative;
  isolation: isolate;
}

.segment-indicator {
  position: absolute;
  top: 0;
  left: 0;
  z-index: -1;
  border-radius: var(--segment-radius, 999px);
  background: var(--segment-color, var(--new-ui-accent, #6f42c1));
  pointer-events: none;
  opacity: 0;
  transition: transform 240ms cubic-bezier(0.22, 1, 0.36, 1),
    width 240ms cubic-bezier(0.22, 1, 0.36, 1);
}

.animated-segments > :deep(button) {
  transition: color 180ms ease;
}

@media (prefers-reduced-motion: reduce) {
  .segment-indicator,
  .animated-segments > :deep(button) {
    transition: none;
  }
}
</style>
