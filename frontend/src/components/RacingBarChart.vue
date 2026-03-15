<script setup lang="ts">
import { computed } from 'vue'
import type { OptionResult } from '@/types'
import { getAvatarById } from '@/utils/avatars'

const props = defineProps<{
  options: OptionResult[]
  total: number
  votedIds?: number[]
  title?: string
  showVoterName?: boolean  // true = show names, false (default) = show avatars
}>()

const COLORS = [
  '#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b',
  '#ef4444', '#ec4899', '#3b82f6', '#14b8a6', '#f97316',
  '#84cc16', '#a855f7', '#0ea5e9', '#22c55e', '#eab308',
]

const maxCount = computed(() => Math.max(...props.options.map((o) => o.count), 1))

function getWidth(count: number): string {
  if (props.total === 0) return '0%'
  return `${Math.max((count / maxCount.value) * 100, count > 0 ? 2 : 0)}%`
}

function getPercent(count: number): string {
  if (props.total === 0) return '0%'
  return `${Math.round((count / props.total) * 100)}%`
}

function getColor(index: number): string {
  return COLORS[index % COLORS.length]
}

// Show at most 8 voter avatars / names per bar to avoid overflow
function getVoterDisplay(opt: OptionResult) {
  return (opt.voters ?? []).slice(0, 8)
}

