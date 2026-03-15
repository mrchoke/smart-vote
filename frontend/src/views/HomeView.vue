<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import type { VoteType } from '@/types'

const router = useRouter()
const toast = useToast()

const isSubmitting = ref(false)
const title = ref('')
const description = ref('')
const type = ref<VoteType>('single')
const allowAddOptions = ref(false)
const requireVoterName = ref(false)
const showVoterName = ref(false)
const maxSelections = ref<number | null>(null)
const options = ref<string[]>(['', ''])

const VOTE_TYPES: { value: VoteType; label: string; icon: string; desc: string }[] = [
  { value: 'single', label: 'เลือกได้ 1 ข้อ', icon: '🔘', desc: 'ผู้โหวตเลือกได้เพียง 1 ตัวเลือก' },
  { value: 'multiple', label: 'เลือกได้หลายข้อ', icon: '☑️', desc: 'ผู้โหวตเลือกได้มากกว่า 1 ตัวเลือก' },
  { value: 'datetime', label: 'วัน เวลา', icon: '📅', desc: 'ตัวเลือกเป็นวันและเวลา' },
  { value: 'time', label: 'เวลา', icon: '⏰', desc: 'ตัวเลือกเป็นเวลาเท่านั้น' },
]

const canAddMoreOptions = computed(() => options.value.length < 50)
const isValid = computed(() =>
  title.value.trim().length > 0 &&
  options.value.filter((o) => o.trim().length > 0).length >= 2
)

function addOption() {
  if (canAddMoreOptions.value) options.value.push('')
}

function removeOption(index: number) {
  if (options.value.length > 2) options.value.splice(index, 1)
}

function moveOption(index: number, dir: -1 | 1) {
  const newIndex = index + dir
  if (newIndex < 0 || newIndex >= options.value.length) return
  const copy = [...options.value]
  ;[copy[index], copy[newIndex]] = [copy[newIndex], copy[index]]
  options.value = copy
}

// ── CSV / Excel Import ────────────────────────────────────────────────────────
const fileInputRef = ref<HTMLInputElement | null>(null)

function parseCSVLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => {
      // Handle simple CSV: remove surrounding quotes if present
      const trimmed = line.trim()
      if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
        return trimmed.slice(1, -1).replace(/""/g, '"').trim()
      }
      // Take only first column if comma-separated
      return trimmed.split(',')[0].trim()
    })
    .filter((l) => l.length > 0)
    .slice(0, 50)
}

async function handleImportFile(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return

  const ext = file.name.toLowerCase().split('.').pop()

  if (ext === 'csv' || ext === 'txt') {
    const text = await file.text()
    const labels = parseCSVLines(text)
    if (labels.length === 0) { toast.error('ไม่พบตัวเลือกในไฟล์'); return }
    options.value = labels.length >= 2 ? labels : [...labels, ...Array(2 - labels.length).fill('')]
    toast.success(`นำเข้า ${labels.length} ตัวเลือกสำเร็จ`)
  } else if (ext === 'xlsx' || ext === 'xls') {
    try {
      const { read, utils } = await import('xlsx')
      const buffer = await file.arrayBuffer()
      const wb = read(buffer)
      const ws = wb.Sheets[wb.SheetNames[0]]
      const rows = utils.sheet_to_json<string[]>(ws, { header: 1 }) as string[][]
      const labels = rows
        .map((row) => String(row[0] ?? '').trim())
        .filter((v) => v.length > 0)
        .slice(0, 50)
      if (labels.length === 0) { toast.error('ไม่พบตัวเลือกในไฟล์'); return }
      options.value = labels.length >= 2 ? labels : [...labels, ...Array(2 - labels.length).fill('')]
      toast.success(`นำเข้า ${labels.length} ตัวเลือกสำเร็จ`)
    } catch {
      toast.error('ไม่สามารถอ่านไฟล์ Excel ได้')
    }
  } else {
    toast.error('รองรับเฉพาะ .csv, .txt, .xlsx, .xls')
  }

  // Reset file input
  if (fileInputRef.value) fileInputRef.value.value = ''
}

function exportOptionsCSV() {
  const clean = options.value.map((o) => o.trim()).filter((o) => o)
  if (clean.length === 0) { toast.error('ยังไม่มีตัวเลือก'); return }
  const csvContent = clean.map((o) => `"${o.replace(/"/g, '""')}"`).join('\n')
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url; a.download = 'options.csv'; a.click()
  URL.revokeObjectURL(url)
}

