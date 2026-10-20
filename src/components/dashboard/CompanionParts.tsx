import React from 'react'
import { Check, ChevronDown, Play, Star } from 'lucide-react'
import { Badge, Button, Input, LamatLogo, Modal, Select, Surface, Textarea } from '@/components/ui'

export type LamatTask = {
  id: string
  goal_id?: string | null
  title: string
  description?: string | null
  rationale?: string | null
  kind: string
  status: string
  priority: number
  priority_score: number
  expected_outcome?: string | null
  verification_method?: string | null
  plan_steps?: Array<{ index: number; title: string; tool?: string; status?: string; output_summary?: string }>
  current_step_index: number
  checkpoint_state?: Record<string, unknown>
  attempt_count: number
  max_attempts: number
  estimated_cost_usd?: number
  actual_cost_usd?: number
  deliverable?: string | null
  user_rating?: number | null
  user_feedback?: string | null
  rated_at?: string | null
  result?: { summary?: string } | null
  verification_evidence?: { verified?: boolean; confidence?: number; evidence_summary?: string } | null
  last_error?: string | null
  blocker_reason?: string | null
}

export type ModelOptionItem = {
  id: string
  label: string
  group: string
  badge: string
}

export const MODEL_CATALOG: ModelOptionItem[] = [
  { id: 'auto', label: 'Auto Orchestrator', group: 'Smart Orchestrator', badge: 'Multi-Model' },
  { id: 'gemini-3.8-flash', label: 'Gemini 3.8 Flash', group: 'Google Cloud Vertex AI', badge: 'Fast' },
  { id: 'gemini-4-argon', label: 'Gemini 4 Argon', group: 'Google Cloud Vertex AI', badge: 'Reasoning & Code' },
  { id: 'vertex-claude:claude-sonnet-4-5@20250929', label: 'Claude 4.5 Sonnet', group: 'Vertex AI Model Garden (GCP Credits)', badge: 'Anthropic' },
  { id: 'vertex-claude:claude-opus-4-1@20250805', label: 'Claude 4.1 Opus', group: 'Vertex AI Model Garden (GCP Credits)', badge: 'Anthropic' },
  { id: 'vertex-claude:claude-3-5-sonnet-v2@20241022', label: 'Claude 3.5 Sonnet v2', group: 'Vertex AI Model Garden (GCP Credits)', badge: 'Anthropic' },
  { id: 'vertex-meta:meta/llama-3.3-70b-instruct-maas', label: 'Llama 3.3 70B Instruct', group: 'Vertex AI Model Garden (GCP Credits)', badge: 'Meta' },
  { id: 'openrouter:minimax/minimax-m3.1-flash:free', label: 'MiniMax M3.1 Flash (1M)', group: 'OpenRouter Free ($0 Cost)', badge: 'Free' },
  { id: 'openrouter:nvidia/nemotron-3-ultra-550b-a55b:free', label: 'Nemotron 3 Ultra 550B (1M)', group: 'OpenRouter Free ($0 Cost)', badge: 'Free' },
  { id: 'openrouter:poolside/laguna-s-2.1:free', label: 'Poolside Laguna S 2.1 (Code)', group: 'OpenRouter Free ($0 Cost)', badge: 'Free' },
  { id: 'openrouter:cohere/north-mini-code:free', label: 'Cohere North Mini Code', group: 'OpenRouter Free ($0 Cost)', badge: 'Free' },
  { id: 'openrouter:nvidia/nemotron-3.5-super-vl:free', label: 'Nemotron 3.5 Super VL (Vision)', group: 'OpenRouter Free ($0 Cost)', badge: 'Free' },
  { id: 'openrouter:nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free', label: 'Nemotron 3 Nano Reasoning', group: 'OpenRouter Free ($0 Cost)', badge: 'Free' },
  { id: 'openrouter:dots-studio/dots-3-note-preview:free', label: 'Dots 3 Note (512k)', group: 'OpenRouter Free ($0 Cost)', badge: 'Free' },
  { id: 'openrouter:google/gemma-4-31b-it:free', label: 'Google Gemma 4 31B', group: 'OpenRouter Free ($0 Cost)', badge: 'Free' },
  { id: 'hf:Qwen/Qwen2.5-72B-Instruct', label: 'Qwen 2.5 72B Instruct', group: 'HuggingFace Inference', badge: 'HF' },
  { id: 'hf:meta-llama/Llama-3.3-70B-Instruct', label: 'Llama 3.3 70B Instruct', group: 'HuggingFace Inference', badge: 'HF' },
  { id: 'hf:mistralai/Mistral-Small-24B-Instruct-2501', label: 'Mistral Small 24B', group: 'HuggingFace Inference', badge: 'HF' },
]

