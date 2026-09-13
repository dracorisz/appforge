from pathlib import Path
import re


def patch(path, fn):
    p = Path(path)
    text = p.read_text()
    new = fn(text)
    if new == text:
        print(f'NO CHANGE: {path}')
    else:
        p.write_text(new)
        print(f'UPDATED: {path}')

# 2c: keep the empty state at the same visual rhythm as other tabbed surfaces.
patch('src/components/dashboard/PF_ScrapperProNext.tsx', lambda s: s.replace('className="min-h-0 px-5 py-6"', 'className="!mt-3 min-h-0 px-5 py-6"'))

# 3: anonymous landing is a landing page, not an automatically-open auth dialog.
patch('src/App.tsx', lambda s: s.replace("if (loading || !user) return <LoginPage returnTo={requestedPath} />", "if (loading || !user) return <LoginPage returnTo={requestedPath} landingOnly />"))

def login_patch(s):
    s = s.replace("onMouseDown={(event) => { if (event.target === event.currentTarget && landingOnly) setAuthOpen(false) }}", "onMouseDown={(event) => { if (event.target === event.currentTarget) setAuthOpen(false) }}")
    s = s.replace("{landingOnly && <button type=\"button\" onClick={() => setAuthOpen(false)} className=\"rounded-xl px-2 py-1 text-sm text-muted-foreground hover:bg-accent\">Close</button>}", "<button type=\"button\" onClick={() => setAuthOpen(false)} className=\"inline-flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground hover:bg-accent hover:text-foreground\" aria-label=\"Close sign in\"><span aria-hidden=\"true\">×</span></button>")
    return s
patch('src/auth/LoginPage.tsx', login_patch)

# 4 / 5: use the standard 16px block rhythm between primary surfaces.
patch('src/components/dashboard/PF_CryptoTrack.tsx', lambda s: s.replace('<div className="space-y-6">', '<div className="space-y-4">', 1))
patch('src/components/dashboard/TaskList.tsx', lambda s: s.replace('<div className="w-full space-y-5">', '<div className="w-full space-y-4">', 1))

# 8: account drop-up closes for every action and any outside click.
def sidebar_patch(s):
    s = s.replace("const [accountMenuOpen, setAccountMenuOpen] = React.useState(false)", "const [accountMenuOpen, setAccountMenuOpen] = React.useState(false)\n  const accountMenuRef = React.useRef<HTMLDivElement | null>(null)")
    marker = "  const handleSignOut = async () => {"
    if marker in s and "accountMenuRef.current?.contains" not in s:
        effect = "  React.useEffect(() => {\n    if (!accountMenuOpen) return\n    const closeOnOutside = (event: PointerEvent) => {\n      if (!accountMenuRef.current?.contains(event.target as Node)) setAccountMenuOpen(false)\n    }\n    document.addEventListener('pointerdown', closeOnOutside)\n    return () => document.removeEventListener('pointerdown', closeOnOutside)\n  }, [accountMenuOpen])\n\n"
        s = s.replace(marker, effect + marker)
    s = s.replace('<div className="relative">\n        {accountMenuOpen', '<div className="relative" ref={accountMenuRef}>\n        {accountMenuOpen')
    s = s.replace("onClick={() => setTheme(mode)}", "onClick={() => { setTheme(mode); setAccountMenuOpen(false) }}")
    s = s.replace('target="_blank" rel="noopener noreferrer"', 'target="_blank" rel="noopener noreferrer" onClick={() => setAccountMenuOpen(false)}', 1)
    s = s.replace("const handleSignOut = async () => {\n", "const handleSignOut = async () => {\n    setAccountMenuOpen(false)\n")
    return s
patch('src/components/layout/Sidebar.tsx', sidebar_patch)

# 10: compact shared multiline input baseline; callers can still opt into larger rows.
patch('src/components/ui/Inputs.tsx', lambda s: s.replace('min-h-20 w-full', 'min-h-16 w-full').replace('px-3 py-2.5 text-sm', 'px-3 py-2 text-sm'))

