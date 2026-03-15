<script setup lang="ts">
defineProps<{
  connected: boolean
  connecting: boolean
}>()
</script>

<template>
  <div class="flex items-center gap-1.5 text-xs">
    <span
      :class="[
        'w-2 h-2 rounded-full',
        connected ? 'bg-emerald-400 shadow-emerald-400/50 shadow-sm' : connecting ? 'bg-yellow-400 animate-pulse' : 'bg-red-400'
      ]"
    />
    <span :class="connected ? 'text-emerald-400' : connecting ? 'text-yellow-400' : 'text-red-400'">
      {{ connected ? 'Live' : connecting ? 'กำลังเชื่อมต่อ...' : 'ไม่ได้เชื่อมต่อ' }}
    </span>
  </div>
</template>
