import React from "react";
import { CheckCircle2, KeyRound, Loader2, Plus, Save, ShieldCheck, Sparkles, Trash2, Upload, X } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/auth/AuthProvider";
import { supabase } from "@/lib/supabase";
import { createFrontendContent, deleteFrontendContent, loadAllFrontendContent, updateFrontendContent, uploadFrontendContentMedia, type FrontendContentDraft, type FrontendContentRecord, type FrontendContentType } from "@/lib/frontendContent";
import { Button, FileButton, Input, Textarea } from "@/components/ui";

const LANDING_SLUG = "appforge-walkthrough";
const MANAGED_TYPES: FrontendContentType[] = ["blog_article", "video_teaser"];

const makeDraft = (contentType: FrontendContentType = "blog_article"): FrontendContentDraft => ({
  content_type: contentType,
  slug: contentType === "video_teaser" ? LANDING_SLUG : "",
  title: contentType === "video_teaser" ? "See AppForge in action" : "",
  summary: contentType === "video_teaser" ? "A short walkthrough of the current AppForge experience." : "",
  body: "",
  image_url: "",
  video_url: "",
  app_route: "",
  published: contentType === "video_teaser",
  sort_order: 0,
  metadata: {},
});

const toDraft = (item: FrontendContentRecord): FrontendContentDraft => ({
  content_type: item.content_type,
  slug: item.slug,
  title: item.title,
  summary: item.summary || "",
  body: item.body || "",
  image_url: item.image_url || "",
  video_url: item.video_url || "",
  app_route: item.app_route || "",
  published: item.published,
  sort_order: item.sort_order,
  metadata: item.metadata || {},
});

