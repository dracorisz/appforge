from pathlib import Path
import json


def patch(path, old, new):
    p = Path(path)
    text = p.read_text()
    if old not in text:
        raise SystemExit(f'missing patch target in {path}: {old[:80]!r}')
    p.write_text(text.replace(old, new, 1))

# Background Remover: useful tolerance presets, no global sizing hacks.
patch('src/components/dashboard/DesktopBuddyTransparencyLab.tsx',
'''          <div className="text-xs font-medium text-foreground">Background tolerance: {tolerance}</div>\n          <input type="range" min="14" max="78" step="2" value={tolerance} onChange={(event) => setTolerance(Number(event.target.value))} className="mt-2 w-full" />''',
'''          <div className="flex flex-wrap items-center justify-between gap-2"><div className="text-xs font-medium text-foreground">Background tolerance: {tolerance}</div><div className="flex flex-wrap gap-1">{[[24, 'Preserve'], [38, 'Balanced'], [56, 'Aggressive']].map(([value, label]) => <button key={String(label)} type="button" onClick={() => { setTolerance(Number(value)); setResult(null) }} className={`rounded-xl border px-2 py-1 text-[11px] ${tolerance === Number(value) ? 'bg-accent text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>{String(label)}</button>)}</div></div>\n          <input type="range" min="14" max="78" step="2" value={tolerance} onChange={(event) => { setTolerance(Number(event.target.value)); setResult(null) }} className="mt-2 w-full" />''')

# Image Labeler: one-action approval progression.
patch('src/components/dashboard/PF_ImageLabeler.tsx',
'''  const clearFolderLabels = () => {''',
'''  const approveAndNext = () => {\n    if (!currentImage) return\n    updateLabel({ approved: true })\n    if (currentIndex < images.length - 1) goTo(currentIndex + 1)\n  }\n\n  React.useEffect(() => {\n    const onKeyDown = (event: KeyboardEvent) => {\n      const target = event.target as HTMLElement | null\n      if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA') return\n      if (event.key === 'ArrowLeft') goTo(currentIndex - 1)\n      if (event.key === 'ArrowRight') goTo(currentIndex + 1)\n      if (event.key.toLowerCase() === 'a' && currentImage) approveAndNext()\n    }\n    window.addEventListener('keydown', onKeyDown)\n    return () => window.removeEventListener('keydown', onKeyDown)\n  }, [currentIndex, currentImage, images.length])\n\n  const clearFolderLabels = () => {''')
patch('src/components/dashboard/PF_ImageLabeler.tsx',
'''              <Button className="mt-5 w-full" variant={currentLabel?.approved ? 'secondary' : 'primary'} onClick={() => updateLabel({ approved: !currentLabel?.approved })}><Check className="h-4 w-4" /> {currentLabel?.approved ? 'Approved' : 'Approve image'}</Button>''',
'''              <div className="mt-5 grid gap-2 sm:grid-cols-2"><Button variant={currentLabel?.approved ? 'secondary' : 'primary'} onClick={() => updateLabel({ approved: !currentLabel?.approved })}><Check className="h-4 w-4" /> {currentLabel?.approved ? 'Approved' : 'Approve image'}</Button><Button variant="secondary" onClick={approveAndNext} disabled={currentIndex >= images.length - 1 && Boolean(currentLabel?.approved)}>Approve & next</Button></div><p className="mt-2 text-[11px] text-muted-foreground">Keyboard: ← / → navigate · A approves and advances.</p>''')

# Creator SVG: practical configuration presets.
patch('src/components/dashboard/PF_CreatorSVG.tsx',
'''  const update = (patch: Partial<HeaderConfig>) => {\n    setConfig(prev => ({ ...prev, ...patch }))\n  }''',
'''  const update = (patch: Partial<HeaderConfig>) => {\n    setConfig(prev => ({ ...prev, ...patch }))\n  }\n\n  const applyPreset = (preset: 'portfolio' | 'consulting' | 'open-source') => {\n    if (preset === 'portfolio') setConfig({ ...defaultConfig, tagline: 'BUILD • SHIP • ITERATE • LEARN', available: 'Open to selected projects', milestone: 'Product-focused delivery' })\n    if (preset === 'consulting') setConfig({ ...defaultConfig, title: 'Independent Product Engineer', tagline: 'WEB APPS • AUTOMATION • AI • CLOUD', available: 'Available for consulting', milestone: 'Scoped milestones' })\n    if (preset === 'open-source') setConfig({ ...defaultConfig, title: 'Open-source Builder', tagline: 'TOOLS • LIBRARIES • COMMUNITY • AI', available: 'Open to collaboration', milestone: 'Public roadmap' })\n    hidePreview()\n  }''')
patch('src/components/dashboard/PF_CreatorSVG.tsx',
'''          <h2 className="text-lg font-semibold text-foreground dark:text-foreground">Configuration</h2>\n          <div className="mt-4 space-y-3">''',
'''          <h2 className="text-lg font-semibold text-foreground dark:text-foreground">Configuration</h2>\n          <div className="mt-3 flex flex-wrap gap-2"><Button variant="secondary" size="sm" onClick={() => applyPreset('portfolio')}>Portfolio</Button><Button variant="secondary" size="sm" onClick={() => applyPreset('consulting')}>Consulting</Button><Button variant="secondary" size="sm" onClick={() => applyPreset('open-source')}>Open source</Button></div>\n          <div className="mt-4 space-y-3">''')

