<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useToast } from 'vue-toastification'
import { useWebSocket } from '@/composables/useWebSocket'
import { useVoteSession } from '@/composables/useVoteSession'
import RacingBarChart from '@/components/RacingBarChart.vue'
import VoteForm from '@/components/VoteForm.vue'
import ShareLink from '@/components/ShareLink.vue'
import ConnectionStatus from '@/components/ConnectionStatus.vue'
import AvatarPicker from '@/components/AvatarPicker.vue'
import VoteFloater from '@/components/VoteFloater.vue'
import { getAvatarById, getRandomAvatar } from '@/utils/avatars'

const props = defineProps<{ id: string }>()
const toast = useToast()

const {
  session,
  votedOptionIds,
  hasVoted,
  isLoading,
  fetchError,
  sortedOptions,
  fetchSession,
  applyResultsUpdate,
  applyOptionAdded,
  applySessionClosed,
  applySessionReopened,
  markVoted,
} = useVoteSession()

const { isConnected, isConnecting, error: wsError, send, onMessage } = useWebSocket(props.id)

const isSubmitting = ref(false)
const selectedOptionIds = ref<number[]>([])
const newOptionLabel = ref('')
const addingOption = ref(false)

// ── Voter profile ──────────────────────────────────────────────────────────────
const PROFILE_KEY = computed(() => `voter_profile_${props.id}`)
const voterName = ref('')
const voterAvatarId = ref(getRandomAvatar().id)
const profileConfirmed = ref(false)

function loadProfile() {
  try {
    const raw = localStorage.getItem(PROFILE_KEY.value)
    if (raw) {
      const p = JSON.parse(raw) as { voter_name?: string; avatar_id?: number }
      voterName.value = p.voter_name ?? ''
      voterAvatarId.value = p.avatar_id ?? getRandomAvatar().id
      profileConfirmed.value = true  // Any stored profile (avatar-only is fine) is confirmed
    }
  } catch { /* ignore */ }
}

function saveProfile() {
  localStorage.setItem(PROFILE_KEY.value, JSON.stringify({ voter_name: voterName.value, avatar_id: voterAvatarId.value }))
  profileConfirmed.value = true
}

function skipProfile() {
  // Auto-confirm with random avatar, no name
  localStorage.setItem(PROFILE_KEY.value, JSON.stringify({ voter_name: '', avatar_id: voterAvatarId.value }))
  profileConfirmed.value = true
}

// Show avatar picker: always when user has no confirmed profile
const needsProfile = computed(() => !profileConfirmed.value)

const currentAvatar = computed(() =>
  getAvatarById(voterAvatarId.value) ?? getRandomAvatar()
)

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

// Handle incoming WebSocket messages
onMessage((msg) => {
  switch (msg.type) {
    case 'init':
      session.value = msg.session
      markVoted(msg.voted_option_ids)
      break
    case 'results_update':
      applyResultsUpdate(msg.options, msg.total_votes)
      break
    case 'option_added':
      applyOptionAdded(msg.option)
      break
    case 'session_closed':
      applySessionClosed()
      toast.info('การโหวตถูกปิดแล้ว')
      break
    case 'session_reopened':
      applySessionReopened()
      toast.info('การโหวตเปิดใหม่แล้ว')
      break
    case 'vote_accepted':
      markVoted(msg.option_ids)
      toast.success('โหวตสำเร็จ! 🎉')
      isSubmitting.value = false
      break
    case 'vote_cast':
      addFloatItem(msg.avatar_id, msg.voter_name)
      break
    case 'error':
      toast.error(msg.message)
      isSubmitting.value = false
      break
  }
})

// Fallback: fetch via HTTP if WS takes too long or fails
onMounted(async () => {
  loadProfile()
  await fetchSession(props.id)
})

async function castVote() {
  if (selectedOptionIds.value.length === 0 || isSubmitting.value) return
  isSubmitting.value = true
  send({
    type: 'vote',
    option_ids: selectedOptionIds.value,
    voter_name: session.value?.require_voter_name ? voterName.value : undefined,
    avatar_id: voterAvatarId.value || 1,
  })
}

async function handleAddOption() {
  const label = newOptionLabel.value.trim()
  if (!label) return
  addingOption.value = true
  send({ type: 'add_option', label })
  newOptionLabel.value = ''
  addingOption.value = false
}

const shareUrl = computed(() =>
  typeof window !== 'undefined' ? `${window.location.origin}/vote/${props.id}` : ''
)
</script>

