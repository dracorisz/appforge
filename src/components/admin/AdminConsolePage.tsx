import * as React from 'react'
import { Navigate, Link } from 'react-router-dom'
import { KeyRound, Loader2, RefreshCw, ShieldCheck, Trash2, UserRound } from 'lucide-react'
import { Badge, Button, Card } from '@/components/ui'
import { useAuth } from '@/auth/AuthProvider'
import {
  adminDeleteUser,
  adminListUsers,
  adminSetRole,
  adminUpdateProfile,
  getRole,
  getSecurityState,
  type AdminUser,
} from '@/lib/account'
import { AdminContentManager } from './AdminContentManager'
import { AppAdminPage } from '@/components/dashboard/AppAdminPage'
import MarketingStudio from '@/components/resources/MarketingStudio'

type Section = 'users' | 'content' | 'apps' | 'marketing'

export function AdminConsolePage() {
  const { user } = useAuth()
  const [role, setRole] = React.useState<'user' | 'admin' | null>(null)
  const [aal2, setAal2] = React.useState(false)
  const [loading, setLoading] = React.useState(true)
  const [section, setSection] = React.useState<Section>('users')
  const [users, setUsers] = React.useState<AdminUser[]>([])
  const [busy, setBusy] = React.useState('')
  const [error, setError] = React.useState('')
  const [message, setMessage] = React.useState('')

  const refreshAccess = React.useCallback(async () => {
    if (!user) return
    setLoading(true)
    setError('')
    try {
      const [nextRole, security] = await Promise.all([getRole(user.id), getSecurityState()])
      setRole(nextRole)
      setAal2(security.currentLevel === 'aal2')
    } catch (accessError) { setError(accessError instanceof Error ? accessError.message : 'Could not verify admin access.') }
    finally { setLoading(false) }
  }, [user])

  const refreshUsers = React.useCallback(async () => {
    setBusy('users')
    try { setUsers(await adminListUsers()) }
    catch (usersError) { setError(usersError instanceof Error ? usersError.message : 'Could not load users.') }
    finally { setBusy('') }
  }, [])

  React.useEffect(() => { void refreshAccess() }, [refreshAccess])
  React.useEffect(() => { if (role === 'admin' && aal2 && section === 'users') void refreshUsers() }, [aal2, refreshUsers, role, section])

  const flash = (text: string) => { setMessage(text); window.setTimeout(() => setMessage(''), 1800) }

  if (!user) return <Navigate to="/login" replace />
  if (loading) return <div className="flex min-h-[40vh] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>
  if (role !== 'admin') return <Card className="p-6 text-center"><ShieldCheck className="mx-auto h-7 w-7 text-muted-foreground" /><h1 className="mt-3 text-lg font-semibold">Admin only</h1><Link to="/settings" className="mt-4 inline-flex text-sm underline">Back to Settings</Link></Card>
  if (!aal2) return <Card className="p-6 text-center"><KeyRound className="mx-auto h-7 w-7 text-muted-foreground" /><h1 className="mt-3 text-lg font-semibold">TOTP verification required</h1><p className="mt-2 text-sm text-muted-foreground">Verify this session in Settings → Security.</p><Link to="/settings" className="mt-4 inline-flex text-sm underline">Open Settings</Link></Card>

  return (
    <div className="w-full space-y-5 pb-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><div className="flex items-center gap-2"><Badge color="green">Admin</Badge><Badge color="blue">AAL2</Badge></div><h1 className="mt-2 text-2xl font-semibold tracking-tight">Admin</h1><p className="mt-1 text-sm text-muted-foreground">Users, content, app presentation and internal marketing tools.</p></div><Link to="/settings" className="text-sm text-muted-foreground hover:text-foreground">Back to Settings</Link></div>

      <div className="flex flex-wrap gap-1 border-b border-border/70 pb-2">{(['users','content','apps','marketing'] as Section[]).map((id) => <button key={id} onClick={() => setSection(id)} className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize ${section === id ? 'bg-accent text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>{id}</button>)}</div>
      {message && <Card className="border-emerald-500/25 bg-emerald-500/5 p-3 text-sm text-emerald-600 dark:text-emerald-400">{message}</Card>}
      {error && <Card className="border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error}</Card>}

      {section === 'users' && <div className="space-y-3"><div className="flex items-center justify-between"><h2 className="text-sm font-semibold">Users</h2><Button variant="secondary" size="sm" onClick={() => void refreshUsers()} disabled={busy === 'users'}><RefreshCw className={`h-4 w-4 ${busy === 'users' ? 'animate-spin' : ''}`} /> Refresh</Button></div>{users.map((item) => <Card key={item.id} className="p-3"><div className="flex flex-col gap-3 lg:flex-row lg:items-center"><div className="flex min-w-0 flex-1 items-center gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border/70 bg-muted">{item.avatar_url ? <img src={item.avatar_url} alt="" className="h-full w-full object-cover" /> : <UserRound className="h-4 w-4" />}</div><div className="min-w-0"><div className="truncate text-sm font-medium">{item.display_name || item.email || item.id}</div><div className="truncate text-xs text-muted-foreground">{item.email}</div></div></div><div className="flex flex-wrap items-center gap-2"><select value={item.role} onChange={async (event) => { const nextRole = event.target.value as 'user' | 'admin'; try { await adminSetRole(item.id, nextRole); setUsers((rows) => rows.map((row) => row.id === item.id ? { ...row, role: nextRole } : row)); flash('Role updated.') } catch (roleError) { setError(roleError instanceof Error ? roleError.message : 'Role update failed.') } }} className="h-9 rounded-lg border border-input bg-background/55 px-2 text-xs"><option value="user">user</option><option value="admin">admin</option></select><button onClick={async () => { try { await adminUpdateProfile(item.id, { display_name: item.display_name, username: item.username, is_public: !item.is_public }); setUsers((rows) => rows.map((row) => row.id === item.id ? { ...row, is_public: !row.is_public } : row)); flash('Visibility updated.') } catch (profileError) { setError(profileError instanceof Error ? profileError.message : 'Update failed.') } }} className="rounded-lg border border-border/70 px-2.5 py-2 text-xs hover:bg-accent">{item.is_public ? 'Public' : 'Private'}</button>{item.id !== user.id && <Button variant="ghost" size="sm" onClick={async () => { if (!confirm(`Delete ${item.email || 'this user'}?`)) return; try { await adminDeleteUser(item.id); setUsers((rows) => rows.filter((row) => row.id !== item.id)); flash('User deleted.') } catch (deleteError) { setError(deleteError instanceof Error ? deleteError.message : 'Delete failed.') } }}><Trash2 className="h-4 w-4" /></Button>}</div></div></Card>)}</div>}
      {section === 'content' && <AdminContentManager embedded adminVerified />}
      {section === 'apps' && <AppAdminPage />}
      {section === 'marketing' && <MarketingStudio />}
    </div>
  )
}
