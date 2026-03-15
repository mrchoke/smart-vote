import type { OptionResult, SessionPublic } from '@/types'
import { computed, ref } from 'vue'

export function useVoteSession () {
  const session = ref<SessionPublic | null>(null)
  const votedOptionIds = ref<number[]>([])
  const isLoading = ref(false)
  const fetchError = ref<string | null>(null)

  const hasVoted = computed(() => votedOptionIds.value.length > 0)

  const sortedOptions = computed<OptionResult[]>(() => {
    if (!session.value) return []
    return [...session.value.options].sort((a, b) => b.count - a.count || a.sort_order - b.sort_order)
  })

  async function fetchSession (id: string): Promise<void> {
    isLoading.value = true
    fetchError.value = null
    try {
      const res = await fetch(`/api/sessions/${id}`)
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(data.error ?? `HTTP ${res.status}`)
      }
      const data = await res.json()
      session.value = data.session
      votedOptionIds.value = data.votedOptionIds ?? []
    } catch (e) {
      fetchError.value = e instanceof Error ? e.message : String(e)
    } finally {
      isLoading.value = false
    }
  }

  function applyResultsUpdate (options: OptionResult[], totalVotes: number) {
    if (!session.value) return
    session.value = { ...session.value, options, total_votes: totalVotes }
  }

  function applyOptionAdded (option: OptionResult) {
    if (!session.value) return
    session.value = {
      ...session.value,
      options: [...session.value.options, option],
    }
  }

  function applySessionClosed () {
    if (!session.value) return
    session.value = { ...session.value, status: 'closed' }
  }

  function applySessionReopened () {
    if (!session.value) return
    session.value = { ...session.value, status: 'active' }
  }

  function markVoted (optionIds: number[]) {
    votedOptionIds.value = [...new Set([...votedOptionIds.value, ...optionIds])]
  }

  return {
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
  }
}
