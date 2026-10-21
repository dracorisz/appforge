import React from 'react'
import {
  Activity,
  BookOpen,
  Brain,
  Check,
  CircleAlert,
  Copy,
  Download,
  Eye,
  FileSpreadsheet,
  FileText,
  Image as ImageIcon,
  LogOut,
  MicOff,
  Monitor,
  Moon,
  MoreHorizontal,
  PanelLeft,
  PanelRight,
  Pause,
  Pencil,
  Play,
  Plug,
  Plus,
  RefreshCw,
  Send,
  Sparkles,
  Square,
  Sun,
  Trash2,
  User,
  VolumeX,
  X,
} from 'lucide-react'
import { useAuth } from '@/auth/AuthProvider'
import { useTheme } from '@/hooks/useTheme'
import { toast } from '@/lib/toast'
import { Badge, Button, Card, FileButton, Input, LamatLogo, Modal, Surface, Textarea } from '@/components/ui'
import { Financier } from './Financier'
import {
  AnimatedAssistantMessage,
  IntegrationsModal,
  LibraryModal,
  MemoryPersonalizationModal,
  ModelSelectorDropdown,
  PersonaConfigModal,
  TaskInspectModal,
  type IntegrationStatusItem,
  type LamatLibraryItem,
  type LamatTask,
} from './CompanionParts'

type MessageAttachmentMeta = {
  name: string
  mimeType: string
  kind: 'image' | 'document' | 'spreadsheet'
  sizeBytes: number
  dataUrl?: string
}

type Message = {
  id?: string
  role: 'user' | 'assistant'
  content: string
  model?: string | null
  createdAt?: string
  thumbnails?: Array<{ name: string; dataUrl: string }>
  attachments?: MessageAttachmentMeta[]
}
type ChatSession = {
  id: string
  title: string
  updatedAt: number
  sourceSessionId?: string | null
  messages: Message[]
}
type IntegrationStatus = 'checking' | 'verified' | 'partial' | 'expired' | 'needs_setup' | 'invalid_credentials' | 'insufficient_permissions' | 'unavailable'
type IntegrationKey = 'github' | 'vercel' | 'supabase' | 'google_workspace'
type RailTab = 'tasks' | 'context' | 'finance' | 'budget'

type UserPersona = {
  name: string
  gender: string
  user_callsign: string
  onboarding_completed: boolean
}

type AttachmentItem = {
  name: string
  mimeType: string
  data: string
  sizeBytes: number
  kind: 'image' | 'document' | 'spreadsheet'
  parsedText?: string
}

type LibraryItem = {
  id: string
  title: string
  file_name: string
  mime_type: string
  kind: 'image' | 'document' | 'spreadsheet'
  size_bytes: number
  thumbnail_data?: string | null
  parsed_text?: string | null
  created_at: string
}

type PendingApproval = {
  token: string
  repository: string
  path: string
  operation: 'create' | 'update'
  summary: string
  preview: string
  expiresAt: number
  sessionId: string
}

type LamatQuestion = {
  id: string
  task_id?: string | null
  goal_id?: string | null
  question: string
  context_why: string
  missing_info?: string | null
  options?: string[]
  status: string
  answer?: string | null
}

type LamatAction = {
  id: string
  category: string
  summary: string
  target?: string | null
  payload?: Record<string, unknown>
  estimated_cost_usd: number
  status: string
  execution_status: string
  created_at: string
}

type LamatGoal = {
  id: string
  title: string
  description?: string | null
  success_criteria?: string | null
  status: string
  priority: number
  horizon?: string | null
  target_date?: string | null
}

type LamatMemory = {
  id: string
  kind: string
  content: string
  provenance: string
  confidence: number
  status: string
  updated_at: string
}

type LamatResource = {
  id: string
  kind: string
  name: string
  amount?: number | null
  unit?: string | null
  expires_on?: string | null
  provenance: string
  notes?: string | null
}

type LamatRun = {
  id: string
  task_id?: string | null
  trigger_source: string
  agent_role: string
  model: string
  status: string
  input_summary?: string | null
  output_summary?: string | null
  tool_calls?: Array<{ name: string; status: string }>
  prompt_tokens: number
  completion_tokens: number
  estimated_cost_usd: number
  actual_cost_usd?: number | null
  cost_provenance: string
  duration_ms?: number | null
  error?: string | null
  started_at: string
}

type LamatStatePayload = {
  activity?: {
    state: 'executing' | 'planning' | 'verifying' | 'waiting' | 'blocked' | 'paused' | 'completed'
    whatWorkingOn: string
    whyItMatters: string
    completedCount: number
    remainingCount: number
    requiresInput: boolean
    requiresApproval: boolean
    pendingQuestionsCount: number
    pendingApprovalsCount: number
    canExecuteAutonomously: boolean
    overnightFreeOnly?: boolean
    haltReason?: string | null
  }
  budget?: {
    config?: {
      daily_limit_usd: number
      task_limit_usd: number
      total_credit_limit_usd: number
      autonomous_enabled: boolean
      overnight_free_only?: boolean
      routine_model: string
      reasoning_model: string
      free_model?: string
      preferred_chat_model?: string
    }
    today_spend_usd: number
    today_measured_usd: number
    today_estimated_usd: number
    total_spend_usd: number
    remaining_daily_usd: number
    remaining_total_credit_usd: number
    today_tokens: number
    can_execute: boolean
    halt_reason?: string | null
  } | null
  gcpStatus?: {
    configured: boolean
    projectNumber?: string | null
    serviceAccountEmail?: string | null
    vertexApiState?: string
  } | null
  persona?: UserPersona | null
  goals?: LamatGoal[]
  tasks?: LamatTask[]
  pendingQuestions?: LamatQuestion[]
  pendingApprovals?: LamatAction[]
  memories?: LamatMemory[]
  resources?: LamatResource[]
  libraryItems?: LibraryItem[]
  runs?: LamatRun[]
  latestMessages?: Array<{
    id: string
    conversation_id: string
    role: string
    content: string
    model?: string | null
    created_at: string
  }>
}

const starterPrompts = [
  'What are you working on right now and what needs my input?',
  'Look in my Google Drive or Library for "Dragoljub\'s Plans" and summarize the goals and financial figures.',
  'Review my active goals, runway, and top priorities for today.',
  'Inspect the repository structure and propose the next self-improvement step.',
]

