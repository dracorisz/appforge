import React from 'react'
import {
  Check,
  Cloud,
  Download,
  ExternalLink,
  Github,
  HeartHandshake,
  ImagePlus,
  KeyRound,
  Loader2,
  LockKeyhole,
  Monitor,
  Moon,
  RefreshCw,
  ShieldCheck,
  Sun,
  Trash2,
  Upload,
  UserRound,
} from 'lucide-react'
import { Badge, BuildBadge, Button, Card, Input, Textarea } from '@/components/ui'
import type { AppState, Settings } from '@/types'
import { useAuth } from '@/auth/AuthProvider'
import { BUILD_INFO } from '@/lib/buildInfo'
import {
  adminDeleteUser,
  adminListUsers,
  adminSetRole,
  adminUpdateProfile,
  claimFirstAdmin,
  ensureProfile,
  enrollTotp,
  getPrivateProfileInfo,
  getRole,
  getSecurityState,
  listProfileImages,
  removeProfileImage,
  savePrivateProfileInfo,
  saveProfile,
  unenrollTotp,
  uploadProfileImage,
  verifyTotpFactor,
  type AdminUser,
  type AppProfile,
  type PrivateProfileInfo,
  type ProfileImageLink,
  type UserImage,
} from '@/lib/account'

const LIVE_URL_KEY = 'appforge-live-url'
const PAYPAL_URL = 'https://www.paypal.com/paypalme/dracorisz'
type ThemeMode = 'light' | 'dark' | 'system'
type TabId = 'profile' | 'appearance' | 'security' | 'data' | 'integrations' | 'deployment' | 'about' | 'admin'

const imageFromLink = (link: ProfileImageLink) => {
  const value = link.user_images
  return Array.isArray(value) ? value[0] || null : value || null
}

const splitSkills = (value: string) => value.split(',').map((item) => item.trim()).filter(Boolean).slice(0, 16)

