import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'AppForge Docs',
  description: 'Developer documentation, architecture, environment, deployment, release readiness, and standalone PWA guidance for AppForge.',
  base: '/appforge/',
  cleanUrls: true,
  lastUpdated: true,
  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/appforge/favicon.svg' }],
    ['meta', { name: 'theme-color', content: '#0f172a' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:title', content: 'AppForge Docs' }],
    ['meta', { property: 'og:description', content: 'Build, understand, operate, contribute to, and deploy AppForge.' }],
    ['script', {}, `
      (() => {
        const scopeFragment = '/appforge/'
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.getRegistrations().then((registrations) => {
            registrations
              .filter((registration) => registration.scope.includes(scopeFragment))
              .forEach((registration) => registration.unregister())
          })
        }
        if ('caches' in window) {
          caches.keys().then((keys) => {
            keys
              .filter((key) => key.toLowerCase().includes('appforge'))
              .forEach((key) => caches.delete(key))
          })
        }
      })()
    `],
  ],
  themeConfig: {
    siteTitle: 'AppForge Docs',
    search: { provider: 'local' },
    nav: [
      { text: 'Guide', link: '/GETTING_STARTED' },
      { text: 'Apps', link: '/apps/' },
      { text: 'Architecture', link: '/APP_MODEL' },
      { text: 'Branding', link: '/BRANDING' },
      { text: 'Open App ↗', link: 'https://www.sstoken.space/' },
    ],
    sidebar: [
      {
        text: 'Start here',
        items: [
          { text: 'Overview', link: '/' },
          { text: 'Getting started', link: '/GETTING_STARTED' },
          { text: 'Environment & agent pickup', link: '/ENVIRONMENT' },
          { text: 'Development timeline', link: '/DEVELOPMENT_TIMELINE' },
          { text: 'Project Pulse', link: '/PROJECT-PULSE' },
          { text: 'Full-status standard', link: '/FULL_STATUS' },
          { text: 'Issue roadmap', link: '/ISSUE_ROADMAP' },
          { text: 'Launch checklist', link: '/LAUNCH-CHECKLIST' },
        ],
      },
      {
        text: 'Architecture & platform',
        items: [
          { text: 'App model', link: '/APP_MODEL' },
          { text: 'Database', link: '/DATABASE' },
          { text: 'AI providers', link: '/AI-PROVIDERS' },
          { text: 'Cloud experiments', link: '/CLOUD-EXPERIMENTS' },
          { text: 'Branching', link: '/BRANCHING' },
          { text: 'Performance baseline', link: '/PERFORMANCE_BASELINE' },
        ],
      },
      {
        text: 'Identity, brand & OAuth',
        items: [
          { text: 'Branding', link: '/BRANDING' },
          { text: 'GitHub auth', link: '/GITHUB_AUTH' },
          { text: 'OAuth verification', link: '/OAUTH_VERIFICATION' },
        ],
      },
      {
        text: 'Apps & standalone PWAs',
        items: [
          { text: 'Apps index', link: '/apps/' },
          { text: 'Any Converter', link: '/apps/any-converter/' },
          { text: 'Task List', link: '/apps/task-list/' },
          { text: 'Standalone PWA template', link: '/STANDALONE_PWA_TEMPLATE' },
        ],
      },
      {
        text: 'Publishing & growth',
        items: [
          { text: 'Marketing handoff', link: '/MARKETING_HANDOFF' },
          { text: 'Landing system', link: '/LANDING_SYSTEM' },
          { text: 'Landing media', link: '/LANDING_MEDIA' },
        ],
      },
      {
        text: 'Maintainers & agents',
        collapsed: false,
        items: [
          { text: 'Environment & agent pickup', link: '/ENVIRONMENT' },
          { text: 'Agent handoff', link: '/AGENT_HANDOFF' },
        ],
      },
    ],
    socialLinks: [
      { icon: 'github', link: 'https://github.com/dracorisz/appforge' },
    ],
    editLink: {
      pattern: 'https://github.com/dracorisz/appforge/edit/main/docs/:path',
      text: 'Edit this page on GitHub',
    },
    footer: {
      message: 'AppForge documentation. The production application lives at sstoken.space.',
      copyright: 'Open source project documentation',
    },
    outline: { level: [2, 3] },
  },
})
