from pathlib import Path
import re

ROOT = Path('.')


def read(path: str) -> str:
    return Path(path).read_text(encoding='utf-8')


def write(path: str, text: str) -> None:
    Path(path).write_text(text, encoding='utf-8')


def replace_once(path: str, old: str, new: str, label: str) -> None:
    text = read(path)
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f'{label}: expected exactly one match in {path}, found {count}')
    write(path, text.replace(old, new, 1))


def regex_once(path: str, pattern: str, replacement: str, label: str, flags=0) -> None:
    text = read(path)
    updated, count = re.subn(pattern, replacement, text, count=1, flags=flags)
    if count != 1:
        raise RuntimeError(f'{label}: expected exactly one regex match in {path}, found {count}')
    write(path, updated)


# Shared tabs: one canonical component for every tabbed surface.
regex_once(
    'src/components/ui/Misc.tsx',
    r"export function Tabs\(.*?\n}\n\nexport function EmptyState",
    """export type TabItem = {\n  id: string\n  label: React.ReactNode\n  icon?: React.ComponentType<{ className?: string }>\n  disabled?: boolean\n}\n\nexport function Tabs({ tabs, active, onChange, ariaLabel = 'Sections', className = '' }: {\n  tabs: TabItem[]\n  active: string\n  onChange: (id: string) => void\n  ariaLabel?: string\n  className?: string\n}) {\n  return (\n    <div className={`flex min-h-11 gap-1 overflow-x-auto rounded-xl border border-border/70 bg-card/70 p-1 ${className}`} role=\"tablist\" aria-label={ariaLabel}>\n      {tabs.map((tab) => {\n        const Icon = tab.icon\n        const selected = active === tab.id\n        return (\n          <button\n            key={tab.id}\n            type=\"button\"\n            role=\"tab\"\n            aria-selected={selected}\n            disabled={tab.disabled}\n            onClick={() => onChange(tab.id)}\n            className={`inline-flex h-9 shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-xl px-3 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${\n              selected ? 'bg-background text-foreground' : 'text-muted-foreground hover:bg-accent/70 hover:text-foreground'\n            }`}\n          >\n            {Icon && <Icon className=\"h-3.5 w-3.5\" />}\n            {tab.label}\n          </button>\n        )\n      })}\n    </div>\n  )\n}\n\nexport function EmptyState""",
    'replace shared Tabs',
    re.S,
)

# Shared Button cursor and radius contract.
replace_once(
    'src/components/ui/Button.tsx',
    "const base = 'inline-flex shrink-0 items-center justify-center gap-2 rounded-lg font-medium",
    "const base = 'inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl font-medium",
    'button cursor/radius',
)

# Settings uses canonical Tabs.
replace_once(
    'src/components/resources/Settings.tsx',
    "import { Badge, BuildBadge, Button, Card, Input, Textarea } from '@/components/ui'",
    "import { Badge, BuildBadge, Button, Card, Input, Tabs, Textarea } from '@/components/ui'",
    'Settings Tabs import',
)
regex_once(
    'src/components/resources/Settings.tsx',
    r'<div className="flex flex-wrap gap-1 border-b border-border/70 pb-2" role="tablist" aria-label="Settings sections">.*?</div>',
    '<Tabs tabs={tabs} active={activeTab} onChange={(id) => selectTab(id as TabId)} ariaLabel="Settings sections" />',
    'Settings tab row',
    re.S,
)

# Desktop Buddy uses canonical Tabs and keeps icons/sticky behavior.
replace_once(
    'src/components/dashboard/DesktopBuddyWorkspace.tsx',
    "import { WidgetPreferencePanel } from './WidgetPreferencePanel'",
    "import { WidgetPreferencePanel } from './WidgetPreferencePanel'\nimport { Tabs } from '@/components/ui'",
    'Desktop Buddy Tabs import',
)
regex_once(
    'src/components/dashboard/DesktopBuddyWorkspace.tsx',
    r'<nav className="sticky top-0 z-20 -mx-1 overflow-x-auto rounded-xl border border-border/70 bg-background/90 p-1 backdrop-blur" aria-label="Desktop Buddy workspace" role="tablist">.*?</nav>',
    '<Tabs tabs={tabs} active={activeTab} onChange={(id) => selectTab(id as WorkspaceTab)} ariaLabel="Desktop Buddy workspace" className="sticky top-0 z-20 -mx-1 bg-background/90 backdrop-blur" />',
    'Desktop Buddy tab row',
    re.S,
)

