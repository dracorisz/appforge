import { createHash } from 'node:crypto'
import {
  authenticateCompanionRequest,
  authenticateCronRequest,
  createSupabaseClient,
} from './_companion-auth.js'
import { AVAILABLE_MODELS, executeCompanionTool } from './_companion-tools.js'
import { getCachedGcpQuotaAndBillingStatus } from './_gcp-cloud-run.js'
import { loadLamatOperationalContext } from './_lamat-agents.js'
import {
  answerLamatQuestion,
  decideLamatAction,
  rateLamatTask,
  runAutonomousCycle,
  selectNextActionableTask,
} from './_lamat-engine.js'

export function buildConciseActivitySummary(context) {
  const tasks = context.tasks || []
  const pendingQuestions = context.pendingQuestions || []
  const pendingApprovals = context.pendingApprovals || []
  const budget = context.budgetStatus
  const freeMode = Boolean(budget?.config?.overnight_free_only)

  const completedTasks = tasks.filter((t) => t.status === 'completed')
  const activeTasks = tasks.filter((t) => !['completed', 'cancelled', 'failed'].includes(t.status))
  const runningTask = tasks.find((t) => ['running', 'planning', 'verifying'].includes(t.status))
  const nextTask =
    runningTask ||
    selectNextActionableTask(tasks, {
      goals: context.goals,
      budgetStatus: budget,
      preferFree: freeMode,
    }) ||
    activeTasks[0] ||
    null

  let state = 'completed'
  if (budget && !budget.can_execute && !freeMode) {
    state = budget.config?.autonomous_enabled === false ? 'paused' : 'blocked'
  } else if (runningTask) {
    state =
      runningTask.status === 'planning'
        ? 'planning'
        : runningTask.status === 'verifying'
          ? 'verifying'
          : 'executing'
  } else if (pendingQuestions.length > 0 || pendingApprovals.length > 0) {
    state = nextTask && nextTask.status === 'queued' ? 'planning' : 'waiting'
  } else if (nextTask) {
    state = 'planning'
  }

  const currentStepIdx = Number(nextTask?.current_step_index || 0)
  const totalSteps = Array.isArray(nextTask?.plan_steps) ? nextTask.plan_steps.length : 0

  return {
    state,
    currentTask: nextTask
      ? {
          id: nextTask.id,
          title: nextTask.title,
          status: nextTask.status,
          kind: nextTask.kind,
          priority: nextTask.priority,
          priorityScore: nextTask.priority_score,
          currentStepIndex: currentStepIdx,
          totalSteps,
          currentStepTitle:
            Array.isArray(nextTask.plan_steps) && nextTask.plan_steps[currentStepIdx]
              ? nextTask.plan_steps[currentStepIdx].title
              : null,
        }
      : null,
    whatWorkingOn: nextTask
      ? nextTask.title
      : pendingQuestions.length > 0
        ? `Waiting for your answer on ${pendingQuestions.length} question(s)`
        : 'All queued tasks completed; monitoring goals and resources',
    whyItMatters:
      nextTask?.rationale || 'Maintaining progress toward active financial, operational, and personal goals.',
    completedCount: completedTasks.length,
    remainingCount: activeTasks.length,
    requiresInput: pendingQuestions.length > 0,
    requiresApproval: pendingApprovals.length > 0,
    pendingQuestionsCount: pendingQuestions.length,
    pendingApprovalsCount: pendingApprovals.length,
    canExecuteAutonomously: Boolean((budget?.can_execute ?? true) || freeMode),
    overnightFreeOnly: freeMode,
    haltReason: !freeMode ? budget?.halt_reason || null : null,
  }
}

