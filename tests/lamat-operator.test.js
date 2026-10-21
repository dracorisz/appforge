import assert from 'node:assert/strict'
import test from 'node:test'
import {
  authenticateCompanionRequest,
  authenticateCronRequest,
} from '../api/_companion-auth.js'
import {
  AVAILABLE_MODELS,
  computeActionParameterHash,
  enforceToolAuthorization,
  executeCompanionTool,
  isProtectedWritePath,
  parseGoogleDocOrSheetId,
  redactSecrets,
  signApproval,
  verifyApproval,
} from '../api/_companion-tools.js'
import {
  analyzeTaskCapabilities,
  calculateUsageCost,
  callFreeModelProvider,
  callVertexGardenPartnerModel,
  classifyLamatError,
  invokeLamatAgent,
  isFreeModel,
  isVertexGardenModel,
  loadLamatOperationalContext,
  selectModelForRole,
  summarizeToolExecutions,
  validateMultimodalAttachments,
  validateStructuredAgentOutput,
} from '../api/_lamat-agents.js'
import {
  answerLamatQuestion,
  areDependenciesSatisfied,
  decideLamatAction,
  rateLamatTask,
  runAutonomousCycle,
  scoreTaskPriority,
  selectNextActionableTask,
  verifyTaskOutcome,
} from '../api/_lamat-engine.js'
import { generateSessionTitle, normalizeMessages } from '../api/_companion-chat.js'
import { verifyAllIntegrations } from '../api/_companion-integrations.js'
import { buildConciseActivitySummary } from '../api/lamat.js'

const OWNER_USER = { id: '4c5c0d15-467a-4e63-b2d5-f05763293af8', email: 'dracorisz@gmail.com' }

function createMockSupabaseFetch(initialState = {}) {
  const tables = {
    maya_identity: initialState.maya_identity || [{ version: 4, name: 'Lamat', is_active: true, summary: 'Operator', principles: [] }],
    maya_self_model: initialState.maya_self_model || [{ version: 4, content: { who_i_am: 'Lamat' } }],
    maya_memories: initialState.maya_memories || [],
    maya_goals: initialState.maya_goals || [
      { id: 'goal-1', title: 'Stabilize essentials and debt plan', priority: 1, horizon: 'now', status: 'active', created_by: 'owner', created_at: '2026-10-20T10:00:00Z' },
    ],
    maya_projects: initialState.maya_projects || [],
    maya_resources: initialState.maya_resources || [
      { id: 'res-1', kind: 'credit', name: 'Google Cloud Trial Credit', amount: 300, unit: 'USD', provenance: 'estimate' },
    ],
    maya_actions: initialState.maya_actions || [],
    maya_conversations: initialState.maya_conversations || [],
    maya_messages: initialState.maya_messages || [],
    maya_snapshots: initialState.maya_snapshots || [],
    lamat_tasks: initialState.lamat_tasks || [],
    lamat_runs: initialState.lamat_runs || [],
    lamat_questions: initialState.lamat_questions || [],
    lamat_budget_config: initialState.lamat_budget_config || [
      {
        id: 'default',
        daily_limit_usd: 2.0,
        task_limit_usd: 0.5,
        cycle_limit_usd: 0.25,
        total_credit_limit_usd: 300.0,
        daily_token_limit: 500000,
        max_cycles_per_hour: 30,
        autonomous_enabled: true,
        routine_model: 'gemini-3.8-flash',
        reasoning_model: 'gemini-4-argon',
      },
    ],
    fin_debts: initialState.fin_debts || [],
    fin_accounts: initialState.fin_accounts || [],
    fin_recurring: initialState.fin_recurring || [],
    fin_income_sources: initialState.fin_income_sources || [],
    user_preferences: initialState.user_preferences || [],
    lamat_user_provider_keys: initialState.lamat_user_provider_keys || [],
    lamat_library_items: initialState.lamat_library_items || [],
  }

  let budgetStatusOverride = initialState.budgetStatus || null

  const fetchImpl = async (urlStr, options = {}) => {
    const url = new URL(String(urlStr))
    const method = (options.method || 'GET').toUpperCase()

    if (url.pathname === '/auth/v1/user') {
      const auth = options.headers?.Authorization || ''
      if (auth === 'Bearer owner-token') {
        return new Response(JSON.stringify(OWNER_USER), { status: 200 })
      }
      if (auth === 'Bearer intruder-token') {
        return new Response(JSON.stringify({ id: 'intruder-1', email: 'intruder@example.com' }), { status: 200 })
      }
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
    }

    if (url.pathname.startsWith('/rest/v1/rpc/')) {
      const fn = url.pathname.replace('/rest/v1/rpc/', '')
      if (fn === 'lamat_recover_stale_tasks') {
        let recovered = 0
        for (const t of tables.lamat_tasks) {
          if (['planning', 'running', 'verifying'].includes(t.status) && t.lease_expires_at && new Date(t.lease_expires_at) < new Date()) {
            t.status = t.attempt_count >= t.max_attempts ? 'failed' : 'queued'
            t.lease_owner = null
            t.lease_expires_at = null
            recovered += 1
          }
        }
        return new Response(JSON.stringify(recovered), { status: 200 })
      }
      if (fn === 'lamat_claim_task') {
        const body = JSON.parse(options.body || '{}')
        const task = tables.lamat_tasks.find((t) => t.id === body.p_task_id)
        if (!task) return new Response(JSON.stringify([]), { status: 200 })
        task.status = task.status === 'queued' ? 'running' : task.status
        task.lease_owner = body.p_worker_id
        task.lease_expires_at = new Date(Date.now() + 120000).toISOString()
        task.attempt_count = Number(task.attempt_count || 0) + 1
        return new Response(JSON.stringify([task]), { status: 200 })
      }
      if (fn === 'lamat_budget_status') {
        if (budgetStatusOverride) return new Response(JSON.stringify(budgetStatusOverride), { status: 200 })
        const cfg = tables.lamat_budget_config[0]
        return new Response(
          JSON.stringify({
            config: cfg,
            today_spend_usd: 0.02,
            today_measured_usd: 0.01,
            today_estimated_usd: 0.01,
            total_spend_usd: 0.05,
            remaining_daily_usd: 1.98,
            remaining_total_credit_usd: 299.95,
            today_tokens: 1200,
            can_execute: cfg.autonomous_enabled,
            halt_reason: cfg.autonomous_enabled ? null : 'Autonomous execution paused.',
          }),
          { status: 200 }
        )
      }
      if (fn === 'fin_summary') {
        return new Response(
          JSON.stringify({
            accounts: tables.fin_accounts,
            debts: tables.fin_debts,
            due_soon: [],
          }),
          { status: 200 }
        )
      }
      return new Response(JSON.stringify({}), { status: 200 })
    }

    if (url.pathname.startsWith('/rest/v1/')) {
      const table = url.pathname.replace('/rest/v1/', '')
      const rows = tables[table] || []
      if (method === 'GET') {
        let filtered = [...rows]
        for (const [k, v] of url.searchParams.entries()) {
          if (['select', 'order', 'limit'].includes(k)) continue
          if (v.startsWith('eq.')) {
            const target = v.slice(3)
            filtered = filtered.filter((r) => String(r[k]) === target)
          }
        }
        return new Response(JSON.stringify(filtered), { status: 200 })
      }
      if (method === 'POST') {
        const payload = JSON.parse(options.body || '{}')
        const created = {
          id: payload.id || `id-${ rows.length + 1 }`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          ...(table === 'maya_actions' ? { status: ['spend_money', 'deploy_production', 'external_publish_or_send'].includes(payload.category) ? 'proposed' : 'approved', tier_at_request: 'approve' } : {}),
          ...payload,
        }
        rows.push(created)
        tables[table] = rows
        return new Response(JSON.stringify([created]), { status: 201 })
      }
      if (method === 'PATCH') {
        const patch = JSON.parse(options.body || '{}')
        const idFilter = url.searchParams.get('id')
        const targetId = idFilter?.startsWith('eq.') ? idFilter.slice(3) : null
        let updated = null
        for (let i = 0; i < rows.length; i += 1) {
          if (!targetId || String(rows[i].id) === targetId) {
            rows[i] = { ...rows[i], ...patch, updated_at: new Date().toISOString() }
            updated = rows[i]
          }
        }
        return new Response(JSON.stringify(updated ? [updated] : []), { status: 200 })
      }
      if (method === 'DELETE') {
        const idFilter = url.searchParams.get('id')
        const targetId = idFilter?.startsWith('eq.') ? idFilter.slice(3) : null
        const removed = []
        tables[table] = rows.filter((r) => {
          if (targetId && String(r.id) === targetId) {
            removed.push(r)
            return false
          }
          return true
        })
        return new Response(JSON.stringify(removed), { status: 200 })
      }
    }

    return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 })
  }

  return {
    fetchImpl,
    tables,
    setBudgetStatus(next) {
      budgetStatusOverride = next
    },
  }
}

