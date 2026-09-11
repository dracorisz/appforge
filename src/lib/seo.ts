import { getAllApps } from './registry'

const SITE_URL = 'https://www.sstoken.space'
const SITE_NAME = 'AppForge'
const FALLBACK_TITLE = 'AppForge - Simple, powerful tools'
const FALLBACK_DESCRIPTION = 'AppForge is an open-source toolbox of focused web utilities, media tools, and practical browser apps.'
const SOCIAL_IMAGE = `${SITE_URL}/favicon/apple-touch-icon.png`

const publicRoutes = new Set([
  '/', '/landing', '/explore', '/privacy', '/terms', '/huggingface', '/blog', '/changelog',
  '/apps/getter-pro', '/apps/scrapper-pro', '/pf-scrapper-pro',
  '/apps/weather-now', '/pf-weather-now',
  '/apps/crypto-track', '/pf-crypto-track',
  '/apps/any-converter',
  '/apps/favicon-studio',
  '/apps/svg-icons',
  '/apps/landing-builder',
  '/apps/ai-dragon-arena', '/pf-ai-dragon-arena',
])
const aliases: Record<string, string> = {
  '/landing': '/',
  '/apps/scrapper-pro': '/apps/getter-pro',
  '/pf-scrapper-pro': '/apps/getter-pro',
  '/pf-weather-now': '/apps/weather-now',
  '/pf-crypto-track': '/apps/crypto-track',
  '/pf-ai-dragon-arena': '/apps/ai-dragon-arena',
}

function setMeta(attribute: 'name' | 'property', key: string, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`)
  if (!element) {
    element = document.createElement('meta')
    element.setAttribute(attribute, key)
    document.head.appendChild(element)
  }
  element.content = content
}

function setCanonical(url: string) {
  let element = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (!element) {
    element = document.createElement('link')
    element.rel = 'canonical'
    document.head.appendChild(element)
  }
  element.href = url
}

export function updateSeo(pathname: string) {
  const canonicalPath = aliases[pathname] || pathname
  const app = getAllApps().find((item) => item.route === canonicalPath)
  const isHuggingFaceGallery = canonicalPath === '/huggingface'
  const isAppsDirectory = canonicalPath === '/explore'
  const isBlog = canonicalPath === '/blog'
  const isBlogArticle = canonicalPath.startsWith('/blog/')
  const isChangelog = canonicalPath === '/changelog'
  const isPublic = publicRoutes.has(pathname) || isBlogArticle
  const title = isAppsDirectory
    ? `Apps | ${SITE_NAME}`
    : isHuggingFaceGallery
      ? `Story Studio × Hugging Face | ${SITE_NAME}`
      : isBlog
        ? `Blog | ${SITE_NAME}`
        : isBlogArticle
          ? `App story | ${SITE_NAME}`
          : isChangelog
            ? `Changelog | ${SITE_NAME}`
            : app ? `${app.name} | ${SITE_NAME}` : FALLBACK_TITLE
  const description = isAppsDirectory
    ? 'Browse AppForge web apps and utilities across AI, media, developer tools, converters, crypto, weather, productivity, and more.'
    : isHuggingFaceGallery
      ? 'Explore AppForge Story Studio Hugging Face model rotation, public generated scenes, and admin-curated gallery images.'
      : isBlog || isBlogArticle
        ? 'Read AppForge product stories, practical app guides, implementation notes, and creator workflow updates.'
        : isChangelog
          ? 'Follow AppForge release history and user-visible changes, generated from the canonical changelog on main.'
          : app?.description || FALLBACK_DESCRIPTION
  const url = `${SITE_URL}${canonicalPath === '/' ? '/' : canonicalPath}`
  const robots = isPublic ? 'index, follow' : 'noindex, nofollow'
  const cover = app?.coverImage ? `${SITE_URL}${app.coverImage}` : SOCIAL_IMAGE
  const isArticle = Boolean(app) || isBlogArticle

  document.title = title
  setCanonical(url)
  setMeta('name', 'description', description)
  setMeta('name', 'robots', robots)
  setMeta('property', 'og:site_name', SITE_NAME)
  setMeta('property', 'og:title', title)
  setMeta('property', 'og:description', description)
  setMeta('property', 'og:type', isArticle ? 'article' : 'website')
  setMeta('property', 'og:url', url)
  setMeta('property', 'og:image', cover)
  setMeta('property', 'og:image:alt', app ? `${app.name} cover image` : `${SITE_NAME} logo`)
  setMeta('property', 'og:image:width', app?.coverImage ? '1024' : '180')
  setMeta('property', 'og:image:height', app?.coverImage ? '1024' : '180')
  setMeta('property', 'og:locale', 'en_US')
  setMeta('name', 'twitter:card', 'summary_large_image')
  setMeta('name', 'twitter:title', title)
  setMeta('name', 'twitter:description', description)
  setMeta('name', 'twitter:image', cover)

  let structuredData = document.head.querySelector<HTMLScriptElement>('script[data-appforge-seo]')
  if (!structuredData) {
    structuredData = document.createElement('script')
    structuredData.type = 'application/ld+json'
    structuredData.dataset.appforgeSeo = 'true'
    document.head.appendChild(structuredData)
  }

  const collectionName = isAppsDirectory
    ? 'AppForge Apps'
    : isHuggingFaceGallery
      ? 'Story Studio × Hugging Face'
      : isBlog
        ? 'AppForge Blog'
        : isChangelog
          ? 'AppForge Changelog'
          : SITE_NAME

  structuredData.textContent = JSON.stringify(app ? {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: app.name,
    description: app.description,
    url,
    image: cover,
    applicationCategory: app.category === 'ai' ? 'GameApplication' : 'UtilitiesApplication',
    operatingSystem: 'Web browser',
    isPartOf: { '@type': 'WebSite', name: SITE_NAME, url: SITE_URL },
  } : isBlogArticle ? {
    '@context': 'https://schema.org',
    '@type': 'Article',
    name: title,
    description,
    url,
    image: cover,
    isPartOf: { '@type': 'Blog', name: 'AppForge Blog', url: `${SITE_URL}/blog` },
  } : {
    '@context': 'https://schema.org',
    '@type': isAppsDirectory || isHuggingFaceGallery || isBlog || isChangelog ? 'CollectionPage' : 'WebSite',
    name: collectionName,
    description,
    url,
    image: cover,
    isPartOf: isAppsDirectory || isHuggingFaceGallery || isBlog || isChangelog ? { '@type': 'WebSite', name: SITE_NAME, url: SITE_URL } : undefined,
  })
}
