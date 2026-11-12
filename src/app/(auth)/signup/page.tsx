"use client";

import { authErrorMessage } from "@/lib/auth-error-message";
import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { AuthShell } from "@/components/brand/auth-shell";
import { PasswordInput } from "@/components/brand/password-input";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// `useSearchParams` opts the component out of static prerendering
// unless wrapped in Suspense — same pattern as /login.
export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <SignupPageInner />
    </Suspense>
  );
}

function SignupPageInner() {
  const searchParams = useSearchParams();
  // When the user lands here from `/join/<token>` we carry the
  // invite token in the query so it survives the signup → email
  // verification → redirect round-trip. `emailRedirectTo` below
  // sends the verified user to /join/<token> so they land on the
  // redeem step instead of being dropped on /dashboard.
  const inviteToken = searchParams.get("invite");
  const t = useTranslations("SignupPage");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const supabase = createClient();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError(t("passwordsMismatch"));
      return;
    }

    if (password.length < 6) {
      setError(t("passwordTooShort"));
      return;
    }

    setLoading(true);

    // With an invite, the account is created on the server: public
    // sign-up is closed in Supabase Auth, so the browser can't call
    // signUp. The route creates the user (already confirmed) and
    // redeems the invite; then we sign in and go straight in.
    if (inviteToken) {
      const res = await fetch(
        `/api/invitations/${encodeURIComponent(inviteToken)}/signup`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ full_name: fullName, email, password }),
        },
      ).catch(() => null);
      const payload = (await res?.json().catch(() => null)) as
        | { ok?: boolean; error?: string }
        | null;

      if (!res || !res.ok || !payload?.ok) {
        const code = res?.status === 429 ? "rate_limited" : payload?.error;
        setError(
          code === "email_taken"
            ? t("emailTaken")
            : code === "invite_invalid"
              ? t("inviteInvalid")
              : code === "rate_limited"
                ? t("tooManyAttempts")
                : t("signupFailed"),
        );
        setLoading(false);
        return;
      }

      // Full-page navigation, same as /login: the middleware must see
      // the freshly written auth cookies (issue #365).
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) {
        // Account exists and joined the team; just send them to login.
        window.location.href = "/login";
        return;
      }
      window.location.href = "/dashboard";
      return;
    }

    // Always name our own origin as the place the confirmation link
    // returns to. Previously this was left unset unless an invite was
    // involved, so Supabase fell back to its Site URL — which on a
    // freshly-created or self-hosted project is `http://localhost:3000`
    // (issue #595) — and even when the Site URL was right the link
    // landed on `/` with an unexchanged `?code=`, so the user had to
    // sign in again after verifying. /auth/callback exchanges the link
    // for a session and forwards to `next` (issue #592). Supabase still
    // has to allow this origin under Authentication → URL Configuration
    // → Redirect URLs; see docs/auth-emails.md.
    const next = inviteToken
      ? `/join/${encodeURIComponent(inviteToken)}`
      : "/dashboard";
    const emailRedirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
        emailRedirectTo,
      },
    });

    if (error) {
      setError(authErrorMessage(error));
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  };

  const loginHref = inviteToken
    ? `/login?invite=${encodeURIComponent(inviteToken)}`
    : "/login";

  if (success) {
    return (
      <AuthShell
        title={t("checkEmailTitle")}
        description={t.rich("checkEmailDesc", {
          email,
          strong: (chunks) => (
            <span className="text-foreground">{chunks}</span>
          ),
        })}
      >
        <Button
          variant="outline"
          className="h-14 w-full border-border text-base text-foreground hover:bg-muted"
          render={<Link href={loginHref} />}
          nativeButton={false}
        >
          {t("backToSignIn")}
        </Button>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title={inviteToken ? t("titleJoin") : t("title")}
      description={inviteToken ? t("descJoin") : t("desc")}
      footer={
        <>
          {t("haveAccount")}{" "}
          <Link
            href={loginHref}
            className="inline-flex min-h-11 items-center font-medium text-primary hover:text-primary/80"
          >
            {t("signIn")}
          </Link>
        </>
      }
    >
      <form onSubmit={handleSignup} className="flex flex-col gap-4">
        {error && (
          <div
            role="alert"
            className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-400"
          >
            {error}
          </div>
        )}

        <div className="flex flex-col gap-2">
          <Label htmlFor="fullName" className="text-muted-foreground">
            {t("fullNameLabel")}
          </Label>
          <Input
            id="fullName"
            type="text"
            autoComplete="name"
            autoCapitalize="words"
            enterKeyHint="next"
            placeholder={t("fullNamePlaceholder")}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            className="h-14 border-border bg-muted text-foreground placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-primary/20"
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="email" className="text-muted-foreground">
            {t("emailLabel")}
          </Label>
          <Input
            id="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            enterKeyHint="next"
            placeholder={t("emailPlaceholder")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="h-14 border-border bg-muted text-foreground placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-primary/20"
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="password" className="text-muted-foreground">
            {t("passwordLabel")}
          </Label>
          <PasswordInput
            className="h-14"
            id="password"
            autoComplete="new-password"
            enterKeyHint="next"
            minLength={6}
            placeholder={t("passwordPlaceholder")}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="confirmPassword" className="text-muted-foreground">
            {t("confirmPasswordLabel")}
          </Label>
          <PasswordInput
            className="h-14"
            id="confirmPassword"
            autoComplete="new-password"
            enterKeyHint="go"
            minLength={6}
            placeholder={t("confirmPasswordPlaceholder")}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="mt-2 h-14 w-full bg-primary text-base text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? t("creating") : t("submit")}
        </Button>
      </form>
    </AuthShell>
  );
}
