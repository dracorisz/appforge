import React from "react";
import { CheckCircle2, Clipboard, ExternalLink, Film, Send } from "lucide-react";
import { SiYoutube as Youtube } from "react-icons/si";
import { getAllApps } from "@/lib/registry";
import { BUILD_INFO } from "@/lib/buildInfo";
import { APPFORGE_CHANNEL_URL, DemoPackage, DemoStatus, makeDemoPackage, makePublication, MarketingFormat, PLAYLISTS, PublicationRecord, PublicationStatus } from "@/lib/marketing";
import { Button, Input, Select, Textarea } from "@/components/ui";

const DEMOS_KEY = "appforge-marketing-demos-v1";
const PUBLICATIONS_KEY = "appforge-marketing-publications-v1";
const LEGACY_DEMOS_KEY = "faviconeting-demos-v1";
const LEGACY_PUBLICATIONS_KEY = "faviconeting-publications-v1";

const readArray = <T,>(key: string, legacyKey?: string): T[] => {
  try {
    const current = localStorage.getItem(key);
    const legacy = !current && legacyKey ? localStorage.getItem(legacyKey) : null;
    const raw = current || legacy || "[]";
    const value = JSON.parse(raw);
    if (!Array.isArray(value)) return [];
    if (!current && legacy) localStorage.setItem(key, raw);
    return value as T[];
  } catch {
    return [];
  }
};

const writeArray = (key: string, value: unknown[]) => localStorage.setItem(key, JSON.stringify(value));

const copy = async (value: string) => navigator.clipboard.writeText(value);

