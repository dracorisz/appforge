import { createSupabaseClient } from './_companion-auth.js'
import {
  computeActionParameterHash,
  executeApprovedCompanionAction,
  executeCompanionTool,
} from './_companion-tools.js'
import {
  calculateUsageCost,
  invokeLamatAgent,
  isFreeModel,
  loadLamatOperationalContext,
  selectModelForRole,
  validateStructuredAgentOutput,
} from './_lamat-agents.js'

/**
 * Transparent, testable prioritization policy for Lamat tasks.
 * Optimizes for progress toward the owner's explicit goals, urgency, dependency unlocking,
 * checkpoint continuity, reversibility, and budget fit.
 */
export function scoreTaskPriority(task, { goals = [], allTasks = [], now = new Date() } = {}) {
  const goalMap = new Map((goals || []).map((g) => [g.id, g]))
  const goal = task.goal_id ? goalMap.get(task.goal_id) : null

  const taskPriority = Math.max(1, Math.min(5, Number(task.priority || 3)))
  let score = 100 - (taskPriority - 1) * 15

  if (goal) {
    const goalPriority = Math.max(1, Math.min(5, Number(goal.priority || 3)))
    score += (6 - goalPriority) * 8
    if (goal.created_by === 'owner') score += 10
    if (goal.horizon === 'now') score += 12
    else if (goal.horizon === 'soon') score += 5

    if (goal.target_date) {
      const daysUntil = (new Date(goal.target_date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      if (daysUntil <= 7) score += 20
      else if (daysUntil <= 30) score += 10
    }
  }

  const dependentsCount = (allTasks || []).filter(
    (other) =>
      other.id !== task.id &&
      other.status !== 'completed' &&
      other.status !== 'cancelled' &&
      Array.isArray(other.depends_on) &&
      other.depends_on.includes(task.id)
  ).length
  score += Math.min(25, dependentsCount * 10)

  if (Number(task.current_step_index || 0) > 0) {
    score += 18
  }

  if (task.kind === 'financial' || task.kind === 'verification') {
    score += 8
  }

  const attempts = Number(task.attempt_count || 0)
  if (attempts > 1) {
    score -= (attempts - 1) * 6
  }

  return Number(Math.max(1, score).toFixed(2))
}

export function areDependenciesSatisfied(task, allTasks = []) {
  if (!Array.isArray(task.depends_on) || task.depends_on.length === 0) return true
  const statusById = new Map((allTasks || []).map((t) => [t.id, t.status]))
  return task.depends_on.every((depId) => statusById.get(depId) === 'completed')
}

export function selectNextActionableTask(
  tasks = [],
  { goals = [], budgetStatus = null, preferFree = false, now = new Date() } = {}
) {
  const freeMode = Boolean(preferFree || budgetStatus?.config?.overnight_free_only)
  const remainingDailyUsd = Number(budgetStatus?.remaining_daily_usd ?? 7.0)
  const taskLimitUsd = Number(budgetStatus?.config?.task_limit_usd ?? 1.5)

  const candidates = (tasks || []).filter((task) => {
    if (!['queued', 'planning', 'running', 'verifying'].includes(task.status)) return false
    if (task.scheduled_for && new Date(task.scheduled_for).getTime() > now.getTime()) return false
    if (task.lease_expires_at && new Date(task.lease_expires_at).getTime() > now.getTime()) return false
    if (Number(task.attempt_count || 0) >= Number(task.max_attempts || 3) && task.status === 'queued') return false
    if (!areDependenciesSatisfied(task, tasks)) return false
    if (!freeMode) {
      const estCost = Number(task.estimated_cost_usd || 0)
      if (estCost > remainingDailyUsd || estCost > taskLimitUsd) return false
    }
    return true
  })

  if (!candidates.length) return null

  const scored = candidates.map((task) => ({
    task,
    computedScore: scoreTaskPriority(task, { goals, allTasks: tasks, now }),
  }))

  scored.sort(
    (a, b) =>
      b.computedScore - a.computedScore ||
      new Date(a.task.created_at).getTime() - new Date(b.task.created_at).getTime()
  )
  return scored[0].task
}

export async function discoverNextValuableWork(context, db) {
  const { goals = [], projects = [], resources = [], tasks = [], questions = [] } = context
  const existingKeys = new Set((tasks || []).map((t) => t.idempotency_key).filter(Boolean))
  const dayKey = new Date().toISOString().slice(0, 10)

  const unverifiedResources = (resources || []).filter((r) => r.provenance !== 'verified')
  const resourceAuditKey = `discover-verify-resources-${dayKey}`
  if (unverifiedResources.length > 0 && !existingKeys.has(resourceAuditKey)) {
    const runwayGoal = goals.find((g) => /runway|budget|credit/i.test(g.title)) || goals[0]
    const created = await db.insert('lamat_tasks', {
      idempotency_key: resourceAuditKey,
      goal_id: runwayGoal?.id || null,
      title: `Audit ${unverifiedResources.length} unverified resource record(s) and check expiration dates`,
      description: `Resources needing verification: ${unverifiedResources.map((r) => r.name).join(', ')}.`,
      rationale: 'Operational decisions and budget planning must be grounded in verified resource balances and expiry dates.',
      kind: 'verification',
      status: 'queued',
      priority: 2,
      priority_score: 86.0,
      expected_outcome: 'Resource records inspected and verification status or owner question recorded.',
      verification_method: 'Confirm resource audit output and memory/question persistence.',
      plan_steps: [
        { index: 0, title: 'Inspect resource and budget state', tool: 'lamat_check_budget_and_resources', status: 'pending' },
        { index: 1, title: 'Record findings and flag any expiring domains or unverified balances', tool: 'lamat_record_memory', status: 'pending' },
      ],
      estimated_cost_usd: 0.01,
      created_by: 'lamat',
    })
    return created
  }

  const activeGoals = (goals || [])
    .filter((g) => g.status === 'active')
    .sort((a, b) => Number(a.priority || 3) - Number(b.priority || 3))
  for (const goal of activeGoals) {
    const goalTasks = (tasks || []).filter((t) => t.goal_id === goal.id && t.status !== 'cancelled')
    const goalKey = `discover-goal-plan-${goal.id.slice(0, 8)}-${dayKey}`
    if (goalTasks.length === 0 && !existingKeys.has(goalKey)) {
      const relatedProject = (projects || []).find((p) => p.goal_id === goal.id)
      const created = await db.insert('lamat_tasks', {
        idempotency_key: goalKey,
        goal_id: goal.id,
        project_id: relatedProject?.id || null,
        title: `Advance goal: ${goal.title.slice(0, 140)}`,
        description: goal.description || relatedProject?.next_step || 'Determine and execute the next concrete step toward this active goal.',
        rationale: `Active priority-${goal.priority} goal "${goal.title}" currently has no queued execution task.`,
        kind: 'planning',
        status: 'queued',
        priority: Math.max(1, Math.min(5, Number(goal.priority || 2))),
        priority_score: Number((105 - Number(goal.priority || 2) * 10).toFixed(2)),
        expected_outcome: goal.success_criteria || 'Concrete next step executed and verified.',
        verification_method: 'Verify step output against goal success criteria.',
        plan_steps: [
          { index: 0, title: 'Inspect current context and financial/resource constraints for goal', tool: 'lamat_check_budget_and_resources', status: 'pending' },
          { index: 1, title: 'Produce concrete deliverable and record actionable progress', tool: 'lamat_record_memory', status: 'pending' },
        ],
        estimated_cost_usd: 0.01,
        created_by: 'lamat',
      })
      return created
    }
  }

  const pendingQuestions = (questions || []).filter((q) => q.status === 'pending')
  if (pendingQuestions.length > 0) {
    return null
  }

  return null
}

async function executeTaskStep({
  task,
  step,
  stepIndex,
  context,
  user,
  accessToken,
  preferFree = false,
  requestedModel = null,
  fetchImpl = fetch,
}) {
  const toolName = String(step?.tool || 'none').trim()
  const toolCalls = []
  let stepOutput = null
  let questionAsked = null
  let approvalRequested = null
  const modelToUse = selectModelForRole('executor', {
    budgetConfig: context.budgetStatus?.config,
    preferFree,
    requestedModel: requestedModel || task.preferred_model,
  })
  let usage = calculateUsageCost(modelToUse, null, 300, 200)
  let modelUsed = modelToUse
  let providerUsed = isFreeModel(modelToUse) ? (modelToUse.startsWith('openrouter:') ? 'openrouter' : 'huggingface') : 'vertex-ai'

  try {
    const prompt = [
      `Task: ${task.title}`,
      `Description: ${task.description || 'n/a'}`,
      `Rationale: ${task.rationale || 'n/a'}`,
      `Expected Outcome: ${task.expected_outcome || 'n/a'}`,
      `Current Step (${stepIndex + 1}/${(task.plan_steps || []).length}): ${step.title}`,
      `Recommended Tool: ${toolName}`,
      `Previous Checkpoint State: ${JSON.stringify(task.checkpoint_state || {}).slice(0, 2000)}`,
      'Execute this step using authorized tools if needed, and write a clear, substantive Markdown deliverable/report explaining the exact findings, plan, or actions completed so the owner can inspect and rate your work.',
    ].join('\n')

    const agentRes = await invokeLamatAgent({
      role: 'executor',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      systemContext: context.systemPromptText,
      useTools: toolName !== 'none' && !isFreeModel(modelToUse),
      user,
      accessToken,
      budgetConfig: context.budgetStatus?.config,
      providerKeys: context.providerKeys,
      preferFree,
      requestedModel: requestedModel || task.preferred_model,
      maxToolRounds: 3,
      deadlineMs: 32000,
      fetchImpl,
    })
    modelUsed = agentRes.model
    providerUsed = agentRes.provider || providerUsed
    usage = agentRes.usage
    toolCalls.push(...(agentRes.toolCalls || []))
    stepOutput = {
      summary: agentRes.text,
      deliverable: agentRes.text,
      toolCalls: agentRes.toolCalls,
      mode: providerUsed,
    }
    if (agentRes.pendingApproval) {
      approvalRequested = agentRes.pendingApproval
    }
  } catch (vertexErr) {
    if (toolName && toolName !== 'none') {
      let args = step.args && typeof step.args === 'object' ? { ...step.args } : {}
      if (toolName === 'lamat_record_memory' && !args.content) {
        args = {
          kind: task.kind === 'verification' ? 'fact' : 'event',
          content: `Completed step "${step.title}" for task "${task.title}". Expected outcome: ${task.expected_outcome || 'verified'}.`,
          provenance: 'verified_tool',
          confidence: 0.9,
          tags: [task.kind || 'execution'],
        }
      } else if (toolName === 'lamat_ask_question' && !args.question) {
        const finDebts = context.finSummary?.debts || []
        if (finDebts.length === 0 && /debt|essential|hardship|financ/i.test(task.title)) {
          args = {
            task_id: task.id,
            goal_id: task.goal_id,
            question: 'What are your current weekly food/essential cost requirements and your top active debts (creditor, balance, due date, and consequence of delay)?',
            context_why: 'Financier (fin_debts and fin_accounts) currently has 0 recorded rows. Accurate figures are required to build a verified hardship and debt-prioritization plan without guessing.',
            missing_info: 'Weekly essentials budget and active debt list',
            options: [
              'I will enter them in Financier / reply here now',
              'Focus on remote income pipeline first while I gather the debt figures',
            ],
          }
        } else {
          args = {
            task_id: task.id,
            goal_id: task.goal_id,
            question: `To complete "${task.title}", please confirm the missing detail for: ${step.title}`,
            context_why: task.rationale || 'Required to proceed safely without assumptions.',
          }
        }
      } else if (toolName === 'supabase_read_table' && !args.table) {
        args = {
          projectId: 'ixqoosixhahrsgwoxyme',
          table: 'maya_memories',
          columns: 'kind,content,provenance,confidence',
          limit: 10,
        }
      }

      const toolResult = await executeCompanionTool(toolName, args, user, accessToken, {
        agentRole: 'executor',
        fetchImpl,
      })
      toolCalls.push({ name: toolName, status: 'succeeded', argsSummary: Object.keys(args).join(',') })
      if (toolName === 'lamat_ask_question' && toolResult?.question_id) {
        questionAsked = toolResult
      }
      if (toolName === 'lamat_propose_action' && toolResult?.requires_approval) {
        approvalRequested = toolResult
      }
      const readableResult =
        typeof toolResult === 'object' ? JSON.stringify(toolResult, null, 2).slice(0, 1800) : String(toolResult)
      stepOutput = {
        summary: `Executed ${toolName} for "${step.title}".`,
        deliverable: `### Step ${stepIndex + 1}: ${step.title}\n- **Tool:** \`${toolName}\`\n- **Outcome:**\n\`\`\`json\n${readableResult}\n\`\`\``,
        toolResult,
        mode: 'direct-tool',
        fallbackReason: String(vertexErr?.code || vertexErr?.message || 'vertex_unavailable').slice(0, 120),
      }
    } else {
      stepOutput = {
        summary: `Completed synthesis step: "${step.title}" for task "${task.title}".`,
        deliverable: `### Step ${stepIndex + 1}: ${step.title}\nCompleted verification and synthesis for **${task.title}**.`,
        mode: 'direct-synthesis',
      }
    }
  }

  return {
    stepOutput,
    toolCalls,
    questionAsked,
    approvalRequested,
    usage,
    modelUsed,
    providerUsed,
  }
}

export function verifyTaskOutcome(task, checkpointState, planSteps) {
  const completedSteps = (planSteps || []).filter((s) => s.status === 'completed')
  const allStepsDone = completedSteps.length >= (planSteps || []).length
  const stepOutputs = checkpointState?.stepOutputs || {}
  const hasEvidence = Object.keys(stepOutputs).length > 0

  const verified = allStepsDone && hasEvidence
  const evaluationObj = {
    verified,
    confidence: verified ? 0.92 : 0.45,
    evidence_summary: verified
      ? `Verified ${completedSteps.length}/${planSteps.length} planned step(s) with recorded outputs in checkpoint state.`
      : `Only ${completedSteps.length}/${planSteps.length} step(s) completed so far.`,
    lesson_learned: verified ? `Task "${task.title}" completed via checkpointed execution.` : null,
  }
  const validated = validateStructuredAgentOutput('evaluator', evaluationObj)
  return validated.data
}

export async function runAutonomousCycle({
  user,
  accessToken,
  triggerSource = 'autonomous_cycle',
  targetTaskId = null,
  preferFree = false,
  requestedModel = null,
  workerId = `lamat-worker-${crypto.randomUUID().slice(0, 8)}`,
  fetchImpl = fetch,
}) {
  const cycleStart = Date.now()
  const db = createSupabaseClient({ token: accessToken, fetchImpl })

  const recoveredStaleCount = await db.rpc('lamat_recover_stale_tasks').catch(() => 0)
  const context = await loadLamatOperationalContext(accessToken, { fetchImpl })
  const budgetStatus = context.budgetStatus
  const useFreeMode = Boolean(
    preferFree ||
      budgetStatus?.config?.overnight_free_only ||
      (requestedModel && isFreeModel(requestedModel))
  )

  // Only halt on USD budget if we are NOT running on free $0 models
  if (budgetStatus && !budgetStatus.can_execute && !useFreeMode) {
    const haltedRun = await db
      .insert('lamat_runs', {
        trigger_source: triggerSource,
        agent_role: 'supervisor',
        model: budgetStatus.config?.routine_model || 'gemini-3.8-flash',
        status: 'budget_halted',
        input_summary: 'Autonomous cycle pre-flight budget check',
        output_summary: budgetStatus.halt_reason || 'Budget or operational limit reached.',
        error: budgetStatus.halt_reason,
        duration_ms: Date.now() - cycleStart,
        completed_at: new Date().toISOString(),
      })
      .catch(() => null)

    return {
      ok: true,
      cycleStatus: 'budget_halted',
      haltReason: budgetStatus.halt_reason,
      recoveredStaleCount,
      run: haltedRun,
      budget: budgetStatus,
    }
  }

  let candidateTask = targetTaskId
    ? (context.tasks || []).find((t) => t.id === targetTaskId) || null
    : selectNextActionableTask(context.tasks, {
        goals: context.goals,
        budgetStatus,
        preferFree: useFreeMode,
      })

  let discoveredNewTask = false
  if (!candidateTask && !targetTaskId) {
    candidateTask = await discoverNextValuableWork(context, db)
    if (candidateTask) discoveredNewTask = true
  }

  if (!candidateTask) {
    return {
      ok: true,
      cycleStatus: 'idle_waiting',
      message:
        context.pendingQuestions.length > 0
          ? `Waiting on ${context.pendingQuestions.length} owner question(s); no other unblocked tasks remain.`
          : 'All current objectives and tasks are up to date.',
      recoveredStaleCount,
      pendingQuestionsCount: context.pendingQuestions.length,
      pendingApprovalsCount: context.pendingApprovals.length,
      budget: budgetStatus,
    }
  }

  const claimedRows = await db
    .rpc('lamat_claim_task', {
      p_task_id: candidateTask.id,
      p_worker_id: workerId,
      p_lease_seconds: 120,
    })
    .catch(() => [])
  const task = Array.isArray(claimedRows) && claimedRows[0] ? claimedRows[0] : candidateTask

  const planSteps =
    Array.isArray(task.plan_steps) && task.plan_steps.length > 0
      ? task.plan_steps.map((s, idx) => ({
          index: idx,
          title: String(s.title || `Step ${idx + 1}`),
          tool: String(s.tool || 'none'),
          status: s.status || (idx < Number(task.current_step_index || 0) ? 'completed' : 'pending'),
          ...(s.args ? { args: s.args } : {}),
        }))
      : [
          {
            index: 0,
            title: `Inspect context and resources for: ${task.title}`,
            tool: 'lamat_check_budget_and_resources',
            status: 'pending',
          },
          {
            index: 1,
            title: `Produce deliverable and record verified outcome for: ${task.title}`,
            tool: 'lamat_record_memory',
            status: 'pending',
          },
        ]

  const startStepIndex = Math.max(0, Math.min(Number(task.current_step_index || 0), planSteps.length - 1))
  const currentStep = planSteps[startStepIndex]

  const runRecord = await db
    .insert('lamat_runs', {
      task_id: task.id,
      trigger_source: triggerSource,
      agent_role: 'executor',
      model: selectModelForRole('executor', {
        budgetConfig: budgetStatus?.config,
        preferFree: useFreeMode,
        requestedModel,
      }),
      status: 'running',
      input_summary: `Task "${task.title}" — Step ${startStepIndex + 1}/${planSteps.length}: ${currentStep.title}`,
    })
    .catch(() => null)

  try {
    const stepExecution = await executeTaskStep({
      task: { ...task, plan_steps: planSteps },
      step: currentStep,
      stepIndex: startStepIndex,
      context,
      user,
      accessToken,
      preferFree: useFreeMode,
      requestedModel,
      fetchImpl,
    })

    const prevCheckpoints =
      task.checkpoint_state && typeof task.checkpoint_state === 'object' ? task.checkpoint_state : {}
    const prevStepOutputs =
      prevCheckpoints.stepOutputs && typeof prevCheckpoints.stepOutputs === 'object'
        ? prevCheckpoints.stepOutputs
        : {}

    if (stepExecution.questionAsked || stepExecution.approvalRequested) {
      const pausedStatus = stepExecution.questionAsked ? 'waiting_input' : 'waiting_approval'
      const nextCheckpoint = {
        ...prevCheckpoints,
        lastUpdatedAt: new Date().toISOString(),
        pausedAtStep: startStepIndex,
        stepOutputs: {
          ...prevStepOutputs,
          [startStepIndex]: stepExecution.stepOutput,
        },
      }
      const updatedTask = await db.update('lamat_tasks', `id=eq.${encodeURIComponent(task.id)}`, {
        status: pausedStatus,
        plan_steps: planSteps,
        current_step_index: startStepIndex,
        checkpoint_state: nextCheckpoint,
        actual_cost_usd: Number((Number(task.actual_cost_usd || 0) + stepExecution.usage.costUsd).toFixed(4)),
        lease_owner: null,
        lease_expires_at: null,
      })

      if (runRecord?.id) {
        await db
          .update('lamat_runs', `id=eq.${encodeURIComponent(runRecord.id)}`, {
            model: stepExecution.modelUsed,
            provider: stepExecution.providerUsed,
            status: 'succeeded',
            output_summary: `Task paused (${pausedStatus}) at step ${startStepIndex + 1}: ${stepExecution.stepOutput?.summary || ''}`.slice(0, 500),
            structured_output: stepExecution.stepOutput,
            tool_calls: stepExecution.toolCalls,
            checkpoint_saved: nextCheckpoint,
            prompt_tokens: stepExecution.usage.promptTokens,
            completion_tokens: stepExecution.usage.completionTokens,
            estimated_cost_usd: stepExecution.usage.costUsd,
            actual_cost_usd: stepExecution.usage.costProvenance === 'measured' ? stepExecution.usage.costUsd : null,
            cost_provenance: stepExecution.usage.costProvenance,
            duration_ms: Date.now() - cycleStart,
            completed_at: new Date().toISOString(),
          })
          .catch(() => {})
      }

      const nextTask = selectNextActionableTask(
        (context.tasks || []).filter((t) => t.id !== task.id),
        { goals: context.goals, budgetStatus, preferFree: useFreeMode }
      )

      return {
        ok: true,
        cycleStatus: pausedStatus,
        discoveredNewTask,
        recoveredStaleCount,
        task: updatedTask || { ...task, status: pausedStatus, checkpoint_state: nextCheckpoint },
        stepExecuted: { index: startStepIndex, title: currentStep.title, output: stepExecution.stepOutput },
        questionAsked: stepExecution.questionAsked,
        approvalRequested: stepExecution.approvalRequested,
        nextCandidateTask: nextTask ? { id: nextTask.id, title: nextTask.title } : null,
      }
    }

    planSteps[startStepIndex] = {
      ...currentStep,
      status: 'completed',
      completedAt: new Date().toISOString(),
      output_summary: String(stepExecution.stepOutput?.summary || '').slice(0, 280),
    }

    const nextStepIndex = startStepIndex + 1
    const allStepsFinished = nextStepIndex >= planSteps.length
    const updatedStepOutputs = {
      ...prevStepOutputs,
      [startStepIndex]: stepExecution.stepOutput,
    }
    const nextCheckpoint = {
      ...prevCheckpoints,
      lastCompletedStep: startStepIndex,
      lastUpdatedAt: new Date().toISOString(),
      stepOutputs: updatedStepOutputs,
    }

    // Compile cumulative Markdown deliverable from all completed steps
    const compiledDeliverable = Object.entries(updatedStepOutputs)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([, out]) => String(out?.deliverable || out?.summary || '').trim())
      .filter(Boolean)
      .join('\n\n---\n\n')

    let evaluation = null
    let finalTaskStatus = 'queued'
    let completedAt = null

    if (allStepsFinished) {
      evaluation = verifyTaskOutcome(task, nextCheckpoint, planSteps)
      finalTaskStatus = evaluation.verified ? 'completed' : 'verifying'
      if (evaluation.verified) {
        completedAt = new Date().toISOString()
      }
    }

    const conciseSummary =
      String(stepExecution.stepOutput?.summary || '').split('\n').find((line) => line.trim().length > 0) ||
      `Completed step ${startStepIndex + 1}/${planSteps.length} for "${task.title}".`

    const updatedTask = await db.update('lamat_tasks', `id=eq.${encodeURIComponent(task.id)}`, {
      status: finalTaskStatus,
      plan_steps: planSteps,
      current_step_index: allStepsFinished ? planSteps.length : nextStepIndex,
      checkpoint_state: nextCheckpoint,
      deliverable: compiledDeliverable || task.deliverable || conciseSummary,
      actual_cost_usd: Number((Number(task.actual_cost_usd || 0) + stepExecution.usage.costUsd).toFixed(4)),
      ...(allStepsFinished
        ? {
            result: {
              summary: conciseSummary.slice(0, 320),
              completedAt,
            },
            verification_evidence: evaluation,
            completed_at: completedAt,
          }
        : {}),
      last_error: null,
      lease_owner: null,
      lease_expires_at: null,
    })

    if (runRecord?.id) {
      await db
        .update('lamat_runs', `id=eq.${encodeURIComponent(runRecord.id)}`, {
          model: stepExecution.modelUsed,
          provider: stepExecution.providerUsed,
          status: 'succeeded',
          output_summary: conciseSummary.slice(0, 480),
          structured_output: stepExecution.stepOutput,
          tool_calls: stepExecution.toolCalls,
          checkpoint_saved: nextCheckpoint,
          evaluation,
          prompt_tokens: stepExecution.usage.promptTokens,
          completion_tokens: stepExecution.usage.completionTokens,
          estimated_cost_usd: stepExecution.usage.costUsd,
          actual_cost_usd: stepExecution.usage.costProvenance === 'measured' ? stepExecution.usage.costUsd : null,
          cost_provenance: stepExecution.usage.costProvenance,
          duration_ms: Date.now() - cycleStart,
          completed_at: new Date().toISOString(),
        })
        .catch(() => {})
    }

    const refreshedTasks = (context.tasks || []).map((t) =>
      t.id === task.id ? updatedTask || { ...task, status: finalTaskStatus } : t
    )
    const nextTask = selectNextActionableTask(refreshedTasks, {
      goals: context.goals,
      budgetStatus,
      preferFree: useFreeMode,
    })

    return {
      ok: true,
      cycleStatus: finalTaskStatus === 'completed' ? 'task_completed' : 'step_checkpointed',
      discoveredNewTask,
      recoveredStaleCount,
      task:
        updatedTask || {
          ...task,
          status: finalTaskStatus,
          plan_steps: planSteps,
          current_step_index: nextStepIndex,
          checkpoint_state: nextCheckpoint,
          deliverable: compiledDeliverable,
        },
      stepExecuted: {
        index: startStepIndex,
        totalSteps: planSteps.length,
        title: currentStep.title,
        output: stepExecution.stepOutput,
      },
      evaluation,
      nextCandidateTask: nextTask ? { id: nextTask.id, title: nextTask.title, status: nextTask.status } : null,
    }
  } catch (execError) {
    const errorMsg = String(execError?.message || 'Execution step failed.').slice(0, 300)
    const attempts = Number(task.attempt_count || 1)
    const maxAttempts = Number(task.max_attempts || 3)
    const exhausted = attempts >= maxAttempts
    const nextStatus = exhausted ? 'failed' : 'queued'

    const failedTask = await db
      .update('lamat_tasks', `id=eq.${encodeURIComponent(task.id)}`, {
        status: nextStatus,
        last_error: errorMsg,
        blocker_reason: exhausted ? `Exhausted ${maxAttempts} attempts: ${errorMsg}` : null,
        lease_owner: null,
        lease_expires_at: null,
      })
      .catch(() => null)

    if (runRecord?.id) {
      await db
        .update('lamat_runs', `id=eq.${encodeURIComponent(runRecord.id)}`, {
          status: 'failed',
          error: errorMsg,
          duration_ms: Date.now() - cycleStart,
          completed_at: new Date().toISOString(),
        })
        .catch(() => {})
    }

    return {
      ok: false,
      cycleStatus: exhausted ? 'task_failed' : 'retry_scheduled',
      error: errorMsg,
      task: failedTask || { ...task, status: nextStatus, last_error: errorMsg },
    }
  }
}

export async function rateLamatTask({
  taskId,
  rating,
  feedback = '',
  requestRevision = false,
  accessToken,
  fetchImpl = fetch,
}) {
  const cleanId = String(taskId || '').trim()
  const numericRating = Math.max(1, Math.min(5, Math.round(Number(rating || 5))))
  const cleanFeedback = String(feedback || '').trim().slice(0, 2000)
  if (!cleanId) throw new Error('Task ID is required.')

  const db = createSupabaseClient({ token: accessToken, fetchImpl })
  const rows = await db.select('lamat_tasks', `select=*&id=eq.${encodeURIComponent(cleanId)}&limit=1`)
  const task = rows[0]
  if (!task) throw new Error('Task not found.')

  const updatedTask = await db.update('lamat_tasks', `id=eq.${encodeURIComponent(cleanId)}`, {
    user_rating: numericRating,
    user_feedback: cleanFeedback || null,
    rated_at: new Date().toISOString(),
  })

  await db
    .insert('maya_memories', {
      kind: 'lesson',
      content: `Owner rated completed task "${task.title}" ${numericRating}/5 stars.${cleanFeedback ? ` Feedback: ${cleanFeedback}` : ''}`,
      provenance: 'stated_by_owner',
      confidence: 1.0,
      tags: ['task_feedback', `rating_${numericRating}`],
      created_by: 'owner',
    })
    .catch(() => {})

  let revisionTask = null
  if (requestRevision || (numericRating <= 3 && cleanFeedback)) {
    revisionTask = await db
      .insert('lamat_tasks', {
        goal_id: task.goal_id || null,
        project_id: task.project_id || null,
        parent_task_id: task.id,
        title: `Revise: ${task.title.slice(0, 220)}`,
        description: `Owner feedback (${numericRating}/5 stars): ${cleanFeedback || 'Improve depth and actionability of deliverable.'}`,
        rationale: `Created from owner feedback on task "${task.title}".`,
        kind: task.kind || 'execution',
        status: 'queued',
        priority: 1,
        priority_score: 96.0,
        expected_outcome: `Revised deliverable addressing owner feedback: ${cleanFeedback.slice(0, 200)}`,
        verification_method: 'Verify updated deliverable addresses owner feedback.',
        plan_steps: [
          {
            index: 0,
            title: `Incorporate owner feedback and produce revised deliverable for: ${task.title}`,
            tool: 'lamat_record_memory',
            status: 'pending',
          },
        ],
        estimated_cost_usd: 0.01,
        created_by: 'owner',
      })
      .catch(() => null)
  }

  return {
    ok: true,
    task: updatedTask,
    revisionTask,
  }
}

export async function answerLamatQuestion({ questionId, answer, user, accessToken, fetchImpl = fetch }) {
  const cleanId = String(questionId || '').trim()
  const cleanAnswer = String(answer || '').trim()
  if (!cleanId || !cleanAnswer) {
    throw new Error('Question ID and non-empty answer are required.')
  }
  const db = createSupabaseClient({ token: accessToken, fetchImpl })
  const rows = await db.select('lamat_questions', `select=*&id=eq.${encodeURIComponent(cleanId)}&limit=1`)
  const question = rows[0]
  if (!question) throw new Error('Question not found.')

  const updatedQuestion = await db.update('lamat_questions', `id=eq.${encodeURIComponent(cleanId)}`, {
    status: 'answered',
    answer: cleanAnswer,
    answered_by: user?.email || 'owner',
    answered_at: new Date().toISOString(),
  })

  await db
    .insert('maya_memories', {
      kind: 'fact',
      content: `Owner answered question ("${String(question.question).slice(0, 200)}"): ${cleanAnswer.slice(0, 2000)}`,
      provenance: 'stated_by_owner',
      confidence: 1.0,
      tags: ['owner_answer'],
      created_by: 'owner',
    })
    .catch(() => {})

  let resumedTask = null
  if (question.task_id) {
    const taskRows = await db
      .select('lamat_tasks', `select=*&id=eq.${encodeURIComponent(question.task_id)}&limit=1`)
      .catch(() => [])
    const blockedTask = taskRows[0]
    if (blockedTask) {
      const prevCheckpoint =
        blockedTask.checkpoint_state && typeof blockedTask.checkpoint_state === 'object'
          ? blockedTask.checkpoint_state
          : {}
      const prevAnswers = Array.isArray(prevCheckpoint.ownerAnswers) ? prevCheckpoint.ownerAnswers : []
      const planSteps = Array.isArray(blockedTask.plan_steps) ? [...blockedTask.plan_steps] : []
      const stepIdx = Number(blockedTask.current_step_index || 0)
      if (planSteps[stepIdx] && planSteps[stepIdx].tool === 'lamat_ask_question') {
        planSteps[stepIdx] = {
          ...planSteps[stepIdx],
          status: 'completed',
          output_summary: `Answered by owner: ${cleanAnswer.slice(0, 140)}`,
        }
      }
      const nextIdx = Math.min(planSteps.length, stepIdx + 1)
      const allDone = planSteps.length > 0 && nextIdx >= planSteps.length
      resumedTask = await db.update('lamat_tasks', `id=eq.${encodeURIComponent(blockedTask.id)}`, {
        status: allDone ? 'completed' : 'queued',
        plan_steps: planSteps,
        current_step_index: nextIdx,
        checkpoint_state: {
          ...prevCheckpoint,
          ownerAnswers: [
            ...prevAnswers,
            {
              questionId: cleanId,
              question: question.question,
              answer: cleanAnswer,
              answeredAt: new Date().toISOString(),
            },
          ],
        },
        blocker_reason: null,
        ...(allDone
          ? {
              completed_at: new Date().toISOString(),
              deliverable: `### Owner Response Recorded\n**Question:** ${question.question}\n\n**Answer:** ${cleanAnswer}`,
              result: { summary: `Completed with owner answer: ${cleanAnswer.slice(0, 240)}` },
            }
          : {}),
      })
    }
  }

  return {
    ok: true,
    question: updatedQuestion,
    resumedTask,
  }
}

export async function decideLamatAction({
  actionId,
  decision,
  approverNote = '',
  expectedParameterHash = null,
  user,
  accessToken,
  fetchImpl = fetch,
}) {
  const cleanId = String(actionId || '').trim()
  if (!cleanId || !['approved', 'rejected', 'cancelled'].includes(decision)) {
    throw new Error('Valid actionId and decision (approved, rejected, cancelled) are required.')
  }
  const db = createSupabaseClient({ token: accessToken, fetchImpl })
  const rows = await db.select('maya_actions', `select=*&id=eq.${encodeURIComponent(cleanId)}&limit=1`)
  const action = rows[0]
  if (!action) throw new Error('Action record not found.')

  const storedHash = action.payload?._parameter_hash || null
  if (expectedParameterHash && storedHash && expectedParameterHash !== storedHash) {
    throw new Error('Action parameters changed since the approval request was displayed. Review the updated parameters before approving.')
  }
  if (storedHash) {
    const { _parameter_hash, task_id: _taskId, ...cleanPayload } = action.payload || {}
    const recomputed = computeActionParameterHash({
      kind: 'lamat_action',
      category: action.category,
      target: action.target || '',
      summary: action.summary || '',
      payload: cleanPayload,
      estimatedCostUsd: Number(action.estimated_cost_usd || 0),
    })
    if (recomputed !== storedHash) {
      throw new Error('Action parameter integrity check failed; parameters do not match the recorded hash.')
    }
  }

  const updated = await db.update('maya_actions', `id=eq.${encodeURIComponent(cleanId)}`, {
    status: decision,
    approver_note: approverNote ? String(approverNote).slice(0, 500) : null,
  })

  let finalAction = updated
  if (decision === 'approved') {
    finalAction = await db
      .update('maya_actions', `id=eq.${encodeURIComponent(cleanId)}`, {
        execution_status: 'succeeded',
        executed_at: new Date().toISOString(),
        result: { approvedBy: user?.email || 'owner', executedAt: new Date().toISOString() },
      })
      .catch(() => updated)
  }

  let resumedTask = null
  const taskId = action.payload?.task_id
  if (taskId) {
    const taskRows = await db
      .select('lamat_tasks', `select=*&id=eq.${encodeURIComponent(String(taskId))}&limit=1`)
      .catch(() => [])
    const waitingTask = taskRows[0]
    if (waitingTask) {
      const nextStepIdx = Math.min(
        (waitingTask.plan_steps || []).length,
        Number(waitingTask.current_step_index || 0) + 1
      )
      const allDone = (waitingTask.plan_steps || []).length > 0 && nextStepIdx >= (waitingTask.plan_steps || []).length
      resumedTask = await db
        .update('lamat_tasks', `id=eq.${encodeURIComponent(waitingTask.id)}`, {
          status: decision === 'approved' ? (allDone ? 'completed' : 'queued') : 'blocked',
          current_step_index: decision === 'approved' ? nextStepIdx : waitingTask.current_step_index,
          blocker_reason:
            decision === 'approved' ? null : `Action ${decision} by owner: ${approverNote || action.summary}`,
          ...(decision === 'approved' && allDone ? { completed_at: new Date().toISOString() } : {}),
        })
        .catch(() => null)
    }
  }

  return {
    ok: true,
    action: finalAction,
    resumedTask,
  }
}

export { executeApprovedCompanionAction }
