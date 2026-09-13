from pathlib import Path
import re


def edit(path, fn):
    p=Path(path); s=p.read_text(); n=fn(s)
    if n==s: print('unchanged', path)
    else: p.write_text(n); print('updated', path)


def repl(s,a,b,required=True):
    if a not in s:
        if required: print('missing pattern:', a[:90])
        return s
    return s.replace(a,b)

# Media Vault: Desktop Buddies is a protected destination; tighten preview viewport.
edit('src/components/dashboard/PF_UserMediaVault.tsx', lambda s: repl(repl(s,
    "if (isPinnedAsset(item) || !destination || destination === vaultFolder(item)) return",
    "if (isPinnedAsset(item) || destination === 'desktop-buddies' || destination === 'Desktop Buddies' || !destination || destination === vaultFolder(item)) return"),
    "const allFolderOptions = React.useMemo(() => [...SYSTEM_FOLDERS.filter((item) => !['all', 'dragon-arena'].includes(String(item.id))).map((item) => ({ value: String(item.id), label: item.label })), ...userFolders.map((item) => ({ value: item.name, label: item.name }))], [userFolders])",
    "const allFolderOptions = React.useMemo(() => [...SYSTEM_FOLDERS.filter((item) => !['all', 'dragon-arena', 'desktop-buddies'].includes(String(item.id)) && item.label !== 'Desktop Buddies').map((item) => ({ value: String(item.id), label: item.label })), ...userFolders.filter((item) => item.name !== 'Desktop Buddies').map((item) => ({ value: item.name, label: item.name }))], [userFolders])"))

edit('src/components/ui/MediaShowbox.tsx', lambda s: s.replace(
    'z-modal fixed inset-0 flex items-center justify-center overflow-y-auto bg-black/75 p-2 backdrop-blur-sm sm:p-4',
    'z-modal fixed inset-0 h-[100dvh] min-h-[100dvh] w-screen overflow-y-auto bg-black/80 p-2 backdrop-blur-sm sm:p-3 flex items-center justify-center'
).replace(
    'flex max-h-[95vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl',
    'flex max-h-[calc(100dvh-1rem)] w-full max-w-5xl flex-col overflow-hidden rounded-2xl sm:max-h-[calc(100dvh-1.5rem)]'
).replace('px-4 py-3 sm:px-5','px-3 py-2 sm:px-4').replace('max-h-[68vh]','max-h-[58dvh]'))

# Getter Pro: remove candidate export/save-contract chrome and make pagination/filter copy contextual.
def getter(s):
    s=re.sub(r"\nconst downloadJson = \(value: unknown, filename: string\) => \{.*?\n\}\n", "\n", s, flags=re.S)
    s=re.sub(r"\n  const exportCollectibleCandidates = \(\) => \{.*?\n  const copyUrl", "\n  const copyUrl", s, flags=re.S)
    s=s.replace("setMessage(`Loaded another YouTube page${data.nextPageToken ? '.' : ' · end of results.'}`)", "setMessage(`Loaded more ${filter === 'all' ? 'results' : `${filter} results`}${data.nextPageToken ? '.' : ' · end of results.'}`)")
    s=s.replace("setMessage(error instanceof Error ? error.message : 'Could not load the next YouTube page.')", "setMessage(error instanceof Error ? error.message : `Could not load more ${filter === 'all' ? 'results' : `${filter} results`}.`)")
    s=re.sub(r'<button type="button" onClick=\{exportCollectibleCandidates\}.*?</button>', '', s)
    s=s.replace('className="surface-card rounded-xl border p-10 text-center text-sm text-muted-foreground"','className="surface-card rounded-xl border p-6 text-center text-sm text-muted-foreground"')
    s=s.replace("<Youtube className=\"h-4 w-4\" />} Load more YouTube results", "<Youtube className=\"h-4 w-4\" />} Load more {filter === 'all' ? 'results' : `${filter} results`}")
    s=re.sub(r'\n      <section className="rounded-xl border border-border/70 bg-background/60 p-4 text-xs leading-5 text-muted-foreground"><strong className="text-foreground">Save contract:</strong>.*?</section>', '', s)
    return s