test('1. Authentication & owner-only boundary rejects unauthenticated and non-owner callers', async () => {
  const prevKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY = 'anon-test-key'
  const mock = createMockSupabaseFetch()
  try {
    const unauth = await authenticateCompanionRequest({ headers: {} }, { fetchImpl: mock.fetchImpl })
    assert.equal(unauth.ok, false)
    assert.equal(unauth.status, 401)

    const intruder = await authenticateCompanionRequest(
      { headers: { authorization: 'Bearer intruder-token' } },
      { fetchImpl: mock.fetchImpl }
    )
    assert.equal(intruder.ok, false)
    assert.equal(intruder.status, 403)

    const owner = await authenticateCompanionRequest(
      { headers: { authorization: 'Bearer owner-token' } },
      { fetchImpl: mock.fetchImpl }
    )
    assert.equal(owner.ok, true)
    assert.equal(owner.user.email, 'dracorisz@gmail.com')
  } finally {
    if (prevKey === undefined) delete process.env.VITE_SUPABASE_PUBLISHABLE_KEY
    else process.env.VITE_SUPABASE_PUBLISHABLE_KEY = prevKey
  }
})

test('2. Cron authentication enforces secret token', () => {
  const prev = process.env.LAMAT_CRON_SECRET
  process.env.LAMAT_CRON_SECRET = 'cron-secret-xyz'
  try {
    assert.equal(authenticateCronRequest({ headers: {} }).ok, false)
    assert.equal(authenticateCronRequest({ headers: { authorization: 'Bearer wrong' } }).ok, false)
    assert.equal(authenticateCronRequest({ headers: { authorization: 'Bearer cron-secret-xyz' } }).ok, true)
  } finally {
    if (prev === undefined) delete process.env.LAMAT_CRON_SECRET
    else process.env.LAMAT_CRON_SECRET = prev
  }
})

test('3. Authority boundaries & role permissions block forbidden categories and unauthorized role calls', () => {
  // Researcher cannot invoke task creation or file mutation tools
  assert.throws(
    () => enforceToolAuthorization('lamat_create_task', {}, 'researcher'),
    /not authorized to invoke tool/
  )
  assert.throws(
    () => enforceToolAuthorization('github_propose_file_change', {}, 'researcher'),
    /not authorized to invoke tool/
  )

  // Forbidden autonomy policy categories are blocked even for supervisor/executor
  assert.throws(
    () => enforceToolAuthorization('lamat_propose_action', { category: 'iam_billing_secrets', summary: 'Rotate key' }, 'supervisor'),
    /forbidden by execution policy/
  )
  assert.throws(
    () => enforceToolAuthorization('lamat_propose_action', { category: 'self_governance', summary: 'Disable approvals' }, 'executor'),
    /forbidden by execution policy/
  )

  // Protected write paths cannot be modified by Companion
  assert.equal(isProtectedWritePath('api/_companion-tools.js'), true)
  assert.equal(isProtectedWritePath('api/_lamat-engine.js'), true)
  assert.equal(isProtectedWritePath('WORK_RULES.md'), true)
  assert.equal(isProtectedWritePath('supabase/migrations/20261020_test.sql'), true)
})