# Favicon Studio: generated manifest reflects actual project identity.
patch('src/components/public/FaviconStudio.tsx',
'''  const [text, setText] = React.useState('▲')''',
'''  const [appName, setAppName] = React.useState('My App')\n  const [shortName, setShortName] = React.useState('My App')\n  const [text, setText] = React.useState('▲')''')
patch('src/components/public/FaviconStudio.tsx',
'''    name: 'My App',\n    short_name: 'My App',''',
'''    name: appName.trim() || 'My App',\n    short_name: shortName.trim() || appName.trim() || 'My App',''')
patch('src/components/public/FaviconStudio.tsx',
'''  }, null, 2), [background])''',
'''  }, null, 2), [appName, background, shortName])''')
patch('src/components/public/FaviconStudio.tsx',
'''        <div className="grid gap-4">\n          <label className="grid gap-1.5 text-sm font-medium">\n            Text or emoji''',
'''        <div className="grid gap-4">\n          <div className="grid gap-3 sm:grid-cols-2"><label className="grid gap-1.5 text-sm font-medium">App name<input value={appName} maxLength={80} onChange={(event) => setAppName(event.target.value)} className="h-11 rounded-xl border bg-background px-3 text-sm" /></label><label className="grid gap-1.5 text-sm font-medium">Short name<input value={shortName} maxLength={30} onChange={(event) => setShortName(event.target.value)} className="h-11 rounded-xl border bg-background px-3 text-sm" /></label></div>\n          <label className="grid gap-1.5 text-sm font-medium">\n            Text or emoji''')

# SVG Icons: make existing favorites and recents actually browsable.
patch('src/components/public/SvgIconsBrowser.tsx',
'''  const [size, setSize] = React.useState(28)''',
'''  const [size, setSize] = React.useState(28)\n  const [scope, setScope] = React.useState<'all' | 'favorites' | 'recent'>('all')''')
patch('src/components/public/SvgIconsBrowser.tsx',
'''    if (!needle) return icons\n    return icons.filter((icon) => icon.name.toLowerCase().includes(needle))\n  }, [icons, query])''',
'''    return icons.filter((icon) => {\n      const id = iconId(icon.pack, icon.name)\n      if (scope === 'favorites' && !favorites.includes(id)) return false\n      if (scope === 'recent' && !recents.includes(id)) return false\n      return !needle || icon.name.toLowerCase().includes(needle)\n    }).sort((a, b) => scope === 'recent' ? recents.indexOf(iconId(a.pack, a.name)) - recents.indexOf(iconId(b.pack, b.name)) : a.name.localeCompare(b.name))\n  }, [favorites, icons, query, recents, scope])''')
patch('src/components/public/SvgIconsBrowser.tsx',
'''        </div>\n      </section>\n\n      <div aria-live="polite"''',
'''        </div>\n        <div className="mt-3 flex flex-wrap gap-2">{(['all', 'favorites', 'recent'] as const).map((value) => <button key={value} type="button" onClick={() => { setScope(value); setVisible(120) }} className={`rounded-xl border px-3 py-1.5 text-xs font-medium capitalize ${scope === value ? 'bg-accent text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>{value === 'favorites' ? `Favorites (${favorites.length})` : value === 'recent' ? `Recent (${recents.length})` : 'All icons'}</button>)}</div>\n      </section>\n\n      <div aria-live="polite"''')

