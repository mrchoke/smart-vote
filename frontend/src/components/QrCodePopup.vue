<script setup lang="ts">
import QrcodeVue from 'qrcode.vue'

defineProps<{
  url: string
  label?: string
}>()

const emit = defineEmits<{
  close: []
}>()

function onBackdropClick(e: MouseEvent) {
  if (e.target === e.currentTarget) emit('close')
}
</script>

<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      @click="onBackdropClick"
      @keydown.escape="emit('close')"
    >
      <div class="bg-gray-900 border border-gray-700 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl space-y-4">
        <!-- Header -->
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-semibold text-gray-300">{{ label ?? 'QR Code' }}</h3>
          <button
            @click="emit('close')"
            class="text-gray-500 hover:text-white transition text-lg leading-none"
          >✕</button>
        </div>

        <!-- QR Code -->
        <div class="flex justify-center bg-white rounded-xl p-4">
          <QrcodeVue :value="url" :size="220" level="M" />
        </div>

        <!-- URL -->
        <p class="text-xs text-gray-500 text-center break-all">{{ url }}</p>
      </div>
    </div>
  </Teleport>
</template>
