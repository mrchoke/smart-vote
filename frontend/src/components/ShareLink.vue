<script setup lang="ts">
import { ref } from 'vue'
import QrCodePopup from './QrCodePopup.vue'

const props = defineProps<{
  url: string
  label?: string
}>()

const copied = ref(false)
const showQr = ref(false)

async function copyToClipboard() {
  try {
    await navigator.clipboard.writeText(props.url)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  } catch {
    // fallback: select input
    const input = document.querySelector('#share-link-input') as HTMLInputElement
    input?.select()
  }
}
</script>

<template>
  <div class="bg-gray-900 rounded-xl p-4">
    <p class="text-xs text-gray-500 mb-2">{{ label ?? 'แชร์ลิงก์' }}</p>
    <div class="flex gap-2">
      <input
        id="share-link-input"
        :value="url"
        readonly
        class="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-gray-300 text-sm focus:outline-none cursor-text"
        @click="($event.target as HTMLInputElement).select()"
      />
      <button
        @click="showQr = true"
        class="px-3 py-2.5 rounded-xl text-sm font-medium transition bg-gray-700 hover:bg-gray-600 text-gray-300"
        title="QR Code"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="2" y="2" width="8" height="8" rx="1" />
          <rect x="14" y="2" width="8" height="8" rx="1" />
          <rect x="2" y="14" width="8" height="8" rx="1" />
          <rect x="14" y="14" width="4" height="4" rx="0.5" />
          <rect x="20" y="14" width="2" height="2" />
          <rect x="14" y="20" width="2" height="2" />
          <rect x="20" y="20" width="2" height="2" />
          <rect x="5" y="5" width="2" height="2" />
          <rect x="17" y="5" width="2" height="2" />
          <rect x="5" y="17" width="2" height="2" />
        </svg>
      </button>
      <button
        @click="copyToClipboard"
        :class="[
          'px-4 py-2.5 rounded-xl text-sm font-medium transition',
          copied
            ? 'bg-emerald-700 text-emerald-200'
            : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
        ]"
      >
        {{ copied ? '✓ คัดลอกแล้ว' : 'คัดลอก' }}
      </button>
    </div>
  </div>

  <QrCodePopup v-if="showQr" :url="url" :label="label" @close="showQr = false" />
</template>
