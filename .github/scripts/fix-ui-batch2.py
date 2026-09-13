from pathlib import Path
import re


def edit(path, fn):
    p = Path(path)
    s = p.read_text()
    n = fn(s)
    if n == s:
        print('unchanged', path)
    else:
        p.write_text(n)
        print('updated', path)

# Finish the Media Vault preview sizing against the current component.
def media_showbox(s):
    s = s.replace(
        'className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-3 sm:p-6"',
        'className="fixed inset-0 z-[60] flex h-[100dvh] min-h-[100dvh] w-screen items-center justify-center overflow-y-auto bg-black/85 p-2 backdrop-blur-sm sm:p-3"'
    )
    s = s.replace(
        'className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-white/10 bg-background"',
        'className="flex max-h-[calc(100dvh-1rem)] w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-white/10 bg-background sm:max-h-[calc(100dvh-1.5rem)]"'
    )
    s = s.replace('className="flex min-h-12 items-center gap-3 border-b border-border/70 px-4"', 'className="flex min-h-10 items-center gap-3 border-b border-border/70 px-3"')
    s = s.replace('className="max-h-[76vh] max-w-full object-contain"', 'className="max-h-[62dvh] max-w-full object-contain"')
    s = s.replace('className="max-h-[76vh] max-w-full bg-black"', 'className="max-h-[62dvh] max-w-full bg-black"')
    s = s.replace('className="flex flex-col gap-2 border-t border-border/70 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"', 'className="flex flex-col gap-2 border-t border-border/70 px-3 py-2 sm:flex-row sm:items-center sm:justify-between"')
    return s
edit('src/components/ui/MediaShowbox.tsx', media_showbox)

# Make the shared textarea compact by default while preserving per-call overrides.
edit('src/components/ui/Inputs.tsx', lambda s: s.replace(
    '<textarea {...props} className={`${controlClass} resize-y ${props.className || \'\'}`} />',
    '<textarea {...props} className={`${controlClass} min-h-20 resize-y ${props.className || \'\'}`} />'
))

# Replace the obsolete route assertion with the new embedded Admin behavior.
def public_surface(s):
    s = s.replace(
        "test('blog and changelog stay public while legacy content admin redirects into the protected admin console'",
        "test('blog and changelog stay public while legacy admin routes redirect into embedded Settings admin'"
    )
    s = s.replace(
        "assert.match(app, /path=\"\\/settings\\/admin\".*AdminConsolePage/s)",
        "assert.match(app, /path=\"\\/settings\\/admin\".*Navigate to=\"\\/settings\\?tab=admin\"/s)"
    )
    settings_assert = "  const settings = await read('src/components/resources/Settings.tsx')\n  assert.match(settings, /activeTab === 'admin'.*<AdminConsolePage \\/>/s)\n"
    marker = "  const changelogPage = await read('src/components/public/ChangelogPage.tsx')\n"
    if settings_assert not in s:
        s = s.replace(marker, settings_assert + "\n" + marker)
    return s
edit('tests/public-surface.test.js', public_surface)