async function handleSubmit() {
  if (!isValid.value || isSubmitting.value) return

  isSubmitting.value = true
  const cleanOptions = options.value.map((o) => o.trim()).filter((o) => o.length > 0)

  try {
    const body: Record<string, unknown> = {
      title: title.value.trim(),
      description: description.value.trim(),
      type: type.value,
      allow_add_options: allowAddOptions.value,
      require_voter_name: requireVoterName.value,
      show_voter_name: showVoterName.value,
      options: cleanOptions,
    }
    if (type.value === 'multiple' && maxSelections.value && maxSelections.value >= 2) {
      body.max_selections = maxSelections.value
    }

    const res = await fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error(data.error ?? `HTTP ${res.status}`)
    }

    const data = await res.json()
    // Store admin token in localStorage
    localStorage.setItem(`admin_token_${data.session.id}`, data.adminToken)

    toast.success('สร้างโหวตสำเร็จ!')
    await router.push({ name: 'admin', params: { id: data.session.id }, query: { token: data.adminToken } })
  } catch (e) {
    toast.error(`เกิดข้อผิดพลาด: ${e instanceof Error ? e.message : String(e)}`)
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-gray-950 flex items-center justify-center p-4">
    <div class="w-full max-w-2xl">
      <!-- Header -->
      <div class="text-center mb-8">
        <div class="text-5xl mb-3">🗳️</div>
        <h1 class="text-3xl font-bold text-white">Smart Vote</h1>
        <p class="text-gray-400 mt-2">ระบบโหวตอัจฉริยะแบบ Realtime</p>
      </div>

      <form @submit.prevent="handleSubmit" class="bg-gray-900 rounded-2xl p-6 md:p-8 space-y-6 shadow-2xl">
        <!-- Title -->
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">
            คำถาม / หัวข้อโหวต <span class="text-red-400">*</span>
          </label>
          <input
            v-model="title"
            type="text"
            maxlength="200"
            placeholder="เช่น วันไหนที่สะดวกประชุม?"
            class="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
          />
        </div>

        <!-- Description -->
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">คำอธิบาย (ไม่บังคับ)</label>
          <textarea
            v-model="description"
            maxlength="1000"
            rows="2"
            placeholder="รายละเอียดเพิ่มเติม..."
            class="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition resize-none"
          />
        </div>

        <!-- Vote Type -->
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-3">รูปแบบโหวต</label>
          <div class="grid grid-cols-2 gap-3">
            <button
              v-for="vt in VOTE_TYPES"
              :key="vt.value"
              type="button"
              @click="type = vt.value"
              :class="[
                'flex flex-col items-start p-4 rounded-xl border transition cursor-pointer text-left',
                type === vt.value
                  ? 'border-indigo-500 bg-indigo-950 text-white'
                  : 'border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-500'
              ]"
            >
              <span class="text-2xl mb-1">{{ vt.icon }}</span>
              <span class="font-medium text-sm">{{ vt.label }}</span>
              <span class="text-xs text-gray-500 mt-1">{{ vt.desc }}</span>
            </button>
          </div>
        </div>

        <!-- Max selections (for multiple type) -->
        <div v-if="type === 'multiple'" class="bg-gray-800 rounded-xl p-4">
          <label class="block text-sm font-medium text-gray-300 mb-2">จำนวนสูงสุดที่เลือกได้</label>
          <div class="flex items-center gap-3">
            <input
              v-model.number="maxSelections"
              type="number"
              min="2"
              max="50"
              placeholder="ไม่จำกัด"
              class="w-32 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
            />
            <span class="text-gray-500 text-sm">เว้นว่างหากไม่จำกัด</span>
          </div>
        </div>

        <!-- Options -->
        <div>
          <div class="flex items-center justify-between mb-3">
            <label class="block text-sm font-medium text-gray-300">
              ตัวเลือก <span class="text-red-400">*</span>
              <span class="text-gray-500 font-normal ml-2">(ขั้นต่ำ 2 ข้อ)</span>
            </label>
            <!-- Import / Export buttons -->
            <div class="flex items-center gap-2">
              <button
                type="button"
                @click="exportOptionsCSV"
                title="Export ตัวเลือกเป็น CSV"
                class="text-xs text-gray-400 hover:text-gray-200 flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-gray-700 transition"
              >⬇️ CSV</button>
              <button
                type="button"
                @click="() => fileInputRef?.click()"
                title="Import ตัวเลือกจาก CSV / Excel"
                class="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-indigo-900/30 transition"
              >⬆️ นำเข้า</button>
              <input
                ref="fileInputRef"
                type="file"
                accept=".csv,.txt,.xlsx,.xls"
                class="hidden"
                @change="handleImportFile"
              />
            </div>
          </div>
          <div class="space-y-2">
            <div
              v-for="(opt, i) in options"
              :key="i"
              class="flex items-center gap-2"
            >
              <span class="text-gray-500 text-sm w-6 text-center">{{ i + 1 }}</span>
              <input
                v-model="options[i]"
                type="text"
                maxlength="200"
                :placeholder="type === 'datetime' ? 'เช่น 2026-03-20 09:00' : type === 'time' ? 'เช่น 09:00 น.' : `ตัวเลือกที่ ${i + 1}`"
                class="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm transition"
              />
              <div class="flex gap-1">
                <button
                  type="button"
                  @click="moveOption(i, -1)"
                  :disabled="i === 0"
                  class="p-1.5 text-gray-500 hover:text-gray-300 disabled:opacity-30 transition"
                  title="เลื่อนขึ้น"
                >↑</button>
                <button
                  type="button"
                  @click="moveOption(i, 1)"
                  :disabled="i === options.length - 1"
                  class="p-1.5 text-gray-500 hover:text-gray-300 disabled:opacity-30 transition"
                  title="เลื่อนลง"
                >↓</button>
                <button
                  type="button"
                  @click="removeOption(i)"
                  :disabled="options.length <= 2"
                  class="p-1.5 text-red-500 hover:text-red-400 disabled:opacity-30 transition"
                  title="ลบ"
                >✕</button>
              </div>
            </div>
          </div>
          <button
            v-if="canAddMoreOptions"
            type="button"
            @click="addOption"
            class="mt-3 text-indigo-400 hover:text-indigo-300 text-sm flex items-center gap-1 transition"
          >
            <span class="text-lg leading-none">+</span> เพิ่มตัวเลือก
          </button>
        </div>

        <!-- Allow add options -->
        <div class="flex items-center gap-3 bg-gray-800 rounded-xl p-4">
          <label class="relative inline-flex items-center cursor-pointer">
            <input v-model="allowAddOptions" type="checkbox" class="sr-only peer" />
            <div class="w-10 h-6 bg-gray-600 peer-focus:ring-2 peer-focus:ring-indigo-500 rounded-full peer peer-checked:bg-indigo-600 transition after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-4"></div>
          </label>
          <div>
            <div class="text-sm font-medium text-gray-300">เปิดให้ผู้โหวตเพิ่มตัวเลือกได้</div>
            <div class="text-xs text-gray-500">ผู้เข้าร่วมสามารถเสนอตัวเลือกใหม่ระหว่างการโหวต</div>
          </div>
        </div>

        <!-- Require voter name -->
        <div class="flex items-center gap-3 bg-gray-800 rounded-xl p-4">
          <label class="relative inline-flex items-center cursor-pointer">
            <input v-model="requireVoterName" type="checkbox" class="sr-only peer" />
            <div class="w-10 h-6 bg-gray-600 peer-focus:ring-2 peer-focus:ring-purple-500 rounded-full peer peer-checked:bg-purple-600 transition after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-4"></div>
          </label>
          <div>
            <div class="text-sm font-medium text-gray-300">🎭 ให้ผู้โหวตตั้งชื่อและเลือก Avatar</div>
            <div class="text-xs text-gray-500">ผู้เข้าร่วมต้องระบุชื่อและเลือก Avatar ก่อนโหวต</div>
          </div>
        </div>

        <!-- Show voter name in results (only when require_voter_name) -->
        <div v-if="requireVoterName" class="flex items-center gap-3 bg-gray-800 rounded-xl p-4 border border-purple-900/40">
          <label class="relative inline-flex items-center cursor-pointer">
            <input v-model="showVoterName" type="checkbox" class="sr-only peer" />
            <div class="w-10 h-6 bg-gray-600 peer-focus:ring-2 peer-focus:ring-purple-500 rounded-full peer peer-checked:bg-purple-600 transition after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-4"></div>
          </label>
          <div>
            <div class="text-sm font-medium text-gray-300">📛 แสดงชื่อผู้โหวตในผลลัพธ์</div>
            <div class="text-xs text-gray-500">ปิด = แสดงเฉพาะ Avatar (ค่าเริ่มต้น)</div>
          </div>
        </div>

        <!-- Submit -->
        <button
          type="submit"
          :disabled="!isValid || isSubmitting"
          class="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition flex items-center justify-center gap-2"
        >
          <span v-if="isSubmitting">⏳ กำลังสร้าง...</span>
          <span v-else>🚀 สร้างโหวต</span>
        </button>
      </form>
    </div>
  </div>
</template>
