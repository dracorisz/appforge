import { createHmac, timingSafeEqual } from 'node:crypto'

const GITHUB_API = 'https://api.github.com'
const VERCEL_API = 'https://api.vercel.com'
const SUPABASE_API = 'https://api.supabase.com'
const DEFAULT_REPO = 'dracorisz/appforge'
const DEFAULT_VERCEL_PROJECT = 'prj_duzco4XEzLRNCPs3n0VkWpRDusZq'
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
const decodeFile = (file) => {
  if (file.type !== 'file' || typeof file.content !== 'string' || file.size > 500000) throw new Error('Only text files up to 500 KB can be read.')
  return Buffer.from(file.content.replace(/\s/g, ''), 'base64').toString('utf8')
}
const requireRepoMetadata = async (repository) => fetchJson(GITHUB_API + '/repos/' + repository, { headers: githubHeaders() })

const toolDeclarations = [
  { name: 'github_list_files', description: 'List files and folders in an allowed GitHub repository path. Use to discover project structure.', parameters: { type: 'OBJECT', properties: { repository: { type: 'STRING', description: 'Repository in owner/name format.' }, path: { type: 'STRING', description: 'Optional directory path; omit for repository root.' } }, required: ['repository'] } },
  { name: 'github_read_file', description: 'Read a text source or documentation file from an allowed GitHub repository. Never use for secrets or environment files.', parameters: { type: 'OBJECT', properties: { repository: { type: 'STRING' }, path: { type: 'STRING' } }, required: ['repository', 'path'] } },
  { name: 'github_search_code', description: 'Search filenames and code in an allowed GitHub repository. Returns matching paths and URLs.', parameters: { type: 'OBJECT', properties: { repository: { type: 'STRING' }, query: { type: 'STRING', description: 'Short code or filename search phrase.' } }, required: ['repository', 'query'] } },
  { name: 'github_propose_file_change', description: 'Prepare a GitHub file create/update on the repository default branch. This NEVER writes immediately: it returns a pending approval for the owner to review and explicitly approve.', parameters: { type: 'OBJECT', properties: { repository: { type: 'STRING' }, path: { type: 'STRING' }, content: { type: 'STRING', description: 'Complete replacement file content or new file content.' }, summary: { type: 'STRING', description: 'Concise commit message describing the change.' } }, required: ['repository', 'path', 'content', 'summary'] } },
  { name: 'vercel_list_deployments', description: 'Inspect recent deployments for an allowed Vercel project. Read-only; Companion must not deploy, promote, or roll back.', parameters: { type: 'OBJECT', properties: { projectId: { type: 'STRING', description: 'Allowed Vercel project ID.' }, target: { type: 'STRING', enum: ['production', 'preview'], description: 'Optional deployment target.' }, limit: { type: 'INTEGER', description: 'Optional result count from 1 to 10.' } }, required: ['projectId'] } },
  { name: 'vercel_get_deployment', description: 'Inspect a specific deployment by ID or URL. Read-only; do not deploy or promote.', parameters: { type: 'OBJECT', properties: { deploymentIdOrUrl: { type: 'STRING' } }, required: ['deploymentIdOrUrl'] } },
  { name: 'supabase_list_tables', description: 'List tables, columns, and relationships for an allowed Supabase project using a read-only schema query.', parameters: { type: 'OBJECT', properties: { projectId: { type: 'STRING', description: 'Allowed Supabase project reference.' }, schema: { type: 'STRING', description: 'Optional schema name; defaults to public.' } }, required: ['projectId'] } },
  { name: 'supabase_read_query', description: 'Run one bounded, read-only SELECT/WITH query against an allowed Supabase project. Mutations, DDL, multiple statements, and risky database functions are blocked.', parameters: { type: 'OBJECT', properties: { projectId: { type: 'STRING' }, query: { type: 'STRING', description: 'A single SELECT or WITH query, preferably with a LIMIT.' } }, required: ['projectId', 'query'] } },
]

export const companionTools = [{ functionDeclarations: toolDeclarations }]

const readOnlySql = (value) => {
  const query = String(value || '').trim()
  if (!query || query.length > 8000 || !/^(select|with)\b/i.test(query)) throw new Error('Only a single SELECT or WITH query up to 8,000 characters is allowed.')
  if (query.includes(';') || /--|\/\*|\*\/|\\x00/i.test(query)) throw new Error('SQL comments and multiple statements are blocked.')
  if (/\b(insert|update|delete|merge|drop|alter|create|truncate|grant|revoke|copy|call|do|execute|prepare|deallocate|set|reset|vacuum|analyze|refresh|reindex|pg_sleep|dblink|lo_import|lo_export|pg_read_file|pg_write_file|pg_ls_dir|set_config|nextval|setval|large_object|http_get|http_post)\b/i.test(query)) {
    throw new Error('The query contains a blocked mutation, administrative command, or potentially side-effecting function.')
  }
  return query
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
      expiresAt: payload.expiresAt,
    },
  }
}

export async function executeCompanionTool(name, args, user) {
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
    const token = requireToken('GITHUB_TOKEN', 'GitHub')
    const url = GITHUB_API + '/search/code?q=' + encodeURIComponent(query + ' repo:' + repository) + '&per_page=8'
    const result = await fetchJson(url, { headers: { ...githubHeaders(), Accept: 'application/vnd.github.text-match+json' } })
    return { total: result.total_count || 0, matches: (result.items || []).slice(0, 8).map((item) => ({ path: item.path, url: item.html_url, repository: item.repository?.full_name })) }
  }
  if (name === 'github_propose_file_change') {
    const repository = parseRepo(args.repository)
    const path = safePath(args.path)
    const content = String(args.content ?? '')
    const summary = String(args.summary || '').trim().replace(/[\r\n\t]+/g, ' ').slice(0, 120)
    if (!content || content.length > 100000) throw new Error('Proposed file content must be between 1 and 100,000 characters.')
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
    const teamId = String(process.env.VERCEL_TEAM_ID || '').trim()
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
    return trimResult({ id: result.id, url: result.url, name: result.name, state: result.readyState || result.state, target: result.target, createdAt: result.createdAt, ready: result.ready, meta: { githubCommitSha: result.meta?.githubCommitSha, githubCommitRef: result.meta?.githubCommitRef, githubCommitMessage: result.meta?.githubCommitMessage } })
  }
  if (name === 'supabase_list_tables') {
    const projectId = String(args.projectId || '').trim()
    const schema = String(args.schema || 'public').trim()
    if (!/^[a-zA-Z_][a-zA-Z0-9_]{0,62}$/.test(schema)) throw new Error('Schema name is invalid.')
    const query = "select table_schema, table_name, column_name, data_type, is_nullable from information_schema.columns where table_schema = '" + schema + "' order by table_name, ordinal_position limit 300"
    return trimResult(await supabaseQuery(projectId, query))
  }
  if (name === 'supabase_read_query') {
    const projectId = String(args.projectId || '').trim()
    const query = readOnlySql(args.query)
    return trimResult(await supabaseQuery(projectId, query))
  }
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
  const tokenValue = requireToken('GITHUB_TOKEN', 'GitHub')
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