test('4. Approval tokens are cryptographically bound to material parameters and reject tampered parameters', async () => {
  const prevSecret = process.env.COMPANION_ACTION_SECRET
  process.env.COMPANION_ACTION_SECRET = '0123456789abcdef0123456789abcdef0123456789abcdef'
  try {
    const action = {
      kind: 'github_file_write',
      repository: 'dracorisz/appforge',
      path: 'README.md',
      content: '# Lamat\n',
      summary: 'Update README',
    }
    const parameterHash = computeActionParameterHash(action)
    const token = signApproval({
      version: 1,
      userId: OWNER_USER.id,
      expiresAt: Date.now() + 60000,
      parameterHash,
      action,
    })

    const verified = verifyApproval(token, action)
    assert.equal(verified.parameterHash, parameterHash)

    // Material change to content or path must fail verification
    assert.throws(
      () => verifyApproval(token, { ...action, content: '# Tampered\n' }),
      /Approval parameters changed/
    )

    // Database action approval also verifies parameter hash
    const mock = createMockSupabaseFetch()
    const proposed = await executeCompanionTool(
      'lamat_propose_action',
      {
        category: 'spend_money',
        summary: 'Purchase domain renewal',
        target: 'sstoken.space',
        payload: { years: 1 },
        estimated_cost_usd: 12,
      },
      OWNER_USER,
      'owner-token',
      { agentRole: 'executor', fetchImpl: mock.fetchImpl }
    )
    assert.equal(proposed.requires_approval, true)

    await assert.rejects(
      decideLamatAction({
        actionId: proposed.action_id,
        decision: 'approved',
        expectedParameterHash: 'tampered-hash',
        user: OWNER_USER,
        accessToken: 'owner-token',
        fetchImpl: mock.fetchImpl,
      }),
      /Action parameters changed/
    )

    const approved = await decideLamatAction({
      actionId: proposed.action_id,
      decision: 'approved',
      expectedParameterHash: proposed.parameter_hash,
      user: OWNER_USER,
      accessToken: 'owner-token',
      fetchImpl: mock.fetchImpl,
    })
    assert.equal(approved.ok, true)
    assert.equal(approved.action.status, 'approved')
  } finally {
    if (prevSecret === undefined) delete process.env.COMPANION_ACTION_SECRET
    else process.env.COMPANION_ACTION_SECRET = prevSecret
  }
})

test('5. Task prioritization considers goal alignment, deadlines, dependency unlocking, and checkpoint continuity', () => {
  const goals = [
    { id: 'g-urgent', priority: 1, horizon: 'now', created_by: 'owner', target_date: new Date(Date.now() + 2 * 86400000).toISOString() },
    { id: 'g-later', priority: 4, horizon: 'later', created_by: 'lamat' },
  ]
  const taskA = {
    id: 't-low',
    goal_id: 'g-later',
    title: 'Low priority task',
    status: 'queued',
    priority: 4,
    current_step_index: 0,
    estimated_cost_usd: 0.01,
    created_at: '2026-10-20T10:00:00Z',
  }
  const taskB = {
    id: 't-urgent',
    goal_id: 'g-urgent',
    title: 'Urgent financial task',
    kind: 'financial',
    status: 'queued',
    priority: 1,
    current_step_index: 1, // Resuming from checkpoint
    estimated_cost_usd: 0.01,
    created_at: '2026-10-20T10:01:00Z',
  }
  const taskBlockedByB = {
    id: 't-dependent',
    goal_id: 'g-urgent',
    title: 'Dependent on t-urgent',
    depends_on: ['t-urgent'],
    status: 'queued',
    priority: 1,
    current_step_index: 0,
    estimated_cost_usd: 0.01,
    created_at: '2026-10-20T10:02:00Z',
  }

  const allTasks = [taskA, taskB, taskBlockedByB]
  assert.equal(areDependenciesSatisfied(taskBlockedByB, allTasks), false)
  assert.ok(scoreTaskPriority(taskB, { goals, allTasks }) > scoreTaskPriority(taskA, { goals, allTasks }))

  const selected = selectNextActionableTask(allTasks, {
    goals,
    budgetStatus: { remaining_daily_usd: 1.0, config: { task_limit_usd: 0.5 } },
  })
  assert.equal(selected.id, 't-urgent')
})

