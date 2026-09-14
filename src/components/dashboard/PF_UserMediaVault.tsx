import { AppHeading } from "@/components/layout/AppHeading";
import React from "react";
import { Camera, ChevronLeft, ChevronRight, Download, FileVideo, FileImage, FileText, Folder, FolderPlus, Gamepad2, Maximize2, PanelsTopLeft, Pencil, Play, RefreshCw, Search, Sparkles, Trash2, Upload, X } from "lucide-react";
import { Badge, Button, Card, Input, Select, Tabs } from "@/components/ui";
import { MediaShowbox } from "@/components/ui/MediaShowbox";
import { supabase } from "@/lib/supabase";
import { listVaultMedia, getVaultQuota, uploadVaultMediaWithProgress, deleteVaultMedia, updateVaultMedia, vaultItemUrl, vaultFolder, type VaultFolder, type VaultMedia } from "@/lib/mediaVault";

type UserFolder = { id: string; name: string };
type SortMode = "newest" | "oldest" | "name-asc" | "name-desc" | "size-desc" | "type";

const SYSTEM_FOLDERS: { id: VaultFolder | "all"; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "all", label: "All files", icon: Folder },
  { id: "general", label: "General", icon: Folder },
  { id: "desktop-buddies", label: "Desktop Buddies", icon: Sparkles },
  { id: "Screenshots", label: "Screenshots", icon: Camera },
  { id: "dragon-arena", label: "Story Studio", icon: Gamepad2 },
  { id: "getter-pro", label: "Getter Pro", icon: Search },
];
const RESERVED_FOLDERS = new Set(SYSTEM_FOLDERS.filter((item) => item.id !== "all").map((item) => String(item.id).toLowerCase()));

const kindIcon = (kind: VaultMedia["kind"]) => (kind === "video" ? FileVideo : kind === "image" ? FileImage : FileText);
const kindBadge = (kind: VaultMedia["kind"]) => <Badge color={kind === "video" ? "blue" : kind === "image" ? "green" : "slate"}>{kind}</Badge>;
const formatBytes = (bytes: number) => (bytes < 1024 ? `${bytes} B` : bytes < 1024 ** 2 ? `${(bytes / 1024).toFixed(1)} KB` : bytes < 1024 ** 3 ? `${(bytes / 1024 ** 2).toFixed(1)} MB` : `${(bytes / 1024 ** 3).toFixed(2)} GB`);
const sourceLabel = (item: VaultMedia) => (item.source_app === "getter-pro" || item.source_app === "scrapper-pro" ? "reference" : item.source_bucket === "dragon-arena-assets" ? "story asset" : item.size_bytes ? formatBytes(item.size_bytes) : "stored");
const metadataUrl = (item: VaultMedia, key: "media_url" | "thumbnail" | "original_url") => (typeof item.metadata?.[key] === "string" && String(item.metadata[key]).trim() ? String(item.metadata[key]).trim() : null);
const uniqueUrls = (values: Array<string | null | undefined>) => [...new Set(values.filter((value): value is string => Boolean(value)))];
const isPinnedAsset = (item: VaultMedia) => item.metadata?.source_table === "dragon_arena_assets" || vaultFolder(item) === "desktop-buddies";
const youtubeId = (value: string | null | undefined) => {
  if (!value) return "";
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    if (host === "youtu.be") return url.pathname.split("/")[1]?.slice(0, 11) || "";
    if (host === "youtube.com" || host === "m.youtube.com" || host === "youtube-nocookie.com") return (url.searchParams.get("v") || url.pathname.match(/^\/(?:shorts|embed)\/([^/]+)/)?.[1] || "").slice(0, 11);
  } catch {
    return "";
  }
  return "";
};

