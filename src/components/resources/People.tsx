import React from 'react'
import { ExternalLink, Image as ImageIcon, MapPin, Search, UserRound } from 'lucide-react'
import { Card, Input } from '@/components/ui'
import { listProfileImages, listVisibleProfiles, type AppProfile, type ProfileImageLink, type UserImage } from '@/lib/account'

const linkedImage = (link: ProfileImageLink) => {
  const value = link.user_images
  if (Array.isArray(value)) return value[0] || null
  return value || null
}

export function PeoplePage() {
  const [profiles, setProfiles] = React.useState<AppProfile[]>([])
  const [images, setImages] = React.useState<ProfileImageLink[]>([])
  const [query, setQuery] = React.useState('')
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState('')

  React.useEffect(() => {
    let active = true
    const load = async () => {
      try {
        const [nextProfiles, nextImages] = await Promise.all([listVisibleProfiles(), listProfileImages()])
        if (!active) return
        setProfiles(nextProfiles)
        setImages(nextImages)
      } catch (loadError) {
        if (active) setError(loadError instanceof Error ? loadError.message : 'Could not load profiles.')
      } finally {
        if (active) setLoading(false)
      }
    }
    void load()
    return () => { active = false }
  }, [])

  const visible = profiles.filter((profile) => {
    const needle = query.trim().toLowerCase()
    if (!needle) return true
    return [profile.display_name, profile.username, profile.bio, profile.location]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(needle))
  })

  const galleryFor = (profileId: string) => images
    .filter((link) => link.profile_id === profileId && link.kind === 'gallery')
    .map(linkedImage)
    .filter((image): image is UserImage => Boolean(image?.source_url))
    .slice(0, 4)

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">People</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">Public AppForge profiles shared inside the authenticated workspace. Private preferences and tool history stay scoped to each account.</p>
        </div>
        <div className="w-full sm:max-w-xs">
          <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search people…" className="pl-9" />
          <Search className="pointer-events-none relative -mt-7 ml-3 h-4 w-4 text-muted-foreground" />
        </div>
      </div>

      {error && <Card className="border-destructive/30 p-4 text-sm text-destructive">{error}</Card>}
      {loading ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">Loading profiles…</Card>
      ) : visible.length === 0 ? (
        <Card className="p-8 text-center">
          <UserRound className="mx-auto h-6 w-6 text-muted-foreground" />
          <h2 className="mt-3 text-sm font-medium text-foreground">No matching profiles</h2>
          <p className="mt-1 text-sm text-muted-foreground">Profiles appear here after users sign in and keep their profile public.</p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {visible.map((profile) => {
            const gallery = galleryFor(profile.id)
            return (
              <Card key={profile.id} className="overflow-hidden p-0">
                {gallery.length > 0 && (
                  <div className={`grid h-40 gap-px bg-border ${gallery.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                    {gallery.slice(0, 4).map((image) => <img key={image.id} src={image.source_url || ''} alt="" className="h-full w-full object-cover" />)}
                  </div>
                )}
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border/70 bg-muted text-muted-foreground">
                      {profile.avatar_url ? <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" /> : <UserRound className="h-5 w-5" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2 className="truncate text-sm font-semibold text-foreground">{profile.display_name || profile.username || 'AppForge user'}</h2>
                      {profile.username && <p className="truncate text-xs text-muted-foreground">@{profile.username}</p>}
                    </div>
                    {gallery.length === 0 && <ImageIcon className="h-4 w-4 text-muted-foreground" />}
                  </div>

                  {profile.bio && <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted-foreground">{profile.bio}</p>}
                  <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                    {profile.location && <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {profile.location}</span>}
                    {profile.website && <a href={profile.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-foreground"><ExternalLink className="h-3.5 w-3.5" /> Website</a>}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
