// Shared server-side adapter for text apps. Callers enforce authentication and quotas.
export async function generateGeminiText({ apiKey, instructions, input, json = false, fetchImpl = fetch }) {
  if (!apiKey) throw new Error('Gemini key is not configured')
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite'
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 12000)
  try {
    const response = await fetchImpl(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method: 'POST', signal: controller.signal,
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: instructions }] },
        contents: [{ role: 'user', parts: [{ text: input }] }],
        generationConfig: { maxOutputTokens: 768, ...(json ? { responseMimeType: 'application/json' } : {}) },
      }),
    })
    // Never include upstream error bodies, request headers or keys in errors.
    if (!response.ok) throw new Error(`Gemini HTTP ${response.status}`)
    const data = await response.json()
    const candidate = data?.candidates?.[0]
    if (candidate?.finishReason !== 'STOP') throw new Error('Gemini response incomplete or blocked')
    const text = (candidate.content?.parts || []).filter((part) => !part.thought).map((part) => part.text || '').join('').trim()
    if (!text) throw new Error('Gemini returned an empty response')
    return { text, model }
  } finally { clearTimeout(timeout) }
}
