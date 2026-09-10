import { addApp, getApp } from './registry'

if (!getApp('desktop-buddy')) {
  addApp({
    id: 'desktop-buddy',
    name: 'Desktop Buddy',
    description: 'Create a local character companion with uploadable artwork, portable buddy packs, provider-ready AI hooks, and optional browser voice responses.',
    category: 'ai',
    icon: 'Sparkles',
    route: '/apps/desktop-buddy',
    tags: ['desktop', 'buddy', 'character', 'avatar', 'agent', 'voice', 'hugging-face', 'vertex-ai', 'local-first'],
    status: 'beta',
    version: '0.1.0',
    changelog: [
      {
        version: '0.1.0',
        date: '2026-09-10',
        changes: [
          'Local character image upload and persistence',
          'Scale and framing controls',
          'Portable buddy pack import/export',
          'Hugging Face, Vertex AI, and browser provider modes',
          'Browser speech synthesis preview',
        ],
      },
    ],
  })
}
