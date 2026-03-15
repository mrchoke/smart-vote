<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  url: string
  label?: string
}>()

const copied = ref(false)

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
</template>
