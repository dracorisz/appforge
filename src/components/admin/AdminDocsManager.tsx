import React from "react";
import { CheckCircle2, Plus, Save, Trash2 } from "lucide-react";
import { useAuth } from "@/auth/AuthProvider";
import { Button, Input, Textarea } from "@/components/ui";
import { createFrontendContent, deleteFrontendContent, loadAllFrontendContent, updateFrontendContent, type FrontendContentDraft, type FrontendContentRecord } from "@/lib/frontendContent";

const cleanSlug = (value: string) => value.toLowerCase().trim().replace(/\.md$/i, "").replace(/[^a-z0-9/_-]+/g, "-").replace(/-+/g, "-").replace(/^[-/]+|[-/]+$/g, "") || "index";
const makeDraft = (): FrontendContentDraft => ({ content_type: "docs_page", slug: "", title: "", summary: "", body: "", image_url: "", video_url: "", app_route: "", published: true, sort_order: 0, metadata: {} });
const toDraft = (item: FrontendContentRecord): FrontendContentDraft => ({ content_type: "docs_page", slug: item.slug, title: item.title, summary: item.summary || "", body: item.body || "", image_url: "", video_url: "", app_route: "", published: item.published, sort_order: item.sort_order, metadata: item.metadata || {} });

export function AdminDocsManager() {
  const { user } = useAuth();
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
    void refresh().catch((loadError) => setError(loadError instanceof Error ? loadError.message : "Could not load documentation pages."));
  }, [refresh]);

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
    if (!user) return;
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
      const payload: FrontendContentDraft = {
        ...draft,
        content_type: "docs_page",
        title,
        slug,
        summary: draft.summary?.trim() || null,
        body: draft.body || "",
        image_url: null,
        video_url: null,
        app_route: null,
        sort_order: Number(draft.sort_order) || 0,
      };
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

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold">Documentation content</h2>
          <p className="mt-2 text-sm text-muted-foreground">Edit the database-backed pages served on the documentation site.</p>
        </div>
        <div className="inline-flex items-center gap-2 text-sm text-success"><CheckCircle2 className="h-4 w-4" /> Admin · TOTP</div>
      </div>
      {message && <div className="rounded-xl border border-success/25 bg-success/5 p-2 text-sm text-success">{message}</div>}
      {error && <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-2 text-sm text-destructive">{error}</div>}
      <div className="grid gap-4 xl:grid-cols-[280px_minmax(0,1fr)]">
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
            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={busy === "save"} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"><Save className="h-4 w-4" /> Save</Button>
              {selectedId && <Button type="button" onClick={() => void remove()} disabled={busy === "delete"} className="inline-flex items-center gap-2 rounded-xl border border-destructive/30 px-4 py-2 text-sm font-semibold text-destructive hover:bg-destructive/5"><Trash2 className="h-4 w-4" /> Delete</Button>}
              <a href="https://docs.sstoken.space/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center rounded-xl border border-border/70 px-4 py-2 text-sm font-semibold hover:bg-accent">View docs</a>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
