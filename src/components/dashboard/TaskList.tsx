import React from 'react'
import { Check, CheckCircle2, Circle, ClipboardList, ListTodo, Pencil, Plus, RefreshCw, Search, Trash2, X } from 'lucide-react'
import { Badge, Button, Card, Input } from '@/components/ui'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/auth/AuthProvider'

type Task = {
  id: string
  title: string
  completed: boolean
  created_at: string
  updated_at: string
}

type Filter = 'all' | 'active' | 'completed'

const STORAGE_KEY = 'appforge-task-list-v1'
const DELETED_KEY = 'appforge-task-list-deleted-v1'
const MAX_TASKS = 5000
const MAX_TITLE = 500
const now = () => new Date().toISOString()
const taskStorageKey = (userId?: string) => `${STORAGE_KEY}:${userId || 'anonymous'}`
const deletedStorageKey = (userId: string) => `${DELETED_KEY}:${userId}`

const normalizeTask = (item: unknown): Task | null => {
  if (!item || typeof item !== 'object') return null
  const row = item as Partial<Task>
  if (typeof row.id !== 'string' || typeof row.title !== 'string') return null
  const created = typeof row.created_at === 'string' ? row.created_at : now()
  const updated = typeof row.updated_at === 'string' ? row.updated_at : created
  return { id: row.id, title: row.title.slice(0, MAX_TITLE), completed: Boolean(row.completed), created_at: created, updated_at: updated }
}

const loadLocal = (userId?: string): Task[] => {
  try {
    const parsed = JSON.parse(localStorage.getItem(taskStorageKey(userId)) || '[]')
    if (Array.isArray(parsed)) return parsed.slice(0, MAX_TASKS).map(normalizeTask).filter((item): item is Task => Boolean(item))
  } catch { /* ignore malformed local state */ }
  return []
}