# Dashboard/Recent/Favorites/Workspace switcher is also canonical Tabs.
replace_once(
    'src/components/dashboard/PublicDashboard.tsx',
    "import { Button, Card, Input, Switch } from '@/components/ui'",
    "import { Button, Card, Input, Switch, Tabs } from '@/components/ui'",
    'Dashboard Tabs import',
)
regex_once(
    'src/components/dashboard/PublicDashboard.tsx',
    r'<nav className="flex flex-wrap gap-1 rounded-xl border border-border/60 bg-background/35 p-1">.*?</nav>',
    '<Tabs tabs={[{ id: \'/\', label: \'Dashboard\' }, { id: \'/recent\', label: \'Recent\' }, { id: \'/favorites\', label: \'Favorites\' }, { id: \'/workspace\', label: \'Workspace\' }]} active={location.pathname === \'/categories\' ? \'/workspace\' : location.pathname} onChange={(path) => navigate(path)} ariaLabel="Dashboard sections" />',
    'Dashboard tab row',
    re.S,
)

# Getter Pro: canonical filter tabs, equal control height.
replace_once(
    'src/components/dashboard/PF_ScrapperProNext.tsx',
    "import { saveScrapperVaultResult } from '@/lib/mediaVault'",
    "import { saveScrapperVaultResult } from '@/lib/mediaVault'\nimport { Tabs } from '@/components/ui'",
    'Getter Tabs import',
)
regex_once(
    'src/components/dashboard/PF_ScrapperProNext.tsx',
    r'<div className="flex flex-wrap gap-1\.5">\{\(\[\'all\',\'image\',\'video\',\'post\',\'article\'\] as const\)\.map\(\(type\) => <button.*?</button> \)\}</div>',
    """<Tabs className=\"min-w-0 flex-1\" tabs={(['all','image','video','post','article'] as const).map((type) => ({ id: type, label: `${type === 'all' ? 'All' : type.charAt(0).toUpperCase() + type.slice(1)} ${type === 'all' ? results.length : counts[type]}` }))} active={filter} onChange={(id) => setFilter(id as typeof filter)} ariaLabel=\"Getter Pro result types\" />""",
    'Getter filter tabs',
    re.S,
)

# Media Vault: move primary actions into the first toolbar and use Tabs for kind filters.
replace_once(
    'src/components/dashboard/PF_UserMediaVault.tsx',
    "import { Badge, Button, Card } from '@/components/ui'",
    "import { Badge, Button, Card, Tabs } from '@/components/ui'",
    'Media Vault Tabs import',
)
regex_once(
    'src/components/dashboard/PF_UserMediaVault.tsx',
    r'<div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">\s*<div><AppHeading /></div>\s*<div className="flex flex-wrap items-center gap-2">.*?</div>\s*</div>',
    '<AppHeading />',
    'Media Vault detached header actions',
    re.S,
)
old_vault_toolbar = '''<Card className="p-3"><div className="flex flex-col gap-3 lg:flex-row lg:items-center"><div className="flex flex-1 gap-2"><input value={newFolder} onChange={(event) => setNewFolder(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') void createFolder() }} maxLength={60} placeholder="Create a folder…" className="h-10 min-w-0 flex-1 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring/30" /><Button variant="secondary" onClick={() => void createFolder()} disabled={!newFolder.trim()}><FolderPlus className="h-4 w-4" /> New folder</Button></div><label className="flex items-center gap-2 text-xs text-muted-foreground">Sort<select value={sortMode} onChange={(event) => setSortMode(event.target.value as SortMode)} className="h-9 rounded-lg border border-input bg-background px-2 text-sm text-foreground"><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="name-asc">Name A–Z</option><option value="name-desc">Name Z–A</option><option value="size-desc">Largest first</option><option value="type">Type</option></select></label></div></Card>'''
new_vault_toolbar = '''<Card className="p-3"><div className="flex flex-col gap-3 xl:flex-row xl:items-end"><div className="flex min-w-0 flex-1 gap-2"><input value={newFolder} onChange={(event) => setNewFolder(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') void createFolder() }} maxLength={60} placeholder="Create a folder…" className="h-10 min-w-0 flex-1 rounded-xl border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring/30" /><Button variant="secondary" onClick={() => void createFolder()} disabled={!newFolder.trim()}><FolderPlus className="h-4 w-4" /> New folder</Button></div><div className="flex flex-wrap items-end gap-2"><label className="flex items-center gap-2 text-xs text-muted-foreground">Sort<select value={sortMode} onChange={(event) => setSortMode(event.target.value as SortMode)} className="h-9 rounded-xl border border-input bg-background px-2 text-sm text-foreground"><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="name-asc">Name A–Z</option><option value="name-desc">Name Z–A</option><option value="size-desc">Largest first</option><option value="type">Type</option></select></label><Button variant="secondary" onClick={() => void refresh()} disabled={loading}><RefreshCw className="h-4 w-4" /> Refresh</Button><input type="file" multiple accept="image/*,video/*,audio/*,application/pdf,.txt,.md,.json" className="hidden" onChange={handleUpload} disabled={uploading} id="vault-upload" /><label htmlFor="vault-upload" className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-border/70 bg-background/45 px-3 py-2 text-sm font-medium hover:bg-accent"><Upload className="h-4 w-4" />{uploading ? 'Uploading…' : `Upload to ${uploadTarget === 'general' ? 'General' : uploadTarget}`}</label></div></div></Card>'''
replace_once('src/components/dashboard/PF_UserMediaVault.tsx', old_vault_toolbar, new_vault_toolbar, 'Media Vault toolbar move')
regex_once(
    'src/components/dashboard/PF_UserMediaVault.tsx',
    r'<div className="flex flex-wrap gap-2"><button onClick=\{\(\) => setFilterKind\(\'all\'\)\}.*?<div className="flex-1" />',
    """<div className=\"flex flex-wrap items-center gap-2\"><Tabs className=\"min-w-0\" tabs={[{ id: 'all', label: 'All kinds' }, ...(['image', 'video', 'document', 'audio', 'other'] as VaultMedia['kind'][]).map((kind) => ({ id: kind, label: kind.charAt(0).toUpperCase() + kind.slice(1) }))]} active={filterKind} onChange={(id) => setFilterKind(id as typeof filterKind)} ariaLabel=\"Media kinds\" /><div className=\"flex-1\" />""",
    'Media Vault kind tabs',
    re.S,
)

