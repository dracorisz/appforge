import React from 'react'
import { ArrowLeft, ExternalLink, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'

const LAST_UPDATED = 'September 9, 2026'

function LegalShell({ title, intro, children }: { title: string; intro: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-5">
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Back to AppForge</Link>
          <div className="inline-flex items-center gap-2 text-xs text-muted-foreground"><img src="/favicon.svg" alt="" className="h-5 w-5" /> AppForge · sstoken.space</div>
        </header>

        <main className="py-8">
          <div className="mb-8">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/55 px-3 py-1.5 text-xs font-medium text-muted-foreground"><ShieldCheck className="h-3.5 w-3.5" /> Public beta policy</div>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">{intro}</p>
            <p className="mt-2 text-xs text-muted-foreground">Last updated: {LAST_UPDATED}</p>
          </div>
          <div className="surface-card space-y-7 rounded-2xl border p-5 text-sm leading-7 sm:p-7 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:tracking-tight [&_p]:text-muted-foreground [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5 [&_ul]:text-muted-foreground">
            {children}
          </div>
        </main>

        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 py-5 text-xs text-muted-foreground">
          <span>AppForge · open-source public beta</span>
          <span className="flex gap-4"><Link to="/privacy" className="hover:text-foreground">Privacy</Link><Link to="/terms" className="hover:text-foreground">Terms</Link><a href="https://github.com/dracorisz/appforge" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-foreground">GitHub <ExternalLink className="h-3 w-3" /></a></span>
        </footer>
      </div>
    </div>
  )
}

export function PrivacyPolicyPage() {
  return (
    <LegalShell title="Privacy Policy" intro="This policy explains how AppForge handles account information, workspace data, tool inputs, Google sign-in data, cookies, and browser storage while the service is in public beta.">
      <section><h2>1. Information we collect</h2><p>When you sign in with Google through Supabase Auth, AppForge receives basic identity information needed to create and maintain your account, such as your Google account identifier, name, email address, and profile image when provided by Google. AppForge may also store workspace information you choose to create, including profile fields, favorites, recent apps, settings, category overrides, and other account-scoped preferences.</p></section>
      <section><h2>2. Google user data</h2><p>AppForge uses Google user data only to authenticate you, identify your account, display basic profile information, and associate your workspace data with your authenticated user ID. AppForge does not use Google user data for advertising, does not sell Google user data, and does not request access to Gmail, Drive, Calendar, Contacts, or other Google services as part of the normal sign-in flow.</p></section>
      <section><h2>3. Tool and AI inputs</h2><p>Some tools process data locally in your browser. Server-backed tools may send the minimum information needed to AppForge server functions. When you use Dragon Arena, your selected action and a short portion of recent game history are sent through an AppForge server function to OpenAI so the game can generate the next turn. Do not submit secrets or information you do not want processed by the relevant service.</p></section>
      <section><h2>4. How we use information</h2><ul><li>Provide sign-in, account, profile, preference, and workspace features.</li><li>Operate requested tools and return their results.</li><li>Maintain security, prevent abuse, diagnose failures, and improve reliability.</li><li>Preserve user-selected settings and cross-device continuity where enabled.</li></ul></section>
      <section><h2>5. Service providers</h2><p>AppForge relies on service providers to operate the product, including Google for identity, Supabase for authentication and database services, Vercel for hosting and server functions, and OpenAI for features that are explicitly AI-powered. Those providers process data under their own terms and privacy policies.</p></section>
      <section><h2>6. Cookies, local storage, and technical data</h2><p>AppForge uses essential authentication/session cookies and browser storage required to keep you signed in, remember preferences, cache PWA resources, preserve basic application state, and dismiss notices you have already seen. We do not currently use advertising cookies or third-party behavioral advertising trackers. Hosting and infrastructure providers may also process routine technical information such as IP addresses, request metadata, timestamps, error details, and device or browser information for security and service operation.</p></section>
      <section><h2>7. Retention and deletion</h2><p>Account-scoped data is retained while needed to provide the service or until it is deleted through available account controls or a valid deletion request. Operational logs may be retained for shorter periods according to the infrastructure provider's settings and policies. Requests about access, correction, or deletion can be raised with the project maintainer through the public repository contact channels; do not post sensitive personal information in a public issue.</p></section>
      <section><h2>8. Security</h2><p>AppForge uses Supabase authentication and row-level security as part of its account data boundary and keeps server credentials out of the browser bundle. No system can guarantee absolute security, and the project should be treated as a public beta while security and operational controls continue to mature.</p></section>
      <section><h2>9. Changes</h2><p>This policy may be updated when features, providers, or data practices change. The date at the top of this page identifies the latest published version.</p></section>
      <section><h2>10. Contact</h2><p>For privacy questions, use the contact methods listed in the AppForge GitHub repository. For private security matters, follow the repository's SECURITY.md process rather than opening a public issue.</p></section>
    </LegalShell>
  )
}

export function TermsOfServicePage() {
  return (
    <LegalShell title="Terms of Service" intro="These terms set the baseline rules for using the AppForge public beta, including the open-source tools, authenticated workspace, and AI-powered features.">
      <section><h2>1. Using AppForge</h2><p>By using AppForge, you agree to use the service lawfully and in a way that does not interfere with the service, other users, third-party systems, or applicable rights. The public beta may change, become unavailable, or contain defects while development continues.</p></section>
      <section><h2>2. Accounts</h2><p>Some features require Google sign-in through Supabase Auth. You are responsible for maintaining control of your account and for activity performed through your authenticated session. Do not attempt to access another user's account or bypass access controls.</p></section>
      <section><h2>3. Acceptable use</h2><ul><li>Do not use AppForge to violate law, privacy, intellectual-property rights, platform rules, or contractual restrictions.</li><li>Do not attack, overload, probe, scrape, or circumvent AppForge or third-party services in a manner that is unauthorized or abusive.</li><li>Do not upload or submit malicious code, credentials, regulated secrets, or content you are not authorized to process.</li></ul></section>
      <section><h2>4. Tool outputs</h2><p>Utility, scraping, market, weather, conversion, and AI outputs can be incomplete, delayed, incorrect, or dependent on third-party sources. You are responsible for reviewing outputs before relying on them. AppForge is not a substitute for professional legal, financial, medical, security, or other regulated advice.</p></section>
      <section><h2>5. AI features</h2><p>AI-generated content, including Dragon Arena narrative and choices, is generated probabilistically and may be inaccurate or unexpected. AI inputs may be processed by OpenAI through AppForge's server-side integration when you choose to use an AI-powered feature.</p></section>
      <section><h2>6. Tokens, points, rewards, and experimental game systems</h2><p>Any points, gems, runes, token references, achievements, or reward mechanics shown during development are experimental product features unless a separate published program expressly states otherwise. They are not a promise of monetary value, liquidity, investment return, ownership interest, or future distribution.</p></section>
      <section><h2>7. Cookies and local storage</h2><p>AppForge uses essential browser storage and authentication/session cookies needed for sign-in, preferences, cached PWA operation, and normal service functionality. Continued use of the service requires these essential mechanisms; advertising cookies are not currently used by AppForge.</p></section>
      <section><h2>8. Open-source code and third-party services</h2><p>Source code published in the AppForge repository is licensed under the repository's stated open-source license. Hosted service functionality may also depend on third-party platforms that have their own terms, policies, quotas, and availability.</p></section>
      <section><h2>9. Availability and changes</h2><p>Features may be added, changed, restricted, or removed. AppForge may suspend access when necessary for security, abuse prevention, maintenance, legal compliance, or service integrity.</p></section>
      <section><h2>10. Disclaimer and limitation</h2><p>To the extent permitted by applicable law, AppForge is provided on an "as is" and "as available" basis without guarantees that every feature will be uninterrupted, error-free, or suitable for a particular purpose. Nothing in these terms excludes rights or liabilities that cannot legally be excluded.</p></section>
      <section><h2>11. Changes and contact</h2><p>These terms may be updated as the public beta evolves. The date at the top identifies the latest version. Questions can be directed through the contact methods listed in the AppForge GitHub repository.</p></section>
    </LegalShell>
  )
}
