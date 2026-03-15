<script setup lang="ts">
import { computed } from 'vue'
import { AVATARS } from '@/utils/avatars'

const props = defineProps<{
  modelValue: number  // avatar_id
  name: string
  requireName?: boolean  // default true; false = avatar only, name optional
}>()

const emit = defineEmits<{
  'update:modelValue': [value: number]
  'update:name': [value: string]
  'confirm': []
  'skip': []
}>()

const localName = computed({
  get: () => props.name,
  set: (v) => emit('update:name', v),
})

const selectedId = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

const needsName = computed(() => props.requireName !== false)
const selectedAvatar = computed(() => AVATARS.find((a) => a.id === selectedId.value) ?? AVATARS[0])
const isValid = computed(() => {
  if (needsName.value) return localName.value.trim().length >= 1 && selectedId.value > 0
  return selectedId.value > 0
})

function confirm() {
  if (isValid.value) emit('confirm')
}
</script>

<template>
  <div class="bg-gray-900 rounded-2xl p-5 space-y-5 shadow-xl border border-gray-700">
    <div class="text-center">
      <div class="text-2xl mb-1">{{ needsName ? '👤' : '🎭' }}</div>
      <h3 class="text-base font-semibold text-white">{{ needsName ? 'ตั้งชื่อและเลือก Avatar' : 'เลือก Avatar ของคุณ' }}</h3>
      <p class="text-xs text-gray-500 mt-1">{{ needsName ? 'Admin กำหนดให้ระบุตัวตนก่อนโหวต' : 'เลือก Avatar เพื่อแสดงในผลโหวต' }}</p>
    </div>

    <!-- Selected avatar preview -->
    <div class="flex flex-col items-center gap-2">
      <div
        class="w-20 h-20 rounded-full overflow-hidden bg-gray-800 border-2 border-indigo-500 shadow-lg"
        v-html="selectedAvatar.svg"
      />
      <span class="text-sm text-gray-400">{{ selectedAvatar.emoji }} {{ selectedAvatar.name }}</span>
    </div>

    <!-- Avatar grid -->
    <div>
      <p class="text-xs text-gray-500 mb-2 text-center">เลือก Avatar</p>
      <div class="grid grid-cols-5 gap-2">
        <button
          v-for="avatar in AVATARS"
          :key="avatar.id"
          type="button"
          @click="selectedId = avatar.id"
          :title="avatar.name"
          :class="[
            'w-12 h-12 rounded-full overflow-hidden transition-all duration-150',
            selectedId === avatar.id
              ? 'ring-2 ring-indigo-400 ring-offset-2 ring-offset-gray-900 scale-110'
              : 'opacity-70 hover:opacity-100 hover:scale-105'
          ]"
          v-html="avatar.svg"
        />
      </div>
    </div>

    <!-- Name input (only when requireName) -->
    <div v-if="needsName">
      <label class="block text-xs font-medium text-gray-400 mb-1.5">ชื่อของคุณ <span class="text-red-400">*</span></label>
      <input
        v-model="localName"
        type="text"
        maxlength="60"
        placeholder="กรอกชื่อ..."
        @keydown.enter="confirm"
        class="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm transition"
      />
    </div>

    <!-- Confirm + optional skip -->
    <div class="flex gap-2">
      <button
        v-if="!needsName"
        @click="emit('skip')"
        class="flex-1 bg-gray-700 hover:bg-gray-600 text-gray-300 font-medium py-3 rounded-xl transition text-sm"
      >
        ข้ามไป (สุ่ม)
      </button>
      <button
        @click="confirm"
        :disabled="!isValid"
        :class="[
          'font-semibold py-3 rounded-xl transition',
          needsName ? 'w-full' : 'flex-1',
          'bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-900 disabled:cursor-not-allowed text-white'
        ]"
      >
        ✅ {{ needsName ? 'ยืนยันและเข้าร่วมโหวต' : 'ยืนยัน Avatar' }}
      </button>
    </div>
  </div>
</template>