# Crypto Track: quick market-move lenses.
patch('src/components/dashboard/PF_CryptoTrack.tsx',
"""type ViewMode = 'list' | 'grid'""",
'''type ViewMode = 'list' | 'grid'\ntype MarketView = 'all' | 'gainers' | 'losers' ''')
patch('src/components/dashboard/PF_CryptoTrack.tsx',
'''  const [watchlistOnly, setWatchlistOnly] = React.useState(false)''',
'''  const [watchlistOnly, setWatchlistOnly] = React.useState(false)\n  const [marketView, setMarketView] = React.useState<MarketView>('all')''')
patch('src/components/dashboard/PF_CryptoTrack.tsx',
'''      if (watchlistOnly && !watchlist.has(coin.id)) return false\n      if (!needle) return true''',
'''      if (watchlistOnly && !watchlist.has(coin.id)) return false\n      if (marketView === 'gainers' && coin.change24h <= 0) return false\n      if (marketView === 'losers' && coin.change24h >= 0) return false\n      if (!needle) return true''')
patch('src/components/dashboard/PF_CryptoTrack.tsx',
'''  }, [coins, query, watchlistOnly, watchlist])''',
'''  }, [coins, marketView, query, watchlistOnly, watchlist])''')
patch('src/components/dashboard/PF_CryptoTrack.tsx',
'''          <span className="ml-1 text-xs text-muted-foreground">Sort:</span>''',
'''          <div className="flex items-center gap-1 rounded-xl border border-border p-1">{(['all', 'gainers', 'losers'] as MarketView[]).map((value) => <button key={value} type="button" onClick={() => setMarketView(value)} className={`rounded-xl px-2 py-1 text-xs font-medium capitalize ${marketView === value ? 'bg-accent text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>{value}</button>)}</div>\n          <span className="ml-1 text-xs text-muted-foreground">Sort:</span>''')
patch('src/components/dashboard/PF_CryptoTrack.tsx',
'''  }, [query, watchlistOnly, sortBy, sortDir])''',
'''  }, [marketView, query, watchlistOnly, sortBy, sortDir])''')

# Weather: refresh all saved cards + copy a concise current summary.
patch('src/components/dashboard/PF_WeatherNow.tsx',
'''  const addPresetSet = async (preset: string[]) => {''',
'''  const refreshAll = async () => {\n    if (!cities.length || loading) return\n    setLoading(true); setError('')\n    try {\n      const refreshed = await Promise.allSettled(cities.map((weather) => {\n        const latitude = Number(weather.latitude); const longitude = Number(weather.longitude)\n        return Number.isFinite(latitude) && Number.isFinite(longitude) ? requestWeatherAtCoordinates(latitude, longitude) : requestWeather(weather.location)\n      }))\n      const successful = refreshed.filter((result): result is PromiseFulfilledResult<WeatherData> => result.status === 'fulfilled').map((result) => result.value)\n      setCities(successful.length ? successful : cities)\n      if (successful.length !== cities.length) setError(`Refreshed ${successful.length} of ${cities.length} saved locations.`)\n    } finally { setLoading(false) }\n  }\n\n  const copySummary = async () => {\n    if (!sortedCities.length) return\n    const summary = sortedCities.map((weather) => `${weather.location}: ${displayTemp(weather.temp_c)}, ${weather.condition}, humidity ${weather.humidity}%, wind ${weather.wind_kph.toFixed(1)} km/h`).join('\\n')\n    try { await navigator.clipboard.writeText(summary) } catch { setError('Clipboard access was blocked by the browser.') }\n  }\n\n  const addPresetSet = async (preset: string[]) => {''')
patch('src/components/dashboard/PF_WeatherNow.tsx',
'''        {error && <div className="mt-4 rounded-xl border border-amber-500/30''',
'''        <div className="mt-3 flex flex-wrap gap-2"><Button variant="secondary" size="sm" onClick={() => void refreshAll()} disabled={!cities.length || loading}><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh all</Button><Button variant="secondary" size="sm" onClick={() => void copySummary()} disabled={!cities.length}>Copy weather summary</Button></div>\n        {error && <div className="mt-4 rounded-xl border border-amber-500/30''')

