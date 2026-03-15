<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import { useWebSocket } from '@/composables/useWebSocket'
import { useVoteSession } from '@/composables/useVoteSession'
import RacingBarChart from '@/components/RacingBarChart.vue'
import ShareLink from '@/components/ShareLink.vue'
import ConnectionStatus from '@/components/ConnectionStatus.vue'
import VoteFloater from '@/components/VoteFloater.vue'

const props = defineProps<{ id: string }>()
const route = useRoute()
const router = useRouter()
const toast = useToast()

// Resolve admin token: query param → localStorage
const adminToken = computed<string>(() => {
  const t = route.query.token as string
  if (t) {
    localStorage.setItem(`admin_token_${props.id}`, t)
    return t
  }
  return localStorage.getItem(`admin_token_${props.id}`) ?? ''
})

if (!adminToken.value) {
  router.replace({ name: 'vote', params: { id: props.id } })
}

function redirectIfUnauthorized(status: number): boolean {
  if (status === 403) {
    toast.error('ไม่มีสิทธิ์เข้าหน้า Admin')
    router.replace({ name: 'vote', params: { id: props.id } })
    return true
  }
  return false
}

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

const { isConnected, isConnecting, send, onMessage } = useWebSocket(props.id, adminToken.value)

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
      toast.info(`ตัวเลือกใหม่: "${msg.option.label}"`)
      break
    case 'session_closed':
      applySessionClosed()
      toast.warning('ปิดการโหวตแล้ว')
      break
    case 'session_reopened':
      applySessionReopened()
      toast.success('เปิดการโหวตใหม่แล้ว')
      break
    case 'error':
      toast.error(msg.message)
      break
    case 'vote_cast':
      addFloatItem(msg.avatar_id, msg.voter_name)
      break
  }
})

onMounted(async () => {
  await fetchSession(props.id)
})

// Admin actions
const isActioning = ref(false)
const newOptionLabel = ref('')
const confirmDelete = ref(false)
const chartRef = ref<InstanceType<typeof RacingBarChart> | null>(null)
const importFileRef = ref<HTMLInputElement | null>(null)

// ── Floating vote notifications ────────────────────────────────────────────────
interface FloatItem { id: number; avatar_id: number; voter_name: string }
const floatItems = ref<FloatItem[]>([])
let floatCounter = 0
function addFloatItem(avatar_id: number, voter_name: string) {
  const id = ++floatCounter
  floatItems.value.push({ id, avatar_id, voter_name })
  setTimeout(() => {
    floatItems.value = floatItems.value.filter((f) => f.id !== id)
  }, 2800)
}

async function toggleStatus() {
  if (!session.value || isActioning.value) return
  isActioning.value = true
  try {
    if (session.value.status === 'active') {
      send({ type: 'admin_close', admin_token: adminToken.value })
    } else {
      send({ type: 'admin_reopen', admin_token: adminToken.value })
    }
  } finally {
    isActioning.value = false
  }
}

async function addOption() {
  const label = newOptionLabel.value.trim()
  if (!label) return
  send({ type: 'add_option', label })
  newOptionLabel.value = ''
  toast.success('ส่งคำขอเพิ่มตัวเลือกแล้ว')
}

async function deleteSession() {
  if (!confirmDelete.value) {
    confirmDelete.value = true
    setTimeout(() => { confirmDelete.value = false }, 5000)
    return
  }
  isActioning.value = true
  try {
    const res = await fetch(`/api/sessions/${props.id}`, {
      method: 'DELETE',
      headers: { 'X-Admin-Token': adminToken.value },
    })
    if (!res.ok) {
      if (redirectIfUnauthorized(res.status)) return
      const data = await res.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error(data.error ?? `HTTP ${res.status}`)
    }
    toast.success('ลบ session แล้ว')
    await router.push('/')
  } catch (e) {
    toast.error(`ผิดพลาด: ${e instanceof Error ? e.message : String(e)}`)
    isActioning.value = false
  }
}