# Crypto Track: move provider metadata next to update timestamp.
replace_once(
    'src/components/dashboard/PF_CryptoTrack.tsx',
    "      {resolvedProvider && <p className=\"text-xs text-muted-foreground\">Market data source: {resolvedProvider}</p>}\n",
    '',
    'Crypto detached provider label',
)
replace_once(
    'src/components/dashboard/PF_CryptoTrack.tsx',
    "          {updatedAt && <span className=\"ml-auto text-xs text-muted-foreground\">Updated {new Date(updatedAt).toLocaleTimeString()}</span>}",
    "          <div className=\"ml-auto flex flex-wrap items-center gap-3 text-xs text-muted-foreground\">{resolvedProvider && <span>Source: {resolvedProvider}</span>}{updatedAt && <span>Updated {new Date(updatedAt).toLocaleTimeString()}</span>}</div>",
    'Crypto provider/update cluster',
)

# Weather Now: move unit switcher down into the control card.
regex_once(
    'src/components/dashboard/PF_WeatherNow.tsx',
    r'<div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><div className="flex flex-wrap items-center gap-2"><AppHeading /></div></div><div className="flex items-center gap-1 rounded-lg border border-border p-1">.*?</div></div>',
    '<AppHeading />',
    'Weather detached unit switcher',
    re.S,
)
replace_once(
    'src/components/dashboard/PF_WeatherNow.tsx',
    'md:grid-cols-[minmax(0,1fr)_auto_auto]',
    'md:grid-cols-[minmax(0,1fr)_auto_auto_auto]',
    'Weather controls grid',
)
replace_once(
    'src/components/dashboard/PF_WeatherNow.tsx',
    '<div className="flex items-center gap-1 rounded-xl border border-border p-1"><button onClick={() => setViewMode(\'grid\')',
    '<div className="flex items-center gap-1 rounded-xl border border-border p-1">{([\'c\', \'f\'] as Unit[]).map((value) => <button key={value} onClick={() => setUnit(value)} className={`rounded-xl px-2.5 py-1 text-xs font-medium ${unit === value ? \'bg-accent text-foreground\' : \'text-muted-foreground hover:text-foreground\'}`}>°{value.toUpperCase()}</button>)}</div><div className="flex items-center gap-1 rounded-xl border border-border p-1"><button onClick={() => setViewMode(\'grid\')',
    'Weather inline unit switcher',
)

