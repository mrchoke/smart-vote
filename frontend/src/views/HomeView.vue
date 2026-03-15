<script setup lang="ts">
import { useI18n } from '@/composables/useI18n'
import type { ResultMode, VoteType } from '@/types'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'

const router = useRouter()
const toast = useToast()
const { t, lang, toggleLang } = useI18n()

const helpOpen = ref(false)
const aboutOpen = ref(false)
const isSubmitting = ref(false)
const title = ref('')
const description = ref('')
const type = ref<VoteType>('single')
const allowAddOptions = ref(false)
const requireVoterName = ref(false)
const showVoterName = ref(false)
const resultMode = ref<ResultMode>('show_immediately')
const maxSelections = ref<number | null>(null)
const options = ref<string[]>(['', ''])

const VOTE_TYPES = computed(() => [
  { value: 'single' as VoteType, label: t.value.voteTypes.single.label, icon: '🔘', desc: t.value.voteTypes.single.desc },
  { value: 'multiple' as VoteType, label: t.value.voteTypes.multiple.label, icon: '☑️', desc: t.value.voteTypes.multiple.desc },
  { value: 'datetime' as VoteType, label: t.value.voteTypes.datetime.label, icon: '📅', desc: t.value.voteTypes.datetime.desc },
  { value: 'time' as VoteType, label: t.value.voteTypes.time.label, icon: '⏰', desc: t.value.voteTypes.time.desc },
])

const RESULT_MODES = computed(() => [
  { value: 'show_immediately' as ResultMode, label: t.value.resultModes.show_immediately.label, icon: '📊', desc: t.value.resultModes.show_immediately.desc },
  { value: 'after_vote' as ResultMode, label: t.value.resultModes.after_vote.label, icon: '🗳️', desc: t.value.resultModes.after_vote.desc },
  { value: 'after_close' as ResultMode, label: t.value.resultModes.after_close.label, icon: '🔒', desc: t.value.resultModes.after_close.desc },
])

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
    if (labels.length === 0) { toast.error(t.value.importEmpty); return }
    options.value = labels.length >= 2 ? labels : [...labels, ...Array(2 - labels.length).fill('')]
    toast.success(t.value.importSuccess(labels.length))
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
      if (labels.length === 0) { toast.error(t.value.importEmpty); return }
      options.value = labels.length >= 2 ? labels : [...labels, ...Array(2 - labels.length).fill('')]
      toast.success(t.value.importSuccess(labels.length))
    } catch {
      toast.error(t.value.importExcelError)
    }
  } else {
    toast.error(t.value.importUnsupported)
  }

  // Reset file input
  if (fileInputRef.value) fileInputRef.value.value = ''
}

function exportOptionsCSV() {
  const clean = options.value.map((o) => o.trim()).filter((o) => o)
  if (clean.length === 0) { toast.error(t.value.noOptions); return }
  const csvContent = clean.map((o) => `"${o.replace(/"/g, '""')}"`).join('\n')
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url; a.download = 'options.csv'; a.click()
  URL.revokeObjectURL(url)
}

// ── Download sample template ──────────────────────────────────────────────────
const SAMPLE_OPTIONS = [
  'Option A / ตัวเลือก ก',
  'Option B / ตัวเลือก ข',
  'Option C / ตัวเลือก ค',
  'Option D / ตัวเลือก ง',
  'Option E / ตัวเลือก จ',
]

