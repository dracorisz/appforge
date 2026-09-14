import React from "react";
import { ExternalLink, HeartHandshake, Mail, MapPin, Search, UserRound } from "lucide-react";
import { SiGithub as Github } from "react-icons/si";
import { Badge, Button, Card, Input } from "@/components/ui";
import { listProfileImages, listVisibleProfiles, type AppProfile, type ProfileImageLink, type UserImage } from "@/lib/account";

const linkedImage = (link: ProfileImageLink) => (Array.isArray(link.user_images) ? link.user_images[0] || null : link.user_images || null);

export function PeoplePage() {
  const [profiles, setProfiles] = React.useState<AppProfile[]>([]);
  const [images, setImages] = React.useState<ProfileImageLink[]>([]);
  const [query, setQuery] = React.useState("");
  const [collaboratorsOnly, setCollaboratorsOnly] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    let active = true;
    void Promise.all([listVisibleProfiles(), listProfileImages()])
      .then(([nextProfiles, nextImages]) => {
        if (!active) return;
        setProfiles(nextProfiles.filter((profile) => profile.is_public));
        setImages(nextImages);
      })
      .catch((loadError) => {
        if (active) setError(loadError instanceof Error ? loadError.message : "Could not load profiles.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const needle = query.trim().toLowerCase();
  const visible = profiles.filter((profile) => {
    if (collaboratorsOnly && !profile.open_to_collaboration) return false;
    if (!needle) return true;
    const values: Array<string | null | undefined> = [profile.display_name, profile.username, profile.headline, profile.bio, profile.location];
    if (profile.show_github !== false) values.push(profile.github_username);
    if (profile.show_skills !== false) values.push(...(profile.skills || []));
    if (profile.show_website !== false) values.push(profile.website);
    if (profile.show_email) values.push(profile.public_email);
    return values.filter(Boolean).some((value) => String(value).toLowerCase().includes(needle));
  });

  const coverFor = (profileId: string) =>
    images
      .filter((link) => link.profile_id === profileId && link.kind === "cover")
      .map(linkedImage)
      .find((image): image is UserImage => Boolean(image?.source_url));

  return (
    <div className="space-y-4 pb-8">
      <div>
        <div className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          {" "}
          {/* design-xs-ok: compact section eyebrow */}
          <HeartHandshake className="h-4 w-4" /> Community
        </div>
        <h1 className="mt-2 text-lg font-semibold tracking-tight text-foreground">People</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">Discover signed-in AppForge users who explicitly opted into a public profile. Every contact field remains controlled by its owner.</p>
      </div>
      <Card className="p-4 sm:p-4">
        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search names, skills, location…" className="pl-8" aria-label="Search people" />
          </label>
          <Button size="sm" variant={collaboratorsOnly ? "default" : "secondary"} onClick={() => setCollaboratorsOnly((value) => !value)}>
            <HeartHandshake className="h-4 w-4" /> Open to collaborate
          </Button>
        </div>
        <div className="mt-2 text-sm text-muted-foreground">
          {visible.length} of {profiles.length} public profiles shown
        </div>
      </Card>
      {error && <Card className="border-destructive/30 p-4 text-sm text-destructive">{error}</Card>}
      {loading ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">Loading profiles…</Card>
      ) : visible.length === 0 ? (
        <Card className="p-8 text-center">
          <UserRound className="mx-auto h-6 w-6 text-muted-foreground" />
          <h2 className="mt-4 text-sm font-medium text-foreground">No matching profiles</h2>
          <p className="mt-2 text-sm text-muted-foreground">Try a broader search or turn off the collaboration filter.</p>
        </Card>
      ) : (
        <div className="grid items-start gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((profile) => {
            const cover = coverFor(profile.id);
            return (
              <Card key={profile.id} className="overflow-hidden ">
                {cover?.source_url ? <img src={cover.source_url} alt="" className="h-24 w-full object-cover" loading="lazy" /> : null}
                <div className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-muted text-muted-foreground">
                      {profile.avatar_url ? <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" /> : <UserRound className="h-5 w-5" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="truncate text-sm font-semibold text-foreground mr-auto">{profile.display_name || profile.username || "AppForge user"}</h2>
                        {profile.open_to_collaboration && <Badge color="green">Collaborate</Badge>}
                      </div>
                      {profile.username && <p className="truncate text-sm text-muted-foreground">@{profile.username}</p>}
                      {profile.headline && <p className="mt-2 line-clamp-2 text-sm font-medium text-foreground/80">{profile.headline}</p>}
                    </div>
                  </div>
                  {profile.bio && <p className="mt-4 line-clamp-3 text-sm text-muted-foreground">{profile.bio}</p>}
                  {profile.show_skills !== false && (profile.skills || []).length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {profile.skills.slice(0, 6).map((skill) => (
                        <span key={skill} className="rounded-xl border border-border px-2 py-2 text-sm text-muted-foreground">
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 border-t border-border/60 pt-4 text-sm text-muted-foreground">
                    {profile.location && (
                      <span className="inline-flex items-center gap-2">
                        <MapPin className="h-4 w-4" /> {profile.location}
                      </span>
                    )}
                    {profile.show_github !== false && profile.github_username && (
                      <a href={`https://github.com/${encodeURIComponent(profile.github_username)}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 hover:text-foreground">
                        <Github className="h-4 w-4" /> GitHub
                      </a>
                    )}
                    {profile.show_website !== false && profile.website && (
                      <a href={profile.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 hover:text-foreground">
                        <ExternalLink className="h-4 w-4" /> Website
                      </a>
                    )}
                    {profile.show_email && profile.public_email && (
                      <a href={`mailto:${profile.public_email}`} className="inline-flex items-center gap-2 hover:text-foreground">
                        <Mail className="h-4 w-4" /> Email
                      </a>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
