import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'AppForge Docs',
  description: 'Product and developer documentation for AppForge.',
  base: '/',
  cleanUrls: true,
  lastUpdated: true,
  ignoreDeadLinks: ['./../CONTRIBUTING', './../CODE_OF_CONDUCT', './../LICENSE'],
  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
  ],
  themeConfig: {
    siteTitle: 'AppForge Docs',
    logo: '/favicon.svg',
    search: { provider: 'local' },
    nav: [
      { text: 'Guide', link: '/GETTING_STARTED' },
      { text: 'Apps', link: '/apps/' },
      { text: 'Support', link: 'https://github.com/dracorisz/appforge/issues' },
      { text: 'AppForge', link: 'https://www.sstoken.space/' },
    ],
    sidebar: [
      {
        text: 'Guide',
        items: [
          { text: 'Overview', link: '/' },
          { text: 'Getting started', link: '/GETTING_STARTED' },
          { text: 'Apps', link: '/apps/' },
          { text: 'App model', link: '/APP_MODEL' },
          { text: 'Environment', link: '/ENVIRONMENT' },
          { text: 'Launch checklist', link: '/LAUNCH-CHECKLIST' },
          { text: 'Security', link: '/SECURITY_ADVISORS' },
        ],
      },
    ],
    socialLinks: [
      { icon: 'github', link: 'https://github.com/dracorisz/appforge', ariaLabel: 'AppForge on GitHub' },
    ],
    editLink: {
      pattern: 'https://github.com/dracorisz/appforge/edit/main/docs/:path',
      text: 'Edit this page on GitHub',
    },
    footer: {
      message: 'AppForge documentation',
      copyright: 'Open source project documentation',
    },
    outline: { level: [2, 3] },
  },
})
