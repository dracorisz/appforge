import * as React from "react";
import { CheckCircle2, KeyRound, Loader2, MailCheck, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import { Button, Card, Input } from "@/components/ui";
import { PublicFooter } from "@/components/public/PublicFooter";
import { PublicHeader } from "@/components/public/PublicHeader";
import { supabase } from "@/lib/supabase";

type Mode = "forgot" | "reset" | "confirm";
type FlowState = "idle" | "loading" | "ready" | "success" | "error";
type VerifyType = "email" | "recovery" | "invite" | "email_change" | "signup" | "magiclink";

const queryError = () => {
  const query = new URLSearchParams(window.location.search);
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  return query.get("error_description") || hash.get("error_description") || query.get("error") || hash.get("error") || "";
};

const validPassword = (value: string) => value.length >= 8 && /[a-z]/.test(value) && /[A-Z]/.test(value) && /\d/.test(value) && /[^A-Za-z0-9]/.test(value);

export function AuthEmailFlowPage({ mode }: { mode: Mode }) {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [state, setState] = React.useState<FlowState>(mode === "reset" || mode === "confirm" ? "loading" : "idle");
  const [message, setMessage] = React.useState("");

  React.useEffect(() => {
    document.title = mode === "forgot" ? "Reset password · AppForge" : mode === "reset" ? "Choose a new password · AppForge" : "Confirm email · AppForge";
  }, [mode]);

  React.useEffect(() => {
    if (mode === "forgot") return;
    let cancelled = false;
    let settleTimer = 0;

    const failFromUrl = queryError();
    if (failFromUrl) {
      setState("error");
      setMessage(failFromUrl);
      return;
    }

    const initialize = async () => {
      if (mode === "confirm") {
        const params = new URLSearchParams(window.location.search);
        const tokenHash = params.get("token_hash");
        const type = params.get("type") as VerifyType | null;
        if (tokenHash && type) {
          const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
          if (cancelled) return;
          if (error) {
            setState("error");
            setMessage(error.message || "This confirmation link is invalid or has expired.");
            return;
          }
          setState("success");
          setMessage("Your email address is confirmed. You can continue to AppForge.");
          return;
        }
      }

      const { data, error } = await supabase.auth.getSession();
      if (cancelled) return;
      if (error) {
        setState("error");
        setMessage(error.message);
        return;
      }
      if (data.session) {
        setState(mode === "reset" ? "ready" : "success");
        if (mode === "confirm") setMessage("Your email address is confirmed. You can continue to AppForge.");
        return;
      }

      settleTimer = window.setTimeout(() => {
        if (cancelled) return;
        setState("error");
        setMessage(mode === "reset" ? "This password recovery link is invalid or has expired. Request a new one to continue." : "This confirmation link is invalid or has expired. You can resend confirmation below.");
      }, 1800);
    };

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled || !session) return;
      if (mode === "reset" && event === "PASSWORD_RECOVERY") setState("ready");
      if (mode === "confirm" && (event === "SIGNED_IN" || event === "USER_UPDATED")) {
        setState("success");
        setMessage("Your email address is confirmed. You can continue to AppForge.");
      }
    });

    void initialize();
    return () => {
      cancelled = true;
      if (settleTimer) window.clearTimeout(settleTimer);
      listener.subscription.unsubscribe();
    };
  }, [mode]);

  const requestReset = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email.trim()) return;
    setState("loading");
    setMessage("");
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/auth/reset-password` });
    if (error) {
      setState("error");
      setMessage(error.message);
      return;
    }
    setState("success");
    setMessage("If an AppForge account exists for that address, a password recovery email has been sent.");
  };

  const updatePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validPassword(password)) {
      setMessage("Password must be at least 8 characters and include lowercase, uppercase, a digit and a symbol.");
      setState("error");
      return;
    }
    if (password !== confirmPassword) {
      setMessage("Password confirmation does not match.");
      setState("error");
      return;
    }
    setState("loading");
    setMessage("");
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setState("error");
      setMessage(error.message);
      return;
    }
    setPassword("");
    setConfirmPassword("");
    setState("success");
    setMessage("Your password has been reset. You can continue with the new password.");
  };

  const resendConfirmation = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email.trim()) return;
    setState("loading");
    setMessage("");
    const { error } = await supabase.auth.resend({ type: "signup", email: email.trim(), options: { emailRedirectTo: `${window.location.origin}/auth/confirm` } });
    if (error) {
      setState("error");
      setMessage(error.message);
      return;
    }
    setState("success");
    setMessage("A new confirmation email has been sent if that address is awaiting verification.");
  };

  const title = mode === "forgot" ? "Reset your password" : mode === "reset" ? "Choose a new password" : "Confirm your email";
  const description = mode === "forgot" ? "Enter your email and AppForge will send a secure recovery link." : mode === "reset" ? "Use the recovery session from your email to set a new login password." : "Finish email verification or request a fresh confirmation link.";

  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <PublicHeader />
      <main className="mx-auto flex w-full max-w-xl flex-1 items-center px-4 py-8">
        <Card className="w-full p-8 shadow-xl">
          <div className="flex items-start gap-4">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-border/70 bg-accent/50">{mode === "confirm" ? <MailCheck className="h-4 w-4" /> : <KeyRound className="h-4 w-4" />}</div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
              <p className="mt-2 text-sm text-muted-foreground">{description}</p>
            </div>
          </div>

          {state === "loading" && mode !== "forgot" && (
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-border/70 p-4 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Verifying secure email session…
            </div>
          )}
          {message && (
            <div role={state === "error" ? "alert" : "status"} className={`mt-4 rounded-xl border p-4 text-sm ${state === "error" ? "border-destructive/30 bg-destructive/5 text-destructive" : "border-success/30 bg-success/5 text-foreground"}`}>
              {message}
            </div>
          )}

          {mode === "forgot" && state !== "success" && (
            <form onSubmit={requestReset} className="mt-4 grid gap-4">
              <Input label="Email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
              <Button type="submit" disabled={state === "loading" || !email.trim()}>
                {state === "loading" ? <Loader2 className="animate-spin" /> : <RefreshCw />} Send recovery email
              </Button>
            </form>
          )}

          {mode === "reset" && state === "ready" && (
            <form onSubmit={updatePassword} className="mt-4 grid gap-4">
              <Input label="New password" type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
              <Input label="Confirm new password" type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required />
              <Button type="submit">Reset password</Button>
            </form>
          )}

          {mode === "confirm" && state !== "loading" && (
            <form onSubmit={resendConfirmation} className="mt-4 grid gap-4">
              <Input label="Email for confirmation resend" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
              <Button type="submit" variant="secondary" disabled={!email.trim()}>
                <MailCheck /> Resend confirmation
              </Button>
            </form>
          )}

          <div className="mt-8 flex flex-wrap items-center gap-4 text-sm">
            <Link to="/login" className="font-medium text-foreground hover:underline">
              Back to sign in
            </Link>
            {mode !== "forgot" && (
              <Link to="/auth/forgot-password" className="text-muted-foreground hover:text-foreground hover:underline">
                Request a new recovery link
              </Link>
            )}
            {state === "success" && (
              <Link to="/" className="inline-flex items-center gap-2 font-medium text-foreground hover:underline">
                <CheckCircle2 className="h-4 w-4" /> Continue to AppForge
              </Link>
            )}
          </div>
        </Card>
      </main>
      <PublicFooter />
    </div>
  );
}
