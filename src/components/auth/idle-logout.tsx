"use client";

import { useEffect } from "react";

import { useAuth } from "@/hooks/use-auth";
import { createClient } from "@/lib/supabase/client";
import {
  ACTIVITY_WRITE_THROTTLE_MS,
  IDLE_LOGOUT_MS,
  IDLE_LOGOUT_REASON,
  LAST_ACTIVITY_KEY,
  effectiveLastActivity,
  isIdleExpired,
  parseStoredActivity,
} from "@/lib/auth/idle-logout";

const ACTIVITY_EVENTS = ["pointerdown", "keydown", "wheel", "touchstart", "scroll"] as const;
const CHECK_EVERY_MS = 30 * 1000;

function readStored(): number | null {
  try {
    return parseStoredActivity(window.localStorage.getItem(LAST_ACTIVITY_KEY));
  } catch {
    return null;
  }
}

function writeStored(ts: number) {
  try {
    window.localStorage.setItem(LAST_ACTIVITY_KEY, String(ts));
  } catch {
    // Storage bloqueado (modo privado restrito): o relógio fica só em memória.
  }
}

/**
 * IdleLogout — headless. Mount once inside the signed-in dashboard
 * shell. Signs the user out after IDLE_LOGOUT_MS with no interaction in
 * any tab, and also on return (tab shown again / PWA resumed) when the
 * limit already passed while away.
 */
export function IdleLogout() {
  const { user } = useAuth();
  const lastSignInAt = user?.last_sign_in_at ?? null;

  useEffect(() => {
    if (!user) return;

    let lastActivity = effectiveLastActivity(readStored(), lastSignInAt) ?? Date.now();
    let lastWrite = 0;
    let loggingOut = false;

    const logout = async () => {
      if (loggingOut) return;
      loggingOut = true;
      try {
        await createClient().auth.signOut();
      } finally {
        window.location.href = `/login?reason=${IDLE_LOGOUT_REASON}`;
      }
    };

    const check = () => {
      // Outra aba pode ter registrado atividade mais recente.
      const shared = readStored();
      if (shared && shared > lastActivity) lastActivity = shared;
      if (isIdleExpired(Date.now(), lastActivity)) void logout();
    };

    // Ao abrir: se ficou parado além do limite (ex.: PWA reaberto horas
    // depois), sai já; senão marca agora como atividade.
    if (isIdleExpired(Date.now(), lastActivity)) {
      void logout();
      return;
    }
    lastActivity = Date.now();
    writeStored(lastActivity);
    lastWrite = lastActivity;

    const onActivity = () => {
      const now = Date.now();
      lastActivity = now;
      if (now - lastWrite >= ACTIVITY_WRITE_THROTTLE_MS) {
        lastWrite = now;
        writeStored(now);
      }
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") check();
    };

    ACTIVITY_EVENTS.forEach((e) =>
      window.addEventListener(e, onActivity, { passive: true, capture: true }),
    );
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", check);
    const timer = window.setInterval(check, Math.min(CHECK_EVERY_MS, IDLE_LOGOUT_MS));

    return () => {
      ACTIVITY_EVENTS.forEach((e) =>
        window.removeEventListener(e, onActivity, { capture: true }),
      );
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", check);
      window.clearInterval(timer);
    };
    // Re-run only when the signed-in user changes, not on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, lastSignInAt]);

  return null;
}
