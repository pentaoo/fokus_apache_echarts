<script setup lang="ts">
import fokusLogo from '../assets/new-ui/app-shell/fokus-logo.svg'
import leadsIcon from '../assets/new-ui/app-shell/leads.svg'
import shareIcon from '../assets/new-ui/app-shell/share.svg'
import actionStarIcon from '../assets/new-ui/app-shell/action-star.svg'
import actionUpIcon from '../assets/new-ui/app-shell/action-up.svg'
import actionCopyIcon from '../assets/new-ui/app-shell/action-copy.svg'
import actionDeleteIcon from '../assets/new-ui/app-shell/action-delete.svg'
import actionSparkleIcon from '../assets/new-ui/app-shell/action-sparkle.svg'

defineEmits<{
  'show-classic': []
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
    </section>
  </main>
</template>

<style scoped>
.new-ui-app-shell {
  --new-ui-slide-available-width: calc(100cqw - 637px);
  --new-ui-slide-max-height: calc(100vh - 180px);
  --new-ui-slide-width: min(
    var(--new-ui-slide-available-width),
    calc(var(--new-ui-slide-max-height) * 16 / 9)
  );
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
  top: calc(108px + var(--new-ui-slide-width) * 9 / 16);
  right: calc(
    40px +
      (var(--new-ui-slide-available-width) - var(--new-ui-slide-width)) / 2
  );
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
  scrollbar-width: none;
}

.new-ui-settings-drawer::-webkit-scrollbar {
  display: none;
}

.new-ui-chart-preview {
  position: absolute;
  z-index: 2;
  top: 0;
  right: 0;
  left: 581px;
  display: flex;
  align-items: center;
  padding: 100px 40px 0 16px;
  flex-direction: column;
  pointer-events: none;
}

.new-ui-chart-card {
  width: var(--new-ui-slide-width);
  max-width: 100%;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  padding: 24px;
  border-radius: 16px;
  background: #fff;
  pointer-events: auto;
}

.new-ui-chart-actions {
  display: flex;
  width: max-content;
  max-width: 100%;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 12px;
  margin: 24px auto 0;
  pointer-events: auto;
}

.new-ui-edit-data-button {
  height: 52px;
  min-height: 52px;
  padding: 5px 24px;
  border: 2px solid #4d0ae2;
  border-radius: 91.772px;
  color: #4d0ae2;
  background: #fff;
  font-size: 16px;
  font-weight: 700;
  line-height: 1.2;
}

.new-ui-edit-data-button:hover {
  color: #fff;
  background: #4d0ae2;
}

.new-ui-data-editor-backdrop {
  position: fixed;
  z-index: 10;
  inset: 0;
  display: grid;
  padding: 32px;
  background: rgb(0 0 0 / 48%);
  pointer-events: auto;
  place-items: center;
}

.new-ui-data-editor-dialog {
  width: min(900px, 100%);
  max-height: calc(100vh - 64px);
  overflow: auto;
  padding: 24px;
  border-radius: 24px;
  background: #f6f6f6;
  box-shadow: 0 24px 80px rgb(0 0 0 / 25%);
}

.new-ui-data-editor-dialog > header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.new-ui-data-editor-dialog > header h2 {
  margin: 0;
  font-size: 28px;
  font-weight: 900;
  line-height: 1.1;
}

.new-ui-data-editor-dialog > header button {
  display: grid;
  width: 40px;
  min-width: 40px;
  height: 40px;
  min-height: 40px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  color: #000;
  background: #fff;
  font-size: 28px;
  line-height: 1;
  place-items: center;
}

.new-ui-data-editor-dialog :deep(.editor-panel) {
  padding: 0;
  border: 0;
  background: transparent;
}

.new-ui-data-editor-dialog :deep(.panel-heading) {
  display: none;
}

@media (max-width: 900px) {
  .new-ui-app-shell {
    min-width: 0;
    height: auto;
    min-height: 100vh;
    overflow: visible;
  }

  .new-ui-embedded-app {
    display: none;
  }

  .new-ui-settings-drawer {
    position: relative;
    inset: auto;
    width: 100%;
    overflow: visible;
  }

  .new-ui-settings-drawer :deep(.new-design-panel) {
    margin: 0 auto;
  }

  .new-ui-chart-preview {
    position: relative;
    inset: auto;
    padding: 24px 16px 64px;
    pointer-events: auto;
  }

  .new-ui-chart-card {
    width: 100%;
    aspect-ratio: 16 / 9;
  }
}

@media (max-width: 620px) {
  .new-ui-data-editor-backdrop {
    padding: 12px;
  }

  .new-ui-data-editor-dialog {
    max-height: calc(100vh - 24px);
    padding: 16px;
    border-radius: 18px;
  }

  .new-ui-chart-actions {
    width: 100%;
  }

  .new-ui-edit-data-button {
    width: 100%;
    max-width: 330px;
  }
}
</style>