// ── High-res image export ──────────────────────────────────────────────────────
function exportAsImage() {
  if (props.options.length === 0) return

  const W = 1200
  const ROW_H = 72
  const HEADER_H = 70
  const FOOTER_H = 40
  const H = HEADER_H + props.options.length * ROW_H + FOOTER_H
  const BAR_MAX_W = 720
  const LABEL_X = 20
  const BAR_X = 360
  const RANK_BADGES = ['🥇', '🥈', '🥉']

  const escapeSvg = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

  let svgRows = ''
  props.options.forEach((opt, i) => {
    const y = HEADER_H + i * ROW_H
    const barW = opt.count > 0 ? Math.max((opt.count / maxCount.value) * BAR_MAX_W, 8) : 0
    const color = COLORS[i % COLORS.length]
    const pct = props.total > 0 ? Math.round((opt.count / props.total) * 100) : 0
    const badge = i < 3 && opt.count > 0 ? RANK_BADGES[i] : ''

    svgRows += `
  <rect x="${LABEL_X}" y="${y + ROW_H / 2 - 14}" width="${W - LABEL_X * 2}" height="28" rx="6" fill="#1F2937"/>
  <rect x="${BAR_X}" y="${y + ROW_H / 2 - 14}" width="${barW}" height="28" rx="6" fill="${color}"/>
  <text x="${LABEL_X + 8}" y="${y + ROW_H / 2 + 5}" font-family="system-ui, sans-serif" font-size="14" fill="#E5E7EB" dominant-baseline="middle">${escapeSvg(opt.label)}</text>
  <text x="${W - LABEL_X - 8}" y="${y + ROW_H / 2 + 5}" font-family="system-ui, sans-serif" font-size="13" fill="#9CA3AF" text-anchor="end" dominant-baseline="middle">${opt.count} (${pct}%) ${badge}</text>`
  })

  const chartTitle = escapeSvg(props.title ?? 'ผลโหวต')
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="#111827"/>
  <text x="${W / 2}" y="42" font-family="system-ui, sans-serif" font-size="22" font-weight="700" fill="#F9FAFB" text-anchor="middle">${chartTitle}</text>
  <text x="${W / 2}" y="62" font-family="system-ui, sans-serif" font-size="13" fill="#6B7280" text-anchor="middle">ผลโหวตทั้งหมด ${props.total} โหวต</text>
  ${svgRows}
  <text x="${W / 2}" y="${H - 12}" font-family="system-ui, sans-serif" font-size="11" fill="#374151" text-anchor="middle">Smart Vote — สร้างด้วย ❤️</text>
</svg>`

  // Convert SVG to high-res PNG via canvas
  const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(svgBlob)
  const img = new Image()
  img.onload = () => {
    const scale = 2
    const canvas = document.createElement('canvas')
    canvas.width = W * scale
    canvas.height = H * scale
    const ctx = canvas.getContext('2d')!
    ctx.scale(scale, scale)
    ctx.drawImage(img, 0, 0)
    URL.revokeObjectURL(url)
    const a = document.createElement('a')
    a.href = canvas.toDataURL('image/png')
    a.download = `vote-results-${Date.now()}.png`
    a.click()
  }
  img.onerror = () => {
    // Fallback: download SVG directly
    const a = document.createElement('a')
    a.href = url
    a.download = `vote-results-${Date.now()}.svg`
    a.click()
  }
  img.src = url
}

defineExpose({ exportAsImage })
</script>

<template>
  <div class="bg-gray-900 rounded-2xl p-5">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-sm font-semibold text-gray-300">ผลโหวต Realtime</h3>
      <div class="flex items-center gap-3">
        <span class="text-xs text-gray-500">{{ total }} โหวต</span>
        <button
          v-if="options.length > 0"
          @click="exportAsImage"
          title="Export ผลโหวตเป็นรูปภาพความละเอียดสูง"
          class="text-xs text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 px-2.5 py-1 rounded-lg transition flex items-center gap-1"
        >🖼️ Export</button>
      </div>
    </div>

    <div v-if="options.length === 0" class="text-center py-8 text-gray-600 text-sm">
      ยังไม่มีผลโหวต
    </div>

    <div v-else class="space-y-3">
      <div
        v-for="(opt, i) in options"
        :key="opt.id"
        class="relative"
      >
        <!-- Label row -->
        <div class="flex items-center justify-between mb-1.5 gap-2">
          <div class="flex items-center gap-1.5 min-w-0">
            <span
              v-if="votedIds?.includes(opt.id)"
              class="text-xs flex-shrink-0"
              title="ตัวเลือกที่คุณโหวต"
            >✓</span>
            <span class="text-sm font-medium truncate text-gray-200">{{ opt.label }}</span>
          </div>
          <div class="flex items-center gap-2 flex-shrink-0">
            <span class="text-xs text-gray-400 font-mono">{{ opt.count }}</span>
            <span class="text-xs text-gray-500 w-9 text-right">{{ getPercent(opt.count) }}</span>
          </div>
        </div>

        <!-- Bar track -->
        <div class="h-8 bg-gray-800 rounded-lg overflow-hidden relative">
          <!-- Animated bar -->
          <div
            class="h-full rounded-lg racing-bar flex items-center px-2.5 overflow-hidden"
            :style="{
              width: getWidth(opt.count),
              backgroundColor: getColor(i),
              opacity: opt.count === 0 ? '0.3' : '1',
              transition: 'width 0.6s cubic-bezier(0.4,0,0.2,1), opacity 0.3s ease'
            }"
          >
            <span
              v-if="opt.count > 0"
              class="text-white text-xs font-bold truncate select-none"
            >{{ opt.label }}</span>
          </div>

          <!-- Rank badge for top 3 -->
          <div
            v-if="i < 3 && opt.count > 0"
            class="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-white/50"
          >
            {{ ['🥇', '🥈', '🥉'][i] }}
          </div>
        </div>

        <!-- Voter avatars / names row -->
        <div
          v-if="getVoterDisplay(opt).length > 0"
          class="flex items-center gap-1 mt-1.5 flex-wrap"
        >
          <template v-for="v in getVoterDisplay(opt)" :key="v.avatar_id + v.voter_name">
            <!-- Name badge (when show_voter_name and name exists) -->
            <span
              v-if="showVoterName && v.voter_name"
              class="inline-flex items-center gap-1 bg-gray-800 rounded-full px-2 py-0.5"
              :title="v.voter_name"
            >
              <span
                class="w-4 h-4 rounded-full overflow-hidden flex-shrink-0 inline-block"
                v-html="getAvatarById(v.avatar_id)?.svg ?? ''"
              />
              <span class="text-xs text-gray-300 max-w-[80px] truncate">{{ v.voter_name }}</span>
            </span>
            <!-- Avatar only (default) -->
            <span
              v-else
              class="w-6 h-6 rounded-full overflow-hidden bg-gray-700 flex-shrink-0 inline-block"
              :title="showVoterName ? v.voter_name || 'ไม่ระบุชื่อ' : ''"
              v-html="getAvatarById(v.avatar_id)?.svg ?? ''"
            />
          </template>
          <span
            v-if="(opt.voters?.length ?? 0) > 8"
            class="text-xs text-gray-600"
          >+{{ (opt.voters?.length ?? 0) - 8 }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