edit('src/components/dashboard/PF_ScrapperProNext.tsx', getter)

# Crypto Track: action belongs with market controls, not page heading.
def crypto(s):
    button='''        <Button variant="secondary" onClick={() => fetchCoins(provider)} disabled={loading}>\n          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh\n        </Button>\n'''
    s=s.replace(button,'')
    marker='''        <div className="mt-4 flex flex-wrap items-center gap-2">'''
    return s.replace(marker, '''        <div className="mt-4 flex flex-wrap items-center gap-2">\n          <Button variant="secondary" size="sm" onClick={() => fetchCoins(provider)} disabled={loading}><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh</Button>''',1)
edit('src/components/dashboard/PF_CryptoTrack.tsx', crypto)

# Task List: move the Sync action from heading chrome into its first control card when present.
def tasklist(s):
    m=re.search(r'\s*<Button[^>]*onClick=\{[^}]*sync[^}]*\}[^>]*>.*?Sync.*?</Button>', s, re.I|re.S)
    if not m: return s
    button=m.group(0).strip()
    s=s[:m.start()]+s[m.end():]
    card=re.search(r'<Card([^>]*)>', s)
    if card:
        pos=card.end(); s=s[:pos]+f'\n        <div className="mb-3 flex justify-end">{button}</div>'+s[pos:]
    return s
edit('src/components/dashboard/TaskList.tsx', tasklist)

# Email/password auth API.
def auth_provider(s):
    s=s.replace("  signInWithGitHub: (returnTo?: string) => Promise<void>\n", "  signInWithGitHub: (returnTo?: string) => Promise<void>\n  signInWithEmail: (email: string, password: string) => Promise<void>\n")
    s=s.replace("  const signInWithGitHub = (returnTo = '/') => signInWithProvider('github', returnTo)\n", "  const signInWithGitHub = (returnTo = '/') => signInWithProvider('github', returnTo)\n  const signInWithEmail = async (email: string, password: string) => { const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password }); if (error) throw error }\n")
    s=s.replace("loading, signInWithGoogle, signInWithGitHub, signOut", "loading, signInWithGoogle, signInWithGitHub, signInWithEmail, signOut")
    return s
edit('src/auth/AuthProvider.tsx', auth_provider)