const cleanSlug = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9/_-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-/]+|[-/]+$/g, "");
const generateSummary = (body: string | null | undefined, title: string) => {
  const source = (body || title)
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/[#>*_`~|-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (source.length <= 180) return source;
  return `${source.slice(0, 177).trim()}…`;
};

type Props = { embedded?: boolean; adminVerified?: boolean; contentType?: Extract<FrontendContentType, "blog_article" | "video_teaser"> };

export function AdminContentManager({ embedded = false, adminVerified = false, contentType }: Props) {
  const { user, loading: authLoading } = useAuth();
  const initialType = contentType || "blog_article";
  const [checking, setChecking] = React.useState(!embedded);
  const [isAdmin, setIsAdmin] = React.useState(embedded && adminVerified);
  const [aal2, setAal2] = React.useState(embedded && adminVerified);
  const [factorId, setFactorId] = React.useState("");
  const [totpCode, setTotpCode] = React.useState("");
  const [items, setItems] = React.useState<FrontendContentRecord[]>([]);
  const [filterType, setFilterType] = React.useState<FrontendContentType>(initialType);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [draft, setDraft] = React.useState<FrontendContentDraft>(() => makeDraft(initialType));
  const [busy, setBusy] = React.useState("");
  const [vertexTopic, setVertexTopic] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [error, setError] = React.useState("");

  const refreshItems = React.useCallback(async () => setItems(await loadAllFrontendContent()), []);

  React.useEffect(() => {
    if (embedded) {
      setChecking(false);
      setIsAdmin(adminVerified);
      setAal2(adminVerified);
      if (adminVerified) void refreshItems().catch((accessError) => setError(accessError instanceof Error ? accessError.message : "Could not load content."));
      return;
    }
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
        setIsAdmin(adminData === true);
        setAal2(assurance.currentLevel === "aal2");
        setFactorId(factors.totp.find((factor) => factor.status === "verified")?.id || "");
        if (adminData === true && assurance.currentLevel === "aal2") await refreshItems();
      } catch (accessError) {
        if (!cancelled) setError(accessError instanceof Error ? accessError.message : "Could not verify admin access.");
      } finally {
        if (!cancelled) setChecking(false);
      }
    };
    void check();
    return () => {
      cancelled = true;
    };
  }, [adminVerified, authLoading, embedded, refreshItems, user]);

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
      await refreshItems();
    } catch (verifyError) {
      setError(verifyError instanceof Error ? verifyError.message : "TOTP verification failed.");
    } finally {
      setBusy("");
    }
  };

  const landingTeaser = React.useMemo(
    () => items.find((item) => item.content_type === "video_teaser" && item.slug === LANDING_SLUG) || items.find((item) => item.content_type === "video_teaser" && item.published),
    [items],
  );

  React.useEffect(() => {
    if (!contentType) return;
    setFilterType(contentType);
    if (contentType === "video_teaser" && landingTeaser) {
      setSelectedId(landingTeaser.id);
      setDraft(toDraft(landingTeaser));
    } else {
      setSelectedId(null);
      setDraft(makeDraft(contentType));
    }
    setError("");
  }, [contentType, landingTeaser]);

  const saveLandingCount = async (show: boolean) => {
    if (!user || !aal2 || !isAdmin) return;
    setBusy("landing");
    setError("");
    setMessage("");
    try {
      if (landingTeaser) {
        const saved = await updateFrontendContent(landingTeaser.id, {
          slug: LANDING_SLUG,
          published: true,
          metadata: { ...landingTeaser.metadata, show_active_app_count: show },
        });
        if (selectedId === landingTeaser.id) setDraft(toDraft(saved));
      } else {
        await createFrontendContent({ ...makeDraft("video_teaser"), metadata: { show_active_app_count: show } }, user.id);
      }
      await refreshItems();
      setMessage("Landing page updated.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not update landing page.");
    } finally {
      setBusy("");
    }
  };

  const visible = items.filter((item) => item.content_type === filterType && (filterType !== "video_teaser" || item.slug === LANDING_SLUG || item === landingTeaser));
  const flash = (text: string) => {
    setMessage(text);
    window.setTimeout(() => setMessage(""), 1800);
  };
  const selectItem = (item: FrontendContentRecord) => {
    setSelectedId(item.id);
    setDraft(toDraft(item));
    setFilterType(item.content_type);
    setError("");
  };
  const newItem = () => {
    if (filterType === "video_teaser" && landingTeaser) {
      selectItem(landingTeaser);
      return;
    }
    setSelectedId(null);
    setDraft(makeDraft(filterType));
    setError("");
  };

  const persistDraft = async (publishOverride?: boolean) => {
    if (!user || !aal2) return null;
    const isLanding = draft.content_type === "video_teaser";
    const slug = isLanding ? LANDING_SLUG : cleanSlug(draft.slug || draft.title);
    if (!slug || !draft.title.trim()) {
      setError("Title and slug are required.");
      return null;
    }
    const cleanDraft: FrontendContentDraft = {
      ...draft,
      slug,
      title: draft.title.trim(),
      summary: draft.summary?.trim() || null,
      body: draft.body?.trim() || null,
      image_url: draft.image_url?.trim() || null,
      video_url: draft.video_url?.trim() || null,
      app_route: draft.app_route?.trim() || null,
      published: isLanding ? true : (publishOverride ?? draft.published),
      sort_order: Number(draft.sort_order) || 0,
    };
    const targetId = selectedId || (isLanding ? landingTeaser?.id || null : null);
    const saved = targetId ? await updateFrontendContent(targetId, cleanDraft) : await createFrontendContent(cleanDraft, user.id);
    await refreshItems();
    setSelectedId(saved.id);
    setDraft(toDraft(saved));
    return saved;
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy("save");
    setError("");
    try {
      const saved = await persistDraft();
      if (saved) flash(draft.content_type === "video_teaser" ? "Landing walkthrough saved and published." : "Saved.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not save content.");
    } finally {
      setBusy("");
    }
  };

  const publishBlog = async () => {
    if (draft.content_type !== "blog_article") return;
    setBusy("publish");
    setError("");
    try {
      const saved = await persistDraft(true);
      if (saved) flash("Blog article published.");
    } catch (publishError) {
      setError(publishError instanceof Error ? publishError.message : "Could not publish article.");
    } finally {
      setBusy("");
    }
  };

  const remove = async () => {
    if (!selectedId || !confirm("Delete this content item?")) return;
    setBusy("delete");
    try {
      await deleteFrontendContent(selectedId);
      await refreshItems();
      setSelectedId(null);
      setDraft(makeDraft(filterType));
      flash("Deleted.");
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Could not delete content.");
    } finally {
      setBusy("");
    }
  };

  const uploadMedia = async (file: File) => {
    if (!user) return;
    setBusy("upload");
    try {
      const uploaded = await uploadFrontendContentMedia(file, user.id);
      setDraft((current) => (uploaded.kind === "image" ? { ...current, image_url: uploaded.url } : { ...current, video_url: uploaded.url }));
      flash("Media uploaded.");
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Upload failed.");
    } finally {
      setBusy("");
    }
  };

  const draftWithVertex = async (publish = false) => {
    if (!user) return;
    const topic = vertexTopic.trim() || draft.title.trim();
    if (!topic) {
      setError("Add a topic or title first.");
      return;
    }
    setBusy("vertex");
    setError("");
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) throw new Error("Authenticated session unavailable.");
      const response = await fetch("/api/admin-article-vertex", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ topic, context: [draft.summary, draft.body, draft.app_route].filter(Boolean).join("\n\n").slice(0, 2500) }) });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Vertex draft failed.");
      const article = payload.article || {};
      const generated: FrontendContentDraft = {
        ...draft,
        title: String(article.title || draft.title),
        slug: cleanSlug(String(article.title || draft.slug || topic)),
        summary: String(article.summary || draft.summary || ""),
        body: String(article.body || draft.body || ""),
        app_route: String(article.app_route || draft.app_route || ""),
        metadata: typeof article.metadata === "object" && article.metadata ? article.metadata : draft.metadata,
        published: publish || draft.published,
      };
      setDraft(generated);
      if (publish) {
        const saved = selectedId ? await updateFrontendContent(selectedId, generated) : await createFrontendContent(generated, user.id);
        await refreshItems();
        setSelectedId(saved.id);
        setDraft(toDraft(saved));
        flash(`Vertex article published${payload.model ? ` · ${payload.model}` : ""}.`);
      } else flash(`Vertex draft loaded${payload.model ? ` · ${payload.model}` : ""}. Review it, then Save or Publish.`);
    } catch (vertexError) {
      setError(vertexError instanceof Error ? vertexError.message : "Vertex draft failed.");
    } finally {
      setBusy("");
    }
  };

  if (!embedded && (checking || authLoading))
    return (
      <div className="flex min-h-[35vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  if (!user)
    return (
      <div className="rounded-xl border border-border/70 p-4 text-center">
        <ShieldCheck className="mx-auto h-9 w-9" />
        <h2 className="mt-4 text-lg font-semibold">Admin sign-in required</h2>
        <Link to="/login" className="mt-4 inline-flex text-sm underline">
          Sign in
        </Link>
      </div>
    );
  if (!isAdmin)
    return (
      <div className="rounded-xl border border-border/70 p-4 text-center">
        <ShieldCheck className="mx-auto h-9 w-9" />
        <h2 className="mt-4 text-lg font-semibold">Admin only</h2>
      </div>
    );
  if (!aal2)
    return (
      <div className="rounded-xl border border-border/70 p-4">
        <KeyRound className="h-7 w-7" />
        <h2 className="mt-4 text-lg font-semibold">Verify TOTP</h2>
        {factorId ? (
          <form onSubmit={verifyTotp} className="mt-4 flex max-w-md gap-2">
            <Input value={totpCode} onChange={(event) => setTotpCode(event.target.value.replace(/\D/g, "").slice(0, 8))} inputMode="numeric" className="h-9 min-w-0 flex-1 rounded-xl border border-input bg-background px-4" placeholder="Authenticator code" />
            <Button disabled={busy === "totp" || !totpCode} className="rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground">
              Verify
            </Button>
          </form>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">Enroll TOTP in Settings → Security first.</p>
        )}
      </div>
    );

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold">{filterType === "blog_article" ? "Blog content" : "Landing content"}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{filterType === "blog_article" ? "Draft and publish public blog articles." : "Manage the public landing page walkthrough and presentation."}</p>
        </div>
        <div className="inline-flex items-center gap-2 text-sm text-success dark:text-success">
          <CheckCircle2 className="h-4 w-4" /> Admin · TOTP
        </div>
      </div>
      {!contentType && (
        <div className="flex flex-wrap gap-2">
          {MANAGED_TYPES.map((type) => (
            <Button
              key={type}
              onClick={() => {
                setFilterType(type);
                setSelectedId(null);
                setDraft(type === "video_teaser" && landingTeaser ? toDraft(landingTeaser) : makeDraft(type));
                if (type === "video_teaser" && landingTeaser) setSelectedId(landingTeaser.id);
              }}
              className={`rounded-xl px-4 py-2 text-sm font-medium ${filterType === type ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              {type === "blog_article" ? "Blog" : "Landing"}
            </Button>
          ))}
        </div>
      )}
      {message && <div className="rounded-xl border border-success/25 bg-success/5 p-2 text-sm text-success dark:text-success">{message}</div>}
      {error && <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-2 text-sm text-destructive">{error}</div>}

      {filterType === "video_teaser" && (
        <section className="rounded-xl border border-border/70 p-4" aria-label="Landing page presentation">
          <h3 className="text-sm font-semibold">Landing page</h3>
          <label className="mt-4 flex items-center gap-4 text-sm">
            <Input type="checkbox" checked={landingTeaser?.metadata.show_active_app_count !== false} disabled={Boolean(busy)} onChange={(event) => void saveLandingCount(event.target.checked)} />
            Show active app count and open-source row
          </label>
          <p className="mt-2 text-sm text-muted-foreground">Applies to the public landing and sign-in pages. Changes save immediately.</p>
        </section>
      )}
      <div className="grid gap-4 xl:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="rounded-xl border border-border/70 bg-background/40 p-4">
          <Button onClick={newItem} className="flex h-9 w-full items-center justify-center gap-2 rounded-xl border border-border/70 text-sm font-semibold hover:bg-accent">
            <Plus className="h-4 w-4" /> {filterType === "video_teaser" && landingTeaser ? "Open walkthrough" : "New"}
          </Button>
          <div className="mt-4 space-y-2">
            {visible.map((item) => (
              <Button key={item.id} onClick={() => selectItem(item)} className={`w-full rounded-xl border p-4 text-left ${selectedId === item.id ? "border-foreground/30 bg-accent/50" : "border-border/60 hover:bg-accent/25"}`}>
                <div className="truncate text-sm font-medium">{item.title}</div>
                <div className="mt-2 truncate text-sm text-muted-foreground">{item.slug}</div>
              </Button>
            ))}
            {!visible.length && <div className="p-4 text-center text-sm text-muted-foreground">No items.</div>}
          </div>
        </aside>

        <section className="rounded-xl border border-border/70 bg-background/40 p-4 sm:p-4">
          {draft.content_type === "blog_article" && (
            <div className="mb-4 rounded-xl border border-border/70 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Sparkles className="h-4 w-4" /> Vertex writing
              </div>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <Input value={vertexTopic} onChange={(event) => setVertexTopic(event.target.value)} className="h-9 min-w-0 flex-1 rounded-xl border border-input bg-background px-4 text-sm" placeholder="Topic" />
                <Button type="button" onClick={() => void draftWithVertex(false)} disabled={busy === "vertex"} className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-border px-4 text-sm font-semibold hover:bg-accent">
                  {busy === "vertex" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Generate draft
                </Button>
                <Button type="button" onClick={() => void draftWithVertex(true)} disabled={busy === "vertex"} className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground">
                  <CheckCircle2 className="h-4 w-4" /> Generate & publish
                </Button>
              </div>
            </div>
          )}
          <form onSubmit={save} className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">{draft.content_type === "video_teaser" ? "Landing walkthrough" : selectedId ? "Edit article" : "New article"}</h3>
              {selectedId && draft.content_type === "blog_article" && (
                <Button type="button" onClick={newItem} className="rounded-xl p-2 text-muted-foreground hover:bg-accent">
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="text-sm font-medium text-muted-foreground">
                Title
                <Input value={draft.title} onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))} className="mt-2 h-9 w-full rounded-xl border border-input bg-background px-4 text-sm text-foreground" />
              </label>
              <label className="text-sm font-medium text-muted-foreground">
                Slug
                <Input
                  value={draft.slug}
                  disabled={draft.content_type === "video_teaser"}
                  onChange={(event) => setDraft((current) => ({ ...current, slug: event.target.value }))}
                  className="mt-2 h-9 w-full rounded-xl border border-input bg-background px-4 text-sm text-foreground disabled:opacity-60"
                  placeholder="article-slug"
                />
              </label>
            </div>
            <div className="text-sm font-medium text-muted-foreground">
              <div className="flex items-center justify-between">
                <label htmlFor="admin-content-summary">Summary</label>
                {draft.content_type === "blog_article" && (
                  <Button type="button" onClick={() => setDraft((current) => ({ ...current, summary: generateSummary(current.body, current.title) }))} className="text-sm text-foreground hover:underline">
                    Generate
                  </Button>
                )}
              </div>
              <Textarea id="admin-content-summary" value={draft.summary || ""} onChange={(event) => setDraft((current) => ({ ...current, summary: event.target.value }))} rows={2} className="mt-2 w-full rounded-xl border border-input bg-background p-4 text-sm text-foreground" />
            </div>
            {draft.content_type === "blog_article" && (
              <label className="block text-sm font-medium text-muted-foreground">
                Body (Markdown)
                <Textarea value={draft.body || ""} onChange={(event) => setDraft((current) => ({ ...current, body: event.target.value }))} rows={14} className="mt-2 w-full rounded-xl border border-input bg-background p-4 text-sm text-foreground" />
              </label>
            )}
            <div className="grid gap-4 md:grid-cols-2">
              <label className="text-sm font-medium text-muted-foreground">
                Image URL
                <Input value={draft.image_url || ""} onChange={(event) => setDraft((current) => ({ ...current, image_url: event.target.value }))} className="mt-2 h-9 w-full rounded-xl border border-input bg-background px-4 text-sm text-foreground" />
              </label>
              <label className="text-sm font-medium text-muted-foreground">
                Video URL
                <Input value={draft.video_url || ""} onChange={(event) => setDraft((current) => ({ ...current, video_url: event.target.value }))} className="mt-2 h-9 w-full rounded-xl border border-input bg-background px-4 text-sm text-foreground" />
              </label>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <FileButton
                accept="image/*,video/*"
                disabled={busy === "upload"}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void uploadMedia(file);
                  event.currentTarget.value = "";
                }}
              >
                <Upload className="h-4 w-4" />
                {busy === "upload" ? "Uploading…" : "Upload media"}
              </FileButton>
              {draft.content_type === "blog_article" && (
                <label className="inline-flex items-center gap-2 text-sm">
                  <Input type="checkbox" checked={draft.published} onChange={(event) => setDraft((current) => ({ ...current, published: event.target.checked }))} /> Published
                </label>
              )}
              <Button type="submit" disabled={busy === "save"} className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-semibold hover:bg-accent">
                <Save className="h-4 w-4" /> {draft.content_type === "video_teaser" ? "Save landing video" : "Save draft"}
              </Button>
              {draft.content_type === "blog_article" && (
                <Button type="button" onClick={() => void publishBlog()} disabled={busy === "publish"} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
                  <CheckCircle2 className="h-4 w-4" /> Publish
                </Button>
              )}
              {selectedId && draft.content_type === "blog_article" && (
                <Button type="button" onClick={() => void remove()} className="inline-flex items-center gap-2 rounded-xl border border-destructive/30 px-4 py-2 text-sm font-semibold text-destructive hover:bg-destructive/5">
                  <Trash2 className="h-4 w-4" /> Delete
                </Button>
              )}
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
