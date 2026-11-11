"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Share, SquarePlus, X } from "lucide-react";
import { BrandMark } from "@/components/brand/brand-mark";
import { Button } from "@/components/ui/button";
import {
  onAccept,
  onDismiss,
  readState,
  shouldShow,
  writeState,
} from "@/lib/pwa/install-invite";

function inviteAllowed() {
  try {
    return shouldShow(readState(localStorage));
  } catch {
    return true;
  }
}

// PWA: registers the service worker and invites the user to install the
// app on their very first visit (no engagement delay).
//
// - Chromium (Android / desktop): we intercept `beforeinstallprompt`,
//   show our own invite right away and fire the native prompt on
//   "Install".
// - iOS / iPadOS Safari: there is no install API, so the invite shows
//   the two Share → "Add to Home Screen" steps instead.
// - Already installed (standalone): nothing is shown.
// - Cancel / accept rules (next 3 logins after a cancel, never after
//   accepting) live in @/lib/pwa/install-invite.

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}


function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIos() {
  const ua = navigator.userAgent;
  const iPadOs = navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
  return /iPhone|iPad|iPod/.test(ua) || iPadOs;
}


export function PwaInstallPrompt() {
  const t = useTranslations("PwaInstall");
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [mode, setMode] = useState<"hidden" | "native" | "ios">("hidden");

  useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/", updateViaCache: "none" })
        .catch(() => {});
    }

    if (isStandalone() || !inviteAllowed()) return;

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setMode("native");
    };
    const onInstalled = () => {
      try {
        writeState(localStorage, onAccept(readState(localStorage)));
      } catch {}
      setDeferred(null);
      setMode("hidden");
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);

    let iosTimer: number | undefined;
    if (isIos()) {
      // Short delay so the invite doesn't flash over the first paint.
      iosTimer = window.setTimeout(() => setMode("ios"), 800);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
      if (iosTimer) window.clearTimeout(iosTimer);
    };
  }, []);

  // Cancelar: volta só nos próximos 3 logins (uma vez em cada).
  const dismiss = useCallback(() => {
    try {
      writeState(localStorage, onDismiss(readState(localStorage)));
    } catch {
      // storage indisponível (modo privado): esconde só nesta visita
    }
    setMode("hidden");
  }, []);

  // Aceitar (instalou, ou "Entendi" no passo a passo do iPhone): não volta mais.
  const accept = useCallback(() => {
    try {
      writeState(localStorage, onAccept(readState(localStorage)));
    } catch {}
    setMode("hidden");
  }, []);

  const install = useCallback(async () => {
    if (!deferred) return;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    setDeferred(null);
    if (outcome === "dismissed") dismiss();
    else accept();
  }, [deferred, dismiss, accept]);

  if (mode === "hidden") return null;

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby="pwa-install-title"
      aria-describedby="pwa-install-desc"
      className="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-50 mx-auto max-w-md animate-in fade-in slide-in-from-bottom-4 rounded-2xl border border-border bg-card p-4 text-card-foreground shadow-2xl sm:right-6 sm:bottom-6 sm:left-auto sm:mx-0 sm:w-96"
    >
      <div className="flex items-start gap-3">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[#ff4602]">
          <BrandMark className="size-7 brightness-0 invert" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 id="pwa-install-title" className="text-base font-semibold text-foreground">
            {t("title")}
          </h2>
          <p id="pwa-install-desc" className="mt-1 text-sm text-muted-foreground">
            {mode === "ios" ? t("iosIntro") : t("desc")}
          </p>
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label={t("close")}
          className="-mt-2 -mr-2 flex size-11 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:outline-none"
        >
          <X className="size-5" aria-hidden="true" />
        </button>
      </div>

      {mode === "ios" ? (
        <>
          <ol className="mt-3 flex flex-col gap-2 text-sm text-foreground">
            <li className="flex items-center gap-3 rounded-xl bg-muted px-3 py-2.5">
              <Share className="size-5 shrink-0 text-primary" aria-hidden="true" />
              <span>{t.rich("iosStep1", { strong: (c) => <strong>{c}</strong> })}</span>
            </li>
            <li className="flex items-center gap-3 rounded-xl bg-muted px-3 py-2.5">
              <SquarePlus className="size-5 shrink-0 text-primary" aria-hidden="true" />
              <span>{t.rich("iosStep2", { strong: (c) => <strong>{c}</strong> })}</span>
            </li>
          </ol>
          <Button
            type="button"
            onClick={accept}
            variant="outline"
            className="mt-3 h-12 w-full text-base"
          >
            {t("gotIt")}
          </Button>
        </>
      ) : (
        <div className="mt-4 flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={dismiss}
            className="h-12 flex-1 text-base"
          >
            {t("notNow")}
          </Button>
          <Button
            type="button"
            onClick={install}
            className="h-12 flex-1 bg-primary text-base text-primary-foreground hover:bg-primary/90"
          >
            {t("install")}
          </Button>
        </div>
      )}
    </div>
  );
}
