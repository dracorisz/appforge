import React from 'react'
import { CheckCircle2, Circle, ClipboardList, ListTodo, Plus, RefreshCw, Trash2 } from 'lucide-react'
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

  const completed = tasks.filter((task) => task.completed).length
  const active = tasks.length - completed

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2"><h1 className="flex items-center gap-2 text-2xl font-bold"><ListTodo className="h-6 w-6" /> Task List</h1><Badge color="green">75% PWA candidate</Badge></div>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">Local-first TODO tracking with authenticated Supabase sync. The core remains usable without server-only dependencies, making it a strong standalone PWA candidate.</p>
        </div>
        <Button variant="secondary" onClick={() => void syncFromRemote()} disabled={!user || syncing}><RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} /> Sync</Button>
      </div>

      <Card>
        <div className="flex gap-2"><Input value={title} onChange={(event) => setTitle(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') addTask() }} placeholder="Add a task…" aria-label="New task" /><Button onClick={addTask} disabled={!title.trim()}><Plus className="h-4 w-4" /> Add</Button></div>
        {error && <div className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-300">{error}</div>}
        <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground"><span>{active} active</span><span>·</span><span>{completed} completed</span><span>·</span><span>{remoteReady ? 'cloud sync ready' : 'local-first'}</span></div>
      </Card>

      <div className="space-y-2">
        {tasks.map((task) => (
          <Card key={task.id} className="flex items-center gap-3 p-3">
            <button type="button" onClick={() => toggle(task)} className="shrink-0 rounded-full p-1 text-muted-foreground hover:text-foreground" aria-label={task.completed ? `Mark ${task.title} active` : `Complete ${task.title}`}>{task.completed ? <CheckCircle2 className="h-5 w-5" /> : <Circle className="h-5 w-5" />}</button>
            <button type="button" onClick={() => toggle(task)} className={`min-w-0 flex-1 text-left text-sm ${task.completed ? 'text-muted-foreground line-through' : 'text-foreground'}`}>{task.title}</button>
            <Button variant="ghost" size="sm" onClick={() => void remove(task)} title="Delete task"><Trash2 className="h-4 w-4" /></Button>
          </Card>
        ))}
        {!tasks.length && <Card className="flex flex-col items-center justify-center py-12 text-center"><ClipboardList className="h-8 w-8 text-muted-foreground" /><div className="mt-3 text-sm font-medium">No tasks yet</div><div className="mt-1 text-xs text-muted-foreground">Add the next concrete thing that moves AppForge forward.</div></Card>}
      </div>
    </div>
  )
}
