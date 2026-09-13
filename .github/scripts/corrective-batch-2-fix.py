from pathlib import Path
import re

def patch(path, fn):
    p = Path(path)
    text = p.read_text()
    new = fn(text)
    if new == text:
        print(f'FIX NO CHANGE: {path}')
    else:
        p.write_text(new)
        print(f'FIX UPDATED: {path}')

# Getter Pro: do not leave an empty result-grid sibling between tabs and empty state;
# that invisible grid was creating a second vertical space-y gap.
def getter_fix(s):
    start = '<section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{visibleResults.map'
    if start in s and '{visibleResults.length > 0 && <section' not in s:
        s = s.replace(start, '{visibleResults.length > 0 && <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{visibleResults.map', 1)
        s = s.replace('})}</section>\n      {!loading && visibleResults.length === 0', '})}</section>}\n      {!loading && visibleResults.length === 0', 1)
    return s
patch('src/components/dashboard/PF_ScrapperProNext.tsx', getter_fix)

# Shared multiline controls: compact by default, with row/class overrides still available.
patch('src/components/ui/Inputs.tsx', lambda s: s.replace('min-h-20 resize-y', 'min-h-16 resize-y'))

# Sidebar: adapt the first-pass logic to the component's actual accountOpen state.
def sidebar_fix(s):
    s = s.replace('accountMenuOpen', 'accountOpen').replace('setAccountMenuOpen', 'setAccountOpen')
    if 'const accountMenuRef' not in s:
        s = s.replace('const [accountOpen, setAccountOpen] = React.useState(false)', 'const [accountOpen, setAccountOpen] = React.useState(false)\n  const accountMenuRef = React.useRef<HTMLDivElement | null>(null)')
    s = s.replace('<div className="relative border-t border-border p-3">', '<div ref={accountMenuRef} className="relative border-t border-border p-3">')
    s = s.replace("document.documentElement.style.colorScheme = dark ? 'dark' : 'light' }}", "document.documentElement.style.colorScheme = dark ? 'dark' : 'light'; setAccountOpen(false) }}")
    s = s.replace('<NavLink to="/settings" onClick={onClose}', '<NavLink to="/settings" onClick={() => { setAccountOpen(false); onClose?.() }}')
    s = s.replace('<a href="https://github.com/dracorisz/appforge/issues" target="_blank" rel="noreferrer"', '<a href="https://github.com/dracorisz/appforge/issues" target="_blank" rel="noreferrer" onClick={() => setAccountOpen(false)}')
    return s
patch('src/components/layout/Sidebar.tsx', sidebar_fix)

# Settings: exact-current-source password UI + compact masonry-style integrations.
def settings_fix(s):
    auth_anchor = '<div className="mt-4 rounded-xl border border-border/70 bg-background/35 p-3 text-sm"><div className="font-medium text-foreground">{user?.email}</div><div className="mt-1 text-xs text-muted-foreground">Session assurance: {currentLevel || \'checking…\'} · next: {nextLevel || \'checking…\'}</div></div>'
    if 'Set email login password' not in s and auth_anchor in s:
        password = auth_anchor + '<div className="mt-3 rounded-xl border border-border/70 bg-background/35 p-3"><div className="flex items-start gap-2"><KeyRound className="mt-0.5 h-4 w-4 text-muted-foreground" /><div><div className="text-xs font-semibold text-foreground">Set email login password</div><p className="mt-1 text-xs leading-5 text-muted-foreground">Minimum 8 characters with lowercase, uppercase, a digit and a symbol. The credential is updated through Supabase Auth for this signed-in account.</p></div></div><div className="mt-3 grid gap-2 sm:grid-cols-2"><Input type="password" label="New password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} autoComplete="new-password" /><Input type="password" label="Confirm password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} autoComplete="new-password" /></div><Button className="mt-3" size="sm" variant="secondary" onClick={() => void saveLoginPassword()} disabled={busy === \'password\' || !newPassword || !confirmPassword}>{busy === \'password\' ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />} Save password</Button></div>'
        s = s.replace(auth_anchor, password, 1)

    start = "      {activeTab === 'integrations' && ("
    end = "\n\n      {activeTab === 'admin' && role === 'admin' && <AdminConsolePage />}"
    if start in s and end in s:
        before, rest = s.split(start, 1)
        _, after = rest.split(end, 1)
        block = r'''      {activeTab === 'integrations' && (
        <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,.9fr)_minmax(360px,1.1fr)]">
          <div className="space-y-4">
            <Card className="p-3 sm:p-4">
              <div className="grid gap-2 sm:grid-cols-2">{[['Supabase', 'Auth, profiles, preferences, roles and private data.', SupabaseIcon], ['Vercel', 'Frontend and same-origin serverless APIs.', Vercel], ['GitHub', 'Source, issues, pull requests and CI.', Github], ['Google', 'OAuth identity and approved Google integrations.', Google]].map(([name, description, Icon]: any) => <div key={name} className="rounded-xl border border-border/70 bg-background/35 p-3"><div className="flex items-center gap-2"><Icon className="h-4 w-4 text-muted-foreground" /><h2 className="text-sm font-semibold text-foreground">{name}</h2></div><p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p></div>)}</div>
            </Card>
            <div className="[&>div]:h-auto [&>div]:min-h-0"><VertexBridgeStatus /></div>
          </div>
          <Card className="self-start p-4">
            <h2 className="text-sm font-semibold text-foreground">AI provider keys</h2>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">Personal keys stay in this browser and are excluded from workspace backups. They are sent only when you invoke the selected provider.</p>
            <div className="mt-3 space-y-3">
              <div><label htmlFor="gemini-key" className="mb-1 block text-xs font-medium text-foreground">Google Gemini API key</label><div className="flex gap-2"><Input id="gemini-key" type="password" autoComplete="off" value={geminiKey} onChange={(e) => setGeminiKey(e.target.value)} placeholder="Gemini API key" className="flex-1" /><Button size="sm" aria-label="Save Gemini key" disabled={!geminiKey.trim()} onClick={() => saveLocalSecret(GEMINI_KEY_STORAGE, geminiKey, 'Gemini key')}><Check className="h-4 w-4" /></Button><Button size="sm" aria-label="Remove Gemini key" variant="destructive" onClick={() => removeLocalSecret(GEMINI_KEY_STORAGE, () => setGeminiKey(''), 'Gemini key')}><Trash2 className="h-4 w-4" /></Button></div></div>
              <div><label className="mb-1 block text-xs font-medium text-foreground">OpenRouter personal key</label><div className="flex gap-2"><Input type="password" value={openRouterKey} onChange={(e) => setOpenRouterKey(e.target.value)} placeholder="sk-or-..." className="flex-1" /><Button size="sm" onClick={saveOpenRouterKey} disabled={!openRouterKey.startsWith('sk-or-')}><Check className="h-4 w-4" /></Button>{openRouterKey && <Button size="sm" variant="destructive" onClick={() => removeLocalSecret('dragon-arena-openrouter-key', () => setOpenRouterKey(''), 'OpenRouter key')}><Trash2 className="h-4 w-4" /></Button>}</div></div>
              <div><label className="mb-1 block text-xs font-medium text-foreground">Hugging Face personal token</label><div className="flex gap-2"><Input type="password" value={hfToken} onChange={(e) => setHfToken(e.target.value)} placeholder="hf_..." className="flex-1" /><Button size="sm" onClick={saveHfToken} disabled={!hfToken.startsWith('hf_')}><Check className="h-4 w-4" /></Button>{hfToken && <Button size="sm" variant="destructive" onClick={() => removeLocalSecret('dragon-arena-hf-key', () => setHfToken(''), 'Hugging Face token')}><Trash2 className="h-4 w-4" /></Button>}</div></div>
            </div>
          </Card>
        </div>
      )}'''
        s = before + block + end + after
    return s