// ── Toggle require_voter_name ──────────────────────────────────────────────────
async function toggleRequireVoterName() {
  if (!session.value) return
  const newVal = !session.value.require_voter_name
  try {
    const res = await fetch(`/api/sessions/${props.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'X-Admin-Token': adminToken.value },
      body: JSON.stringify({ require_voter_name: newVal }),
    })
    if (!res.ok) {
      if (redirectIfUnauthorized(res.status)) return
      throw new Error(`HTTP ${res.status}`)
    }
    const data = await res.json()
    session.value = data.session
    toast.success(newVal ? 'เปิดให้ระบุชื่อแล้ว' : 'ปิดการระบุชื่อแล้ว')
  } catch (e) {
    toast.error(`ผิดพลาด: ${e instanceof Error ? e.message : String(e)}`)
  }
}

// ── Toggle show_voter_name ───────────────────────────────────────────────────
async function toggleShowVoterName() {
  if (!session.value) return
  const newVal = !session.value.show_voter_name
  try {
    const res = await fetch(`/api/sessions/${props.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'X-Admin-Token': adminToken.value },
      body: JSON.stringify({ show_voter_name: newVal }),
    })
    if (!res.ok) {
      if (redirectIfUnauthorized(res.status)) return
      throw new Error(`HTTP ${res.status}`)
    }
    const data = await res.json()
    session.value = data.session
    toast.success(newVal ? 'แสดงชื่อในผลโหวตแล้ว' : 'แสดงเฉพาะ Avatar แล้ว')
  } catch (e) {
    toast.error(`ผิดพลาด: ${e instanceof Error ? e.message : String(e)}`)
  }
}

// ── CSV / Excel Import for options ────────────────────────────────────────────
function parseCSVLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => {
      const trimmed = line.trim()
      if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
        return trimmed.slice(1, -1).replace(/""/g, '"').trim()
      }
      return trimmed.split(',')[0].trim()
    })
    .filter((l) => l.length > 0)
    .slice(0, 50)
}

async function handleImportOptions(event: Event) {
  if (!session.value) return
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return

  const ext = file.name.toLowerCase().split('.').pop()
  let labels: string[] = []

  if (ext === 'csv' || ext === 'txt') {
    const text = await file.text()
    labels = parseCSVLines(text)
  } else if (ext === 'xlsx' || ext === 'xls') {
    try {
      const { read, utils } = await import('xlsx')
      const buffer = await file.arrayBuffer()
      const wb = read(buffer)
      const ws = wb.Sheets[wb.SheetNames[0]]
      const rows = utils.sheet_to_json<string[]>(ws, { header: 1 }) as string[][]
      labels = rows.map((r) => String(r[0] ?? '').trim()).filter((v) => v.length > 0).slice(0, 50)
    } catch {
      toast.error('ไม่สามารถอ่านไฟล์ Excel ได้')
      return
    }
  } else {
    toast.error('รองรับเฉพาะ .csv, .txt, .xlsx, .xls')
    return
  }

  if (labels.length === 0) { toast.error('ไม่พบตัวเลือกในไฟล์'); return }

  // Add each label as a new option via WS
  for (const label of labels) {
    send({ type: 'add_option', label })
  }
  toast.success(`นำเข้า ${labels.length} ตัวเลือกสำเร็จ`)

  if (importFileRef.value) importFileRef.value.value = ''
}

