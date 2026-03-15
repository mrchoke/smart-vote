<script setup lang="ts">
import { computed } from 'vue'
import type { SessionPublic } from '@/types'

const props = defineProps<{
  session: SessionPublic
  selected: number[]
}>()

const emit = defineEmits<{
  'update:selected': [value: number[]]
}>()

const isSingle = computed(() => props.session.type === 'single')

function toggleOption(id: number) {
  if (isSingle.value) {
    emit('update:selected', [id])
  } else {
    const current = [...props.selected]
    const idx = current.indexOf(id)
    if (idx !== -1) {
      current.splice(idx, 1)
    } else {
      const max = props.session.max_selections
      if (max !== null && current.length >= max) return
      current.push(id)
    }
    emit('update:selected', current)
  }
}

const typeLabel = computed(() => {
  switch (props.session.type) {
    case 'single': return 'เลือกได้ 1 ข้อ'
    case 'multiple': return props.session.max_selections
      ? `เลือกได้สูงสุด ${props.session.max_selections} ข้อ`
      : 'เลือกได้หลายข้อ'
    case 'datetime': return 'เลือกวัน-เวลา (เลือกได้ 1 ข้อ)'
    case 'time': return 'เลือกเวลา (เลือกได้ 1 ข้อ)'
  }
})
</script>

<template>
  <div>
    <p class="text-xs text-gray-500 mb-3">{{ typeLabel }}</p>
    <div class="space-y-2">
      <button
        v-for="opt in session.options"
        :key="opt.id"
        type="button"
        @click="toggleOption(opt.id)"
        :class="[
          'w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border transition text-left group',
          selected.includes(opt.id)
            ? 'border-indigo-500 bg-indigo-950 text-white'
            : 'border-gray-700 bg-gray-800/50 text-gray-300 hover:border-gray-500 hover:bg-gray-800'
        ]"
      >
        <!-- Indicator -->
        <span :class="[
          'flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center text-xs transition',
          isSingle ? 'rounded-full' : 'rounded-md',
          selected.includes(opt.id)
            ? 'border-indigo-400 bg-indigo-500'
            : 'border-gray-600 group-hover:border-gray-400'
        ]">
          <span v-if="selected.includes(opt.id)" class="text-white text-[10px] font-bold">✓</span>
        </span>
        <span class="flex-1 text-sm font-medium">{{ opt.label }}</span>
        <span
          v-if="opt.added_by"
          class="text-[10px] text-gray-600 flex-shrink-0"
          title="ตัวเลือกที่ผู้ร่วมเพิ่ม"
        >+เพิ่มเอง</span>
      </button>
    </div>
  </div>
</template>
