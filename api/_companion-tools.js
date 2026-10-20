import { createHash, createHmac, timingSafeEqual } from 'node:crypto'
import { COMPANION_SUPABASE_URL, getCompanionSupabaseKey, createSupabaseClient } from './_companion-auth.js'
import {
  callCloudWorker,
  createGcpBridgeCredentials,
  downloadPrivateWorkerObject,
  getCachedGcpQuotaAndBillingStatus,
  getGcpBridgeConfig,
} from './_gcp-cloud-run.js'

const GITHUB_API = 'https://api.github.com'
const VERCEL_API = 'https://api.vercel.com'
const SUPABASE_API = 'https://api.supabase.com'
const DEFAULT_REPO = 'dracorisz/appforge'
const DEFAULT_VERCEL_PROJECT = 'prj_duzco4XEzLRNCPs3n0VkWpRDusZq'
const DEFAULT_VERCEL_TEAM_ID = 'team_w5zHVgvHs060CuaxQt23OSyr'
const DEFAULT_SUPABASE_PROJECT = 'ixqoosixhahrsgwoxyme'
const MAX_TOOL_TEXT = 24000
const REQUEST_TIMEOUT = 10000

export const AVAILABLE_MODELS = Object.freeze([
  {
    id: 'auto',
    label: 'Auto Orchestrator (Multi-Model)',
    group: 'Orchestrator',
    provider: 'auto',
    tier: 'auto',
  },
  {
    id: 'gemini-3.8-flash',
    label: 'Gemini 3.8 Flash (Fast Multimodal)',
    group: 'Google Cloud Vertex AI',
    provider: 'vertex-ai',
    tier: 'paid',
  },
  {
    id: 'gemini-4-argon',
    label: 'Gemini 4 Argon (Deep Reasoning & Code)',
    group: 'Google Cloud Vertex AI',
    provider: 'vertex-ai',
    tier: 'paid',
  },
  {
    id: 'vertex-claude:claude-sonnet-4-5@20250929',
    label: 'Claude 4.5 Sonnet (Vertex Garden)',
    group: 'Vertex AI Model Garden (GCP Credits)',
    provider: 'vertex-garden',
    tier: 'paid',
  },
  {
    id: 'vertex-claude:claude-opus-4-1@20250805',
    label: 'Claude 4.1 Opus (Vertex Garden)',
    group: 'Vertex AI Model Garden (GCP Credits)',
    provider: 'vertex-garden',
    tier: 'paid',
  },
  {
    id: 'vertex-claude:claude-3-5-sonnet-v2@20241022',
    label: 'Claude 3.5 Sonnet v2 (Vertex Garden)',
    group: 'Vertex AI Model Garden (GCP Credits)',
    provider: 'vertex-garden',
    tier: 'paid',
  },
  {
    id: 'vertex-meta:meta/llama-3.3-70b-instruct-maas',
    label: 'Llama 3.3 70B Instruct (Vertex Garden)',
    group: 'Vertex AI Model Garden (GCP Credits)',
    provider: 'vertex-garden',
    tier: 'paid',
  },
  {
    id: 'openrouter:minimax/minimax-m3.1-flash:free',
    label: 'MiniMax M3.1 Flash (1M ctx · Free)',
    group: 'OpenRouter Free Models ($0)',
    provider: 'openrouter',
    tier: 'free',
  },
  {
    id: 'openrouter:nvidia/nemotron-3-ultra-550b-a55b:free',
    label: 'Nemotron 3 Ultra 550B (1M ctx · Free)',
    group: 'OpenRouter Free Models ($0)',
    provider: 'openrouter',
    tier: 'free',
  },
  {
    id: 'openrouter:poolside/laguna-s-2.1:free',
    label: 'Poolside Laguna S 2.1 (Code · Free)',
    group: 'OpenRouter Free Models ($0)',
    provider: 'openrouter',
    tier: 'free',
  },
  {
    id: 'openrouter:cohere/north-mini-code:free',
    label: 'Cohere North Mini Code (Code · Free)',
    group: 'OpenRouter Free Models ($0)',
    provider: 'openrouter',
    tier: 'free',
  },
  {
    id: 'openrouter:nvidia/nemotron-3.5-super-vl:free',
    label: 'Nemotron 3.5 Super VL (Vision · Free)',
    group: 'OpenRouter Free Models ($0)',
    provider: 'openrouter',
    tier: 'free',
  },
  {
    id: 'openrouter:nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free',
    label: 'Nemotron 3 Nano Reasoning (Free)',
    group: 'OpenRouter Free Models ($0)',
    provider: 'openrouter',
    tier: 'free',
  },
  {
    id: 'openrouter:dots-studio/dots-3-note-preview:free',
    label: 'Dots 3 Note 512k (Free)',
    group: 'OpenRouter Free Models ($0)',
    provider: 'openrouter',
    tier: 'free',
  },
  {
    id: 'openrouter:google/gemma-4-31b-it:free',
    label: 'Google Gemma 4 31B (Free)',
    group: 'OpenRouter Free Models ($0)',
    provider: 'openrouter',
    tier: 'free',
  },
  {
    id: 'hf:Qwen/Qwen2.5-72B-Instruct',
    label: 'Qwen 2.5 72B Instruct (HF)',
    group: 'HuggingFace Inference',
    provider: 'huggingface',
    tier: 'free',
  },
  {
    id: 'hf:meta-llama/Llama-3.3-70B-Instruct',
    label: 'Llama 3.3 70B Instruct (HF)',
    group: 'HuggingFace Inference',
    provider: 'huggingface',
    tier: 'free',
  },
  {
    id: 'hf:mistralai/Mistral-Small-24B-Instruct-2501',
    label: 'Mistral Small 24B (HF)',
    group: 'HuggingFace Inference',
    provider: 'huggingface',
    tier: 'free',
  },
])

const splitAllowlist = (name, fallback) => {
  const values = String(process.env[name] || fallback)
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
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

const extractErrorMessage = (body) => {
  if (!body) return 'Remote service request failed.'
  if (typeof body === 'string') return body
  if (typeof body.error === 'object' && body.error !== null) {
    return String(body.error.message || body.error.status || JSON.stringify(body.error))
  }
  return String(body.message || body.error || body.error_description || 'Remote service request failed.')
}

const fetchJson = async (url, options = {}, fetchImpl = fetch) => {
  const response = await fetchImpl(url, { ...options, signal: AbortSignal.timeout(REQUEST_TIMEOUT) })
  const body = await response.json().catch(() => ({}))
  if (!response.ok) {
    const message = extractErrorMessage(body)
      .replace(/[\r\n\t]+/g, ' ')
      .slice(0, 220)
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
  const raw = String(value || DEFAULT_REPO).trim()
  const repository = raw === 'appforge' || raw === 'lamat' ? DEFAULT_REPO : raw
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository) || !allowedRepos().has(repository)) {
    throw new Error('Repository is not in Companion’s allowed-repository-list.')
  }
  return repository
}

const normalizeSupabaseProjectId = (value) => {
  const raw = String(value || DEFAULT_SUPABASE_PROJECT).trim()
  if (!raw || raw === 'appforge' || raw === 'lamat' || raw === 'default') {
    return DEFAULT_SUPABASE_PROJECT
  }
  return raw
}

const normalizeVercelProjectId = (value) => {
  const raw = String(value || DEFAULT_VERCEL_PROJECT).trim()
  if (!raw || raw === 'appforge' || raw === 'lamat' || raw === 'default') {
    return DEFAULT_VERCEL_PROJECT
  }
  return raw
}

const escapeDriveQueryLiteral = (value) =>
  String(value || '')
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")

const safePath = (value) => {
  const path = String(value || '').trim().replace(/^\/+/, '')
  // eslint-disable-next-line no-control-regex -- Reject control characters and backslashes in untrusted repository paths.
  if (!path || path.length > 240 || path.split('/').some((part) => !part || part === '.' || part === '..') || /[\u0000-\u001f\\]/.test(path)) {
    throw new Error('File path is invalid.')
  }
  if (/(^|\/)\.env(?:\.|$)|(^|\/)\.npmrc$|(^|\/)\.pypirc$|(^|\/)\.vercel(\/|$)|(^|\/)id_rsa(?:$|\.)|(^|\/).*\.pem$|(^|\/).*\.key$/i.test(path)) {
    throw new Error('Reading or editing secret/configuration files is blocked.')
  }
  return path
}

export const isProtectedWritePath = (path) => (
  path === 'api/_companion-auth.js' ||
  path === 'api/_companion-tools.js' ||
  path === 'api/_companion-chat.js' ||
  path === 'api/_lamat-agents.js' ||
  path === 'api/_lamat-engine.js' ||
  path === 'api/companion.js' ||
  path === 'api/lamat.js' ||
  path === 'vercel.json' ||
  path === 'SECURITY.md' ||
  path === 'WORK_RULES.md' ||
  path.startsWith('.github/workflows/') ||
  path.startsWith('supabase/migrations/')
)

const githubUrl = (repository, path = '') =>
  GITHUB_API + '/repos/' + repository + '/contents' + (path ? '/' + path.split('/').map(encodeURIComponent).join('/') : '')

const githubGetFile = async (repository, path, fetchImpl = fetch) =>
  fetchJson(githubUrl(repository, path), { headers: githubHeaders() }, fetchImpl)