# 7c/7d/7f: denser profile composition, compact integration mosaic and email-password setup.
def settings_patch(s):
    if "from '@/lib/supabase'" not in s:
        s = s.replace("import { useAuth } from '@/auth/AuthProvider'", "import { useAuth } from '@/auth/AuthProvider'\nimport { supabase } from '@/lib/supabase'")
    s = s.replace("const [importFileName, setImportFileName] = React.useState('')", "const [importFileName, setImportFileName] = React.useState('')\n  const [newPassword, setNewPassword] = React.useState('')\n  const [confirmPassword, setConfirmPassword] = React.useState('')")
    marker = "  const saveOpenRouterKey = () => saveLocalSecret('dragon-arena-openrouter-key', openRouterKey, 'OpenRouter key')"
    if marker in s and 'const saveLoginPassword' not in s:
        fn = "  const saveLoginPassword = async () => {\n    const password = newPassword\n    const valid = password.length >= 8 && /[a-z]/.test(password) && /[A-Z]/.test(password) && /\\d/.test(password) && /[^A-Za-z0-9]/.test(password)\n    if (!valid) { setError('Password must be at least 8 characters and include lowercase, uppercase, a digit and a symbol.'); return }\n    if (password !== confirmPassword) { setError('Password confirmation does not match.'); return }\n    setBusy('password')\n    setError('')\n    const { error: passwordError } = await supabase.auth.updateUser({ password })\n    if (passwordError) setError(passwordError.message)\n    else { setNewPassword(''); setConfirmPassword(''); flash('Email/password login password updated.') }\n    setBusy('')\n  }\n\n"
        s = s.replace(marker, fn + marker)
    s = s.replace('className="grid gap-4 lg:grid-cols-2"', 'className="grid items-start gap-4 lg:grid-cols-[minmax(260px,.72fr)_minmax(0,1.28fr)]"', 1)
    s = s.replace('rows={4}', 'rows={3}')
    s = s.replace('rows={3}', 'rows={2}')
    # Insert password setup at top of the Security card when present.
    sec = '<h2 className="text-sm font-semibold text-foreground">Security</h2>'
    if sec in s and 'Set email login password' not in s:
        block = sec + "\n            <div className=\"mt-4 rounded-xl border border-border/70 bg-background/35 p-3\"><div className=\"flex items-start gap-2\"><KeyRound className=\"mt-0.5 h-4 w-4 text-muted-foreground\" /><div><div className=\"text-xs font-semibold text-foreground\">Set email login password</div><p className=\"mt-1 text-xs leading-5 text-muted-foreground\">For this signed-in account. Minimum 8 characters with lowercase, uppercase, a digit and a symbol.</p></div></div><div className=\"mt-3 grid gap-2 sm:grid-cols-2\"><Input type=\"password\" label=\"New password\" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} autoComplete=\"new-password\" /><Input type=\"password\" label=\"Confirm password\" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} autoComplete=\"new-password\" /></div><Button className=\"mt-3\" size=\"sm\" variant=\"secondary\" onClick={() => void saveLoginPassword()} disabled={busy === 'password' || !newPassword || !confirmPassword}>{busy === 'password' ? <Loader2 className=\"h-4 w-4 animate-spin\" /> : <KeyRound className=\"h-4 w-4\" />} Save password</Button></div>"
        s = s.replace(sec, block, 1)
    # Integrations: one compact 2x2 provider tile beside a compact Vertex tile.
    s = s.replace('className="grid items-start gap-3 xl:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]"', 'className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,.85fr)]"')
    s = s.replace('<div className="space-y-3">\n            <div className="grid items-start gap-3 md:grid-cols-2">', '<Card className="p-3 sm:p-4">\n            <div className="grid items-start gap-2 sm:grid-cols-2">', 1)
    s = s.replace('            </div>\n          </div>\n          <Card className="space-y-3 self-start p-4">', '            </div>\n          </Card>\n          <Card className="space-y-2 self-start p-3 sm:p-4">', 1)
    s = s.replace('className="h-auto self-start p-4"', 'className="h-auto self-start p-3"')
    return s
patch('src/components/resources/Settings.tsx', settings_patch)

