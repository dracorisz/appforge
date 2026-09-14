import React from "react";
import { ArrowLeft, Construction, ExternalLink } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { Badge, Card } from "@/components/ui";
import { getAllApps } from "@/lib/registry";

export function RegistryAppFallback() {
  const { slug } = useParams();
  const app = getAllApps().find((item) => item.route === `/apps/${slug}`);

  if (!app) {
    return (
      <Card className="mx-auto max-w-2xl p-4 text-center">
        <Construction className="mx-auto h-9 w-9 text-muted-foreground" />
        <h1 className="mt-4 text-lg font-semibold">App route not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">This route is not registered in the AppForge app registry.</p>
        <Link to="/apps" className="mt-4 inline-flex items-center gap-2 rounded-xl px-4 text-sm font-medium hover:bg-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
          <ArrowLeft className="h-4 w-4" /> Back to apps
        </Link>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge color="slate">{app.status}</Badge>
          <Badge color="slate">v{app.version}</Badge>
          <Badge color="slate">{app.category.replace("-", " ")}</Badge>
        </div>
        <h1 className="mt-4 text-lg font-semibold">{app.name}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{app.description}</p>
        <div className="mt-4 rounded-xl border border-border/60 bg-background/45 p-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2 font-medium text-foreground">
            <Construction className="h-4 w-4" /> Unavailable app surface
          </div>
          <p className="mt-2">This route does not currently have a dedicated implementation.</p>
        </div>
        <div className="mt-4 flex flex-wrap gap-4">
          <Link to="/apps" className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-medium hover:bg-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
            <ArrowLeft className="h-4 w-4" /> All apps
          </Link>
          <a href="https://docs.sstoken.space/PROJECT-PULSE" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-medium hover:bg-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
            Project status <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </Card>
    </div>
  );
}