export function Companion() {
  const { session, user, connectGoogleWorkspace, signOut } = useAuth()
  const { mode: themeMode, setMode: setThemeMode } = useTheme()
  const storageKey = `lamat-operator-sessions:${user?.id || user?.email || 'local'}`
  const [sessions, setSessions] = React.useState<ChatSession[]>([])
  const [activeSessionId, setActiveSessionId] = React.useState('')
  const [sessionsLoaded, setSessionsLoaded] = React.useState(false)
  const [sidebarOpen, setSidebarOpen] = React.useState(true)
  const [drawerOpen, setDrawerOpen] = React.useState(false)
  const [draft, setDraft] = React.useState('')
  const [selectedModel, setSelectedModel] = React.useState('auto')
  const [freeOnly, setFreeOnly] = React.useState(false)
  const [railTab, setRailTab] = React.useState<RailTab>('tasks')
  const [copiedMessage, setCopiedMessage] = React.useState<number | null>(null)
  const [sending, setSending] = React.useState(false)
  const [workingSessionId, setWorkingSessionId] = React.useState<string | null>(null)
  const [cycling, setCycling] = React.useState(false)
  const [autoContinue, setAutoContinue] = React.useState(false)
  const [error, setError] = React.useState('')
  const [online, setOnline] = React.useState(() => navigator.onLine)
  const [attachments, setAttachments] = React.useState<AttachmentItem[]>([])
  const [pendingApproval, setPendingApproval] = React.useState<PendingApproval | null>(null)
  const [opState, setOpState] = React.useState<LamatStatePayload | null>(null)
  const [loadingState, setLoadingState] = React.useState(false)
  const [questionAnswers, setQuestionAnswers] = React.useState<Record<string, string>>({})
  const [newGoalTitle, setNewGoalTitle] = React.useState('')
  const [newGoalCriteria, setNewGoalCriteria] = React.useState('')
  const [newTaskTitle, setNewTaskTitle] = React.useState('')
  const [newTaskRationale, setNewTaskRationale] = React.useState('')
  const [newMemoryContent, setNewMemoryContent] = React.useState('')
  const [newMemoryKind, setNewMemoryKind] = React.useState('fact')
  const [persona, setPersona] = React.useState<UserPersona | null>(null)
  const [showOnboarding, setShowOnboarding] = React.useState(false)
  const [showIntegrationsModal, setShowIntegrationsModal] = React.useState(false)
  const [showMemoryModal, setShowMemoryModal] = React.useState(false)
  const [showLibraryModal, setShowLibraryModal] = React.useState(false)
  const [verifyingIntegrations, setVerifyingIntegrations] = React.useState(false)
  const [uploadingLibrary, setUploadingLibrary] = React.useState(false)
  const [integrationsDetail, setIntegrationsDetail] = React.useState<Record<string, IntegrationStatusItem>>({})
  const [personaNameInput, setPersonaNameInput] = React.useState('Lamat')
  const [personaGenderInput, setPersonaGenderInput] = React.useState('adaptive')
  const [userCallsignInput, setUserCallsignInput] = React.useState('Dragoljub')
  const [savingPersona, setSavingPersona] = React.useState(false)
  const [latestAnimatedId, setLatestAnimatedId] = React.useState<string | null>(null)

  const [dailyLimitInput, setDailyLimitInput] = React.useState('7.00')
  const [taskLimitInput, setTaskLimitInput] = React.useState('1.50')
  const [savingBudget, setSavingBudget] = React.useState(false)

  const [menuSessionId, setMenuSessionId] = React.useState<string | null>(null)
  const [menuOpenUpward, setMenuOpenUpward] = React.useState(false)
  const [renameModalSession, setRenameModalSession] = React.useState<ChatSession | null>(null)
  const [renameTitleInput, setRenameTitleInput] = React.useState('')
  const [deleteModalSession, setDeleteModalSession] = React.useState<ChatSession | null>(null)

  const [selectedTaskModal, setSelectedTaskModal] = React.useState<LamatTask | null>(null)
  const [taskRatingInput, setTaskRatingInput] = React.useState<number>(5)
  const [taskFeedbackInput, setTaskFeedbackInput] = React.useState('')
  const [savingRating, setSavingRating] = React.useState(false)

  const [integrationStatuses, setIntegrationStatuses] = React.useState<Record<IntegrationKey, IntegrationStatus>>({
    github: 'checking',
    vercel: 'checking',
    supabase: 'checking',
    google_workspace: 'checking',
  })

  const scrollRef = React.useRef<HTMLDivElement | null>(null)
  const activeAbortRef = React.useRef<AbortController | null>(null)
  const lastToastRef = React.useRef<{ msg: string; at: number }>({ msg: '', at: 0 })
  const activeSession = sessions.find((item) => item.id === activeSessionId)
  const messages = React.useMemo(() => activeSession?.messages || [], [activeSession])

  const notifyOnce = React.useCallback((msg: string, tone: 'success' | 'info' | 'error' = 'info', duration = 3600) => {
    const now = Date.now()
    if (lastToastRef.current.msg === msg && now - lastToastRef.current.at < 4000) return
    lastToastRef.current = { msg, at: now }
    toast[tone](msg, duration)
  }, [])

  // B3: Dynamic browser document title based on active session title
  React.useEffect(() => {
    const currentTitle = activeSession?.title?.trim()
    if (
      !activeSession ||
      activeSession.messages.length === 0 ||
      !currentTitle ||
      currentTitle.toLowerCase() === 'new chat'
    ) {
      document.title = 'Lamat'
    } else {
      document.title = currentTitle
    }
  }, [activeSession])

  React.useEffect(() => {
    return () => {
      activeAbortRef.current?.abort()
    }
  }, [])

  // Close session overflow menu on Escape
  React.useEffect(() => {
    if (!menuSessionId) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuSessionId(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [menuSessionId])

  React.useEffect(() => {
    const onOnline = () => setOnline(true)
    const onOffline = () => setOnline(false)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [])

  React.useEffect(() => {
    let saved: ChatSession[] = []
    try {
      const parsed = JSON.parse(localStorage.getItem(storageKey) || '[]')
      if (Array.isArray(parsed)) {
        saved = parsed.filter((item) => item && typeof item.id === 'string' && Array.isArray(item.messages))
      }
    } catch {
      /* Ignore malformed local session data. */
    }
    if (!saved.length) {
      saved = [{ id: crypto.randomUUID(), title: 'New chat', updatedAt: Date.now(), messages: [] }]
    }
    setSessions(saved)
    setActiveSessionId(saved[0].id)
    setSessionsLoaded(true)
  }, [storageKey])

  React.useEffect(() => {
    if (!sessionsLoaded) return
    try {
      localStorage.setItem(storageKey, JSON.stringify(sessions.slice(0, 30)))
    } catch {
      /* Storage may be unavailable or full. */
    }
  }, [sessions, sessionsLoaded, storageKey])

  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, sending])

  const refreshOperationalState = React.useCallback(async () => {
    if (!session?.access_token) return
    setLoadingState(true)
    try {
      const response = await fetch('/api/lamat', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      const payload = (await response.json().catch(() => null)) as LamatStatePayload | null
      if (response.ok && payload) {
        setOpState(payload)
        if (payload.budget?.config) {
          setDailyLimitInput(String(payload.budget.config.daily_limit_usd ?? 7))
          setTaskLimitInput(String(payload.budget.config.task_limit_usd ?? 1.5))
          setFreeOnly(Boolean(payload.budget.config.overnight_free_only))
          if (payload.budget.config.preferred_chat_model) {
            setSelectedModel(payload.budget.config.preferred_chat_model)
          }
        }
        if (payload.persona) {
          setPersona(payload.persona)
          setPersonaNameInput(payload.persona.name || 'Lamat')
          setPersonaGenderInput(payload.persona.gender || 'adaptive')
          setUserCallsignInput(payload.persona.user_callsign || 'Dragoljub')
          if (!payload.persona.onboarding_completed) {
            setShowOnboarding(true)
          }
        } else {
          setShowOnboarding(true)
        }
        if (Array.isArray(payload.latestMessages) && payload.latestMessages.length > 0) {
          const remoteMessages: Message[] = payload.latestMessages
            .filter((m) => m.role === 'user' || m.role === 'assistant')
            .map((m) => ({
              id: m.id,
              role: m.role as 'user' | 'assistant',
              content: m.content,
              model: m.model,
              createdAt: m.created_at,
            }))
          if (remoteMessages.length > 0) {
            setSessions((current) => {
              if (!current.length) return current
              const first = current[0]
              if (first.messages.length === 0) {
                return [{ ...first, messages: remoteMessages }, ...current.slice(1)]
              }
              return current
            })
          }
        }
      }
    } catch {
      /* Keep existing state snapshot if refresh fails transiently */
    } finally {
      setLoadingState(false)
    }
  }, [session?.access_token])

  React.useEffect(() => {
    void refreshOperationalState()
  }, [refreshOperationalState])

  const refreshIntegrations = React.useCallback(async () => {
    if (!session?.access_token) {
      setIntegrationStatuses({
        github: 'needs_setup',
        vercel: 'needs_setup',
        supabase: 'needs_setup',
        google_workspace: 'needs_setup',
      })
      return
    }
    setVerifyingIntegrations(true)
    try {
      const response = await fetch('/api/companion-integrations', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error('Integration status could not be checked.')
      const integrations = payload.integrations || {}
      setIntegrationsDetail(integrations)
      const normalize = (value: unknown): IntegrationStatus =>
        ['verified', 'partial', 'expired', 'needs_setup', 'invalid_credentials', 'insufficient_permissions', 'unavailable'].includes(String(value))
          ? (value as IntegrationStatus)
          : 'unavailable'
      setIntegrationStatuses({
        github: normalize(integrations.github?.status),
        vercel: normalize(integrations.vercel?.status),
        supabase: normalize(integrations.supabase?.status),
        google_workspace: normalize(integrations.google_workspace?.status),
      })
    } catch {
      setIntegrationStatuses({
        github: 'unavailable',
        vercel: 'unavailable',
        supabase: 'unavailable',
        google_workspace: 'unavailable',
      })
    } finally {
      setVerifyingIntegrations(false)
    }
  }, [session?.access_token])

  React.useEffect(() => {
    void refreshIntegrations()
  }, [refreshIntegrations])

  const cancelActiveRequest = React.useCallback(() => {
    if (activeAbortRef.current) {
      activeAbortRef.current.abort()
      activeAbortRef.current = null
    }
    setSending(false)
    setWorkingSessionId(null)
    notifyOnce('Active request cancelled.', 'info')
  }, [notifyOnce])

  const runOperatingCycle = React.useCallback(
    async (taskId?: string, maxSteps = 1) => {
      if (!session?.access_token || cycling) return
      setCycling(true)
      setError('')
      try {
        const response = await fetch('/api/lamat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            action: 'run_cycle',
            taskId: taskId || null,
            maxSteps,
            preferFree: freeOnly,
            model: selectedModel,
            triggerSource: autoContinue ? 'autonomous_cycle' : 'manual',
          }),
        })
        const payload = await response.json().catch(() => ({}))
        if (!response.ok && !payload.cycleStatus) {
          throw new Error(typeof payload.message === 'string' ? payload.message : 'Could not run operating cycle.')
        }
        if (payload.cycleStatus === 'task_completed') {
          notifyOnce(`Completed task: ${payload.task?.title || 'Task verified'}.`, 'success', 4500)
          if (payload.task) {
            setSelectedTaskModal(payload.task as LamatTask)
            setTaskRatingInput(payload.task.user_rating || 5)
            setTaskFeedbackInput(payload.task.user_feedback || '')
          }
        } else if (payload.cycleStatus === 'step_checkpointed') {
          notifyOnce(
            `Completed step ${(payload.stepExecuted?.index ?? 0) + 1}/${payload.stepExecuted?.totalSteps ?? 1}: ${payload.stepExecuted?.title || ''}`,
            'info'
          )
        } else if (payload.cycleStatus === 'waiting_input') {
          notifyOnce('Task paused waiting for your answer in Context. Moving to next task if Auto is ON.', 'info', 4500)
          if (!payload.nextCandidateTask) {
            setRailTab('context')
            setDrawerOpen(true)
            setAutoContinue(false)
          }
        } else if (payload.cycleStatus === 'waiting_approval') {
          notifyOnce('Task paused waiting for your approval in Context.', 'info', 4500)
          if (!payload.nextCandidateTask) {
            setRailTab('context')
            setDrawerOpen(true)
            setAutoContinue(false)
          }
        } else if (payload.cycleStatus === 'budget_halted') {
          notifyOnce(payload.haltReason || 'Daily budget reached; switch Free: ON to continue on free models.', 'error', 5000)
          setAutoContinue(false)
        } else if (payload.cycleStatus === 'idle_waiting') {
          notifyOnce(payload.message || 'All unblocked tasks in queue are complete.', 'info')
          setAutoContinue(false)
        }
        await refreshOperationalState()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Operating cycle encountered an error.')
        setAutoContinue(false)
      } finally {
        setCycling(false)
      }
    },
    [autoContinue, cycling, freeOnly, notifyOnce, refreshOperationalState, selectedModel, session?.access_token]
  )

  React.useEffect(() => {
    if (!autoContinue || cycling || !online) return
    const timer = window.setTimeout(() => {
      void runOperatingCycle(undefined, 1)
    }, 8000)
    return () => window.clearTimeout(timer)
  }, [autoContinue, cycling, online, runOperatingCycle])

  const startNewSession = () => {
    const fresh = { id: crypto.randomUUID(), title: 'New chat', updatedAt: Date.now(), messages: [] }
    setSessions((current) => [fresh, ...current].slice(0, 30))
    setActiveSessionId(fresh.id)
    setDraft('')
    setError('')
    setPendingApproval(null)
    setMenuSessionId(null)
  }

  const selectSession = (id: string) => {
    setActiveSessionId(id)
    setError('')
    setPendingApproval(null)
    setMenuSessionId(null)
  }

  const confirmDeleteSession = () => {
    if (!deleteModalSession) return
    const id = deleteModalSession.id
    const remaining = sessions.filter((item) => item.id !== id)
    setDeleteModalSession(null)
    setMenuSessionId(null)
    if (!remaining.length) {
      const fresh = { id: crypto.randomUUID(), title: 'New chat', updatedAt: Date.now(), messages: [] }
      setSessions([fresh])
      setActiveSessionId(fresh.id)
      notifyOnce('Session deleted.', 'info')
      return
    }
    setSessions(remaining)
    if (activeSessionId === id) setActiveSessionId(remaining[0].id)
    notifyOnce('Session deleted.', 'info')
  }

  const confirmRenameSession = (event: React.FormEvent) => {
    event.preventDefault()
    if (!renameModalSession || !renameTitleInput.trim()) return
    const nextTitle = renameTitleInput.trim().slice(0, 80)
    setSessions((current) =>
      current.map((s) => (s.id === renameModalSession.id ? { ...s, title: nextTitle, updatedAt: Date.now() } : s))
    )
    setRenameModalSession(null)
    setMenuSessionId(null)
    notifyOnce('Session renamed.', 'success')
  }

  const exportSessionAsMarkdown = (targetSession: ChatSession) => {
    setMenuSessionId(null)
    const speakerName = persona?.user_callsign || 'Dragoljub'
    const operatorName = persona?.name || 'Lamat'
    const header = [
      `# ${targetSession.title}`,
      `- **Exported:** ${new Date().toISOString()}`,
      `- **Participants:** ${speakerName} (Owner) & ${operatorName} (Lamat Autonomous Operator)`,
      '',
      '---',
      '',
    ].join('\n')

    const body =
      targetSession.messages.length === 0
        ? '*(No messages recorded in this session)*\n'
        : targetSession.messages
            .map((m, idx) => {
              const tag =
                m.role === 'user'
                  ? `### [${idx + 1}] ${speakerName} (User)`
                  : `### [${idx + 1}] ${operatorName} (Lamat${m.model ? ` · ${m.model}` : ''})`
              return `${tag}\n\n${m.content}\n`
            })
            .join('\n---\n\n')

    const blob = new Blob([header + body], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    const slug = targetSession.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'session'
    link.download = `lamat-${slug}-${new Date().toISOString().slice(0, 10)}.md`
    link.click()
    URL.revokeObjectURL(url)
    notifyOnce(`Exported "${targetSession.title}" as Markdown.`, 'success')
  }

  const sendMessageInSession = async (
    targetSessionId: string,
    baseMessages: Message[],
    content: string,
    options?: {
      sessionAction?: 'analyze' | 'summary'
      sourceContext?: { sessionId: string; title: string; turns: Array<{ role: string; content: string }> }
    }
  ) => {
    if (!content.trim() || sending || !session?.access_token) return
    const next = [...baseMessages, { id: crypto.randomUUID(), role: 'user' as const, content: content.trim() }]
    setSessions((current) =>
      current.map((item) =>
        item.id === targetSessionId
          ? {
              ...item,
              updatedAt: Date.now(),
              messages: next,
            }
          : item
      )
    )
    const controller = new AbortController()
    activeAbortRef.current = controller
    setSending(true)
    setWorkingSessionId(targetSessionId)
    setError('')
    try {
      const response = await fetch('/api/companion-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        signal: controller.signal,
        body: JSON.stringify({
          messages: next.map((m) => ({ role: m.role, content: m.content })),
          mode: 'lamat',
          model: selectedModel,
          freeOnly,
          ...(options?.sessionAction ? { sessionAction: options.sessionAction } : {}),
          ...(options?.sourceContext ? { sourceContext: options.sourceContext } : {}),
        }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(typeof payload.message === 'string' ? payload.message : 'Lamat could not complete this request.')
      }
      const replyText = String(payload.text || '').trim()
      const msgId = crypto.randomUUID()
      setLatestAnimatedId(msgId)
      setSessions((current) =>
        current.map((item) =>
          item.id === targetSessionId
            ? {
                ...item,
                title:
                  (!item.title || item.title === 'New chat') && typeof payload.generatedTitle === 'string' && payload.generatedTitle.trim()
                    ? payload.generatedTitle.trim()
                    : item.title,
                updatedAt: Date.now(),
                messages: [...next, { id: msgId, role: 'assistant', content: replyText, model: payload.model }],
              }
            : item
        )
      )
      void refreshOperationalState()
    } catch (cause) {
      if (cause instanceof DOMException && cause.name === 'AbortError') return
      setError(cause instanceof Error ? cause.message : 'Lamat is temporarily unavailable.')
    } finally {
      if (activeAbortRef.current === controller) {
        activeAbortRef.current = null
      }
      setSending(false)
      setWorkingSessionId(null)
    }
  }

  const analyzeOrSummarizeSessionInNewChat = (targetSession: ChatSession, actionType: 'analyze' | 'summary') => {
    if (sending) return
    setMenuSessionId(null)
    const compactTurns = targetSession.messages
      .slice(-16)
      .map((m) => ({
        role: m.role,
        content: m.content
          .replace(/!\[([^\]]*)\]\(data:image\/[^)]+\)/g, '[Image: $1]')
          .replace(/\n*\[Attached:\s*[^\]]+\]/gi, '')
          .slice(0, 700),
      }))

    const newId = crypto.randomUUID()
    const newTitle = `${actionType === 'analyze' ? 'Analysis' : 'Summary'}: ${targetSession.title}`.slice(0, 60)
    const freshSession: ChatSession = {
      id: newId,
      title: newTitle,
      sourceSessionId: targetSession.id,
      updatedAt: Date.now(),
      messages: [],
    }
    setSessions((current) => [freshSession, ...current].slice(0, 30))
    setActiveSessionId(newId)

    const displayPrompt =
      actionType === 'analyze'
        ? `Technical analysis of session "${targetSession.title}"`
        : `Summary of session "${targetSession.title}"`

    void sendMessageInSession(newId, [], displayPrompt, {
      sessionAction: actionType,
      sourceContext: {
        sessionId: targetSession.id,
        title: targetSession.title,
        turns: compactTurns,
      },
    })
  }

  const processSelectedFiles = async (fileList: FileList | File[] | null, forLibraryModalOnly = false) => {
    const files = Array.from(fileList || [])
    if (!files.length) return
    setError('')
    if (forLibraryModalOnly) setUploadingLibrary(true)
    const nextAttachments: AttachmentItem[] = [...attachments]
    try {
      for (const file of files) {
        if (!forLibraryModalOnly && nextAttachments.length >= 4) {
          setError('At most 4 attachments can be included per message.')
          break
        }
        if (file.size > 4 * 1024 * 1024) {
          setError(`File "${file.name}" exceeds the 4 MiB upload limit.`)
          continue
        }
        const isImage = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'].includes(file.type)
        const isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name)
        const isTextOrSheet =
          isPdf ||
          /\.(csv|tsv|txt|md|json|js|jsx|ts|tsx|py|sql|html|css|yaml|yml)$/i.test(file.name) ||
          ['text/plain', 'text/csv', 'text/markdown', 'application/json', 'text/tab-separated-values'].includes(file.type)

        if (!isImage && !isTextOrSheet) {
          setError(`Unsupported file format (${file.name}). Attach PNG/JPEG/WebP/GIF images, PDFs, or CSV/TSV/TXT/MD/JSON/code files.`)
          continue
        }

        if (isImage) {
          const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => resolve(String(reader.result || ''))
            reader.onerror = () => reject(new Error('Failed to read image file.'))
            reader.readAsDataURL(file)
          }).catch(() => '')
          if (base64) {
            if (!forLibraryModalOnly) {
              nextAttachments.push({
                name: file.name,
                mimeType: file.type,
                data: base64,
                sizeBytes: file.size,
                kind: 'image',
              })
            }
            if (session?.access_token) {
              await fetch('/api/lamat', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({
                  action: 'save_library_item',
                  title: file.name,
                  fileName: file.name,
                  mimeType: file.type,
                  kind: 'image',
                  sizeBytes: file.size,
                  thumbnailData: base64,
                  parsedText: `Uploaded image: ${file.name}`,
                }),
              })
                .then(() => refreshOperationalState())
                .catch(() => {})
            }
          }
        } else {
          const rawText = await file.text().catch(() => '')
          const isSheet = /\.(csv|tsv)$/i.test(file.name) || file.type === 'text/csv'
          const clippedText = isPdf && !rawText.trim()
            ? `[PDF Document: ${file.name} (${Math.round(file.size / 1024)} KB)]`
            : rawText.slice(0, 60000)
          if (!forLibraryModalOnly) {
            nextAttachments.push({
              name: file.name,
              mimeType: file.type || (isSheet ? 'text/csv' : isPdf ? 'application/pdf' : 'text/plain'),
              data: '',
              sizeBytes: file.size,
              kind: isSheet ? 'spreadsheet' : 'document',
              parsedText: clippedText,
            })
          }
          if (session?.access_token) {
            await fetch('/api/lamat', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${session.access_token}`,
              },
              body: JSON.stringify({
                action: 'save_library_item',
                title: file.name,
                fileName: file.name,
                mimeType: file.type || (isSheet ? 'text/csv' : isPdf ? 'application/pdf' : 'text/plain'),
                kind: isSheet ? 'spreadsheet' : 'document',
                sizeBytes: file.size,
                parsedText: clippedText,
              }),
            })
              .then(() => {
                notifyOnce(`Saved "${file.name}" to your Library.`, 'success')
                return refreshOperationalState()
              })
              .catch(() => {})
          }
        }
      }
      if (!forLibraryModalOnly) {
        setAttachments(nextAttachments)
      }
    } finally {
      if (forLibraryModalOnly) setUploadingLibrary(false)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    event.target.value = ''
    await processSelectedFiles(files, false)
  }

  const sendMessage = async (value = draft) => {
    const content = value.trim()
    if ((!content && !attachments.length) || sending || !session?.access_token || !activeSessionId) return

    const imageAttachments = attachments.filter((a) => a.kind === 'image')
    const docAttachments = attachments.filter((a) => a.kind !== 'image')
    const docTextBlocks = docAttachments
      .map((d) => `\n\n--- Attached ${d.kind.toUpperCase()}: ${d.name} ---\n${(d.parsedText || '').slice(0, 12000)}`)
      .join('')

    // B5: Do not duplicate attachment names with textual "[Attached: ...]" in displayContent
    const displayContent = content
    const llmPromptContent = `${content || 'Analyze the attached file(s).'}${docTextBlocks}`
    const thumbnails = imageAttachments.map((img) => ({ name: img.name, dataUrl: img.data }))
    const messageAttachments: MessageAttachmentMeta[] = attachments.map((att) => ({
      name: att.name,
      mimeType: att.mimeType,
      kind: att.kind,
      sizeBytes: att.sizeBytes,
      ...(att.kind === 'image' && att.data ? { dataUrl: att.data } : {}),
    }))

    const nextDisplayMessages: Message[] = [
      ...messages,
      {
        id: crypto.randomUUID(),
        role: 'user',
        content: displayContent,
        thumbnails,
        attachments: messageAttachments,
      },
    ]
    const nextLlmMessages = [
      ...messages.map((m) => ({ role: m.role, content: m.content || 'Attached file(s).' })),
      { role: 'user' as const, content: llmPromptContent.slice(0, 4000) },
    ]

    const sessionId = activeSessionId
    const sentImageAttachments = imageAttachments.map((img) => ({
      name: img.name,
      mimeType: img.mimeType,
      data: img.data,
      sizeBytes: img.sizeBytes,
    }))

    // Section 7.1: Keep session title until Lamat's first reply arrives
    setSessions((current) =>
      current.map((item) =>
        item.id === sessionId
          ? {
              ...item,
              updatedAt: Date.now(),
              messages: nextDisplayMessages,
            }
          : item
      )
    )
    setDraft('')
    setAttachments([])
    setError('')
    setPendingApproval(null)
    const controller = new AbortController()
    activeAbortRef.current = controller
    setSending(true)
    setWorkingSessionId(sessionId)
    try {
      const response = await fetch('/api/companion-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        signal: controller.signal,
        body: JSON.stringify({
          messages: nextLlmMessages,
          attachments: sentImageAttachments,
          mode: 'lamat',
          model: selectedModel,
          freeOnly,
        }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(typeof payload.message === 'string' ? payload.message : 'Lamat could not complete this request.')
      }
      if (payload.pendingApproval && typeof payload.pendingApproval.token === 'string') {
        setPendingApproval({
          token: String(payload.pendingApproval.token),
          repository: String(payload.pendingApproval.repository || ''),
          path: String(payload.pendingApproval.path || ''),
          operation: payload.pendingApproval.operation === 'create' ? 'create' : 'update',
          summary: String(payload.pendingApproval.summary || ''),
          preview: String(payload.pendingApproval.preview || ''),
          expiresAt: Number(payload.pendingApproval.expiresAt || 0),
          sessionId,
        })
      }
      const replyText = String(payload.text || '').trim()
      const msgId = crypto.randomUUID()
      setLatestAnimatedId(msgId)
      const fallbackTitle = (content || attachments[0]?.name || 'Lamat Session')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 44)
      const nextGeneratedTitle =
        typeof payload.generatedTitle === 'string' && payload.generatedTitle.trim()
          ? payload.generatedTitle.trim()
          : fallbackTitle
      setSessions((current) =>
        current.map((item) =>
          item.id === sessionId
            ? {
                ...item,
                title: !item.title || item.title === 'New chat' ? nextGeneratedTitle : item.title,
                updatedAt: Date.now(),
                messages: [
                  ...nextDisplayMessages,
                  { id: msgId, role: 'assistant', content: replyText, model: payload.model },
                ],
              }
            : item
        )
      )
      void refreshOperationalState()
    } catch (cause) {
      if (cause instanceof DOMException && cause.name === 'AbortError') return
      setError(cause instanceof Error ? cause.message : 'Lamat is temporarily unavailable.')
    } finally {
      if (activeAbortRef.current === controller) {
        activeAbortRef.current = null
      }
      setSending(false)
      setWorkingSessionId(null)
    }
  }

  const approvePendingAction = async () => {
    const approval = pendingApproval
    if (!approval || sending || !session?.access_token) return
    setSending(true)
    setError('')
    try {
      const response = await fetch('/api/companion-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ approvalToken: approval.token }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(typeof payload.message === 'string' ? payload.message : 'Lamat could not apply the approved change.')
      }
      setSessions((current) =>
        current.map((item) =>
          item.id === approval.sessionId
            ? {
                ...item,
                updatedAt: Date.now(),
                messages: [
                  ...item.messages,
                  { role: 'assistant', content: String(payload.text || 'The approved action completed.').trim() },
                ],
              }
            : item
        )
      )
      setPendingApproval(null)
      notifyOnce('Approved file change committed.', 'success')
      void refreshOperationalState()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The approved change could not be applied.')
    } finally {
      setSending(false)
    }
  }

  const handleAnswerQuestion = async (questionId: string, answerText?: string) => {
    const answer = (answerText ?? questionAnswers[questionId] ?? '').trim()
    if (!answer || !session?.access_token) return
    setError('')
    try {
      const response = await fetch('/api/lamat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ action: 'answer_question', questionId, answer }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload.message || 'Could not record answer.')
      setQuestionAnswers((prev) => ({ ...prev, [questionId]: '' }))
      notifyOnce('Answer recorded and blocked task resumed.', 'success')
      await refreshOperationalState()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit answer.')
    }
  }

  const handleDecideAction = async (actionItem: LamatAction, decision: 'approved' | 'rejected') => {
    if (!session?.access_token) return
    setError('')
    try {
      const response = await fetch('/api/lamat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          action: 'decide_action',
          actionId: actionItem.id,
          decision,
          parameterHash: actionItem.payload?._parameter_hash || null,
        }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload.message || 'Could not update action approval.')
      notifyOnce(`Action ${decision}.`, 'success')
      await refreshOperationalState()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update approval.')
    }
  }

  const handleSavePersona = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!session?.access_token) return
    setSavingPersona(true)
    setError('')
    try {
      const response = await fetch('/api/lamat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          action: 'save_persona',
          name: personaNameInput.trim() || 'Lamat',
          gender: personaGenderInput.trim() || 'adaptive',
          user_callsign: userCallsignInput.trim() || 'Dragoljub',
        }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload.message || 'Could not save persona settings.')
      setPersona(payload.persona)
      setShowOnboarding(false)
      toast.success(
        `Persona saved: addressed as "${payload.persona.name}" (${payload.persona.gender}). You can change this anytime via the User icon in the top-left sidebar or Operator → Budget.`,
        5200
      )
      await refreshOperationalState()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save persona.')
    } finally {
      setSavingPersona(false)
    }
  }

  const handleModelChange = async (nextModel: string) => {
    setSelectedModel(nextModel)
    if (!session?.access_token) return
    try {
      await fetch('/api/lamat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ action: 'update_budget', preferred_chat_model: nextModel }),
      })
      notifyOnce(`Active model set to ${nextModel === 'auto' ? 'Auto Orchestrator' : nextModel}.`, 'info')
    } catch {
      /* ignore */
    }
  }

  const handleToggleFreeOnly = async () => {
    const nextFree = !freeOnly
    setFreeOnly(nextFree)
    if (!session?.access_token) return
    try {
      await fetch('/api/lamat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ action: 'update_budget', overnight_free_only: nextFree }),
      })
      notifyOnce(
        nextFree
          ? 'Free Mode ON: Using only $0 free models (OpenRouter / HuggingFace).'
          : 'Free Mode OFF: Vertex AI models enabled within daily budget.',
        'info'
      )
      await refreshOperationalState()
    } catch {
      /* ignore */
    }
  }

  const handleSaveBudgetLimits = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!session?.access_token) return
    const daily = Number(dailyLimitInput)
    const taskCap = Number(taskLimitInput)
    if (!Number.isFinite(daily) || daily < 0 || !Number.isFinite(taskCap) || taskCap < 0) {
      setError('Enter valid non-negative USD limits.')
      return
    }
    setSavingBudget(true)
    try {
      const response = await fetch('/api/lamat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          action: 'update_budget',
          daily_limit_usd: daily,
          task_limit_usd: taskCap,
        }),
      })
      if (response.ok) {
        notifyOnce(`Budget limits updated ($${daily.toFixed(2)}/day · $${taskCap.toFixed(2)}/task).`, 'success')
        await refreshOperationalState()
      }
    } finally {
      setSavingBudget(false)
    }
  }

  const handleRateTask = async (requestRevision = false) => {
    if (!selectedTaskModal || !session?.access_token) return
    setSavingRating(true)
    try {
      const response = await fetch('/api/lamat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          action: 'rate_task',
          taskId: selectedTaskModal.id,
          rating: taskRatingInput,
          feedback: taskFeedbackInput.trim(),
          requestRevision,
        }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload.message || 'Could not save task rating.')
      notifyOnce(
        requestRevision
          ? `Rated ${taskRatingInput}/5 stars and queued a revision task.`
          : `Saved ${taskRatingInput}/5 star rating and recorded feedback for Lamat's self-improvement.`,
        'success'
      )
      setSelectedTaskModal(null)
      await refreshOperationalState()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save rating.')
    } finally {
      setSavingRating(false)
    }
  }

  const handleDeleteMemory = async (memoryId: string) => {
    if (!session?.access_token) return
    try {
      await fetch('/api/lamat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ action: 'archive_memory', memoryId }),
      })
      notifyOnce('Memory permanently deleted.', 'info')
      await refreshOperationalState()
    } catch {
      /* ignore */
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    if (!session?.access_token) return
    try {
      await fetch('/api/lamat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ action: 'delete_task', id: taskId }),
      })
      notifyOnce('Task deleted.', 'info')
      await refreshOperationalState()
    } catch {
      /* ignore */
    }
  }

  const handleDeleteLibraryItem = async (id: string) => {
    if (!session?.access_token) return
    try {
      await fetch('/api/lamat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ action: 'delete_library_item', id }),
      })
      notifyOnce('Removed from Library.', 'info')
      await refreshOperationalState()
    } catch {
      /* ignore */
    }
  }

  const handleCreateGoal = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!newGoalTitle.trim() || !session?.access_token) return
    setError('')
    try {
      const response = await fetch('/api/lamat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          action: 'create_goal',
          title: newGoalTitle.trim(),
          success_criteria: newGoalCriteria.trim() || 'Verified completion of objective.',
          priority: 1,
          horizon: 'now',
          status: 'active',
        }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload.message || 'Could not create goal.')
      setNewGoalTitle('')
      setNewGoalCriteria('')
      notifyOnce('Goal created and initial execution task queued.', 'success')
      await refreshOperationalState()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create goal.')
    }
  }

  const handleCreateTask = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!newTaskTitle.trim() || !session?.access_token) return
    setError('')
    try {
      const response = await fetch('/api/lamat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          action: 'create_task',
          title: newTaskTitle.trim(),
          rationale: newTaskRationale.trim() || 'Owner-requested task.',
          expected_outcome: 'Verified task output.',
          priority: 1,
        }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload.message || 'Could not create task.')
      setNewTaskTitle('')
      setNewTaskRationale('')
      notifyOnce('Task added to queue.', 'success')
      await refreshOperationalState()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create task.')
    }
  }

  const handleTaskStatus = async (taskId: string, status: string) => {
    if (!session?.access_token) return
    try {
      await fetch('/api/lamat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ action: 'update_task_status', id: taskId, status }),
      })
      await refreshOperationalState()
    } catch {
      /* ignore */
    }
  }

  const handleToggleAutonomousEngine = async () => {
    if (!session?.access_token) return
    const nextEnabled = !(opState?.budget?.config?.autonomous_enabled ?? true)
    try {
      await fetch('/api/lamat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ action: 'update_budget', autonomous_enabled: nextEnabled }),
      })
      if (!nextEnabled) setAutoContinue(false)
      notifyOnce(nextEnabled ? 'Autonomous engine resumed.' : 'Autonomous engine paused.', 'info')
      await refreshOperationalState()
    } catch {
      /* ignore */
    }
  }

  const handleRecordMemory = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!newMemoryContent.trim() || !session?.access_token) return
    try {
      const response = await fetch('/api/lamat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          action: 'record_memory',
          kind: newMemoryKind,
          content: newMemoryContent.trim(),
        }),
      })
      if (response.ok) {
        setNewMemoryContent('')
        notifyOnce('Context note saved.', 'success')
        await refreshOperationalState()
      }
    } catch {
      /* ignore */
    }
  }

  const handleExportContinuity = async () => {
    if (!session?.access_token) return
    try {
      const response = await fetch('/api/lamat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ action: 'export_continuity' }),
      })
      const payload = await response.json().catch(() => ({}))
      if (response.ok && payload.continuity) {
        const blob = new Blob([JSON.stringify(payload.continuity, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `lamat-continuity-${new Date().toISOString().slice(0, 10)}.json`
        link.click()
        URL.revokeObjectURL(url)
        notifyOnce(`Exported continuity snapshot (SHA-256: ${String(payload.checksum || '').slice(0, 12)}).`, 'success')
      }
    } catch {
      setError('Could not export continuity snapshot.')
    }
  }

  const copyMessage = async (content: string, index: number) => {
    try {
      await navigator.clipboard.writeText(content)
      setCopiedMessage(index)
      window.setTimeout(() => setCopiedMessage((current) => (current === index ? null : current)), 1800)
    } catch {
      setError('Could not copy automatically. Select the response and copy it manually.')
    }
  }

  const activity = opState?.activity
  const budget = opState?.budget
  const gcpStatus = opState?.gcpStatus
  const pendingQuestions = opState?.pendingQuestions || []
  const pendingApprovals = opState?.pendingApprovals || []
  const tasks = opState?.tasks || []
  const goals = opState?.goals || []
  const memories = opState?.memories || []
  const resources = opState?.resources || []
  const libraryItems = (opState?.libraryItems || []) as LamatLibraryItem[]
  const inboxCount = pendingQuestions.length + pendingApprovals.length
  const connectedIntegrationsCount = Object.values(integrationStatuses).filter(
    (st) => st === 'verified' || st === 'partial'
  ).length

  return (
    <div className="flex h-dvh w-screen min-w-0 overflow-hidden bg-background text-foreground">
      {/* Left Sidebar (B2, B7, B9, B10: compact typography, left-side nav modals, upward overflow menu) */}
      {sidebarOpen && (
        <aside
          className="flex h-full w-64 shrink-0 flex-col border-r border-border/70 bg-background p-2"
          aria-label="Lamat sidebar"
        >
          <div className="flex items-center justify-between gap-2 py-2 pl-2">
            <div className="flex items-center gap-2">
              <LamatLogo className="h-4 w-4 shrink-0" />
              <span className="truncate text-sm font-semibold">{persona?.name || 'Lamat'}</span>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowOnboarding(true)}
                title="Configure Persona & Identity"
                aria-label="Configure Persona"
              >
                <User className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(false)}
                aria-label="Hide sidebar"
              >
                <PanelLeft className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2 py-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={startNewSession}
              disabled={sending}
              className="w-full justify-start gap-2 text-xs /* design-xs-ok */"
            >
              <Plus className="h-4 w-4" /> New chat
            </Button>

            {/* B2 & Section 9: Left-side navigation buttons for Integrations, Memory/Personalization, and Library */}
            <div className="space-y-2 border-b border-border/70 pb-2" role="navigation" aria-label="Workspace features">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowIntegrationsModal(true)
                  void refreshIntegrations()
                }}
                className="w-full justify-between px-2 text-left text-xs /* design-xs-ok */"
              >
                <span className="flex items-center gap-2 truncate">
                  <Plug className="h-4 w-4 shrink-0" />
                  <span>Integrations</span>
                </span>
                <Badge color={connectedIntegrationsCount >= 3 ? 'green' : 'amber'}>
                  {connectedIntegrationsCount}/4
                </Badge>
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowMemoryModal(true)}
                className="w-full justify-between px-2 text-left text-xs /* design-xs-ok */"
              >
                <span className="flex items-center gap-2 truncate">
                  <Brain className="h-4 w-4 shrink-0" />
                  <span>Memory & Persona</span>
                </span>
                <Badge color="slate">{memories.length}</Badge>
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowLibraryModal(true)}
                className="w-full justify-between px-2 text-left text-xs /* design-xs-ok */"
              >
                <span className="flex items-center gap-2 truncate">
                  <BookOpen className="h-4 w-4 shrink-0" />
                  <span>Library</span>
                </span>
                <Badge color="slate">{libraryItems.length}</Badge>
              </Button>
            </div>
          </div>

          <div className="px-2 text-xs font-medium text-muted-foreground /* design-xs-ok */">Sessions</div>

          <div className="min-h-0 flex-1 space-y-2 overflow-y-auto py-2" aria-label="Chat history">
            {sessions.map((item, idx) => {
              const isMenuOpen = menuSessionId === item.id
              const isSessionWorking = sending && workingSessionId === item.id
              return (
                <div
                  key={item.id}
                  className={`relative rounded-xl ${item.id === activeSessionId ? 'bg-muted' : 'hover:bg-muted/60'}`}
                >
                  <div className="flex items-center pl-2">
                    <Button
                      variant="ghost"
                      type="button"
                      size="sm"
                      onClick={() => selectSession(item.id)}
                      className="min-w-0 flex-1 justify-start truncate px-2 py-2 text-left text-xs /* design-xs-ok */"
                      aria-current={item.id === activeSessionId ? 'page' : undefined}
                      title={item.title}
                    >
                      <span className="truncate">{item.title}</span>
                    </Button>
                    <Button
                      variant="ghost"
                      type="button"
                      size="sm"
                      onClick={(event) => {
                        const rect = event.currentTarget.getBoundingClientRect()
                        const nearBottom =
                          window.innerHeight - rect.bottom < 220 ||
                          (sessions.length >= 4 && idx >= sessions.length - 2)
                        setMenuOpenUpward(nearBottom)
                        setMenuSessionId(isMenuOpen ? null : item.id)
                      }}
                      className="ml-auto shrink-0"
                      aria-label={`Session options for ${item.title}`}
                      aria-expanded={isMenuOpen}
                      title="Session options"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* B4 & B10: Floating z-50 Popover Menu opening upward when near bottom */}
                  {isMenuOpen && (
                    <Surface
                      variant="popover"
                      padding={2}
                      className={`absolute right-0 z-50 w-48 space-y-2 border border-border shadow-xl ${
                        menuOpenUpward ? 'bottom-full mb-2' : 'top-full mt-1'
                      }`}
                    >
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={sending}
                        className="w-full justify-start gap-2 text-xs /* design-xs-ok */"
                        onClick={() => analyzeOrSummarizeSessionInNewChat(item, 'analyze')}
                      >
                        <Sparkles className="h-4 w-4" /> Analyze
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={sending}
                        className="w-full justify-start gap-2 text-xs /* design-xs-ok */"
                        onClick={() => analyzeOrSummarizeSessionInNewChat(item, 'summary')}
                      >
                        <FileText className="h-4 w-4" /> Summary
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start gap-2 text-xs /* design-xs-ok */"
                        onClick={() => exportSessionAsMarkdown(item)}
                      >
                        <Download className="h-4 w-4" /> Export (.md)
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start gap-2 text-xs /* design-xs-ok */"
                        onClick={() => {
                          setRenameModalSession(item)
                          setRenameTitleInput(item.title)
                          setMenuSessionId(null)
                        }}
                      >
                        <Pencil className="h-4 w-4" /> Rename
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={isSessionWorking}
                        className="w-full justify-start gap-2 text-xs text-destructive /* design-xs-ok */"
                        onClick={() => {
                          setDeleteModalSession(item)
                          setMenuSessionId(null)
                        }}
                      >
                        <Trash2 className="h-4 w-4" /> Delete
                      </Button>
                    </Surface>
                  )}
                </div>
              )
            })}
          </div>

          {/* B9: Compact Theme Switcher with Icons & Account Footer */}
          <div className="space-y-2 border-t border-border/70 pt-2">
            <div className="grid grid-cols-3 gap-2" role="group" aria-label="Color theme">
              {(
                [
                  { mode: 'light', label: 'Light', Icon: Sun },
                  { mode: 'dark', label: 'Dark', Icon: Moon },
                  { mode: 'system', label: 'Auto', Icon: Monitor },
                ] as const
              ).map(({ mode: nextMode, label, Icon }) => (
                <Button
                  key={nextMode}
                  type="button"
                  size="sm"
                  variant={themeMode === nextMode ? 'secondary' : 'ghost'}
                  onClick={() => setThemeMode(nextMode)}
                  aria-pressed={themeMode === nextMode}
                  aria-label={`${label} theme`}
                  className="!h-7 !min-h-7 !max-h-7 gap-2 px-2 text-xs /* design-xs-ok */"
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  <span>{label}</span>
                </Button>
              ))}
            </div>
            <div className="flex items-center pl-2">
              <span className="truncate text-xs text-muted-foreground /* design-xs-ok */">{user?.email || 'Owner'}</span>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => void signOut()}
                className="ml-auto shrink-0"
                aria-label="Sign out"
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </aside>
      )}

      {/* Main Conversational Column */}
      <main className="flex min-h-0 min-w-0 flex-1 flex-col">
        {/* Top Header */}
        <header className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-border/70 px-4">
          <div className="flex min-w-0 items-center gap-2">
            {!sidebarOpen && (
              <Button type="button" variant="ghost" size="sm" onClick={() => setSidebarOpen(true)} aria-label="Show sidebar">
                <PanelLeft className="h-4 w-4" />
              </Button>
            )}
            <ModelSelectorDropdown
              value={selectedModel}
              onChange={(m) => void handleModelChange(m)}
              disabled={sending}
            />
            {!online && <Badge color="red">Offline</Badge>}
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant={autoContinue ? 'primary' : 'secondary'}
              onClick={() => {
                const next = !autoContinue
                setAutoContinue(next)
                notifyOnce(
                  next
                    ? 'Auto Queue ON: Lamat will continuously execute queued tasks and skip any task that needs your input.'
                    : 'Auto Queue OFF: Manual step execution.',
                  'info'
                )
              }}
              disabled={!online || activity?.canExecuteAutonomously === false}
              title="Autonomous Queue Mode: Continuously runs unblocked tasks in sequence, automatically skipping tasks that need your input."
            >
              <Activity className="h-4 w-4" />
              {autoContinue ? 'Auto: ON' : 'Auto: OFF'}
            </Button>
            <Button
              type="button"
              size="sm"
              variant={freeOnly ? 'primary' : 'secondary'}
              disabled={sending}
              onClick={() => void handleToggleFreeOnly()}
              title="Free Models Only: Uses quota-limited free models on OpenRouter & Hugging Face."
            >
              {freeOnly ? 'Free: ON' : 'Free: OFF'}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled
              aria-label="Audio output disabled"
              title="Audio & voice features are currently disabled"
            >
              <VolumeX className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="sm"
              variant={drawerOpen ? 'primary' : 'secondary'}
              onClick={() => setDrawerOpen((v) => !v)}
              aria-label="Toggle operator panel"
            >
              <PanelRight className="h-4 w-4" />
              Operator {inboxCount > 0 ? `(${inboxCount})` : ''}
            </Button>
          </div>
        </header>

        {/* Centered Conversation Stream */}
        <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-4 py-8" aria-live="polite">
          <div className="mx-auto max-w-3xl space-y-4">
            {/* Inline Actionable Questions & Approvals (Always interactive even when sending per Section 11) */}
            {pendingQuestions.map((q) => (
              <Card key={q.id} className="space-y-2 border-warning/40 bg-warning/5 p-4">
                <div className="flex items-center justify-between gap-2">
                  <Badge color="yellow">Question from {persona?.name || 'Lamat'}</Badge>
                </div>
                <div className="text-sm font-semibold text-foreground">{q.question}</div>
                <div className="text-sm text-muted-foreground">Why this matters: {q.context_why}</div>
                {Array.isArray(q.options) && q.options.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {q.options.map((opt) => (
                      <Button key={opt} type="button" size="sm" variant="secondary" onClick={() => void handleAnswerQuestion(q.id, opt)}>
                        {opt}
                      </Button>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <Input
                    value={questionAnswers[q.id] || ''}
                    onChange={(e) => setQuestionAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                    placeholder="Type your answer…"
                    aria-label="Answer question"
                  />
                  <Button type="button" onClick={() => void handleAnswerQuestion(q.id)} disabled={!(questionAnswers[q.id] || '').trim()}>
                    Reply
                  </Button>
                </div>
              </Card>
            ))}

            {pendingApprovals.map((act) => (
              <Card key={act.id} className="space-y-2 border-warning/40 bg-warning/5 p-4">
                <div className="flex items-center justify-between gap-2">
                  <Badge color="yellow">Approval Required · {act.category}</Badge>
                  <span className="text-sm text-muted-foreground">Est. ${act.estimated_cost_usd}</span>
                </div>
                <div className="text-sm font-semibold">{act.summary}</div>
                {act.target && <div className="text-sm text-muted-foreground">Target: {act.target}</div>}
                <div className="flex gap-2">
                  <Button type="button" size="sm" onClick={() => void handleDecideAction(act, 'approved')}>
                    Approve
                  </Button>
                  <Button type="button" size="sm" variant="secondary" onClick={() => void handleDecideAction(act, 'rejected')}>
                    Reject
                  </Button>
                </div>
              </Card>
            ))}

            {!messages.length ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Surface variant="muted" padding={4} className="mb-4 flex h-12 w-12 items-center justify-center">
                  <LamatLogo className="h-4 w-4" />
                </Surface>
                <h1 className="text-lg font-semibold">
                  How can {persona?.name || 'Lamat'} move your goals forward today, {persona?.user_callsign || 'Dragoljub'}?
                </h1>
                <p className="mt-1 max-w-xl text-sm text-muted-foreground">
                  Multi-Model Orchestrator: talk, search or edit Google Drive, Docs & Sheets, preview documents in your Library, manage finances & tasks, write code, or generate images.
                </p>
                <div className="mt-8 grid w-full gap-2 sm:grid-cols-2">
                  {starterPrompts.map((prompt) => (
                    <Button
                      key={prompt}
                      variant="ghost"
                      type="button"
                      onClick={() => void sendMessage(prompt)}
                      disabled={sending}
                      className="h-auto w-full justify-start whitespace-normal border-border/70 p-4 text-left"
                    >
                      {prompt}
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((message, index) => {
                const msgImages =
                  message.attachments?.filter((a) => a.kind === 'image' && a.dataUrl) ||
                  message.thumbnails?.map((t) => ({ name: t.name, dataUrl: t.dataUrl, kind: 'image' as const, mimeType: 'image/png', sizeBytes: 0 })) ||
                  []
                const msgDocs = message.attachments?.filter((a) => a.kind !== 'image') || []

                return (
                  <div key={message.id || index} className={`flex gap-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {message.role === 'assistant' ? (
                      <div className="flex min-w-0 w-full flex-col items-start">
                        <div className="w-full break-words text-sm text-foreground">
                          <AnimatedAssistantMessage
                            content={message.content}
                            animate={Boolean(message.id && message.id === latestAnimatedId)}
                          />
                        </div>
                        <div className="mt-1 flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            type="button"
                            onClick={() => void copyMessage(message.content, index)}
                            aria-label="Copy response"
                            title={copiedMessage === index ? 'Copied' : 'Copy response'}
                          >
                            {copiedMessage === index ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            type="button"
                            disabled
                            aria-label="Speak response (disabled)"
                            title="Voice & audio features are currently disabled"
                          >
                            <VolumeX className="h-4 w-4" />
                          </Button>
                          {message.model && <span className="text-xs text-muted-foreground /* design-xs-ok */">{message.model}</span>}
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex min-w-0 max-w-[85%] flex-col items-end">
                          {/* B5: Image attachments show thumbnail; Documents/Sheets show file icon + name */}
                          {(msgImages.length > 0 || msgDocs.length > 0) && (
                            <div className="mb-2 flex flex-wrap justify-end gap-2">
                              {msgImages.map((img, tIdx) => (
                                <img
                                  key={`img-${tIdx}`}
                                  src={img.dataUrl}
                                  alt={img.name}
                                  title={img.name}
                                  className="h-16 w-16 rounded-xl border border-border object-cover"
                                />
                              ))}
                              {msgDocs.map((doc, dIdx) => (
                                <Surface
                                  key={`doc-${dIdx}`}
                                  variant="muted"
                                  padding={2}
                                  className="flex items-center gap-2 border border-border"
                                >
                                  {doc.kind === 'spreadsheet' ? (
                                    <FileSpreadsheet className="h-4 w-4 shrink-0 text-muted-foreground" />
                                  ) : (
                                    <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                                  )}
                                  <span className="max-w-48 truncate text-xs font-medium /* design-xs-ok */">
                                    {doc.name}
                                  </span>
                                </Surface>
                              ))}
                            </div>
                          )}
                          {message.content && (
                            <div className="w-fit max-w-full whitespace-pre-wrap break-words rounded-xl bg-primary px-4 py-4 text-sm text-primary-foreground">
                              {message.content}
                            </div>
                          )}
                          <div className="mt-1 flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              type="button"
                              onClick={() => void copyMessage(message.content, index)}
                              aria-label="Copy message"
                              title={copiedMessage === index ? 'Copied' : 'Copy message'}
                            >
                              {copiedMessage === index ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                            </Button>
                          </div>
                        </div>
                        <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl border border-border/70">
                          <User className="h-4 w-4" />
                        </span>
                      </>
                    )}
                  </div>
                )
              })
            )}

            {/* Section 11: Centralized Working State Banner with Explicit Cancellation */}
            {sending && (
              <Surface variant="muted" padding={2} className="flex items-center justify-between gap-2 border border-border">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Sparkles className="h-4 w-4 animate-pulse" />
                  <span>Work in progress — {persona?.name || 'Lamat'} is orchestrating and thinking…</span>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={cancelActiveRequest}
                  aria-label="Cancel active request"
                >
                  <Square className="h-3.5 w-3.5" /> Stop
                </Button>
              </Surface>
            )}

            {error && (
              <div role="alert" className="flex items-start gap-2 rounded-xl border border-destructive/30 p-4 text-sm text-destructive">
                <CircleAlert className="mt-1 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {pendingApproval && pendingApproval.sessionId === activeSessionId && (
              <Card className="space-y-4 border-warning/40 bg-warning/5 p-4 text-sm">
                <div className="font-semibold">Approval required — no change has been made yet</div>
                <div>
                  <span className="text-muted-foreground">Operation: </span>
                  {pendingApproval.operation === 'create' ? 'Create file' : 'Replace file'}
                </div>
                <div className="break-all">
                  <span className="text-muted-foreground">Target: </span>
                  {pendingApproval.repository}/{pendingApproval.path}
                </div>
                <div>
                  <span className="text-muted-foreground">Commit summary: </span>
                  {pendingApproval.summary}
                </div>
                <details open className="rounded-xl border border-border/70">
                  <summary className="cursor-pointer px-4 py-2 font-medium">Review complete proposed file content</summary>
                  <pre className="max-h-72 overflow-auto whitespace-pre-wrap break-words border-t border-border/70 p-4 text-sm">
                    {pendingApproval.preview || 'No preview was provided.'}
                  </pre>
                </details>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" onClick={() => void approvePendingAction()} disabled={sending}>
                    Approve and commit
                  </Button>
                  <Button type="button" variant="secondary" onClick={() => setPendingApproval(null)} disabled={sending}>
                    Cancel
                  </Button>
                </div>
              </Card>
            )}
          </div>
        </div>

        {/* Bottom Composer (B5: image thumbnails for images, file icon + name for documents/spreadsheets) */}
        <div className="shrink-0 px-4 pb-4">
          <div className="mx-auto max-w-3xl">
            <Card className="p-2">
              {attachments.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 px-2 pb-2">
                  {attachments.map((att, idx) => (
                    <Surface key={`${att.name}-${idx}`} variant="muted" padding={2} className="flex items-center gap-2">
                      {att.kind === 'image' && att.data ? (
                        <img src={att.data} alt={att.name} className="h-10 w-10 rounded-xl object-cover" />
                      ) : att.kind === 'spreadsheet' ? (
                        <FileSpreadsheet className="h-4 w-4 shrink-0 text-muted-foreground" />
                      ) : (
                        <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                      )}
                      <span className="max-w-40 truncate text-sm">{att.name}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={sending}
                        onClick={() => setAttachments((prev) => prev.filter((_, i) => i !== idx))}
                        aria-label={`Remove ${att.name}`}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </Surface>
                  ))}
                </div>
              )}

              <form
                onSubmit={(event) => {
                  event.preventDefault()
                  void sendMessage()
                }}
              >
                <label className="block">
                  <span className="sr-only">Message {persona?.name || 'Lamat'}</span>
                  <Textarea
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && !event.shiftKey) {
                        event.preventDefault()
                        void sendMessage()
                      }
                    }}
                    placeholder={`Message ${persona?.name || 'Lamat'}… (attach images/sheets, search or create Google Docs/Sheets, or ask to generate images)`}
                    maxLength={4000}
                    disabled={sending}
                    rows={2}
                    className="!h-auto !max-h-40 !min-h-[3rem] w-full resize-none border-0 bg-transparent !px-2 !py-2"
                  />
                </label>
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2 px-2">
                  <div className="flex items-center gap-2">
                    <FileButton
                      variant="ghost"
                      size="sm"
                      accept="image/png,image/jpeg,image/webp,image/gif,application/pdf,.csv,.tsv,.txt,.md,.json,.js,.ts,.tsx,.py,.sql"
                      multiple
                      disabled={sending}
                      onChange={(e) => void handleFileUpload(e)}
                    >
                      <ImageIcon className="h-4 w-4" /> Attach File / Image
                    </FileButton>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      disabled
                      aria-label="Voice input disabled"
                      title="Voice & audio features are currently disabled"
                    >
                      <MicOff className="h-4 w-4" /> Voice
                    </Button>
                  </div>
                  {sending ? (
                    <Button type="button" size="sm" variant="secondary" onClick={cancelActiveRequest}>
                      <Square className="h-3.5 w-3.5" /> Stop
                    </Button>
                  ) : (
                    <Button type="submit" size="sm" disabled={(!draft.trim() && !attachments.length) || sending}>
                      <Send className="h-4 w-4" /> Send
                    </Button>
                  )}
                </div>
              </form>
            </Card>
          </div>
        </div>
      </main>

      {/* Slide-over Right Operator Panel (Section 9: Logs removed; Integrations, Memory & Library moved to left nav modals) */}
      {drawerOpen && (
        <aside
          className="flex h-full w-96 shrink-0 flex-col border-l border-border/70 bg-background p-4"
          aria-label="Operator inspection panel"
        >
          <div className="flex items-center justify-between gap-2 pb-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">Operator Control & State</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => void refreshOperationalState()}
                disabled={loadingState}
                aria-label="Refresh operational state"
              >
                <RefreshCw className={`h-4 w-4 ${loadingState ? 'animate-spin' : ''}`} />
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => setDrawerOpen(false)} aria-label="Close operator panel">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2 border-b border-border/70 pb-2">
            <Button type="button" size="sm" variant={railTab === 'tasks' ? 'secondary' : 'ghost'} onClick={() => setRailTab('tasks')} className="px-2">
              Tasks
            </Button>
            <Button type="button" size="sm" variant={railTab === 'context' ? 'secondary' : 'ghost'} onClick={() => setRailTab('context')} className="px-2">
              Inbox {inboxCount > 0 ? `(${inboxCount})` : ''}
            </Button>
            <Button type="button" size="sm" variant={railTab === 'finance' ? 'secondary' : 'ghost'} onClick={() => setRailTab('finance')} className="px-2">
              Finance
            </Button>
            <Button type="button" size="sm" variant={railTab === 'budget' ? 'secondary' : 'ghost'} onClick={() => setRailTab('budget')} className="px-2">
              Budget
            </Button>
          </div>

          <div className="mt-4 min-h-0 flex-1 space-y-4 overflow-y-auto">
            {/* TAB 1: TASKS & GOALS */}
            {railTab === 'tasks' && (
              <>
                <Surface variant="muted" padding={2} className="space-y-2">
                  <div className="text-sm font-semibold">Autonomous Queue & Free Mode</div>
                  <p className="text-sm text-muted-foreground">
                    <strong>Auto: ON</strong> continuously executes queued tasks and skips any task that needs your input. Turn <strong>Free: ON</strong> for free-tier models.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="primary"
                      onClick={() => void runOperatingCycle(undefined, 1)}
                      disabled={cycling || !online || activity?.canExecuteAutonomously === false}
                    >
                      <Play className="h-4 w-4" /> {cycling ? 'Executing…' : 'Run Next Task'}
                    </Button>
                    <Button type="button" size="sm" variant="secondary" onClick={() => void handleToggleAutonomousEngine()}>
                      {budget?.config?.autonomous_enabled === false ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                      {budget?.config?.autonomous_enabled === false ? 'Resume' : 'Pause'}
                    </Button>
                  </div>
                </Surface>

                <div className="space-y-2">
                  <h3 className="text-sm font-semibold">Task Queue ({tasks.length})</h3>
                  {tasks.slice(0, 12).map((t) => {
                    const stepsCount = Array.isArray(t.plan_steps) ? t.plan_steps.length : 0
                    return (
                      <Surface key={t.id} variant="muted" padding={2} className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-sm font-medium">{t.title}</span>
                          <Badge
                            color={
                              t.status === 'completed'
                                ? 'green'
                                : t.status === 'waiting_input' || t.status === 'waiting_approval'
                                  ? 'yellow'
                                  : t.status === 'failed' || t.status === 'blocked'
                                    ? 'red'
                                    : 'blue'
                            }
                          >
                            {t.status}
                          </Badge>
                        </div>
                        {t.result?.summary && (
                          <p className="text-sm text-muted-foreground">{t.result.summary}</p>
                        )}
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <span>
                            Score: {t.priority_score} · Step {Math.min(t.current_step_index, stepsCount)}/{stepsCount}
                          </span>
                          {t.user_rating && <span className="text-warning">{'★'.repeat(t.user_rating)}</span>}
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            onClick={() => {
                              setSelectedTaskModal(t)
                              setTaskRatingInput(t.user_rating || 5)
                              setTaskFeedbackInput(t.user_feedback || '')
                            }}
                          >
                            <Eye className="h-4 w-4" /> Inspect
                          </Button>
                          {t.status !== 'completed' && t.status !== 'cancelled' && (
                            <>
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={() => void runOperatingCycle(t.id, 1)}
                                disabled={cycling}
                              >
                                <Play className="h-4 w-4" /> Run
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={() => void handleTaskStatus(t.id, t.status === 'paused' ? 'queued' : 'paused')}
                              >
                                {t.status === 'paused' ? 'Resume' : 'Pause'}
                              </Button>
                            </>
                          )}
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => void handleDeleteTask(t.id)}
                            className="ml-auto text-muted-foreground hover:text-destructive"
                            aria-label="Delete task"
                            title="Permanently delete task"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </Surface>
                    )
                  })}
                </div>

                <form className="space-y-2 border-t border-border/70 pt-4" onSubmit={(e) => void handleCreateTask(e)}>
                  <div className="text-sm font-semibold">Add Task</div>
                  <Input value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)} placeholder="Task title…" />
                  <Input value={newTaskRationale} onChange={(e) => setNewTaskRationale(e.target.value)} placeholder="Why it matters…" />
                  <Button type="submit" variant="secondary" disabled={!newTaskTitle.trim()} className="w-full">
                    <Plus className="h-4 w-4" /> Queue Task
                  </Button>
                </form>

                <div className="space-y-2 border-t border-border/70 pt-4">
                  <h3 className="text-sm font-semibold">Active Goals ({goals.filter((g) => g.status === 'active').length})</h3>
                  {goals
                    .filter((g) => g.status === 'active')
                    .slice(0, 8)
                    .map((g) => (
                      <Surface key={g.id} variant="muted" padding={2} className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-sm font-medium">{g.title}</span>
                          <Badge color="slate">P{g.priority}</Badge>
                        </div>
                        {g.description && <p className="text-sm text-muted-foreground">{g.description}</p>}
                      </Surface>
                    ))}
                </div>

                <form className="space-y-2 border-t border-border/70 pt-4" onSubmit={(e) => void handleCreateGoal(e)}>
                  <div className="text-sm font-semibold">Add Goal</div>
                  <Input value={newGoalTitle} onChange={(e) => setNewGoalTitle(e.target.value)} placeholder="Goal objective…" />
                  <Input value={newGoalCriteria} onChange={(e) => setNewGoalCriteria(e.target.value)} placeholder="Success criteria…" />
                  <Button type="submit" variant="secondary" disabled={!newGoalTitle.trim()} className="w-full">
                    <Plus className="h-4 w-4" /> Save Goal
                  </Button>
                </form>
              </>
            )}

            {/* TAB 2: INBOX (Questions & Approvals) */}
            {railTab === 'context' && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold">Questions & Approvals ({inboxCount})</h3>
                {inboxCount === 0 ? (
                  <p className="text-sm text-muted-foreground">No pending questions or approvals.</p>
                ) : (
                  <>
                    {pendingQuestions.map((q) => (
                      <Surface key={q.id} variant="muted" padding={2} className="space-y-2">
                        <div className="text-sm font-semibold">{q.question}</div>
                        <div className="text-sm text-muted-foreground">{q.context_why}</div>
                        <div className="flex gap-2">
                          <Input
                            value={questionAnswers[q.id] || ''}
                            onChange={(e) => setQuestionAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                            placeholder="Answer…"
                          />
                          <Button type="button" onClick={() => void handleAnswerQuestion(q.id)} disabled={!(questionAnswers[q.id] || '').trim()}>
                            Reply
                          </Button>
                        </div>
                      </Surface>
                    ))}
                    {pendingApprovals.map((act) => (
                      <Surface key={act.id} variant="muted" padding={2} className="space-y-2">
                        <Badge color="yellow">{act.category}</Badge>
                        <div className="text-sm font-medium">{act.summary}</div>
                        <div className="flex gap-2">
                          <Button type="button" size="sm" onClick={() => void handleDecideAction(act, 'approved')}>
                            Approve
                          </Button>
                          <Button type="button" size="sm" variant="secondary" onClick={() => void handleDecideAction(act, 'rejected')}>
                            Reject
                          </Button>
                        </div>
                      </Surface>
                    ))}
                  </>
                )}
              </div>
            )}

            {/* TAB 3: FINANCE */}
            {railTab === 'finance' && <Financier embedded />}

            {/* TAB 4: BUDGET & RESOURCES */}
            {railTab === 'budget' && (
              <>
                <Surface variant="muted" padding={2} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">Budget & Google Cloud Telemetry</span>
                    <Badge color={budget?.can_execute || freeOnly ? 'green' : 'red'}>
                      {freeOnly ? 'Free Mode' : budget?.can_execute ? 'Active' : 'Halted'}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Today Spend: ${budget?.today_spend_usd ?? 0} / ${budget?.config?.daily_limit_usd ?? 7} (Measured: $
                    {budget?.today_measured_usd ?? 0}, Est: ${budget?.today_estimated_usd ?? 0})
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Remaining Trial Credit: ${budget?.remaining_total_credit_usd ?? 300} · Today Tokens:{' '}
                    {budget?.today_tokens ?? 0}
                  </div>
                  {gcpStatus?.configured && (
                    <div className="text-sm text-muted-foreground">
                      GCP Project: {gcpStatus.projectNumber} · Vertex API: {gcpStatus.vertexApiState || 'ENABLED'} (15m cached)
                    </div>
                  )}
                </Surface>

                <form className="space-y-2 border-t border-border/70 pt-4" onSubmit={(e) => void handleSaveBudgetLimits(e)}>
                  <div className="text-sm font-semibold">Configure Daily & Task Spend Limits (USD)</div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="mb-2 block text-sm text-muted-foreground">Daily Limit ($)</label>
                      <Input
                        type="number"
                        step="0.50"
                        value={dailyLimitInput}
                        onChange={(e) => setDailyLimitInput(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm text-muted-foreground">Per-Task Limit ($)</label>
                      <Input
                        type="number"
                        step="0.25"
                        value={taskLimitInput}
                        onChange={(e) => setTaskLimitInput(e.target.value)}
                      />
                    </div>
                  </div>
                  <Button type="submit" variant="secondary" disabled={savingBudget} className="w-full">
                    {savingBudget ? 'Saving…' : 'Update Budget Limits'}
                  </Button>
                </form>

                <div className="space-y-2 border-t border-border/70 pt-4">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold">Resources</h3>
                    <Button type="button" size="sm" variant="secondary" onClick={() => void handleExportContinuity()}>
                      <Download className="h-4 w-4" /> Export Snapshot
                    </Button>
                  </div>
                  {resources.map((r) => (
                    <Surface key={r.id} variant="muted" padding={2} className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium">{r.name}</span>
                        <Badge color={r.provenance === 'verified' ? 'green' : 'yellow'}>{r.provenance}</Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {r.amount != null ? `${r.amount} ${r.unit || ''}` : r.kind}
                        {r.expires_on ? ` · Expires ${r.expires_on}` : ''}
                      </div>
                    </Surface>
                  ))}
                </div>
              </>
            )}
          </div>
        </aside>
      )}

      {/* Persona & Identity Modal (B8: without logo) */}
      <PersonaConfigModal
        open={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        personaNameInput={personaNameInput}
        setPersonaNameInput={setPersonaNameInput}
        personaGenderInput={personaGenderInput}
        setPersonaGenderInput={setPersonaGenderInput}
        userCallsignInput={userCallsignInput}
        setUserCallsignInput={setUserCallsignInput}
        savingPersona={savingPersona}
        onSubmit={(e) => void handleSavePersona(e)}
      />

      {/* Left-Nav Modal 1: Integrations */}
      <IntegrationsModal
        open={showIntegrationsModal}
        onClose={() => setShowIntegrationsModal(false)}
        integrations={integrationsDetail}
        verifying={verifyingIntegrations}
        onVerify={() => void refreshIntegrations()}
        onConnectGoogleWorkspace={() => void connectGoogleWorkspace()}
      />

      {/* Left-Nav Modal 2: Memory & Personalization */}
      <MemoryPersonalizationModal
        open={showMemoryModal}
        onClose={() => setShowMemoryModal(false)}
        memories={memories}
        personaNameInput={personaNameInput}
        setPersonaNameInput={setPersonaNameInput}
        personaGenderInput={personaGenderInput}
        setPersonaGenderInput={setPersonaGenderInput}
        userCallsignInput={userCallsignInput}
        setUserCallsignInput={setUserCallsignInput}
        savingPersona={savingPersona}
        onSubmitPersona={(e) => void handleSavePersona(e)}
        newMemoryKind={newMemoryKind}
        setNewMemoryKind={setNewMemoryKind}
        newMemoryContent={newMemoryContent}
        setNewMemoryContent={setNewMemoryContent}
        onCreateMemory={(e) => void handleRecordMemory(e)}
        onArchiveMemory={(id) => void handleDeleteMemory(id)}
      />

      {/* Left-Nav Modal 3: Library */}
      <LibraryModal
        open={showLibraryModal}
        onClose={() => setShowLibraryModal(false)}
        items={libraryItems}
        uploading={uploadingLibrary}
        onUploadFiles={(files) => void processSelectedFiles(files, true)}
        onDeleteItem={(id) => void handleDeleteLibraryItem(id)}
      />

      {/* Centered Modal: Rename Session */}
      <Modal
        open={Boolean(renameModalSession)}
        onClose={() => setRenameModalSession(null)}
        title="Rename Session"
      >
        <form onSubmit={confirmRenameSession} className="space-y-4">
          <Input
            value={renameTitleInput}
            onChange={(e) => setRenameTitleInput(e.target.value)}
            placeholder="Session title…"
            aria-label="Session title"
            required
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setRenameModalSession(null)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={!renameTitleInput.trim()}>
              Save Name
            </Button>
          </div>
        </form>
      </Modal>

      {/* Centered Modal: Delete Session Confirmation */}
      <Modal
        open={Boolean(deleteModalSession)}
        onClose={() => setDeleteModalSession(null)}
        title="Delete Session"
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete <strong>{deleteModalSession?.title}</strong>? This removes the local session thread.
          </p>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setDeleteModalSession(null)}>
              Cancel
            </Button>
            <Button type="button" variant="primary" onClick={confirmDeleteSession}>
              Delete Session
            </Button>
          </div>
        </div>
      </Modal>

      {/* Centered Modal: Interactive Task Deliverable Viewer, Execution Steps & Yellow Star Rating */}
      <TaskInspectModal
        task={selectedTaskModal}
        onClose={() => setSelectedTaskModal(null)}
        personaName={persona?.name || 'Lamat'}
        taskRatingInput={taskRatingInput}
        setTaskRatingInput={setTaskRatingInput}
        taskFeedbackInput={taskFeedbackInput}
        setTaskFeedbackInput={setTaskFeedbackInput}
        savingRating={savingRating}
        cycling={cycling}
        onRunTask={(id) => {
          setSelectedTaskModal(null)
          void runOperatingCycle(id, 2)
        }}
        onRateTask={(requestRevision) => void handleRateTask(requestRevision)}
      />
    </div>
  )
}