# 9: rebuild People around the same compact cards/controls used elsewhere while preserving visibility rules.
people = r'''import React from 'react'
import { ExternalLink, HeartHandshake, Mail, MapPin, Search, UserRound } from 'lucide-react'
import { SiGithub as Github } from 'react-icons/si'
import { Badge, Button, Card, Input } from '@/components/ui'
import { listProfileImages, listVisibleProfiles, type AppProfile, type ProfileImageLink, type UserImage } from '@/lib/account'

const linkedImage = (link: ProfileImageLink) => Array.isArray(link.user_images) ? link.user_images[0] || null : link.user_images || null

export function PeoplePage() {
  const [profiles, setProfiles] = React.useState<AppProfile[]>([])
  const [images, setImages] = React.useState<ProfileImageLink[]>([])
  const [query, setQuery] = React.useState('')
  const [collaboratorsOnly, setCollaboratorsOnly] = React.useState(false)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState('')

  React.useEffect(() => {
    let active = true
    void Promise.all([listVisibleProfiles(), listProfileImages()]).then(([nextProfiles, nextImages]) => {
      if (!active) return
      setProfiles(nextProfiles.filter((profile) => profile.is_public))
      setImages(nextImages)
    }).catch((loadError) => { if (active) setError(loadError instanceof Error ? loadError.message : 'Could not load profiles.') }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const needle = query.trim().toLowerCase()
  const visible = profiles.filter((profile) => {
    if (collaboratorsOnly && !profile.open_to_collaboration) return false
    if (!needle) return true
    const values: Array<string | null | undefined> = [profile.display_name, profile.username, profile.headline, profile.bio, profile.location]
    if (profile.show_github !== false) values.push(profile.github_username)
    if (profile.show_skills !== false) values.push(...(profile.skills || []))
    if (profile.show_website !== false) values.push(profile.website)
    if (profile.show_email) values.push(profile.public_email)
    return values.filter(Boolean).some((value) => String(value).toLowerCase().includes(needle))
  })

  const coverFor = (profileId: string) => images.filter((link) => link.profile_id === profileId && link.kind === 'cover').map(linkedImage).find((image): image is UserImage => Boolean(image?.source_url))

  return <div className="space-y-4 pb-8">
    <div><div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground"><HeartHandshake className="h-4 w-4" /> Community</div><h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">People</h1><p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">Discover signed-in AppForge users who explicitly opted into a public profile. Every contact field remains controlled by its owner.</p></div>
    <Card className="p-3 sm:p-4"><div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end"><label className="relative block"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search names, skills, location…" className="pl-9" aria-label="Search people" /></label><Button size="sm" variant={collaboratorsOnly ? 'default' : 'secondary'} onClick={() => setCollaboratorsOnly((value) => !value)}><HeartHandshake className="h-4 w-4" /> Open to collaborate</Button></div><div className="mt-2 text-xs text-muted-foreground">{visible.length} of {profiles.length} public profiles shown</div></Card>
    {error && <Card className="border-destructive/30 p-3 text-sm text-destructive">{error}</Card>}
    {loading ? <Card className="p-8 text-center text-sm text-muted-foreground">Loading profiles…</Card> : visible.length === 0 ? <Card className="p-8 text-center"><UserRound className="mx-auto h-6 w-6 text-muted-foreground" /><h2 className="mt-3 text-sm font-medium text-foreground">No matching profiles</h2><p className="mt-1 text-sm text-muted-foreground">Try a broader search or turn off the collaboration filter.</p></Card> : <div className="grid items-start gap-3 md:grid-cols-2 xl:grid-cols-3">{visible.map((profile) => {
      const cover = coverFor(profile.id)
      return <Card key={profile.id} className="overflow-hidden p-0">
        {cover?.source_url ? <img src={cover.source_url} alt="" className="h-24 w-full object-cover" loading="lazy" /> : null}
        <div className="p-4"><div className="flex items-start gap-3"><div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border/70 bg-muted text-muted-foreground">{profile.avatar_url ? <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" /> : <UserRound className="h-5 w-5" />}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-1.5"><h2 className="truncate text-sm font-semibold text-foreground">{profile.display_name || profile.username || 'AppForge user'}</h2>{profile.open_to_collaboration && <Badge color="green">Collaborate</Badge>}</div>{profile.username && <p className="truncate text-xs text-muted-foreground">@{profile.username}</p>}{profile.headline && <p className="mt-1 line-clamp-2 text-xs font-medium text-foreground/80">{profile.headline}</p>}</div></div>
        {profile.bio && <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted-foreground">{profile.bio}</p>}
        {profile.show_skills !== false && (profile.skills || []).length > 0 && <div className="mt-3 flex flex-wrap gap-1">{profile.skills.slice(0, 6).map((skill) => <span key={skill} className="rounded-xl border border-border/70 px-2 py-0.5 text-[11px] text-muted-foreground">{skill}</span>)}</div>}
        <div className="mt-4 flex flex-wrap gap-x-3 gap-y-2 border-t border-border/60 pt-3 text-xs text-muted-foreground">{profile.location && <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {profile.location}</span>}{profile.show_github !== false && profile.github_username && <a href={`https://github.com/${encodeURIComponent(profile.github_username)}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-foreground"><Github className="h-3.5 w-3.5" /> GitHub</a>}{profile.show_website !== false && profile.website && <a href={profile.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-foreground"><ExternalLink className="h-3.5 w-3.5" /> Website</a>}{profile.show_email && profile.public_email && <a href={`mailto:${profile.public_email}`} className="inline-flex items-center gap-1 hover:text-foreground"><Mail className="h-3.5 w-3.5" /> Email</a>}</div></div>
      </Card>
    })}</div>}
  </div>
}
'''
Path('src/components/resources/People.tsx').write_text(people)
print('UPDATED: src/components/resources/People.tsx')

