<script setup lang="ts">
import { onMounted } from 'vue'
import { useVoteSession } from '@/composables/useVoteSession'
import { useWebSocket } from '@/composables/useWebSocket'
import RacingBarChart from '@/components/RacingBarChart.vue'
import ConnectionStatus from '@/components/ConnectionStatus.vue'
import ShareLink from '@/components/ShareLink.vue'
import { computed } from 'vue'

const props = defineProps<{ id: string }>()

const {
  session,
  isLoading,
  fetchError,
  sortedOptions,
  fetchSession,
  applyResultsUpdate,
  applyOptionAdded,
  applySessionClosed,
  applySessionReopened,
} = useVoteSession()

const { isConnected, isConnecting, onMessage } = useWebSocket(props.id)

onMessage((msg) => {
  switch (msg.type) {
    case 'init':
      session.value = msg.session
      break
    case 'results_update':
      applyResultsUpdate(msg.options, msg.total_votes)
      break
    case 'option_added':
      applyOptionAdded(msg.option)
      break
    case 'session_closed':
      applySessionClosed()
      break
    case 'session_reopened':
      applySessionReopened()
      break
  }
})

onMounted(async () => {
  await fetchSession(props.id)
})

const shareUrl = computed(() =>
  typeof window !== 'undefined' ? `${window.location.origin}/vote/${props.id}` : ''
)
</script>

<template>
  <div class="min-h-screen bg-gray-950 text-white">
    <!-- Top bar -->
    <div class="sticky top-0 z-10 bg-gray-950/90 backdrop-blur border-b border-gray-800 px-4 py-3 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <span class="text-xl">📊</span>
        <span class="font-semibold text-sm truncate max-w-[200px]">{{ session?.title ?? 'ผลโหวต' }}</span>
      </div>
      <div class="flex items-center gap-3">
        <span
          v-if="session?.status === 'closed'"
          class="text-xs bg-red-900/50 text-red-400 px-2 py-1 rounded-full"
        >ปิดโหวตแล้ว</span>
        <ConnectionStatus :connected="isConnected" :connecting="isConnecting" />
      </div>
    </div>

    <div class="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div v-if="isLoading && !session" class="text-center py-20">
        <div class="text-4xl animate-pulse">📊</div>
        <p class="text-gray-400 mt-3">กำลังโหลดผลโหวต...</p>
      </div>

      <div v-else-if="fetchError && !session" class="text-center py-20">
        <p class="text-red-400">{{ fetchError }}</p>
      </div>

      <template v-else-if="session">
        <!-- Stats -->
        <div class="text-center py-6">
          <h1 class="text-2xl font-bold text-white">{{ session.title }}</h1>
          <p v-if="session.description" class="text-gray-400 text-sm mt-1">{{ session.description }}</p>
          <div class="flex items-center justify-center gap-4 mt-3 text-sm text-gray-500">
            <span class="font-bold text-3xl text-indigo-400">{{ session.total_votes }}</span>
          </div>
          <p class="text-xs text-gray-600 mt-1">โหวตทั้งหมด</p>
        </div>

        <!-- Racing bar chart – full view -->
        <RacingBarChart :options="sortedOptions" :total="session.total_votes" />

        <!-- Share -->
        <ShareLink :url="shareUrl" label="แชร์ลิงก์โหวต" />
      </template>
    </div>
  </div>
</template>
