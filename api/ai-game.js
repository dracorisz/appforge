const ALLOWED_MODELS = new Set(['gpt-5.6-sol'])

const extractText = (response) => {
  if (typeof response?.output_text === 'string' && response.output_text.trim()) return response.output_text.trim()
  for (const item of response?.output || []) {
    for (const part of item?.content || []) {
      if (part?.type === 'output_text' && typeof part.text === 'string') return part.text.trim()
    }
  }
  return ''
}

const parseReply = (text) => {
  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()
  try {
    const value = JSON.parse(cleaned)
    return {
      narrative: String(value?.narrative || '').trim(),
      choices: Array.isArray(value?.choices) ? value.choices.map((choice) => String(choice).trim()).filter(Boolean).slice(0, 3) : [],
    }
  } catch {
    return { narrative: cleaned, choices: [] }
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed.' })
  }

  if (!process.env.OPENAI_API_KEY) return res.status(503).json({ error: 'OPENAI_API_KEY is not configured on this deployment.' })

  const { model = 'gpt-5.6-sol', action, history = [], turn = 1 } = req.body || {}
  if (!ALLOWED_MODELS.has(model)) return res.status(400).json({ error: 'This model is not enabled for Dragon Arena.' })
  if (typeof action !== 'string' || !action.trim()) return res.status(400).json({ error: 'Choose or enter an action first.' })

  const recent = Array.isArray(history)
    ? history.slice(-10).map((entry) => `${entry?.role === 'player' ? 'PLAYER' : 'GAME MASTER'}: ${String(entry?.text || '').slice(0, 1200)}`).join('\n')
    : ''

  const instructions = `You are the Game Master for WildDragons.ai Dragon Arena, a concise turn-based fantasy adventure. Continue from the supplied recent history and react specifically to the player's latest action. Keep continuity, introduce meaningful consequences, and never decide the player's next action for them. Keep the narrative between 70 and 150 words. End with exactly three short, distinct choices. Return ONLY valid JSON with this shape: {"narrative":"...","choices":["...","...","..."]}. Do not use markdown.`
  const input = `TURN: ${Number(turn) || 1}\nRECENT HISTORY:\n${recent}\n\nLATEST PLAYER ACTION: ${action.trim().slice(0, 1200)}`

  try {
    const openai = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        instructions,
        input,
        reasoning: { effort: 'medium' },
        max_output_tokens: 650,
      }),
    })

    const data = await openai.json().catch(() => ({}))
    if (!openai.ok) {
      console.error('OpenAI Dragon Arena error', openai.status, data?.error?.type || data?.error?.code || 'unknown')
      return res.status(openai.status === 429 ? 429 : 502).json({ error: openai.status === 429 ? 'The AI game master is at its API limit. Try again shortly.' : 'The AI game master could not answer.' })
    }

    const parsed = parseReply(extractText(data))
    if (!parsed.narrative) return res.status(502).json({ error: 'The AI game master returned an empty turn.' })

    return res.status(200).json({
      narrative: parsed.narrative,
      choices: parsed.choices.length === 3 ? parsed.choices : ['Press deeper into the vault', 'Study the surroundings', 'Retreat and regroup'],
      model,
    })
  } catch (error) {
    console.error('Dragon Arena request failed', error)
    return res.status(502).json({ error: 'Could not reach the AI game master.' })
  }
}