# 7e: Admin Console: shared buttons/cards and a tighter app-like rhythm.
def admin_patch(s):
    s = s.replace("import { Card } from '@/components/ui'", "import { Badge, Button, Card } from '@/components/ui'")
    s = s.replace('className="space-y-6"', 'className="space-y-4"')
    s = re.sub(r'<button([^>]*?)className="([^"]*)"([^>]*)>(.*?)</button>', lambda m: '<Button' + m.group(1) + m.group(3) + ' size="sm" variant="secondary">' + m.group(4) + '</Button>', s, flags=re.S)
    s = s.replace('className="grid gap-4"', 'className="grid gap-3"')
    return s
patch('src/components/admin/AdminConsolePage.tsx', admin_patch)

# 12/13: materially refresh docs content and maintenance rules, without changing docs design.
appendices = {
'docs/GETTING_STARTED.md': '''\n\n## Current account and navigation behavior\n\n- The public landing page stays unobstructed until a user explicitly chooses **Sign in**. The auth dialog supports Google, GitHub, and email/password and is dismissible by its close control or backdrop.\n- Authenticated users can set an email/password credential from **Settings → Profile → Security**. AppForge validates at least 8 characters with lowercase, uppercase, a digit, and a symbol before asking Supabase Auth to update the credential.\n- Appearance is controlled from the sidebar account menu. Account menus must dismiss after an action and on outside click.\n- Public Blog article routes scroll to the document top, render media only when media exists, and show up to three related articles.\n\n## UI contribution baseline\n\nUse existing AppForge primitives before adding one-off wrappers. Keep page sections on the standard 16px rhythm, use `rounded-xl`, avoid translate/offset hover motion, and keep textareas/upload/output surfaces compact unless the content genuinely needs a larger editor.\n''',
'docs/DATABASE.md': '''\n\n## Migration and Supabase preview discipline\n\nThe repository migration directory is the reproducible source of schema history. A migration recorded remotely but missing from `supabase/migrations` will make Supabase Preview fail with “Remote migration versions not found in local migrations directory.” Never delete or rename an applied migration. Add a new forward migration instead.\n\nAfter every DDL/security change:\n\n1. confirm local and remote migration versions match;\n2. run Supabase Security Advisor;\n3. review Storage policies separately from public object URL behavior;\n4. keep privileged implementations out of exposed API schemas where practical;\n5. preserve explicit authorization checks for any privileged RPC wrapper; and\n6. verify GitHub Supabase Preview is green before release.\n\nPublic Storage buckets do not need a broad `SELECT` policy merely to serve public object URLs. Listing policies should be narrower than object delivery. `SECURITY DEFINER` functions require deliberate grants and should not become an accidental public Data API.\n''',
'docs/DOC_MAINTENANCE.md': '''\n\n## Documentation quality gate\n\nA feature batch is not complete when only the changelog changes. Update the durable page that owns the behavior: account/auth changes belong in getting-started/security docs, schema/RLS changes in database docs, UI architecture in the app model, and provider changes in provider-specific guides.\n\nDuring cleanup passes, check docs for retired routes, renamed products, obsolete screenshots/instructions, duplicate setup steps, stale version claims, and references to deleted components. Prefer deleting obsolete guidance over adding “legacy” paragraphs that keep dead concepts discoverable. Generated files such as environment capability matrices must be regenerated by their script rather than hand-edited.\n''',
'docs/APP_MODEL.md': '''\n\n## Shared surface rules\n\nCurrent AppForge pages should compose shared `Card`, `Button`, `Input`, `Textarea`, `Tabs`, badges, empty/loading/error states, and the canonical app heading/shell instead of recreating their own control systems. Page-level groups use a compact, predictable spacing rhythm; action buttons belong with the controls they affect rather than floating in headings.\n\nAvoid layout animation that moves cards vertically on hover. Prefer border/background/focus feedback. Empty results should not leave invisible grid wrappers that create extra vertical gaps. Account/popover surfaces must support explicit dismissal and outside-click dismissal.\n\nSettings uses the same component contract as apps: Profile is arranged to use wide-screen space efficiently, Integrations is a compact mosaic rather than equal-height stretched cards, and Admin Console is embedded as a first-class Settings surface.\n''',
'docs/GITHUB_AUTH.md': '''\n\n## OAuth verification evidence\n\nWhen Google OAuth consent-screen verification requests scope evidence, record an unlisted YouTube demonstration showing the exact sign-in flow and each requested scope in the product context where it is used. Keep the recording aligned with the currently configured scopes; do not demonstrate permissions the application does not request. Retain the final video URL and the verification correspondence/email as release evidence.\n\nGitHub and Google provider buttons are entry points to one shared sign-in dialog. The public landing page must not display that dialog until the visitor requests authentication.\n'''
}
for path, addition in appendices.items():
    p = Path(path)
    text = p.read_text()
    heading = addition.strip().splitlines()[0]
    if heading not in text:
        p.write_text(text.rstrip() + addition + '\n')
        print('UPDATED:', path)