test('6. Persistent operating cycle executes multi-step tasks, records checkpoints, resumes without repeating completed steps, and verifies outcome', async () => {
  const mock = createMockSupabaseFetch({
    lamat_tasks: [
      {
        id: 'task-multi-1',
        goal_id: 'goal-1',
        title: 'Audit runway and record memory',
        rationale: 'Keep runway verified',
        kind: 'verification',
        status: 'queued',
        priority: 1,
        priority_score: 95,
        expected_outcome: 'Verified runway recorded',
        verification_method: 'Check step outputs',
        plan_steps: [
          { index: 0, title: 'Step 1: Check budget and resources', tool: 'lamat_check_budget_and_resources', status: 'pending' },
          { index: 1, title: 'Step 2: Record verified runway memory', tool: 'lamat_record_memory', status: 'pending' },
        ],
        current_step_index: 0,
        checkpoint_state: {},
        attempt_count: 0,
        max_attempts: 3,
        estimated_cost_usd: 0.01,
        created_at: '2026-10-20T10:00:00Z',
      },
    ],
  })

  // Cycle 1 executes Step 0 and saves checkpoint at current_step_index = 1
  const cycle1 = await runAutonomousCycle({
    user: OWNER_USER,
    accessToken: 'owner-token',
    fetchImpl: mock.fetchImpl,
  })
  assert.equal(cycle1.ok, true)
  assert.equal(cycle1.cycleStatus, 'step_checkpointed')
  assert.equal(cycle1.stepExecuted.index, 0)
  assert.equal(mock.tables.lamat_tasks[0].current_step_index, 1)
  assert.equal(mock.tables.lamat_tasks[0].plan_steps[0].status, 'completed')

  // Cycle 2 resumes from Step 1 (does NOT repeat Step 0!) and completes + verifies the task
  const cycle2 = await runAutonomousCycle({
    user: OWNER_USER,
    accessToken: 'owner-token',
    fetchImpl: mock.fetchImpl,
  })
  assert.equal(cycle2.ok, true)
  assert.equal(cycle2.cycleStatus, 'task_completed')
  assert.equal(cycle2.stepExecuted.index, 1)
  assert.equal(cycle2.evaluation.verified, true)
  assert.equal(mock.tables.lamat_tasks[0].status, 'completed')
  assert.equal(mock.tables.lamat_runs.length, 2)
  assert.equal(mock.tables.maya_memories.length, 1)
})

test('7. Questions workflow pauses only the blocked task, allows unrelated work, and resumes when answered', async () => {
  const mock = createMockSupabaseFetch({
    lamat_tasks: [
      {
        id: 'task-needs-answer',
        goal_id: 'goal-1',
        title: 'Establish hardship and debt intake',
        rationale: 'Need accurate debt figures',
        kind: 'financial',
        status: 'queued',
        priority: 1,
        priority_score: 99,
        expected_outcome: 'Verified debt intake',
        plan_steps: [
          { index: 0, title: 'Ask owner for missing debt figures', tool: 'lamat_ask_question', status: 'pending' },
        ],
        current_step_index: 0,
        checkpoint_state: {},
        attempt_count: 0,
        max_attempts: 3,
        estimated_cost_usd: 0.01,
        created_at: '2026-10-20T10:00:00Z',
      },
      {
        id: 'task-unrelated',
        goal_id: 'goal-1',
        title: 'Unrelated resource check',
        rationale: 'Can proceed while waiting',
        kind: 'verification',
        status: 'queued',
        priority: 2,
        priority_score: 80,
        expected_outcome: 'Resource checked',
        plan_steps: [
          { index: 0, title: 'Check budget', tool: 'lamat_check_budget_and_resources', status: 'pending' },
        ],
        current_step_index: 0,
        checkpoint_state: {},
        attempt_count: 0,
        max_attempts: 3,
        estimated_cost_usd: 0.01,
        created_at: '2026-10-20T10:01:00Z',
      },
    ],
  })

  // Cycle 1 runs task-needs-answer, which asks a question and transitions to waiting_input
  const cycle1 = await runAutonomousCycle({
    user: OWNER_USER,
    accessToken: 'owner-token',
    fetchImpl: mock.fetchImpl,
  })
  assert.equal(cycle1.cycleStatus, 'waiting_input')
  assert.equal(mock.tables.lamat_questions.length, 1)
  assert.equal(mock.tables.lamat_tasks[0].status, 'waiting_input')
  // Next candidate task is automatically the unrelated task!
  assert.equal(cycle1.nextCandidateTask.id, 'task-unrelated')

  // Cycle 2 continues with task-unrelated while task-needs-answer waits
  const cycle2 = await runAutonomousCycle({
    user: OWNER_USER,
    accessToken: 'owner-token',
    fetchImpl: mock.fetchImpl,
  })
  assert.equal(cycle2.cycleStatus, 'task_completed')
  assert.equal(cycle2.task.id, 'task-unrelated')

  // Owner answers the pending question -> records memory and completes/resumes the blocked task
  const questionId = mock.tables.lamat_questions[0].id
  const answerRes = await answerLamatQuestion({
    questionId,
    answer: 'Weekly essentials are 70 EUR; top debt is utility arrears 180 EUR due Nov 5.',
    user: OWNER_USER,
    accessToken: 'owner-token',
    fetchImpl: mock.fetchImpl,
  })
  assert.equal(answerRes.ok, true)
  assert.equal(answerRes.question.status, 'answered')
  assert.equal(answerRes.resumedTask.status, 'completed')
  assert.ok(mock.tables.maya_memories.some((m) => m.provenance === 'stated_by_owner' && m.content.includes('70 EUR')))
})

test('8. Budget enforcement halts execution cleanly when daily or credit limit is exhausted', async () => {
  const mock = createMockSupabaseFetch()
  mock.setBudgetStatus({
    config: { daily_limit_usd: 2.0, routine_model: 'gemini-3.8-flash' },
    today_spend_usd: 2.05,
    remaining_daily_usd: 0,
    can_execute: false,
    halt_reason: 'Daily USD budget reached (2.05 / 2.00 USD).',
  })

  const cycle = await runAutonomousCycle({
    user: OWNER_USER,
    accessToken: 'owner-token',
    fetchImpl: mock.fetchImpl,
  })
  assert.equal(cycle.cycleStatus, 'budget_halted')
  assert.match(cycle.haltReason, /Daily USD budget reached/)
  assert.equal(mock.tables.lamat_runs[0].status, 'budget_halted')
})

test('9. Self-directed idle discovery creates justified non-duplicate tasks when queue is empty', async () => {
  const mock = createMockSupabaseFetch({
    lamat_tasks: [],
  })

  const cycle = await runAutonomousCycle({
    user: OWNER_USER,
    accessToken: 'owner-token',
    fetchImpl: mock.fetchImpl,
  })
  assert.equal(cycle.discoveredNewTask, true)
  assert.equal(mock.tables.lamat_tasks.length, 1)
  assert.match(mock.tables.lamat_tasks[0].title, /Audit 1 unverified resource/)
})

