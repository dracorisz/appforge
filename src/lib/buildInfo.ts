const version = import.meta.env.VITE_APP_VERSION || 'dev'
const sha = import.meta.env.VITE_GIT_SHA || 'local'
const buildTime = import.meta.env.VITE_BUILD_TIME || ''

const shortSha = sha === 'local' ? 'local' : sha.slice(0, 7)

const formatUtc = (value: string) => {
  if (!value) return 'local build'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('en-GB', {
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'UTC',
    timeZoneName: 'short',
  })
}

export const BUILD_INFO = Object.freeze({
  version,
  sha,
  shortSha,
  buildTime,
  builtAtLabel: formatUtc(buildTime),
  label: `v${version} · ${shortSha}`,
  detailedLabel: `v${version} · ${shortSha} · ${formatUtc(buildTime)}`,
})

export type BuildInfo = typeof BUILD_INFO
