import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'AppForge Docs',
  description: 'Developer documentation, architecture, deployment, release readiness, and standalone PWA guidance for AppForge.',
  base: '/appforge/',
  cleanUrls: true,
  lastUpdated: true,
  head: [
    ['meta', { name: 'theme-color', content: '#0b1020' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:title', content: 'AppForge Docs' }],
    ['meta', { property: 'og:description', content: 'Build, understand, contribute to, and deploy AppForge.' }],
  ],
  themeConfig: {
    siteTitle: 'AppForge Docs',
    search: { provider: 'local' },
    nav: [
      { text: 'Guide', link: '/GETTING_STARTED' },
      { text: 'Apps', link: '/apps/' },
      { text: 'Project Pulse', link: '/PROJECT-PULSE' },
      { text: 'Architecture', link: '/APP_MODEL' },
      { text: 'Open App ↗', link: 'https://www.sstoken.space/' },
    ],
    sidebar: [
      {
        text: 'Start here',
        items: [
          { text: 'Overview', link: '/' },
          { text: 'Getting started', link: '/GETTING_STARTED' },
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
        text: 'Identity & OAuth',
        items: [
          { text: 'GitHub auth', link: '/GITHUB_AUTH' },
          { text: 'OAuth verification', link: '/OAUTH_VERIFICATION' },
        ],
      },
      {
        text: 'Apps & standalone PWAs',
        items: [
          { text: 'Apps index', link: '/apps/' },
          { text: 'Any Converter', link: '/apps/any-converter/' },
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
        text: 'Maintainers',
        collapsed: true,
        items: [
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
