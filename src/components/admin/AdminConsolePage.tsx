import * as React from 'react'
import { Navigate, Link, useSearchParams } from 'react-router-dom'
import { KeyRound, Loader2, RefreshCw, ShieldCheck, Trash2, UserRound } from 'lucide-react'
import { Button, Card, Input, Tabs } from '@/components/ui'
import { useAuth } from '@/auth/AuthProvider'
import { toast } from '@/lib/toast'
import {
  adminDeleteUser,
  adminListUsers,
  adminSetRole,
  adminUpdateProfile,
  getRole,
  getSecurityState,
  verifyTotpFactor,
  type AdminUser,
} from '@/lib/account'
import { AdminContentManager } from './AdminContentManager'
import { AdminImageManager } from './AdminImageManager'
import { AdminBlogFeaturedControl } from './AdminBlogFeaturedControl'
import { AppAdminPage } from '@/components/dashboard/AppAdminPage'
import MarketingStudio from '@/components/resources/MarketingStudio'

type Section = 'users' | 'content' | 'apps' | 'marketing'
type ContentSection = 'blog' | 'landing' | 'images'

export function AdminConsolePage() {
  const { user } = useAuth()
  const [role, setRole] = React.useState<'user' | 'admin' | null>(null)
  const [aal2, setAal2] = React.useState(false)
  const [factorId, setFactorId] = React.useState('')
  const [totpCode, setTotpCode] = React.useState('')
  const [loading, setLoading] = React.useState(true)
  const [params, setParams] = useSearchParams()
  const requestedSection = params.get('section')
  const section: Section = requestedSection === 'content' || requestedSection === 'apps' || requestedSection === 'marketing' ? requestedSection : 'users'
  const requestedContentSection = params.get('contentTab')
  const contentSection: ContentSection = requestedContentSection === 'landing' || requestedContentSection === 'images' ? requestedContentSection : 'blog'
  const [users, setUsers] = React.useState<AdminUser[]>([])
  const [busy, setBusy] = React.useState('')

  const setSection = React.useCallback((value: Section) => {
    const next = new URLSearchParams(params)
    next.set('section', value)
    if (value !== 'content') next.delete('contentTab')
    setParams(next, { replace: true })
  }, [params, setParams])

  const setContentSection = React.useCallback((value: ContentSection) => {
    const next = new URLSearchParams(params)
    next.set('section', 'content')
    if (value === 'blog') next.delete('contentTab')
    else next.set('contentTab', value)
    setParams(next, { replace: true })
  }, [params, setParams])

  const fail = (error: unknown, fallback: string) => toast.error(error instanceof Error ? error.message : fallback)

  const refreshAccess = React.useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const [nextRole, security] = await Promise.all([getRole(user.id), getSecurityState()])
      setRole(nextRole)
      setAal2(security.currentLevel === 'aal2')
      setFactorId(security.totp.find((factor) => factor.status === 'verified')?.id || '')
    } catch (accessError) { fail(accessError, 'Could not verify admin access.') }
    finally { setLoading(false) }
  }, [user])

  const refreshUsers = React.useCallback(async () => {
    setBusy('users')
    try { setUsers(await adminListUsers()) }
    catch (usersError) { fail(usersError, 'Could not load users.') }
    finally { setBusy('') }
  }, [])

  const verifyAdminSession = async () => {
    if (!factorId || !totpCode.trim()) return
    setBusy('totp')
    try {
      await verifyTotpFactor(factorId, totpCode)
      setTotpCode('')
      await refreshAccess()
      toast.success('Admin session verified.')
    } catch (verifyError) { fail(verifyError, 'TOTP verification failed.') }
    finally { setBusy('') }
  }

  React.useEffect(() => { void refreshAccess() }, [refreshAccess])
  React.useEffect(() => { if (role === 'admin' && aal2 && section === 'users') void refreshUsers() }, [aal2, refreshUsers, role, section])

  if (!user) return <Navigate to="/login" replace />
  if (loading) return <div className="flex min-h-[40vh] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>
  if (role !== 'admin') return <Card className="p-8 text-center"><ShieldCheck className="mx-auto h-8 w-8 text-muted-foreground" /><h1 className="mt-4 text-lg font-semibold">Admin only</h1><Link to="/settings" className="mt-4 inline-flex cursor-pointer text-sm underline">Back to Settings</Link></Card>
  if (!aal2) return <Card className="mx-auto max-w-lg p-4"><div className="flex items-start gap-4"><KeyRound className="mt-2 h-4 w-4 text-muted-foreground" /><div><h1 className="text-lg font-semibold">Verify this admin session</h1><p className="mt-2 text-sm text-muted-foreground">Enter the current authenticator code to elevate this session to AAL2.</p></div></div>{factorId ? <div className="mt-4 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end"><Input label="Authenticator code" value={totpCode} inputMode="numeric" autoComplete="one-time-code" onChange={(event) => setTotpCode(event.target.value.replace(/\D/g, '').slice(0, 8))} onKeyDown={(event) => { if (event.key === 'Enter') void verifyAdminSession() }} placeholder="123456" /><Button onClick={() => void verifyAdminSession()} disabled={busy === 'totp' || totpCode.length < 6}>{busy === 'totp' ? <Loader2 className="animate-spin" /> : <ShieldCheck />} Verify & open Admin</Button></div> : <div className="mt-4 rounded-xl border border-border/70 p-4 text-sm text-muted-foreground">No verified TOTP factor is available. <Link to="/settings?tab=security" className="cursor-pointer font-medium text-foreground underline">Set up an authenticator in Security</Link>.</div>}</Card>

  return (
    <div className="w-full space-y-4 pb-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><h1 className="text-lg font-semibold tracking-tight">Admin</h1><p className="mt-2 text-sm text-muted-foreground">Users, content, app presentation and internal marketing tools.</p></div><Link to="/settings" className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">Back to Settings</Link></div>
      <Tabs tabs={[{ id: 'users', label: 'Users' }, { id: 'content', label: 'Content' }, { id: 'apps', label: 'Apps' }, { id: 'marketing', label: 'Marketing Studio' }]} active={section} onChange={(id) => setSection(id as Section)} ariaLabel="Admin sections" />

      {section === 'users' && <div className="space-y-4"><div className="flex items-center justify-between"><h2 className="text-sm font-semibold">Users</h2><Button variant="secondary" size="sm" onClick={() => void refreshUsers()} disabled={busy === 'users'}><RefreshCw className={busy === 'users' ? 'animate-spin' : ''} /> Refresh</Button></div>{users.map((item) => <Card key={item.id} className="p-4"><div className="flex flex-col gap-4 lg:flex-row lg:items-center"><div className="flex min-w-0 flex-1 items-center gap-4"><div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border/70 bg-muted">{item.avatar_url ? <img src={item.avatar_url} alt="" className="h-full w-full object-cover" /> : <UserRound className="h-4 w-4" />}</div><div className="min-w-0"><div className="truncate text-sm font-medium">{item.display_name || item.email || item.id}</div><div className="truncate text-sm text-muted-foreground">{item.email}</div></div></div><div className="flex flex-wrap items-center gap-2"><select value={item.role} onChange={async (event) => { const nextRole = event.target.value as 'user' | 'admin'; try { await adminSetRole(item.id, nextRole); setUsers((rows) => rows.map((row) => row.id === item.id ? { ...row, role: nextRole } : row)); toast.success('Role updated.') } catch (roleError) { fail(roleError, 'Role update failed.') } }} className="min-h-9 cursor-pointer rounded-xl border border-input bg-background/55 px-2 text-sm"><option value="user">user</option><option value="admin">admin</option></select><Button variant="secondary" size="sm" onClick={async () => { try { await adminUpdateProfile(item.id, { display_name: item.display_name, username: item.username, is_public: !item.is_public }); setUsers((rows) => rows.map((row) => row.id === item.id ? { ...row, is_public: !row.is_public } : row)); toast.success('Visibility updated.') } catch (profileError) { fail(profileError, 'Update failed.') } }}>{item.is_public ? 'Public' : 'Private'}</Button>{item.id !== user.id && <Button variant="ghost" size="sm" onClick={async () => { if (!confirm(`Delete ${item.email || 'this user'}?`)) return; try { await adminDeleteUser(item.id); setUsers((rows) => rows.filter((row) => row.id !== item.id)); toast.success('User deleted.') } catch (deleteError) { fail(deleteError, 'Delete failed.') } }}><Trash2 /></Button>}</div></div></Card>)}</div>}

      {section === 'content' && <div className="space-y-4"><Tabs tabs={[{ id: 'blog', label: 'Blog' }, { id: 'landing', label: 'Landing' }, { id: 'images', label: 'Images' }]} active={contentSection} onChange={(id) => setContentSection(id as ContentSection)} ariaLabel="Content sections" />{contentSection === 'blog' && <div className="space-y-4"><AdminBlogFeaturedControl /><AdminContentManager embedded adminVerified contentType="blog_article" /></div>}{contentSection === 'landing' && <AdminContentManager embedded adminVerified contentType="video_teaser" />}{contentSection === 'images' && <AdminImageManager />}</div>}
      {section === 'apps' && <AppAdminPage />}
      {section === 'marketing' && <MarketingStudio />}
    </div>
  )
}
