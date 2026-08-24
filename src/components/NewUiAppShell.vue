<script setup lang="ts">
import fokusLogo from '../assets/new-ui/app-shell/fokus-logo.svg'
import leadsIcon from '../assets/new-ui/app-shell/leads.svg'
import shareIcon from '../assets/new-ui/app-shell/share.svg'
import actionStarIcon from '../assets/new-ui/app-shell/action-star.svg'
import actionUpIcon from '../assets/new-ui/app-shell/action-up.svg'
import actionCopyIcon from '../assets/new-ui/app-shell/action-copy.svg'
import actionDeleteIcon from '../assets/new-ui/app-shell/action-delete.svg'
import actionSparkleIcon from '../assets/new-ui/app-shell/action-sparkle.svg'
import randomChartBars from '../assets/new-ui/random-chart-bars.svg'
import randomChartSquiggle from '../assets/new-ui/random-chart-squiggle.svg'
import randomChartStar from '../assets/new-ui/random-chart-star.svg'

defineEmits<{
  'show-classic': []
  'randomize': []
}>()

const slideDots = Array.from({ length: 10 }, (_, index) => index)
</script>

<template>
  <main class="new-ui-app-shell">
    <div class="new-ui-embedded-app">
      <header class="new-ui-app-toolbar">
        <button
          class="new-ui-brand-pill"
          type="button"
          title="Вернуться к текущему интерфейсу"
          aria-label="Вернуться к текущему интерфейсу"
          @click="$emit('show-classic')"
        >
          <img :src="fokusLogo" alt="Fokus" />
          <i aria-hidden="true" />
          <span>Мои презентации</span>
        </button>

        <div class="new-ui-app-actions" aria-hidden="true">
          <span class="new-ui-round-action new-ui-chart-action"><i /><i /><i /></span>
          <span class="new-ui-round-action"><img :src="leadsIcon" alt="" /></span>
          <span class="new-ui-round-action new-ui-type-action">Aa</span>
          <span class="new-ui-view-action">Просмотр</span>
          <span class="new-ui-share-action"><img :src="shareIcon" alt="" />Поделиться</span>
        </div>
      </header>

      <div class="new-ui-background-chart" />

      <div class="new-ui-object-toolbar" aria-hidden="true">
        <span class="new-ui-slide-dots">
          <i
            v-for="dot in slideDots"
            :key="dot"
            :class="{ active: dot === 2 }"
          />
        </span>
        <span class="new-ui-small-action"><img :src="actionStarIcon" alt="" /></span>
        <span class="new-ui-small-action"><img :src="actionUpIcon" alt="" /></span>
        <span class="new-ui-small-action"><img :src="actionCopyIcon" alt="" /></span>
        <span class="new-ui-small-action"><img :src="actionDeleteIcon" alt="" /></span>
        <span class="new-ui-small-action"><img :src="actionSparkleIcon" alt="" /></span>
        <span class="new-ui-color-action" />
      </div>

      <div class="new-ui-dim-layer" />
    </div>

    <aside class="new-ui-settings-drawer" aria-label="Настройки графика">
      <slot name="settings" />
    </aside>

    <section class="new-ui-chart-preview" aria-label="Предпросмотр графика">
      <div class="new-ui-chart-card">
        <slot name="chart" />
      </div>
      <button
        class="new-ui-random-chart-button"
        type="button"
        @click="$emit('randomize')"
      >
        <span>Случайный график</span>
        <i class="new-ui-random-squiggle" aria-hidden="true">
          <img :src="randomChartSquiggle" alt="" />
        </i>
        <i class="new-ui-random-star" aria-hidden="true">
          <img :src="randomChartStar" alt="" />
        </i>
        <i class="new-ui-random-bars" aria-hidden="true">
          <img :src="randomChartBars" alt="" />
        </i>
      </button>
    </section>
  </main>
</template>

<style scoped>
.new-ui-app-shell {
  position: relative;
  width: 100%;
  min-width: 1024px;
  height: 100vh;
  min-height: 640px;
  overflow: hidden;
  color: #000;
  background: #f6f6f6;
  font-family: "ALS Hauss", Arial, Helvetica, sans-serif;
  container-type: inline-size;
}

.new-ui-embedded-app {
  position: absolute;
  inset: 0;
  overflow: hidden;
  background: #f6f6f6;
}

.new-ui-app-toolbar {
  position: absolute;
  top: 20px;
  right: 40px;
  left: 40px;
  display: flex;
  height: 48px;
  align-items: center;
  justify-content: space-between;
}

.new-ui-brand-pill {
  display: flex;
  width: 303px;
  height: 48px;
  min-height: 48px;
  align-items: center;
  gap: 10px;
  padding: 12px 18px;
  border: 0;
  border-radius: 22px;
  color: #000;
  background: #fff;
  font-size: 20px;
  line-height: 24px;
}

.new-ui-brand-pill:hover {
  background: #fff;
}

.new-ui-brand-pill img {
  width: 80px;
  height: 20px;
}

.new-ui-brand-pill i {
  width: 1px;
  height: 15px;
  border-radius: 20px;
  background: rgb(0 0 0 / 15%);
}

.new-ui-app-actions {
  display: flex;
  height: 48px;
  align-items: center;
  gap: 8px;
}

.new-ui-round-action,
.new-ui-view-action,
.new-ui-share-action {
  display: flex;
  height: 48px;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 1000px;
  background: #fff;
}

