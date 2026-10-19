import imageHandler from './_desktop-buddy-image.js'
import vertexHandler from './_desktop-buddy-vertex.js'

export default async function handler(req, res) {
  const mode = String(req.query?.mode || new URL(req.url || '/', 'https://appforge.invalid').searchParams.get('mode') || '')
  if (mode === 'image') return imageHandler(req, res)
  if (mode === 'vertex') return vertexHandler(req, res)
  return res.status(404).json({ message: 'Desktop Buddy API route not found.' })
}