export function ModelSelectorDropdown({
  value,
  onChange,
}: {
  value: string
  onChange: (nextModel: string) => void
}) {
  const [open, setOpen] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement | null>(null)
  const activeItem = MODEL_CATALOG.find((m) => m.id === value) || MODEL_CATALOG[0]

  React.useEffect(() => {
    if (!open) return
    const handleOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    window.addEventListener('mousedown', handleOutside)
    return () => window.removeEventListener('mousedown', handleOutside)
  }, [open])

  const groups = Array.from(new Set(MODEL_CATALOG.map((m) => m.group)))

  return (
    <div ref={containerRef} className="relative">
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() => setOpen((v) => !v)}
        className="gap-2"
        aria-label="Select AI model"
      >
        <span className="truncate font-medium">{activeItem.label}</span>
        <Badge color={activeItem.badge === 'Free' ? 'green' : 'blue'}>{activeItem.badge}</Badge>
        <ChevronDown className="h-4 w-4 shrink-0" />
      </Button>

      {open && (
        <Surface
          variant="popover"
          padding={2}
          className="absolute left-0 top-full z-50 mt-1 max-h-96 w-80 overflow-y-auto border border-border shadow-xl"
        >
          {groups.map((grp) => (
            <div key={grp} className="mb-2">
              <div className="px-2 py-2 text-sm font-semibold text-muted-foreground">{grp}</div>
              <div className="space-y-2">
                {MODEL_CATALOG.filter((m) => m.group === grp).map((item) => {
                  const selected = item.id === value
                  return (
                    <Button
                      key={item.id}
                      type="button"
                      variant={selected ? 'secondary' : 'ghost'}
                      size="sm"
                      onClick={() => {
                        onChange(item.id)
                        setOpen(false)
                      }}
                      className="w-full justify-between px-2"
                    >
                      <span className="truncate text-left">{item.label}</span>
                      <div className="flex items-center gap-2">
                        <Badge color={item.badge === 'Free' ? 'green' : 'slate'}>{item.badge}</Badge>
                        {selected && <Check className="h-4 w-4 shrink-0" />}
                      </div>
                    </Button>
                  )
                })}
              </div>
            </div>
          ))}
        </Surface>
      )}
    </div>
  )
}

export function FormattedMessage({ content }: { content: string }) {
  const lines = content.replace(/\r\n/g, '\n').split('\n')
  const blocks: React.ReactNode[] = []
  let paragraph: string[] = []
  let list: { ordered: boolean; items: string[] } | null = null
  let code: string[] | null = null
  const inline = (value: string) =>
    value.split(/(\*\*[^*]+\*\*|\*[^*]+\*|~~[^~]+~~|\x60[^\x60]+\x60)/g).map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) return <strong key={index}>{part.slice(2, -2)}</strong>
      if (part.startsWith('*') && part.endsWith('*')) return <em key={index}>{part.slice(1, -1)}</em>
      if (part.startsWith('~~') && part.endsWith('~~')) return <del key={index}>{part.slice(2, -2)}</del>
      if (part.charCodeAt(0) === 96 && part.charCodeAt(part.length - 1) === 96) {
        return (
          <code key={index} className="rounded-xl bg-muted px-2 py-2 font-mono text-sm">
            {part.slice(1, -1)}
          </code>
        )
      }
      return part
    })
  const flushParagraph = () => {
    if (paragraph.length) {
      blocks.push(
        <p key={blocks.length} className="my-2">
          {inline(paragraph.join(' '))}
        </p>
      )
      paragraph = []
    }
  }
  const flushList = () => {
    if (list) {
      const Tag = list.ordered ? 'ol' : 'ul'
      blocks.push(
        <Tag key={blocks.length} className={(list.ordered ? 'list-decimal' : 'list-disc') + ' my-2 space-y-2 pl-8'}>
          {list.items.map((item, index) => (
            <li key={index}>{inline(item)}</li>
          ))}
        </Tag>
      )
      list = null
    }
  }
  lines.forEach((line) => {
    if (/^\s*\x60\x60\x60/.test(line)) {
      flushParagraph()
      flushList()
      if (code) {
        blocks.push(
          <pre key={blocks.length} className="my-4 max-w-full overflow-x-auto rounded-xl border border-border/70 bg-muted/60 p-4 text-sm">
            <code>{code.join('\n')}</code>
          </pre>
        )
        code = null
      } else code = []
      return
    }
    if (code) {
      code.push(line)
      return
    }
    if (!line.trim()) {
      flushParagraph()
      flushList()
      return
    }
    const imgMatch = line.trim().match(/^!\[([^\]]*)\]\((data:image\/[^)]+|https?:\/\/[^)]+)\)$/)
    if (imgMatch) {
      flushParagraph()
      flushList()
      blocks.push(
        <div key={blocks.length} className="my-4 overflow-hidden rounded-xl border border-border/70">
          <img src={imgMatch[2]} alt={imgMatch[1] || 'Generated image'} className="max-h-96 w-auto rounded-xl object-contain" />
        </div>
      )
      return
    }
    const heading = line.match(/^(#{1,4})\s+(.+)$/)
    if (heading) {
      flushParagraph()
      flushList()
      blocks.push(
        <div key={blocks.length} className={heading[1].length <= 2 ? 'mt-4 font-semibold' : 'mt-2 font-medium'}>
          {inline(heading[2])}
        </div>
      )
      return
    }
    const bullet = line.match(/^\s*[-*+]\s+(.+)$/)
    const numbered = line.match(/^\s*\d+[.)]\s+(.+)$/)
    if (bullet || numbered) {
      flushParagraph()
      const ordered = Boolean(numbered)
      if (list && list.ordered !== ordered) flushList()
      if (!list) list = { ordered, items: [] }
      list.items.push((bullet || numbered)![1])
      return
    }
    flushList()
    paragraph.push(line.trim())
  })
  flushParagraph()
  flushList()
  const trailingCode = code as unknown as string[] | null
  if (trailingCode) {
    blocks.push(
      <pre key={blocks.length} className="my-4 max-w-full overflow-x-auto rounded-xl border border-border/70 bg-muted/60 p-4 text-sm">
        <code>{trailingCode.join('\n')}</code>
      </pre>
    )
  }
  return <div className="break-words [&_a]:break-all">{blocks}</div>
}

