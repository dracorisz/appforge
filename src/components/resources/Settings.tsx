import * as React from "react";
import { useSearchParams } from "react-router-dom";
import { Check, Download, ImagePlus, KeyRound, Loader2, LockKeyhole, ShieldCheck, Trash2, Upload, UserRound } from "lucide-react";
import { Badge, BuildBadge, Button, Card, Input, Tabs, Textarea } from "@/components/ui";
import type { AppState } from "@/types";
import { useAuth } from "@/auth/AuthProvider";
import { supabase } from "@/lib/supabase";
import { loadCategoryOverrides, saveCategoryOverrides } from "@/lib/categories";
import { createWorkspaceBackup, parseWorkspaceBackup, type WorkspaceImportPreview } from "@/lib/workspaceBackup";
import { isWidgetEnabled, setWidgetEnabled } from "@/lib/widgetPreferences";
import { VertexBridgeStatus } from "./VertexBridgeStatus";
import { AdminConsolePage } from "@/components/admin/AdminConsolePage";
import { claimFirstAdmin, ensureProfile, enrollTotp, getPrivateProfileInfo, getRole, getSecurityState, savePrivateProfileInfo, saveProfile, unenrollTotp, uploadProfileImage, verifyTotpFactor, type AppProfile, type PrivateProfileInfo } from "@/lib/account";

const PROFILE_IMAGE_ACCEPT = "image/png,image/jpeg,image/webp,image/gif";
const MAX_WORKSPACE_IMPORT_BYTES = 5 * 1024 * 1024;
const HF_KEYS_STORAGE = "dragon-arena-hf-keys";
const HF_LEGACY_STORAGE = "dragon-arena-hf-key";
type TabId = "profile" | "security" | "data" | "integrations" | "admin";
const TAB_IDS = new Set<TabId>(["profile", "security", "data", "integrations", "admin"]);
const splitSkills = (value: string) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 16);
const tabFromParams = (params: URLSearchParams): TabId => {
  const value = params.get("tab");
  return value && TAB_IDS.has(value as TabId) ? (value as TabId) : "profile";
};
const loadHfTokens = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(HF_KEYS_STORAGE) || "[]");
    if (Array.isArray(parsed)) return [0, 1, 2].map((index) => String(parsed[index] || ""));
    return [localStorage.getItem(HF_LEGACY_STORAGE) || "", "", ""];
  } catch {
    return ["", "", ""];
  }
};