function downloadTemplateCSV() {
  const header = '# Smart Vote - Options Template (one option per line, first column used)\n'
  const rows = SAMPLE_OPTIONS.map((o) => `"${o}"`).join('\n')
  const blob = new Blob(['\uFEFF' + header + rows], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url; a.download = 'smart-vote-template.csv'; a.click()
  URL.revokeObjectURL(url)
}

async function downloadTemplateXLSX() {
  try {
    const { utils, writeFile } = await import('xlsx')
    const data = SAMPLE_OPTIONS.map((label, i) => ({ No: i + 1, Option: label }))
    const ws = utils.json_to_sheet(data)
    ws['!cols'] = [{ wch: 5 }, { wch: 40 }]
    const wb = utils.book_new()
    utils.book_append_sheet(wb, ws, 'Options')
    writeFile(wb, 'smart-vote-template.xlsx')
  } catch {
    toast.error(t.value.importExcelError)
  }
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
      result_mode: resultMode.value,
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

    toast.success(t.value.createSuccess)
    await router.push({ name: 'admin', params: { id: data.session.id }, query: { token: data.adminToken } })
  } catch (e) {
    toast.error(t.value.createError(e instanceof Error ? e.message : String(e)))
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-gray-950 flex items-start sm:items-center justify-center p-4 py-8">
    <div class="w-full max-w-2xl">
      <!-- Header -->
      <div class="text-center mb-8">
        <div class="text-5xl mb-3">🗳️</div>
        <h1 class="text-3xl font-extrabold text-white tracking-tight">{{ t.appName }}</h1>
        <p class="text-gray-400 mt-2 text-base">{{ t.tagline }}</p>
        <!-- Language switcher + Help + About -->
        <div class="mt-3 flex items-center justify-center gap-2">
          <button
            @click="toggleLang"
            class="text-xs px-3 py-1.5 rounded-full border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 transition"
          >{{ lang === 'th' ? '🇬🇧 English' : '🇹🇭 ภาษาไทย' }}</button>
          <button
            @click="helpOpen = true"
            class="text-xs px-3 py-1.5 rounded-full border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 transition"
          >❓ {{ lang === 'th' ? 'คู่มือ' : 'Guide' }}</button>
          <button
            @click="aboutOpen = true"
            class="text-xs px-3 py-1.5 rounded-full border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 transition"
          >ℹ️ About</button>
        </div>
      </div>

      <form @submit.prevent="handleSubmit" class="bg-gray-900 rounded-2xl p-5 sm:p-8 space-y-6 shadow-2xl">
        <!-- Title -->
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">
            {{ t.question }} <span class="text-red-400">{{ t.required }}</span>
          </label>
          <input
            v-model="title"
            type="text"
            maxlength="200"
            :placeholder="t.questionPlaceholder"
            class="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
          />
        </div>

        <!-- Description -->
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">{{ t.description }}</label>
          <textarea
            v-model="description"
            maxlength="1000"
            rows="2"
            :placeholder="t.descriptionPlaceholder"
            class="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition resize-none"
          />
        </div>

        <!-- Vote Type -->
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-3">{{ t.voteType }}</label>
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

        <!-- Result Mode -->
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-3">{{ t.resultMode }}</label>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              v-for="rm in RESULT_MODES"
              :key="rm.value"
              type="button"
              @click="resultMode = rm.value"
              :class="[
                'flex flex-col items-start p-4 rounded-xl border transition cursor-pointer text-left',
                resultMode === rm.value
                  ? 'border-teal-500 bg-teal-950 text-white'
                  : 'border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-500'
              ]"
            >
              <span class="text-2xl mb-1">{{ rm.icon }}</span>
              <span class="font-semibold text-sm">{{ rm.label }}</span>
              <span class="text-xs text-gray-500 mt-1 leading-relaxed">{{ rm.desc }}</span>
            </button>
          </div>
        </div>

        <!-- Max selections (for multiple type) -->
        <div v-if="type === 'multiple'" class="bg-gray-800 rounded-xl p-4">
          <label class="block text-sm font-medium text-gray-300 mb-2">{{ t.maxSelections }}</label>
          <div class="flex items-center gap-3">
            <input
              v-model.number="maxSelections"
              type="number"
              min="2"
              max="50"
              :placeholder="t.maxSelectionsHint"
              class="w-32 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
            />
            <span class="text-gray-500 text-sm">{{ t.maxSelectionsHint }}</span>
          </div>
        </div>

        <!-- Options -->
        <div>
          <div class="flex flex-wrap items-center justify-between gap-2 mb-3">
            <label class="block text-sm font-medium text-gray-300">
              {{ t.options }} <span class="text-red-400">{{ t.required }}</span>
              <span class="text-gray-500 font-normal ml-2">{{ t.optionsHint }}</span>
            </label>
            <!-- Import / Export / Template buttons -->
            <div class="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                @click="downloadTemplateCSV"
                :title="t.downloadCSV"
                class="text-xs text-emerald-500 hover:text-emerald-400 flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-emerald-900/20 transition"
              >📋 {{ t.downloadCSV }}</button>
              <button
                type="button"
                @click="downloadTemplateXLSX"
                :title="t.downloadExcel"
                class="text-xs text-emerald-500 hover:text-emerald-400 flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-emerald-900/20 transition"
              >📗 {{ t.downloadExcel }}</button>
              <button
                type="button"
                @click="exportOptionsCSV"
                :title="t.exportCSV"
                class="text-xs text-gray-400 hover:text-gray-200 flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-gray-700 transition"
              >⬇️ {{ t.exportCSV }}</button>
              <button
                type="button"
                @click="() => fileInputRef?.click()"
                :title="t.importOptions"
                class="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-indigo-900/30 transition"
              >⬆️ {{ t.importOptions }}</button>
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
              <span class="text-gray-500 text-sm w-6 text-center shrink-0">{{ i + 1 }}</span>
              <input
                v-model="options[i]"
                type="text"
                maxlength="200"
                :placeholder="type === 'datetime' ? t.optionDatetimePlaceholder : type === 'time' ? t.optionTimePlaceholder : t.optionPlaceholder(i)"
                class="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm transition"
              />
              <div class="flex gap-1 shrink-0">
                <button
                  type="button"
                  @click="moveOption(i, -1)"
                  :disabled="i === 0"
                  class="p-1.5 text-gray-500 hover:text-gray-300 disabled:opacity-30 transition"
                  title="↑"
                >↑</button>
                <button
                  type="button"
                  @click="moveOption(i, 1)"
                  :disabled="i === options.length - 1"
                  class="p-1.5 text-gray-500 hover:text-gray-300 disabled:opacity-30 transition"
                  title="↓"
                >↓</button>
                <button
                  type="button"
                  @click="removeOption(i)"
                  :disabled="options.length <= 2"
                  class="p-1.5 text-red-500 hover:text-red-400 disabled:opacity-30 transition"
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
            <span class="text-lg leading-none">+</span> {{ t.addOption }}
          </button>
        </div>

        <!-- Allow add options -->
        <div class="flex items-center gap-3 bg-gray-800 rounded-xl p-4">
          <label class="relative inline-flex items-center cursor-pointer shrink-0">
            <input v-model="allowAddOptions" type="checkbox" class="sr-only peer" />
            <div class="w-10 h-6 bg-gray-600 peer-focus:ring-2 peer-focus:ring-indigo-500 rounded-full peer peer-checked:bg-indigo-600 transition after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-4"></div>
          </label>
          <div>
            <div class="text-sm font-medium text-gray-300">{{ t.allowAddOptions }}</div>
            <div class="text-xs text-gray-500">{{ t.allowAddOptionsHint }}</div>
          </div>
        </div>

        <!-- Require voter name -->
        <div class="flex items-center gap-3 bg-gray-800 rounded-xl p-4">
          <label class="relative inline-flex items-center cursor-pointer shrink-0">
            <input v-model="requireVoterName" type="checkbox" class="sr-only peer" />
            <div class="w-10 h-6 bg-gray-600 peer-focus:ring-2 peer-focus:ring-purple-500 rounded-full peer peer-checked:bg-purple-600 transition after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-4"></div>
          </label>
          <div>
            <div class="text-sm font-medium text-gray-300">{{ t.requireVoterName }}</div>
            <div class="text-xs text-gray-500">{{ t.requireVoterNameHint }}</div>
          </div>
        </div>

        <!-- Show voter name in results (only when require_voter_name) -->
        <div v-if="requireVoterName" class="flex items-center gap-3 bg-gray-800 rounded-xl p-4 border border-purple-900/40">
          <label class="relative inline-flex items-center cursor-pointer shrink-0">
            <input v-model="showVoterName" type="checkbox" class="sr-only peer" />
            <div class="w-10 h-6 bg-gray-600 peer-focus:ring-2 peer-focus:ring-purple-500 rounded-full peer peer-checked:bg-purple-600 transition after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-4"></div>
          </label>
          <div>
            <div class="text-sm font-medium text-gray-300">{{ t.showVoterName }}</div>
            <div class="text-xs text-gray-500">{{ t.showVoterNameHint }}</div>
          </div>
        </div>

        <!-- Submit -->
        <button
          type="submit"
          :disabled="!isValid || isSubmitting"
          class="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition flex items-center justify-center gap-2"
        >
          <span v-if="isSubmitting">⏳ {{ t.creating }}</span>
          <span v-else>🚀 {{ t.createVote }}</span>
        </button>
      </form>
    </div>
  </div>

  <!-- Help Dialog -->
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="helpOpen"
        class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      >
        <div class="absolute inset-0 bg-black/70 backdrop-blur-sm" @click="helpOpen = false" />
        <div class="relative w-full max-w-lg bg-gray-900 rounded-2xl shadow-2xl max-h-[88vh] flex flex-col overflow-hidden">
          <div class="flex items-center justify-between px-5 py-4 border-b border-gray-800">
            <h2 class="text-lg font-bold text-white">❓ {{ t.helpTitle }}</h2>
            <button @click="helpOpen = false" class="text-gray-500 hover:text-white transition text-xl leading-none">&times;</button>
          </div>
          <div class="overflow-y-auto px-5 py-4 space-y-5">
            <div v-for="sec in t.helpSections" :key="sec.title" class="space-y-2">
              <h3 class="font-semibold text-white flex items-center gap-2">
                <span>{{ sec.icon }}</span><span>{{ sec.title }}</span>
              </h3>
              <ol class="space-y-1.5 pl-1">
                <li v-for="(step, i) in sec.steps" :key="i" class="flex gap-2 text-sm text-gray-300">
                  <span class="text-indigo-400 font-semibold shrink-0 w-5 text-right">{{ i + 1 }}.</span>
                  <span>{{ step }}</span>
                </li>
              </ol>
            </div>
          </div>
          <div class="px-5 py-4 border-t border-gray-800">
            <button
              @click="helpOpen = false"
              class="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition text-sm"
            >{{ t.helpClose }}</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- About Dialog -->
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="aboutOpen"
        class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      >
        <div class="absolute inset-0 bg-black/70 backdrop-blur-sm" @click="aboutOpen = false" />
        <div class="relative w-full max-w-md bg-gray-900 rounded-2xl shadow-2xl max-h-[88vh] flex flex-col overflow-hidden">
          <div class="flex items-center justify-between px-5 py-4 border-b border-gray-800">
            <h2 class="text-lg font-bold text-white">🗳️ {{ t.aboutTitle }}</h2>
            <button @click="aboutOpen = false" class="text-gray-500 hover:text-white transition text-xl leading-none">&times;</button>
          </div>
          <div class="overflow-y-auto px-5 py-5 space-y-5">
            <div class="text-center">
              <div class="text-4xl mb-2">🗳️</div>
              <div class="text-xl font-extrabold text-white">{{ t.appName }}</div>
              <div class="text-gray-400 text-sm mt-1">{{ t.aboutTagline }}</div>
            </div>
            <p class="text-gray-300 text-sm leading-relaxed">{{ t.aboutDesc }}</p>
            <div>
              <div class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">{{ t.aboutBuiltWith }}</div>
              <ul class="space-y-2">
                <li v-for="item in t.aboutStack" :key="item.name" class="flex items-start gap-3">
                  <span class="text-lg shrink-0">{{ item.icon }}</span>
                  <div>
                    <div class="text-sm font-medium text-white">{{ item.name }}</div>
                    <div class="text-xs text-gray-500">{{ item.desc }}</div>
                  </div>
                </li>
              </ul>
            </div>
            <div class="bg-indigo-950/60 border border-indigo-800 rounded-xl p-4 text-center space-y-1">
              <div class="text-indigo-300 font-semibold text-sm">🤖 {{ t.aboutAI }}</div>
              <div class="text-gray-400 text-xs leading-relaxed">
                {{ t.aboutAIDesc }}
                <span class="text-indigo-400 font-semibold"> {{ t.aboutAuthor }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-enter-active, .modal-leave-active { transition: opacity 0.2s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
</style>
