import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'AppForge Docs',
  description: 'Concise product and developer documentation for AppForge.',
  base: '/',
  cleanUrls: true,
  appearance: 'dark',
  lastUpdated: true,
  ignoreDeadLinks: ['./../CONTRIBUTING', './../CODE_OF_CONDUCT', './../LICENSE'],
  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: 'https://docs.sstoken.space/favicon.svg' }],
    ['meta', { name: 'theme-color', content: '#0f172a' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:title', content: 'AppForge Docs' }],
    ['meta', { property: 'og:description', content: 'Use, understand, operate, and contribute to AppForge.' }],
    ['meta', { property: 'og:url', content: 'https://docs.sstoken.space/' }],
  ],
  themeConfig: {
    siteTitle: 'AppForge Docs',
    logo: 'https://docs.sstoken.space/favicon.svg',
    search: { provider: 'local' },
    nav: [
      { text: 'Guide', link: '/GETTING_STARTED' },
      { text: 'Apps', link: '/apps/' },
      { text: 'Architecture', link: '/APP_MODEL' },
      { text: 'AppForge PWA', link: '/PWA' },
      { text: 'Open App ↗', link: 'https://www.sstoken.space/' },
    ],
    sidebar: [
      {
        text: 'Start here',
        items: [
          { text: 'Overview', link: '/' },
          { text: 'Getting started', link: '/GETTING_STARTED' },
          { text: 'Apps', link: '/apps/' },
          { text: 'Project Pulse', link: '/PROJECT-PULSE' },
        ],
      },
      {
        text: 'Platform',
        items: [
          { text: 'App model', link: '/APP_MODEL' },
          { text: 'Database', link: '/DATABASE' },
          { text: 'AI providers', link: '/AI-PROVIDERS' },
          { text: 'Security advisories', link: '/SECURITY_ADVISORS' },
        ],
      },
      {
        text: 'Development & operations',
        collapsed: true,
        items: [
          { text: 'Environment', link: '/ENVIRONMENT' },
          { text: 'AppForge PWA', link: '/PWA' },
          { text: 'Launch checklist', link: '/LAUNCH-CHECKLIST' },
          { text: 'Branching', link: '/BRANCHING' },
          { text: 'Docs maintenance', link: '/DOC_MAINTENANCE' },
          { text: 'Agent handoff', link: '/AGENT_HANDOFF' },
        ],
      },
      {
        text: 'Identity & access',
        collapsed: true,
        items: [
          { text: 'Branding', link: '/BRANDING' },
          { text: 'GitHub auth', link: '/GITHUB_AUTH' },
          { text: 'OAuth verification', link: '/OAUTH_VERIFICATION' },
        ],
      },
    ],
    socialLinks: [
      { icon: 'github', link: 'https://github.com/dracorisz/appforge', ariaLabel: 'AppForge on GitHub' },
      { icon: 'youtube', link: 'https://www.youtube.com/@AppForgeDragon', ariaLabel: 'AppForge on YouTube' },
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
