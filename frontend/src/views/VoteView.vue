<script setup lang="ts">
import AvatarPicker from '@/components/AvatarPicker.vue'
import ConnectionStatus from '@/components/ConnectionStatus.vue'
import RacingBarChart from '@/components/RacingBarChart.vue'
import ShareLink from '@/components/ShareLink.vue'
import VoteFloater from '@/components/VoteFloater.vue'
import VoteForm from '@/components/VoteForm.vue'
import { useI18n } from '@/composables/useI18n'
import { useVoteSession } from '@/composables/useVoteSession'
import { useWebSocket } from '@/composables/useWebSocket'
import { getAvatarById, getRandomAvatar } from '@/utils/avatars'
import { computed, onMounted, ref } from 'vue'
import { useToast } from 'vue-toastification'

const props = defineProps<{ id: string }>()
const toast = useToast()
const { t, lang, toggleLang } = useI18n()

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
      toast.info(t.value.sessionClosed)
      break
    case 'session_reopened':
      applySessionReopened()
      toast.info(t.value.sessionReopened)
      break
    case 'vote_accepted':
      markVoted(msg.option_ids)
      toast.success(t.value.voteCast)
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

// ── Result visibility logic ────────────────────────────────────────────────────
const canSeeResults = computed(() => {
  if (!session.value) return false
  const mode = session.value.result_mode ?? 'show_immediately'
  if (mode === 'show_immediately') return true
  if (mode === 'after_vote') return hasVoted.value || session.value.status === 'closed'
  if (mode === 'after_close') return session.value.status === 'closed'
  return true
})

const RESULT_MODE_ICONS: Record<string, string> = {
  show_immediately: '📊',
  after_vote: '🗳️',
  after_close: '🔒',
}
const RESULT_MODE_COLORS: Record<string, string> = {
  show_immediately: 'text-teal-400 bg-teal-900/40 border-teal-800',
  after_vote: 'text-blue-400 bg-blue-900/40 border-blue-800',
  after_close: 'text-amber-400 bg-amber-900/40 border-amber-800',
}
const resultModeLabel = (mode: string) => t.value.modeBadges[mode as keyof typeof t.value.modeBadges] ?? mode
</script>

<template>
  <div class="min-h-screen bg-gray-950 text-white">
    <!-- Top bar -->
    <div class="sticky top-0 z-10 bg-gray-950/90 backdrop-blur border-b border-gray-800 px-4 py-3 flex items-center justify-between gap-2">
      <div class="flex items-center gap-2 min-w-0">
        <span class="text-xl shrink-0">🗳️</span>
        <span class="font-semibold text-sm truncate">{{ session?.title ?? t.appName }}</span>
      </div>
      <div class="flex items-center gap-2 shrink-0">
        <button
          @click="toggleLang"
          class="text-xs px-2 py-1 rounded-full border border-gray-700 text-gray-500 hover:text-white hover:border-gray-500 transition"
        >{{ lang === 'th' ? 'EN' : 'TH' }}</button>
        <ConnectionStatus :connected="isConnected" :connecting="isConnecting" />
        <span
          v-if="session?.status === 'closed'"
          class="text-xs bg-red-900/50 text-red-400 px-2 py-1 rounded-full"
        >{{ t.sessionClosedLabel }}</span>
      </div>
    </div>

    <div class="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <!-- Loading -->
      <div v-if="isLoading && !session" class="text-center py-20">
        <div class="text-4xl animate-pulse">⏳</div>
        <p class="text-gray-400 mt-3">{{ t.loading }}</p>
      </div>

      <!-- Error -->
      <div v-else-if="fetchError && !session" class="text-center py-20">
        <div class="text-4xl">❌</div>
        <p class="text-red-400 mt-3">{{ fetchError }}</p>
      </div>

      <template v-else-if="session">
        <!-- Session info -->
        <div>
          <h1 class="text-2xl font-bold text-white leading-snug">{{ session.title }}</h1>
          <p v-if="session.description" class="text-gray-400 mt-1 text-sm leading-relaxed">{{ session.description }}</p>
          <div class="flex flex-wrap items-center gap-2 mt-3">
            <span class="text-xs text-gray-500">{{ t.votes(session.total_votes) }}</span>
            <span class="text-xs text-gray-600">•</span>
            <span class="text-xs text-gray-500">{{ t.expires }} {{ new Date(session.expires_at).toLocaleDateString(lang === 'th' ? 'th-TH' : 'en-GB') }}</span>
            <!-- Result mode badge -->
            <span
              v-if="session.result_mode"
              :class="['text-xs px-2.5 py-0.5 rounded-full border font-medium', RESULT_MODE_COLORS[session.result_mode] ?? 'text-gray-400 bg-gray-800 border-gray-700']"
            >
              {{ RESULT_MODE_ICONS[session.result_mode] }} {{ resultModeLabel(session.result_mode) }}
            </span>
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
          >{{ t.changeProfile }}</button>
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
              <span v-if="isSubmitting">{{ t.sending }}</span>
              <span v-else>✅ {{ t.confirmVote }}</span>
            </button>
          </div>
          <div v-else-if="hasVoted" class="bg-emerald-900/30 border border-emerald-700 rounded-xl p-4 text-center">
            <div class="text-2xl mb-1">✓</div>
            <div class="text-emerald-400 font-medium">{{ t.alreadyVoted }}</div>
            <div class="text-gray-500 text-sm mt-1">{{ t.alreadyVotedHint }}</div>
          </div>
          <div v-else class="bg-red-900/30 border border-red-700 rounded-xl p-4 text-center">
            <div class="text-2xl mb-1">🔒</div>
            <div class="text-red-400 font-medium">{{ t.sessionClosed }}</div>
          </div>
        </template>

        <!-- Add option (if allowed) -->
        <div v-if="session.allow_add_options && session.status === 'active'" class="bg-gray-900 rounded-xl p-4">
          <h3 class="text-sm font-medium text-gray-300 mb-3">{{ t.proposeOption }}</h3>
          <div class="flex gap-2">
            <input
              v-model="newOptionLabel"
              type="text"
              maxlength="200"
              :placeholder="t.proposeOptionPlaceholder"
              @keydown.enter="handleAddOption"
              class="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 text-sm"
            />
            <button
              @click="handleAddOption"
              :disabled="!newOptionLabel.trim() || addingOption"
              class="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2.5 rounded-xl text-white text-sm font-medium transition"
            >
              {{ t.submitOption }}
            </button>
          </div>
        </div>

        <!-- Racing bar chart -->
        <template v-if="canSeeResults">
          <RacingBarChart
            :options="sortedOptions"
            :total="session.total_votes"
            :voted-ids="votedOptionIds"
            :show-voter-name="session.show_voter_name"
          />
        </template>
        <div v-else class="bg-gray-900 border border-gray-700 rounded-2xl p-6 text-center space-y-2">
          <div class="text-3xl">{{ RESULT_MODE_ICONS[session.result_mode ?? 'show_immediately'] ?? '🔒' }}</div>
          <div class="text-gray-300 font-medium">
            <template v-if="session.result_mode === 'after_vote'">{{ t.voteNowToSeeResults }}</template>
            <template v-else-if="session.result_mode === 'after_close'">{{ t.waitForClose }}</template>
          </div>
          <div class="text-gray-500 text-sm">{{ t.votes(session.total_votes) }}</div>
        </div>

        <!-- Share link -->
        <ShareLink :url="shareUrl" :label="t.shareVote" />
      </template>
    </div>
  </div>

  <!-- Floating vote animation overlay -->
  <VoteFloater :items="floatItems" />
</template>