patch('src/components/resources/Settings.tsx', settings_fix)

# Admin Console: use shared Tabs/Button controls and the same compact surface rhythm as apps.
def admin_fix(s):
    s = s.replace("import { Button, Card } from '@/components/ui'", "import { Button, Card, Tabs } from '@/components/ui'")
    s = s.replace('className="w-full space-y-5 pb-10"', 'className="w-full space-y-4 pb-8"')
    oldtabs = "<div className=\"flex flex-wrap gap-1 border-b border-border/70 pb-2\">{(['users','content','apps','marketing'] as Section[]).map((id) => <button key={id} onClick={() => setSection(id)} className={`rounded-xl px-3 py-1.5 text-xs font-medium capitalize transition-[border-color,background-color,color,box-shadow] ${section === id ? 'bg-accent text-foreground' : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'}`}>{id === 'content' ? 'Content Manager' : id === 'marketing' ? 'Marketing Studio' : id}</button>)}</div>"
    newtabs = "<Tabs tabs={[{ id: 'users', label: 'Users' }, { id: 'content', label: 'Content Manager' }, { id: 'apps', label: 'Apps' }, { id: 'marketing', label: 'Marketing Studio' }]} active={section} onChange={(id) => setSection(id as Section)} ariaLabel=\"Admin sections\" />"
    s = s.replace(oldtabs, newtabs)
    oldvis = "<button onClick={async () => { try { await adminUpdateProfile(item.id, { display_name: item.display_name, username: item.username, is_public: !item.is_public }); setUsers((rows) => rows.map((row) => row.id === item.id ? { ...row, is_public: !row.is_public } : row)); toast.success('Visibility updated.') } catch (profileError) { fail(profileError, 'Update failed.') } }} className=\"rounded-xl border border-border/70 px-2.5 py-2 text-xs transition-[border-color,background-color,box-shadow] hover:bg-accent\">{item.is_public ? 'Public' : 'Private'}</button>"
    newvis = "<Button variant=\"secondary\" size=\"sm\" onClick={async () => { try { await adminUpdateProfile(item.id, { display_name: item.display_name, username: item.username, is_public: !item.is_public }); setUsers((rows) => rows.map((row) => row.id === item.id ? { ...row, is_public: !row.is_public } : row)); toast.success('Visibility updated.') } catch (profileError) { fail(profileError, 'Update failed.') } }}>{item.is_public ? 'Public' : 'Private'}</Button>"
    s = s.replace(oldvis, newvis)
    s = s.replace("section === 'content' && <div className=\"space-y-8\"", "section === 'content' && <div className=\"space-y-4\"")
    return s
patch('src/components/admin/AdminConsolePage.tsx', admin_fix)

# Remove this additional fixer from the final tree too.
Path('.github/scripts/corrective-batch-2-fix.py').unlink(missing_ok=True)
