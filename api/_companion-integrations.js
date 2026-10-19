import { authenticateCompanionRequest } from './_companion-auth.js'

const configured = (name) => Boolean(String(process.env[name] || '').trim())

const check = async (url, token, headers = {}) => {
  try {
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json', ...headers },
      signal: AbortSignal.timeout(7000),
    })
    return response.ok ? 'verified' : response.status === 401 ? 'invalid_credentials' : response.status === 403 ? 'insufficient_permissions' : 'unavailable'
  } catch {
    return 'unavailable'
  }
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
  if (!auth.ok) return res.status(auth.status).json({ message: auth.message, requestId })

  const checks = await Promise.all([
    configured('GITHUB_TOKEN') ? check('https://api.github.com/user', process.env.GITHUB_TOKEN, { 'X-GitHub-Api-Version': '2022-11-28' }) : Promise.resolve('needs_setup'),
    configured('VERCEL_API_TOKEN') ? check('https://api.vercel.com/v2/user', process.env.VERCEL_API_TOKEN) : Promise.resolve('needs_setup'),
    configured('SUPABASE_ACCESS_TOKEN') ? check('https://api.supabase.com/v1/projects/ixqoosixhahrsgwoxyme', process.env.SUPABASE_ACCESS_TOKEN) : Promise.resolve('needs_setup'),
  ])

  return res.status(200).json({
    requestId,
    integrations: {
      github: { status: checks[0], capabilities: ['repositories', 'files', 'issues', 'pull_requests', 'actions'] },
      vercel: { status: checks[1], capabilities: ['projects', 'domains', 'environment_variables', 'deployments', 'logs'] },
      supabase: { status: checks[2], capabilities: ['projects', 'schemas', 'sql', 'migrations', 'edge_functions'] },
    },
  })
}