# Changelog and package metadata for this corrective batch.
p = Path('CHANGELOG.md')
ch = p.read_text()
entry = '''\n## 1.27.3 — September 13, 2026\n\n### Fixed\n- Corrected public authentication modal lifecycle and dismissal, Getter Pro empty-state spacing, Crypto Track/Task List section rhythm, and sidebar account-menu dismissal.\n- Reworked Settings Profile/Integrations density, added secure email-password setup, refreshed People, and aligned Admin Console more closely with shared UI components.\n\n### Documentation\n- Expanded getting-started, database, UI architecture, GitHub OAuth, and documentation-maintenance guidance, including Supabase migration-preview and security practices.\n- Re-ran cleanup with emphasis on stale docs and compact shared input patterns.\n'''
if '## 1.27.3' not in ch:
    anchor = 'This file tracks user-visible AppForge product changes. The canonical source is the `main` branch.\n'
    p.write_text(ch.replace(anchor, anchor + entry, 1))

import json
pkg = Path('package.json'); data=json.loads(pkg.read_text()); data['version']='1.27.3'; pkg.write_text(json.dumps(data, indent=2)+'\n')
lock=Path('package-lock.json'); data=json.loads(lock.read_text()); data['version']='1.27.3'; data.get('packages',{}).get('',{})['version']='1.27.3'; lock.write_text(json.dumps(data, indent=2)+'\n')
print('UPDATED: version 1.27.3')

# Remove this staging machinery from the final commit.
Path('.github/scripts/corrective-batch-2.py').unlink(missing_ok=True)
Path('.github/workflows/corrective-batch-2.yml').unlink(missing_ok=True)