export default async function handler(req, res) {
  const requestId = crypto.randomUUID()
  res.setHeader('Cache-Control', 'no-store')
  res.setHeader('x-appforge-request-id', requestId)

  const mode = String(
    req.query?.mode || new URL(req.url || '/', 'https://lamat.local').searchParams.get('mode') || ''
  )

  if (mode === 'cron') {
    const cronAuth = authenticateCronRequest(req)
    const userAuth = !cronAuth.ok ? await authenticateCompanionRequest(req) : null
    if (!cronAuth.ok && !userAuth?.ok) {
      return res.status(401).json({ message: 'Unauthorized cron invocation.', requestId })
    }
    const token = userAuth?.accessToken || cronAuth.serviceToken || ''
    const user = userAuth?.user || { id: '4c5c0d15-467a-4e63-b2d5-f05763293af8', email: 'dracorisz@gmail.com' }

    try {
      const cycleResult = await runAutonomousCycle({
        user,
        accessToken: token,
        triggerSource: 'cron',
      })
      return res.status(200).json({ ok: true, requestId, ...cycleResult })
    } catch (error) {
      return res
        .status(500)
        .json({ ok: false, requestId, error: String(error?.message || 'Cron execution failed').slice(0, 200) })
    }
  }

  const auth = await authenticateCompanionRequest(req)
  if (!auth.ok) {
    return res.status(auth.status).json({ message: auth.message, requestId })
  }

  const db = createSupabaseClient({ token: auth.accessToken })

  if (req.method === 'GET') {
    try {
      const [context, runs, conversations, gcpStatus] = await Promise.all([
        loadLamatOperationalContext(auth.accessToken),
        db
          .select(
            'lamat_runs',
            'select=id,task_id,trigger_source,agent_role,model,provider,status,input_summary,output_summary,tool_calls,evaluation,prompt_tokens,completion_tokens,estimated_cost_usd,actual_cost_usd,cost_provenance,duration_ms,error,started_at,completed_at&order=started_at.desc&limit=20'
          )
          .catch(() => []),
        db
          .select('maya_conversations', 'select=id,title,updated_at&archived=eq.false&order=updated_at.desc&limit=10')
          .catch(() => []),
        getCachedGcpQuotaAndBillingStatus(),
      ])

      let latestMessages = []
      if (conversations[0]?.id) {
        latestMessages = await db
          .select(
            'maya_messages',
            `select=id,conversation_id,role,content,model,created_at&conversation_id=eq.${encodeURIComponent(conversations[0].id)}&order=created_at.asc&limit=50`
          )
          .catch(() => [])
      }

      const activity = buildConciseActivitySummary(context)

      return res.status(200).json({
        ok: true,
        requestId,
        identity: context.identity,
        selfModel: context.selfModel,
        persona: context.persona,
        activity,
        budget: context.budgetStatus,
        gcpStatus,
        availableModels: AVAILABLE_MODELS,
        finSummary: context.finSummary,
        goals: context.goals,
        projects: context.projects,
        tasks: context.tasks,
        questions: context.questions,
        pendingQuestions: context.pendingQuestions,
        pendingApprovals: context.pendingApprovals,
        actions: context.actions,
        memories: context.memories,
        resources: context.resources,
        libraryItems: context.libraryItems || [],
        runs,
        conversations,
        latestMessages,
      })
    } catch (error) {
      return res.status(503).json({
        ok: false,
        requestId,
        message: String(error?.message || 'Could not load Lamat operational state.').slice(0, 200),
      })
    }
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST')
    return res.status(405).json({ message: 'Method not allowed.', requestId })
  }

  const action = String(req.body?.action || '').trim()

  try {
    if (action === 'run_cycle') {
      const maxSteps = Math.max(1, Math.min(4, Number(req.body?.maxSteps || 1)))
      const targetTaskId = req.body?.taskId ? String(req.body.taskId) : null
      const preferFree = Boolean(req.body?.preferFree)
      const requestedModel = req.body?.model ? String(req.body.model).trim() : null
      const steps = []
      let lastCycle = null

      for (let i = 0; i < maxSteps; i += 1) {
        lastCycle = await runAutonomousCycle({
          user: auth.user,
          accessToken: auth.accessToken,
          triggerSource: req.body?.triggerSource === 'autonomous_cycle' ? 'autonomous_cycle' : 'manual',
          targetTaskId: i === 0 ? targetTaskId : null,
          preferFree,
          requestedModel,
        })
        steps.push(lastCycle)
        // If a task paused for input/approval during a multi-step/overnight run, continue to nextCandidateTask if available!
        if (
          !lastCycle.ok ||
          ['budget_halted', 'idle_waiting'].includes(lastCycle.cycleStatus) ||
          (['waiting_input', 'waiting_approval'].includes(lastCycle.cycleStatus) && !lastCycle.nextCandidateTask)
        ) {
          break
        }
      }

      return res.status(200).json({
        ok: true,
        requestId,
        ...lastCycle,
        cyclesExecuted: steps.length,
        cycles: steps,
      })
    }

    if (action === 'rate_task') {
      const result = await rateLamatTask({
        taskId: req.body?.taskId,
        rating: req.body?.rating,
        feedback: req.body?.feedback,
        requestRevision: Boolean(req.body?.requestRevision),
        accessToken: auth.accessToken,
      })
      return res.status(200).json({ ok: true, requestId, ...result })
    }

    if (action === 'answer_question') {
      const result = await answerLamatQuestion({
        questionId: req.body?.questionId,
        answer: req.body?.answer,
        user: auth.user,
        accessToken: auth.accessToken,
      })
      let followUpCycle = null
      if (req.body?.autoResume !== false && result.resumedTask?.status === 'queued') {
        followUpCycle = await runAutonomousCycle({
          user: auth.user,
          accessToken: auth.accessToken,
          triggerSource: 'answer_resume',
          targetTaskId: result.resumedTask.id,
        }).catch(() => null)
      }
      return res.status(200).json({ ok: true, requestId, ...result, followUpCycle })
    }

    if (action === 'decide_action') {
      const result = await decideLamatAction({
        actionId: req.body?.actionId,
        decision: req.body?.decision,
        approverNote: req.body?.approverNote,
        expectedParameterHash: req.body?.parameterHash || null,
        user: auth.user,
        accessToken: auth.accessToken,
      })
      return res.status(200).json({ ok: true, requestId, ...result })
    }

    if (action === 'create_goal') {
      const goalResult = await executeCompanionTool(
        'lamat_upsert_goal',
        {
          id: req.body?.id,
          parent_id: req.body?.parent_id,
          title: req.body?.title,
          description: req.body?.description,
          success_criteria: req.body?.success_criteria,
          priority: Number(req.body?.priority || 2),
          horizon: req.body?.horizon || 'now',
          status: req.body?.status || 'active',
          target_date: req.body?.target_date || null,
        },
        auth.user,
        auth.accessToken,
        { agentRole: 'supervisor' }
      )

      let initialTask = null
      if (req.body?.createInitialTask !== false && goalResult.created) {
        const taskRes = await executeCompanionTool(
          'lamat_create_task',
          {
            goal_id: goalResult.created,
            title: `Plan and execute: ${String(req.body?.title || '').slice(0, 180)}`,
            description: req.body?.description || '',
            rationale: `Created to advance owner goal "${String(req.body?.title || '').slice(0, 120)}".`,
            kind: 'planning',
            priority: Number(req.body?.priority || 2),
            expected_outcome: req.body?.success_criteria || 'Actionable plan executed and verified.',
            plan_steps: [
              { index: 0, title: 'Assess current state and constraints for goal', tool: 'lamat_check_budget_and_resources' },
              { index: 1, title: 'Produce deliverable plan and record verified progress', tool: 'lamat_record_memory' },
            ],
          },
          auth.user,
          auth.accessToken,
          { agentRole: 'supervisor' }
        ).catch(() => null)
        initialTask = taskRes?.task || null
      }

      return res.status(200).json({ ok: true, requestId, ...goalResult, initialTask })
    }

    if (action === 'create_task') {
      const result = await executeCompanionTool(
        'lamat_create_task',
        {
          goal_id: req.body?.goal_id || null,
          project_id: req.body?.project_id || null,
          title: req.body?.title,
          description: req.body?.description,
          rationale: req.body?.rationale || 'Explicitly created by owner.',
          kind: req.body?.kind || 'execution',
          priority: Number(req.body?.priority || 2),
          expected_outcome: req.body?.expected_outcome || 'Task objective completed and verified.',
          verification_method: req.body?.verification_method || 'Verify tool output and task state.',
          plan_steps: Array.isArray(req.body?.plan_steps)
            ? req.body.plan_steps
            : [
                {
                  index: 0,
                  title: `Execute and produce deliverable for: ${String(req.body?.title || '').slice(0, 120)}`,
                  tool: 'lamat_record_memory',
                },
              ],
          estimated_cost_usd: Number(req.body?.estimated_cost_usd || 0.01),
        },
        auth.user,
        auth.accessToken,
        { agentRole: 'supervisor' }
      )
      return res.status(200).json({ ok: true, requestId, ...result })
    }

    if (action === 'update_task_status') {
      const id = String(req.body?.id || '').trim()
      const status = String(req.body?.status || '').trim()
      if (!id || !['queued', 'paused', 'cancelled', 'completed'].includes(status)) {
        return res.status(400).json({ message: 'Valid task id and status are required.', requestId })
      }
      const patch = {
        status,
        lease_owner: null,
        lease_expires_at: null,
        ...(status === 'queued' ? { attempt_count: 0, last_error: null, blocker_reason: null } : {}),
        ...(status === 'completed' ? { completed_at: new Date().toISOString() } : {}),
      }
      const updated = await db.update('lamat_tasks', `id=eq.${encodeURIComponent(id)}`, patch)
      return res.status(200).json({ ok: true, requestId, task: updated })
    }

    if (action === 'update_budget') {
      const patch = {}
      if (typeof req.body?.autonomous_enabled === 'boolean') patch.autonomous_enabled = req.body.autonomous_enabled
      if (typeof req.body?.overnight_free_only === 'boolean') patch.overnight_free_only = req.body.overnight_free_only
      if (typeof req.body?.daily_limit_usd === 'number') patch.daily_limit_usd = Math.max(0, req.body.daily_limit_usd)
      if (typeof req.body?.task_limit_usd === 'number') patch.task_limit_usd = Math.max(0, req.body.task_limit_usd)
      if (typeof req.body?.total_credit_limit_usd === 'number')
        patch.total_credit_limit_usd = Math.max(0, req.body.total_credit_limit_usd)
      if (typeof req.body?.routine_model === 'string' && req.body.routine_model.trim())
        patch.routine_model = req.body.routine_model.trim()
      if (typeof req.body?.reasoning_model === 'string' && req.body.reasoning_model.trim())
        patch.reasoning_model = req.body.reasoning_model.trim()
      if (typeof req.body?.free_model === 'string' && req.body.free_model.trim())
        patch.free_model = req.body.free_model.trim()
      if (typeof req.body?.preferred_chat_model === 'string' && req.body.preferred_chat_model.trim())
        patch.preferred_chat_model = req.body.preferred_chat_model.trim()
      const updated = await db.update('lamat_budget_config', 'id=eq.default', patch)
      const budgetStatus = await db.rpc('lamat_budget_status').catch(() => null)
      return res.status(200).json({ ok: true, requestId, config: updated, budget: budgetStatus })
    }

    if (action === 'record_memory') {
      const result = await executeCompanionTool(
        'lamat_record_memory',
        {
          kind: req.body?.kind || 'fact',
          content: req.body?.content,
          provenance: 'stated_by_owner',
          confidence: 1.0,
          tags: Array.isArray(req.body?.tags) ? req.body.tags : [],
          supersedes_id: req.body?.supersedes_id || null,
        },
        auth.user,
        auth.accessToken,
        { agentRole: 'supervisor' }
      )
      return res.status(200).json({ ok: true, requestId, ...result })
    }

    if (action === 'archive_memory') {
      const ids = Array.isArray(req.body?.memoryIds)
        ? req.body.memoryIds
        : req.body?.memoryId
          ? [req.body.memoryId]
          : []
      const result = await executeCompanionTool(
        'lamat_manage_memories',
        { memory_ids: ids },
        auth.user,
        auth.accessToken,
        { agentRole: 'supervisor' }
      )
      return res.status(200).json({ ok: true, requestId, ...result })
    }

    if (action === 'delete_task') {
      const id = String(req.body?.id || '').trim()
      if (!id) return res.status(400).json({ message: 'Task id is required.', requestId })
      await db.delete('lamat_tasks', `id=eq.${encodeURIComponent(id)}`)
      return res.status(200).json({ ok: true, requestId, deletedId: id })
    }

    if (action === 'save_library_item') {
      const title = String(req.body?.title || req.body?.fileName || 'Uploaded file').trim().slice(0, 240)
      const fileName = String(req.body?.fileName || title).trim().slice(0, 240)
      const mimeType = String(req.body?.mimeType || 'text/plain').trim().slice(0, 120)
      const kind = ['image', 'document', 'spreadsheet'].includes(String(req.body?.kind))
        ? String(req.body.kind)
        : mimeType.startsWith('image/')
          ? 'image'
          : /\b(csv|tsv|spreadsheet|excel)\b/i.test(mimeType) || /\.(csv|tsv)$/i.test(fileName)
            ? 'spreadsheet'
            : 'document'
      const sizeBytes = Math.max(0, Number(req.body?.sizeBytes || 0))
      const thumbnailData = req.body?.thumbnailData ? String(req.body.thumbnailData).slice(0, 3_500_000) : null
      const parsedText = req.body?.parsedText ? String(req.body.parsedText).slice(0, 100_000) : null
      const created = await db.insert('lamat_library_items', {
        user_id: auth.user.id,
        title,
        file_name: fileName,
        mime_type: mimeType,
        kind,
        size_bytes: sizeBytes,
        thumbnail_data: thumbnailData,
        parsed_text: parsedText,
        metadata: req.body?.metadata && typeof req.body.metadata === 'object' ? req.body.metadata : {},
      })
      return res.status(200).json({ ok: true, requestId, item: created })
    }

    if (action === 'delete_library_item') {
      const id = String(req.body?.id || '').trim()
      if (!id) return res.status(400).json({ message: 'Library item id is required.', requestId })
      await db.delete('lamat_library_items', `id=eq.${encodeURIComponent(id)}`)
      return res.status(200).json({ ok: true, requestId, deletedId: id })
    }

    if (action === 'save_google_token') {
      const providerToken = String(req.body?.providerToken || '').trim()
      if (!providerToken) return res.status(400).json({ message: 'providerToken is required.', requestId })
      const existingRows = await db.select('user_preferences', 'select=preferences&limit=1').catch(() => [])
      const currentPrefs =
        existingRows[0]?.preferences && typeof existingRows[0].preferences === 'object'
          ? existingRows[0].preferences
          : {}
      const updatedPrefs = {
        ...currentPrefs,
        google_provider_token: providerToken,
        ...(req.body?.providerRefreshToken ? { google_provider_refresh_token: String(req.body.providerRefreshToken) } : {}),
        google_token_updated_at: new Date().toISOString(),
      }
      await db
        .insert('user_preferences', {
          user_id: auth.user.id,
          preferences: updatedPrefs,
        })
        .catch(async () => {
          await db.update('user_preferences', `user_id=eq.${encodeURIComponent(auth.user.id)}`, {
            preferences: updatedPrefs,
          })
        })
      return res.status(200).json({ ok: true, requestId, saved: true })
    }

    if (action === 'save_persona') {
      const personaName = String(req.body?.name || 'Lamat').trim().slice(0, 80)
      const personaGender = String(req.body?.gender || 'adaptive').trim().slice(0, 40)
      const userCallsign = String(req.body?.user_callsign || 'Dragoljub').trim().slice(0, 80)
      const personaObj = {
        name: personaName,
        gender: personaGender,
        user_callsign: userCallsign,
        onboarding_completed: true,
        updated_at: new Date().toISOString(),
      }

      const existingRows = await db.select('user_preferences', 'select=preferences&limit=1').catch(() => [])
      const currentPrefs =
        existingRows[0]?.preferences && typeof existingRows[0].preferences === 'object'
          ? existingRows[0].preferences
          : {}
      const updatedPrefs = { ...currentPrefs, persona: personaObj }

      await db
        .insert('user_preferences', {
          user_id: auth.user.id,
          preferences: updatedPrefs,
        })
        .catch(async () => {
          await db.update('user_preferences', `user_id=eq.${encodeURIComponent(auth.user.id)}`, {
            preferences: updatedPrefs,
          })
        })

      await db
        .insert('maya_memories', {
          kind: 'preference',
          content: `Owner configured personal operator persona: addressed as "${personaName}" with ${personaGender} presentation; user is addressed as "${userCallsign}". System engine remains Lamat.`,
          provenance: 'stated_by_owner',
          confidence: 1.0,
          tags: ['persona', 'identity'],
          created_by: 'owner',
        })
        .catch(() => {})

      return res.status(200).json({ ok: true, requestId, persona: personaObj })
    }

    if (action === 'export_continuity') {
      const continuity = await db.rpc('lamat_export_continuity')
      const serialized = JSON.stringify(continuity || {})
      const checksum = createHash('sha256').update(serialized).digest('hex')
      const snapshot = await db
        .insert('maya_snapshots', {
          label: String(req.body?.label || `lamat-continuity-${new Date().toISOString().slice(0, 10)}`),
          identity_version: 4,
          content: continuity || {},
          checksum,
          created_by: 'owner',
        })
        .catch(() => null)
      return res.status(200).json({ ok: true, requestId, checksum, snapshotId: snapshot?.id || null, continuity })
    }

    return res.status(400).json({ message: `Unsupported action: ${action || 'none'}`, requestId })
  } catch (error) {
    return res.status(400).json({
      ok: false,
      requestId,
      message: String(error?.message || 'Could not complete Lamat action.').slice(0, 220),
    })
  }
}