.new-ui-round-action {
  position: relative;
  width: 48px;
}

.new-ui-round-action img {
  width: 28px;
  height: 28px;
}

.new-ui-chart-action i {
  position: absolute;
  bottom: 15px;
  width: 3px;
  border-radius: 2px;
  background: #000;
}

.new-ui-chart-action i:nth-child(1) { left: 15px; height: 11px; }
.new-ui-chart-action i:nth-child(2) { left: 23px; height: 20px; }
.new-ui-chart-action i:nth-child(3) { left: 30px; height: 16px; }

.new-ui-type-action {
  background-image: linear-gradient(135deg, #0029ff, #f21759);
  background-clip: text;
  color: transparent;
  font-size: 24px;
}

.new-ui-view-action {
  width: 128px;
  padding: 12px 16px;
  font-size: 20px;
  line-height: 24px;
}

.new-ui-share-action {
  width: 169px;
  gap: 8px;
  padding: 12px 16px;
  color: #fff;
  background: #000;
  font-size: 20px;
  line-height: 24px;
}

.new-ui-share-action img {
  width: 16px;
  height: 16px;
}

.new-ui-background-chart {
  position: absolute;
  top: 100px;
  right: 40px;
  left: 597px;
  aspect-ratio: 16 / 9;
  border-radius: 16px;
  background: #fff;
}

.new-ui-object-toolbar {
  position: absolute;
  top: calc(56.25cqw - 250.3125px);
  right: 40px;
  display: flex;
  height: 32px;
  align-items: center;
  gap: 8px;
}

.new-ui-slide-dots {
  display: flex;
  width: 140px;
  height: 32px;
  align-items: center;
  gap: 4px;
  padding: 12px;
  border-radius: 1000px;
  background: #fff;
}

.new-ui-slide-dots i {
  width: 8px;
  height: 8px;
  border-radius: 4px;
  background: rgb(0 0 0 / 30%);
}

.new-ui-slide-dots i.active {
  background: #000;
}

.new-ui-small-action,
.new-ui-color-action {
  display: grid;
  width: 32px;
  height: 32px;
  overflow: hidden;
  border-radius: 1000px;
  background: #fff;
  place-items: center;
}

.new-ui-small-action img {
  width: 32px;
  height: 32px;
}

.new-ui-color-action {
  background: #000;
}

.new-ui-dim-layer {
  position: absolute;
  inset: 0;
  background: rgb(0 0 0 / 40%);
  pointer-events: none;
}

.new-ui-settings-drawer {
  position: absolute;
  z-index: 2;
  top: 0;
  bottom: 0;
  left: 0;
  width: 581px;
  overflow-x: hidden;
  overflow-y: auto;
  background: #f6f6f6;
  scrollbar-width: thin;
}

.new-ui-chart-preview {
  position: absolute;
  z-index: 2;
  top: 0;
  right: 0;
  left: 581px;
  padding: 100px 40px 0 16px;
  pointer-events: none;
}

.new-ui-chart-card {
  width: 100%;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  padding: 24px;
  border-radius: 16px;
  background: #fff;
  pointer-events: auto;
}

.new-ui-random-chart-button {
  position: relative;
  display: flex;
  width: 330px;
  height: 52px;
  min-height: 52px;
  align-items: center;
  justify-content: center;
  margin: 24px auto 0;
  padding: 5px 14px 5px 10px;
  border: 0;
  border-radius: 91.772px;
  color: #4d0ae2;
  background:
    radial-gradient(
      ellipse 163px 60px at 45.9% 50%,
      rgb(144 255 0 / 66%) 0%,
      rgb(129 255 24 / 66%) 16.414%,
      rgb(98 255 73 / 66%) 49.243%,
      rgb(41 234 99 / 66%) 82.829%,
      rgb(0 213 99 / 66%) 100%
    );
  font-family: "ALS Hauss", Arial, Helvetica, sans-serif;
  font-size: 16px;
  font-weight: 700;
  line-height: 1.2;
  pointer-events: auto;
}

.new-ui-random-chart-button:hover {
  color: #4d0ae2;
  filter: brightness(1.04);
}

.new-ui-random-chart-button:active {
  transform: translateY(1px);
}

.new-ui-random-chart-button:focus-visible {
  outline: 3px solid #4d0ae2;
  outline-offset: 3px;
}

.new-ui-random-chart-button > span {
  position: relative;
  z-index: 1;
  white-space: nowrap;
}

.new-ui-random-chart-button i {
  position: absolute;
  display: grid;
  pointer-events: none;
  place-items: center;
}

.new-ui-random-chart-button i img {
  display: block;
  width: 100%;
  height: 100%;
}

.new-ui-random-squiggle {
  top: -52px;
  left: -26.5px;
  width: 155.549px;
  height: 155.549px;
}

.new-ui-random-squiggle img {
  max-width: 119.482px;
  max-height: 119.482px;
  transform: rotate(-22.01deg);
}

.new-ui-random-star {
  top: -1px;
  left: 236.5px;
  width: 28.925px;
  height: 28.925px;
}

.new-ui-random-star img {
  max-width: 22.252px;
  max-height: 22.252px;
  transform: rotate(21.8deg);
}

.new-ui-random-bars {
  top: 18px;
  left: 254.5px;
  width: 38.561px;
  height: 36.598px;
}

.new-ui-random-bars img {
  max-width: 30.784px;
  max-height: 27.365px;
  transform: rotate(21.06deg);
}
</style>
