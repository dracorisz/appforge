import chatHandler from './_companion-chat.js'
import integrationsHandler from './_companion-integrations.js'
import lamatHandler from './lamat.js'

export default async function handler(req, res) {
  const mode = String(
    req.query?.mode ||
      new URL(req.url || '/', 'https://lamat.local').searchParams.get('mode') ||
      (req.method === 'GET' ? 'integrations' : 'chat')
  )
  if (mode === 'integrations') return integrationsHandler(req, res)
  if (mode === 'lamat' || mode === 'state' || mode === 'cron') return lamatHandler(req, res)
  return chatHandler(req, res)
}
