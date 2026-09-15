import React from "react";
import { Heart, History } from "lucide-react";
import { SiGithub as Github } from "react-icons/si";
import { Link } from "react-router-dom";

const APPFORGE_MARK = "/favicon.svg?v=2";
const APPFORGE_ORIGIN = "https://www.sstoken.space";

const navItemClass =
  "inline-flex h-9 items-center gap-2 rounded-xl border border-border bg-secondary/70 px-4 text-sm font-semibold text-muted-foreground transition-[border-color,background-color,color,box-shadow] hover:border-foreground/25 hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

export function PublicHeader({ className = "" }: { className?: string }) {
  const docsHost = typeof window !== "undefined" && window.location.hostname.toLowerCase() === "docs.sstoken.space";
  const brand = (
    <>
      <img src={APPFORGE_MARK} alt="AppForge" className="h-9 w-9 shrink-0 rounded-xl" decoding="async" />
      <span className="text-sm font-semibold tracking-tight">AppForge</span>
    </>
  );

  return (
    <header className={`sticky top-0 z-40 border-b border-border/60 bg-background/90 backdrop-blur-xl ${className}`}>
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-4 lg:px-8">
        {docsHost ? (
          <a href={`${APPFORGE_ORIGIN}/landing`} className="group inline-flex items-center gap-4 rounded-xl focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">
            {brand}
          </a>
        ) : (
          <Link to="/landing" className="group inline-flex items-center gap-4 rounded-xl focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">
            {brand}
          </Link>
        )}
        <nav className="flex flex-wrap items-center justify-end gap-2" aria-label="Public navigation">
          {docsHost ? (
            <a href={`${APPFORGE_ORIGIN}/changelog`} className={navItemClass}>
              <History className="h-4 w-4" />
              <span className="hidden sm:inline">Changelog</span>
            </a>
          ) : (
            <Link to="/changelog" className={navItemClass}>
              <History className="h-4 w-4" />
              <span className="hidden sm:inline">Changelog</span>
            </Link>
          )}
          <a href="https://github.com/dracorisz/appforge" target="_blank" rel="noopener noreferrer" className={navItemClass}>
            <Github className="h-4 w-4" />
            <span className="hidden sm:inline">GitHub</span>
          </a>
          <a href="https://paypal.me/dracorisz" target="_blank" rel="noopener noreferrer" aria-label="Support AppForge via PayPal" title="Support AppForge" className={navItemClass}>
            <Heart className="h-4 w-4" />
            <span className="hidden sm:inline">Support</span>
          </a>
        </nav>
      </div>
    </header>
  );
}
