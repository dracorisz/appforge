import React from "react";
import { ArrowLeftRight, ArrowRight, Cloud, PlayCircle, ShieldCheck } from "lucide-react";
import { SiGithub as Github, SiGoogle as Google } from "react-icons/si";
import { Link, useNavigate } from "react-router-dom";
import { Button, Input } from "@/components/ui";
import { getAllApps } from "@/lib/registry";
import { PublicFooter } from "@/components/public/PublicFooter";
import { FRONTEND_CONTENT_UPDATED_EVENT, loadPublishedFrontendContent } from "@/lib/frontendContent";
import { PublicHeader } from "@/components/public/PublicHeader";
import { useAuth } from "./AuthProvider";
import { consumeReturnPath, normalizeReturnPath } from "./returnPath";

const DEFAULT_VIDEO_URL = "https://www.youtube.com/watch?v=5dAQXJXbvhI";
const DEFAULT_VIDEO_EMBED_URL = "https://www.youtube-nocookie.com/embed/5dAQXJXbvhI?rel=0&modestbranding=1";
const LANDING_SLUG = "appforge-walkthrough";
const APPFORGE_MARK = "/favicon.svg?v=2";

const publicTools = [
  { label: "Weather Now", description: "Live weather lookup", path: "/apps/weather-now", icon: Cloud },
  { label: "Data Converter", description: "Local format conversion", path: "/apps/data-converter", icon: ArrowLeftRight },
];

type AuthProviderName = "google" | "github";

const safeExternalUrl = (value: string) => {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" || parsed.protocol === "http:" ? parsed.toString() : "";
  } catch {
    return "";
  }
};

const youtubeEmbed = (url: string) => {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return "";
    const hostname = parsed.hostname.toLowerCase().replace(/^www\./, "");
    const supportedHost = hostname === "youtube.com" || hostname === "m.youtube.com" || hostname === "youtu.be" || hostname === "youtube-nocookie.com";
    if (!supportedHost) return "";
    const id = hostname === "youtu.be" ? parsed.pathname.slice(1) : parsed.searchParams.get("v") || (parsed.pathname.startsWith("/embed/") ? parsed.pathname.split("/")[2] : "");
    return id && /^[\w-]{6,}$/.test(id) ? `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1` : "";
  } catch {
    return "";
  }
};

