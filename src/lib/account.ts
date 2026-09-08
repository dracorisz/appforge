import type { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

export interface AppProfile {
  id: string
  username: string | null
  display_name: string | null
  avatar_url: string | null
  bio: string | null
  website: string | null
  location: string | null
  is_public: boolean
  created_at: string
  updated_at: string
}

export interface UserImage {
  id: string
  owner_id: string
  title: string | null
  source_url: string | null
  storage_path: string | null
  mime_type: string | null
  width: number | null
  height: number | null
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface ProfileImageLink {
  profile_id: string
  image_id: string
  kind: 'avatar' | 'gallery' | 'cover'
  sort_order: number
  user_images?: UserImage | UserImage[] | null
}

export interface AdminUser {
  id: string
  email: string | null
  created_at: string
  last_sign_in_at: string | null
  role: 'user' | 'admin'
  display_name: string | null
  username: string | null
  avatar_url: string | null
  is_public: boolean
}

const profileDefaults = (user: User) => ({
  id: user.id,
  display_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'AppForge user',
  avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
  is_public: true,
})

export async function ensureProfile(user: User): Promise<AppProfile> {
  const existing = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
  if (existing.error) throw existing.error
  if (existing.data) return existing.data as AppProfile

  const created = await supabase.from('profiles').insert(profileDefaults(user)).select('*').single()
  if (created.error) throw created.error
  return created.data as AppProfile
}

export async function saveProfile(userId: string, patch: Partial<AppProfile>): Promise<AppProfile> {
  const payload = {
    display_name: patch.display_name ?? null,
    username: patch.username?.trim() || null,
    avatar_url: patch.avatar_url ?? null,
    bio: patch.bio ?? null,
    website: patch.website ?? null,
    location: patch.location ?? null,
    is_public: patch.is_public ?? true,
    updated_at: new Date().toISOString(),
  }
  const result = await supabase.from('profiles').update(payload).eq('id', userId).select('*').single()
  if (result.error) throw result.error
  return result.data as AppProfile
}

export async function getRole(userId: string): Promise<'user' | 'admin'> {
  const result = await supabase.from('app_roles').select('role').eq('user_id', userId).maybeSingle()
  if (result.error) throw result.error
  return result.data?.role === 'admin' ? 'admin' : 'user'
}

export async function claimFirstAdmin(): Promise<boolean> {
  const result = await supabase.rpc('claim_first_admin')
  if (result.error) throw result.error
  return Boolean(result.data)
}

export async function listVisibleProfiles(): Promise<AppProfile[]> {
  const result = await supabase.from('profiles').select('*').order('created_at', { ascending: true })
  if (result.error) throw result.error
  return (result.data || []) as AppProfile[]
}

export async function listProfileImages(profileId?: string): Promise<ProfileImageLink[]> {
  let query = supabase
    .from('profile_images')
    .select('profile_id,image_id,kind,sort_order,user_images(*)')
    .order('sort_order', { ascending: true })
  if (profileId) query = query.eq('profile_id', profileId)
  const result = await query
  if (result.error) throw result.error
  return (result.data || []) as unknown as ProfileImageLink[]
}

const safeFileName = (name: string) => name
  .toLowerCase()
  .replace(/[^a-z0-9._-]+/g, '-')
  .replace(/^-+|-+$/g, '')
  .slice(-90) || 'image'

export async function uploadProfileImage(userId: string, file: File, kind: 'avatar' | 'gallery' | 'cover' = 'gallery') {
  if (!file.type.startsWith('image/')) throw new Error('Choose an image file.')
  if (file.size > 10 * 1024 * 1024) throw new Error('Images must be 10 MB or smaller.')

  const path = `${userId}/${crypto.randomUUID()}-${safeFileName(file.name)}`
  const upload = await supabase.storage.from('profile-media').upload(path, file, {
    upsert: false,
    contentType: file.type,
    cacheControl: '3600',
  })
  if (upload.error) throw upload.error

  const { data: publicUrl } = supabase.storage.from('profile-media').getPublicUrl(path)
  const image = await supabase.from('user_images').insert({
    owner_id: userId,
    title: file.name,
    source_url: publicUrl.publicUrl,
    storage_path: path,
    mime_type: file.type,
    metadata: { size: file.size },
  }).select('*').single()

  if (image.error) {
    await supabase.storage.from('profile-media').remove([path])
    throw image.error
  }

  if (kind === 'avatar') {
    await supabase.from('profile_images').delete().eq('profile_id', userId).eq('kind', 'avatar')
  }

  const link = await supabase.from('profile_images').insert({
    profile_id: userId,
    image_id: image.data.id,
    kind,
    sort_order: kind === 'gallery' ? Date.now() : 0,
  })
  if (link.error) throw link.error

  if (kind === 'avatar') {
    const profile = await supabase.from('profiles').update({ avatar_url: publicUrl.publicUrl, updated_at: new Date().toISOString() }).eq('id', userId)
    if (profile.error) throw profile.error
  }

  return image.data as UserImage
}

export async function removeProfileImage(userId: string, image: UserImage) {
  if (image.owner_id !== userId) throw new Error('You can only remove your own image.')
  const links = await supabase.from('profile_images').delete().eq('profile_id', userId).eq('image_id', image.id)
  if (links.error) throw links.error
  const row = await supabase.from('user_images').delete().eq('id', image.id).eq('owner_id', userId)
  if (row.error) throw row.error
  if (image.storage_path) await supabase.storage.from('profile-media').remove([image.storage_path])
}

export async function getSecurityState() {
  const [aal, factors] = await Promise.all([
    supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
    supabase.auth.mfa.listFactors(),
  ])
  if (aal.error) throw aal.error
  if (factors.error) throw factors.error
  return {
    currentLevel: aal.data.currentLevel,
    nextLevel: aal.data.nextLevel,
    totp: factors.data.totp,
  }
}

export async function enrollTotp() {
  const result = await supabase.auth.mfa.enroll({ factorType: 'totp', friendlyName: 'AppForge' })
  if (result.error) throw result.error
  return result.data
}

export async function verifyTotpFactor(factorId: string, code: string) {
  const challenge = await supabase.auth.mfa.challenge({ factorId })
  if (challenge.error) throw challenge.error
  const verified = await supabase.auth.mfa.verify({ factorId, challengeId: challenge.data.id, code: code.trim() })
  if (verified.error) throw verified.error
  return verified.data
}

export async function unenrollTotp(factorId: string) {
  const result = await supabase.auth.mfa.unenroll({ factorId })
  if (result.error) throw result.error
}

export async function adminListUsers(): Promise<AdminUser[]> {
  const result = await supabase.rpc('admin_list_users')
  if (result.error) throw result.error
  return (result.data || []) as AdminUser[]
}

export async function adminSetRole(userId: string, role: 'user' | 'admin') {
  const result = await supabase.from('app_roles').upsert({ user_id: userId, role, updated_at: new Date().toISOString() })
  if (result.error) throw result.error
}

export async function adminUpdateProfile(userId: string, patch: Pick<AppProfile, 'display_name' | 'username' | 'is_public'>) {
  const result = await supabase.from('profiles').update({ ...patch, updated_at: new Date().toISOString() }).eq('id', userId)
  if (result.error) throw result.error
}

export async function adminDeleteUser(userId: string) {
  const result = await supabase.rpc('admin_delete_user', { target_user_id: userId })
  if (result.error) throw result.error
  return Boolean(result.data)
}
