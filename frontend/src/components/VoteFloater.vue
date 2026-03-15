<script setup lang="ts">
import { getAvatarById, getRandomAvatar } from '@/utils/avatars'

interface FloatItem {
  id: number
  avatar_id: number
  voter_name: string
}

defineProps<{
  items: FloatItem[]
}>()

function getAvatar(id: number) {
  return getAvatarById(id) ?? getRandomAvatar()
}

// Random horizontal position per item (use id as seed for stability)
function getLeft(id: number): string {
  const pct = 5 + ((id * 37 + 13) % 90)
  return `${pct}%`
}
</script>

<template>
  <Teleport to="body">
    <div class="pointer-events-none fixed inset-0 overflow-hidden z-50">
      <TransitionGroup name="floater">
        <div
          v-for="item in items"
          :key="item.id"
          class="absolute bottom-0 floater-item"
          :style="{ left: getLeft(item.id) }"
        >
          <!-- Avatar bubble -->
          <div class="flex flex-col items-center gap-1">
            <div
              class="w-12 h-12 rounded-full overflow-hidden shadow-xl ring-2 ring-white/20 bg-gray-800"
              v-html="getAvatar(item.avatar_id).svg"
            />
            <span
              v-if="item.voter_name"
              class="text-xs text-white bg-black/60 rounded-full px-2 py-0.5 whitespace-nowrap max-w-[100px] truncate"
            >{{ item.voter_name }}</span>
          </div>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.floater-item {
  animation: float-up 2.8s ease-out forwards;
}

@keyframes float-up {
  0%   { transform: translateY(0) scale(0.5); opacity: 0; }
  15%  { transform: translateY(-60px) scale(1.1); opacity: 1; }
  80%  { transform: translateY(-320px) scale(1); opacity: 0.9; }
  100% { transform: translateY(-420px) scale(0.8); opacity: 0; }
}

.floater-enter-active {
  /* handled by keyframe animation above */
}
.floater-leave-active {
  animation: none;
  transition: opacity 0.3s;
}
.floater-leave-to {
  opacity: 0;
}
</style>