export function LoginPage({ returnTo = "/", landingOnly = false }: { returnTo?: string; landingOnly?: boolean }) {
  const navigate = useNavigate();
  const { user, loading, signInWithGoogle, signInWithGitHub, signInWithEmail } = useAuth();
  const [busyProvider, setBusyProvider] = React.useState<AuthProviderName | null>(null);
  const [error, setError] = React.useState("");
  const [authOpen, setAuthOpen] = React.useState(!landingOnly);
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [videoUrl, setVideoUrl] = React.useState(DEFAULT_VIDEO_URL);
  const [videoEmbedUrl, setVideoEmbedUrl] = React.useState(DEFAULT_VIDEO_EMBED_URL);
  const [showAppCount, setShowAppCount] = React.useState(true);
  const [videoTitle, setVideoTitle] = React.useState("See AppForge in action");
  const [videoSummary, setVideoSummary] = React.useState("A short walkthrough of the current AppForge experience.");
  const [appCount, setAppCount] = React.useState(() => getAllApps().length);

  React.useEffect(() => {
    if (landingOnly || loading || !user) return;
    navigate(consumeReturnPath(returnTo), { replace: true });
  }, [landingOnly, loading, navigate, returnTo, user]);

  const refreshLandingContent = React.useCallback(async () => {
    try {
      const records = await loadPublishedFrontendContent("video_teaser");
      const teaser = records.find((record) => record.slug === LANDING_SLUG) || records[0];
      if (!teaser) {
        setShowAppCount(true);
        setVideoTitle("See AppForge in action");
        setVideoSummary("A short walkthrough of the current AppForge experience.");
        setVideoUrl(DEFAULT_VIDEO_URL);
        setVideoEmbedUrl(DEFAULT_VIDEO_EMBED_URL);
        return;
      }
      setShowAppCount(teaser.metadata?.show_active_app_count !== false);
      setVideoTitle(teaser.title || "See AppForge in action");
      setVideoSummary(teaser.summary || "A short walkthrough of the current AppForge experience.");
      const safeUrl = teaser.video_url ? safeExternalUrl(teaser.video_url) : "";
      if (safeUrl) {
        setVideoUrl(safeUrl);
        setVideoEmbedUrl(youtubeEmbed(safeUrl));
      } else {
        setVideoUrl(DEFAULT_VIDEO_URL);
        setVideoEmbedUrl(DEFAULT_VIDEO_EMBED_URL);
      }
    } catch (teaserError) {
      console.warn("AppForge video teaser unavailable; using bundled walkthrough.", teaserError);
    }
  }, []);

  React.useEffect(() => {
    const refresh = () => {
      setAppCount(getAllApps().length);
      void refreshLandingContent();
    };
    const onStorage = (event: StorageEvent) => {
      if (event.key === "appforge-frontend-content-updated-at") refresh();
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") refresh();
    };
    refresh();
    window.addEventListener(FRONTEND_CONTENT_UPDATED_EVENT, refresh);
    window.addEventListener("appforge:app-overrides-updated", refresh);
    window.addEventListener("focus", refresh);
    window.addEventListener("storage", onStorage);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener(FRONTEND_CONTENT_UPDATED_EVENT, refresh);
      window.removeEventListener("appforge:app-overrides-updated", refresh);
      window.removeEventListener("focus", refresh);
      window.removeEventListener("storage", onStorage);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [refreshLandingContent]);

  const login = async (provider: AuthProviderName) => {
    if (user) {
      navigate("/");
      return;
    }
    setBusyProvider(provider);
    setError("");
    try {
      const normalized = normalizeReturnPath(returnTo);
      if (provider === "github") await signInWithGitHub(normalized);
      else await signInWithGoogle(normalized);
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : `${provider === "github" ? "GitHub" : "Google"} sign-in could not start.`);
      setBusyProvider(null);
    }
  };

  return (
    <div className="min-h-dvh overflow-x-hidden bg-background text-foreground">
      <div className="flex min-h-dvh flex-col">
        <PublicHeader className="shrink-0" />

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 lg:px-8">
          <section className="grid items-stretch gap-4 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)]" aria-labelledby="landing-title">
            <div className="surface-card flex min-h-[32rem] flex-col justify-between rounded-xl border p-8">
              <div>
                <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-secondary">
                  <img src={APPFORGE_MARK} alt="" className="h-8 w-8" decoding="async" />
                </div>
                <h1 id="landing-title" className="max-w-4xl text-balance text-5xl font-semibold tracking-[-0.05em] sm:text-5xl lg:text-5xl xl:text-5xl">
                  Build useful things.<span className="block text-muted-foreground">Own the workflow.</span>
                </h1>
                <p className="mt-4 max-w-2xl text-pretty text-sm text-muted-foreground sm:text-lg">Practical tools in one consistent workspace.</p>
              </div>
              <div>
                <div className="mt-8 flex flex-wrap gap-4" aria-busy={Boolean(busyProvider) || loading}>
                  {user ? (
                    <Button className="h-11 px-4" onClick={() => navigate("/")} disabled={loading}>Open workspace <ArrowRight className="h-4 w-4" /></Button>
                  ) : (
                    <Button className="h-11 px-4" onClick={() => setAuthOpen(true)} disabled={loading}>Sign in <ArrowRight className="h-4 w-4" /></Button>
                  )}
                </div>
                {error && <div role="alert" aria-live="polite" className="mt-4 max-w-xl rounded-xl border border-destructive/25 bg-destructive/5 px-4 py-2 text-sm text-destructive">{error}</div>}
                {showAppCount && <p className="mt-8 border-t border-border pt-4 text-sm text-muted-foreground"><strong className="font-semibold text-foreground">{appCount}</strong> active apps · open source</p>}
              </div>
            </div>

            <div className="surface-card overflow-hidden rounded-xl border">
              <div className="flex items-center justify-between gap-4 border-b border-border p-4">
                <div className="min-w-0">
                  <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">{/* design-xs-ok: compact eyebrow label */}<PlayCircle className="h-4 w-4" /> Walkthrough</div>
                  <h2 className="mt-2 text-lg font-semibold tracking-tight">{videoTitle}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{videoSummary}</p>
                </div>
                <a href={videoUrl} target="_blank" rel="noopener noreferrer" className="shrink-0 text-sm font-medium text-foreground underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">Open video</a>
              </div>
              {videoEmbedUrl ? (
                <iframe key={videoEmbedUrl} src={videoEmbedUrl} title="AppForge product walkthrough" className="aspect-video w-full border-0" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" />
              ) : (
                <video key={videoUrl} src={videoUrl} title="AppForge product walkthrough" className="aspect-video w-full bg-overlay object-contain" controls preload="metadata" playsInline />
              )}
              <div className="grid border-t border-border md:grid-cols-3" aria-label="Public tools and workspace access">
                {publicTools.map(({ label, description, path, icon: Icon }) => (
                  <Link key={path} to={path} className="group flex min-h-32 flex-col justify-between gap-4 border-b border-border p-4 transition-colors hover:bg-accent md:border-b-0 md:border-r">
                    <span className="flex items-center justify-between gap-4"><Icon className="h-4 w-4" /><ArrowRight className="h-4 w-4 text-muted-foreground" /></span>
                    <span><span className="block text-sm font-medium">{label}</span><span className="mt-1 block text-sm text-muted-foreground">{description}</span></span>
                  </Link>
                ))}
                <Link to="/explore" className="group flex min-h-32 flex-col justify-between gap-4 p-4 text-sm font-medium transition-colors hover:bg-accent">
                  <span className="flex items-center justify-between gap-4"><ShieldCheck className="h-4 w-4" /><ArrowRight className="h-4 w-4 text-muted-foreground" /></span>
                  <span>Browse all public apps</span>
                </Link>
              </div>
            </div>
          </section>

          <section className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)]" aria-labelledby="about-appforge-title">
            <div className="p-4">
              <h2 id="about-appforge-title" className="text-lg font-semibold tracking-tight">Open source. Private by design.</h2>
              <p className="mt-1 text-sm text-muted-foreground">AppForge combines public tools with an authenticated workspace, keeping local work in-browser where practical and using protected persistence only where it adds value.</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="surface-card rounded-xl border p-4"><div className="text-sm font-semibold">Consistent tools</div><p className="mt-1 text-sm text-muted-foreground">Shared components and interaction patterns keep the growing app collection familiar and easier to maintain.</p></div>
              <div className="surface-card rounded-xl border p-4"><div className="text-sm font-semibold">Transparent project</div><p className="mt-1 text-sm text-muted-foreground">MIT-licensed source, public development, explicit data boundaries, and no advertising analytics built into the product.</p></div>
            </div>
          </section>
        </main>

        {authOpen && !user && (
          <div className="fixed inset-0 z-[100] flex min-h-[100dvh] items-center justify-center bg-overlay/75 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Sign in to AppForge" onMouseDown={(event) => { if (event.target === event.currentTarget) setAuthOpen(false); }}>
            <div className="w-full max-w-md rounded-xl border border-border bg-background p-4 shadow-xl">
              <div className="flex items-start justify-between gap-4">
                <div><h2 className="text-lg font-semibold">Sign in to AppForge</h2><p className="mt-1 text-sm text-muted-foreground">Use email or a connected provider.</p></div>
                <Button type="button" onClick={() => setAuthOpen(false)} className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground hover:bg-accent hover:text-foreground" aria-label="Close sign in"><span aria-hidden="true">×</span></Button>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <Button variant="primary" className="border bg-black text-white border-white/30" onClick={() => void login("google")} disabled={Boolean(busyProvider) || loading}><Google className="h-4 w-4" /> Continue with Google</Button>
                <Button variant="secondary" onClick={() => void login("github")} disabled={Boolean(busyProvider) || loading}><Github className="h-4 w-4" /> Continue with GitHub</Button>
              </div>
              <div className="my-4 flex items-center gap-4 text-sm text-muted-foreground"><span className="h-px flex-1 bg-border" />or email<span className="h-px flex-1 bg-border" /></div>
              <form className="grid grid-cols-1 gap-2" onSubmit={async (event) => {
                event.preventDefault();
                setError("");
                try { await signInWithEmail(email, password); navigate(consumeReturnPath(returnTo), { replace: true }); }
                catch (emailError) { setError(emailError instanceof Error ? emailError.message : "Email sign-in failed."); }
              }}>
                <Input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email" className="h-9 w-full rounded-xl border border-input bg-background px-4 text-sm" />
                <Input type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password" className="h-9 w-full rounded-xl border border-input bg-background px-4 text-sm" />
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-sm"><Link to="/auth/forgot-password" onClick={() => setAuthOpen(false)} className="font-medium text-foreground hover:underline">Forgot password?</Link><Link to="/auth/confirm" onClick={() => setAuthOpen(false)} className="text-muted-foreground hover:text-foreground hover:underline">Resend confirmation</Link></div>
                <Button type="submit" className="w-full" disabled={!email.trim() || !password}>Sign in with email</Button>
              </form>
              {error && <div role="alert" className="mt-4 rounded-xl border border-destructive/25 bg-destructive/5 px-4 py-2 text-sm text-destructive">{error}</div>}
            </div>
          </div>
        )}
        <PublicFooter />
      </div>
    </div>
  );
}