export const redactSecrets = (value) =>
  String(value)
    .replace(/gh[pousr]_[A-Za-z0-9_]{20,}|github_pat_[A-Za-z0-9_]{20,}|hf_[A-Za-z0-9]{20,}|sk-or-v1-[A-Za-z0-9]{20,}|AIza[0-9A-Za-z_-]{30,}|sb_secret_[A-Za-z0-9_-]+|AKIA[A-Z0-9]{16}|sk_(?:live|test)_[A-Za-z0-9]{20,}|xox[baprs]-[A-Za-z0-9-]{10,}|eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}/g, '[REDACTED_SECRET]')
    .replace(/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----[\s\S]*?-----END (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g, '[REDACTED_PRIVATE_KEY]')

export const hasLikelySecret = (value) =>
  /gh[pousr]_[A-Za-z0-9_]{20,}|github_pat_[A-Za-z0-9_]{20,}|hf_[A-Za-z0-9]{20,}|sk-or-v1-[A-Za-z0-9]{20,}|AIza[0-9A-Za-z_-]{30,}|sb_secret_[A-Za-z0-9_-]+|AKIA[A-Z0-9]{16}|sk_(?:live|test)_[A-Za-z0-9]{20,}|xox[baprs]-[A-Za-z0-9-]{10,}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/.test(String(value))

const decodeFile = (file) => {
  if (file.type !== 'file' || typeof file.content !== 'string' || file.size > 500000) {
    throw new Error('Only text files up to 500 KB can be read.')
  }
  return redactSecrets(Buffer.from(file.content.replace(/\s/g, ''), 'base64').toString('utf8'))
}

const requireRepoMetadata = async (repository, fetchImpl = fetch) =>
  fetchJson(GITHUB_API + '/repos/' + repository, { headers: githubHeaders() }, fetchImpl)

export const TOOL_POLICY_CATEGORIES = Object.freeze({
  github_list_files: 'read_state',
  github_read_file: 'read_state',
  github_search_code: 'read_state',
  github_run_release_checks: 'code_branch_change',
  github_get_release_check_status: 'read_state',
  github_propose_file_change: 'approve_required_file_write',
  vercel_list_deployments: 'read_state',
  vercel_get_deployment: 'read_state',
  supabase_list_tables: 'read_state',
  supabase_read_table: 'read_state',
  google_drive_list_files: 'read_state',
  google_drive_read_file: 'read_state',
  google_docs_read: 'read_state',
  google_sheets_read: 'read_state',
  lamat_read_library: 'read_state',
  lamat_inspect_environment: 'read_state',
  lamat_check_budget_and_resources: 'read_state',
  lamat_read_financial_summary: 'read_state',
  lamat_upsert_financial_record: 'finance_record',
  lamat_generate_image: 'task_execution',
  lamat_record_memory: 'memory_write',
  lamat_manage_memories: 'memory_write',
  lamat_upsert_goal: 'memory_write',
  lamat_create_task: 'task_execution',
  lamat_update_task: 'task_execution',
  lamat_ask_question: 'question_ask',
  lamat_propose_action: 'dynamic_policy',
  lamat_revise_self_model: 'memory_write',
  lamat_switch_model: 'memory_write',
  maya_remember: 'memory_write',
  maya_revise_self_model: 'memory_write',
  maya_update_goal: 'memory_write',
  maya_propose_action: 'dynamic_policy',
  maya_switch_model: 'memory_write',
})

export const ROLE_TOOL_PERMISSIONS = Object.freeze({
  researcher: new Set([
    'github_list_files',
    'github_read_file',
    'github_search_code',
    'github_get_release_check_status',
    'vercel_list_deployments',
    'vercel_get_deployment',
    'supabase_list_tables',
    'supabase_read_table',
    'google_drive_list_files',
    'google_drive_read_file',
    'google_docs_read',
    'google_sheets_read',
    'lamat_read_library',
    'lamat_inspect_environment',
    'lamat_check_budget_and_resources',
    'lamat_read_financial_summary',
  ]),
  strategist: new Set([
    'google_drive_list_files',
    'google_drive_read_file',
    'google_docs_read',
    'google_sheets_read',
    'lamat_read_library',
    'lamat_inspect_environment',
    'lamat_check_budget_and_resources',
    'lamat_read_financial_summary',
    'lamat_upsert_financial_record',
    'lamat_upsert_goal',
    'lamat_ask_question',
    'lamat_record_memory',
    'lamat_manage_memories',
    'supabase_read_table',
  ]),
  planner: new Set([
    'google_drive_list_files',
    'google_drive_read_file',
    'google_docs_read',
    'google_sheets_read',
    'lamat_read_library',
    'lamat_inspect_environment',
    'lamat_check_budget_and_resources',
    'lamat_read_financial_summary',
    'lamat_create_task',
    'lamat_update_task',
    'lamat_upsert_goal',
    'lamat_ask_question',
    'supabase_read_table',
  ]),
  executor: new Set([
    'github_list_files',
    'github_read_file',
    'github_search_code',
    'github_run_release_checks',
    'github_get_release_check_status',
    'github_propose_file_change',
    'vercel_list_deployments',
    'vercel_get_deployment',
    'supabase_list_tables',
    'supabase_read_table',
    'google_drive_list_files',
    'google_drive_read_file',
    'google_docs_read',
    'google_sheets_read',
    'lamat_read_library',
    'lamat_inspect_environment',
    'lamat_check_budget_and_resources',
    'lamat_read_financial_summary',
    'lamat_upsert_financial_record',
    'lamat_generate_image',
    'lamat_record_memory',
    'lamat_manage_memories',
    'lamat_upsert_goal',
    'lamat_create_task',
    'lamat_update_task',
    'lamat_ask_question',
    'lamat_propose_action',
    'lamat_switch_model',
    'maya_remember',
    'maya_update_goal',
    'maya_propose_action',
  ]),
  evaluator: new Set([
    'github_get_release_check_status',
    'vercel_list_deployments',
    'vercel_get_deployment',
    'supabase_read_table',
    'lamat_read_library',
    'lamat_inspect_environment',
    'lamat_check_budget_and_resources',
    'lamat_read_financial_summary',
    'lamat_record_memory',
    'lamat_revise_self_model',
  ]),
  memory_processor: new Set([
    'lamat_record_memory',
    'lamat_manage_memories',
    'lamat_revise_self_model',
    'maya_remember',
    'maya_revise_self_model',
  ]),
  supervisor: new Set(Object.keys(TOOL_POLICY_CATEGORIES)),
  chat: new Set(Object.keys(TOOL_POLICY_CATEGORIES)),
})

export const FORBIDDEN_POLICY_CATEGORIES = new Set([
  'iam_billing_secrets',
  'self_governance',
])

export const APPROVAL_REQUIRED_CATEGORIES = new Set([
  'spend_money',
  'deploy_production',
  'external_publish_or_send',
  'db_migration',
  'db_data_change',
  'cloud_resource_change',
  'device_access',
])

const toolDeclarations = [
  { name: 'github_list_files', description: 'List files and folders in an allowed GitHub repository path. Defaults to dracorisz/appforge.', parameters: { type: 'OBJECT', properties: { repository: { type: 'STRING', description: 'Repository in owner/name format (defaults to dracorisz/appforge).' }, path: { type: 'STRING', description: 'Optional directory path; omit for repository root.' } } } },
  { name: 'github_read_file', description: 'Read a text source or documentation file from an allowed GitHub repository. Never use for secrets or environment files.', parameters: { type: 'OBJECT', properties: { repository: { type: 'STRING' }, path: { type: 'STRING' } }, required: ['path'] } },
  { name: 'github_search_code', description: 'Search filenames and code in an allowed GitHub repository. Returns matching paths and URLs.', parameters: { type: 'OBJECT', properties: { repository: { type: 'STRING' }, query: { type: 'STRING', description: 'Short code or filename search phrase.' } }, required: ['query'] } },
  { name: 'github_run_release_checks', description: 'Run the fixed, non-deploying release verification workflow on main.', parameters: { type: 'OBJECT', properties: { repository: { type: 'STRING', description: 'Defaults to dracorisz/appforge.' } } } },
  { name: 'github_get_release_check_status', description: 'Read the latest release-verification workflow result. A queued or in-progress run is not a pass.', parameters: { type: 'OBJECT', properties: { repository: { type: 'STRING', description: 'Defaults to dracorisz/appforge.' } } } },
  { name: 'github_propose_file_change', description: 'Prepare a GitHub file create/update on the repository default branch. This NEVER writes immediately: it returns a parameter-bound pending approval for the owner to review and explicitly approve.', parameters: { type: 'OBJECT', properties: { repository: { type: 'STRING' }, path: { type: 'STRING' }, content: { type: 'STRING', description: 'Complete replacement file content or new file content.' }, summary: { type: 'STRING', description: 'Concise commit message describing the change.' } }, required: ['path', 'content', 'summary'] } },
  { name: 'vercel_list_deployments', description: 'Inspect recent deployments for the Vercel project. Read-only.', parameters: { type: 'OBJECT', properties: { projectId: { type: 'STRING', description: 'Defaults to prj_duzco4XEzLRNCPs3n0VkWpRDusZq.' }, target: { type: 'STRING', enum: ['production', 'preview'] }, limit: { type: 'INTEGER' } } } },
  { name: 'vercel_get_deployment', description: 'Inspect a specific deployment by ID or URL. Read-only.', parameters: { type: 'OBJECT', properties: { deploymentIdOrUrl: { type: 'STRING' } }, required: ['deploymentIdOrUrl'] } },
  { name: 'supabase_list_tables', description: 'List tables and columns for the Supabase project using a read-only schema query.', parameters: { type: 'OBJECT', properties: { projectId: { type: 'STRING' }, schema: { type: 'STRING' } } } },
  { name: 'supabase_read_table', description: 'Read rows from a public Supabase table through PostgREST using the owner session so Row Level Security applies.', parameters: { type: 'OBJECT', properties: { projectId: { type: 'STRING' }, table: { type: 'STRING' }, columns: { type: 'STRING' }, limit: { type: 'INTEGER' }, filters: { type: 'ARRAY', items: { type: 'OBJECT', properties: { column: { type: 'STRING' }, operator: { type: 'STRING', enum: ['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'is', 'like', 'ilike'] }, value: { type: 'STRING' } }, required: ['column', 'operator', 'value'] } } }, required: ['table'] } },
  { name: 'google_drive_list_files', description: 'Search and list documents, spreadsheets, and files in the user’s Google Drive AND uploaded User Library.', parameters: { type: 'OBJECT', properties: { query: { type: 'STRING', description: 'Optional filename query string, e.g. "Dragoljub\'s Plans".' }, folderId: { type: 'STRING', description: 'Optional folder ID or URL.' }, limit: { type: 'INTEGER', description: 'Max items to return (1-50).' } } } },
  { name: 'google_drive_read_file', description: 'Read/export a file from Google Drive or User Library by fileId or URL. Exports Google Docs as plain text, Google Sheets as CSV, or reads uploaded documents.', parameters: { type: 'OBJECT', properties: { fileId: { type: 'STRING', description: 'Google Drive file ID, Library item ID, or document/sheet URL.' } }, required: ['fileId'] } },
  { name: 'google_docs_read', description: 'Read structured document content from a Google Doc by documentId or URL (supports personal OAuth, link-shared docs, and service-account shared docs).', parameters: { type: 'OBJECT', properties: { documentId: { type: 'STRING', description: 'Google Doc ID or full docs.google.com URL.' } }, required: ['documentId'] } },
  { name: 'google_sheets_read', description: 'Read tabular rows and cell values from a Google Spreadsheet by spreadsheetId or URL (supports personal OAuth, link-shared sheets, and service-account shared sheets).', parameters: { type: 'OBJECT', properties: { spreadsheetId: { type: 'STRING', description: 'Google Sheet ID or full sheets.google.com URL.' }, range: { type: 'STRING', description: 'Optional A1 notation range, e.g. Sheet1!A1:Z100.' } }, required: ['spreadsheetId'] } },
  { name: 'lamat_read_library', description: 'List or read parsed documents, spreadsheets, and images from the user’s persistent Lamat Library.', parameters: { type: 'OBJECT', properties: { id: { type: 'STRING', description: 'Optional specific library item ID to read full parsed_text.' }, query: { type: 'STRING', description: 'Optional title/filename search query.' } } } },
  { name: 'lamat_inspect_environment', description: 'Inspect Lamat’s own live runtime environment, repository, deployment, database, Google Cloud service account email, and available paid/free models.', parameters: { type: 'OBJECT', properties: {} } },
  { name: 'lamat_check_budget_and_resources', description: 'Read verified and estimated budget limits, token usage, daily spend, cached Google Cloud status, and resource inventory.', parameters: { type: 'OBJECT', properties: {} } },
  { name: 'lamat_read_financial_summary', description: 'Read the owner financial summary from fin_summary(), including account balances, active debts, recurring essentials, and income sources.', parameters: { type: 'OBJECT', properties: {} } },
  { name: 'lamat_upsert_financial_record', description: 'Populate or update a record in the Finance tab (fin_accounts, fin_debts, fin_recurring, or fin_income_sources) based on user documents, sheets, or conversation.', parameters: { type: 'OBJECT', properties: { record_type: { type: 'STRING', enum: ['account', 'debt', 'recurring', 'income'], description: 'Type of financial record to create or update.' }, name: { type: 'STRING', description: 'Account name, creditor name, recurring expense name, or income source name.' }, amount: { type: 'NUMBER', description: 'Amount in major currency units (e.g. 150.50).' }, currency: { type: 'STRING', description: '3-letter currency code: EUR, USD, or RSD.' }, kind: { type: 'STRING', description: 'Optional subtype (e.g. bank/cash for account; loan/card/bill_arrears/personal/tax for debt; freelance/employment for income).' }, due_date: { type: 'STRING', description: 'Optional ISO date YYYY-MM-DD for debt due_date or recurring next_due.' }, cadence: { type: 'STRING', enum: ['once', 'weekly', 'monthly', 'yearly'], description: 'Cadence for recurring expense or income source.' }, essential: { type: 'BOOLEAN', description: 'Whether a recurring expense is essential.' }, consequence_note: { type: 'STRING', description: 'Consequence of delay for a debt.' }, note: { type: 'STRING', description: 'Additional note or provenance.' } }, required: ['record_type', 'name', 'amount'] } },
  { name: 'lamat_generate_image', description: 'Generate an image from a text prompt using Vertex AI Imagen or FLUX and return it as inline markdown while saving a thumbnail to the User Library.', parameters: { type: 'OBJECT', properties: { prompt: { type: 'STRING', description: 'Detailed visual description of the image to generate.' } }, required: ['prompt'] } },
  { name: 'lamat_record_memory', description: 'Persist a durable memory in maya_memories with explicit provenance and confidence. Deduplicates identical active memories.', parameters: { type: 'OBJECT', properties: { kind: { type: 'STRING', enum: ['fact', 'preference', 'decision', 'lesson', 'event', 'hypothesis'] }, content: { type: 'STRING' }, provenance: { type: 'STRING', enum: ['stated_by_owner', 'observed', 'verified_tool', 'inferred'] }, confidence: { type: 'NUMBER' }, tags: { type: 'ARRAY', items: { type: 'STRING' } }, supersedes_id: { type: 'STRING' } }, required: ['kind', 'content'] } },
  { name: 'lamat_manage_memories', description: 'Permanently delete obsolete or unneeded memories from maya_memories.', parameters: { type: 'OBJECT', properties: { memory_ids: { type: 'ARRAY', items: { type: 'STRING' }, description: 'List of memory UUIDs to delete.' } }, required: ['memory_ids'] } },
  { name: 'lamat_upsert_goal', description: 'Create or update a persistent goal in maya_goals.', parameters: { type: 'OBJECT', properties: { id: { type: 'STRING' }, parent_id: { type: 'STRING' }, title: { type: 'STRING' }, description: { type: 'STRING' }, success_criteria: { type: 'STRING' }, status: { type: 'STRING', enum: ['proposed', 'active', 'blocked', 'done', 'dropped'] }, priority: { type: 'INTEGER' }, horizon: { type: 'STRING', enum: ['now', 'soon', 'later'] }, target_date: { type: 'STRING' } }, required: ['title'] } },
  { name: 'lamat_create_task', description: 'Create a durable task in lamat_tasks with idempotency protection, plan steps, expected outcome, and verification method.', parameters: { type: 'OBJECT', properties: { idempotency_key: { type: 'STRING' }, goal_id: { type: 'STRING' }, project_id: { type: 'STRING' }, title: { type: 'STRING' }, description: { type: 'STRING' }, rationale: { type: 'STRING' }, kind: { type: 'STRING', enum: ['research', 'planning', 'execution', 'verification', 'maintenance', 'financial', 'opportunity'] }, priority: { type: 'INTEGER' }, expected_outcome: { type: 'STRING' }, verification_method: { type: 'STRING' }, plan_steps: { type: 'ARRAY', items: { type: 'OBJECT', properties: { index: { type: 'INTEGER' }, title: { type: 'STRING' }, tool: { type: 'STRING' } } } }, estimated_cost_usd: { type: 'NUMBER' } }, required: ['title', 'rationale', 'expected_outcome'] } },
  { name: 'lamat_update_task', description: 'Update task status, deliverable markdown, checkpoint_state, current_step_index, result, or verification_evidence in lamat_tasks.', parameters: { type: 'OBJECT', properties: { id: { type: 'STRING' }, status: { type: 'STRING', enum: ['queued', 'planning', 'running', 'verifying', 'waiting_input', 'waiting_approval', 'blocked', 'paused', 'completed', 'failed', 'cancelled'] }, deliverable: { type: 'STRING', description: 'Full markdown deliverable or action plan produced for this task.' }, current_step_index: { type: 'INTEGER' }, checkpoint_state: { type: 'OBJECT' }, result: { type: 'OBJECT' }, verification_evidence: { type: 'OBJECT' }, blocker_reason: { type: 'STRING' } }, required: ['id'] } },
  { name: 'lamat_ask_question', description: 'Persist a focused clarifying question for the owner in lamat_questions when missing information materially affects a decision, and pause the associated task.', parameters: { type: 'OBJECT', properties: { task_id: { type: 'STRING' }, goal_id: { type: 'STRING' }, question: { type: 'STRING' }, context_why: { type: 'STRING' }, missing_info: { type: 'STRING' }, options: { type: 'ARRAY', items: { type: 'STRING' } } }, required: ['question', 'context_why'] } },
  { name: 'lamat_propose_action', description: 'Record or request approval for an action in maya_actions. Consequential categories require explicit owner approval before execution.', parameters: { type: 'OBJECT', properties: { category: { type: 'STRING' }, summary: { type: 'STRING' }, target: { type: 'STRING' }, payload: { type: 'OBJECT' }, estimated_cost_usd: { type: 'NUMBER' }, task_id: { type: 'STRING' } }, required: ['category', 'summary'] } },
  { name: 'lamat_revise_self_model', description: 'Append a new versioned self-model snapshot to maya_self_model.', parameters: { type: 'OBJECT', properties: { content: { type: 'OBJECT' }, rationale: { type: 'STRING' } }, required: ['content', 'rationale'] } },
  { name: 'lamat_switch_model', description: 'Switch active routine, reasoning, or overnight free model in lamat_budget_config.', parameters: { type: 'OBJECT', properties: { model: { type: 'STRING' }, mode: { type: 'STRING', enum: ['routine', 'reasoning', 'free', 'chat', 'overnight'] }, overnight_free_only: { type: 'BOOLEAN' }, rationale: { type: 'STRING' } }, required: ['model'] } },
]

export const companionTools = [{ functionDeclarations: toolDeclarations }]

export function toolsForRole(role = 'supervisor') {
  const allowed = ROLE_TOOL_PERMISSIONS[role] || ROLE_TOOL_PERMISSIONS.supervisor
  return [
    {
      functionDeclarations: toolDeclarations.filter((decl) => allowed.has(decl.name)),
    },
  ]
}

const isPrivilegedSupabaseKey = (value) => {
  const key = String(value || '')
  if (key.startsWith('sb_secret_')) return true
  const parts = key.split('.')
  if (parts.length !== 3) return false
  try {
    return JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8')).role === 'service_role'
  } catch {
    return false
  }
}

const supabaseTableRead = async (projectId, args, accessToken, fetchImpl = fetch) => {
  const project = normalizeSupabaseProjectId(projectId)
  if (!allowedSupabaseProjects().has(project)) throw new Error('Supabase project is not in Companion’s allowed-project list.')
  const baseUrl = new URL(COMPANION_SUPABASE_URL)
  if (baseUrl.hostname.split('.')[0] !== project) throw new Error('The selected Supabase project does not match the configured authenticated data endpoint.')
  const supabaseKey = getCompanionSupabaseKey()
  if (!supabaseKey || isPrivilegedSupabaseKey(supabaseKey)) throw new Error('Safe table reads require a Supabase publishable/anon key, not a service-role or secret key.')
  if (!String(accessToken || '').trim()) throw new Error('The owner session is required for a row-level-security-protected read.')
  const table = String(args.table || '').trim()
  if (!/^[a-zA-Z_][a-zA-Z0-9_]{0,62}$/.test(table)) throw new Error('Table name is invalid.')
  const columns = String(args.columns || '*').trim()
  const columnList = columns === '*' ? '*' : columns.split(',').map((item) => item.trim()).join(',')
  if (columnList !== '*' && (!columnList || columnList.split(',').length > 12 || columnList.split(',').some((item) => !/^[a-zA-Z_][a-zA-Z0-9_]{0,62}$/.test(item)))) {
    throw new Error('Columns must be * or a comma-separated list of up to 12 simple column names.')
  }
  const filters = args.filters === undefined ? [] : args.filters
  if (!Array.isArray(filters) || filters.length > 5) throw new Error('At most five simple filters are allowed.')
  const url = new URL('/rest/v1/' + encodeURIComponent(table), baseUrl.origin)
  url.searchParams.set('select', columnList)
  url.searchParams.set('limit', String(Math.max(1, Math.min(50, Number(args.limit) || 20))))
  const operators = new Set(['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'is', 'like', 'ilike'])
  for (const filter of filters) {
    if (!filter || !/^[a-zA-Z_][a-zA-Z0-9_]{0,62}$/.test(String(filter.column || '')) || !operators.has(String(filter.operator || ''))) {
      throw new Error('A filter column or operator is invalid.')
    }
    const value = String(filter.value ?? '')
    if (!value || value.length > 200 || !/^[A-Za-z0-9 _@.:+\-/%]+$/.test(value)) {
      throw new Error('Filter values may contain only simple text, numbers, and basic pattern characters.')
    }
    if (filter.operator === 'is' && !['null', 'true', 'false'].includes(value.toLowerCase())) {
      throw new Error('The is operator supports only null, true, or false.')
    }
    url.searchParams.set(String(filter.column), String(filter.operator) + '.' + value)
  }
  return fetchJson(
    url.toString(),
    {
      headers: {
        apikey: supabaseKey,
        Authorization: 'Bearer ' + String(accessToken),
        Accept: 'application/json',
        'Accept-Profile': 'public',
      },
    },
    fetchImpl
  )
}

const supabaseQuery = async (projectId, query, fetchImpl = fetch) => {
  const project = normalizeSupabaseProjectId(projectId)
  if (!allowedSupabaseProjects().has(project)) throw new Error('Supabase project is not in Companion’s allowed-project list.')
  const token = requireToken('SUPABASE_ACCESS_TOKEN', 'Supabase')
  return fetchJson(
    SUPABASE_API + '/v1/projects/' + encodeURIComponent(project) + '/database/query',
    {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    },
    fetchImpl
  )
}

const trimResult = (value) => {
  const text = JSON.stringify(value)
  return text.length > MAX_TOOL_TEXT ? text.slice(0, MAX_TOOL_TEXT) + '… [result truncated]' : value
}

export function parseGoogleDocOrSheetId(input) {
  const str = String(input || '').trim()
  const match = str.match(/\/(?:d|folders|spreadsheets\/d|document\/d)\/([a-zA-Z0-9_-]{15,})/i)
  if (match) return match[1]
  const idMatch = str.match(/^[a-zA-Z0-9_-]{15,}$/)
  if (idMatch) return idMatch[0]
  return str
}

async function resolveGoogleWorkspaceHeaders(db) {
  const headers = { Accept: 'application/json' }
  // 1. Check if the user has a personal Google OAuth token saved from Google Sign-In
  const prefRows = await db.select('user_preferences', 'select=preferences&limit=1').catch(() => [])
  const userGoogleToken = prefRows?.[0]?.preferences?.google_provider_token || null
  if (userGoogleToken) {
    headers.Authorization = `Bearer ${userGoogleToken}`
    return { headers, source: 'user_oauth', apiKey: null }
  }

  // 2. Fallback to GCP Workload Identity Federation service account token
  try {
    const bridge = await createGcpBridgeCredentials()
    if (bridge?.accessToken) {
      headers.Authorization = `Bearer ${bridge.accessToken}`
      return { headers, source: 'service_account', apiKey: null, gcpToken: bridge.accessToken }
    }
  } catch {
    // fallback
  }

  const apiKey = process.env.GOOGLE_WORKSPACE_API_KEY || process.env.YOUTUBE_API_KEY || null
  return { headers, source: 'api_key', apiKey }
}

async function tryEnableGcpWorkspaceApis(gcpToken, projectNumber, fetchImpl = fetch) {
  if (!gcpToken || !projectNumber) return
  for (const svc of ['drive.googleapis.com', 'docs.googleapis.com', 'sheets.googleapis.com']) {
    await fetchImpl(
      `https://serviceusage.googleapis.com/v1/projects/${encodeURIComponent(projectNumber)}/services/${svc}:enable`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${gcpToken}`, 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(5000),
      }
    ).catch(() => null)
  }
}

export function computeActionParameterHash(action) {
  const canonical = JSON.stringify({
    kind: action.kind || '',
    category: action.category || '',
    repository: action.repository || '',
    path: action.path || '',
    target: action.target || '',
    summary: action.summary || '',
    content: action.content || '',
    payload: action.payload || {},
    estimatedCostUsd: Number(action.estimatedCostUsd || 0),
  })
  return createHash('sha256').update(canonical).digest('hex')
}

export const signApproval = (payload) => {
  const secret = String(process.env.COMPANION_ACTION_SECRET || '')
  if (secret.length < 32) throw new Error('File changes are disabled until a dedicated COMPANION_ACTION_SECRET of at least 32 characters is configured.')
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const signature = createHmac('sha256', secret).update(encoded).digest('base64url')
  return encoded + '.' + signature
}

export const verifyApproval = (token, expectedParameters = null) => {
  const secret = String(process.env.COMPANION_ACTION_SECRET || '')
  if (secret.length < 32) throw new Error('File changes are disabled until COMPANION_ACTION_SECRET is configured.')
  const parts = String(token || '').split('.')
  if (parts.length !== 2) throw new Error('Approval token is invalid or expired.')
  const expected = createHmac('sha256', secret).update(parts[0]).digest()
  let supplied
  try {
    supplied = Buffer.from(parts[1], 'base64url')
  } catch {
    throw new Error('Approval token is invalid or expired.')
  }
  if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) {
    throw new Error('Approval token is invalid or expired.')
  }
  let payload
  try {
    payload = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8'))
  } catch {
    throw new Error('Approval token is invalid or expired.')
  }
  if (!payload || payload.expiresAt < Date.now() || payload.expiresAt > Date.now() + 6 * 60 * 1000) {
    throw new Error('Approval token is invalid or expired.')
  }
  if (expectedParameters && payload.parameterHash) {
    const actualHash = computeActionParameterHash(expectedParameters)
    if (actualHash !== payload.parameterHash) {
      throw new Error('Approval parameters changed since the action was approved. Renewed approval is required.')
    }
  }
  return payload
}

const createPendingApproval = (action, user) => {
  const parameterHash = computeActionParameterHash(action)
  const payload = {
    version: 1,
    userId: String(user.id),
    expiresAt: Date.now() + 5 * 60 * 1000,
    nonce: crypto.randomUUID(),
    parameterHash,
    action,
  }
  const token = signApproval(payload)
  return {
    text: 'This file change is prepared but has not been applied. Review the exact repository, path, and commit summary before approving.',
    pendingApproval: {
      token,
      parameterHash,
      repository: action.repository,
      path: action.path,
      operation: action.operation,
      summary: action.summary,
      preview: action.content,
      expiresAt: payload.expiresAt,
    },
  }
}

export function enforceToolAuthorization(toolName, args, agentRole = 'supervisor') {
  const allowedTools = ROLE_TOOL_PERMISSIONS[agentRole] || ROLE_TOOL_PERMISSIONS.supervisor
  if (!allowedTools.has(toolName)) {
    const err = new Error(`Agent role "${agentRole}" is not authorized to invoke tool "${toolName}".`)
    err.status = 403
    err.code = 'role_permission_denied'
    throw err
  }

  const mappedCategory = TOOL_POLICY_CATEGORIES[toolName]
  if (!mappedCategory) {
    const err = new Error(`Unknown or unauthorized tool: ${String(toolName).slice(0, 80)}`)
    err.status = 403
    err.code = 'unknown_tool'
    throw err
  }

  const category =
    mappedCategory === 'dynamic_policy'
      ? String(args?.category || args?.action_type || '').trim()
      : mappedCategory

  if (FORBIDDEN_POLICY_CATEGORIES.has(category)) {
    const err = new Error(`Action category "${category}" is forbidden by execution policy; the owner must perform this manually.`)
    err.status = 403
    err.code = 'forbidden_policy_category'
    throw err
  }

  return { category, requiresOwnerApproval: APPROVAL_REQUIRED_CATEGORIES.has(category) || mappedCategory === 'approve_required_file_write' }
}

export async function executeCompanionTool(name, args, user, accessToken, options = {}) {
  if (!args || typeof args !== 'object' || Array.isArray(args)) {
    throw new Error('Tool arguments must be an object.')
  }
  const agentRole = options.agentRole || 'supervisor'
  const fetchImpl = options.fetchImpl || fetch
  const authInfo = enforceToolAuthorization(name, args, agentRole)
  const db = createSupabaseClient({ token: accessToken, fetchImpl })

  if (name === 'github_list_files') {
    const repository = parseRepo(args.repository)
    const path = args.path ? safePath(args.path) : ''
    requireToken('GITHUB_TOKEN', 'GitHub')
    const result = await fetchJson(githubUrl(repository, path), { headers: githubHeaders() }, fetchImpl)
    const entries = Array.isArray(result) ? result : [result]
    return trimResult(entries.slice(0, 120).map((entry) => ({ name: entry.name, path: entry.path, type: entry.type, size: entry.size, url: entry.html_url })))
  }

  if (name === 'github_read_file') {
    const repository = parseRepo(args.repository)
    const path = safePath(args.path)
    requireToken('GITHUB_TOKEN', 'GitHub')
    const file = await githubGetFile(repository, path, fetchImpl)
    return { repository, path, sha: file.sha, content: decodeFile(file).slice(0, MAX_TOOL_TEXT) }
  }

  if (name === 'github_search_code') {
    const repository = parseRepo(args.repository)
    const query = String(args.query || '').trim().slice(0, 120)
    if (query.length < 2) throw new Error('Search query must contain at least two characters.')
    requireToken('GITHUB_TOKEN', 'GitHub')
    const url = GITHUB_API + '/search/code?q=' + encodeURIComponent(query + ' repo:' + repository) + '&per_page=8'
    const result = await fetchJson(url, { headers: { ...githubHeaders(), Accept: 'application/vnd.github.text-match+json' } }, fetchImpl)
    return { total: result.total_count || 0, matches: (result.items || []).slice(0, 8).map((item) => ({ path: item.path, url: item.html_url, repository: item.repository?.full_name })) }
  }

  if (name === 'github_run_release_checks') {
    const repository = parseRepo(args.repository)
    if (repository !== DEFAULT_REPO) throw new Error('The release-verification workflow is configured only for dracorisz/appforge.')
    requireToken('GITHUB_TOKEN', 'GitHub')
    const workflowUrl = 'https://github.com/' + repository + '/actions/workflows/ci.yml'
    await fetchJson(
      GITHUB_API + '/repos/' + repository + '/actions/workflows/ci.yml/dispatches',
      {
        method: 'POST',
        headers: githubHeaders(),
        body: JSON.stringify({ ref: 'main' }),
      },
      fetchImpl
    )
    return { status: 'dispatched', ref: 'main', workflowUrl, message: 'Release verification was requested. Check the workflow status before claiming it passed.' }
  }

  if (name === 'github_get_release_check_status') {
    const repository = parseRepo(args.repository)
    if (repository !== DEFAULT_REPO) throw new Error('The release-verification workflow is configured only for dracorisz/appforge.')
    requireToken('GITHUB_TOKEN', 'GitHub')
    const result = await fetchJson(GITHUB_API + '/repos/' + repository + '/actions/workflows/ci.yml/runs?branch=main&per_page=5', { headers: githubHeaders() }, fetchImpl)
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
    const metadata = await requireRepoMetadata(repository, fetchImpl)
    if (metadata.archived || metadata.disabled) throw new Error('Archived or disabled repositories cannot be modified.')
    let existing = null
    try {
      existing = await githubGetFile(repository, path, fetchImpl)
    } catch (error) {
      if (error.status !== 404) throw error
    }
    if (existing && existing.type !== 'file') throw new Error('The target path is not a file.')
    const action = {
      kind: 'github_file_write',
      repository,
      path,
      content,
      summary,
      operation: existing ? 'update' : 'create',
      expectedSha: existing?.sha || null,
      defaultBranch: metadata.default_branch,
    }
    return createPendingApproval(action, user)
  }

  if (name === 'vercel_list_deployments') {
    const projectId = normalizeVercelProjectId(args.projectId)
    if (!allowedVercelProjects().has(projectId)) throw new Error('Vercel project is not in Companion’s allowed-project list.')
    const token = requireToken('VERCEL_API_TOKEN', 'Vercel')
    const params = new URLSearchParams({ projectId, limit: String(Math.max(1, Math.min(10, Number(args.limit) || 5))) })
    if (args.target === 'production' || args.target === 'preview') params.set('target', args.target)
    const teamId = String(process.env.VERCEL_TEAM_ID || DEFAULT_VERCEL_TEAM_ID).trim()
    if (teamId) params.set('teamId', teamId)
    const result = await fetchJson(VERCEL_API + '/v6/deployments?' + params.toString(), { headers: { Authorization: 'Bearer ' + token } }, fetchImpl)
    return trimResult((result.deployments || []).map((item) => ({ uid: item.uid, url: item.url, state: item.readyState || item.state, target: item.target, createdAt: item.createdAt, meta: { githubCommitSha: item.meta?.githubCommitSha, githubCommitRef: item.meta?.githubCommitRef, githubCommitMessage: item.meta?.githubCommitMessage } })))
  }

  if (name === 'vercel_get_deployment') {
    const id = String(args.deploymentIdOrUrl || '').trim()
    if (!id || id.length > 200 || /[\r\n]/.test(id)) throw new Error('Deployment ID or URL is invalid.')
    const token = requireToken('VERCEL_API_TOKEN', 'Vercel')
    const params = new URLSearchParams()
    const teamId = String(process.env.VERCEL_TEAM_ID || DEFAULT_VERCEL_TEAM_ID).trim()
    if (teamId) params.set('teamId', teamId)
    const result = await fetchJson(VERCEL_API + '/v13/deployments/' + encodeURIComponent(id) + (params.size ? '?' + params.toString() : ''), { headers: { Authorization: 'Bearer ' + token } }, fetchImpl)
    if (!allowedVercelProjects().has(String(result.projectId || ''))) throw new Error('This deployment does not belong to a Companion-allowed Vercel project.')
    return trimResult({ id: result.id, url: result.url, name: result.name, state: result.readyState || result.state, target: result.target, createdAt: result.createdAt, ready: result.ready, meta: { githubCommitSha: result.meta?.githubCommitSha, githubCommitRef: result.meta?.githubCommitRef, githubCommitMessage: result.meta?.githubCommitMessage } })
  }

  if (name === 'supabase_list_tables') {
    const projectId = normalizeSupabaseProjectId(args.projectId)
    const schema = String(args.schema || 'public').trim()
    if (!/^[a-zA-Z_][a-zA-Z0-9_]{0,62}$/.test(schema)) throw new Error('Schema name is invalid.')
    const query = "select table_schema, table_name, column_name, data_type, is_nullable from information_schema.columns where table_schema = '" + schema + "' order by table_name, ordinal_position limit 300"
    return trimResult(await supabaseQuery(projectId, query, fetchImpl))
  }

  if (name === 'supabase_read_table') {
    return trimResult(await supabaseTableRead(args.projectId, args, accessToken, fetchImpl))
  }

  if (name === 'lamat_read_library') {
    if (args.id) {
      const rows = await db
        .select('lamat_library_items', `select=id,title,file_name,mime_type,kind,size_bytes,parsed_text,created_at&id=eq.${encodeURIComponent(String(args.id))}&limit=1`)
        .catch(() => [])
      return rows[0] || { error: 'Library item not found.' }
    }
    const items = await db
      .select('lamat_library_items', 'select=id,title,file_name,mime_type,kind,size_bytes,parsed_text,created_at&order=created_at.desc&limit=25')
      .catch(() => [])
    const q = String(args.query || '').trim().toLowerCase()
    const filtered = q
      ? items.filter((item) => `${item.title} ${item.file_name}`.toLowerCase().includes(q))
      : items
    return trimResult(filtered)
  }

  if (name === 'google_drive_list_files') {
    const query = String(args.query || '').trim()
    const folderId = args.folderId ? parseGoogleDocOrSheetId(args.folderId) : ''
    const qParts = ['trashed = false']
    if (folderId) qParts.push(`'${escapeDriveQueryLiteral(folderId)}' in parents`)
    if (query) qParts.push(`name contains '${escapeDriveQueryLiteral(query)}'`)

    // Also check User Library items first so uploaded docs/sheets are always found!
    const libItems = await db
      .select('lamat_library_items', 'select=id,title,file_name,mime_type,kind,created_at&order=created_at.desc&limit=20')
      .catch(() => [])
    const matchingLib = query
      ? libItems.filter((item) => `${item.title} ${item.file_name}`.toLowerCase().includes(query.toLowerCase()))
      : libItems

    const gcpConfig = getGcpBridgeConfig()
    const { headers, apiKey, gcpToken, source } = await resolveGoogleWorkspaceHeaders(db, fetchImpl)
    const url = new URL('https://www.googleapis.com/drive/v3/files')
    url.searchParams.set('q', qParts.join(' and '))
    url.searchParams.set('pageSize', String(Math.max(1, Math.min(50, Number(args.limit) || 15))))
    url.searchParams.set('supportsAllDrives', 'true')
    url.searchParams.set('includeItemsFromAllDrives', 'true')
    url.searchParams.set('fields', 'files(id,name,mimeType,modifiedTime,size,webViewLink)')
    if (apiKey && !headers.Authorization) url.searchParams.set('key', apiKey)

    try {
      const result = await fetchJson(url.toString(), { headers }, fetchImpl)
      const files = result.files || []
      if (files.length === 0 && matchingLib.length === 0) {
        return {
          files: [],
          authSource: source,
          serviceAccountEmail: gcpConfig.serviceAccountEmail || null,
          hint:
            source === 'user_oauth'
              ? `Connected to your Google Drive via OAuth, but no file matched "${query}". Try a broader search or paste the direct Google Docs/Sheets URL.`
              : `To give Lamat direct access to your personal Google Drive without manual file sharing, sign in via "Continue with Google" (which grants Drive/Docs/Sheets readonly access), OR paste a Google Docs/Sheets URL with "Anyone with the link can view", OR upload the file to your Lamat Library.`,
        }
      }
      return trimResult([
        ...matchingLib.map((item) => ({
          id: item.id,
          name: item.title || item.file_name,
          mimeType: item.mime_type,
          source: 'lamat_library',
        })),
        ...files,
      ])
    } catch (driveErr) {
      const errMsg = String(driveErr?.message || '')
      if (/has not been used in project|disabled/i.test(errMsg) && gcpToken && gcpConfig.projectNumber) {
        await tryEnableGcpWorkspaceApis(gcpToken, gcpConfig.projectNumber, fetchImpl)
      }
      if (matchingLib.length > 0) {
        return trimResult(
          matchingLib.map((item) => ({
            id: item.id,
            name: item.title || item.file_name,
            mimeType: item.mime_type,
            source: 'lamat_library',
          }))
        )
      }
      return {
        files: [],
        error: errMsg || 'Google Drive API access failed.',
        serviceAccountEmail: gcpConfig.serviceAccountEmail || null,
        hint: `You can paste any link-shared Google Docs or Google Sheets URL directly in chat (works without GCP Drive API), upload the document via the composer (saved to your Library), or enable Drive/Sheets API in GCP project ${gcpConfig.projectNumber}.`,
      }
    }
  }

  if (name === 'google_drive_read_file') {
    const rawInput = String(args.fileId || '').trim()
    const fileId = parseGoogleDocOrSheetId(rawInput)
    if (!fileId) throw new Error('Valid fileId or document URL is required.')

    // 1. Check if this is an item in the user's Lamat Library
    const libRows = await db
      .select('lamat_library_items', `select=id,title,file_name,mime_type,parsed_text&id=eq.${encodeURIComponent(fileId)}&limit=1`)
      .catch(() => [])
    if (libRows[0]) {
      return {
        fileId: libRows[0].id,
        name: libRows[0].title || libRows[0].file_name,
        mimeType: libRows[0].mime_type,
        content: redactSecrets(libRows[0].parsed_text || '').slice(0, MAX_TOOL_TEXT),
      }
    }

    // 2. Try direct link-shared export FIRST if it looks like a Google Doc or Sheet URL/ID (works without GCP APIs enabled!)
    if (/spreadsheets/i.test(rawInput)) {
      const sheetExp = await fetchImpl(`https://docs.google.com/spreadsheets/d/${encodeURIComponent(fileId)}/export?format=csv`, {
        signal: AbortSignal.timeout(REQUEST_TIMEOUT),
      }).catch(() => null)
      if (sheetExp && sheetExp.ok) {
        const csv = await sheetExp.text()
        if (csv && !csv.trim().startsWith('<!DOCTYPE html>')) {
          return { fileId, name: 'Google Spreadsheet', mimeType: 'text/csv', content: redactSecrets(csv).slice(0, MAX_TOOL_TEXT) }
        }
      }
    } else if (/document/i.test(rawInput)) {
      const docExp = await fetchImpl(`https://docs.google.com/document/d/${encodeURIComponent(fileId)}/export?format=txt`, {
        signal: AbortSignal.timeout(REQUEST_TIMEOUT),
      }).catch(() => null)
      if (docExp && docExp.ok) {
        const text = await docExp.text()
        if (text && !text.trim().startsWith('<!DOCTYPE html>')) {
          return { fileId, name: 'Google Document', mimeType: 'text/plain', content: redactSecrets(text).slice(0, MAX_TOOL_TEXT) }
        }
      }
    }

    // 3. Use Google Drive v3 API with User OAuth or Service Account token
    const { headers, apiKey } = await resolveGoogleWorkspaceHeaders(db, fetchImpl)
    const metaUrl = new URL(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}`)
    metaUrl.searchParams.set('supportsAllDrives', 'true')
    metaUrl.searchParams.set('fields', 'id,name,mimeType,size,webViewLink')
    if (apiKey && !headers.Authorization) metaUrl.searchParams.set('key', apiKey)

    try {
      const meta = await fetchJson(metaUrl.toString(), { headers }, fetchImpl)
      let content = ''
      if (meta.mimeType === 'application/vnd.google-apps.document') {
        const expUrl = new URL(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}/export`)
        expUrl.searchParams.set('mimeType', 'text/plain')
        if (apiKey && !headers.Authorization) expUrl.searchParams.set('key', apiKey)
        const res = await fetchImpl(expUrl.toString(), { headers, signal: AbortSignal.timeout(REQUEST_TIMEOUT) })
        content = await res.text()
      } else if (meta.mimeType === 'application/vnd.google-apps.spreadsheet') {
        const expUrl = new URL(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}/export`)
        expUrl.searchParams.set('mimeType', 'text/csv')
        if (apiKey && !headers.Authorization) expUrl.searchParams.set('key', apiKey)
        const res = await fetchImpl(expUrl.toString(), { headers, signal: AbortSignal.timeout(REQUEST_TIMEOUT) })
        content = await res.text()
      } else {
        const downUrl = new URL(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}`)
        downUrl.searchParams.set('alt', 'media')
        if (apiKey && !headers.Authorization) downUrl.searchParams.set('key', apiKey)
        const res = await fetchImpl(downUrl.toString(), { headers, signal: AbortSignal.timeout(REQUEST_TIMEOUT) })
        content = await res.text()
      }
      return {
        fileId,
        name: meta.name,
        mimeType: meta.mimeType,
        content: redactSecrets(content).slice(0, MAX_TOOL_TEXT),
      }
    } catch (driveErr) {
      // Fallback: try both direct link-shared exports
      const docExp = await fetchImpl(`https://docs.google.com/document/d/${encodeURIComponent(fileId)}/export?format=txt`, {
        signal: AbortSignal.timeout(REQUEST_TIMEOUT),
      }).catch(() => null)
      if (docExp && docExp.ok) {
        const text = await docExp.text()
        if (text && !text.trim().startsWith('<!DOCTYPE html>')) {
          return { fileId, name: 'Link-Shared Google Doc', mimeType: 'text/plain', content: redactSecrets(text).slice(0, MAX_TOOL_TEXT) }
        }
      }
      const sheetExp = await fetchImpl(`https://docs.google.com/spreadsheets/d/${encodeURIComponent(fileId)}/export?format=csv`, {
        signal: AbortSignal.timeout(REQUEST_TIMEOUT),
      }).catch(() => null)
      if (sheetExp && sheetExp.ok) {
        const csv = await sheetExp.text()
        if (csv && !csv.trim().startsWith('<!DOCTYPE html>')) {
          return { fileId, name: 'Link-Shared Google Sheet', mimeType: 'text/csv', content: redactSecrets(csv).slice(0, MAX_TOOL_TEXT) }
        }
      }
      throw driveErr
    }
  }

  if (name === 'google_docs_read') {
    const documentId = parseGoogleDocOrSheetId(args.documentId)
    if (!documentId) throw new Error('Valid documentId or Google Docs URL is required.')

    // Try direct link-shared export first so link-shared docs work even without GCP Docs API enabled
    const expRes = await fetchImpl(`https://docs.google.com/document/d/${encodeURIComponent(documentId)}/export?format=txt`, {
      signal: AbortSignal.timeout(REQUEST_TIMEOUT),
    }).catch(() => null)
    if (expRes && expRes.ok) {
      const text = await expRes.text()
      if (text && !text.trim().startsWith('<!DOCTYPE html>')) {
        return {
          documentId,
          title: 'Google Document',
          text: redactSecrets(text).slice(0, MAX_TOOL_TEXT),
        }
      }
    }

    const { headers, apiKey } = await resolveGoogleWorkspaceHeaders(db, fetchImpl)
    const url = new URL(`https://docs.googleapis.com/v1/documents/${encodeURIComponent(documentId)}`)
    if (apiKey && !headers.Authorization) url.searchParams.set('key', apiKey)

    const doc = await fetchJson(url.toString(), { headers }, fetchImpl)
    let extractedText = ''
    const contentList = doc.body?.content || []
    for (const elem of contentList) {
      if (elem.paragraph?.elements) {
        for (const pe of elem.paragraph.elements) {
          if (pe.textRun?.content) extractedText += pe.textRun.content
        }
      } else if (elem.table?.tableRows) {
        for (const row of elem.table.tableRows) {
          const cells = []
          for (const cell of row.tableCells || []) {
            let cellText = ''
            for (const cellElem of cell.content || []) {
              if (cellElem.paragraph?.elements) {
                for (const pe of cellElem.paragraph.elements) {
                  if (pe.textRun?.content) cellText += pe.textRun.content.trim()
                }
              }
            }
            cells.push(cellText)
          }
          extractedText += cells.join(' | ') + '\n'
        }
      }
    }
    return {
      documentId,
      title: doc.title,
      text: redactSecrets(extractedText).slice(0, MAX_TOOL_TEXT),
    }
  }

  if (name === 'google_sheets_read') {
    const spreadsheetId = parseGoogleDocOrSheetId(args.spreadsheetId)
    if (!spreadsheetId) throw new Error('Valid spreadsheetId or Google Sheets URL is required.')
    const range = String(args.range || 'A1:Z100').trim()

    // Try direct link-shared CSV export first so link-shared spreadsheets work without GCP Sheets API enabled
    const csvRes = await fetchImpl(`https://docs.google.com/spreadsheets/d/${encodeURIComponent(spreadsheetId)}/export?format=csv`, {
      signal: AbortSignal.timeout(REQUEST_TIMEOUT),
    }).catch(() => null)
    if (csvRes && csvRes.ok) {
      const csvText = await csvRes.text()
      if (csvText && !csvText.trim().startsWith('<!DOCTYPE html>')) {
        const rows = csvText
          .split(/\r?\n/)
          .filter((line) => line.trim().length > 0)
          .slice(0, 150)
          .map((line) => line.split(',').map((cell) => cell.replace(/^"|"$/g, '').trim()))
        return {
          spreadsheetId,
          range: 'CSV Export',
          values: rows,
          rowCount: rows.length,
        }
      }
    }

    const { headers, apiKey } = await resolveGoogleWorkspaceHeaders(db, fetchImpl)
    const url = new URL(`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(range)}`)
    if (apiKey && !headers.Authorization) url.searchParams.set('key', apiKey)

    const result = await fetchJson(url.toString(), { headers }, fetchImpl)
    return {
      spreadsheetId,
      range: result.range || range,
      values: result.values || [],
      rowCount: (result.values || []).length,
    }
  }

  if (name === 'lamat_inspect_environment') {
    const [gcpStatus, budget, prefRows] = await Promise.all([
      getCachedGcpQuotaAndBillingStatus({ fetchImpl }),
      db.rpc('lamat_budget_status').catch(() => null),
      db.select('user_preferences', 'select=preferences&limit=1').catch(() => []),
    ])
    const hasPersonalGoogleToken = Boolean(prefRows?.[0]?.preferences?.google_provider_token)
    return {
      engine: 'Lamat',
      repository: DEFAULT_REPO,
      vercelProject: DEFAULT_VERCEL_PROJECT,
      domains: ['https://pf-appforge.vercel.app', 'https://www.sstoken.space'],
      supabaseProject: DEFAULT_SUPABASE_PROJECT,
      googleCloud: gcpStatus,
      personalGoogleDriveConnected: hasPersonalGoogleToken,
      googleDriveInstructions: hasPersonalGoogleToken
        ? 'Personal Google OAuth token is active for Drive/Docs/Sheets access.'
        : 'Paste any link-shared Google Docs/Sheets URL directly, upload files to the Lamat Library, or sign in with Google to grant Drive access.',
      availableModels: AVAILABLE_MODELS,
      budget,
    }
  }

  if (name === 'lamat_check_budget_and_resources') {
    const [budget, resources, gcpStatus] = await Promise.all([
      db.rpc('lamat_budget_status').catch(() => null),
      db.select('maya_resources', 'select=id,kind,name,amount,unit,as_of,expires_on,provenance,source,notes,updated_at&order=updated_at.desc&limit=30').catch(() => []),
      getCachedGcpQuotaAndBillingStatus({ fetchImpl }),
    ])
    return {
      budget,
      gcpStatus,
      resources,
      verified_count: resources.filter((r) => r.provenance === 'verified').length,
      estimated_count: resources.filter((r) => r.provenance !== 'verified').length,
    }
  }

  if (name === 'lamat_read_financial_summary') {
    const [summary, debts, accounts, recurring, incomes] = await Promise.all([
      db.rpc('fin_summary').catch(() => null),
      db.select('fin_debts', 'select=id,creditor,kind,currency,balance_minor,min_payment_minor,due_date,status,consequence_note&order=due_date.asc.nullslast&limit=30').catch(() => []),
      db.select('fin_accounts', 'select=id,name,kind,currency,opening_balance_minor,archived&archived=eq.false&limit=20').catch(() => []),
      db.select('fin_recurring', 'select=id,name,amount_minor,currency,cadence,next_due,essential,active&active=eq.true&limit=30').catch(() => []),
      db.select('fin_income_sources', 'select=id,name,kind,currency,expected_minor,cadence,status&status=neq.ended&limit=20').catch(() => []),
    ])
    return { summary, debts, accounts, recurring, incomes }
  }

  if (name === 'lamat_upsert_financial_record') {
    const recordType = String(args.record_type || '').trim().toLowerCase()
    const itemName = String(args.name || '').trim().slice(0, 180)
    const rawAmount = Number(args.amount || 0)
    if (!itemName || !Number.isFinite(rawAmount)) {
      throw new Error('Financial record requires a valid name and numeric amount.')
    }
    const currency = ['EUR', 'USD', 'RSD'].includes(String(args.currency || '').toUpperCase())
      ? String(args.currency).toUpperCase()
      : 'EUR'
    const amountMinor = Math.round(rawAmount * 100)

    if (recordType === 'account') {
      const kind = ['cash', 'bank', 'card', 'wallet', 'other'].includes(String(args.kind)) ? String(args.kind) : 'bank'
      const created = await db.insert('fin_accounts', {
        user_id: user.id,
        name: itemName,
        kind,
        currency,
        opening_balance_minor: amountMinor,
        note: args.note ? String(args.note).slice(0, 400) : 'Recorded by Lamat',
      })
      return { recorded: 'fin_accounts', id: created?.id || null, name: itemName, amount: rawAmount, currency }
    }

    if (recordType === 'debt') {
      const kind = ['loan', 'card', 'bill_arrears', 'personal', 'tax', 'other'].includes(String(args.kind)) ? String(args.kind) : 'other'
      const created = await db.insert('fin_debts', {
        user_id: user.id,
        creditor: itemName,
        kind,
        currency,
        principal_minor: Math.max(0, amountMinor),
        balance_minor: Math.max(0, amountMinor),
        due_date: args.due_date ? String(args.due_date).slice(0, 10) : null,
        consequence_note: args.consequence_note ? String(args.consequence_note).slice(0, 400) : null,
        note: args.note ? String(args.note).slice(0, 400) : 'Recorded by Lamat',
        status: 'active',
      })
      return { recorded: 'fin_debts', id: created?.id || null, creditor: itemName, balance: rawAmount, currency }
    }

    if (recordType === 'recurring') {
      const cadence = ['weekly', 'monthly', 'yearly'].includes(String(args.cadence)) ? String(args.cadence) : 'monthly'
      const nextDue = args.due_date ? String(args.due_date).slice(0, 10) : new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)
      const created = await db.insert('fin_recurring', {
        user_id: user.id,
        name: itemName,
        amount_minor: amountMinor === 0 ? 100 : amountMinor,
        currency,
        cadence,
        next_due: nextDue,
        essential: Boolean(args.essential ?? true),
        active: true,
        note: args.note ? String(args.note).slice(0, 400) : 'Recorded by Lamat',
      })
      return { recorded: 'fin_recurring', id: created?.id || null, name: itemName, amount: rawAmount, currency, cadence }
    }

    if (recordType === 'income') {
      const kind = ['employment', 'freelance', 'benefit', 'other'].includes(String(args.kind)) ? String(args.kind) : 'freelance'
      const cadence = ['once', 'weekly', 'monthly', 'yearly'].includes(String(args.cadence)) ? String(args.cadence) : 'monthly'
      const created = await db.insert('fin_income_sources', {
        user_id: user.id,
        name: itemName,
        kind,
        currency,
        expected_minor: Math.max(0, amountMinor),
        cadence,
        status: 'pipeline',
        note: args.note ? String(args.note).slice(0, 400) : 'Recorded by Lamat',
      })
      return { recorded: 'fin_income_sources', id: created?.id || null, name: itemName, expected: rawAmount, currency }
    }

    throw new Error('Unsupported financial record_type. Use account, debt, recurring, or income.')
  }

  if (name === 'lamat_generate_image') {
    const prompt = String(args.prompt || '').trim().slice(0, 900)
    if (prompt.length < 3) throw new Error('Image prompt must be at least 3 characters.')

    const saveImageToLibrary = async (dataUrl, providerName, modelName) => {
      await db
        .insert('lamat_library_items', {
          user_id: user.id,
          title: prompt.slice(0, 120),
          file_name: `generated-${Date.now()}.png`,
          mime_type: 'image/png',
          kind: 'image',
          size_bytes: Math.floor((dataUrl.length * 3) / 4),
          thumbnail_data: dataUrl,
          parsed_text: `Generated image for prompt: "${prompt}" (${providerName} · ${modelName})`,
          metadata: { prompt, provider: providerName, model: modelName },
        })
        .catch(() => {})
    }

    // Tier 1: Direct Google Cloud Vertex AI Imagen 3 (uses GCP trial credit)
    const gcpConfig = getGcpBridgeConfig()
    if (gcpConfig.configured) {
      try {
        const { accessToken: gcpAccessToken, idToken } = await createGcpBridgeCredentials()
        const imagenUrl = `https://us-central1-aiplatform.googleapis.com/v1/projects/${encodeURIComponent(gcpConfig.projectNumber)}/locations/us-central1/publishers/google/models/imagen-3.0-fast-generate-001:predict`
        const directRes = await fetchImpl(imagenUrl, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${gcpAccessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            instances: [{ prompt }],
            parameters: { sampleCount: 1, aspectRatio: '1:1' },
          }),
          signal: AbortSignal.timeout(25000),
        }).catch(() => null)

        if (directRes && directRes.ok) {
          const directJson = await directRes.json().catch(() => ({}))
          const b64 = directJson?.predictions?.[0]?.bytesBase64Encoded
          const mime = directJson?.predictions?.[0]?.mimeType || 'image/png'
          if (b64) {
            const dataUrl = `data:${mime};base64,${b64}`
            await saveImageToLibrary(dataUrl, 'vertex-ai', 'imagen-3.0-fast-generate-001')
            return {
              generated: true,
              provider: 'vertex-ai',
              model: 'imagen-3.0-fast-generate-001',
              prompt,
              imageDataUrl: dataUrl,
              message: 'Image generated via Google Cloud Vertex AI Imagen 3 and saved to your Library.',
            }
          }
        }

        // Tier 2: Cloud Run Worker (with required userId parameter fixed!)
        const job = await callCloudWorker({
          config: gcpConfig,
          idToken,
          path: '/v1/jobs',
          method: 'POST',
          body: {
            userId: String(user.id),
            kind: 'image_generate',
            model: 'imagen-3.0-fast-generate-001',
            prompt,
            sampleCount: 1,
            width: 1024,
            height: 1024,
          },
        }).catch(() => null)
        if (job?.outputUri) {
          const downloaded = await downloadPrivateWorkerObject({
            config: gcpConfig,
            accessToken: gcpAccessToken,
            uri: job.outputUri,
          })
          const dataUrl = `data:${downloaded.contentType};base64,${downloaded.buffer.toString('base64')}`
          await saveImageToLibrary(dataUrl, 'vertex-ai-worker', 'imagen-3.0-fast-generate-001')
          return {
            generated: true,
            provider: 'vertex-ai',
            model: 'imagen-3.0-fast-generate-001',
            prompt,
            imageDataUrl: dataUrl,
            message: 'Image generated via Vertex AI Cloud Worker and saved to your Library.',
          }
        }
      } catch {
        // Fall through to free FLUX image generator
      }
    }

    // Tier 3: Free Zero-Cost FLUX Image Generation Fallback (works even with $0 HF credits)
    const freeImgUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=768&height=768&nologo=true&model=flux&seed=${Math.floor(Math.random() * 100000)}`
    const freeRes = await fetchImpl(freeImgUrl, {
      signal: AbortSignal.timeout(22000),
    }).catch(() => null)
    if (freeRes && freeRes.ok) {
      const buf = Buffer.from(await freeRes.arrayBuffer())
      if (buf.length > 0 && buf.length <= 2_500_000) {
        const mime = String(freeRes.headers.get('content-type') || 'image/jpeg').split(';')[0]
        const dataUrl = `data:${mime};base64,${buf.toString('base64')}`
        await saveImageToLibrary(dataUrl, 'flux-free', 'FLUX.1')
        return {
          generated: true,
          provider: 'flux-free',
          model: 'FLUX.1',
          prompt,
          imageDataUrl: dataUrl,
          message: 'Image generated via FLUX and saved to your Library.',
        }
      }
    }

    // If direct binary fetch timed out, return the direct embeddable FLUX image URL so it still renders in chat!
    await saveImageToLibrary(freeImgUrl, 'flux-free', 'FLUX.1')
    return {
      generated: true,
      provider: 'flux-free',
      model: 'FLUX.1',
      prompt,
      imageDataUrl: freeImgUrl,
      message: 'Image generated via FLUX and saved to your Library.',
    }
  }

  if (name === 'lamat_record_memory' || name === 'maya_remember') {
    const kind = String(args.kind || 'fact').trim()
    const content = String(args.content || '').trim()
    if (!content) throw new Error('Memory content cannot be empty.')
    const provenance = ['stated_by_owner', 'observed', 'verified_tool', 'inferred'].includes(String(args.provenance))
      ? String(args.provenance)
      : 'inferred'
    const confidence = typeof args.confidence === 'number' ? Math.max(0, Math.min(1, args.confidence)) : 0.8

    const recent = await db.select('maya_memories', `select=id,content,kind&status=eq.active&kind=eq.${encodeURIComponent(kind)}&order=created_at.desc&limit=25`).catch(() => [])
    const duplicate = recent.find((m) => String(m.content || '').trim().toLowerCase() === content.toLowerCase())
    if (duplicate) {
      return { deduplicated: true, id: duplicate.id, message: 'Identical active memory already exists.' }
    }

    if (args.supersedes_id) {
      await db.delete('maya_memories', `id=eq.${encodeURIComponent(String(args.supersedes_id))}`).catch(() => {})
    }

    const inserted = await db.insert('maya_memories', {
      kind,
      content: content.slice(0, 4000),
      provenance,
      confidence,
      tags: Array.isArray(args.tags) ? args.tags.map((t) => String(t).slice(0, 40)).slice(0, 10) : [],
      created_by: 'lamat',
    })
    return { inserted: inserted?.id || null, kind, provenance, confidence }
  }

  if (name === 'lamat_manage_memories') {
    const ids = Array.isArray(args.memory_ids) ? args.memory_ids.map((id) => String(id).trim()).filter(Boolean) : []
    if (!ids.length) throw new Error('At least one memory ID is required.')
    const deletedIds = []
    for (const id of ids.slice(0, 25)) {
      await db.delete('maya_memories', `id=eq.${encodeURIComponent(id)}`).catch(() => {})
      deletedIds.push(id)
    }
    return { deletedCount: deletedIds.length, memoryIds: deletedIds }
  }

  if (name === 'lamat_upsert_goal' || name === 'maya_update_goal') {
    if (args.id) {
      const id = String(args.id)
      const patch = {}
      if (args.title !== undefined) patch.title = String(args.title).slice(0, 300)
      if (args.description !== undefined) patch.description = args.description ? String(args.description) : null
      if (args.success_criteria !== undefined) patch.success_criteria = args.success_criteria ? String(args.success_criteria) : null
      if (typeof args.priority === 'number') patch.priority = Math.max(1, Math.min(5, Math.round(args.priority)))
      if (args.horizon !== undefined) patch.horizon = ['now', 'soon', 'later'].includes(String(args.horizon)) ? String(args.horizon) : null
      if (args.status !== undefined) patch.status = ['proposed', 'active', 'blocked', 'done', 'dropped'].includes(String(args.status)) ? String(args.status) : 'active'
      if (args.target_date !== undefined) patch.target_date = args.target_date ? String(args.target_date) : null
      const updated = await db.update('maya_goals', `id=eq.${encodeURIComponent(id)}`, patch)
      return { updated: updated?.id || id }
    }
    const created = await db.insert('maya_goals', {
      title: String(args.title || 'New goal').slice(0, 300),
      description: args.description ? String(args.description) : null,
      success_criteria: args.success_criteria ? String(args.success_criteria) : null,
      priority: typeof args.priority === 'number' ? Math.max(1, Math.min(5, Math.round(args.priority))) : 3,
      horizon: ['now', 'soon', 'later'].includes(String(args.horizon)) ? String(args.horizon) : 'soon',
      status: ['proposed', 'active', 'blocked', 'done', 'dropped'].includes(String(args.status)) ? String(args.status) : 'proposed',
      parent_id: args.parent_id ? String(args.parent_id) : null,
      target_date: args.target_date ? String(args.target_date) : null,
      created_by: 'lamat',
    })
    return { created: created?.id || null }
  }

  if (name === 'lamat_create_task') {
    const title = String(args.title || '').trim().slice(0, 300)
    const rationale = String(args.rationale || '').trim()
    const expectedOutcome = String(args.expected_outcome || '').trim()
    if (!title || !rationale || !expectedOutcome) {
      throw new Error('Creating a task requires title, rationale, and expected_outcome.')
    }
    const idempotencyKey = args.idempotency_key
      ? String(args.idempotency_key).trim().slice(0, 120)
      : `task-${createHash('sha256').update(`${title.toLowerCase()}:${args.goal_id || ''}`).digest('hex').slice(0, 24)}`

    const existing = await db.select('lamat_tasks', `select=id,status,title&idempotency_key=eq.${encodeURIComponent(idempotencyKey)}&limit=1`).catch(() => [])
    if (existing.length > 0) {
      return { deduplicated: true, task: existing[0] }
    }

    const priority = typeof args.priority === 'number' ? Math.max(1, Math.min(5, Math.round(args.priority))) : 3
    const priorityScore = Number((110 - priority * 15).toFixed(2))
    const created = await db.insert('lamat_tasks', {
      idempotency_key: idempotencyKey,
      goal_id: args.goal_id ? String(args.goal_id) : null,
      project_id: args.project_id ? String(args.project_id) : null,
      title,
      description: args.description ? String(args.description) : null,
      rationale,
      kind: ['research', 'planning', 'execution', 'verification', 'maintenance', 'financial', 'opportunity'].includes(String(args.kind))
        ? String(args.kind)
        : 'execution',
      status: 'queued',
      priority,
      priority_score: priorityScore,
      expected_outcome: expectedOutcome,
      verification_method: args.verification_method ? String(args.verification_method) : 'Inspect output and verify against expected outcome.',
      plan_steps: Array.isArray(args.plan_steps) ? args.plan_steps : [],
      estimated_cost_usd: typeof args.estimated_cost_usd === 'number' ? Math.max(0, args.estimated_cost_usd) : 0.01,
      created_by: 'lamat',
    })
    return { created: true, task: created }
  }

  if (name === 'lamat_update_task') {
    const id = String(args.id || '').trim()
    if (!id) throw new Error('Task id is required.')
    const patch = {}
    if (args.status) patch.status = String(args.status)
    if (typeof args.deliverable === 'string' && args.deliverable.trim()) patch.deliverable = args.deliverable.trim()
    if (typeof args.current_step_index === 'number') patch.current_step_index = Math.max(0, args.current_step_index)
    if (args.checkpoint_state && typeof args.checkpoint_state === 'object') patch.checkpoint_state = args.checkpoint_state
    if (args.result && typeof args.result === 'object') patch.result = args.result
    if (args.verification_evidence && typeof args.verification_evidence === 'object') patch.verification_evidence = args.verification_evidence
    if (args.blocker_reason !== undefined) patch.blocker_reason = args.blocker_reason ? String(args.blocker_reason) : null
    if (patch.status === 'completed') {
      patch.completed_at = new Date().toISOString()
      patch.lease_owner = null
      patch.lease_expires_at = null
    }
    const updated = await db.update('lamat_tasks', `id=eq.${encodeURIComponent(id)}`, patch)
    return { updated: updated?.id || id, status: updated?.status || patch.status }
  }

  if (name === 'lamat_ask_question') {
    const question = String(args.question || '').trim().slice(0, 2000)
    const contextWhy = String(args.context_why || '').trim()
    if (!question || !contextWhy) throw new Error('Both question and context_why are required.')

    const pending = await db.select('lamat_questions', 'select=id,question,task_id&status=eq.pending&limit=20').catch(() => [])
    const existing = pending.find((q) => String(q.question || '').trim().toLowerCase() === question.toLowerCase())
    if (existing) {
      return { deduplicated: true, question_id: existing.id, status: 'pending' }
    }

    const created = await db.insert('lamat_questions', {
      task_id: args.task_id ? String(args.task_id) : null,
      goal_id: args.goal_id ? String(args.goal_id) : null,
      question,
      context_why: contextWhy,
      missing_info: args.missing_info ? String(args.missing_info) : null,
      options: Array.isArray(args.options) ? args.options.map((o) => String(o)) : [],
      status: 'pending',
    })

    if (args.task_id) {
      await db.update('lamat_tasks', `id=eq.${encodeURIComponent(String(args.task_id))}`, {
        status: 'waiting_input',
        blocker_reason: `Waiting for owner answer: ${question.slice(0, 140)}`,
        lease_owner: null,
        lease_expires_at: null,
      }).catch(() => {})
    }

    return { question_id: created?.id || null, status: 'pending', task_paused: Boolean(args.task_id) }
  }

  if (name === 'lamat_propose_action' || name === 'maya_propose_action') {
    const category = String(args.category || args.action_type || '').trim()
    if (FORBIDDEN_POLICY_CATEGORIES.has(category)) {
      throw new Error(`Action category "${category}" is forbidden by autonomy policy.`)
    }
    const summary = String(args.summary || args.rationale || 'Proposed action').trim().slice(0, 500)
    const payload = args.payload && typeof args.payload === 'object' ? args.payload : {}
    const parameterHash = computeActionParameterHash({
      kind: 'lamat_action',
      category,
      target: args.target || '',
      summary,
      payload,
      estimatedCostUsd: Number(args.estimated_cost_usd || 0),
    })
    const created = await db.insert('maya_actions', {
      category,
      summary,
      target: args.target ? String(args.target) : null,
      payload: { ...payload, _parameter_hash: parameterHash, ...(args.task_id ? { task_id: String(args.task_id) } : {}) },
      estimated_cost_usd: typeof args.estimated_cost_usd === 'number' ? Math.max(0, args.estimated_cost_usd) : 0,
      actor: 'lamat',
    })

    if (args.task_id && created?.status === 'proposed') {
      await db.update('lamat_tasks', `id=eq.${encodeURIComponent(String(args.task_id))}`, {
        status: 'waiting_approval',
        blocker_reason: `Waiting for owner approval on ${category}: ${summary.slice(0, 140)}`,
        lease_owner: null,
        lease_expires_at: null,
      }).catch(() => {})
    }

    return {
      action_id: created?.id || null,
      status: created?.status || 'proposed',
      tier: created?.tier_at_request || (authInfo.requiresOwnerApproval ? 'approve' : 'auto'),
      parameter_hash: parameterHash,
      requires_approval: created?.status === 'proposed',
    }
  }

  if (name === 'lamat_revise_self_model' || name === 'maya_revise_self_model') {
    const rawContent = args.content
    const contentObj =
      rawContent && typeof rawContent === 'object' && !Array.isArray(rawContent)
        ? rawContent
        : { summary: String(rawContent || '') }
    const created = await db.insert('maya_self_model', {
      content: contentObj,
      rationale: args.rationale ? String(args.rationale) : 'Self-model updated from verified evidence',
      created_by: 'lamat',
    })
    return { version: created?.version || null }
  }

  if (name === 'lamat_switch_model' || name === 'maya_switch_model') {
    const allowedIds = new Set(AVAILABLE_MODELS.map((m) => m.id).concat(['auto', 'gemini-2.5-flash', 'gemini-2.5-pro']))
    const model = String(args.model || '').trim()
    if (!allowedIds.has(model)) throw new Error('Model is not in Lamat’s supported model list.')
    const mode = String(args.mode || 'routine').trim()
    const patch = {}
    if (mode === 'code' || mode === 'reasoning') patch.reasoning_model = model
    else if (mode === 'free' || mode === 'overnight') patch.free_model = model
    else if (mode === 'chat') patch.preferred_chat_model = model
    else patch.routine_model = model
    if (typeof args.overnight_free_only === 'boolean') {
      patch.overnight_free_only = args.overnight_free_only
    }
    await db.update('lamat_budget_config', 'id=eq.default', patch).catch(() => {})
    const created = await db.insert('maya_actions', {
      category: 'memory_write',
      summary: `Switched ${mode} model to ${model}`,
      target: model,
      payload: { model, mode, rationale: args.rationale || 'Model switch requested' },
      actor: 'lamat',
    }).catch(() => null)
    return { logged: true, action_id: created?.id || null, model, mode }
  }

  throw new Error('Unknown Lamat tool: ' + String(name).slice(0, 80))
}

export async function executeApprovedCompanionAction(token, user, { fetchImpl = fetch } = {}) {
  const payload = verifyApproval(token)
  if (payload.version !== 1 || String(payload.userId) !== String(user.id)) {
    throw new Error('This approval was not issued for the current owner session.')
  }
  const action = payload.action
  if (!action || action.kind !== 'github_file_write') {
    throw new Error('This approval action is not supported.')
  }
  if (payload.parameterHash && computeActionParameterHash(action) !== payload.parameterHash) {
    throw new Error('Approval parameters were modified after signing. Renewed approval is required.')
  }
  const repository = parseRepo(action.repository)
  const path = safePath(action.path)
  if (isProtectedWritePath(path)) throw new Error('This path is protected from Companion writes.')
  requireToken('GITHUB_TOKEN', 'GitHub')
  const metadata = await requireRepoMetadata(repository, fetchImpl)
  if (metadata.archived || metadata.disabled || metadata.default_branch !== action.defaultBranch) {
    throw new Error('Repository state changed since approval was requested. Review the change again.')
  }
  let current = null
  try {
    current = await githubGetFile(repository, path, fetchImpl)
  } catch (error) {
    if (error.status !== 404) throw error
  }
  if (action.expectedSha) {
    if (!current || current.sha !== action.expectedSha) {
      throw new Error('The file changed after the approval request. Re-read it and prepare a fresh change.')
    }
  } else if (current) {
    throw new Error('The file now exists; the create request is stale. Re-read it and prepare an update instead.')
  }
  const body = {
    message: action.summary,
    content: Buffer.from(String(action.content), 'utf8').toString('base64'),
    branch: action.defaultBranch,
  }
  if (action.expectedSha) body.sha = action.expectedSha
  const result = await fetchJson(githubUrl(repository, path), { method: 'PUT', headers: githubHeaders(), body: JSON.stringify(body) }, fetchImpl)
  return {
    text:
      'GitHub file ' +
      (action.expectedSha ? 'updated' : 'created') +
      ' successfully on ' +
      repository +
      ' (' +
      action.defaultBranch +
      ').\n\nFile: ' +
      path +
      '\nCommit: ' +
      String(result.commit?.sha || '').slice(0, 12) +
      '\n\nThis confirms the commit was accepted by GitHub; it does not confirm that tests passed or that production was deployed.',
  }
}
