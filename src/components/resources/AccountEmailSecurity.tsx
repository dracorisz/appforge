import React from "react";
import { CheckCircle2, Mail, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import type { User } from "@supabase/supabase-js";
import { Badge, Button, Card, Input } from "@/components/ui";
import { supabase } from "@/lib/supabase";

export function AccountEmailSecurity({ user, onUserChanged }: { user: User; onUserChanged?: () => void }) {
  const [nextEmail, setNextEmail] = React.useState("");
  const [busy, setBusy] = React.useState<"email" | "resend" | "">("");
  const [message, setMessage] = React.useState("");
  const [error, setError] = React.useState("");
  const verified = Boolean(user.email_confirmed_at);
  const email = user.email || "";

  const resendConfirmation = async () => {
    if (!email || verified) return;
    setBusy("resend");
    setError("");
    setMessage("");
    try {
      const { error: resendError } = await supabase.auth.resend({
        type: "signup",
        email,
        options: { emailRedirectTo: `${window.location.origin}/auth/confirm` },
      });
      if (resendError) throw resendError;
      setMessage("Confirmation email requested. Check your inbox and spam folder.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not resend the confirmation email.");
    } finally {
      setBusy("");
    }
  };

  const requestEmailChange = async () => {
    const normalized = nextEmail.trim().toLowerCase();
    if (!normalized || normalized === email.toLowerCase()) return;
    setBusy("email");
    setError("");
    setMessage("");
    try {
      const { error: updateError } = await supabase.auth.updateUser(
        { email: normalized },
        { emailRedirectTo: `${window.location.origin}/auth/confirm` },
      );
      if (updateError) throw updateError;
      setNextEmail("");
      setMessage("Email change requested. Follow the verification email instructions before the login address changes.");
      onUserChanged?.();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not request the email change.");
    } finally {
      setBusy("");
    }
  };

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold">Login email</h2>
          </div>
          <p className="mt-2 break-all text-sm text-muted-foreground">{email || "No email address is attached to this account."}</p>
        </div>
        <Badge color={verified ? "green" : "slate"}>{verified ? "Verified" : "Unverified"}</Badge>
      </div>

      {!verified && email && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button type="button" variant="secondary" onClick={() => void resendConfirmation()} disabled={Boolean(busy)}>
            <RefreshCw className={`h-4 w-4 ${busy === "resend" ? "animate-spin" : ""}`} /> Resend confirmation
          </Button>
          <Link to="/auth/confirm" className="text-sm font-medium text-muted-foreground hover:text-foreground hover:underline">Open confirmation help</Link>
        </div>
      )}

      <div className="mt-4 grid gap-2">
        <Input type="email" label="Change login email" autoComplete="email" value={nextEmail} onChange={(event) => setNextEmail(event.target.value)} placeholder="new-email@example.com" />
        <Button type="button" className="mr-auto" onClick={() => void requestEmailChange()} disabled={Boolean(busy) || !nextEmail.trim() || nextEmail.trim().toLowerCase() === email.toLowerCase()}>
          {busy === "email" ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />} Request email change
        </Button>
        <p className="text-sm text-muted-foreground">Supabase may require confirmation at both the current and new addresses when Secure Email Change is enabled.</p>
      </div>

      <div className="mt-4 border-t pt-4 text-sm text-muted-foreground">
        <Link to="/auth/forgot-password" className="font-medium text-foreground hover:underline">Send a password reset email</Link>
      </div>
      {message && <div className="mt-4 text-sm text-success">{message}</div>}
      {error && <div role="alert" className="mt-4 text-sm text-destructive">{error}</div>}
    </Card>
  );
}