export function AnimatedAssistantMessage({
  content,
  animate,
}: {
  content: string
  animate: boolean
}) {
  const [displayed, setDisplayed] = React.useState(() => (animate ? '' : content))

  React.useEffect(() => {
    if (!animate) {
      setDisplayed(content)
      return
    }
    let cursor = 0
    const step = Math.max(12, Math.ceil(content.length / 45))
    const timer = window.setInterval(() => {
      cursor += step
      if (cursor >= content.length) {
        setDisplayed(content)
        window.clearInterval(timer)
      } else {
        setDisplayed(content.slice(0, cursor))
      }
    }, 24)
    return () => window.clearInterval(timer)
  }, [animate, content])

  return <FormattedMessage content={displayed} />
}

export function PersonaConfigModal({
  open,
  onClose,
  personaNameInput,
  setPersonaNameInput,
  personaGenderInput,
  setPersonaGenderInput,
  userCallsignInput,
  setUserCallsignInput,
  savingPersona,
  onSubmit,
}: {
  open: boolean
  onClose: () => void
  personaNameInput: string
  setPersonaNameInput: (v: string) => void
  personaGenderInput: string
  setPersonaGenderInput: (v: string) => void
  userCallsignInput: string
  setUserCallsignInput: (v: string) => void
  savingPersona: boolean
  onSubmit: (e: React.FormEvent) => void
}) {
  return (
    <Modal open={open} onClose={onClose} title="Persona & Identity Configuration">
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <LamatLogo className="h-4 w-4 shrink-0" />
          <span>
            The underlying autonomous engine is <strong>Lamat</strong>. Customize how your personal operator introduces itself, its presentation, and what it should call you.
          </span>
        </div>
        <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-2 block text-sm font-medium">Operator Name</label>
            <Input
              value={personaNameInput}
              onChange={(e) => setPersonaNameInput(e.target.value)}
              placeholder="e.g. Lamat, Maya, Aria"
              required
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">Gender Presentation</label>
            <Select
              value={personaGenderInput}
              onChange={(e) => setPersonaGenderInput(e.target.value)}
              aria-label="Gender presentation"
            >
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="non-binary">Non-binary</option>
              <option value="adaptive">Adaptive / Neutral</option>
            </Select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">Your Name / Callsign</label>
            <Input
              value={userCallsignInput}
              onChange={(e) => setUserCallsignInput(e.target.value)}
              placeholder="Your name"
              required
            />
          </div>
          <div className="flex justify-end gap-2 sm:col-span-3">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={savingPersona}>
              {savingPersona ? 'Saving…' : 'Save Persona Preferences'}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  )
}

