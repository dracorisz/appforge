import chatHandler from './_companion-chat.js'
import integrationsHandler from './_companion-integrations.js'

export default async function handler(req, res) {
  const mode = String(req.query?.mode || new URL(req.url || '/', 'https://appforge.invalid').searchParams.get('mode') || '')
  if (mode === 'chat') return chatHandler(req, res)
  if (mode === 'integrations') return integrationsHandler(req, res)
  return res.status(404).json({ message: 'Companion API route not found.' })
}
