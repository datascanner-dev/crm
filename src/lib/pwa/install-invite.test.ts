import { describe, expect, it } from "vitest";
import {
  INITIAL_STATE,
  MAX_LOGIN_REMINDERS,
  onAccept,
  onDismiss,
  onLogin,
  readState,
  registerLogin,
  shouldShow,
} from "./install-invite";

function memoryStorage() {
  const m = new Map<string, string>();
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) };
}

describe("PWA install invite", () => {
  it("shows on first access", () => {
    expect(shouldShow(INITIAL_STATE)).toBe(true);
  });

  it("after cancel, shows once on each of the next 3 logins and then never", () => {
    let s = onDismiss(INITIAL_STATE);
    expect(shouldShow(s)).toBe(false);
    for (let i = 0; i < MAX_LOGIN_REMINDERS; i++) {
      s = onLogin(s);
      expect(shouldShow(s)).toBe(true);
      s = onDismiss(s);
      expect(shouldShow(s)).toBe(false);
    }
    s = onLogin(s);
    expect(shouldShow(s)).toBe(false);
  });

  it("a reminder not yet seen does not stack across logins", () => {
    let s = onDismiss(INITIAL_STATE);
    s = onLogin(onLogin(s));
    expect(s.remindersLeft).toBe(MAX_LOGIN_REMINDERS - 1);
    expect(shouldShow(s)).toBe(true);
  });

  it("never shows again after accepting", () => {
    let s = onAccept(INITIAL_STATE);
    expect(shouldShow(s)).toBe(false);
    s = onLogin(s);
    expect(shouldShow(s)).toBe(false);
    expect(shouldShow(onAccept(onLogin(onDismiss(INITIAL_STATE))))).toBe(false);
  });

  it("logins before any cancel do not consume reminders", () => {
    const s = onLogin(INITIAL_STATE);
    expect(s).toEqual(INITIAL_STATE);
  });

  it("persists through storage and tolerates bad data", () => {
    const st = memoryStorage();
    st.setItem("dscrm.pwa.invite", "{not json");
    expect(readState(st)).toEqual(INITIAL_STATE);
    st.setItem("dscrm.pwa.invite", JSON.stringify(onDismiss(INITIAL_STATE)));
    registerLogin(st);
    expect(shouldShow(readState(st))).toBe(true);
  });
});

describe("resetState (?instalar)", () => {
  it("volta ao primeiro acesso mesmo depois de aceitar ou esgotar os lembretes", async () => {
    const { resetState, readState, writeState, shouldShow, INITIAL_STATE } = await import("./install-invite");
    const mem = new Map<string, string>();
    const storage = { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => void mem.set(k, v) };
    writeState(storage, { ...INITIAL_STATE, accepted: true });
    mem.set("dscrm.pwa.dismissedAt", "1");
    expect(shouldShow(readState(storage))).toBe(false);
    resetState(storage);
    expect(shouldShow(readState(storage))).toBe(true);
  });
});