export function TaskInspectModal({
  task,
  onClose,
  personaName,
  taskRatingInput,
  setTaskRatingInput,
  taskFeedbackInput,
  setTaskFeedbackInput,
  savingRating,
  cycling,
  onRunTask,
  onRateTask,
}: {
  task: LamatTask | null
  onClose: () => void
  personaName: string
  taskRatingInput: number
  setTaskRatingInput: (v: number) => void
  taskFeedbackInput: string
  setTaskFeedbackInput: (v: string) => void
  savingRating: boolean
  cycling: boolean
  onRunTask: (taskId: string) => void
  onRateTask: (requestRevision: boolean) => void
}) {
  const steps = Array.isArray(task?.plan_steps) ? task.plan_steps : []

  return (
    <Modal open={Boolean(task)} onClose={onClose} title={task?.title || 'Task Deliverable & Steps'}>
      {task && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Badge color={task.status === 'completed' ? 'green' : 'blue'}>{task.status}</Badge>
            <span className="text-sm text-muted-foreground">
              Priority P{task.priority} · Score {task.priority_score}
            </span>
          </div>

          {task.rationale && (
            <div className="text-sm text-muted-foreground">
              <strong>Why this task matters:</strong> {task.rationale}
            </div>
          )}

          {/* Visible Execution Steps Section */}
          <div className="space-y-2">
            <div className="text-sm font-semibold">
              Execution Steps ({Math.min(task.current_step_index, steps.length)}/{steps.length} completed)
            </div>
            {steps.length === 0 ? (
              <p className="text-sm text-muted-foreground">Single-pass execution task.</p>
            ) : (
              steps.map((step, idx) => {
                const isDone = step.status === 'completed' || idx < task.current_step_index
                return (
                  <Surface key={idx} variant="muted" padding={2} className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium">
                        Step {idx + 1}: {step.title}
                      </span>
                      <Badge color={isDone ? 'green' : 'slate'}>{isDone ? 'completed' : 'pending'}</Badge>
                    </div>
                    {step.tool && step.tool !== 'none' && (
                      <div className="text-sm text-muted-foreground">Tool: {step.tool}</div>
                    )}
                    {step.output_summary && (
                      <div className="text-sm text-muted-foreground">{step.output_summary}</div>
                    )}
                  </Surface>
                )
              })
            )}
          </div>

          {/* Deliverable Section */}
          <Surface variant="muted" padding={4} className="space-y-2 text-sm">
            <div className="font-semibold">Deliverable & Execution Output</div>
            <FormattedMessage
              content={
                task.deliverable ||
                task.result?.summary ||
                'Task is queued for execution. Click "Run Task Now" below to generate the deliverable.'
              }
            />
          </Surface>

          {task.status !== 'completed' && (
            <Button
              type="button"
              variant="primary"
              onClick={() => onRunTask(task.id)}
              disabled={cycling}
            >
              <Play className="h-4 w-4" /> Run Task Now
            </Button>
          )}

          {/* Yellow/Gold Star-Only Rating & Feedback */}
          <div className="space-y-4 border-t border-border/70 pt-4">
            <div className="text-sm font-semibold">
              Rate & Guide {personaName}’s Self-Improvement
            </div>
            <div className="flex items-center gap-2" role="radiogroup" aria-label="Task rating">
              {[1, 2, 3, 4, 5].map((star) => {
                const active = taskRatingInput >= star
                return (
                  <Button
                    key={star}
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setTaskRatingInput(star)}
                    aria-label={`Rate ${star} out of 5 stars`}
                    title={`${star} / 5 stars`}
                  >
                    <Star className={`h-4 w-4 ${active ? 'fill-current text-warning' : 'text-muted-foreground'}`} />
                  </Button>
                )
              })}
            </div>
            <Textarea
              value={taskFeedbackInput}
              onChange={(e) => setTaskFeedbackInput(e.target.value)}
              placeholder="Add comments, corrections, or specific instructions for how Lamat should improve this output…"
              rows={3}
              className="!h-auto !min-h-[4.5rem] w-full"
            />
            <div className="flex flex-wrap justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => onRateTask(true)}
                disabled={savingRating}
              >
                Save & Queue Revision Task
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={() => onRateTask(false)}
                disabled={savingRating}
              >
                {savingRating ? 'Saving…' : 'Save Rating & Feedback'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  )
}