export function SettingsPage({ state, setState }: { state: AppState; setState: (s: AppState) => void }) {
  const { user, signOut } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = tabFromParams(searchParams);
  const [profile, setProfile] = React.useState<AppProfile | null>(null);
  const [privateInfo, setPrivateInfo] = React.useState<PrivateProfileInfo | null>(null);
  const [role, setRole] = React.useState<"user" | "admin">("user");
  const [currentLevel, setCurrentLevel] = React.useState<"aal1" | "aal2" | null>(null);
  const [totpFactors, setTotpFactors] = React.useState<any[]>([]);
  const [enrollment, setEnrollment] = React.useState<{ id: string; qr: string; secret: string } | null>(null);
  const [totpCode, setTotpCode] = React.useState("");
  const [skillsDraft, setSkillsDraft] = React.useState("");
  const [hfTokens, setHfTokens] = React.useState<string[]>(loadHfTokens);
  const [loading, setLoading] = React.useState(true);
  const [busy, setBusy] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [error, setError] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [deleteConfirm, setDeleteConfirm] = React.useState("");
  const [importPreview, setImportPreview] = React.useState<WorkspaceImportPreview | null>(null);
  const [importFileName, setImportFileName] = React.useState("");

  const selectTab = React.useCallback(
    (tab: TabId, replace = false) => {
      const next = new URLSearchParams(searchParams);
      if (tab === "profile") next.delete("tab");
      else next.set("tab", tab);
      setSearchParams(next, { replace });
    },
    [searchParams, setSearchParams],
  );

  const flash = (text: string) => {
    setMessage(text);
    setError("");
    window.setTimeout(() => setMessage(""), 2200);
  };

  const refreshAccount = React.useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError("");
    try {
      const [nextProfile, nextPrivate, nextRole, security] = await Promise.all([ensureProfile(user), getPrivateProfileInfo(user.id), getRole(user.id), getSecurityState()]);
      setProfile(nextProfile);
      setPrivateInfo(nextPrivate);
      setRole(nextRole);
      setSkillsDraft((nextProfile.skills || []).join(", "));
      setCurrentLevel(security.currentLevel);
      setTotpFactors(security.totp || []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load account settings.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  React.useEffect(() => {
    void refreshAccount();
  }, [refreshAccount]);
  React.useEffect(() => {
    if (!loading && activeTab === "admin" && role !== "admin") selectTab("profile", true);
  }, [activeTab, loading, role, selectTab]);

  const savePublicProfile = async () => {
    if (!user || !profile) return;
    setBusy("profile");
    setError("");
    try {
      const saved = await saveProfile(user.id, { ...profile, skills: splitSkills(skillsDraft) });
      setProfile(saved);
      setSkillsDraft((saved.skills || []).join(", "));
      flash("Profile saved.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save profile.");
    } finally {
      setBusy("");
    }
  };

  const savePrivateInfo = async () => {
    if (!user || !privateInfo) return;
    setBusy("private");
    setError("");
    try {
      setPrivateInfo(await savePrivateProfileInfo(user.id, privateInfo));
      flash("Private information saved.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save private information.");
    } finally {
      setBusy("");
    }
  };

  const uploadAvatar = async (file: File) => {
    if (!user) return;
    setBusy("avatar");
    setError("");
    try {
      await uploadProfileImage(user.id, file, "avatar");
      await refreshAccount();
      flash("Avatar updated.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Avatar upload failed.");
    } finally {
      setBusy("");
    }
  };

  const saveLoginPassword = async () => {
    const password = newPassword;
    const valid = password.length >= 8 && /[a-z]/.test(password) && /[A-Z]/.test(password) && /\d/.test(password) && /[^A-Za-z0-9]/.test(password);
    if (!valid) {
      setError("Password must be at least 8 characters and include lowercase, uppercase, a digit and a symbol.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Password confirmation does not match.");
      return;
    }
    setBusy("password");
    setError("");
    const { error: passwordError } = await supabase.auth.updateUser({ password });
    if (passwordError) setError(passwordError.message);
    else {
      setNewPassword("");
      setConfirmPassword("");
      flash("Email/password login password updated.");
    }
    setBusy("");
  };

  const saveHfTokens = () => {
    try {
      const normalized = hfTokens.map((token) => token.trim()).slice(0, 3);
      localStorage.setItem(HF_KEYS_STORAGE, JSON.stringify(normalized));
      const primary = normalized.find((token) => token.startsWith("hf_")) || "";
      if (primary) localStorage.setItem(HF_LEGACY_STORAGE, primary);
      else localStorage.removeItem(HF_LEGACY_STORAGE);
      setHfTokens(normalized);
      flash("Hugging Face token rotation saved in this browser.");
    } catch {
      setError("Could not save Hugging Face tokens in browser storage.");
    }
  };

  const beginTotp = async () => {
    setBusy("enroll");
    setError("");
    try {
      const data = await enrollTotp();
      setEnrollment({ id: data.id, qr: data.totp.qr_code, secret: data.totp.secret });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not start TOTP enrollment.");
    } finally {
      setBusy("");
    }
  };

  const verifyFactor = async (factorId: string) => {
    if (!totpCode.trim()) return;
    setBusy("verify");
    setError("");
    try {
      await verifyTotpFactor(factorId, totpCode);
      setTotpCode("");
      setEnrollment(null);
      await refreshAccount();
      flash("TOTP verified.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "TOTP verification failed.");
    } finally {
      setBusy("");
    }
  };

  const removeFactor = async (factorId: string) => {
    setBusy("factor");
    try {
      await unenrollTotp(factorId);
      await refreshAccount();
      flash("TOTP factor removed.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not remove TOTP factor.");
    } finally {
      setBusy("");
    }
  };

  const bootstrapAdmin = async () => {
    setBusy("bootstrap-admin");
    try {
      const claimed = await claimFirstAdmin();
      if (!claimed) throw new Error("Initial admin can only be claimed while you are the sole AppForge account and no admin exists yet.");
      await refreshAccount();
      flash("Initial admin role claimed. Verify TOTP before Admin CRUD.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not initialize admin.");
    } finally {
      setBusy("");
    }
  };

  const deleteAccount = async () => {
    if (deleteConfirm !== "DELETE") {
      setError("Type DELETE exactly before permanently deleting the account.");
      return;
    }
    if (!window.confirm("Permanently delete this AppForge account? This cannot be undone.")) return;
    setBusy("delete-account");
    setError("");
    try {
      const { error: invokeError } = await supabase.functions.invoke("delete-account", { body: { confirm: "DELETE" } });
      if (invokeError) throw invokeError;
      await signOut().catch(() => undefined);
      window.location.assign("/");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not delete the account.");
    } finally {
      setBusy("");
    }
  };

  const exportWorkspace = () => {
    const payload = createWorkspaceBackup({ exportedAt: new Date().toISOString(), accountId: user?.id, workspace: state, categoryOverrides: loadCategoryOverrides(), widgets: { "weather-sidebar": isWidgetEnabled("weather-sidebar"), "desktop-buddy": isWidgetEnabled("desktop-buddy") } });
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `appforge-workspace-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const importWorkspace = (file: File) => {
    if (file.size > MAX_WORKSPACE_IMPORT_BYTES) {
      setError("Workspace backup is too large. Choose a JSON file under 5 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => setError("Could not read that workspace backup.");
    reader.onload = () => {
      try {
        setImportPreview(parseWorkspaceBackup(String(reader.result || "{}"), state, user?.id));
        setImportFileName(file.name);
        setError("");
      } catch (cause) {
        setImportPreview(null);
        setImportFileName("");
        setError(cause instanceof Error ? cause.message : "That file is not a valid AppForge workspace export.");
      }
    };
    reader.readAsText(file);
  };

  const applyWorkspaceImport = () => {
    if (!importPreview) return;
    setState(importPreview.workspace);
    saveCategoryOverrides(importPreview.categoryOverrides);
    for (const key of ["weather-sidebar", "desktop-buddy"] as const) {
      const value = importPreview.widgets[key];
      if (typeof value === "boolean") setWidgetEnabled(key, value);
    }
    setImportPreview(null);
    setImportFileName("");
    flash("Workspace backup imported.");
  };

  const verifiedTotp = totpFactors.filter((factor) => factor.status === "verified");
  const tabs: { id: TabId; label: string }[] = [{ id: "profile", label: "Profile" }, { id: "security", label: "Security" }, { id: "integrations", label: "Integrations" }, { id: "data", label: "Workspace" }, ...(role === "admin" ? [{ id: "admin" as TabId, label: "Admin" }] : [])];

  return (
    <div className="space-y-4 pb-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-foreground">Settings</h1>
          <p className="mt-2 text-sm text-muted-foreground">Profile, security, integrations, workspace and admin controls.</p>
        </div>
        <BuildBadge />
      </div>
      <Tabs tabs={tabs} active={activeTab} onChange={(id) => selectTab(id as TabId)} ariaLabel="Settings sections" />
      {message && (
        <Card className="border-success/25 bg-success/5 p-2 text-sm text-success dark:text-success">
          <Check className="mr-2 inline h-4 w-4" />
          {message}
        </Card>
      )}
      {error && <Card className="border-destructive/30 bg-destructive/5 p-2 text-sm text-destructive">{error}</Card>}

      {activeTab === "profile" && (
        <div className="columns-1 gap-4 md:columns-2 xl:columns-3 [&>*]:mb-3 [&>*]:break-inside-avoid">
          <Card className="p-4">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border/70 bg-muted">
                {profile?.avatar_url ? <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" /> : <UserRound className="h-6 w-6 text-muted-foreground" />}
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold">{profile?.display_name || user?.email || "AppForge user"}</div>
                <div className="truncate text-sm text-muted-foreground">{user?.email}</div>
                <div className="mt-2">
                  <Badge color={role === "admin" ? "blue" : "slate"}>{role}</Badge>
                </div>
              </div>
            </div>
            <label className="mt-4 inline-flex cursor-pointer">
              <Input
                type="file"
                accept={PROFILE_IMAGE_ACCEPT}
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void uploadAvatar(file);
                  event.currentTarget.value = "";
                }}
              />
              <Badge className="inline-flex h-6 items-center gap-2 rounded-xl border border-border px-2 text-sm font-medium hover:bg-accent">
                <ImagePlus className="h-4 w-4" />
                {busy === "avatar" ? "Uploading…" : "Change avatar"}
              </Badge>
            </label>
          </Card>
          <Card className="p-4">
            <h2 className="text-sm font-semibold">Identity</h2>
            {loading || !profile ? (
              <div className="py-4 text-sm text-muted-foreground">Loading…</div>
            ) : (
              <div className="mt-4 grid gap-2">
                <Input label="Display name" value={profile.display_name || ""} onChange={(e) => setProfile({ ...profile, display_name: e.target.value })} />
                <Input label="Username" value={profile.username || ""} onChange={(e) => setProfile({ ...profile, username: e.target.value })} />
                <Input label="Headline" value={profile.headline || ""} onChange={(e) => setProfile({ ...profile, headline: e.target.value })} />
                <Textarea label="Bio" value={profile.bio || ""} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} rows={2} />
              </div>
            )}
          </Card>
          <Card className="p-4">
            <h2 className="text-sm font-semibold">Save profile</h2>
            <p className="mt-2 text-sm text-muted-foreground">Cards flow independently, so short sections no longer stretch to match tall ones.</p>
            <Button className="mt-4" onClick={() => void savePublicProfile()} disabled={busy === "profile"}>
              {busy === "profile" ? <Loader2 className="animate-spin" /> : <Check />} Save profile
            </Button>
          </Card>
          <Card className="p-4">
            <h2 className="text-sm font-semibold">Links & skills</h2>
            {profile && (
              <div className="mt-4 grid gap-2">
                <Input label="GitHub username" value={profile.github_username || ""} onChange={(e) => setProfile({ ...profile, github_username: e.target.value })} />
                <Input label="Website" value={profile.website || ""} onChange={(e) => setProfile({ ...profile, website: e.target.value })} />
                <Input label="Public location" value={profile.location || ""} onChange={(e) => setProfile({ ...profile, location: e.target.value })} />
                <Input label="Skills" value={skillsDraft} onChange={(e) => setSkillsDraft(e.target.value)} placeholder="React, TypeScript, Supabase" />
              </div>
            )}
          </Card>
          <Card className="p-4">
            <h2 className="text-sm font-semibold">People visibility</h2>
            {profile && (
              <div className="mt-4 grid gap-2 text-sm">
                <label className="flex items-center gap-2">
                  <Input type="checkbox" checked={profile.is_public} onChange={(e) => setProfile({ ...profile, is_public: e.target.checked })} /> Show profile in People
                </label>
                <label className="flex items-center gap-2">
                  <Input type="checkbox" checked={profile.open_to_collaboration} onChange={(e) => setProfile({ ...profile, open_to_collaboration: e.target.checked })} /> Open to collaboration
                </label>
                <label className="flex items-center gap-2">
                  <Input type="checkbox" checked={profile.show_skills !== false} onChange={(e) => setProfile({ ...profile, show_skills: e.target.checked })} /> Show skills
                </label>
                <label className="flex items-center gap-2">
                  <Input type="checkbox" checked={profile.show_github !== false} onChange={(e) => setProfile({ ...profile, show_github: e.target.checked })} /> Show GitHub
                </label>
                <label className="flex items-center gap-2">
                  <Input type="checkbox" checked={profile.show_website !== false} onChange={(e) => setProfile({ ...profile, show_website: e.target.checked })} /> Show website
                </label>
                <label className="flex items-center gap-2">
                  <Input type="checkbox" checked={Boolean(profile.show_email)} onChange={(e) => setProfile({ ...profile, show_email: e.target.checked, public_email: e.target.checked ? profile.public_email || user?.email || "" : profile.public_email })} /> Show public email
                </label>
                {profile.show_email && <Input type="email" label="Public email" value={profile.public_email || ""} onChange={(e) => setProfile({ ...profile, public_email: e.target.value })} />}
              </div>
            )}
          </Card>
          <Card className="p-4">
            <div className="flex items-start gap-2">
              <LockKeyhole className="mt-2 h-4 w-4 text-muted-foreground" />
              <div>
                <h2 className="text-sm font-semibold">Private information</h2>
                <p className="mt-2 text-sm text-muted-foreground">Owner-only profile details. Never shown in People.</p>
              </div>
            </div>
            {privateInfo && (
              <div className="mt-4 grid gap-2">
                <div className="grid grid-cols-2 gap-2">
                  <Input label="Sex" value={privateInfo.sex || ""} onChange={(e) => setPrivateInfo({ ...privateInfo, sex: e.target.value })} />
                  <Input label="Birth date" type="date" value={privateInfo.birth_date || ""} onChange={(e) => setPrivateInfo({ ...privateInfo, birth_date: e.target.value })} />
                  <Input label="Phone" value={privateInfo.phone || ""} onChange={(e) => setPrivateInfo({ ...privateInfo, phone: e.target.value })} />
                  <Input label="Country" value={privateInfo.country || ""} onChange={(e) => setPrivateInfo({ ...privateInfo, country: e.target.value })} />
                </div>
                <Input label="Organization" value={privateInfo.organization || ""} onChange={(e) => setPrivateInfo({ ...privateInfo, organization: e.target.value })} />
                <Input label="Job title" value={privateInfo.job_title || ""} onChange={(e) => setPrivateInfo({ ...privateInfo, job_title: e.target.value })} />
                <div className="grid grid-cols-2 gap-2">
                  <Input label="Address" value={privateInfo.address_line1 || ""} onChange={(e) => setPrivateInfo({ ...privateInfo, address_line1: e.target.value })} />
                  <Input label="City" value={privateInfo.city || ""} onChange={(e) => setPrivateInfo({ ...privateInfo, city: e.target.value })} />
                  <Input label="Region" value={privateInfo.region || ""} onChange={(e) => setPrivateInfo({ ...privateInfo, region: e.target.value })} />
                  <Input label="Postal code" value={privateInfo.postal_code || ""} onChange={(e) => setPrivateInfo({ ...privateInfo, postal_code: e.target.value })} />
                </div>
                <Textarea label="Private notes" value={privateInfo.notes || ""} onChange={(e) => setPrivateInfo({ ...privateInfo, notes: e.target.value })} rows={2} />
                <Button variant="secondary" onClick={() => void savePrivateInfo()} disabled={busy === "private"}>
                  Save private info
                </Button>
              </div>
            )}
          </Card>
        </div>
      )}

      {activeTab === "security" && (
        <div className="grid items-start gap-4 lg:grid-cols-2">
          <Card className="p-4">
            <div className="flex items-start gap-2">
              <KeyRound className="h-4 w-4 text-muted-foreground" />
              <div>
                <h2 className="text-sm font-semibold">Email login password</h2>
                <p className="mt-2 text-sm text-muted-foreground">Minimum 8 characters with lowercase, uppercase, a digit and a symbol.</p>
              </div>
            </div>
            <div className="mt-4 grid gap-2">
              <Input type="password" label="New password" autoComplete="new-password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
              <Input type="password" label="Confirm password" autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
              <Button className="mr-auto" onClick={() => void saveLoginPassword()} disabled={busy === "password"}>
                Update password
              </Button>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-start gap-2">
              <ShieldCheck className="h-4 w-4 text-muted-foreground" />
              <div>
                <h2 className="text-sm font-semibold">Two-factor authentication</h2>
                <p className="mt-2 text-sm text-muted-foreground">Session assurance: {currentLevel || "unknown"}.</p>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              {verifiedTotp.map((factor) => (
                <div key={factor.id} className="flex items-center justify-between rounded-xl border border-border/70 p-2 text-sm">
                  <span>{factor.friendly_name || "Authenticator"} · verified</span>
                  <Button variant="ghost" onClick={() => void removeFactor(factor.id)} disabled={busy === "factor"}>
                    <Trash2 />
                  </Button>
                </div>
              ))}
              {!enrollment && (
                <Button variant="secondary" onClick={() => void beginTotp()} disabled={busy === "enroll"}>
                  Add authenticator
                </Button>
              )}
              {enrollment && (
                <div className="rounded-xl border border-border/70 p-2">
                  <img src={enrollment.qr} alt="TOTP QR code" className="mx-auto h-36 w-36 rounded-xl bg-inverse p-2" />
                  <div className="mt-2 break-all text-sm text-muted-foreground">{enrollment.secret}</div>
                  <div className="mt-2 flex gap-2">
                    <Input value={totpCode} onChange={(e) => setTotpCode(e.target.value)} placeholder="123456" inputMode="numeric" />
                    <Button onClick={() => void verifyFactor(enrollment.id)} disabled={busy === "verify"}>
                      Verify
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </Card>
          {role !== "admin" && (
            <Card className="p-4">
              <h2 className="text-sm font-semibold">Admin bootstrap</h2>
              <p className="mt-2 text-sm text-muted-foreground">Available only for the first/sole account when no admin exists.</p>
              <Button className="mt-4" variant="secondary" onClick={() => void bootstrapAdmin()} disabled={busy === "bootstrap-admin"}>
                Claim initial admin
              </Button>
            </Card>
          )}
          <Card className="border-destructive/35 bg-destructive/5 p-4 lg:col-span-2">
            <div className="flex items-start gap-2">
              <Trash2 className="h-4 w-4 text-destructive" />
              <div>
                <h2 className="text-sm font-semibold text-destructive">Danger zone</h2>
                <p className="mt-2 text-sm text-muted-foreground">Permanently delete your Supabase Auth account and account-owned database records. This cannot be undone.</p>
              </div>
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-[minmax(0,260px)_auto] sm:items-end">
              <Input label="Type DELETE to confirm" value={deleteConfirm} onChange={(e) => setDeleteConfirm(e.target.value)} placeholder="DELETE" />
              <Button className="mr-auto" variant="destructive" onClick={() => void deleteAccount()} disabled={deleteConfirm !== "DELETE" || busy === "delete-account"}>
                {busy === "delete-account" ? <Loader2 className="animate-spin" /> : <Trash2 />} Delete account
              </Button>
            </div>
          </Card>
        </div>
      )}

      {activeTab === "integrations" && (
        <div className="grid items-start gap-4 lg:grid-cols-2">
          <Card className="p-4">
            <h2 className="text-sm font-semibold">Hugging Face rotation</h2>
            <p className="mt-2 text-sm text-muted-foreground">Optional personal Inference Providers tokens. Story Studio rotates up to three before server-funded tokens. Tokens stay in this browser and are never written to your profile row.</p>
            <div className="mt-4 grid gap-2">
              {hfTokens.map((value, index) => (
                <Input key={index} type="password" autoComplete="off" label={`Token ${index + 1}`} value={value} onChange={(event) => setHfTokens((current) => current.map((item, itemIndex) => (itemIndex === index ? event.target.value : item)))} placeholder="hf_…" />
              ))}
              <Button onClick={saveHfTokens} className="mr-auto">
                <KeyRound className="h-4 w-4" /> Save token rotation
              </Button>
            </div>
          </Card>
          <div className="space-y-4">
            <VertexBridgeStatus />
            <Card className="p-4">
              <h2 className="text-sm font-semibold">Provider model</h2>
              <p className="mt-2 text-sm text-muted-foreground">Story text uses the Hugging Face rotation with a continuity-safe local fallback. Vertex remains the secured cloud image bridge for AppForge features that use it. Gemini/OpenRouter browser-key fields are intentionally removed.</p>
            </Card>
          </div>
        </div>
      )}

      {activeTab === "data" && (
        <div className="grid items-start gap-4 lg:grid-cols-2">
          <Card className="p-4">
            <h2 className="text-sm font-semibold">Export workspace</h2>
            <p className="mt-2 text-sm text-muted-foreground">Download workspace state, category overrides and widget preferences as JSON.</p>
            <Button className="mt-4" variant="secondary" onClick={exportWorkspace}>
              <Download className="h-4 w-4" /> Export
            </Button>
          </Card>
          <Card className="p-4">
            <h2 className="text-sm font-semibold">Import workspace</h2>
            <p className="mt-2 text-sm text-muted-foreground">Preview a backup before applying it. Maximum 5 MB.</p>
            <label className="mt-4 inline-flex cursor-pointer">
              <Input
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) importWorkspace(file);
                  event.currentTarget.value = "";
                }}
              />
              <Badge className="inline-flex h-9 items-center gap-2 rounded-xl border border-border px-2 text-sm font-medium hover:bg-accent">
                <Upload className="h-4 w-4" /> Choose JSON
              </Badge>
            </label>
            {importFileName && <div className="mt-2 text-sm text-muted-foreground">{importFileName}</div>}
            {importPreview && (
              <div className="mt-4 rounded-xl border border-border/70 p-2 text-sm">
                <div>Workspace backup is ready to apply.</div>
                <Button className="mt-2" onClick={applyWorkspaceImport}>
                  Apply import
                </Button>
              </div>
            )}
          </Card>
        </div>
      )}
      {activeTab === "admin" && role === "admin" && <AdminConsolePage />}
    </div>
  );
}