export function SettingsPage({ state, setState }: { state: AppState; setState: (s: AppState) => void }) {
  const { user, signOut } = useAuth()
  const [activeTab, setActiveTab] = React.useState<TabId>('profile')
  const [themeMode, setThemeMode] = React.useState<ThemeMode>('system')
  const [profile, setProfile] = React.useState<AppProfile | null>(null)
  const [privateInfo, setPrivateInfo] = React.useState<PrivateProfileInfo | null>(null)
  const [images, setImages] = React.useState<ProfileImageLink[]>([])
  const [role, setRole] = React.useState<'user' | 'admin'>('user')
  const [currentLevel, setCurrentLevel] = React.useState<'aal1' | 'aal2' | null>(null)
  const [nextLevel, setNextLevel] = React.useState<'aal1' | 'aal2' | null>(null)
  const [totpFactors, setTotpFactors] = React.useState<any[]>([])
  const [enrollment, setEnrollment] = React.useState<{ id: string; qr: string; secret: string } | null>(null)
  const [totpCode, setTotpCode] = React.useState('')
  const [adminUsers, setAdminUsers] = React.useState<AdminUser[]>([])
  const [loading, setLoading] = React.useState(true)
  const [busy, setBusy] = React.useState('')
  const [message, setMessage] = React.useState('')
  const [error, setError] = React.useState('')
  const [liveUrl, setLiveUrl] = React.useState(() => localStorage.getItem(LIVE_URL_KEY) || 'https://www.sstoken.space')
  const [skillsDraft, setSkillsDraft] = React.useState('')

  const refreshAccount = React.useCallback(async () => {
    if (!user) return
    setLoading(true)
    setError('')
    try {
      const [nextProfile, nextPrivate, nextRole, security, nextImages] = await Promise.all([
        ensureProfile(user),
        getPrivateProfileInfo(user.id),
        getRole(user.id),
        getSecurityState(),
        listProfileImages(user.id),
      ])
      setProfile(nextProfile)
      setSkillsDraft((nextProfile.skills || []).join(', '))
      setPrivateInfo(nextPrivate)
      setRole(nextRole)
      setCurrentLevel(security.currentLevel)
      setNextLevel(security.nextLevel)
      setTotpFactors(security.totp || [])
      setImages(nextImages)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load account settings.')
    } finally {
      setLoading(false)
    }
  }, [user])

  React.useEffect(() => { void refreshAccount() }, [refreshAccount])

  React.useEffect(() => {
    const raw = localStorage.getItem('appforge-theme')
    if (!raw) return
    try { setThemeMode(JSON.parse(raw).mode || 'system') } catch { /* ignore */ }
  }, [])

  React.useEffect(() => {
    const root = document.documentElement
    const dark = themeMode === 'dark' || (themeMode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    root.classList.toggle('dark', dark)
    localStorage.setItem('appforge-theme', JSON.stringify({ mode: themeMode }))
    if (state.settings.theme !== themeMode) {
      const nextSettings = { ...state.settings, theme: themeMode } as Settings
      setState({ ...state, settings: nextSettings })
    }
  }, [themeMode, state, setState])

  const flash = (text: string) => {
    setMessage(text)
    setError('')
    window.setTimeout(() => setMessage(''), 2200)
  }

  const savePublicProfile = async () => {
    if (!user || !profile) return
    setBusy('profile')
    try {
      const saved = await saveProfile(user.id, { ...profile, skills: splitSkills(skillsDraft) })
      setProfile(saved)
      setSkillsDraft((saved.skills || []).join(', '))
      flash('Public profile saved.')
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Could not save profile.')
    } finally { setBusy('') }
  }

  const savePrivateInfo = async () => {
    if (!user || !privateInfo) return
    setBusy('private')
    try {
      setPrivateInfo(await savePrivateProfileInfo(user.id, privateInfo))
      flash('Private personal information saved.')
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Could not save private information.')
    } finally { setBusy('') }
  }

  const uploadImage = async (file: File, kind: 'avatar' | 'gallery') => {
    if (!user) return
    setBusy(kind)
    try {
      await uploadProfileImage(user.id, file, kind)
      await refreshAccount()
      flash(kind === 'avatar' ? 'Profile photo updated.' : 'Image added to your profile.')
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Upload failed.')
    } finally { setBusy('') }
  }

  const removeImage = async (image: UserImage) => {
    if (!user) return
    setBusy(image.id)
    try {
      await removeProfileImage(user.id, image)
      await refreshAccount()
      flash('Image removed.')
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : 'Could not remove image.')
    } finally { setBusy('') }
  }

  const beginTotp = async () => {
    setBusy('enroll')
    setError('')
    try {
      const data = await enrollTotp()
      setEnrollment({ id: data.id, qr: data.totp.qr_code, secret: data.totp.secret })
    } catch (mfaError) {
      setError(mfaError instanceof Error ? mfaError.message : 'Could not start TOTP enrollment.')
    } finally { setBusy('') }
  }

  const verifyFactor = async (factorId: string) => {
    if (!totpCode.trim()) return
    setBusy('verify')
    setError('')
    try {
      await verifyTotpFactor(factorId, totpCode)
      setTotpCode('')
      setEnrollment(null)
      await refreshAccount()
      flash('TOTP verified. This session is AAL2.')
    } catch (mfaError) {
      setError(mfaError instanceof Error ? mfaError.message : 'TOTP verification failed.')
    } finally { setBusy('') }
  }

  const bootstrapAdmin = async () => {
    setBusy('bootstrap-admin')
    try {
      const claimed = await claimFirstAdmin()
      if (!claimed) throw new Error('Initial admin can only be claimed while you are the sole AppForge account and no admin exists yet.')
      await refreshAccount()
      flash('Initial admin role claimed. Set up TOTP before using Admin CRUD.')
    } catch (adminError) {
      setError(adminError instanceof Error ? adminError.message : 'Could not initialize admin.')
    } finally { setBusy('') }
  }

  const loadAdmin = async () => {
    if (role !== 'admin' || currentLevel !== 'aal2') return
    setBusy('admin-load')
    try { setAdminUsers(await adminListUsers()) }
    catch (adminError) { setError(adminError instanceof Error ? adminError.message : 'Could not load admin users.') }
    finally { setBusy('') }
  }

  React.useEffect(() => {
    if (activeTab === 'admin' && role === 'admin' && currentLevel === 'aal2') void loadAdmin()
  }, [activeTab, role, currentLevel])

  const exportWorkspace = () => {
    const payload = { exportedAt: new Date().toISOString(), build: BUILD_INFO, profile, workspace: state }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `appforge-${new Date().toISOString().slice(0, 10)}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  const importWorkspace = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result || '{}'))
        const next = parsed.workspace || parsed
        if (!next || typeof next !== 'object') throw new Error('Invalid backup')
        setState(next as AppState)
        flash('Workspace imported.')
      } catch { setError('That file is not a valid AppForge workspace export.') }
    }
    reader.readAsText(file)
  }

  const gallery = images.filter((link) => link.kind === 'gallery').map(imageFromLink).filter((image): image is UserImage => Boolean(image))
  const verifiedTotp = totpFactors.filter((factor) => factor.status === 'verified')
  const tabs: { id: TabId; label: string }[] = [
    { id: 'profile', label: 'Profile' },
    { id: 'appearance', label: 'Appearance' },
    { id: 'security', label: 'Security' },
    { id: 'data', label: 'Data' },
    { id: 'integrations', label: 'Integrations' },
    { id: 'deployment', label: 'Deployment' },
    { id: 'about', label: 'About' },
    ...(role === 'admin' ? [{ id: 'admin' as TabId, label: 'Admin' }] : []),
  ]

  return (
    <div className="space-y-5 pb-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div><h1 className="text-2xl font-semibold tracking-tight text-foreground">Settings</h1><p className="mt-1 text-sm text-muted-foreground">Profile, privacy, security, collaboration, deployment and project settings.</p></div>
        <BuildBadge />
      </div>

      <div className="flex flex-wrap gap-1 border-b border-border/70 pb-2">{tabs.map((tab) => <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${activeTab === tab.id ? 'bg-accent text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>{tab.label}</button>)}</div>
      {message && <Card className="border-emerald-500/25 bg-emerald-500/5 p-3 text-sm text-emerald-600 dark:text-emerald-400"><Check className="mr-2 inline h-4 w-4" />{message}</Card>}
      {error && <Card className="border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error}</Card>}

      {activeTab === 'profile' && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border border-border/70 bg-muted text-muted-foreground">{profile?.avatar_url ? <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" /> : <UserRound className="h-7 w-7" />}</div>
              <div className="min-w-0"><div className="truncate text-sm font-semibold text-foreground">{profile?.display_name || user?.email || 'AppForge user'}</div><div className="truncate text-xs text-muted-foreground">{user?.email}</div><div className="mt-2 flex flex-wrap gap-1"><Badge color={role === 'admin' ? 'blue' : 'slate'}>{role}</Badge>{profile?.open_to_collaboration && <Badge color="green">Open to collaborate</Badge>}</div></div>
            </div>
            <label className="mt-4 block"><input type="file" accept="image/*" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadImage(file, 'avatar'); event.currentTarget.value = '' }} /><span className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border/70 bg-background/45 px-3 py-2 text-xs font-medium text-foreground hover:bg-accent"><ImagePlus className="h-4 w-4" />{busy === 'avatar' ? 'Uploading…' : 'Change avatar'}</span></label>
            <p className="mt-3 text-xs leading-5 text-muted-foreground">Avatar, headline, GitHub handle, skills and bio can appear in People when your profile is public. Personal details below never appear there.</p>
          </Card>

          <Card className="p-4">
            <h2 className="text-sm font-semibold text-foreground">Public collaboration profile</h2>
            {loading || !profile ? <div className="py-8 text-center text-sm text-muted-foreground">Loading profile…</div> : <div className="mt-4 space-y-3">
              <div className="grid gap-3 sm:grid-cols-2"><Input label="Display name" value={profile.display_name || ''} onChange={(e) => setProfile({ ...profile, display_name: e.target.value })} /><Input label="Username" value={profile.username || ''} onChange={(e) => setProfile({ ...profile, username: e.target.value })} placeholder="your-handle" /><Input label="Headline" value={profile.headline || ''} onChange={(e) => setProfile({ ...profile, headline: e.target.value })} placeholder="Frontend engineer · tool builder" /><Input label="GitHub username" value={profile.github_username || ''} onChange={(e) => setProfile({ ...profile, github_username: e.target.value })} placeholder="github-handle" /><Input label="Public location" value={profile.location || ''} onChange={(e) => setProfile({ ...profile, location: e.target.value })} placeholder="City / country only if you want" /><Input label="Website" value={profile.website || ''} onChange={(e) => setProfile({ ...profile, website: e.target.value })} placeholder="https://…" /></div>
              <Input label="Skills (comma separated)" value={skillsDraft} onChange={(e) => setSkillsDraft(e.target.value)} placeholder="React, TypeScript, Supabase" />
              <Textarea label="Bio" value={profile.bio || ''} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} rows={4} />
              <div className="flex flex-col gap-2 text-sm text-foreground"><label className="flex items-center gap-2"><input type="checkbox" checked={profile.open_to_collaboration} onChange={(e) => setProfile({ ...profile, open_to_collaboration: e.target.checked })} /> Open to open-source collaboration</label><label className="flex items-center gap-2"><input type="checkbox" checked={profile.is_public} onChange={(e) => setProfile({ ...profile, is_public: e.target.checked })} /> Show my profile to other signed-in users</label></div>
              <Button onClick={() => void savePublicProfile()} disabled={busy === 'profile'}>{busy === 'profile' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Save public profile</Button>
            </div>}
          </Card>

          <Card className="p-4 lg:col-span-2">
            <div className="flex items-start gap-3"><LockKeyhole className="mt-0.5 h-5 w-5 text-muted-foreground" /><div><h2 className="text-sm font-semibold text-foreground">Private personal information</h2><p className="mt-1 text-xs leading-5 text-muted-foreground">Optional. Stored separately under owner-only Supabase RLS. Other users and the People directory cannot read this row, and admin CRUD does not expose it.</p></div></div>
            {!privateInfo ? <div className="py-8 text-center text-sm text-muted-foreground">Loading private information…</div> : <div className="mt-4 space-y-3">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"><Input label="Sex" value={privateInfo.sex || ''} onChange={(e) => setPrivateInfo({ ...privateInfo, sex: e.target.value })} /><Input label="Birth date" type="date" value={privateInfo.birth_date || ''} onChange={(e) => setPrivateInfo({ ...privateInfo, birth_date: e.target.value })} /><Input label="Phone" value={privateInfo.phone || ''} onChange={(e) => setPrivateInfo({ ...privateInfo, phone: e.target.value })} /><Input label="Organization" value={privateInfo.organization || ''} onChange={(e) => setPrivateInfo({ ...privateInfo, organization: e.target.value })} /><Input label="Job title" value={privateInfo.job_title || ''} onChange={(e) => setPrivateInfo({ ...privateInfo, job_title: e.target.value })} /><Input label="Country" value={privateInfo.country || ''} onChange={(e) => setPrivateInfo({ ...privateInfo, country: e.target.value })} /></div>
              <div className="grid gap-3 sm:grid-cols-2"><Input label="Address line 1" value={privateInfo.address_line1 || ''} onChange={(e) => setPrivateInfo({ ...privateInfo, address_line1: e.target.value })} /><Input label="Address line 2" value={privateInfo.address_line2 || ''} onChange={(e) => setPrivateInfo({ ...privateInfo, address_line2: e.target.value })} /><Input label="City" value={privateInfo.city || ''} onChange={(e) => setPrivateInfo({ ...privateInfo, city: e.target.value })} /><Input label="Region / state" value={privateInfo.region || ''} onChange={(e) => setPrivateInfo({ ...privateInfo, region: e.target.value })} /><Input label="Postal code" value={privateInfo.postal_code || ''} onChange={(e) => setPrivateInfo({ ...privateInfo, postal_code: e.target.value })} /></div>
              <Textarea label="Private notes" value={privateInfo.notes || ''} onChange={(e) => setPrivateInfo({ ...privateInfo, notes: e.target.value })} rows={3} />
              <Button variant="secondary" onClick={() => void savePrivateInfo()} disabled={busy === 'private'}>{busy === 'private' ? <Loader2 className="h-4 w-4 animate-spin" /> : <LockKeyhole className="h-4 w-4" />} Save private information</Button>
            </div>}
          </Card>

          <Card className="p-4 lg:col-span-2">
            <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-sm font-semibold text-foreground">Profile gallery</h2><p className="mt-0.5 text-xs text-muted-foreground">Add images that represent your work or profile. Gallery images are related to your public profile.</p></div><label><input type="file" accept="image/*" multiple className="hidden" onChange={(event) => { const files = Array.from(event.target.files || []); void (async () => { for (const file of files) await uploadImage(file, 'gallery') })(); event.currentTarget.value = '' }} /><span className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border/70 px-3 py-2 text-xs font-medium hover:bg-accent"><Upload className="h-4 w-4" /> Add images</span></label></div>
            {gallery.length ? <div className="mt-4 grid gap-3 sm:grid-cols-2">{gallery.map((image) => <div key={image.id} className="group relative overflow-hidden rounded-xl border border-border/70 bg-muted"><img src={image.source_url || ''} alt={image.title || ''} className="aspect-[4/3] w-full object-cover" /><button onClick={() => void removeImage(image)} className="absolute right-2 top-2 rounded-lg border border-white/15 bg-black/45 p-2 text-white opacity-0 backdrop-blur-md transition-opacity group-hover:opacity-100" aria-label="Remove image"><Trash2 className="h-4 w-4" /></button></div>)}</div> : <div className="mt-4 rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">No gallery images yet.</div>}
          </Card>
        </div>
      )}

      {activeTab === 'appearance' && <Card className="p-4"><h2 className="text-sm font-semibold text-foreground">Appearance</h2><div className="mt-4 flex flex-wrap gap-2">{([{ value: 'light', label: 'Light', icon: Sun }, { value: 'dark', label: 'Dark', icon: Moon }, { value: 'system', label: 'System', icon: Monitor }] as const).map(({ value, label, icon: Icon }) => <button key={value} onClick={() => setThemeMode(value)} className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${themeMode === value ? 'border-foreground/25 bg-accent' : 'border-border/70 hover:bg-accent/60'}`}><Icon className="h-4 w-4" /> {label}</button>)}</div></Card>}

      {activeTab === 'security' && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="p-4"><div className="flex items-center justify-between gap-3"><div><h2 className="text-sm font-semibold text-foreground">Authentication</h2><p className="mt-1 text-xs text-muted-foreground">Identity is handled through Supabase Auth. Google is the first enabled provider.</p></div><Badge color="green">Connected</Badge></div><div className="mt-4 rounded-xl border border-border/70 bg-background/35 p-3 text-sm"><div className="font-medium text-foreground">{user?.email}</div><div className="mt-1 text-xs text-muted-foreground">Session assurance: {currentLevel || 'checking…'} · next: {nextLevel || 'checking…'}</div></div>{role === 'user' && <div className="mt-4 rounded-xl border border-border/70 bg-background/35 p-3"><div className="text-sm font-medium text-foreground">Initial administrator</div><p className="mt-1 text-xs leading-5 text-muted-foreground">If this is the first and only AppForge account, initialize the first administrator once. No email is hardcoded into the client.</p><Button className="mt-3" variant="secondary" onClick={() => void bootstrapAdmin()} disabled={busy === 'bootstrap-admin'}>{busy === 'bootstrap-admin' ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />} Initialize admin</Button></div>}<Button variant="secondary" className="mt-4" onClick={() => void signOut()}>Sign out</Button></Card>

          <Card className="p-4"><div className="flex items-center justify-between gap-3"><div><h2 className="text-sm font-semibold text-foreground">Authenticator app (TOTP)</h2><p className="mt-1 text-xs text-muted-foreground">Admin mutations require an AAL2 session verified with TOTP.</p></div><ShieldCheck className="h-5 w-5 text-muted-foreground" /></div>{verifiedTotp.length === 0 && !enrollment && <Button className="mt-4" onClick={() => void beginTotp()} disabled={busy === 'enroll'}><KeyRound className="h-4 w-4" /> Set up TOTP</Button>}{enrollment && <div className="mt-4 space-y-3"><div className="rounded-xl border border-border/70 bg-white p-3"><img src={enrollment.qr} alt="TOTP QR code" className="mx-auto max-h-52 max-w-full" /></div><div className="rounded-lg bg-muted p-2 font-mono text-xs break-all">{enrollment.secret}</div><Input label="Authenticator code" inputMode="numeric" value={totpCode} onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 8))} /><Button onClick={() => void verifyFactor(enrollment.id)} disabled={busy === 'verify' || !totpCode}><ShieldCheck className="h-4 w-4" /> Verify and enable</Button></div>}{verifiedTotp.length > 0 && <div className="mt-4 space-y-3"><div className="rounded-xl border border-border/70 p-3"><div className="text-sm font-medium text-foreground">{verifiedTotp[0].friendly_name || 'Authenticator app'}</div><div className="mt-1 text-xs text-muted-foreground">Verified factor · {currentLevel === 'aal2' ? 'this session is elevated' : 'verification required for admin actions'}</div></div>{currentLevel !== 'aal2' && <><Input label="Authenticator code" inputMode="numeric" value={totpCode} onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 8))} /><Button onClick={() => void verifyFactor(verifiedTotp[0].id)} disabled={!totpCode || busy === 'verify'}><LockKeyhole className="h-4 w-4" /> Verify this session</Button></>}{currentLevel === 'aal2' && <Button variant="secondary" onClick={async () => { setBusy('unenroll'); try { await unenrollTotp(verifiedTotp[0].id); await refreshAccount(); flash('TOTP factor removed.') } catch (mfaError) { setError(mfaError instanceof Error ? mfaError.message : 'Could not remove TOTP factor.') } finally { setBusy('') } }} disabled={busy === 'unenroll'}>Remove factor</Button>}</div>}</Card>
        </div>
      )}

      {activeTab === 'data' && <Card className="p-4"><h2 className="text-sm font-semibold text-foreground">Workspace data</h2><p className="mt-1 text-xs leading-5 text-muted-foreground">Authenticated preferences and personalized category titles sync to Supabase. Browser-only tools can still keep their own local data.</p><div className="mt-4 flex flex-wrap gap-2"><Button onClick={exportWorkspace}><Download className="h-4 w-4" /> Export JSON</Button><label><input type="file" accept="application/json,.json" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) importWorkspace(file); e.currentTarget.value = '' }} /><span className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border/70 px-3 py-2 text-sm font-medium hover:bg-accent"><Upload className="h-4 w-4" /> Import JSON</span></label></div></Card>}

      {activeTab === 'integrations' && <div className="grid gap-3 sm:grid-cols-2">{[['Supabase', 'Authentication, profiles, private personal data, preferences, roles, TOTP and profile media.', Cloud], ['Vercel', 'Vite frontend plus same-origin serverless APIs for network-backed tools.', RefreshCw], ['GitHub', 'Public source, contributors, issues, pull requests and CI.', Github], ['Google', 'OAuth identity provider; basic identity scopes only.', ShieldCheck]].map(([name, description, Icon]: any) => <Card key={name} className="p-4"><Icon className="h-5 w-5 text-muted-foreground" /><h2 className="mt-3 text-sm font-semibold text-foreground">{name}</h2><p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p></Card>)}</div>}

      {activeTab === 'deployment' && <Card className="p-4"><div className="flex flex-wrap items-start justify-between gap-4"><div><h2 className="text-sm font-semibold text-foreground">Deployment</h2><p className="mt-1 text-xs text-muted-foreground">One AppForge project deploys the Vite frontend and colocated `/api/*` functions.</p></div><BuildBadge /></div><div className="mt-4 grid gap-3 sm:grid-cols-2"><Input label="Live URL" value={liveUrl} onChange={(e) => { setLiveUrl(e.target.value); localStorage.setItem(LIVE_URL_KEY, e.target.value) }} /><Input label="Product version" value={BUILD_INFO.version} disabled /><Input label="Commit" value={BUILD_INFO.shortSha} disabled /><Input label="Built" value={BUILD_INFO.builtAtLabel} disabled /></div><a href={liveUrl} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"><ExternalLink className="h-3.5 w-3.5" /> Open production</a></Card>}

      {activeTab === 'about' && <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]"><Card className="p-5"><h2 className="text-lg font-semibold text-foreground">About AppForge</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">AppForge is an open-source toolbox with a public development model and an authenticated personal workspace. Local tools stay in-browser where practical; account state and features that need persistence or network access use Supabase and Vercel transparently.</p><p className="mt-3 text-sm leading-6 text-muted-foreground">No advertising analytics are built into AppForge. Public profile fields are opt-in; private personal information is stored separately under owner-only RLS.</p><div className="mt-4 flex flex-wrap gap-2"><Badge color="green">MIT open source</Badge><Badge color="blue">Authenticated workspace</Badge><Badge color="slate">Supabase RLS</Badge><Badge color="slate">PWA</Badge></div><div className="mt-5 flex flex-wrap gap-2"><a href="https://github.com/dracorisz/appforge" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-border/70 px-3 py-2 text-sm font-medium hover:bg-accent"><Github className="h-4 w-4" /> Contribute on GitHub</a><a href={PAYPAL_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-border/70 px-3 py-2 text-sm font-medium hover:bg-accent"><HeartHandshake className="h-4 w-4" /> Support any amount</a></div></Card><Card className="p-5"><h2 className="text-sm font-semibold text-foreground">Project principles</h2><ul className="mt-3 space-y-2 text-sm text-muted-foreground"><li>• Small tools with consistent interaction patterns.</li><li>• Public development and contributor-friendly documentation.</li><li>• No fake data presented as live data.</li><li>• Shared version/build identity across every app.</li><li>• Authentication and RLS around personal data.</li><li>• Test → report build fingerprint → contribute a focused PR.</li></ul></Card></div>}

      {activeTab === 'admin' && role === 'admin' && <div className="space-y-4">{currentLevel !== 'aal2' ? <Card className="p-6 text-center"><LockKeyhole className="mx-auto h-7 w-7 text-muted-foreground" /><h2 className="mt-3 text-sm font-semibold text-foreground">Admin is TOTP protected</h2><p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">Verify your authenticator in Security before AppForge will read or mutate administrative data.</p><Button className="mt-4" onClick={() => setActiveTab('security')}>Open Security</Button></Card> : <><div className="flex items-center justify-between"><div><h2 className="text-sm font-semibold text-foreground">Users</h2><p className="mt-1 text-xs text-muted-foreground">Role, public-profile visibility and destructive account actions are enforced with admin + AAL2 checks. Private personal information is not exposed here.</p></div><Button variant="secondary" size="sm" onClick={() => void loadAdmin()} disabled={busy === 'admin-load'}><RefreshCw className={`h-4 w-4 ${busy === 'admin-load' ? 'animate-spin' : ''}`} /> Refresh</Button></div><div className="space-y-2">{adminUsers.map((item) => <Card key={item.id} className="p-3"><div className="flex flex-col gap-3 lg:flex-row lg:items-center"><div className="flex min-w-0 flex-1 items-center gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border/70 bg-muted">{item.avatar_url ? <img src={item.avatar_url} alt="" className="h-full w-full object-cover" /> : <UserRound className="h-4 w-4" />}</div><div className="min-w-0"><div className="truncate text-sm font-medium text-foreground">{item.display_name || item.email || item.id}</div><div className="truncate text-xs text-muted-foreground">{item.email} · {item.username ? `@${item.username}` : 'no username'}</div></div></div><div className="flex flex-wrap items-center gap-2"><select value={item.role} onChange={async (e) => { const nextRole = e.target.value as 'user' | 'admin'; try { await adminSetRole(item.id, nextRole); setAdminUsers((rows) => rows.map((row) => row.id === item.id ? { ...row, role: nextRole } : row)); flash('Role updated.') } catch (roleError) { setError(roleError instanceof Error ? roleError.message : 'Role update failed.') } }} className="h-9 rounded-lg border border-input bg-background/55 px-2 text-xs"><option value="user">user</option><option value="admin">admin</option></select><button onClick={async () => { try { await adminUpdateProfile(item.id, { display_name: item.display_name, username: item.username, is_public: !item.is_public }); setAdminUsers((rows) => rows.map((row) => row.id === item.id ? { ...row, is_public: !row.is_public } : row)); flash('Profile visibility updated.') } catch (profileError) { setError(profileError instanceof Error ? profileError.message : 'Profile update failed.') } }} className="rounded-lg border border-border/70 px-2.5 py-2 text-xs hover:bg-accent">{item.is_public ? 'Public' : 'Private'}</button>{item.id !== user?.id && <Button variant="ghost" size="sm" onClick={async () => { if (!confirm(`Delete ${item.email || 'this user'}?`)) return; try { await adminDeleteUser(item.id); setAdminUsers((rows) => rows.filter((row) => row.id !== item.id)); flash('User deleted.') } catch (deleteError) { setError(deleteError instanceof Error ? deleteError.message : 'Delete failed.') } }}><Trash2 className="h-4 w-4" /></Button>}</div></div></Card>)}</div></>}</div>}
    </div>
  )
}
