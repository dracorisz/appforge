import { createHmac, timingSafeEqual } from 'node:crypto'
import { COMPANION_SUPABASE_URL, COMPANION_SUPABASE_KEY } from './_companion-auth.js'

const GITHUB_API = 'https://api.github.com'
const VERCEL_API = 'https://api.vercel.com'
const SUPABASE_API = 'https://api.supabase.com'
const DEFAULT_REPO = 'dracorisz/appforge'
const DEFAULT_VERCEL_PROJECT = 'prj_duzco4XEzLRNCPs3n0VkWpRDusZq'
const DEFAULT_VERCEL_TEAM_ID = 'team_w5zHVgvHs060CuaxQt23OSyr'
const DEFAULT_SUPABASE_PROJECT = 'ixqoosixhahrsgwoxyme'
const MAX_TOOL_TEXT = 24000
const REQUEST_TIMEOUT = 7000

const splitAllowlist = (name, fallback) => {
  const values = String(process.env[name] || fallback).split(',').map((value) => value.trim()).filter(Boolean)
  return new Set(values)
}
const allowedRepos = () => splitAllowlist('COMPANION_ALLOWED_REPOSITORIES', DEFAULT_REPO)
const allowedVercelProjects = () => splitAllowlist('COMPANION_ALLOWED_VERCEL_PROJECTS', DEFAULT_VERCEL_PROJECT)
const allowedSupabaseProjects = () => splitAllowlist('COMPANION_ALLOWED_SUPABASE_PROJECTS', DEFAULT_SUPABASE_PROJECT)