const saveLocal = (userId: string | undefined, tasks: Task[]) => localStorage.setItem(taskStorageKey(userId), JSON.stringify(tasks.slice(0, MAX_TASKS)))
const loadDeleted = (userId: string) => {
  try {
    const parsed = JSON.parse(localStorage.getItem(deletedStorageKey(userId)) || '[]')
    return new Set(Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string').slice(0, MAX_TASKS) : [])
  } catch { return new Set<string>() }
}
const saveDeleted = (userId: string, ids: Set<string>) => localStorage.setItem(deletedStorageKey(userId), JSON.stringify(Array.from(ids).slice(0, MAX_TASKS)))
const newerTask = (a: Task, b: Task) => {
  const aTime = Date.parse(a.updated_at) || 0
  const bTime = Date.parse(b.updated_at) || 0
  return bTime > aTime ? b : a
}

export function TaskList() {
  const { user } = useAuth()
  const userId = user?.id
  const [tasks, setTasks] = React.useState<Task[]>(() => loadLocal(userId))
  const [title, setTitle] = React.useState('')
  const [query, setQuery] = React.useState('')
  const [filter, setFilter] = React.useState<Filter>('all')
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [editingTitle, setEditingTitle] = React.useState('')
  const [syncing, setSyncing] = React.useState(false)
  const [error, setError] = React.useState('')
  const [remoteReady, setRemoteReady] = React.useState(false)
  const storageOwnerRef = React.useRef(userId)
  const skipNextSaveRef = React.useRef(false)
  const syncGenerationRef = React.useRef(0)
  const currentUserRef = React.useRef(userId)

  React.useEffect(() => {
    currentUserRef.current = userId
    if (storageOwnerRef.current === userId) return
    storageOwnerRef.current = userId
    skipNextSaveRef.current = true
    syncGenerationRef.current += 1
    setRemoteReady(false)
    setEditingId(null)
    setEditingTitle('')
    setTasks(loadLocal(userId))
  }, [userId])

  React.useEffect(() => {
    if (skipNextSaveRef.current) { skipNextSaveRef.current = false; return }
    if (storageOwnerRef.current !== userId) return
    try { saveLocal(userId, tasks) }
    catch { setError('Browser storage is full. Remove old tasks or free browser storage before relying on local-only changes.') }
  }, [tasks, userId])

  const syncFromRemote = React.useCallback(async () => {
    if (!userId) { setRemoteReady(false); return }
    const generation = ++syncGenerationRef.current
    const syncUserId = userId
    setSyncing(true)
    setError('')
    try {
      const { data, error: readError } = await supabase
        .from('appforge_tasks')
        .select('id,title,completed,created_at,updated_at')
        .eq('user_id', syncUserId)
        .order('created_at', { ascending: false })
      if (readError) throw readError
      if (generation !== syncGenerationRef.current || currentUserRef.current !== syncUserId) return

      const deleted = loadDeleted(syncUserId)
      const remote = ((data || []) as unknown[]).map(normalizeTask).filter((item): item is Task => Boolean(item) && !deleted.has(item.id))
      const local = loadLocal(syncUserId).filter((task) => !deleted.has(task.id))
      const mergedMap = new Map<string, Task>()
      remote.forEach((task) => mergedMap.set(task.id, task))
      local.forEach((task) => mergedMap.set(task.id, mergedMap.has(task.id) ? newerTask(mergedMap.get(task.id)!, task) : task))
      const merged = Array.from(mergedMap.values()).sort((a, b) => (Date.parse(b.created_at) || 0) - (Date.parse(a.created_at) || 0)).slice(0, MAX_TASKS)

      if (deleted.size) {
        const ids = Array.from(deleted)
        const { error: deleteError } = await supabase.from('appforge_tasks').delete().eq('user_id', syncUserId).in('id', ids)
        if (deleteError) throw deleteError
        saveDeleted(syncUserId, new Set())
      }
      if (merged.length) {
        const { error: seedError } = await supabase.from('appforge_tasks').upsert(merged.map((task) => ({ ...task, user_id: syncUserId })))
        if (seedError) throw seedError
      }
      if (generation !== syncGenerationRef.current || currentUserRef.current !== syncUserId) return
      setTasks(merged)
      setRemoteReady(true)
    } catch (cause) {
      if (generation !== syncGenerationRef.current || currentUserRef.current !== syncUserId) return
      setError(cause instanceof Error ? cause.message : 'Remote task sync is unavailable; local tasks are still safe.')
      setRemoteReady(false)
    } finally {
      if (generation === syncGenerationRef.current && currentUserRef.current === syncUserId) setSyncing(false)
    }
  }, [userId])

  React.useEffect(() => { void syncFromRemote() }, [syncFromRemote])

  const persist = async (task: Task) => {
    if (!userId || !remoteReady) return
    const { error: writeError } = await supabase.from('appforge_tasks').upsert({ ...task, user_id: userId })
    if (writeError) setError(writeError.message)
  }

  const addTask = () => {
    const clean = title.trim().slice(0, MAX_TITLE)
    if (!clean) return
    if (tasks.length >= MAX_TASKS) { setError(`Task List supports up to ${MAX_TASKS} local tasks per account.`); return }
    const timestamp = now()
    const task: Task = { id: crypto.randomUUID(), title: clean, completed: false, created_at: timestamp, updated_at: timestamp }
    setTasks((current) => [task, ...current])
    setTitle('')
    void persist(task)
  }

  const toggle = (task: Task) => {
    const next = { ...task, completed: !task.completed, updated_at: now() }
    setTasks((current) => current.map((item) => item.id === task.id ? next : item))
    void persist(next)
  }

  const beginEdit = (task: Task) => { setEditingId(task.id); setEditingTitle(task.title) }

  const saveEdit = (task: Task) => {
    const clean = editingTitle.trim().slice(0, MAX_TITLE)
    if (!clean) return
    const next = { ...task, title: clean, updated_at: now() }
    setTasks((current) => current.map((item) => item.id === task.id ? next : item))
    setEditingId(null)
    setEditingTitle('')
    void persist(next)
  }

  const completeAll = async () => {
    const timestamp = now()
    const changed = tasks.filter((task) => !task.completed).map((task) => ({ ...task, completed: true, updated_at: timestamp }))
    if (!changed.length) return
    const changedIds = new Set(changed.map((task) => task.id))
    setTasks((current) => current.map((task) => changedIds.has(task.id) ? { ...task, completed: true, updated_at: timestamp } : task))
    if (!userId || !remoteReady) return
    const { error: writeError } = await supabase.from('appforge_tasks').upsert(changed.map((task) => ({ ...task, user_id: userId })))
    if (writeError) setError(writeError.message)
  }

  const rememberDeleted = (ids: string[]) => {
    if (!userId || !ids.length) return
    try {
      const deleted = loadDeleted(userId)
      ids.forEach((id) => deleted.add(id))
      saveDeleted(userId, deleted)
    } catch { setError('Could not record local deletions. Sync again before closing the app.') }
  }

  const remove = async (task: Task) => {
    setTasks((current) => current.filter((item) => item.id !== task.id))
    rememberDeleted([task.id])
    if (editingId === task.id) { setEditingId(null); setEditingTitle('') }
    if (!userId || !remoteReady) return
    const { error: deleteError } = await supabase.from('appforge_tasks').delete().eq('id', task.id).eq('user_id', userId)
    if (deleteError) setError(deleteError.message)
    else {
      const deleted = loadDeleted(userId); deleted.delete(task.id); saveDeleted(userId, deleted)
    }
  }

  const clearCompleted = async () => {
    const completedIds = tasks.filter((task) => task.completed).map((task) => task.id)
    if (!completedIds.length) return
    setTasks((current) => current.filter((task) => !task.completed))
    rememberDeleted(completedIds)
    if (!userId || !remoteReady) return
    const { error: deleteError } = await supabase.from('appforge_tasks').delete().eq('user_id', userId).in('id', completedIds)
    if (deleteError) setError(deleteError.message)
    else {
      const deleted = loadDeleted(userId); completedIds.forEach((id) => deleted.delete(id)); saveDeleted(userId, deleted)
    }
  }

  const completed = tasks.filter((task) => task.completed).length
  const active = tasks.length - completed
  const progress = tasks.length ? Math.round((completed / tasks.length) * 100) : 0
  const normalizedQuery = query.trim().toLowerCase()
  const visibleTasks = tasks.filter((task) => {
    if (filter === 'active' && task.completed) return false
    if (filter === 'completed' && !task.completed) return false
    return !normalizedQuery || task.title.toLowerCase().includes(normalizedQuery)
  })

  return (
    <div className="w-full space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h1 className="flex items-center gap-2 text-2xl font-bold"><ListTodo className="h-6 w-6" /> Task List</h1><Badge color="green">PWA ready</Badge></div><p className="mt-1 max-w-3xl text-sm text-muted-foreground">Local-first TODO tracking with authenticated Supabase sync, inline editing, progress actions, filtering, search, and completed-task cleanup.</p></div>
        <Button variant="secondary" onClick={() => void syncFromRemote()} disabled={!user || syncing} className="self-start sm:self-auto"><RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} /> Sync</Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3"><Card className="p-4"><div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Active</div><div className="mt-1 text-2xl font-semibold text-foreground">{active}</div></Card><Card className="p-4"><div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Completed</div><div className="mt-1 text-2xl font-semibold text-foreground">{completed}</div></Card><Card className="p-4"><div className="flex items-center justify-between gap-3"><div><div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Progress</div><div className="mt-1 text-2xl font-semibold text-foreground">{progress}%</div></div><div className="text-xs text-muted-foreground">{remoteReady ? 'Cloud ready' : user ? syncing ? 'Syncing' : 'Local fallback' : 'Local-only'}</div></div><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-foreground/70 transition-[width]" style={{ width: `${progress}%` }} /></div></Card></div>

      <Card className="p-4 sm:p-5">
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end"><div><label className="mb-1.5 block text-xs font-medium text-muted-foreground">New task</label><Input value={title} maxLength={MAX_TITLE} onChange={(event) => setTitle(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') addTask() }} placeholder="Add the next concrete task…" aria-label="New task" /></div><Button onClick={addTask} disabled={!title.trim()} className="w-full sm:w-auto"><Plus className="h-4 w-4" /> Add task</Button></div>
        {error && <div className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-300">{error}</div>}
        <div className="mt-4 grid gap-3 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center"><label className="relative block"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search tasks…" className="pl-9" aria-label="Search tasks" /></label><div className="flex flex-wrap items-center gap-2">{(['all', 'active', 'completed'] as Filter[]).map((value) => <button key={value} type="button" onClick={() => setFilter(value)} className={`rounded-lg border px-3 py-2 text-xs font-medium capitalize transition-colors ${filter === value ? 'bg-accent text-foreground' : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground'}`}>{value}</button>)}<Button variant="ghost" size="sm" onClick={() => void completeAll()} disabled={!active}><Check className="h-4 w-4" /> Complete all</Button><Button variant="ghost" size="sm" onClick={() => void clearCompleted()} disabled={!completed}><Trash2 className="h-4 w-4" /> Clear completed</Button></div></div>
        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground"><span>{active} active</span><span>·</span><span>{completed} completed</span><span>·</span><span>{tasks.length} total</span><span>·</span><span>{visibleTasks.length} shown</span></div>
      </Card>

      <div className="space-y-2">
        {visibleTasks.map((task) => <Card key={task.id} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 p-3 sm:p-4"><button type="button" onClick={() => toggle(task)} className="shrink-0 rounded-full p-1 text-muted-foreground hover:text-foreground" aria-label={task.completed ? `Mark ${task.title} active` : `Complete ${task.title}`}>{task.completed ? <CheckCircle2 className="h-5 w-5" /> : <Circle className="h-5 w-5" />}</button>{editingId === task.id ? <Input autoFocus maxLength={MAX_TITLE} value={editingTitle} onChange={(event) => setEditingTitle(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') saveEdit(task); if (event.key === 'Escape') { setEditingId(null); setEditingTitle('') } }} aria-label={`Edit ${task.title}`} /> : <button type="button" onClick={() => toggle(task)} className={`min-w-0 break-words text-left text-sm leading-5 ${task.completed ? 'text-muted-foreground line-through' : 'text-foreground'}`}>{task.title}</button>}<div className="flex items-center gap-1">{editingId === task.id ? <><Button variant="ghost" size="sm" onClick={() => saveEdit(task)} disabled={!editingTitle.trim()} title="Save task"><Check className="h-4 w-4" /></Button><Button variant="ghost" size="sm" onClick={() => { setEditingId(null); setEditingTitle('') }} title="Cancel editing"><X className="h-4 w-4" /></Button></> : <Button variant="ghost" size="sm" onClick={() => beginEdit(task)} title="Edit task"><Pencil className="h-4 w-4" /></Button>}<Button variant="ghost" size="sm" onClick={() => void remove(task)} title="Delete task"><Trash2 className="h-4 w-4" /></Button></div></Card>)}
        {!visibleTasks.length && <Card className="flex flex-col items-center justify-center py-12 text-center"><ClipboardList className="h-8 w-8 text-muted-foreground" /><div className="mt-3 text-sm font-medium">{tasks.length ? 'No tasks match this view' : 'No tasks yet'}</div><div className="mt-1 text-xs text-muted-foreground">{tasks.length ? 'Change the filter or search text.' : 'Add your next task to get started.'}</div></Card>}
      </div>
    </div>
  )
}