# QR Generator: move primary actions into the main content card.
regex_once(
    'src/components/dashboard/QrGenerator.tsx',
    r'<div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">\s*<AppHeading />\s*<div className="flex flex-wrap gap-2 sm:justify-end">.*?</div>\s*</div>',
    '<AppHeading />',
    'QR detached actions',
    re.S,
)
replace_once(
    'src/components/dashboard/QrGenerator.tsx',
    '''        <Card className="p-5">\n          <Tabs tabs={[{ id: 'text', label: 'Text / URL' }, { id: 'wifi', label: 'Wi-Fi' }]} active={mode} onChange={(id) => changeMode(id as Mode)} />''',
    '''        <Card className="p-5">\n          <div className="flex flex-col gap-3 sm:flex-row sm:items-center"><Tabs className="min-w-0 flex-1" tabs={[{ id: 'text', label: 'Text / URL' }, { id: 'wifi', label: 'Wi-Fi' }]} active={mode} onChange={(id) => changeMode(id as Mode)} ariaLabel="QR content type" /><div className="flex flex-wrap gap-2 sm:ml-auto"><Button variant="secondary" onClick={() => { setNonce((current) => current + 1); setError('') }} disabled={!url || busy}><RefreshCw className="h-4 w-4" /> Refresh</Button><Button onClick={() => void download()} disabled={!url || busy}><Download className="h-4 w-4" /> {busy ? 'Downloading…' : 'Download'}</Button></div></div>''',
    'QR actions into card',
)

# Story Studio: Novel/Comics is a real tab switcher; use the same component.
replace_once(
    'src/components/dashboard/PF_AIDragonArenaStudio.tsx',
    "import { Badge, Button, Card, Input",
    "import { Badge, Button, Card, Input, Tabs",
    'Story Studio Tabs import prefix',
)
regex_once(
    'src/components/dashboard/PF_AIDragonArenaStudio.tsx',
    r'<div className="flex items-center gap-1 rounded-xl border border-border/70 bg-card p-1">\s*<button onClick=\{\(\) => setMode\(\'novel\'\)\}.*?</button>\s*<button onClick=\{\(\) => setMode\(\'comics\'\)\}.*?</button>\s*</div>',
    '<Tabs tabs={[{ id: \'novel\', label: \'Novel\', icon: BookOpen }, { id: \'comics\', label: \'Comics\', icon: GalleryThumbnails }]} active={mode} onChange={(id) => setMode(id as StoryMode)} ariaLabel="Story format" />',
    'Story Studio format tabs',
    re.S,
)

# Color Picker: shell already owns AppHeading; remove the empty legacy wrapper causing extra vertical space.
replace_once(
    'src/components/dashboard/ColorPickerTool.tsx',
    '      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><AppHeading /></div></div>\n\n',
    '',
    'Color Picker empty heading wrapper',
)

# Sidebar search results are a transient overlay-like surface: this is a valid shadow-xl use.
replace_once(
    'src/components/layout/Sidebar.tsx',
    'surface-card mt-2 max-h-52 space-y-1 overflow-y-auto rounded-xl border p-1.5',
    'surface-card mt-2 max-h-52 space-y-1 overflow-y-auto rounded-xl border p-1.5 shadow-xl',
    'Sidebar search elevation',
)

# Global cursor contract for enabled interactive elements.
index_css = read('src/index.css')
cursor_block = '''\n\n/* AppForge interaction cursor contract: enabled interactive controls advertise clickability. */\nbutton:not(:disabled),\na[href],\n[role='button']:not([aria-disabled='true']),\n[role='tab']:not([aria-disabled='true']),\nlabel[for],\ninput[type='checkbox']:not(:disabled),\ninput[type='radio']:not(:disabled),\nselect:not(:disabled),\nsummary {\n  cursor: pointer;\n}\n\nbutton:disabled,\n[aria-disabled='true'],\ninput:disabled,\nselect:disabled {\n  cursor: not-allowed;\n}\n'''
if 'AppForge interaction cursor contract' not in index_css:
    write('src/index.css', index_css.rstrip() + cursor_block)

# Project-wide Tailwind geometry contract. Repair accidental rounded-xlp typos first,
# then normalize all radius utilities to rounded-xl and remove every shadow utility
# except the explicitly allowed shadow-xl.
source_files = [p for p in Path('src').rglob('*') if p.suffix in {'.ts', '.tsx', '.js', '.jsx', '.css'}]
for path in source_files:
    text = path.read_text(encoding='utf-8')
    text = re.sub(r'rounded-xlp-([0-9.]+)', r'rounded-xl p-\1', text)
    text = re.sub(r'(?<![\w-])rounded-[trblse]{1,2}-(?:none|sm|md|lg|xl|2xl|3xl|full|\[[^\s\"\'`]+\])', 'rounded-xl', text)
    text = re.sub(r'(?<![\w-])rounded-(?!xl\b)(?:none|sm|md|lg|2xl|3xl|full|\[[^\s\"\'`]+\])', 'rounded-xl', text)
    text = re.sub(r'(?<![\w-])shadow(?!-xl\b)(?:-[^\s\"\'`]+)?(?=[\s\"\'`])', '', text)
    text = re.sub(r'[ \t]{2,}', ' ', text) if path.suffix == '.css' else text
    path.write_text(text, encoding='utf-8')