# Remove Settings code made obsolete by the embedded Admin / moved Appearance design and use correct integration logos.
def settings_cleanup(s):
    for token in ['  Cloud,\n', '  HeartHandshake,\n', '  Monitor,\n', '  Moon,\n', '  Sun,\n']:
        s = s.replace(token, '')
    s = s.replace("import { SiGithub as Github } from 'react-icons/si'", "import { SiGithub as Github, SiGoogle as Google, SiSupabase as SupabaseIcon, SiVercel as Vercel } from 'react-icons/si'")
    s = s.replace("import type { AppState, Settings } from '@/types'", "import type { AppState } from '@/types'")
    s = s.replace("import { BUILD_INFO } from '@/lib/buildInfo'\n", '')
    for token in [
        '  adminDeleteUser,\n',
        '  adminListUsers,\n',
        '  adminSetRole,\n',
        '  adminUpdateProfile,\n',
        '  type AdminUser,\n',
    ]:
        s = s.replace(token, '')
    s = re.sub(r"\ntype ThemeMode = .*?\n", "\n", s)
    s = re.sub(r"\nconst safeHttpUrl = \(value: string\) => \{.*?\n\}\n", "\n", s, flags=re.S)
    s = re.sub(r"\n  const \[adminUsers, setAdminUsers\].*?\n", "\n", s)
    s = re.sub(r"\n  const loadAdmin = React\.useCallback\(async \(\) => \{.*?\n  \}, \[currentLevel, role\]\)\n\n  React\.useEffect\(\(\) => \{\n    if \(activeTab === 'admin'.*?\n  \}, \[activeTab, role, currentLevel, loadAdmin\]\)\n", "\n", s, flags=re.S)
    s = s.replace(
        "[['Supabase', 'Authentication, profiles, private personal data, preferences, roles, TOTP and profile media.', Cloud], ['Vercel', 'Vite frontend plus same-origin serverless APIs for network-backed tools.', RefreshCw], ['GitHub', 'Public source, contributors, issues, pull requests and CI.', Github], ['Google', 'OAuth identity provider; basic identity scopes only.', ShieldCheck]]",
        "[['Supabase', 'Authentication, profiles, private personal data, preferences, roles, TOTP and profile media.', SupabaseIcon], ['Vercel', 'Vite frontend plus same-origin serverless APIs for network-backed tools.', Vercel], ['GitHub', 'Public source, contributors, issues, pull requests and CI.', Github], ['Google', 'OAuth identity provider; basic identity scopes only.', Google]]"
    )
    return s
edit('src/components/resources/Settings.tsx', settings_cleanup)

# Reuse useful About content on the public landing instead of keeping a Settings tab.
def landing_about(s):
    block = '''\n          <section className="border-t border-border/60 py-8 sm:py-10" aria-labelledby="about-appforge-title">\n            <div className="grid gap-4 md:grid-cols-3">\n              <div className="md:col-span-1"><h2 id="about-appforge-title" className="text-xl font-semibold tracking-tight">Open source. Private by design.</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">AppForge combines public tools with an authenticated workspace, keeping local work in-browser where practical and using protected persistence only where it adds value.</p></div>\n              <div className="rounded-xl border border-border/70 bg-background/55 p-4"><div className="text-sm font-semibold">Consistent tools</div><p className="mt-1 text-xs leading-5 text-muted-foreground">Shared components and interaction patterns keep the growing app collection familiar and easier to maintain.</p></div>\n              <div className="rounded-xl border border-border/70 bg-background/55 p-4"><div className="text-sm font-semibold">Transparent project</div><p className="mt-1 text-xs leading-5 text-muted-foreground">MIT-licensed source, public development, explicit data boundaries, and no advertising analytics built into the product.</p></div>\n            </div>\n          </section>\n'''
    marker = '          <section className="border-t border-border/60 py-8 sm:py-10" aria-labelledby="walkthrough-title">'
    if 'about-appforge-title' not in s:
        s = s.replace(marker, block + '\n' + marker)
    return s
edit('src/auth/LoginPage.tsx', landing_about)

# Keep documentation content aligned with the new navigation/settings model.
for path in ['README.md', 'docs/README.md']:
    p = Path(path)
    if not p.exists():
        continue
    text = p.read_text()
    text = text.replace('Settings → Security', 'Settings → Profile')
    text = text.replace('Settings > Security', 'Settings > Profile')
    text = text.replace('/settings/admin', '/settings?tab=admin')
    p.write_text(text)

# Cleanup temporary recovery machinery from the final product tree.
Path('.github/scripts/restore-ui-batch.py').unlink(missing_ok=True)
Path('.github/scripts/fix-ui-batch2.py').unlink(missing_ok=True)
Path('.github/workflows/restore-ui-batch.yml').unlink(missing_ok=True)
