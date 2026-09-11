import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'AppForge Docs',
  description: 'Developer documentation, architecture, environment, deployment, release readiness, AI providers, and standalone PWA guidance for AppForge.',
  base: '/',
  cleanUrls: true,
  appearance: 'dark',
  lastUpdated: true,
  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
    ['meta', { name: 'theme-color', content: '#0f172a' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:title', content: 'AppForge Docs' }],
    ['meta', { property: 'og:description', content: 'Build, understand, operate, contribute to, and deploy AppForge.' }],
    ['meta', { property: 'og:url', content: 'https://docs.sstoken.space/' }],
    ['script', {}, `
      (() => {
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.getRegistrations().then((registrations) => {
            registrations.forEach((registration) => registration.unregister())
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
    logo: '/favicon.svg',
    search: { provider: 'local' },
    nav: [
      { text: 'Guide', link: '/GETTING_STARTED' },
      { text: 'Apps', link: '/apps/' },
      { text: 'Desktop Buddy', link: '/apps/desktop-buddy' },
      { text: 'Architecture', link: '/APP_MODEL' },
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
          { text: 'Security advisories', link: '/SECURITY_ADVISORS' },
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
          { text: 'Desktop Buddy', link: '/apps/desktop-buddy' },
          { text: 'Getter Pro', link: '/apps/scrapper-pro/' },
          { text: 'Story Studio', link: '/apps/dragon-arena/' },
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
          { text: 'Docs maintenance', link: '/DOC_MAINTENANCE' },
        ],
      },
    ],
    socialLinks: [
      { icon: 'github', link: 'https://github.com/dracorisz/appforge', ariaLabel: 'AppForge on GitHub' },
      { icon: 'youtube', link: 'https://www.youtube.com/@AppForgeDragon', ariaLabel: 'AppForge on YouTube' },
      {
        icon: {
          svg: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M6.27 3h11.46l-.67 4H6.94L6.27 3Zm.9 5h9.66l-.46 2.75a5.37 5.37 0 0 1-4.37 8.17 5.37 5.37 0 0 1-4.37-8.17L7.17 8Zm2.03 4.83a3.16 3.16 0 1 0 5.6 0H9.2ZM5 20h14v1H5v-1Z"/></svg>'
        },
        link: 'https://buymeacoffee.com/dracorisz',
        ariaLabel: 'Support AppForge on Buy Me a Coffee',
      },
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