export default function MarketingStudio() {
  const apps = React.useMemo(() => getAllApps().filter((app) => app.status !== "idea" && app.status !== "deprecated"), []);
  const [appId, setAppId] = React.useState(apps[0]?.id || "");
  const [demos, setDemos] = React.useState<DemoPackage[]>(() => readArray<DemoPackage>(DEMOS_KEY, LEGACY_DEMOS_KEY));
  const [publications, setPublications] = React.useState<PublicationRecord[]>(() => readArray<PublicationRecord>(PUBLICATIONS_KEY, LEGACY_PUBLICATIONS_KEY));
  const [selectedDemoId, setSelectedDemoId] = React.useState<string>("");
  const [message, setMessage] = React.useState("");

  React.useEffect(() => {
    writeArray(DEMOS_KEY, demos);
  }, [demos]);
  React.useEffect(() => {
    writeArray(PUBLICATIONS_KEY, publications);
  }, [publications]);

  const selectedDemo = demos.find((demo) => demo.id === selectedDemoId) || demos[0];
  React.useEffect(() => {
    if (!selectedDemoId && demos[0]) setSelectedDemoId(demos[0].id);
  }, [demos, selectedDemoId]);

  const buildFingerprint = `${BUILD_INFO.version} · ${BUILD_INFO.sha || "local"} · ${BUILD_INFO.buildTime || "unknown build time"}`;

  const generate = () => {
    const app = apps.find((item) => item.id === appId);
    if (!app) return;
    const demo = makeDemoPackage(app, buildFingerprint);
    setDemos((current) => [demo, ...current]);
    setSelectedDemoId(demo.id);
    setMessage(`Generated demo package for ${app.name}.`);
  };

  const updateDemo = (id: string, patch: Partial<DemoPackage>) => setDemos((current) => current.map((demo) => (demo.id === id ? { ...demo, ...patch, updatedAt: new Date().toISOString() } : demo)));
  const updatePublication = (id: string, patch: Partial<PublicationRecord>) => setPublications((current) => current.map((record) => (record.id === id ? { ...record, ...patch, updatedAt: new Date().toISOString() } : record)));

  const createPublication = (format: MarketingFormat) => {
    if (!selectedDemo) return;
    const next = makePublication(selectedDemo, format);
    setPublications((current) => [next, ...current]);
    setMessage(`Created ${format === "short-9x16" ? "Short" : "16:9"} YouTube publication draft.`);
  };

  const selectedPublications = selectedDemo ? publications.filter((record) => record.demoId === selectedDemo.id) : [];

  const markPublished = (record: PublicationRecord) => {
    const remoteUrl = (record.remoteUrl || "").trim();
    if (!remoteUrl) {
      setMessage("Add the published YouTube URL before marking the publication complete.");
      return;
    }
    const videoIdMatch = remoteUrl.match(/(?:v=|youtu\.be\/|shorts\/)([A-Za-z0-9_-]{6,})/);
    updatePublication(record.id, { status: "published", remoteId: videoIdMatch?.[1] || record.remoteId, remoteUrl, publishedAt: new Date().toISOString(), attempts: Math.max(record.attempts, 1) });
    if (selectedDemo) updateDemo(selectedDemo.id, { status: "published", publishedUrl: remoteUrl });
    setMessage("Publication marked as published and linked back to the demo record.");
  };

  return (
    <div className="w-full">
      <section className="surface-card rounded-xl border p-4 sm:p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Demo package + publication ledger</p> {/* design-xs-ok: compact section eyebrow */}
            <h1 className="mt-2 text-lg font-semibold tracking-tight">Marketing Studio</h1>
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
              Generate repeatable walkthrough scripts and channel-neutral publication records from the canonical AppForge registry. YouTube publishing remains review-first; delegated upload stays disabled until the narrow upload scope is approved.
            </p>
          </div>
          <a href={APPFORGE_CHANNEL_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border px-4 text-sm font-medium hover:bg-accent">
            <Youtube className="h-4 w-4" /> AppForge Studio <ExternalLink className="h-4 w-4" />
          </a>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-[minmax(240px,1fr)_auto]">
          <label className="grid gap-2 text-sm font-medium">
            App
            <Select value={appId} onChange={(event) => setAppId(event.target.value)} className="h-11 rounded-xl border bg-background px-4">
              {apps.map((app) => (
                <option key={app.id} value={app.id}>
                  {app.name} · {app.version} · {app.status}
                </option>
              ))}
            </Select>
          </label>
          <Button type="button" onClick={generate} className="inline-flex items-center justify-center gap-2 self-end rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground">
            <Film className="h-4 w-4" /> Generate demo package
          </Button>
        </div>
        <div aria-live="polite" className="mt-4 text-sm text-muted-foreground">
          {message}
        </div>
      </section>

      <div className="mt-4 grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="surface-card self-start rounded-xl border p-4 xl:sticky xl:top-4">
          <div className="px-2 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Demo packages</div> {/* design-xs-ok: compact navigation heading */}
          <div className="grid max-h-[70dvh] gap-2 overflow-auto">
            {demos.map((demo) => (
              <Button key={demo.id} type="button" onClick={() => setSelectedDemoId(demo.id)} className={`rounded-xl border p-4 text-left ${selectedDemo?.id === demo.id ? "bg-accent" : "bg-background/50 hover:bg-accent/60"}`}>
                <div className="text-sm font-semibold">{demo.appName}</div>
                <div className="mt-2 text-sm text-muted-foreground">
                  {demo.status} · {demo.appVersion}
                </div>
              </Button>
            ))}
            {demos.length === 0 && <div className="p-4 text-sm text-muted-foreground">Generate the first package from the registry.</div>}
          </div>
        </aside>

        {selectedDemo ? (
          <main className="grid gap-4">
            <section className="surface-card rounded-xl border p-4 sm:p-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold">{selectedDemo.title}</h2>
                  <p className="mt-2 text-sm text-muted-foreground">{selectedDemo.buildFingerprint}</p>
                </div>
                <label className="grid gap-2 text-sm font-medium text-muted-foreground">
                  Recording status
                  <Select value={selectedDemo.status} onChange={(event) => updateDemo(selectedDemo.id, { status: event.target.value as DemoStatus })} className="h-9 rounded-xl border bg-background px-4 text-sm text-foreground">
                    <option value="planned">Planned</option>
                    <option value="recorded">Recorded</option>
                    <option value="edited">Edited</option>
                    <option value="published">Published</option>
                  </Select>
                </label>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="text-sm font-semibold">30–90s script</h3>
                    <Button type="button" onClick={() => void copy(selectedDemo.script.join("\n"))} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                      <Clipboard className="h-4 w-4" /> Copy
                    </Button>
                  </div>
                  <ol className="grid gap-2 text-sm text-muted-foreground">
                    {selectedDemo.script.map((line, index) => (
                      <li key={`${line}-${index}`} className="rounded-xl border bg-background/50 p-4">
                        <strong className="mr-2 text-foreground">{index + 1}.</strong>
                        {line}
                      </li>
                    ))}
                  </ol>
                </div>
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="text-sm font-semibold">Shot/click list</h3>
                    <Button type="button" onClick={() => void copy(selectedDemo.shots.join("\n"))} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                      <Clipboard className="h-4 w-4" /> Copy
                    </Button>
                  </div>
                  <ol className="grid gap-2 text-sm text-muted-foreground">
                    {selectedDemo.shots.map((line, index) => (
                      <li key={`${line}-${index}`} className="rounded-xl border bg-background/50 p-4">
                        <strong className="mr-2 text-foreground">{index + 1}.</strong>
                        {line}
                      </li>
                    ))}
                  </ol>
                </div>
              </div>

              <label className="mt-4 grid gap-2 text-sm font-semibold">
                Narration
                <Textarea value={selectedDemo.narration} onChange={(event) => updateDemo(selectedDemo.id, { narration: event.target.value })} rows={4} className="rounded-xl border bg-background p-4 text-sm font-normal" />
              </label>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2 text-sm font-semibold">
                  Thumbnail text
                  <Input value={selectedDemo.thumbnailText} onChange={(event) => updateDemo(selectedDemo.id, { thumbnailText: event.target.value })} className="h-11 rounded-xl border bg-background px-4 font-normal" />
                </label>
                <label className="grid gap-2 text-sm font-semibold">
                  Playlist
                  <Select value={selectedDemo.playlist} onChange={(event) => updateDemo(selectedDemo.id, { playlist: event.target.value })} className="h-11 rounded-xl border bg-background px-4 font-normal">
                    {PLAYLISTS.map((playlist) => (
                      <option key={playlist}>{playlist}</option>
                    ))}
                  </Select>
                </label>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Button type="button" onClick={() => createPublication("youtube-16x9")} className="inline-flex items-center justify-center gap-2 rounded-xl border text-sm font-semibold hover:bg-accent">
                  <Youtube className="h-4 w-4" /> Prepare 16:9 publication
                </Button>
                <Button type="button" onClick={() => createPublication("short-9x16")} className="inline-flex items-center justify-center gap-2 rounded-xl border text-sm font-semibold hover:bg-accent">
                  <Film className="h-4 w-4" /> Prepare Short
                </Button>
              </div>
            </section>

            <section className="grid gap-4">
              {selectedPublications.map((record) => (
                <article key={record.id} className="surface-card rounded-xl border p-4 sm:p-4">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground"> {/* design-xs-ok: compact status label */}
                        {record.channel} · {record.format}
                      </div>
                      <h3 className="mt-2 font-semibold">{record.title}</h3>
                    </div>
                    <Select value={record.status} onChange={(event) => updatePublication(record.id, { status: event.target.value as PublicationStatus })} className="h-9 rounded-xl border bg-background px-4 text-sm">
                      <option value="draft">Draft</option>
                      <option value="ready">Ready</option>
                      <option value="publishing">Publishing</option>
                      <option value="published">Published</option>
                      <option value="failed">Failed</option>
                    </Select>
                  </div>
                  <label className="mt-4 grid gap-2 text-sm font-medium">
                    Title
                    <Input value={record.title} onChange={(event) => updatePublication(record.id, { title: event.target.value })} className="h-11 rounded-xl border bg-background px-4" />
                  </label>
                  <label className="mt-4 grid gap-2 text-sm font-medium">
                    Description
                    <Textarea value={record.description} onChange={(event) => updatePublication(record.id, { description: event.target.value })} rows={8} className="rounded-xl border bg-background p-4 text-sm" />
                  </label>
                  <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_auto]">
                    <label className="grid gap-2 text-sm font-medium">
                      Published URL
                      <Input value={record.remoteUrl || ""} onChange={(event) => updatePublication(record.id, { remoteUrl: event.target.value })} placeholder="https://youtu.be/…" className="h-11 rounded-xl border bg-background px-4" />
                    </label>
                    <Button type="button" onClick={() => markPublished(record)} className="inline-flex items-center justify-center gap-2 self-end rounded-xl border px-4 text-sm font-semibold hover:bg-accent">
                      <CheckCircle2 className="h-4 w-4" /> Mark published
                    </Button>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button type="button" onClick={() => void copy(`${record.title}\n\n${record.description}\n\nTags: ${record.tags.join(", ")}`)} className="inline-flex items-center gap-2 rounded-xl border px-4 text-sm font-semibold hover:bg-accent">
                      <Clipboard className="h-4 w-4" /> Copy publication package
                    </Button>
                    <Button type="button" disabled title="Enable only after Google approves the narrow delegated YouTube upload scope" className="inline-flex cursor-not-allowed items-center gap-2 rounded-xl border px-4 text-sm font-semibold opacity-50">
                      <Send className="h-4 w-4" /> Upload via YouTube OAuth · approval required
                    </Button>
                  </div>
                </article>
              ))}
              {selectedPublications.length === 0 && <div className="surface-card rounded-xl border p-8 text-center text-sm text-muted-foreground">Create a 16:9 or Short publication draft from this demo package.</div>}
            </section>
          </main>
        ) : (
          <div className="surface-card rounded-xl border p-8 text-center text-sm text-muted-foreground">Generate a demo package to begin.</div>
        )}
      </div>

      <section className="mt-4 rounded-xl border border-border/70 bg-background/60 p-4 text-sm text-muted-foreground">
        <strong className="text-foreground">Publishing boundary:</strong> Marketing Studio prepares, reviews, and records publication metadata today. It does not request broad YouTube account access and does not upload until the production delegated upload feature exists and the minimum necessary
        OAuth scope is approved. TikTok remains metadata-ready only until its developer product/scopes are approved.
      </section>
    </div>
  );
}