# Login: route remains stable, auth actions live in a focused modal with email/password.
def login(s):
    s=s.replace("const { user, loading, signInWithGoogle, signInWithGitHub } = useAuth()", "const { user, loading, signInWithGoogle, signInWithGitHub, signInWithEmail } = useAuth()")
    s=s.replace("  const [error, setError] = React.useState('')", "  const [error, setError] = React.useState('')\n  const [authOpen, setAuthOpen] = React.useState(!landingOnly)\n  const [email, setEmail] = React.useState('')\n  const [password, setPassword] = React.useState('')")
    old='''{user ? <Button className="h-11 px-5" onClick={() => navigate('/')} disabled={loading}>Open workspace <ArrowRight className="h-4 w-4" /></Button> : <><Button className="h-11 px-5" onClick={() => void login('google')} disabled={Boolean(busyProvider) || loading}><Google className="h-4 w-4" />{loading ? 'Checking session…' : busyProvider === 'google' ? 'Opening Google…' : 'Continue with Google'}</Button><Button variant="secondary" className="h-11 px-5" onClick={() => void login('github')} disabled={Boolean(busyProvider) || loading}><Github className="h-4 w-4" />{busyProvider === 'github' ? 'Opening GitHub…' : 'Continue with GitHub'}</Button></>}'''
    new='''{user ? <Button className="h-11 px-5" onClick={() => navigate('/')} disabled={loading}>Open workspace <ArrowRight className="h-4 w-4" /></Button> : <Button className="h-11 px-5" onClick={() => setAuthOpen(true)} disabled={loading}>Sign in <ArrowRight className="h-4 w-4" /></Button>}'''
    s=s.replace(old,new)
    modal='''\n        {authOpen && !user && <div className="fixed inset-0 z-[100] flex min-h-[100dvh] items-center justify-center bg-black/75 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Sign in to AppForge" onMouseDown={(event) => { if (event.target === event.currentTarget && landingOnly) setAuthOpen(false) }}><div className="w-full max-w-md rounded-2xl border border-border/70 bg-background p-5 shadow-2xl"><div className="flex items-start justify-between gap-3"><div><h2 className="text-xl font-semibold">Sign in to AppForge</h2><p className="mt-1 text-sm text-muted-foreground">Use email or a connected provider.</p></div>{landingOnly && <button type="button" onClick={() => setAuthOpen(false)} className="rounded-xl px-2 py-1 text-sm text-muted-foreground hover:bg-accent">Close</button>}</div><div className="mt-5 grid gap-2"><Button onClick={() => void login('google')} disabled={Boolean(busyProvider) || loading}><Google className="h-4 w-4" /> Continue with Google</Button><Button variant="secondary" onClick={() => void login('github')} disabled={Boolean(busyProvider) || loading}><Github className="h-4 w-4" /> Continue with GitHub</Button></div><div className="my-4 flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />or email<span className="h-px flex-1 bg-border" /></div><form className="space-y-3" onSubmit={async (event) => { event.preventDefault(); setError(''); try { await signInWithEmail(email, password); navigate(consumeReturnPath(returnTo), { replace: true }) } catch (emailError) { setError(emailError instanceof Error ? emailError.message : 'Email sign-in failed.') } }}><input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email" className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm" /><input type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password" className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm" /><Button type="submit" className="w-full" disabled={!email.trim() || !password}>Sign in with email</Button></form>{error && <div role="alert" className="mt-3 rounded-xl border border-destructive/25 bg-destructive/5 px-3 py-2 text-sm text-destructive">{error}</div>}</div></div>}\n'''
    return s.replace('        <PublicFooter />', modal+'        <PublicFooter />')
edit('src/auth/LoginPage.tsx', login)

# Settings: Profile absorbs Security; Appearance moves to sidebar; Deployment/About removed; Admin console is embedded.
def settings(s):
    s=s.replace("import { Link, useSearchParams } from 'react-router-dom'", "import { useSearchParams } from 'react-router-dom'")
    s=s.replace("import { VertexBridgeStatus } from './VertexBridgeStatus'", "import { VertexBridgeStatus } from './VertexBridgeStatus'\nimport { AdminConsolePage } from '@/components/admin/AdminConsolePage'")
    s=re.sub(r"const LIVE_URL_KEY.*?\nconst PROFILE_IMAGE_ACCEPT", "const PROFILE_IMAGE_ACCEPT", s, flags=re.S)
    s=s.replace("type TabId = 'profile' | 'appearance' | 'security' | 'data' | 'integrations' | 'deployment' | 'about' | 'admin'", "type TabId = 'profile' | 'data' | 'integrations' | 'admin'")
    s=s.replace("const TAB_IDS = new Set<TabId>(['profile', 'appearance', 'security', 'data', 'integrations', 'deployment', 'about', 'admin'])", "const TAB_IDS = new Set<TabId>(['profile', 'data', 'integrations', 'admin'])")
    s=re.sub(r"\n  const \[themeMode, setThemeMode\].*?\n  const \[profile,", "\n  const [profile,", s, flags=re.S)
    s=re.sub(r"\n  const \[liveUrl, setLiveUrl\].*?\n  const \[skillsDraft", "\n  const [skillsDraft", s, flags=re.S)
    s=re.sub(r"\n  React.useEffect\(\(\) => \{\n    const root = document.documentElement.*?\n  \}, \[themeMode, state, setState\]\)\n", "\n", s, flags=re.S)
    s=s.replace("    setThemeMode(importPreview.workspace.settings.theme)\n", "")
    s=re.sub(r"\n  const updateLiveUrl = .*?\n  }\n", "\n", s, flags=re.S)
    s=s.replace("  const deploymentUrl = safeHttpUrl(liveUrl)\n", "")
    s=s.replace("    { id: 'appearance', label: 'Appearance' },\n    { id: 'security', label: 'Security' },\n", "")
    s=s.replace("    { id: 'deployment', label: 'Deployment' },\n    { id: 'about', label: 'About' },\n", "")
    s=s.replace('Profile, privacy, security, collaboration, deployment and project settings.','Profile, privacy, security, integrations and workspace settings.')
    # remove Appearance block, keep Security content but render as part of Profile
    s=re.sub(r"\n      \{activeTab === 'appearance' && \(.*?\n      \)\}\n", "\n", s, flags=re.S)
    s=s.replace("{activeTab === 'security' && (", "{activeTab === 'profile' && (")
    s=re.sub(r"\n      \{activeTab === 'deployment'.*?\n\n      \{activeTab === 'about'.*?\n\n", "\n", s, flags=re.S)
    # compact integration tiles
    s=s.replace('<Card key={name} className="p-4"><Icon className="h-5 w-5 text-muted-foreground" /><h2 className="mt-3', '<Card key={name} className="p-3"><Icon className="h-4 w-4 text-muted-foreground" /><h2 className="mt-2')
    # replace bespoke admin block with canonical console
    s=re.sub(r"\n      \{activeTab === 'admin' && role === 'admin' && <div className=\"space-y-4\">.*?</div>\}\n    </div>", "\n      {activeTab === 'admin' && role === 'admin' && <AdminConsolePage />}\n    </div>", s, flags=re.S)
    # old security deep-link becomes profile
    s=s.replace("selectTab('security')", "selectTab('profile')")
    return s
