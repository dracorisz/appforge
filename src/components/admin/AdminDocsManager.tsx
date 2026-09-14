import React from "react";
import { CheckCircle2, KeyRound, Loader2, Plus, Save, ShieldCheck, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/auth/AuthProvider";
import { Button, Input, Textarea } from "@/components/ui";
import { createFrontendContent, deleteFrontendContent, loadAllFrontendContent, updateFrontendContent, type FrontendContentDraft, type FrontendContentRecord } from "@/lib/frontendContent";
import { supabase } from "@/lib/supabase";

const cleanSlug = (value: string) => value.toLowerCase().trim().replace(/\.md$/i, "").replace(/[^a-z0-9/_-]+/g, "-").replace(/-+/g, "-").replace(/^[-/]+|[-/]+$/g, "") || "index";
const makeDraft = (): FrontendContentDraft => ({ content_type: "docs_page", slug: "", title: "", summary: "", body: "", image_url: "", video_url: "", app_route: "", published: true, sort_order: 0, metadata: {} });
const toDraft = (item: FrontendContentRecord): FrontendContentDraft => ({ content_type: "docs_page", slug: item.slug, title: item.title, summary: item.summary || "", body: item.body || "", image_url: item.image_url || "", video_url: item.video_url || "", app_route: item.app_route || "", published: item.published, sort_order: item.sort_order, metadata: item.metadata || {} });

export function AdminDocsManager() {
  const { user, loading: authLoading } = useAuth();
  const [checking, setChecking] = React.useState(true);
  const [isAdmin, setIsAdmin] = React.useState(false);
  const [aal2, setAal2] = React.useState(false);
  const [factorId, setFactorId] = React.useState("");
  const [totpCode, setTotpCode] = React.useState("");
  const [items, setItems] = React.useState<FrontendContentRecord[]>([]);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [draft, setDraft] = React.useState<FrontendContentDraft>(makeDraft);
  const [busy, setBusy] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [error, setError] = React.useState("");

  const refresh = React.useCallback(async () => {
    const records = await loadAllFrontendContent();
    setItems(records.filter((item) => item.content_type === "docs_page").sort((a, b) => a.sort_order - b.sort_order || a.title.localeCompare(b.title)));
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    const check = async () => {
      if (authLoading) return;
      if (!user) {
        setChecking(false);
        return;
      }
      setChecking(true);
      try {
        const [{ data: adminData, error: adminError }, { data: assurance, error: assuranceError }, { data: factors, error: factorError }] = await Promise.all([supabase.rpc("is_admin"), supabase.auth.mfa.getAuthenticatorAssuranceLevel(), supabase.auth.mfa.listFactors()]);
        if (adminError) throw adminError;
        if (assuranceError) throw assuranceError;
        if (factorError) throw factorError;
        if (cancelled) return;
        const admin = adminData === true;
        const verified = assurance.currentLevel === "aal2";
        setIsAdmin(admin);
        setAal2(verified);
        setFactorId(factors.totp.find((factor) => factor.status === "verified")?.id || "");
        if (admin && verified) await refresh();
      } catch (accessError) {
        if (!cancelled) setError(accessError instanceof Error ? accessError.message : "Could not verify admin access.");
      } finally {
        if (!cancelled) setChecking(false);
      }
    };
    void check();
    return () => { cancelled = true; };
  }, [authLoading, refresh, user]);

  const verifyTotp = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!factorId || !totpCode.trim()) return;
    setBusy("totp");
    setError("");
    try {
      const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({ factorId, code: totpCode.trim() });
      if (verifyError) throw verifyError;
      setAal2(true);
      setTotpCode("");
      await refresh();
    } catch (verifyError) {
      setError(verifyError instanceof Error ? verifyError.message : "TOTP verification failed.");
    } finally {
      setBusy("");
    }
  };

  const selectItem = (item: FrontendContentRecord) => {
    setSelectedId(item.id);
    setDraft(toDraft(item));
    setMessage("");
    setError("");
  };

  const newItem = () => {
    setSelectedId(null);
    setDraft(makeDraft());
    setMessage("");
    setError("");
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user || !aal2 || !isAdmin) return;
    const title = draft.title.trim();
    const slug = cleanSlug(draft.slug || title);
    if (!title || !slug) {
      setError("Title and slug are required.");
      return;
    }
    setBusy("save");
    setError("");
    setMessage("");
    try {
      const payload: FrontendContentDraft = { ...draft, content_type: "docs_page", title, slug, summary: draft.summary?.trim() || null, body: draft.body || "", image_url: null, video_url: null, app_route: null, sort_order: Number(draft.sort_order) || 0 };
      const saved = selectedId ? await updateFrontendContent(selectedId, payload) : await createFrontendContent(payload, user.id);
      await refresh();
      setSelectedId(saved.id);
      setDraft(toDraft(saved));
      setMessage("Documentation page saved.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not save documentation page.");
    } finally {
      setBusy("");
    }
  };

  const remove = async () => {
    if (!selectedId || !confirm("Delete this documentation page?")) return;
    setBusy("delete");
    setError("");
    try {
      await deleteFrontendContent(selectedId);
      await refresh();
      newItem();
      setMessage("Documentation page deleted.");
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Could not delete documentation page.");
    } finally {
      setBusy("");
    }
  };

  if (checking || authLoading) return <div className="flex min-h-[40vh] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  if (!user) return <div className="mx-auto max-w-xl rounded-xl border border-border/70 p-4 text-center"><ShieldCheck className="mx-auto h-8 w-8" /><h1 className="mt-4 text-lg font-semibold">Admin sign-in required</h1><Link to="/login" className="mt-4 inline-flex text-sm underline">Sign in</Link></div>;
  if (!isAdmin) return <div className="mx-auto max-w-xl rounded-xl border border-border/70 p-4 text-center"><ShieldCheck className="mx-auto h-8 w-8" /><h1 className="mt-4 text-lg font-semibold">Admin only</h1></div>;
  if (!aal2) return <div className="mx-auto max-w-xl rounded-xl border border-border/70 p-4"><KeyRound className="h-8 w-8" /><h1 className="mt-4 text-lg font-semibold">Verify TOTP</h1>{factorId ? <form onSubmit={verifyTotp} className="mt-4 flex gap-2"><Input value={totpCode} onChange={(event) => setTotpCode(event.target.value.replace(/\D/g, "").slice(0, 8))} inputMode="numeric" className="min-w-0 flex-1 rounded-xl border border-input bg-background px-4" placeholder="Authenticator code" /><Button disabled={busy === "totp" || !totpCode} className="rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground">Verify</Button></form> : <p className="mt-2 text-sm text-muted-foreground">Enroll TOTP in Settings → Security first.</p>}</div>;

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <main className="mx-auto w-full max-w-7xl p-4 lg:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div><h1 className="text-lg font-semibold">Documentation content</h1><p className="mt-2 text-sm text-muted-foreground">Edit the database-backed pages served by the AppForge docs experience.</p></div>
          <div className="inline-flex items-center gap-2 text-sm text-success"><CheckCircle2 className="h-4 w-4" /> Admin · TOTP</div>
        </div>
        {message && <div className="mt-4 rounded-xl border border-success/25 bg-success/5 p-2 text-sm text-success">{message}</div>}
        {error && <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/5 p-2 text-sm text-destructive">{error}</div>}
        <div className="mt-8 grid gap-4 xl:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="rounded-xl border border-border/70 bg-background/40 p-4">
            <Button onClick={newItem} className="flex w-full items-center justify-center gap-2 rounded-xl border border-border/70 px-4 py-2 text-sm font-semibold hover:bg-accent"><Plus className="h-4 w-4" /> New page</Button>
            <div className="mt-4 space-y-2">{items.map((item) => <Button key={item.id} onClick={() => selectItem(item)} className={`w-full rounded-xl border p-4 text-left ${selectedId === item.id ? "border-foreground/30 bg-accent/50" : "border-border/60 hover:bg-accent/25"}`}><div className="truncate text-sm font-medium">{item.title}</div><div className="mt-2 truncate text-sm text-muted-foreground">{item.slug}</div></Button>)}</div>
          </aside>
          <section className="rounded-xl border border-border/70 bg-background/40 p-4">
            <form onSubmit={save} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="text-sm font-medium text-muted-foreground">Title<Input value={draft.title} onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))} className="mt-2 w-full rounded-xl border border-input bg-background px-4 text-sm text-foreground" /></label>
                <label className="text-sm font-medium text-muted-foreground">Slug<Input value={draft.slug} onChange={(event) => setDraft((current) => ({ ...current, slug: event.target.value }))} className="mt-2 w-full rounded-xl border border-input bg-background px-4 text-sm text-foreground" placeholder="getting-started" /></label>
              </div>
              <label className="block text-sm font-medium text-muted-foreground">Summary<Textarea value={draft.summary || ""} onChange={(event) => setDraft((current) => ({ ...current, summary: event.target.value }))} rows={2} className="mt-2 w-full rounded-xl border border-input bg-background p-4 text-sm text-foreground" /></label>
              <label className="block text-sm font-medium text-muted-foreground">Body (Markdown)<Textarea value={draft.body || ""} onChange={(event) => setDraft((current) => ({ ...current, body: event.target.value }))} rows={24} className="mt-2 w-full rounded-xl border border-input bg-background p-4 font-mono text-sm text-foreground" /></label>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="text-sm font-medium text-muted-foreground">Navigation order<Input type="number" value={draft.sort_order} onChange={(event) => setDraft((current) => ({ ...current, sort_order: Number(event.target.value) || 0 }))} className="mt-2 w-full rounded-xl border border-input bg-background px-4 text-sm text-foreground" /></label>
                <label className="mt-8 inline-flex items-center gap-2 text-sm"><Input type="checkbox" checked={draft.published} onChange={(event) => setDraft((current) => ({ ...current, published: event.target.checked }))} /> Published</label>
              </div>
              <div className="flex flex-wrap gap-2"><Button type="submit" disabled={busy === "save"} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"><Save className="h-4 w-4" /> Save</Button>{selectedId && <Button type="button" onClick={() => void remove()} disabled={busy === "delete"} className="inline-flex items-center gap-2 rounded-xl border border-destructive/30 px-4 py-2 text-sm font-semibold text-destructive hover:bg-destructive/5"><Trash2 className="h-4 w-4" /> Delete</Button>}<Link to="/docs" className="inline-flex items-center rounded-xl border border-border/70 px-4 py-2 text-sm font-semibold hover:bg-accent">View docs</Link></div>
            </form>
          </section>
        </div>
      </main>
    </div>
  );
}