test('10. Cost accounting distinguishes measured vs estimated tokens, and multimodal validator enforces size/MIME rules', () => {
  const measured = calculateUsageCost('gemini-3.8-flash', { promptTokenCount: 1000, candidatesTokenCount: 500 })
  assert.equal(measured.costProvenance, 'measured')
  assert.equal(measured.totalTokens, 1500)

  const estimated = calculateUsageCost('gemini-4-argon', null, 800, 400)
  assert.equal(estimated.costProvenance, 'estimated')
  assert.ok(estimated.totalTokens > 0)

  assert.equal(selectModelForRole('planner'), 'gemini-4-argon')
  assert.equal(selectModelForRole('memory_processor'), 'gemini-3.8-flash')

  const validImg = validateMultimodalAttachments([
    { name: 'receipt.png', mimeType: 'image/png', data: Buffer.from('1234567890').toString('base64') },
  ])
  assert.equal(validImg.length, 1)
  assert.equal(validImg[0].inlineData.mimeType, 'image/png')

  assert.throws(
    () => validateMultimodalAttachments([{ name: 'bad.exe', mimeType: 'application/x-msdownload', data: 'MTIzNDU2Nzg5MA==' }]),
    /Unsupported attachment MIME type/
  )

  const messages = normalizeMessages([{ role: 'user', content: 'Inspect this receipt' }], validImg)
  assert.equal(messages.length, 1)
  assert.equal(messages[0].parts.length, 2)
  assert.equal(messages[0].parts[1].inlineData.mimeType, 'image/png')
})

test('11. Concise activity summary and secret redaction work accurately', () => {
  const summary = buildConciseActivitySummary({
    tasks: [
      { id: 't1', title: 'Done task', status: 'completed', priority: 1, priority_score: 90, plan_steps: [] },
      { id: 't2', title: 'Active task', rationale: 'Important reason', status: 'running', priority: 1, priority_score: 95, current_step_index: 0, plan_steps: [{ index: 0, title: 'Step 1' }] },
    ],
    pendingQuestions: [{ id: 'q1', status: 'pending' }],
    pendingApprovals: [],
    budgetStatus: { can_execute: true },
  })
  assert.equal(summary.state, 'executing')
  assert.equal(summary.completedCount, 1)
  assert.equal(summary.remainingCount, 1)
  assert.equal(summary.requiresInput, true)

  const redacted = redactSecrets('Token ghp_1234567890abcdefghijklmnopqrstuvwx should not leak')
  assert.match(redacted, /\[REDACTED_SECRET\]/)

  const validPlan = validateStructuredAgentOutput('planner', {
    plan_steps: [{ title: 'Step A', tool: 'lamat_check_budget_and_resources' }],
    expected_outcome: 'Verified',
  })
  assert.equal(validPlan.valid, true)

  const verifiedEval = verifyTaskOutcome(
    { title: 'Test' },
    { stepOutputs: { 0: { summary: 'ok' } } },
    [{ index: 0, title: 'Step A', status: 'completed' }]
  )
  assert.equal(verifiedEval.verified, true)
})

test('12. Vertex AI paid model access control strictly rejects non-owner email addresses with 403', async () => {
  await assert.rejects(
    invokeLamatAgent({
      user: { id: 'other-user', email: 'intruder@example.com' },
      accessToken: 'any-token',
      contents: [{ role: 'user', parts: [{ text: 'Hello' }] }],
    }),
    (err) => {
      assert.equal(err.status, 403)
      assert.equal(err.code, 'model_access_restricted')
      assert.match(err.message, /dracorisz@gmail\.com/)
      return true
    }
  )
})

test('13. Google Workspace tools parse document/sheet IDs, check permissions, and export clean text/CSV', async () => {
  assert.equal(
    parseGoogleDocOrSheetId('https://docs.google.com/document/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit'),
    '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms'
  )
  assert.equal(
    parseGoogleDocOrSheetId('https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit#gid=0'),
    '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms'
  )
  assert.equal(
    parseGoogleDocOrSheetId('1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms'),
    '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms'
  )

  const authDrive = enforceToolAuthorization('google_drive_list_files', {}, 'researcher')
  assert.equal(authDrive.category, 'read_state')
  assert.equal(authDrive.requiresOwnerApproval, false)

  const mockGoogleFetch = async (urlStr) => {
    const url = new URL(urlStr)
    if (url.pathname.includes('/drive/v3/files/doc-123/export')) {
      return new Response('Quarterly Financial Plan\nTotal budget: 5000 EUR\nRunway: 6 months', { status: 200 })
    }
    if (url.pathname.includes('/drive/v3/files/doc-123')) {
      return new Response(JSON.stringify({ id: 'doc-123', name: 'Plan.gdoc', mimeType: 'application/vnd.google-apps.document' }), { status: 200 })
    }
    if (url.pathname.includes('/spreadsheets/v4/spreadsheets/sheet-123/values/')) {
      return new Response(JSON.stringify({ range: 'Sheet1!A1:B2', values: [['Category', 'Amount'], ['Food', '300']] }), { status: 200 })
    }
    return new Response(JSON.stringify({ files: [{ id: 'doc-123', name: 'Plan.gdoc' }] }), { status: 200 })
  }

  const docResult = await executeCompanionTool(
    'google_drive_read_file',
    { fileId: 'doc-123' },
    OWNER_USER,
    'owner-token',
    { fetchImpl: mockGoogleFetch, agentRole: 'researcher' }
  )
  assert.equal(docResult.fileId, 'doc-123')
  assert.match(docResult.content, /Quarterly Financial Plan/)
})