const VaultThumb = ({ item }: { item: VaultMedia }) => {
  const [urls, setUrls] = React.useState<string[]>([]);
  const [urlIndex, setUrlIndex] = React.useState(0);
  React.useEffect(() => {
    let cancelled = false;
    setUrls([]);
    setUrlIndex(0);
    void vaultItemUrl(item)
      .then((primary) => {
        if (!cancelled) setUrls(item.source_bucket === "external" ? uniqueUrls([primary, metadataUrl(item, "media_url"), metadataUrl(item, "thumbnail")]) : uniqueUrls([primary]));
      })
      .catch(() => {
        if (!cancelled && item.source_bucket === "external") setUrls(uniqueUrls([metadataUrl(item, "media_url"), metadataUrl(item, "thumbnail")]));
      });
    return () => {
      cancelled = true;
    };
  }, [item]);
  const Icon = kindIcon(item.kind);
  const url = urls[urlIndex] || null;
  const ytId = item.kind === "video" ? youtubeId(item.source_ref) || youtubeId(metadataUrl(item, "original_url")) || youtubeId(url) : "";
  if (item.kind === "image" && url) return <img src={url} alt={item.title || item.file_name || ""} loading="lazy" onError={() => setUrlIndex((index) => index + 1)} className="h-full w-full object-cover" />;
  if (item.kind === "video" && ytId)
    return (
      <>
        <img src={metadataUrl(item, "thumbnail") || `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg`} alt={item.title || "YouTube video"} loading="lazy" className="h-full w-full object-cover" />
        <span className="absolute left-1/2 top-1/2 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-xl border border-inverse/20 bg-overlay/55 text-inverse">
          <Play className="ml-2 h-5 w-5" />
        </span>
      </>
    );
  if (item.kind === "video" && url)
    return (
      <>
        <video src={url} muted preload="metadata" className="h-full w-full object-cover" />
        <span className="absolute left-1/2 top-1/2 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-xl border border-inverse/20 bg-overlay/55 text-inverse">
          <Play className="ml-2 h-5 w-5" />
        </span>
      </>
    );
  return (
    <div className="flex h-full items-center justify-center text-5xl text-muted-foreground">
      <Icon />
    </div>
  );
};