edit('src/components/resources/Settings.tsx', settings)

# Admin is no longer a separate page; preserve old URL as redirect and update security wording.
def app_routes(s):
    s=s.replace("const AdminConsolePage = React.lazy(() => import('./components/admin/AdminConsolePage').then((module) => ({ default: module.AdminConsolePage })))\n", '')
    s=s.replace('<Route path="/settings/admin" element={lazyPage(<AdminConsolePage />)} />', '<Route path="/settings/admin" element={<Navigate to="/settings?tab=admin" replace />} />')
    return s
edit('src/App.tsx', app_routes)
edit('src/components/admin/AdminConsolePage.tsx', lambda s: s.replace('Settings → Security','Settings → Profile').replace('to="/settings?tab=security"','to="/settings"').replace('Open Security','Open Profile'))

# Sidebar account drop-up: Appearance, Settings, Support, Sign out. Remove duplicate system Settings link.
def sidebar(s):
    s=s.replace("import { NavLink, useLocation } from 'react-router-dom'", "import { NavLink, useLocation } from 'react-router-dom'")
    s=s.replace('Calendar, ChevronLeft, ChevronRight,', 'Calendar, ChevronDown, ChevronLeft, ChevronRight,')
    s=s.replace("  { id: 'settings', label: 'Settings', icon: Settings, path: '/settings' },\n", '')
    s=s.replace("  const [profileName, setProfileName] = React.useState<string | null>(null)", "  const [profileName, setProfileName] = React.useState<string | null>(null)\n  const [accountOpen, setAccountOpen] = React.useState(false)")
    old=re.search(r'    <div className="space-y-1 border-t border-border p-3">.*?</div>\n  </aside>', s, re.S)
    if old:
        new='''    <div className="relative border-t border-border p-3">{user && <>{accountOpen && !isCollapsed && <div className="absolute bottom-[calc(100%-0.25rem)] left-3 right-3 z-30 rounded-xl border border-border/70 bg-background p-1.5 shadow-xl"><div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Appearance</div><div className="grid grid-cols-3 gap-1 px-1 pb-1">{(['light','dark','system'] as const).map((mode) => <button key={mode} type="button" onClick={() => { localStorage.setItem('appforge-theme', JSON.stringify({ mode })); const dark = mode === 'dark' || (mode === 'system' && matchMedia('(prefers-color-scheme: dark)').matches); document.documentElement.classList.toggle('dark', dark); document.documentElement.style.colorScheme = dark ? 'dark' : 'light' }} className="rounded-lg px-2 py-1.5 text-[11px] capitalize text-muted-foreground hover:bg-accent hover:text-foreground">{mode}</button>)}</div><NavLink to="/settings" onClick={onClose} className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"><Settings className="h-4 w-4" /> Settings</NavLink><a href="https://github.com/dracorisz/appforge/issues" target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"><HeartHandshake className="h-4 w-4" /> Support</a><button onClick={() => void handleSignOut()} disabled={signingOut} className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-60"><LogOut className="h-4 w-4" />{signingOut ? 'Signing out…' : 'Sign out'}</button></div>}<button type="button" onClick={() => setAccountOpen((value) => !value)} className={`flex w-full items-center gap-2 rounded-xl border border-border/60 bg-background/35 p-2 text-left hover:border-foreground/15 ${isCollapsed ? 'justify-center' : ''}`} title={isCollapsed ? String(displayName) : undefined}><div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border/70 bg-accent text-xs font-semibold text-foreground">{avatar ? <img src={avatar} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" /> : initial}</div>{!isCollapsed && <><div className="min-w-0 flex-1"><div className="truncate text-xs font-medium text-foreground">{String(displayName)}</div>{user.email && <div className="truncate text-[10px] text-muted-foreground">{user.email}</div>}</div><ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${accountOpen ? 'rotate-180' : ''}`} /></>}</button></>}{signOutError && !isCollapsed && <div role="alert" className="mt-1 rounded-xl border border-destructive/25 bg-destructive/5 px-2.5 py-2 text-[11px] leading-4 text-destructive">{signOutError}</div>}</div>\n  </aside>'''
        s=s[:old.start()]+new+s[old.end():]
    s=s.replace('Calendar, ChevronDown, ChevronLeft', 'Calendar, ChevronDown, ChevronLeft')
    # ensure Support icon import exists
    s=s.replace('Hash, Image as ImageIcon, LayoutDashboard, Lock, LogOut, Palette', 'Hash, HeartHandshake, Image as ImageIcon, LayoutDashboard, Lock, LogOut, Palette')
    return s