const githubHeaders = () => ({
  Authorization: 'Bearer ' + String(process.env.GITHUB_TOKEN || ''),
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
  'Content-Type': 'application/json',
})
const fetchJson = async (url, options = {}) => {
  const response = await fetch(url, { ...options, signal: AbortSignal.timeout(REQUEST_TIMEOUT) })
  const body = await response.json().catch(() => ({}))
  if (!response.ok) {
    const message = String(body?.message || body?.error || 'Remote service request failed.').replace(/[\r\n\t]+/g, ' ').slice(0, 180)
    const error = new Error(message)
    error.status = response.status
    throw error
  }
  return body
}
const requireToken = (name, label) => {
  const token = String(process.env[name] || '').trim()
  if (!token) throw new Error(label + ' integration is not configured.')
  return token
}
const parseRepo = (value) => {
  const repository = String(value || '').trim()
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository) || !allowedRepos().has(repository)) {
    throw new Error('Repository is not in Companion’s allowed-repository list.')
  }
  return repository
}
const safePath = (value) => {
  const path = String(value || '').trim().replace(/^\/+/, '')
  if (!path || path.length > 240 || path.split('/').some((part) => !part || part === '.' || part === '..') || /[\u0000-\u001f\\]/.test(path)) {
    throw new Error('File path is invalid.')
  }
  if (/(^|\/)\.env(?:\.|$)|(^|\/)\.npmrc$|(^|\/)\.pypirc$|(^|\/)\.vercel(\/|$)|(^|\/)id_rsa(?:$|\.)|(^|\/).*\.pem$|(^|\/).*\.key$/i.test(path)) {
    throw new Error('Reading or editing secret/configuration files is blocked.')
  }
  return path
}
const isProtectedWritePath = (path) => (
  path === 'api/_companion-auth.js' ||
  path === 'api/_companion-tools.js' ||
  path === 'api/_companion-chat.js' ||
  path === 'api/companion.js' ||
  path === 'vercel.json' ||
  path === 'SECURITY.md' ||
  path.startsWith('.github/workflows/') ||
  path.startsWith('supabase/migrations/')
)
const githubUrl = (repository, path = '') => GITHUB_API + '/repos/' + repository + '/contents' + (path ? '/' + path.split('/').map(encodeURIComponent).join('/') : '')
const githubGetFile = async (repository, path) => fetchJson(githubUrl(repository, path), { headers: githubHeaders() })
const redactSecrets = (value) => String(value)
  .replace(/gh[pousr]_[A-Za-z0-9_]{20,}|github_pat_[A-Za-z0-9_]{20,}|AIza[0-9A-Za-z_-]{30,}|sb_secret_[A-Za-z0-9_-]+|AKIA[A-Z0-9]{16}|sk_(?:live|test)_[A-Za-z0-9]{20,}|xox[baprs]-[A-Za-z0-9-]{10,}|eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}/g, '[REDACTED_SECRET]')
  .replace(/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----[\s\S]*?-----END (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g, '[REDACTED_PRIVATE_KEY]')
const hasLikelySecret = (value) => /gh[pousr]_[A-Za-z0-9_]{20,}|github_pat_[A-Za-z0-9_]{20,}|AIza[0-9A-Za-z_-]{30,}|sb_secret_[A-Za-z0-9_-]+|AKIA[A-Z0-9]{16}|sk_(?:live|test)_[A-Za-z0-9]{20,}|xox[baprs]-[A-Za-z0-9-]{10,}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/.test(String(value))
const decodeFile = (file) => {
  if (file.type !== 'file' || typeof file.content !== 'string' || file.size > 500000) throw new Error('Only text files up to 500 KB can be read.')
  return redactSecrets(Buffer.from(file.content.replace(/\s/g, ''), 'base64').toString('utf8'))
}
const requireRepoMetadata = async (repository) => fetchJson(GITHUB_API + '/repos/' + repository, { headers: githubHeaders() })

const toolDeclarations = [
  { name: 'github_list_files', description: 'List files and folders in an allowed GitHub repository path. Use to discover project structure.', parameters: { type: 'OBJECT', properties: { repository: { type: 'STRING', description: 'Repository in owner/name format.' }, path: { type: 'STRING', description: 'Optional directory path; omit for repository root.' } }, required: ['repository'] } },
  { name: 'github_read_file', description: 'Read a text source or documentation file from an allowed GitHub repository. Never use for secrets or environment files.', parameters: { type: 'OBJECT', properties: { repository: { type: 'STRING' }, path: { type: 'STRING' } }, required: ['repository', 'path'] } },
  { name: 'github_search_code', description: 'Search filenames and code in an allowed GitHub repository. Returns matching paths and URLs.', parameters: { type: 'OBJECT', properties: { repository: { type: 'STRING' }, query: { type: 'STRING', description: 'Short code or filename search phrase.' } }, required: ['repository', 'query'] } },
  { name: 'github_run_release_checks', description: 'Run AppForge’s fixed, non-deploying release verification workflow on main. It runs audit, lint, typecheck, tests, and build; it cannot deploy anything.', parameters: { type: 'OBJECT', properties: { repository: { type: 'STRING', description: 'Must be dracorisz/appforge.' } }, required: ['repository'] } },
  { name: 'github_get_release_check_status', description: 'Read the latest AppForge release-verification workflow result. A queued or in-progress run is not a pass.', parameters: { type: 'OBJECT', properties: { repository: { type: 'STRING', description: 'Must be dracorisz/appforge.' } }, required: ['repository'] } },
  { name: 'github_propose_file_change', description: 'Prepare a GitHub file create/update on the repository default branch. This NEVER writes immediately: it returns a pending approval for the owner to review and explicitly approve.', parameters: { type: 'OBJECT', properties: { repository: { type: 'STRING' }, path: { type: 'STRING' }, content: { type: 'STRING', description: 'Complete replacement file content or new file content.' }, summary: { type: 'STRING', description: 'Concise commit message describing the change.' } }, required: ['repository', 'path', 'content', 'summary'] } },
  { name: 'vercel_list_deployments', description: 'Inspect recent deployments for an allowed Vercel project. Read-only; Companion must not deploy, promote, or roll back.', parameters: { type: 'OBJECT', properties: { projectId: { type: 'STRING', description: 'Allowed Vercel project ID.' }, target: { type: 'STRING', enum: ['production', 'preview'], description: 'Optional deployment target.' }, limit: { type: 'INTEGER', description: 'Optional result count from 1 to 10.' } }, required: ['projectId'] } },
  { name: 'vercel_get_deployment', description: 'Inspect a specific deployment by ID or URL. Read-only; do not deploy or promote.', parameters: { type: 'OBJECT', properties: { deploymentIdOrUrl: { type: 'STRING' } }, required: ['deploymentIdOrUrl'] } },
  { name: 'supabase_list_tables', description: 'List tables, columns, and relationships for an allowed Supabase project using a read-only schema query.', parameters: { type: 'OBJECT', properties: { projectId: { type: 'STRING', description: 'Allowed Supabase project reference.' }, schema: { type: 'STRING', description: 'Optional schema name; defaults to public.' } }, required: ['projectId'] } },
  { name: 'supabase_read_table', description: 'Read a limited number of rows from a public Supabase table through PostgREST using the owner’s authenticated session, so Supabase Row Level Security applies. GET-only; no arbitrary SQL or mutations.', parameters: { type: 'OBJECT', properties: { projectId: { type: 'STRING' }, table: { type: 'STRING', description: 'Table name in the public schema.' }, columns: { type: 'STRING', description: 'Optional comma-separated column names; defaults to *.' }, limit: { type: 'INTEGER', description: 'Optional row limit from 1 to 50.' }, filters: { type: 'ARRAY', items: { type: 'OBJECT', properties: { column: { type: 'STRING' }, operator: { type: 'STRING', enum: ['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'is', 'like', 'ilike'] }, value: { type: 'STRING' } }, required: ['column', 'operator', 'value'] } } }, required: ['projectId', 'table'] } },
]

export const companionTools = [{ functionDeclarations: toolDeclarations }]

const isPrivilegedSupabaseKey = (value) => {
  const key = String(value || '')
  if (key.startsWith('sb_secret_')) return true
  const parts = key.split('.')
  if (parts.length !== 3) return false
  try { return JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8')).role === 'service_role' } catch { return false }
}
const supabaseTableRead = async (projectId, args, accessToken) => {
  const project = String(projectId || '').trim()
  if (!allowedSupabaseProjects().has(project)) throw new Error('Supabase project is not in Companion’s allowed-project list.')
  const baseUrl = new URL(COMPANION_SUPABASE_URL)
  if (baseUrl.hostname.split('.')[0] !== project) throw new Error('The selected Supabase project does not match the configured authenticated data endpoint.')
  if (!COMPANION_SUPABASE_KEY || isPrivilegedSupabaseKey(COMPANION_SUPABASE_KEY)) throw new Error('Safe table reads require a Supabase publishable/anon key, not a service-role or secret key.')
  if (!String(accessToken || '').trim()) throw new Error('The owner session is required for a row-level-security-protected read.')
  const table = String(args.table || '').trim()
  if (!/^[a-zA-Z_][a-zA-Z0-9_]{0,62}$/.test(table)) throw new Error('Table name is invalid.')
  const columns = String(args.columns || '*').trim()
  const columnList = columns === '*' ? '*' : columns.split(',').map((item) => item.trim()).join(',')
  if (columnList !== '*' && (!columnList || columnList.split(',').length > 12 || columnList.split(',').some((item) => !/^[a-zA-Z_][a-zA-Z0-9_]{0,62}$/.test(item)))) throw new Error('Columns must be * or a comma-separated list of up to 12 simple column names.')
  const filters = args.filters === undefined ? [] : args.filters
  if (!Array.isArray(filters) || filters.length > 5) throw new Error('At most five simple filters are allowed.')
  const url = new URL('/rest/v1/' + encodeURIComponent(table), baseUrl.origin)
  url.searchParams.set('select', columnList)
  url.searchParams.set('limit', String(Math.max(1, Math.min(50, Number(args.limit) || 20))))
  const operators = new Set(['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'is', 'like', 'ilike'])
  for (const filter of filters) {
    if (!filter || !/^[a-zA-Z_][a-zA-Z0-9_]{0,62}$/.test(String(filter.column || '')) || !operators.has(String(filter.operator || ''))) throw new Error('A filter column or operator is invalid.')
    const value = String(filter.value ?? '')
    if (!value || value.length > 200 || !/^[A-Za-z0-9 _@.:+\-/%]+$/.test(value)) throw new Error('Filter values may contain only simple text, numbers, and basic pattern characters.')
    if (filter.operator === 'is' && !['null', 'true', 'false'].includes(value.toLowerCase())) throw new Error('The is operator supports only null, true, or false.')
    url.searchParams.set(String(filter.column), String(filter.operator) + '.' + value)
  }
  return fetchJson(url.toString(), {
    headers: {
      apikey: COMPANION_SUPABASE_KEY,
      Authorization: 'Bearer ' + String(accessToken),
      Accept: 'application/json',
      'Accept-Profile': 'public',
    },
  })
}
const supabaseQuery = async (projectId, query) => {
  const project = String(projectId || '').trim()
  if (!allowedSupabaseProjects().has(project)) throw new Error('Supabase project is not in Companion’s allowed-project list.')
  const token = requireToken('SUPABASE_ACCESS_TOKEN', 'Supabase')
  return fetchJson(SUPABASE_API + '/v1/projects/' + encodeURIComponent(project) + '/database/query', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  })
}
const trimResult = (value) => {
  const text = JSON.stringify(value)
  return text.length > MAX_TOOL_TEXT ? text.slice(0, MAX_TOOL_TEXT) + '… [result truncated]' : value
}
const signApproval = (payload) => {
  const secret = String(process.env.COMPANION_ACTION_SECRET || '')
  if (secret.length < 32) throw new Error('File changes are disabled until a dedicated COMPANION_ACTION_SECRET of at least 32 characters is configured.')
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const signature = createHmac('sha256', secret).update(encoded).digest('base64url')
  return encoded + '.' + signature
}
const verifyApproval = (token) => {
  const secret = String(process.env.COMPANION_ACTION_SECRET || '')
  if (secret.length < 32) throw new Error('File changes are disabled until COMPANION_ACTION_SECRET is configured.')
  const parts = String(token || '').split('.')
  if (parts.length !== 2) throw new Error('Approval token is invalid or expired.')
  const expected = createHmac('sha256', secret).update(parts[0]).digest()
  let supplied
  try { supplied = Buffer.from(parts[1], 'base64url') } catch { throw new Error('Approval token is invalid or expired.') }
  if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) throw new Error('Approval token is invalid or expired.')
  let payload
  try { payload = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8')) } catch { throw new Error('Approval token is invalid or expired.') }
  if (!payload || payload.expiresAt < Date.now() || payload.expiresAt > Date.now() + 6 * 60 * 1000) throw new Error('Approval token is invalid or expired.')
  return payload
}
const createPendingApproval = (action, user) => {
  const payload = { version: 1, userId: String(user.id), expiresAt: Date.now() + 5 * 60 * 1000, nonce: crypto.randomUUID(), action }
  const token = signApproval(payload)
  return {
    text: 'This file change is prepared but has not been applied. Review the exact repository, path, and commit summary before approving.',
    pendingApproval: {
      token,
      repository: action.repository,
      path: action.path,
      operation: action.operation,
      summary: action.summary,
      preview: action.content,
      expiresAt: payload.expiresAt,
    },
  }
}

export async function executeCompanionTool(name, args, user, accessToken) {
  if (!args || typeof args !== 'object' || Array.isArray(args)) throw new Error('Tool arguments must be an object.')
  if (name === 'github_list_files') {
    const repository = parseRepo(args.repository)
    const path = args.path ? safePath(args.path) : ''
    const result = await fetchJson(githubUrl(repository, path), { headers: githubHeaders() })
    const entries = Array.isArray(result) ? result : [result]
    return trimResult(entries.slice(0, 120).map((entry) => ({ name: entry.name, path: entry.path, type: entry.type, size: entry.size, url: entry.html_url })))
  }
  if (name === 'github_read_file') {
    const repository = parseRepo(args.repository)
    const path = safePath(args.path)
    const file = await githubGetFile(repository, path)
    return { repository, path, sha: file.sha, content: decodeFile(file).slice(0, MAX_TOOL_TEXT) }
  }
  if (name === 'github_search_code') {
    const repository = parseRepo(args.repository)
    const query = String(args.query || '').trim().slice(0, 120)
    if (query.length < 2) throw new Error('Search query must contain at least two characters.')
    requireToken('GITHUB_TOKEN', 'GitHub')
    const url = GITHUB_API + '/search/code?q=' + encodeURIComponent(query + ' repo:' + repository) + '&per_page=8'
    const result = await fetchJson(url, { headers: { ...githubHeaders(), Accept: 'application/vnd.github.text-match+json' } })
    return { total: result.total_count || 0, matches: (result.items || []).slice(0, 8).map((item) => ({ path: item.path, url: item.html_url, repository: item.repository?.full_name })) }
  }
  if (name === 'github_run_release_checks') {
    const repository = parseRepo(args.repository)
    if (repository !== DEFAULT_REPO) throw new Error('The release-verification workflow is configured only for dracorisz/appforge.')
    requireToken('GITHUB_TOKEN', 'GitHub')
    const workflowUrl = 'https://github.com/' + repository + '/actions/workflows/companion-verify.yml'
    await fetchJson(GITHUB_API + '/repos/' + repository + '/actions/workflows/companion-verify.yml/dispatches', {
      method: 'POST',
      headers: githubHeaders(),
      body: JSON.stringify({ ref: 'main' }),
    })
    return { status: 'dispatched', ref: 'main', workflowUrl, message: 'Release verification was requested. Check the workflow status before claiming it passed.' }
  }
  if (name === 'github_get_release_check_status') {
    const repository = parseRepo(args.repository)
    if (repository !== DEFAULT_REPO) throw new Error('The release-verification workflow is configured only for dracorisz/appforge.')
    requireToken('GITHUB_TOKEN', 'GitHub')
    const result = await fetchJson(GITHUB_API + '/repos/' + repository + '/actions/workflows/companion-verify.yml/runs?branch=main&per_page=5', { headers: githubHeaders() })
    const run = (result.workflow_runs || [])[0]
    if (!run) return { status: 'not_found', message: 'No release-verification run was found yet.' }
    return {
      id: run.id,
      status: run.status,
      conclusion: run.conclusion,
      url: run.html_url,
      createdAt: run.created_at,
      updatedAt: run.updated_at,
      headBranch: run.head_branch,
      headSha: run.head_sha,
      event: run.event,
    }
  }
  if (name === 'github_propose_file_change') {
    const repository = parseRepo(args.repository)
    const path = safePath(args.path)
    const content = String(args.content ?? '')
    const summary = String(args.summary || '').trim().replace(/[\r\n\t]+/g, ' ').slice(0, 120)
    if (!content || content.length > 100000) throw new Error('Proposed file content must be between 1 and 100,000 characters.')
    if (hasLikelySecret(content)) throw new Error('The proposed file content resembles a credential or private key. Remove it before requesting approval.')
    if (!summary) throw new Error('A concise commit summary is required.')
    if (isProtectedWritePath(path)) throw new Error('Companion cannot modify its own safety controls, deployment configuration, workflows, security policy, or database migrations through its tool interface.')
    requireToken('GITHUB_TOKEN', 'GitHub')
    const metadata = await requireRepoMetadata(repository)
    if (metadata.archived || metadata.disabled) throw new Error('Archived or disabled repositories cannot be modified.')
    let existing = null
    try { existing = await githubGetFile(repository, path) } catch (error) { if (error.status !== 404) throw error }
    if (existing && existing.type !== 'file') throw new Error('The target path is not a file.')
    const action = { kind: 'github_file_write', repository, path, content, summary, operation: existing ? 'update' : 'create', expectedSha: existing?.sha || null, defaultBranch: metadata.default_branch }
    return createPendingApproval(action, user)
  }
  if (name === 'vercel_list_deployments') {
    const projectId = String(args.projectId || '').trim()
    if (!allowedVercelProjects().has(projectId)) throw new Error('Vercel project is not in Companion’s allowed-project list.')
    const token = requireToken('VERCEL_API_TOKEN', 'Vercel')
    const params = new URLSearchParams({ projectId, limit: String(Math.max(1, Math.min(10, Number(args.limit) || 5)) ) })
    if (args.target === 'production' || args.target === 'preview') params.set('target', args.target)
    const teamId = String(process.env.VERCEL_TEAM_ID || DEFAULT_VERCEL_TEAM_ID).trim()
    if (teamId) params.set('teamId', teamId)
    const result = await fetchJson(VERCEL_API + '/v6/deployments?' + params.toString(), { headers: { Authorization: 'Bearer ' + token } })
    return trimResult((result.deployments || []).map((item) => ({ uid: item.uid, url: item.url, state: item.readyState || item.state, target: item.target, createdAt: item.createdAt, meta: { githubCommitSha: item.meta?.githubCommitSha, githubCommitRef: item.meta?.githubCommitRef, githubCommitMessage: item.meta?.githubCommitMessage } })))
  }
  if (name === 'vercel_get_deployment') {
    const id = String(args.deploymentIdOrUrl || '').trim()
    if (!id || id.length > 200 || /[\r\n]/.test(id)) throw new Error('Deployment ID or URL is invalid.')
    const token = requireToken('VERCEL_API_TOKEN', 'Vercel')
    const params = new URLSearchParams()
    const teamId = String(process.env.VERCEL_TEAM_ID || '').trim()
    if (teamId) params.set('teamId', teamId)
    const result = await fetchJson(VERCEL_API + '/v13/deployments/' + encodeURIComponent(id) + (params.size ? '?' + params.toString() : ''), { headers: { Authorization: 'Bearer ' + token } })
    if (!allowedVercelProjects().has(String(result.projectId || ''))) throw new Error('This deployment does not belong to a Companion-allowed Vercel project.')
    return trimResult({ id: result.id, url: result.url, name: result.name, state: result.readyState || result.state, target: result.target, createdAt: result.createdAt, ready: result.ready, meta: { githubCommitSha: result.meta?.githubCommitSha, githubCommitRef: result.meta?.githubCommitRef, githubCommitMessage: result.meta?.githubCommitMessage } })
  }
  if (name === 'supabase_list_tables') {
    const projectId = String(args.projectId || '').trim()
    const schema = String(args.schema || 'public').trim()
    if (!/^[a-zA-Z_][a-zA-Z0-9_]{0,62}$/.test(schema)) throw new Error('Schema name is invalid.')
    const query = "select table_schema, table_name, column_name, data_type, is_nullable from information_schema.columns where table_schema = '" + schema + "' order by table_name, ordinal_position limit 300"
    return trimResult(await supabaseQuery(projectId, query))
  }
  if (name === 'supabase_read_table') return trimResult(await supabaseTableRead(args.projectId, args, accessToken))
  throw new Error('Unknown Companion tool: ' + String(name).slice(0, 80))
}

export async function executeApprovedCompanionAction(token, user) {
  const payload = verifyApproval(token)
  if (payload.version !== 1 || String(payload.userId) !== String(user.id)) throw new Error('This approval was not issued for the current owner session.')
  const action = payload.action
  if (!action || action.kind !== 'github_file_write') throw new Error('This approval action is not supported.')
  const repository = parseRepo(action.repository)
  const path = safePath(action.path)
  if (isProtectedWritePath(path)) throw new Error('This path is protected from Companion writes.')
  requireToken('GITHUB_TOKEN', 'GitHub')
  const metadata = await requireRepoMetadata(repository)
  if (metadata.archived || metadata.disabled || metadata.default_branch !== action.defaultBranch) throw new Error('Repository state changed since approval was requested. Review the change again.')
  let current = null
  try { current = await githubGetFile(repository, path) } catch (error) { if (error.status !== 404) throw error }
  if (action.expectedSha) {
    if (!current || current.sha !== action.expectedSha) throw new Error('The file changed after the approval request. Re-read it and prepare a fresh change.')
  } else if (current) {
    throw new Error('The file now exists; the create request is stale. Re-read it and prepare an update instead.')
  }
  const body = { message: action.summary, content: Buffer.from(String(action.content), 'utf8').toString('base64'), branch: action.defaultBranch }
  if (action.expectedSha) body.sha = action.expectedSha
  const result = await fetchJson(githubUrl(repository, path), { method: 'PUT', headers: githubHeaders(), body: JSON.stringify(body) })
  return {
    text: 'GitHub file ' + (action.expectedSha ? 'updated' : 'created') + ' successfully on ' + repository + ' (' + action.defaultBranch + ').\n\nFile: ' + path + '\nCommit: ' + String(result.commit?.sha || '').slice(0, 12) + '\n\nThis confirms the commit was accepted by GitHub; it does not confirm that tests passed or that production was deployed.',
  }
}
