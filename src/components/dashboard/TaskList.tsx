import React from 'react'
import { CheckCircle2, Circle, ClipboardList, ListTodo, Plus, RefreshCw, Search, Trash2 } from 'lucide-react'
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
const now = () => new Date().toISOString()

const loadLocal = (): Task[] => {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    if (Array.isArray(parsed)) return parsed.filter((item) => item && typeof item.id === 'string' && typeof item.title === 'string')
  } catch { /* ignore malformed legacy state */ }
  return []
}

const saveLocal = (tasks: Task[]) => localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))

export function TaskList() {
  const { user } = useAuth()
  const [tasks, setTasks] = React.useState<Task[]>(loadLocal)
  const [title, setTitle] = React.useState('')
  const [query, setQuery] = React.useState('')
  const [filter, setFilter] = React.useState<Filter>('all')
  const [syncing, setSyncing] = React.useState(false)
  const [error, setError] = React.useState('')
  const [remoteReady, setRemoteReady] = React.useState(false)

  React.useEffect(() => { saveLocal(tasks) }, [tasks])

  const syncFromRemote = React.useCallback(async () => {
    if (!user) { setRemoteReady(false); return }
    setSyncing(true)
    setError('')
    try {
      const { data, error: readError } = await supabase
        .from('appforge_tasks')
        .select('id,title,completed,created_at,updated_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      if (readError) throw readError
      const remote = (data || []) as Task[]
      if (remote.length) setTasks(remote)
      else if (tasks.length) {
        const { error: seedError } = await supabase.from('appforge_tasks').upsert(tasks.map((task) => ({ ...task, user_id: user.id })))
        if (seedError) throw seedError
      }
      setRemoteReady(true)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Remote task sync is unavailable; local tasks are still safe.')
      setRemoteReady(false)
    } finally { setSyncing(false) }
  }, [user?.id])

  React.useEffect(() => { void syncFromRemote() }, [syncFromRemote])

  const persist = async (task: Task) => {
    if (!user || !remoteReady) return
    const { error: writeError } = await supabase.from('appforge_tasks').upsert({ ...task, user_id: user.id })
    if (writeError) setError(writeError.message)
  }

  const addTask = () => {
    const clean = title.trim()
    if (!clean) return
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

  const remove = async (task: Task) => {
    setTasks((current) => current.filter((item) => item.id !== task.id))
    if (!user || !remoteReady) return
    const { error: deleteError } = await supabase.from('appforge_tasks').delete().eq('id', task.id).eq('user_id', user.id)
    if (deleteError) setError(deleteError.message)
  }

  const clearCompleted = async () => {
    const completedIds = tasks.filter((task) => task.completed).map((task) => task.id)
    if (!completedIds.length) return
    setTasks((current) => current.filter((task) => !task.completed))
    if (!user || !remoteReady) return
    const { error: deleteError } = await supabase.from('appforge_tasks').delete().eq('user_id', user.id).in('id', completedIds)
    if (deleteError) setError(deleteError.message)
  }

  const completed = tasks.filter((task) => task.completed).length
  const active = tasks.length - completed
  const normalizedQuery = query.trim().toLowerCase()
  const visibleTasks = tasks.filter((task) => {
    if (filter === 'active' && task.completed) return false
    if (filter === 'completed' && !task.completed) return false
    return !normalizedQuery || task.title.toLowerCase().includes(normalizedQuery)
  })

  return (
    <div className="mx-auto w-full max-w-5xl space-y-5 px-1 sm:px-2">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2"><h1 className="flex items-center gap-2 text-2xl font-bold"><ListTodo className="h-6 w-6" /> Task List</h1><Badge color="green">PWA ready</Badge></div>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">Local-first TODO tracking with authenticated Supabase sync, quick filtering, search, and completed-task cleanup.</p>
        </div>
        <Button variant="secondary" onClick={() => void syncFromRemote()} disabled={!user || syncing} className="self-start sm:self-auto"><RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} /> Sync</Button>
      </div>

      <Card className="p-4 sm:p-5">
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
          <div><label className="mb-1.5 block text-xs font-medium text-muted-foreground">New task</label><Input value={title} onChange={(event) => setTitle(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') addTask() }} placeholder="Add the next concrete task…" aria-label="New task" /></div>
          <Button onClick={addTask} disabled={!title.trim()} className="w-full sm:w-auto"><Plus className="h-4 w-4" /> Add task</Button>
        </div>
        {error && <div className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-300">{error}</div>}
        <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <label className="relative block"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search tasks…" className="pl-9" aria-label="Search tasks" /></label>
          <div className="flex flex-wrap items-center gap-2">
            {(['all', 'active', 'completed'] as Filter[]).map((value) => <button key={value} type="button" onClick={() => setFilter(value)} className={`rounded-lg border px-3 py-2 text-xs font-medium capitalize transition-colors ${filter === value ? 'bg-accent text-foreground' : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground'}`}>{value}</button>)}
            <Button variant="ghost" size="sm" onClick={() => void clearCompleted()} disabled={!completed}><Trash2 className="h-4 w-4" /> Clear completed</Button>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground"><span>{active} active</span><span>·</span><span>{completed} completed</span><span>·</span><span>{tasks.length} total</span><span>·</span><span>{remoteReady ? 'cloud sync ready' : 'local-first'}</span></div>
      </Card>

      <div className="space-y-2">
        {visibleTasks.map((task) => (
          <Card key={task.id} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 p-3 sm:p-4">
            <button type="button" onClick={() => toggle(task)} className="shrink-0 rounded-full p-1 text-muted-foreground hover:text-foreground" aria-label={task.completed ? `Mark ${task.title} active` : `Complete ${task.title}`}>{task.completed ? <CheckCircle2 className="h-5 w-5" /> : <Circle className="h-5 w-5" />}</button>
            <button type="button" onClick={() => toggle(task)} className={`min-w-0 break-words text-left text-sm leading-5 ${task.completed ? 'text-muted-foreground line-through' : 'text-foreground'}`}>{task.title}</button>
            <Button variant="ghost" size="sm" onClick={() => void remove(task)} title="Delete task"><Trash2 className="h-4 w-4" /></Button>
          </Card>
        ))}
        {!visibleTasks.length && <Card className="flex flex-col items-center justify-center py-12 text-center"><ClipboardList className="h-8 w-8 text-muted-foreground" /><div className="mt-3 text-sm font-medium">{tasks.length ? 'No tasks match this view' : 'No tasks yet'}</div><div className="mt-1 text-xs text-muted-foreground">{tasks.length ? 'Change the filter or search text.' : 'Add the next concrete thing that moves AppForge forward.'}</div></Card>}
      </div>
    </div>
  )
}
