import { getAllApps } from './registry'

const SITE_URL = 'https://www.sstoken.space'
const SITE_NAME = 'AppForge'
const FALLBACK_TITLE = 'AppForge - Simple, powerful tools'
const FALLBACK_DESCRIPTION = 'AppForge is an open-source toolbox of focused web utilities, media tools, and practical browser apps.'
const SOCIAL_IMAGE = `${SITE_URL}/favicon/apple-touch-icon.png`

const publicRoutes = new Set([
  '/', '/privacy', '/terms', '/huggingface',
  '/apps/scrapper-pro', '/pf-scrapper-pro',
  '/apps/weather-now', '/pf-weather-now',
  '/apps/any-converter',
  '/apps/ai-dragon-arena', '/pf-ai-dragon-arena',
])
const aliases: Record<string, string> = {
  '/pf-scrapper-pro': '/apps/scrapper-pro',
  '/pf-weather-now': '/apps/weather-now',
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
  const isPublic = publicRoutes.has(pathname)
  const title = isHuggingFaceGallery ? `Dragon Arena × Hugging Face | ${SITE_NAME}` : app ? `${app.name} | ${SITE_NAME}` : FALLBACK_TITLE
  const description = isHuggingFaceGallery
    ? 'Explore AppForge Dragon Arena Hugging Face model rotation and public AI-generated fantasy scenes.'
    : app?.description || FALLBACK_DESCRIPTION
  const url = `${SITE_URL}${canonicalPath === '/' ? '/' : canonicalPath}`
  const robots = isPublic ? 'index, follow' : 'noindex, nofollow'
  const cover = app?.coverImage ? `${SITE_URL}${app.coverImage}` : SOCIAL_IMAGE

  document.title = title
  setCanonical(url)
  setMeta('name', 'description', description)
  setMeta('name', 'robots', robots)
  setMeta('property', 'og:site_name', SITE_NAME)
  setMeta('property', 'og:title', title)
  setMeta('property', 'og:description', description)
  setMeta('property', 'og:type', app ? 'article' : 'website')
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
  } : {
    '@context': 'https://schema.org',
    '@type': isHuggingFaceGallery ? 'CollectionPage' : 'WebSite',
    name: isHuggingFaceGallery ? 'Dragon Arena × Hugging Face' : SITE_NAME,
    description,
    url,
    image: cover,
    isPartOf: isHuggingFaceGallery ? { '@type': 'WebSite', name: SITE_NAME, url: SITE_URL } : undefined,
  })
}