# Task List: useful display sorting without schema changes.
patch('src/components/dashboard/TaskList.tsx',
"""type Filter = 'all' | 'active' | 'completed'""",
'''type Filter = 'all' | 'active' | 'completed'\ntype SortMode = 'newest' | 'oldest' | 'active-first' ''')
patch('src/components/dashboard/TaskList.tsx',
'''  const [filter, setFilter] = React.useState<Filter>('all')''',
'''  const [filter, setFilter] = React.useState<Filter>('all')\n  const [sortMode, setSortMode] = React.useState<SortMode>('newest')''')
patch('src/components/dashboard/TaskList.tsx',
'''  const visibleTasks = tasks.filter((task) => {\n    if (filter === 'active' && task.completed) return false\n    if (filter === 'completed' && !task.completed) return false\n    return !normalizedQuery || task.title.toLowerCase().includes(normalizedQuery)\n  })''',
'''  const visibleTasks = tasks.filter((task) => {\n    if (filter === 'active' && task.completed) return false\n    if (filter === 'completed' && !task.completed) return false\n    return !normalizedQuery || task.title.toLowerCase().includes(normalizedQuery)\n  }).sort((a, b) => {\n    if (sortMode === 'active-first' && a.completed !== b.completed) return Number(a.completed) - Number(b.completed)\n    const delta = (Date.parse(b.created_at) || 0) - (Date.parse(a.created_at) || 0)\n    return sortMode === 'oldest' ? -delta : delta\n  })''')
patch('src/components/dashboard/TaskList.tsx',
'''<Button variant="ghost" size="sm" onClick={() => void clearCompleted()} disabled={!completed}><Trash2 className="h-4 w-4" /> Clear completed</Button></div></div>''',
'''<Button variant="ghost" size="sm" onClick={() => void clearCompleted()} disabled={!completed}><Trash2 className="h-4 w-4" /> Clear completed</Button><select value={sortMode} onChange={(event) => setSortMode(event.target.value as SortMode)} className="min-h-9 rounded-xl border border-input bg-background px-2 text-xs"><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="active-first">Active first</option></select></div></div>''')

# Release/docs.
for filename in ['package.json', 'package-lock.json']:
    p = Path(filename)
    text = p.read_text()
    text = text.replace('"version": "1.27.3"', '"version": "1.28.0"', 1)
    if filename == 'package-lock.json':
        text = text.replace('"version": "1.27.3"', '"version": "1.28.0"', 1)
    p.write_text(text)

changelog = Path('CHANGELOG.md')
release = '''## 1.28.0 — September 13, 2026\n\n### Fixed\n- Reverted the global 24px button/input/select cap and the related textarea, upload-target, image and output-area height overrides; shared controls are back to normal accessible sizing.\n- Admin now challenges an already-enrolled TOTP factor inline when the current session still needs AAL2 instead of sending users back to Security in a loop.\n\n### Improved\n- Changelog release cards now group their sections into compact accordions.\n- Advanced all 29 currently visible public apps: richer conversion workflows, image presets/metadata, color eyedropper/shades/contrast, QR density controls, DNS history, labeling shortcuts, background-removal presets, SVG/favicon/icon workflows, crypto market lenses, weather batch actions and Task List sorting.\n- Kept the hidden Landing Builder out of the public-app sweep.\n\n### Documentation\n- Documented the public-app improvement baseline, control-sizing rollback and admin AAL2 behavior in the docs.\n\n'''
text = changelog.read_text()
if '## 1.28.0 — September 13, 2026' not in text:
    marker = text.find('## ')
    text = text[:marker] + release + text[marker:] if marker >= 0 else release + text
    changelog.write_text(text)

app_model = Path('docs/APP_MODEL.md')
section = '''\n## Public app quality baseline (1.28)\n\nPublic apps should add workflow leverage, not just wrap one primitive operation. Prefer reversible handoffs, presets, summaries, copy/export actions, safe local history, and route-specific controls where they materially reduce steps. Shared workbenches are the preferred place to improve related apps together.\n\nDo **not** impose a global fixed/max height on native controls, previews, upload areas, textareas, images, or output regions. Shared `Button`, `Input`, `Select`, and `Textarea` own their normal accessible sizing; compactness must be local and intentional.\n'''
if '## Public app quality baseline (1.28)' not in app_model.read_text():
    app_model.write_text(app_model.read_text().rstrip() + section + '\n')

getting = Path('docs/GETTING_STARTED.md')
section = '''\n## Admin session assurance\n\nAdmin CRUD requires an AAL2 session. Having a verified authenticator enrolled does not automatically mean the current session is AAL2. When an admin session needs elevation, Admin now asks for the current authenticator code inline; Security is only needed when no verified TOTP factor exists.\n\n## Public tools\n\nThe visible public catalog currently contains 29 apps (Landing Builder remains hidden by the live app override). The 1.28 pass adds practical second-step workflows across converters, image tools, generators, DNS/QR/color utilities, weather/crypto/task tools, and creator/icon utilities without changing their public routes.\n'''
if '## Admin session assurance' not in getting.read_text():
    getting.write_text(getting.read_text().rstrip() + section + '\n')

print('public app polish patches applied')
