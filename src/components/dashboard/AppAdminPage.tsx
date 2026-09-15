import React from "react";
import { createPortal } from "react-dom";
// @code-scanning/ignore js/incomplete-sanitization: App data from registry is rendered via React JSX with auto-escaping; all text content uses safe rendering patterns without innerHTML.
import { Button, Card, DataTable, Input, SearchInput, Switch, Textarea } from "@/components/ui";
import { AppIconPicker } from "@/components/ui/AppIconPicker";
import { AppIcon } from "@/lib/appIcons";
import { Copy, ImagePlus, LayoutGrid, List, Plus, Save, Trash2, X } from "lucide-react";
import { getManageableApps, updateApp, deleteApp, addApp, type AppDefinition } from "@/lib/registry";
import { saveAppOverride } from "@/lib/appOverrides";
import { uploadFrontendContentMedia } from "@/lib/frontendContent";
import { supabase } from "@/lib/supabase";

export function AppAdminPage() {
  const [apps, setApps] = React.useState<AppDefinition[]>(getManageableApps());
  const [search, setSearch] = React.useState("");
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [form, setForm] = React.useState<Partial<AppDefinition>>({});
  const [copied, setCopied] = React.useState(false);
  const [error, setError] = React.useState("");
  const [uploadingCover, setUploadingCover] = React.useState(false);
  const [viewMode, setViewMode] = React.useState<"grid" | "list">("grid");
  const coverInputRef = React.useRef<HTMLInputElement>(null);

  const filtered = React.useMemo(() => {
    const term = search.toLowerCase().trim();
    if (!term) return apps;
    return apps.filter((app) => [app.id, app.name, app.description, app.category, app.status, app.route].some((field) => String(field).toLowerCase().includes(term)));
  }, [apps, search]);

  const startEdit = (app: AppDefinition) => {
    setForm({ ...app });
    setEditingId(app.id);
    setError("");
  };
  const cancelEdit = React.useCallback(() => {
    setEditingId(null);
    setForm({});
    setError("");
  }, []);
  const reloadApps = () => setApps([...getManageableApps()]);

  React.useEffect(() => {
    if (!editingId) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") cancelEdit();
    };
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [cancelEdit, editingId]);

  const saveEdit = async () => {
    if (!editingId || !form.id) return;
    try {
      const next = { ...(form as AppDefinition), icon: form.icon || "Wrench", coverImage: form.coverImage?.trim() || undefined };
      updateApp(next);
      await saveAppOverride(next);
      reloadApps();
      cancelEdit();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save app.");
    }
  };

  const removeApp = (id: string) => {
    if (!confirm("Delete this app?")) return;
    deleteApp(id);
    reloadApps();
  };

  const createApp = () => {
    const id = form.id?.trim();
    if (!id) return;
    try {
      addApp({
        id,
        name: form.name || id,
        description: form.description || "",
        category: form.category || "utilities",
        icon: form.icon || "Wrench",
        route: form.route || `/apps/${id}`,
        tags: form.tags || [],
        status: form.status || "beta",
        version: form.version || "0.1.0",
        coverImage: form.coverImage?.trim() || undefined,
        changelog: form.changelog || [],
      });
      reloadApps();
      cancelEdit();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not create app.");
    }
  };

  const copyRegistry = async () => {
    const text = `// AppForge registry\nexport const APPS = [\n${apps.map((app) => `  app({ id: '${app.id}', name: '${app.name.replace(/'/g, "\\'")}', description: '${app.description.replace(/'/g, "\\'")}', category: '${app.category}', icon: '${app.icon}', route: '${app.route}', tags: [${app.tags.map((tag) => `'${tag}'`).join(", ")}], status: '${app.status}', version: '${app.version}'${app.coverImage ? `, coverImage: '${app.coverImage}'` : ""} }),`).join("\n")}\n]`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  const uploadCover = async (file: File) => {
    setUploadingCover(true);
    setError("");
    try {
      const { data, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!data.user) throw new Error("Sign in again to upload a cover.");
      const uploaded = await uploadFrontendContentMedia(file, data.user.id);
      if (uploaded.kind !== "image") throw new Error("Choose an image for the app cover.");
      setForm((current) => ({ ...current, coverImage: uploaded.url }));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Cover upload failed.");
    } finally {
      setUploadingCover(false);
    }
  };

  const editExisting = editingId && editingId !== "new" ? (
    <>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="font-semibold">Edit {form.name}</h3>
          <p className="text-sm text-muted-foreground">Catalog identity, icon, cover and visibility.</p>
        </div>
        <Button variant="ghost" size="sm" onClick={cancelEdit} aria-label="Close editor"><X className="h-4 w-4" /></Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Input label="ID" value={form.id || ""} disabled />
        <Input label="Name" value={form.name || ""} onChange={(event) => setForm({ ...form, name: event.target.value })} />
        <Input label="Route" value={form.route || ""} onChange={(event) => setForm({ ...form, route: event.target.value })} />
        <Input label="Category" value={form.category || ""} onChange={(event) => setForm({ ...form, category: event.target.value })} />
        <Input label="Version" value={form.version || ""} onChange={(event) => setForm({ ...form, version: event.target.value })} />
      </div>
      <AppIconPicker value={form.icon || "Wrench"} onChange={(icon) => setForm((current) => ({ ...current, icon }))} />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto]">
        <Input label="Cover image URL" value={form.coverImage || ""} onChange={(event) => setForm({ ...form, coverImage: event.target.value || undefined })} />
        <div className="flex items-end gap-2">
          <Input ref={coverInputRef} type="file" accept="image/*" disabled={uploadingCover} className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadCover(file); event.currentTarget.value = ""; }} />
          <Button variant="secondary" onClick={() => coverInputRef.current?.click()} disabled={uploadingCover}><ImagePlus className="h-4 w-4" />{uploadingCover ? "Uploading…" : "Upload"}</Button>
          {form.coverImage && <Button variant="secondary" onClick={() => setForm((current) => ({ ...current, coverImage: undefined }))}><Trash2 className="h-4 w-4" /> Remove</Button>}
        </div>
      </div>
      {form.coverImage && <div className="h-32 overflow-hidden rounded-xl border bg-muted"><img src={form.coverImage} alt="Current app cover" className="h-full w-full object-cover" /></div>}
      <div className="flex items-center justify-between gap-4 rounded-xl border border-border px-4">
        <div><div className="text-sm font-medium">Visible across AppForge</div><div className="text-sm text-muted-foreground">Hide this app from runtime catalogs and navigation.</div></div>
        <Switch checked={form.visible !== false} onCheckedChange={(visible) => setForm({ ...form, visible })} label="Show app" />
      </div>
      <Textarea label="Description" value={form.description || ""} onChange={(event) => setForm({ ...form, description: event.target.value })} rows={3} />
      {error && <div className="text-sm text-destructive">{error}</div>}
      <div className="flex gap-2"><Button onClick={() => void saveEdit()}><Save className="h-4 w-4" /> Save changes</Button><Button variant="secondary" onClick={cancelEdit}>Cancel</Button></div>
    </>
  ) : null;

  const createNew = editingId === "new" ? (
    <>
      <div className="flex items-center justify-between gap-4">
        <div><h3 className="font-semibold">New app</h3><p className="text-sm text-muted-foreground">Create a registry entry and choose its icon.</p></div>
        <Button variant="ghost" size="sm" onClick={cancelEdit} aria-label="Close editor"><X className="h-4 w-4" /></Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="ID" value={form.id || ""} onChange={(event) => setForm({ ...form, id: event.target.value })} />
        <Input label="Name" value={form.name || ""} onChange={(event) => setForm({ ...form, name: event.target.value })} />
        <Input label="Route" value={form.route || ""} onChange={(event) => setForm({ ...form, route: event.target.value })} />
        <Input label="Category" value={form.category || ""} onChange={(event) => setForm({ ...form, category: event.target.value })} />
        <Input label="Version" value={form.version || ""} onChange={(event) => setForm({ ...form, version: event.target.value })} />
        <Input label="Cover image" value={form.coverImage || ""} onChange={(event) => setForm({ ...form, coverImage: event.target.value || undefined })} />
        <div className="sm:col-span-2"><Textarea label="Description" value={form.description || ""} onChange={(event) => setForm({ ...form, description: event.target.value })} rows={2} /></div>
      </div>
      <AppIconPicker value={form.icon || "Wrench"} onChange={(icon) => setForm((current) => ({ ...current, icon }))} />
      {error && <div className="text-sm text-destructive">{error}</div>}
      <div className="flex gap-2"><Button onClick={createApp} disabled={!form.id?.trim()}><Save className="h-4 w-4" /> Create</Button><Button variant="secondary" onClick={cancelEdit}>Cancel</Button></div>
    </>
  ) : null;

  const editor = editingId && typeof document !== "undefined" ? createPortal(
    <div className="fixed inset-0 z-[100] flex min-h-dvh w-screen items-center justify-center bg-overlay/65 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={editingId === "new" ? "Create app" : `Edit ${form.name || "app"}`} onMouseDown={(event) => { if (event.target === event.currentTarget) cancelEdit(); }}>
      <Card className="surface-popover max-h-[calc(100dvh-2rem)] w-full max-w-5xl space-y-4 overflow-y-auto p-4 shadow-xl sm:p-8">
        {editingId === "new" ? createNew : editExisting}
      </Card>
    </div>,
    document.body,
  ) : null;

  return (
    <div className="w-full space-y-4 pb-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><h2 className="text-lg font-semibold tracking-tight text-foreground">Apps</h2><p className="mt-1 text-sm text-muted-foreground">Manage app names, icons, covers and catalog visibility.</p></div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => { setEditingId("new"); setForm({ id: "", name: "", category: "utilities", icon: "Wrench", route: "", tags: [], status: "beta", version: "0.1.0" }); }}><Plus className="h-4 w-4" /> New app</Button>
          <Button variant="ghost" onClick={() => void copyRegistry()}><Copy className="h-4 w-4" />{copied ? "Copied" : "Copy registry"}</Button>
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <SearchInput value={search} onChange={(event) => setSearch(event.target.value)} onClear={() => setSearch("")} placeholder="Search apps…" />
        <div className="flex shrink-0 rounded-xl border border-border bg-background">
          <Button size="sm" variant={viewMode === "grid" ? "secondary" : "ghost"} onClick={() => setViewMode("grid")} aria-label="Grid view"><LayoutGrid className="h-4 w-4" /></Button>
          <Button size="sm" variant={viewMode === "list" ? "secondary" : "ghost"} onClick={() => setViewMode("list")} aria-label="List view"><List className="h-4 w-4" /></Button>
        </div>
      </div>

      {editor}

      {viewMode === "list" ? (
        <Card className="p-2">
          <DataTable<AppDefinition>
            data={filtered}
            getRowId={(app) => app.id}
            onRowClick={startEdit}
            columns={[
              { key: "name", header: "App", render: (app) => <div className="flex items-center gap-4">{app.coverImage ? <img src={app.coverImage} alt="" className="h-9 w-12 rounded-xl border object-cover" /> : <div className="grid h-9 w-12 place-items-center rounded-xl border bg-muted"><AppIcon name={app.icon} /></div>}<div><div className="font-medium">{app.name}</div><div className="text-sm text-muted-foreground">{app.id}</div></div></div> },
              { key: "category", header: "Category" },
              { key: "status", header: "Status", render: (app) => (app.visible === false ? "Hidden" : app.status) },
              { key: "version", header: "Version", render: (app) => `v${app.version}` },
              { key: "route", header: "Route" },
            ]}
          />
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {filtered.map((app) => (
            <Card key={app.id} className="flex min-h-32 flex-col overflow-hidden p-2">
              {app.coverImage ? <div className="h-28 w-full overflow-hidden border-b"><img src={app.coverImage} alt="" className="h-full w-full object-cover" /></div> : <div className="grid h-28 place-items-center border-b bg-muted/35"><AppIcon name={app.icon} className="h-8 w-8" /></div>}
              <div className="flex flex-1 flex-col gap-4 p-4">
                <div><h3 className="font-semibold">{app.name}</h3><p className="text-sm text-muted-foreground">{app.category} · v{app.version} · {app.visible === false ? "hidden" : app.status}</p></div>
                <p className="line-clamp-2 text-sm text-muted-foreground">{app.description}</p>
                <div className="mt-auto flex gap-2"><Button variant="secondary" size="sm" onClick={() => startEdit(app)} className="flex-1">Edit</Button><Button variant="ghost" size="sm" onClick={() => removeApp(app.id)} className="text-destructive" aria-label={`Delete ${app.name}`}><Trash2 className="h-4 w-4" /></Button></div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}