const VaultActions = ({ item, onPreview, onDelete }: { item: VaultMedia; onPreview: () => void; onDelete: () => void }) => {
  const [downloadUrl, setDownloadUrl] = React.useState("#");
  React.useEffect(() => {
    let cancelled = false;
    if (item.source_bucket === "external") setDownloadUrl(metadataUrl(item, "original_url") || item.external_url || "#");
    else
      void vaultItemUrl(item)
        .then((value) => {
          if (!cancelled && value) setDownloadUrl(value);
        })
        .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [item]);
  const cls = "rounded-xl border border-border/60 p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground";
  return (
    <div className="flex items-center gap-2">
      <Button onClick={onPreview} className={cls} aria-label="Preview">
        <Maximize2 className="h-4 w-4" />
      </Button>
      <a href={downloadUrl} download={item.source_bucket !== "external"} target={item.source_bucket === "external" ? "_blank" : undefined} rel={item.source_bucket === "external" ? "noreferrer" : undefined} className={cls} aria-label="Download or open source">
        <Download className="h-4 w-4" />
      </a>
      <Button onClick={onDelete} className={`${cls} hover:border-destructive/40 hover:text-destructive`} aria-label="Delete">
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
};

export function PF_UserMediaVault() {
  const [media, setMedia] = React.useState<VaultMedia[]>([]);
  const [userFolders, setUserFolders] = React.useState<UserFolder[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [filterKind, setFilterKind] = React.useState<VaultMedia["kind"] | "all">("all");
  const [folder, setFolder] = React.useState<VaultFolder | "all">("all");
  const [viewMode, setViewMode] = React.useState<"grid" | "list" | "showcase">("grid");
  const [sortMode, setSortMode] = React.useState<SortMode>("newest");
  const [newFolder, setNewFolder] = React.useState("");
  const [uploading, setUploading] = React.useState(false);
  const [uploadProgress, setUploadProgress] = React.useState<Record<string, number>>({});
  const [error, setError] = React.useState("");
  const [quota, setQuota] = React.useState({ quota_bytes: 0, used_bytes: 0, remaining_bytes: 0 });
  const [preview, setPreview] = React.useState<{ item: VaultMedia; url: string; fallbacks: string[] } | null>(null);
  const uploadInputRef = React.useRef<HTMLInputElement | null>(null);

  const loadFolders = React.useCallback(async () => {
    const { data, error: folderError } = await supabase.from("user_media_folders").select("id,name").order("name");
    if (folderError) throw folderError;
    setUserFolders((data || []) as UserFolder[]);
  }, []);

  const refresh = React.useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [items, nextQuota] = await Promise.all([listVaultMedia(filterKind === "all" ? undefined : filterKind, folder === "all" ? undefined : folder), getVaultQuota(), loadFolders()]);
      setMedia(items);
      setQuota(nextQuota);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load Media Vault.");
    } finally {
      setLoading(false);
    }
  }, [filterKind, folder, loadFolders]);

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  const cleanFolderName = (value: string) => value.trim().replace(/\s+/g, " ").slice(0, 60);
  const validateFolderName = (name: string, current?: string) => {
    if (!name) return "Folder name is required.";
    if (RESERVED_FOLDERS.has(name.toLowerCase())) return "That name is reserved for an AppForge folder.";
    if (userFolders.some((item) => item.name.toLowerCase() === name.toLowerCase() && item.name !== current)) return "A folder with that name already exists.";
    return "";
  };

  const createFolder = async () => {
    const name = cleanFolderName(newFolder);
    const validation = validateFolderName(name);
    if (validation) {
      setError(validation);
      return;
    }
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      setError("Sign in to create a folder.");
      return;
    }
    const { error: createError } = await supabase.from("user_media_folders").insert({ user_id: auth.user.id, name });
    if (createError) {
      setError(createError.code === "23505" ? "A folder with that name already exists." : createError.message);
      return;
    }
    setNewFolder("");
    await loadFolders();
    setFolder(name);
  };

  const renameFolder = async (entry: UserFolder) => {
    const requested = window.prompt("Rename folder", entry.name);
    if (requested === null) return;
    const name = cleanFolderName(requested);
    const validation = validateFolderName(name, entry.name);
    if (validation) {
      setError(validation);
      return;
    }
    if (name === entry.name) return;
    setError("");
    try {
      const { data: rows, error: rowsError } = await supabase.from("user_media_vault").select("id,metadata").contains("metadata", { folder: entry.name });
      if (rowsError) throw rowsError;
      for (const row of rows || []) {
        const metadata = row.metadata && typeof row.metadata === "object" ? (row.metadata as Record<string, unknown>) : {};
        await updateVaultMedia(String(row.id), { metadata: { ...metadata, folder: name } });
      }
      const { error: renameError } = await supabase.from("user_media_folders").update({ name }).eq("id", entry.id);
      if (renameError) throw renameError;
      await loadFolders();
      if (folder === entry.name) setFolder(name);
    } catch (renameError) {
      setError(renameError instanceof Error ? renameError.message : "Could not rename folder.");
    }
  };

  const deleteFolder = async (entry: UserFolder) => {
    if (!confirm(`Delete folder "${entry.name}"? Files inside it will be moved to General.`)) return;
    setError("");
    try {
      const { data: rows, error: rowsError } = await supabase.from("user_media_vault").select("id,metadata").contains("metadata", { folder: entry.name });
      if (rowsError) throw rowsError;
      for (const row of rows || []) {
        const metadata = row.metadata && typeof row.metadata === "object" ? (row.metadata as Record<string, unknown>) : {};
        await updateVaultMedia(String(row.id), { metadata: { ...metadata, folder: "general" } });
      }
      const { error: deleteError } = await supabase.from("user_media_folders").delete().eq("id", entry.id);
      if (deleteError) throw deleteError;
      if (folder === entry.name) setFolder("general");
      await loadFolders();
      await refresh();
    } catch (folderError) {
      setError(folderError instanceof Error ? folderError.message : "Could not delete folder.");
    }
  };

  const uploadsRestricted = folder === "desktop-buddies" || folder === "Screenshots";
  const uploadTarget = !uploadsRestricted && folder !== "all" && folder !== "dragon-arena" && folder !== "getter-pro" ? folder : "general";
  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const files = Array.from(input.files || []);
    input.value = "";
    if (!files.length) return;
    if (uploadsRestricted) {
      setError("Uploads are disabled in this managed folder.");
      return;
    }
    setUploading(true);
    setError("");
    const failures: string[] = [];
    for (const file of files) {
      try {
        setUploadProgress((current) => ({ ...current, [file.name]: 0 }));
        await uploadVaultMediaWithProgress(file, { title: file.name, folder: uploadTarget, metadata: { source: "manual-upload" }, onProgress: (progress) => setUploadProgress((current) => ({ ...current, [file.name]: progress })) });
      } catch (uploadError) {
        failures.push(`${file.name}: ${uploadError instanceof Error ? uploadError.message : "upload failed"}`);
      } finally {
        window.setTimeout(
          () =>
            setUploadProgress((current) => {
              const next = { ...current };
              delete next[file.name];
              return next;
            }),
          350,
        );
      }
    }
    setUploading(false);
    if (failures.length) setError(failures.join(" · "));
    await refresh();
  };

  const moveItem = async (item: VaultMedia, destination: string) => {
    if (isPinnedAsset(item) || destination === "desktop-buddies" || destination === "Desktop Buddies" || !destination || destination === vaultFolder(item)) return;
    try {
      await updateVaultMedia(item.id, { metadata: { ...(item.metadata || {}), folder: destination } });
      await refresh();
    } catch (moveError) {
      setError(moveError instanceof Error ? moveError.message : "Could not move file.");
    }
  };

  const handleDelete = async (item: VaultMedia) => {
    const label = item.title || item.file_name || "this item";
    if (!confirm(item.source_bucket === "dragon-arena-assets" ? `Delete "${label}" from Story Studio and its stored image?` : `Delete "${label}" from Media Vault?`)) return;
    try {
      await deleteVaultMedia(item);
      await refresh();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Could not delete item.");
    }
  };

  const openPreview = async (item: VaultMedia) => {
    try {
      const primary = await vaultItemUrl(item);
      const urls = item.source_bucket === "external" ? uniqueUrls([primary, metadataUrl(item, "media_url"), metadataUrl(item, "thumbnail")]) : uniqueUrls([primary]);
      if (urls.length) setPreview({ item, url: urls[0], fallbacks: urls.slice(1) });
      else setError("No preview URL is available for this item.");
    } catch {
      setError("Could not open preview.");
    }
  };

  const allFolderOptions = React.useMemo(
    () => [
      ...SYSTEM_FOLDERS.filter((item) => !["all", "dragon-arena", "desktop-buddies"].includes(String(item.id)) && item.label !== "Desktop Buddies").map((item) => ({ value: String(item.id), label: item.label })),
      ...userFolders.filter((item) => item.name !== "Desktop Buddies").map((item) => ({ value: item.name, label: item.name })),
    ],
    [userFolders],
  );
  const folders = React.useMemo(() => [...SYSTEM_FOLDERS, ...userFolders.map((item) => ({ id: item.name as VaultFolder, label: item.name, icon: Folder }))], [userFolders]);
  const sortedMedia = React.useMemo(
    () =>
      [...media].sort((a, b) => {
        const nameA = (a.title || a.file_name || "").toLocaleLowerCase();
        const nameB = (b.title || b.file_name || "").toLocaleLowerCase();
        if (sortMode === "oldest") return a.created_at.localeCompare(b.created_at);
        if (sortMode === "name-asc") return nameA.localeCompare(nameB);
        if (sortMode === "name-desc") return nameB.localeCompare(nameA);
        if (sortMode === "size-desc") return Number(b.size_bytes || 0) - Number(a.size_bytes || 0);
        if (sortMode === "type") return a.kind.localeCompare(b.kind) || nameA.localeCompare(nameB);
        return b.created_at.localeCompare(a.created_at);
      }),
    [media, sortMode],
  );
  const previewableMedia = React.useMemo(() => sortedMedia.filter((item) => item.kind === "image" || item.kind === "video"), [sortedMedia]);
  const previewIndex = preview ? previewableMedia.findIndex((item) => item.id === preview.item.id && item.source_bucket === preview.item.source_bucket) : -1;
  const navigatePreview = (offset: number) => {
    if (previewIndex < 0 || previewableMedia.length < 2) return;
    const nextIndex = (previewIndex + offset + previewableMedia.length) % previewableMedia.length;
    void openPreview(previewableMedia[nextIndex]);
  };
  const usedPct = quota.quota_bytes ? Math.min(100, Math.round((quota.used_bytes / quota.quota_bytes) * 100)) : 0;

  return (
    <div className="w-full space-y-4 pb-8">
      <AppHeading />

      <Card className="p-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end">
          <div className="flex min-w-0 flex-1 gap-2">
            <Input
              value={newFolder}
              onChange={(event) => setNewFolder(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") void createFolder();
              }}
              maxLength={60}
              placeholder="Create a folder…"
              className="h-9 min-w-0 flex-1 rounded-xl border border-input bg-background px-4 text-sm outline-none focus:ring-1 focus:ring-ring/30"
            />
            <Button variant="secondary" onClick={() => void createFolder()} disabled={!newFolder.trim()}>
              <FolderPlus className="h-4 w-4" /> New folder
            </Button>
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              Sort
              <Select value={sortMode} onChange={(event) => setSortMode(event.target.value as SortMode)} className="h-9 rounded-xl border border-input bg-background px-2 text-sm text-foreground">
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="name-asc">Name A–Z</option>
                <option value="name-desc">Name Z–A</option>
                <option value="size-desc">Largest first</option>
                <option value="type">Type</option>
              </Select>
            </label>
            <Button variant="secondary" onClick={() => void refresh()} disabled={loading}>
              <RefreshCw className="h-4 w-4" /> Refresh
            </Button>
            {uploadsRestricted ? (
              <Badge color="slate">Managed folder · uploads disabled</Badge>
            ) : (
              <>
                <Input ref={uploadInputRef} type="file" multiple accept="image/*,video/*,audio/*,application/pdf,.txt,.md,.json" className="hidden" onChange={handleUpload} disabled={uploading} />
                <Button variant="secondary" onClick={() => uploadInputRef.current?.click()} disabled={uploading}>
                  <Upload className="h-4 w-4" />
                  {uploading ? "Uploading…" : `Upload to ${uploadTarget === "general" ? "General" : uploadTarget}`}
                </Button>
              </>
            )}
          </div>
        </div>
      </Card>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
        {folders.map(({ id, label, icon: Icon }) => {
          const userFolder = userFolders.find((entry) => entry.name === id);
          return (
            <div key={String(id)} className={`flex items-center gap-2 rounded-xl border px-2 py-2 transition-colors ${folder === id ? "border-foreground/25 bg-accent" : "border-border/70 bg-background/35 hover:bg-accent/60"}`}>
              <Button onClick={() => setFolder(id)} className="flex min-w-0 flex-1 items-center gap-2 px-2 py-2 text-left text-sm">
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{label}</span>
              </Button>
              {userFolder && (
                <>
                  <Button type="button" onClick={() => void renameFolder(userFolder)} className="rounded-xl p-2 text-muted-foreground hover:bg-background hover:text-foreground" aria-label={`Rename ${label}`}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button type="button" onClick={() => void deleteFolder(userFolder)} className="rounded-xl p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" aria-label={`Delete ${label}`}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          );
        })}
      </div>

      {uploading && Object.keys(uploadProgress).length > 0 && (
        <Card className="p-4">
          <div className="space-y-2">
            {Object.entries(uploadProgress).map(([name, pct]) => (
              <div key={name} className="flex items-center gap-2 text-sm">
                <span className="w-40 truncate text-muted-foreground">{name}</span>
                <div className="h-2 flex-1 rounded-xl bg-muted">
                  <div className="h-full rounded-xl bg-foreground transition-all" style={{ width: `${pct}%` }} />
                </div>
                <span>{pct}%</span>
              </div>
            ))}
          </div>
        </Card>
      )}
      <Card className="p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Private upload quota used</span>
          <span>
            {formatBytes(quota.used_bytes)} / {formatBytes(quota.quota_bytes)} ({usedPct}%)
          </span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-xl bg-muted">
          <div className="h-full rounded-xl bg-foreground transition-all" style={{ width: `${usedPct}%` }} />
        </div>
        <p className="mt-2 text-sm text-muted-foreground">{formatBytes(quota.remaining_bytes)} remaining. Linked Story Studio assets and Getter Pro references are not double-counted against upload storage.</p>
      </Card>
      {error && <Card className="border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{error}</Card>}

      <div className="flex flex-wrap items-center gap-2">
        <Tabs
          className="min-w-0"
          tabs={[{ id: "all", label: "All kinds" }, ...(["image", "video", "document", "audio", "other"] as VaultMedia["kind"][]).map((kind) => ({ id: kind, label: kind.charAt(0).toUpperCase() + kind.slice(1) }))]}
          active={filterKind}
          onChange={(id) => setFilterKind(id as typeof filterKind)}
          ariaLabel="Media kinds"
        />
        <div className="flex-1" />
        <div className="flex items-center rounded-xl border border-border/60 p-2">
          <Button variant={viewMode === "grid" ? "secondary" : "ghost"} size="sm" onClick={() => setViewMode("grid")} title="Grid view">
            <FileImage className="h-4 w-4" />
          </Button>
          <Button variant={viewMode === "showcase" ? "secondary" : "ghost"} size="sm" onClick={() => setViewMode("showcase")} title="Showcase view">
            <PanelsTopLeft className="h-4 w-4" />
          </Button>
          <Button variant={viewMode === "list" ? "secondary" : "ghost"} size="sm" onClick={() => setViewMode("list")} title="List view">
            <FileText className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className={viewMode === "list" ? "space-y-2" : viewMode === "showcase" ? "grid gap-4 md:grid-cols-2 xl:grid-cols-3" : "grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"}>
        {loading ? (
          Array.from({ length: 6 }).map((_, index) => (
            <Card key={index} className="overflow-hidden p-2 animate-pulse">
              <div className="aspect-video bg-muted" />
              <div className="h-16" />
            </Card>
          ))
        ) : !sortedMedia.length ? (
          <div className="col-span-full rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            <Folder className="mx-auto h-9 w-9 opacity-50" />
            <p className="mt-2">No media in this folder/filter yet.</p>
          </div>
        ) : (
          sortedMedia.map((item) => {
            const Icon = kindIcon(item.kind);
            const list = viewMode === "list";
            const showcase = viewMode === "showcase";
            return (
              <Card key={`${item.metadata?.source_table || item.source_app || "vault"}-${item.id}`} className={list ? "flex items-center gap-4 p-4" : `overflow-hidden p-2 ${showcase ? "bg-card/70" : ""}`}>
                {!list && (
                  <Button type="button" onClick={() => void openPreview(item)} className={`relative block w-full overflow-hidden bg-muted ${showcase ? "aspect-[16/10]" : "aspect-video"}`}>
                    <VaultThumb item={item} />
                  </Button>
                )}
                <div className={list ? "min-w-0 flex-1" : "p-4"}>
                  <div className="flex items-start justify-between gap-2">
                    <div className={list ? "flex min-w-0 items-center gap-2" : "min-w-0"}>
                      {list && <Icon className="h-5 w-5 shrink-0 text-muted-foreground" />}
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{item.title || item.file_name || "Untitled"}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          {kindBadge(item.kind)}
                          <Badge color="slate">{vaultFolder(item)}</Badge>
                          <span className="text-sm text-muted-foreground">{sourceLabel(item)}</span>
                        </div>
                      </div>
                    </div>
                    <VaultActions item={item} onPreview={() => void openPreview(item)} onDelete={() => void handleDelete(item)} />
                  </div>
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm text-muted-foreground">{new Date(item.created_at).toLocaleString()}</span>
                    {!isPinnedAsset(item) && (
                      <Select aria-label="Move file to folder" value={vaultFolder(item)} onChange={(event) => void moveItem(item, event.target.value)} className="h-9 max-w-44 rounded-xl border border-input bg-background px-2 text-sm text-foreground">
                        {allFolderOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </Select>
                    )}
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {preview && (preview.item.kind === "image" || preview.item.kind === "video") ? (
        <>
          <MediaShowbox
            open
            onClose={() => setPreview(null)}
            type={preview.item.kind}
            title={preview.item.title || preview.item.file_name || "Media Vault item"}
            source={sourceLabel(preview.item)}
            originalUrl={metadataUrl(preview.item, "original_url") || preview.item.source_ref || preview.item.external_url || preview.url}
            mediaUrl={preview.url}
            thumbnail={metadataUrl(preview.item, "thumbnail") || undefined}
            note="Private Media Vault preview. YouTube references play in the privacy-enhanced embedded player."
          />
          {previewableMedia.length > 1 && (
            <>
              <Button type="button" onClick={() => navigatePreview(-1)} className="fixed left-3 top-1/2 z-[70] grid h-11 w-11 -translate-y-1/2 place-items-center rounded-xl border border-inverse/20 bg-overlay/70 text-inverse hover:bg-overlay/90 sm:left-6" aria-label="Previous media">
                <ChevronLeft className="h-6 w-6" />
              </Button>
              <Button type="button" onClick={() => navigatePreview(1)} className="fixed right-3 top-1/2 z-[70] grid h-11 w-11 -translate-y-1/2 place-items-center rounded-xl border border-inverse/20 bg-overlay/70 text-inverse hover:bg-overlay/90 sm:right-6" aria-label="Next media">
                <ChevronRight className="h-6 w-6" />
              </Button>
            </>
          )}
        </>
      ) : preview ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-overlay/90 p-4" onClick={() => setPreview(null)}>
          <div className="max-w-md rounded-xl border border-border/70 bg-background p-4 text-center text-muted-foreground">Preview is not available for this item type. Use the source/download action.</div>
          <Button onClick={() => setPreview(null)} className="absolute right-4 top-4 rounded-xl bg-overlay/50 p-2 text-inverse hover:bg-overlay/70">
            <X className="h-5 w-5" />
          </Button>
        </div>
      ) : null}
    </div>
  );
}