edit('src/components/layout/Sidebar.tsx', sidebar)

# Shared compact inputs/drop zones/output affordances.
for path in ['src/components/ui/file-dropzone.tsx','src/components/ui/FileDropzone.tsx']:
    if Path(path).exists(): edit(path, lambda s: s.replace('min-h-32','min-h-24').replace('min-h-[10rem]','min-h-24'))
if Path('src/components/ui/textarea.tsx').exists(): edit('src/components/ui/textarea.tsx', lambda s: s.replace('min-h-24','min-h-20').replace('min-h-[100px]','min-h-20'))

# People/public pages were already converted to shared Card/Tabs in 1.27.1; tighten page spacing only.
if Path('src/components/resources/People.tsx').exists(): edit('src/components/resources/People.tsx', lambda s: s.replace('space-y-6','space-y-5').replace('p-6','p-5'))

# Docs content only: record recovered batch without changing docs presentation.
ch=Path('CHANGELOG.md'); txt=ch.read_text(); note='''\n## 1.27.2 - 2026-09-13\n\n- Consolidated account access into a login modal with Google, GitHub and email sign-in.\n- Simplified Settings: security is part of Profile, Appearance moved to the sidebar account menu, Admin Console is embedded, and obsolete About/Deployment tabs were removed.\n- Polished Media Vault, Getter Pro, Crypto Track, Task List, People and shared compact input/upload patterns.\n- Protected the Desktop Buddies media destination and tightened the media preview viewport.\n- Continued shared-component/theme consolidation and removed obsolete UI paths while preserving public header/footer behavior.\n'''
if '## 1.27.2 - 2026-09-13' not in txt: ch.write_text(txt.rstrip()+note+'\n')

# Bump package version consistently; lockfile is updated by npm install in CI when needed.
for path in ['package.json','package-lock.json']:
    p=Path(path); s=p.read_text(); p.write_text(s.replace('"version": "1.27.1"','"version": "1.27.2"',1))

# Self-clean so the final tree contains only product/doc changes.
Path('.github/scripts/restore-ui-batch.py').unlink(missing_ok=True)
Path('.github/workflows/restore-ui-batch.yml').unlink(missing_ok=True)