test('14. User persona configuration injects custom name and gender into system prompt while preserving Lamat as platform engine', async () => {
  const mock = createMockSupabaseFetch({
    user_preferences: [
      {
        preferences: {
          persona: {
            name: 'Aria',
            gender: 'female',
            user_callsign: 'Dragoljub',
            onboarding_completed: true,
          },
        },
      },
    ],
  })

  const context = await loadLamatOperationalContext('owner-token', { fetchImpl: mock.fetchImpl })
  assert.match(context.systemPromptText, /Platform & Engine: Lamat/)
  assert.match(context.systemPromptText, /Addressed Name: Aria/)
  assert.match(context.systemPromptText, /Gender Presentation: female/)
  assert.match(context.systemPromptText, /You are Dragoljub's personal operator addressed as "Aria"/)
})

test('15. Orchestrator model selection, Free Mode multi-key rotation, financial record population, and task rating loop work end-to-end', async () => {
  // Orchestrator routes code queries to gemini-4-argon and general queries to gemini-3.8-flash, or free models when Free Mode is on
  assert.equal(selectModelForRole('chat', { queryHint: 'Please refactor the TypeScript function in repo' }), 'gemini-4-argon')
  assert.equal(selectModelForRole('chat', { queryHint: 'Good morning, how is my day?' }), 'gemini-3.8-flash')
  assert.equal(selectModelForRole('chat', { preferFree: true, queryHint: 'Good morning' }), 'openrouter:minimax/minimax-m3.1-flash:free')
  assert.equal(selectModelForRole('chat', { preferFree: true, queryHint: 'Refactor code in repository' }), 'openrouter:poolside/laguna-s-2.1:free')
  assert.equal(isFreeModel('hf:Qwen/Qwen2.5-72B-Instruct'), true)
  assert.equal(isFreeModel('openrouter:minimax/minimax-m3.1-flash:free'), true)
  assert.equal(isVertexGardenModel('vertex-claude:claude-sonnet-4-5@20250929'), true)
  assert.equal(isVertexGardenModel('vertex-meta:meta/llama-3.3-70b-instruct-maas'), true)
  assert.equal(calculateUsageCost('hf:Qwen/Qwen2.5-72B-Instruct', { promptTokenCount: 5000, candidatesTokenCount: 2000 }).costUsd, 0)

  // Free model provider falls back seamlessly from HF 402 to OpenRouter :free
  const freeFallbackRes = await callFreeModelProvider({
    model: 'hf:Qwen/Qwen2.5-72B-Instruct',
    systemText: 'You are Lamat',
    contents: [{ role: 'user', parts: [{ text: 'Hello' }] }],
    providerKeys: { huggingface: ['hf_exhausted'], openrouter: ['or_valid'] },
    fetchImpl: async (urlStr) => {
      if (String(urlStr).includes('huggingface.co')) {
        return new Response(JSON.stringify({ error: 'You have no remaining credits.' }), { status: 402 })
      }
      return new Response(
        JSON.stringify({
          choices: [{ message: { content: 'Answered via OpenRouter free fallback' } }],
          usage: { prompt_tokens: 20, completion_tokens: 10 },
        }),
        { status: 200 }
      )
    },
  })
  assert.equal(freeFallbackRes.provider, 'openrouter')
  assert.equal(freeFallbackRes.text, 'Answered via OpenRouter free fallback')

  // Vertex AI Model Garden Claude adapter
  const claudeGardenRes = await callVertexGardenPartnerModel({
    model: 'vertex-claude:claude-sonnet-4-5@20250929',
    systemText: 'You are Lamat',
    contents: [{ role: 'user', parts: [{ text: 'Hello Claude' }] }],
    gcpAccessToken: 'gcp-token',
    projectNumber: '136413445697',
    fetchImpl: async () =>
      new Response(
        JSON.stringify({
          content: [{ type: 'text', text: 'Hello from Claude on Vertex AI Model Garden' }],
          usage: { input_tokens: 15, output_tokens: 8 },
        }),
        { status: 200 }
      ),
  })
  assert.equal(claudeGardenRes.provider, 'vertex-garden')
  assert.equal(claudeGardenRes.text, 'Hello from Claude on Vertex AI Model Garden')

  // Robotic loop prevention strips legacy canned assistant messages
  const cleanedMsgs = normalizeMessages([
    { role: 'user', content: 'Look in Google Drive' },
    { role: 'assistant', content: 'I completed the tool operations for this turn and saved progress to Supabase. Let me know if you want to review the results or continue with the next task.' },
    { role: 'user', content: 'I want to review the results' },
  ])
  assert.equal(cleanedMsgs.length, 2)
  assert.match(summarizeToolExecutions([{ name: 'google_drive_list_files', status: 'failed', error: 'Share folder with service account' }]), /Share folder with service account/)

  // Financial record population tool (lamat_upsert_financial_record)
  const mock = createMockSupabaseFetch({
    lamat_tasks: [
      {
        id: 'task-rate-1',
        goal_id: 'goal-1',
        title: 'Prepare remote income plan',
        status: 'completed',
        priority: 1,
        priority_score: 95,
        deliverable: '## Action Plan',
      },
    ],
  })
  const debtRes = await executeCompanionTool(
    'lamat_upsert_financial_record',
    {
      record_type: 'debt',
      name: 'Electric Utility Arrears',
      amount: 145.5,
      currency: 'EUR',
      due_date: '2026-11-05',
      consequence_note: 'Disconnection warning',
    },
    OWNER_USER,
    'owner-token',
    { fetchImpl: mock.fetchImpl, agentRole: 'executor' }
  )
  assert.equal(debtRes.recorded, 'fin_debts')
  assert.equal(mock.tables.fin_debts.length, 1)
  assert.equal(mock.tables.fin_debts[0].balance_minor, 14550)

  // Task rating & self-improvement feedback loop
  const rateRes = await rateLamatTask({
    taskId: 'task-rate-1',
    rating: 3,
    feedback: 'Add concrete outreach templates for fractional CTO roles.',
    requestRevision: true,
    accessToken: 'owner-token',
    fetchImpl: mock.fetchImpl,
  })
  assert.equal(rateRes.ok, true)
  assert.equal(rateRes.task.user_rating, 3)
  assert.ok(rateRes.revisionTask)
  assert.match(rateRes.revisionTask.title, /Revise: Prepare remote income plan/)
})

test('16. Capability-aware multi-model routing upgrades text-only models for vision attachments and cleans unusable models', async () => {
  // Verify unusable Vertex AI Model Garden and dead Mistral HF models are removed from AVAILABLE_MODELS
  assert.equal(
    AVAILABLE_MODELS.some((m) => m.id.startsWith('vertex-claude:') || m.id.startsWith('vertex-meta:')),
    false
  )
  assert.equal(
    AVAILABLE_MODELS.some((m) => m.id === 'hf:mistralai/Mistral-Small-24B-Instruct-2501'),
    false
  )

  // Task capability detection
  const imgCaps = analyzeTaskCapabilities({
    query: 'Can you now make similar image but using Google provided model?',
    attachments: [{ inlineData: { mimeType: 'image/jpeg', data: 'abc' } }],
  })
  assert.equal(imgCaps.hasImageAttachments, true)
  assert.equal(imgCaps.needsImageGeneration, true)
  assert.equal(imgCaps.googleImageRequested, true)
  assert.ok(imgCaps.requiredCapabilities.includes('vision'))
  assert.ok(imgCaps.requiredCapabilities.includes('image_generation'))

  // Text-only free model (nemotron-3-ultra) automatically upgrades to vision-capable free model when image attachment is present
  const upgradedFree = selectModelForRole('chat', {
    requestedModel: 'openrouter:nvidia/nemotron-3-ultra-550b-a55b:free',
    queryHint: 'What is in this screenshot?',
    attachments: [{ inlineData: { mimeType: 'image/png', data: 'xyz' } }],
  })
  assert.equal(upgradedFree, 'openrouter:nvidia/nemotron-3.5-super-vl:free')

  // Explicit 'auto' requestedModel is not overridden by stale preferred_chat_model in budgetConfig
  const autoRouted = selectModelForRole('chat', {
    requestedModel: 'auto',
    budgetConfig: { preferred_chat_model: 'openrouter:nvidia/nemotron-3-ultra-550b-a55b:free' },
    queryHint: 'Refactor the authentication flow in TypeScript',
  })
  assert.equal(autoRouted, 'gemini-4-argon')
})

test('17. Structured error classification distinguishes timeouts, user cancellations, auth errors, and rate limits', () => {
  const timeoutErr = new Error('The operation was aborted due to timeout')
  timeoutErr.name = 'TimeoutError'
  const classifiedTimeout = classifyLamatError(timeoutErr)
  assert.equal(classifiedTimeout.status, 504)
  assert.equal(classifiedTimeout.category, 'timeout')
  assert.equal(classifiedTimeout.retryable, true)
  assert.doesNotMatch(classifiedTimeout.userMessage, /^The operation was aborted due to timeout$/)

  const cancelErr = new Error('The operation was aborted')
  cancelErr.name = 'AbortError'
  const classifiedCancel = classifyLamatError(cancelErr)
  assert.equal(classifiedCancel.status, 499)
  assert.equal(classifiedCancel.category, 'cancelled')
  assert.equal(classifiedCancel.retryable, false)

  const rateErr = new Error('Rate limit reached')
  rateErr.status = 429
  const classifiedRate = classifyLamatError(rateErr)
  assert.equal(classifiedRate.status, 429)
  assert.equal(classifiedRate.category, 'rate_limit')
  assert.equal(classifiedRate.retryable, true)

  const authErr = new Error('Access denied: restricted account')
  authErr.status = 403
  const classifiedAuth = classifyLamatError(authErr)
  assert.equal(classifiedAuth.status, 403)
  assert.equal(classifiedAuth.category, 'auth_error')
  assert.equal(classifiedAuth.retryable, false)
})

test('18. Context optimization strips historical base64 images, deduplicates memories, and reduces token footprint', async () => {
  const hugeBase64 = 'data:image/jpeg;base64,' + 'A'.repeat(50000)
  const messagesWithBlobs = [
    { role: 'user', content: 'Analyze this\n\n[Attached: screenshot.png]' },
    {
      role: 'assistant',
      content: `Here is your generated artwork:\n\n![Broken Placeholder]([INLINE_IMAGE_ATTACHED_TO_RESPONSE])\n\n![Sunset Cloud](${hugeBase64})`,
    },
    { role: 'user', content: 'Now summarize what we did.' },
  ]
  const normalized = normalizeMessages(messagesWithBlobs)
  assert.equal(normalized.length, 3)
  assert.doesNotMatch(normalized[0].parts[0].text, /\[Attached:/)
  assert.doesNotMatch(normalized[1].parts[0].text, /INLINE_IMAGE_ATTACHED_TO_RESPONSE/)
  assert.doesNotMatch(normalized[1].parts[0].text, /AAAA/)
  assert.match(normalized[1].parts[0].text, /\[Generated Image: Sunset Cloud\]/)

  const mock = createMockSupabaseFetch({
    maya_memories: [
      { id: 'm1', kind: 'fact', content: 'Duplicate memory entry about runway', provenance: 'owner_stated', confidence: 0.9, status: 'active' },
      { id: 'm2', kind: 'fact', content: 'Duplicate memory entry about runway', provenance: 'owner_stated', confidence: 0.9, status: 'active' },
      { id: 'm3', kind: 'preference', content: 'Prefers concise engineering summaries', provenance: 'owner_stated', confidence: 0.85, status: 'active' },
    ],
  })
  const fullCtx = await loadLamatOperationalContext('owner-token', { queryHint: 'runway', compact: false, fetchImpl: mock.fetchImpl })
  const compactCtx = await loadLamatOperationalContext('owner-token', { queryHint: 'hello', compact: true, fetchImpl: mock.fetchImpl })
  assert.equal(fullCtx.rankedMemories.length, 2) // deduplicated from 3 to 2
  assert.ok(compactCtx.contextMetrics.systemPromptChars <= fullCtx.contextMetrics.systemPromptChars)
})

test('19. Google Docs & Sheets create/write tools and end-to-end integration verification operate accurately', async () => {
  const mock = createMockSupabaseFetch({
    user_preferences: [
      {
        user_id: OWNER_USER.id,
        preferences: {
          google_provider_token: 'ya29.valid-user-oauth-token',
        },
      },
    ],
  })

  const googleWorkspaceFetch = async (urlStr, options = {}) => {
    const url = new URL(urlStr)
    if (url.hostname === 'ixqoosixhahrsgwoxyme.supabase.co') {
      return mock.fetchImpl(urlStr, options)
    }
    if (url.pathname === '/drive/v3/about') {
      return new Response(
        JSON.stringify({ user: { displayName: 'Dragoljub', emailAddress: 'dracorisz@gmail.com' } }),
        { status: 200 }
      )
    }
    if (url.hostname === 'docs.googleapis.com' && url.pathname === '/v1/documents' && options.method === 'POST') {
      const body = JSON.parse(options.body)
      return new Response(JSON.stringify({ documentId: 'doc-new-001', title: body.title }), { status: 200 })
    }
    if (url.hostname === 'docs.googleapis.com' && url.pathname.endsWith(':batchUpdate')) {
      return new Response(JSON.stringify({ documentId: 'doc-new-001', replies: [{}] }), { status: 200 })
    }
    if (url.hostname === 'docs.googleapis.com' && url.pathname === '/v1/documents/doc-new-001') {
      return new Response(
        JSON.stringify({ documentId: 'doc-new-001', title: 'Lamat Plan', body: { content: [{ endIndex: 25 }] } }),
        { status: 200 }
      )
    }
    if (url.hostname === 'sheets.googleapis.com' && url.pathname === '/v4/spreadsheets' && options.method === 'POST') {
      const body = JSON.parse(options.body)
      return new Response(
        JSON.stringify({
          spreadsheetId: 'sheet-new-001',
          properties: { title: body.properties.title },
          spreadsheetUrl: 'https://docs.google.com/spreadsheets/d/sheet-new-001/edit',
        }),
        { status: 200 }
      )
    }
    if (url.hostname === 'sheets.googleapis.com' && url.pathname.includes('/values/')) {
      return new Response(
        JSON.stringify({
          updates: { updatedRange: 'Sheet1!A1:B2', updatedRows: 2, updatedCells: 4 },
          updatedRows: 2,
          updatedCells: 4,
        }),
        { status: 200 }
      )
    }
    return new Response(JSON.stringify({ ok: true }), { status: 200 })
  }

  const createdDoc = await executeCompanionTool(
    'google_docs_create',
    { title: 'Q4 Engineering Roadmap', content: '# Roadmap\n1. Multi-model routing\n2. Google Workspace integration' },
    OWNER_USER,
    'owner-token',
    { fetchImpl: googleWorkspaceFetch, agentRole: 'supervisor' }
  )
  assert.equal(createdDoc.created, true)
  assert.equal(createdDoc.documentId, 'doc-new-001')
  assert.equal(createdDoc.authSource, 'user_oauth')

  const updatedDoc = await executeCompanionTool(
    'google_docs_write',
    { documentId: 'doc-new-001', mode: 'append', content: '3. Library rich previews' },
    OWNER_USER,
    'owner-token',
    { fetchImpl: googleWorkspaceFetch, agentRole: 'supervisor' }
  )
  assert.equal(updatedDoc.updated, true)

  const createdSheet = await executeCompanionTool(
    'google_sheets_create',
    {
      title: 'Runway & Budget Tracker',
      sheetNames: ['Overview'],
      values: [
        ['Category', 'Monthly EUR'],
        ['Essentials', '850'],
      ],
    },
    OWNER_USER,
    'owner-token',
    { fetchImpl: googleWorkspaceFetch, agentRole: 'supervisor' }
  )
  assert.equal(createdSheet.created, true)
  assert.equal(createdSheet.spreadsheetId, 'sheet-new-001')
  assert.equal(createdSheet.populatedRows, 2)

  const updatedSheet = await executeCompanionTool(
    'google_sheets_write',
    {
      spreadsheetId: 'sheet-new-001',
      range: 'Overview!A3',
      mode: 'append',
      values: [['Cloud Credits', '300']],
    },
    OWNER_USER,
    'owner-token',
    { fetchImpl: googleWorkspaceFetch, agentRole: 'supervisor' }
  )
  assert.equal(updatedSheet.updated, true)
  assert.equal(updatedSheet.updatedRows, 2)

  const integrations = await verifyAllIntegrations(
    { user: OWNER_USER, accessToken: 'owner-token' },
    { fetchImpl: googleWorkspaceFetch }
  )
  assert.equal(integrations.google_workspace.status, 'verified')
  assert.equal(integrations.google_workspace.authSource, 'user_oauth')
  assert.ok(integrations.google_workspace.capabilities.includes('google_docs_create'))
  assert.ok(integrations.google_workspace.capabilities.includes('google_sheets_write'))
})

test('20. Session title generation produces concise, non-truncated titles after first reply', () => {
  const title1 = generateSessionTitle(
    'Review my active goals, runway, and top priorities for today.',
    '### Executive Priorities & Runway Assessment\nHere is your current breakdown...'
  )
  assert.equal(title1, 'Executive Priorities & Runway Assessment')

  const title2 = generateSessionTitle(
    'Can you help me debug the Google Drive OAuth token refresh flow in Lamat?',
    'Let us inspect the token refresh logic in api/_companion-tools.js.'
  )
  assert.ok(title2.length >= 6 && title2.length <= 52)
  assert.doesNotMatch(title2, /^New chat$/i)
})