// ── Export options to CSV ─────────────────────────────────────────────────────
function exportOptionsCSV() {
  if (!session.value || session.value.options.length === 0) { toast.error('ไม่มีตัวเลือก'); return }
  const rows = session.value.options.map((o) => `"${o.label.replace(/"/g, '""')}"`)
  const blob = new Blob(['\uFEFF' + rows.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url; a.download = `options-${props.id}.csv`; a.click()
  URL.revokeObjectURL(url)
}

// ── Export options to Excel ───────────────────────────────────────────────────
async function exportOptionsXLSX() {
  if (!session.value || session.value.options.length === 0) { toast.error('ไม่มีตัวเลือก'); return }
  try {
    const { utils, writeFile } = await import('xlsx')
    const data = session.value.options.map((o, i) => ({ ลำดับ: i + 1, ตัวเลือก: o.label }))
    const ws = utils.json_to_sheet(data)
    const wb = utils.book_new()
    utils.book_append_sheet(wb, ws, 'Options')
    writeFile(wb, `options-${props.id}.xlsx`)
  } catch {
    toast.error('ไม่สามารถสร้างไฟล์ Excel ได้')
  }
}

// ── Export results to CSV ─────────────────────────────────────────────────────
function exportResultsCSV() {
  if (!session.value || sortedOptions.value.length === 0) { toast.error('ยังไม่มีผลโหวต'); return }
  const total = session.value.total_votes
  const header = '"ลำดับ","ตัวเลือก","จำนวนโหวต","เปอร์เซ็นต์"'
  const rows = sortedOptions.value.map((o, i) => {
    const pct = total > 0 ? ((o.count / total) * 100).toFixed(1) : '0.0'
    return `"${i + 1}","${o.label.replace(/"/g, '""')}","${o.count}","${pct}%"`
  })
  const blob = new Blob(['\uFEFF' + [header, ...rows].join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url; a.download = `results-${props.id}.csv`; a.click()
  URL.revokeObjectURL(url)
}

// ── Export results to Excel ───────────────────────────────────────────────────
async function exportResultsXLSX() {
  if (!session.value || sortedOptions.value.length === 0) { toast.error('ยังไม่มีผลโหวต'); return }
  try {
    const { utils, writeFile } = await import('xlsx')
    const total = session.value.total_votes
    const data = sortedOptions.value.map((o, i) => ({
      ลำดับ: i + 1,
      ตัวเลือก: o.label,
      จำนวนโหวต: o.count,
      เปอร์เซ็นต์: total > 0 ? `${((o.count / total) * 100).toFixed(1)}%` : '0%',
    }))
    const ws = utils.json_to_sheet(data)
    const wb = utils.book_new()
    utils.book_append_sheet(wb, ws, 'Results')
    writeFile(wb, `results-${props.id}.xlsx`)
  } catch {
    toast.error('ไม่สามารถสร้างไฟล์ Excel ได้')
  }
}

// ── Export chart as high-res image ────────────────────────────────────────────
function exportResultsImage() {
  chartRef.value?.exportAsImage()
}

const shareUrl = computed(() =>
  typeof window !== 'undefined' ? `${window.location.origin}/vote/${props.id}` : ''
)
const adminUrl = computed(() =>
  typeof window !== 'undefined' ? `${window.location.origin}/admin/${props.id}?token=${adminToken.value}` : ''
)
</script>

<template>
  <div class="min-h-screen bg-gray-950 text-white">
    <!-- Top bar -->
    <div class="sticky top-0 z-10 bg-gray-950/90 backdrop-blur border-b border-gray-800 px-4 py-3 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <span class="text-xl">🗳️</span>
        <span class="font-semibold text-sm truncate max-w-[150px]">{{ session?.title ?? 'Admin' }}</span>
        <span class="text-xs bg-yellow-900/60 text-yellow-400 px-2 py-0.5 rounded-full">Admin</span>
      </div>
      <ConnectionStatus :connected="isConnected" :connecting="isConnecting" />
    </div>

    <div class="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <!-- Loading -->
      <div v-if="isLoading && !session" class="text-center py-20">
        <div class="text-4xl animate-pulse">⏳</div>
      </div>

      <!-- Error -->
      <div v-else-if="fetchError && !session" class="text-center py-20">
        <p class="text-red-400">{{ fetchError }}</p>
      </div>

      <template v-else-if="session">
        <!-- Session info -->
        <div class="bg-gray-900 rounded-2xl p-5 space-y-3">
          <h1 class="text-xl font-bold text-white">{{ session.title }}</h1>
          <p v-if="session.description" class="text-gray-400 text-sm">{{ session.description }}</p>
          <div class="grid grid-cols-3 gap-3 pt-2">
            <div class="bg-gray-800 rounded-xl p-3 text-center">
              <div class="text-2xl font-bold text-indigo-400">{{ session.total_votes }}</div>
              <div class="text-xs text-gray-500 mt-1">โหวตทั้งหมด</div>
            </div>
            <div class="bg-gray-800 rounded-xl p-3 text-center">
              <div class="text-2xl font-bold text-purple-400">{{ session.options.length }}</div>
              <div class="text-xs text-gray-500 mt-1">ตัวเลือก</div>
            </div>
            <div class="bg-gray-800 rounded-xl p-3 text-center">
              <div :class="['text-2xl font-bold', session.status === 'active' ? 'text-emerald-400' : 'text-red-400']">
                {{ session.status === 'active' ? '🟢' : '🔴' }}
              </div>
              <div class="text-xs text-gray-500 mt-1">{{ session.status === 'active' ? 'กำลังโหวต' : 'ปิดแล้ว' }}</div>
            </div>
          </div>
        </div>

        <!-- Controls -->
        <div class="bg-gray-900 rounded-2xl p-5 space-y-4">
          <h2 class="text-sm font-semibold text-gray-300">ควบคุม</h2>

          <!-- Toggle status -->
          <button
            @click="toggleStatus"
            :disabled="isActioning"
            :class="[
              'w-full py-3 rounded-xl font-semibold transition',
              session.status === 'active'
                ? 'bg-red-900/60 hover:bg-red-900 text-red-300 border border-red-800'
                : 'bg-emerald-900/60 hover:bg-emerald-900 text-emerald-300 border border-emerald-800'
            ]"
          >
            {{ session.status === 'active' ? '🔒 ปิดการโหวต' : '🔓 เปิดการโหวตอีกครั้ง' }}
          </button>

          <!-- Require voter name toggle -->
          <div class="flex items-center gap-3 bg-gray-800 rounded-xl p-3">
            <label class="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                :checked="session.require_voter_name"
                @change="toggleRequireVoterName"
                class="sr-only peer"
              />
              <div class="w-10 h-6 bg-gray-600 peer-focus:ring-2 peer-focus:ring-purple-500 rounded-full peer peer-checked:bg-purple-600 transition after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-4"></div>
            </label>
            <div>
              <div class="text-sm font-medium text-gray-300">🎭 ให้ผู้โหวตตั้งชื่อและเลือก Avatar</div>
              <div class="text-xs text-gray-500">ผู้โหวตต้องระบุชื่อและ Avatar ก่อนโหวต</div>
            </div>
          </div>

          <!-- Show voter name toggle (only when require_voter_name is on) -->
          <div v-if="session.require_voter_name" class="flex items-center gap-3 bg-gray-800 rounded-xl p-3 border border-purple-900/40">
            <label class="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                :checked="session.show_voter_name"
                @change="toggleShowVoterName"
                class="sr-only peer"
              />
              <div class="w-10 h-6 bg-gray-600 peer-focus:ring-2 peer-focus:ring-purple-500 rounded-full peer peer-checked:bg-purple-600 transition after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-4"></div>
            </label>
            <div>
              <div class="text-sm font-medium text-gray-300">📛 แสดงชื่อผู้โหวตในผลลัพธ์</div>
              <div class="text-xs text-gray-500">ปิด = แสดงเฉพาะ Avatar (ค่าเริ่มต้น)</div>
            </div>
          </div>

          <!-- Add option (manual) + Import -->
          <div>
            <div class="flex items-center justify-between mb-2">
              <p class="text-xs text-gray-500">เพิ่มตัวเลือก</p>
              <div class="flex gap-2">
                <button
                  type="button"
                  @click="exportOptionsCSV"
                  title="Export ตัวเลือกเป็น CSV"
                  class="text-xs text-gray-400 hover:text-gray-200 px-2 py-0.5 rounded-lg hover:bg-gray-700 transition"
                >⬇️ CSV</button>
                <button
                  type="button"
                  @click="exportOptionsXLSX"
                  title="Export ตัวเลือกเป็น Excel"
                  class="text-xs text-gray-400 hover:text-gray-200 px-2 py-0.5 rounded-lg hover:bg-gray-700 transition"
                >⬇️ Excel</button>
                <button
                  type="button"
                  @click="() => importFileRef?.click()"
                  title="Import ตัวเลือกจาก CSV / Excel"
                  class="text-xs text-indigo-400 hover:text-indigo-300 px-2 py-0.5 rounded-lg hover:bg-indigo-900/30 transition"
                >⬆️ นำเข้า</button>
                <input ref="importFileRef" type="file" accept=".csv,.txt,.xlsx,.xls" class="hidden" @change="handleImportOptions" />
              </div>
            </div>
            <div class="flex gap-2">
              <input
                v-model="newOptionLabel"
                type="text"
                maxlength="200"
                placeholder="ชื่อตัวเลือกใหม่..."
                @keydown.enter="addOption"
                class="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 text-sm"
              />
              <button
                @click="addOption"
                :disabled="!newOptionLabel.trim() || isActioning"
                class="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2.5 rounded-xl text-white text-sm font-medium transition"
              >
                เพิ่ม
              </button>
            </div>
          </div>
        </div>

        <!-- Results + Export -->
        <div>
          <div class="flex items-center justify-end gap-2 mb-3">
            <span class="text-xs text-gray-500 mr-auto">Export ผลโหวต:</span>
            <button @click="exportResultsCSV" class="text-xs text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded-lg transition">📄 CSV</button>
            <button @click="exportResultsXLSX" class="text-xs text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded-lg transition">📊 Excel</button>
            <button @click="exportResultsImage" class="text-xs text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded-lg transition">🖼️ PNG</button>
          </div>
          <RacingBarChart ref="chartRef" :options="sortedOptions" :total="session.total_votes" :title="session.title" :show-voter-name="session.show_voter_name" />
        </div>

        <!-- Share links -->
        <div class="space-y-3">
          <ShareLink :url="shareUrl" label="ลิงก์โหวตสำหรับแชร์" />
          <ShareLink :url="adminUrl" label="ลิงก์ Admin (เก็บเป็นความลับ!)" />
        </div>

        <!-- Danger zone -->
        <div class="bg-red-950/30 border border-red-900 rounded-2xl p-5">
          <h3 class="text-sm font-semibold text-red-400 mb-3">⚠️ Danger Zone</h3>
          <button
            @click="deleteSession"
            :disabled="isActioning"
            :class="[
              'w-full py-3 rounded-xl font-semibold transition border',
              confirmDelete
                ? 'bg-red-700 hover:bg-red-600 text-white border-red-600 animate-pulse'
                : 'bg-transparent text-red-400 border-red-800 hover:bg-red-900/30'
            ]"
          >
            {{ confirmDelete ? '⚠️ ยืนยัน: ลบ session นี้จริงๆ?' : '🗑️ ลบ session นี้' }}
          </button>
          <p v-if="confirmDelete" class="text-xs text-red-500 text-center mt-2">
            คลิกอีกครั้งเพื่อยืนยัน หรือรอ 5 วินาทีเพื่อยกเลิก
          </p>
        </div>
      </template>
    </div>
  </div>

  <!-- Floating vote animation overlay -->
  <VoteFloater :items="floatItems" />
</template>