<template>
  <div class="min-h-screen bg-gray-950 text-white">
    <!-- Top bar -->
    <div class="sticky top-0 z-10 bg-gray-950/90 backdrop-blur border-b border-gray-800 px-4 py-3 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <span class="text-xl">🗳️</span>
        <span class="font-semibold text-sm truncate max-w-[200px]">{{ session?.title ?? 'Smart Vote' }}</span>
      </div>
      <div class="flex items-center gap-2">
        <ConnectionStatus :connected="isConnected" :connecting="isConnecting" />
        <span
          v-if="session?.status === 'closed'"
          class="text-xs bg-red-900/50 text-red-400 px-2 py-1 rounded-full"
        >ปิดโหวตแล้ว</span>
      </div>
    </div>

    <div class="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <!-- Loading -->
      <div v-if="isLoading && !session" class="text-center py-20">
        <div class="text-4xl animate-pulse">⏳</div>
        <p class="text-gray-400 mt-3">กำลังโหลด...</p>
      </div>

      <!-- Error -->
      <div v-else-if="fetchError && !session" class="text-center py-20">
        <div class="text-4xl">❌</div>
        <p class="text-red-400 mt-3">{{ fetchError }}</p>
      </div>

      <template v-else-if="session">
        <!-- Session info -->
        <div>
          <h1 class="text-2xl font-bold text-white">{{ session.title }}</h1>
          <p v-if="session.description" class="text-gray-400 mt-1 text-sm">{{ session.description }}</p>
          <div class="flex items-center gap-3 mt-2 text-xs text-gray-500">
            <span>{{ session.total_votes }} โหวต</span>
            <span>•</span>
            <span>หมดอายุ {{ new Date(session.expires_at).toLocaleDateString('th-TH') }}</span>
          </div>
        </div>

        <!-- Avatar Picker (shown for all users who haven't confirmed yet) -->
        <AvatarPicker
          v-if="needsProfile"
          v-model="voterAvatarId"
          v-model:name="voterName"
          :require-name="session?.require_voter_name"
          @confirm="saveProfile"
          @skip="skipProfile"
        />

        <!-- Confirmed profile display -->
        <div
          v-else-if="profileConfirmed"
          class="flex items-center gap-3 bg-gray-900 rounded-xl p-3"
        >
          <div
            class="w-10 h-10 rounded-full overflow-hidden flex-shrink-0"
            v-html="currentAvatar.svg"
          />
          <div class="min-w-0">
            <div class="text-sm font-medium text-white truncate">{{ voterName }}</div>
            <div class="text-xs text-gray-500">{{ currentAvatar.emoji }} {{ currentAvatar.name }}</div>
          </div>
          <button
            @click="profileConfirmed = false"
            class="ml-auto text-xs text-gray-500 hover:text-gray-300 transition"
          >เปลี่ยน</button>
        </div>

        <!-- Vote form OR already voted notice -->
        <template v-if="!needsProfile">
          <div v-if="session.status === 'active' && !hasVoted">
            <VoteForm
              :session="session"
              v-model:selected="selectedOptionIds"
            />
            <button
              @click="castVote"
              :disabled="selectedOptionIds.length === 0 || isSubmitting"
              class="mt-4 w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-900 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition flex items-center justify-center gap-2"
            >
              <span v-if="isSubmitting">⏳ กำลังส่ง...</span>
              <span v-else>✅ ยืนยันโหวต</span>
            </button>
          </div>
          <div v-else-if="hasVoted" class="bg-emerald-900/30 border border-emerald-700 rounded-xl p-4 text-center">
            <div class="text-2xl mb-1">✓</div>
            <div class="text-emerald-400 font-medium">คุณโหวตแล้ว</div>
            <div class="text-gray-500 text-sm mt-1">ดูผลลัพธ์ด้านล่างแบบ Realtime</div>
          </div>
          <div v-else class="bg-red-900/30 border border-red-700 rounded-xl p-4 text-center">
            <div class="text-2xl mb-1">🔒</div>
            <div class="text-red-400 font-medium">การโหวตถูกปิดแล้ว</div>
          </div>
        </template>

        <!-- Add option (if allowed) -->
        <div v-if="session.allow_add_options && session.status === 'active'" class="bg-gray-900 rounded-xl p-4">
          <h3 class="text-sm font-medium text-gray-300 mb-3">เสนอตัวเลือกเพิ่มเติม</h3>
          <div class="flex gap-2">
            <input
              v-model="newOptionLabel"
              type="text"
              maxlength="200"
              placeholder="พิมพ์ตัวเลือกใหม่..."
              @keydown.enter="handleAddOption"
              class="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 text-sm"
            />
            <button
              @click="handleAddOption"
              :disabled="!newOptionLabel.trim() || addingOption"
              class="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2.5 rounded-xl text-white text-sm font-medium transition"
            >
              เพิ่ม
            </button>
          </div>
        </div>

        <!-- Racing bar chart -->
        <RacingBarChart
          :options="sortedOptions"
          :total="session.total_votes"
          :voted-ids="votedOptionIds"
          :show-voter-name="session.show_voter_name"
        />

        <!-- Share link -->
        <ShareLink :url="shareUrl" label="แชร์ลิงก์โหวต" />
      </template>
    </div>
  </div>

  <!-- Floating vote animation overlay -->
  <VoteFloater :items="floatItems" />
</template>
