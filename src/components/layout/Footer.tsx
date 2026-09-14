import React from "react";
import { useNavigate } from "react-router-dom";
import { BuildBadge, Button } from "@/components/ui";

export function Footer({ version: _version }: { version?: string }) {
  const navigate = useNavigate();

  return (
    <footer className="no-print border-t border-border/70 bg-background/70 py-2 backdrop-blur-xl">
      <div className="flex flex-col gap-2 px-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <span className="truncate">Simple, powerful tools.</span>
        {/* <span className="truncate">AppForge — </span> */}
        <Button variant="ghost" size="sm" onClick={() => navigate("/")} aria-label="Open AppForge dashboard" className="w-fit">
          <BuildBadge />
        </Button>
      </div>
    </footer>
  );
}
