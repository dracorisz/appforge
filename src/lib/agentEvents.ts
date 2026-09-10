export type AgentResponseDetail = {
  text: string
  source: string
  createdAt: string
}

export const AGENT_RESPONSE_EVENT = 'appforge:agent-response'

export function emitAgentResponse(text: string, source = 'appforge') {
  if (typeof window === 'undefined') return
  const clean = String(text || '').trim()
  if (!clean) return
  const detail: AgentResponseDetail = {
    text: clean.slice(0, 4000),
    source: String(source || 'appforge').slice(0, 80),
    createdAt: new Date().toISOString(),
  }
  window.dispatchEvent(new CustomEvent<AgentResponseDetail>(AGENT_RESPONSE_EVENT, { detail }))
}