# Documentation: permanent visual and interaction invariants.
docs_path = Path('docs/UI-SYSTEM.md')
docs = docs_path.read_text(encoding='utf-8')
block = '''\n\n## Visual and interaction invariants\n\nThese rules are project-wide contracts, not per-page preferences:\n\n- **Radius:** `rounded-xl` is the only Tailwind rounding utility allowed in application source. Do not introduce `rounded-sm`, `rounded-md`, `rounded-lg`, `rounded-2xl`, `rounded-full`, directional radius utilities, or arbitrary radius utilities.\n- **Shadows:** static surfaces are shadowless. `shadow-xl` is the only Tailwind shadow utility allowed, and it is reserved for genuinely elevated/transient layers where depth improves hierarchy, such as search-result dropdowns, menus, popovers, and modal-like overlays.\n- **Pointers:** every enabled interactive control must advertise clickability with the pointer cursor. Disabled controls must not appear clickable. Shared controls and the global interaction contract enforce this by default.\n- **Tabs:** every tabbed interface must use the shared `Tabs` component from `@/components/ui`. Do not build page-specific rows of tab buttons. The component owns tab height, radius, focus states, icons, overflow, and active-state styling.\n- **Movement:** avoid decorative hover translation/scale for ordinary application controls and cards. Use color/border changes instead unless motion is intrinsic to the feature itself.\n'''
if '## Visual and interaction invariants' not in docs:
    docs_path.write_text(docs.rstrip() + block, encoding='utf-8')

# Add a repository guard so future changes cannot silently reintroduce forbidden classes.
validator = Path('scripts/check-ui-style.mjs')
validator.write_text(r'''import fs from 'node:fs'\nimport path from 'node:path'\n\nconst root = path.resolve('src')\nconst extensions = new Set(['.ts', '.tsx', '.js', '.jsx', '.css'])\nconst files = []\nconst walk = (dir) => {\n  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {\n    const full = path.join(dir, entry.name)\n    if (entry.isDirectory()) walk(full)\n    else if (extensions.has(path.extname(entry.name))) files.push(full)\n  }\n}\nwalk(root)\n\nconst radius = /(?:^|\\s)(rounded-(?!xl(?:\\s|$))[^\\s\"'`}]*)/g\nconst shadow = /(?:^|\\s)(shadow(?!-xl(?:\\s|$))(?:-[^\\s\"'`}]*)?)(?=\\s|$|[\"'`}])/g\nconst violations = []\nfor (const file of files) {\n  const lines = fs.readFileSync(file, 'utf8').split(/\\r?\\n/)\n  lines.forEach((line, index) => {\n    for (const match of line.matchAll(radius)) violations.push(`${file}:${index + 1}: forbidden radius ${match[1]}`)\n    for (const match of line.matchAll(shadow)) violations.push(`${file}:${index + 1}: forbidden shadow ${match[1]}`)\n  })\n}\nif (violations.length) {\n  console.error(violations.join('\\n'))\n  process.exit(1)\n}\nconsole.log(`UI style contract OK across ${files.length} source files: rounded-xl only; shadow-xl only.`)\n''', encoding='utf-8')

package_path = Path('package.json')
package_text = package_path.read_text(encoding='utf-8')
if '"check:ui-style"' not in package_text:
    package_text = package_text.replace('"audit:apps": "node scripts/audit-app-integrity.mjs",', '"audit:apps": "node scripts/audit-app-integrity.mjs",\n    "check:ui-style": "node scripts/check-ui-style.mjs",')
    package_path.write_text(package_text, encoding='utf-8')

ci_path = Path('.github/workflows/ci.yml')
ci = ci_path.read_text(encoding='utf-8')
if 'Verify UI style contract' not in ci:
    ci = ci.replace('      - name: Verify environment capability docs\n        run: npm run docs:env-check\n', '      - name: Verify environment capability docs\n        run: npm run docs:env-check\n\n      - name: Verify UI style contract\n        run: npm run check:ui-style\n')
    ci_path.write_text(ci, encoding='utf-8')

print('Applied AppForge 1.27.1 review changes.')
