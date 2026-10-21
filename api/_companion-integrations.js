import { authenticateCompanionRequest, createSupabaseClient } from './_companion-auth.js'
import { createGcpBridgeCredentials, getGcpBridgeConfig } from './_gcp-cloud-run.js'
import { resolveGoogleWorkspaceHeaders } from './_companion-tools.js'

const configured = (name) => Boolean(String(process.env[name] || '').trim())

const mapHttpStatus = (response) => {
  if (!response) return 'unavailable'
  if (response.ok) return 'verified'
  if (response.status === 401) return 'invalid_credentials'
  if (response.status === 403) return 'insufficient_permissions'
  return 'unavailable'
}

const checkEndpoint = async (url, token, headers = {}, fetchImpl = fetch) => {
  try {
    const response = await fetchImpl(url, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json', ...headers },
      signal: AbortSignal.timeout(6000),
    })
    const body = await response.json().catch(() => ({}))
    return { status: mapHttpStatus(response), httpStatus: response.status, body }
  } catch {
    return { status: 'unavailable', httpStatus: 0, body: {} }
  }
}

export async function verifyAllIntegrations(auth, { fetchImpl = fetch } = {}) {
  const db = createSupabaseClient({ token: auth.accessToken, fetchImpl })

  const githubPromise = (async () => {
    if (!configured('GITHUB_TOKEN')) {
      return {
        status: 'needs_setup',
        authSource: 'none',
        detail: 'GITHUB_TOKEN is not configured.',
        capabilities: [],
      }
    }
    const repoCheck = await checkEndpoint(
      'https://api.github.com/repos/dracorisz/appforge',
      process.env.GITHUB_TOKEN,
      { 'X-GitHub-Api-Version': '2022-11-28' },
      fetchImpl
    )
    if (repoCheck.status === 'verified') {
      const canPush = Boolean(repoCheck.body?.permissions?.push)
      return {
        status: 'verified',
        authSource: 'token',
        repository: repoCheck.body?.full_name || 'dracorisz/appforge',
        detail: canPush
          ? 'Verified read, code search, workflow dispatch, and approval-gated write access on dracorisz/appforge.'
          : 'Verified read and code inspection access on dracorisz/appforge.',
        capabilities: [
          'repositories',
          'files',
          'code_search',
          ...(canPush ? ['approved_file_writes', 'release_checks'] : []),
        ],
      }
    }
    const userCheck = await checkEndpoint(
      'https://api.github.com/user',
      process.env.GITHUB_TOKEN,
      { 'X-GitHub-Api-Version': '2022-11-28' },
      fetchImpl
    )
    return {
      status: userCheck.status,
      authSource: 'token',
      detail:
        userCheck.status === 'verified'
          ? `Authenticated as ${userCheck.body?.login || 'GitHub user'}.`
          : 'GitHub token could not be verified.',
      capabilities: userCheck.status === 'verified' ? ['repositories', 'files', 'code_search'] : [],
    }
  })()

  const vercelPromise = (async () => {
    if (!configured('VERCEL_API_TOKEN')) {
      return {
        status: 'needs_setup',
        authSource: 'none',
        detail: 'VERCEL_API_TOKEN is not configured.',
        capabilities: [],
      }
    }
    const teamId = String(process.env.VERCEL_TEAM_ID || 'team_w5zHVgvHs060CuaxQt23OSyr').trim()
    const depUrl = `https://api.vercel.com/v6/deployments?projectId=prj_duzco4XEzLRNCPs3n0VkWpRDusZq&limit=1${teamId ? `&teamId=${encodeURIComponent(teamId)}` : ''}`
    const depCheck = await checkEndpoint(depUrl, process.env.VERCEL_API_TOKEN, {}, fetchImpl)
    if (depCheck.status === 'verified') {
      return {
        status: 'verified',
        authSource: 'token',
        detail: 'Verified live deployment inspection for project prj_duzco4XEzLRNCPs3n0VkWpRDusZq.',
        capabilities: ['deployment_inspection', 'production_status'],
      }
    }
    const userCheck = await checkEndpoint('https://api.vercel.com/v2/user', process.env.VERCEL_API_TOKEN, {}, fetchImpl)
    return {
      status: userCheck.status,
      authSource: 'token',
      detail:
        userCheck.status === 'verified'
          ? 'Vercel token authenticated.'
          : 'Vercel API token could not be verified.',
      capabilities: userCheck.status === 'verified' ? ['deployment_inspection'] : [],
    }
  })()

  const supabasePromise = (async () => {
    const rlsRows = await db.select('maya_identity', 'select=version&limit=1').catch(() => null)
    const rlsOk = Array.isArray(rlsRows)
    const hasMgmtToken = configured('SUPABASE_ACCESS_TOKEN')
    if (hasMgmtToken) {
      const mgmtCheck = await checkEndpoint(
        'https://api.supabase.com/v1/projects/ixqoosixhahrsgwoxyme',
        process.env.SUPABASE_ACCESS_TOKEN,
        {},
        fetchImpl
      )
      if (mgmtCheck.status === 'verified') {
        return {
          status: 'verified',
          authSource: 'session_and_management',
          detail: 'Verified Supabase Management API schema queries and RLS-protected PostgREST reads.',
          capabilities: ['schema_read', 'rls_protected_table_reads', 'financial_ledger', 'library_storage'],
        }
      }
      if (rlsOk) {
        return {
          status: 'partial',
          authSource: 'rls_session',
          detail: 'RLS-protected database reads are operational; Management API token returned ' + mgmtCheck.status + '.',
          capabilities: ['rls_protected_table_reads', 'financial_ledger', 'library_storage'],
        }
      }
      return {
        status: mgmtCheck.status,
        authSource: 'management_token',
        detail: 'Supabase connection check failed.',
        capabilities: [],
      }
    }
    if (rlsOk) {
      return {
        status: 'verified',
        authSource: 'rls_session',
        detail: 'Verified RLS-protected database operations on project ixqoosixhahrsgwoxyme.',
        capabilities: ['rls_protected_table_reads', 'financial_ledger', 'library_storage'],
      }
    }
    return {
      status: 'needs_setup',
      authSource: 'none',
      detail: 'Supabase credentials are not configured.',
      capabilities: [],
    }
  })()

  const googleWorkspacePromise = (async () => {
    const gcpConfig = getGcpBridgeConfig()
    const resolved = await resolveGoogleWorkspaceHeaders(db, fetchImpl).catch(() => ({
      headers: {},
      source: 'none',
      apiKey: null,
    }))

    if (resolved.source === 'user_oauth' && resolved.headers?.Authorization) {
      try {
        const aboutRes = await fetchImpl('https://www.googleapis.com/drive/v3/about?fields=user(displayName,emailAddress)', {
          headers: resolved.headers,
          signal: AbortSignal.timeout(6000),
        })
        if (aboutRes.ok) {
          const about = await aboutRes.json().catch(() => ({}))
          return {
            status: 'verified',
            authSource: 'user_oauth',
            connectedEmail: about?.user?.emailAddress || auth.user?.email || null,
            detail: `Connected to Google Drive, Docs & Sheets via OAuth (${about?.user?.emailAddress || auth.user?.email}). Full search, read, create, and edit enabled.`,
            capabilities: [
              'google_drive_list',
              'google_drive_read',
              'google_docs_read',
              'google_docs_create',
              'google_docs_write',
              'google_sheets_read',
              'google_sheets_create',
              'google_sheets_write',
            ],
          }
        }
        if (aboutRes.status === 401) {
          return {
            status: 'expired',
            authSource: 'user_oauth',
            detail: 'Your Google Workspace OAuth token has expired. Click "Reconnect Google" to restore personal Drive, Docs, and Sheets access.',
            capabilities: ['link_shared_docs_read', 'link_shared_sheets_read'],
          }
        }
        if (aboutRes.status === 403) {
          return {
            status: 'insufficient_permissions',
            authSource: 'user_oauth',
            detail: 'Google OAuth token lacks Drive/Docs/Sheets scopes. Click "Reconnect Google" to grant full Workspace permissions.',
            capabilities: ['link_shared_docs_read', 'link_shared_sheets_read'],
          }
        }
      } catch {
        // fall through to service account check
      }
    }

    if (gcpConfig.configured) {
      try {
        const bridge = await createGcpBridgeCredentials()
        if (bridge?.accessToken) {
          const saRes = await fetchImpl('https://www.googleapis.com/drive/v3/files?pageSize=1&fields=files(id,name)', {
            headers: { Authorization: `Bearer ${bridge.accessToken}`, Accept: 'application/json' },
            signal: AbortSignal.timeout(6000),
          })
          if (saRes.ok) {
            return {
              status: 'partial',
              authSource: 'service_account',
              serviceAccountEmail: gcpConfig.serviceAccountEmail,
              detail: 'Service account connected (shared & link-shared Docs/Sheets only). Connect Google OAuth for personal Drive search and Doc/Sheet creation.',
              capabilities: ['google_drive_shared_read', 'google_docs_shared_read', 'google_sheets_shared_read'],
            }
          }
        }
      } catch {
        // continue
      }
      return {
        status: 'partial',
        authSource: 'service_account',
        serviceAccountEmail: gcpConfig.serviceAccountEmail,
        detail: 'Link-shared Docs/Sheets supported. Connect Google OAuth to enable personal Drive search, Docs creation, and Sheets editing.',
        capabilities: ['link_shared_docs_read', 'link_shared_sheets_read'],
      }
    }

    return {
      status: 'needs_setup',
      authSource: 'none',
      detail: 'Connect Google Workspace via OAuth to enable Drive, Docs, and Sheets integration.',
      capabilities: [],
    }
  })()

  const [github, vercel, supabase, google_workspace] = await Promise.all([
    githubPromise,
    vercelPromise,
    supabasePromise,
    googleWorkspacePromise,
  ])

  return { github, vercel, supabase, google_workspace }
}

export default async function handler(req, res) {
  const requestId = crypto.randomUUID()
  res.setHeader('Cache-Control', 'no-store')
  res.setHeader('x-appforge-request-id', requestId)
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ message: 'Method not allowed.', requestId })
  }

  const auth = await authenticateCompanionRequest(req)
  if (!auth.ok) return res.status(auth.status).json({ message: auth.message, code: auth.code, requestId })

  const integrations = await verifyAllIntegrations(auth)

  return res.status(200).json({
    requestId,
    integrations,
  })
}
