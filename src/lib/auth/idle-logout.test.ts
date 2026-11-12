import { describe, expect, it } from "vitest";

import {
  IDLE_LOGOUT_MS,
  effectiveLastActivity,
  isIdleExpired,
  parseStoredActivity,
} from "./idle-logout";

const T0 = Date.parse("2026-11-12T12:00:00Z");

describe("idle logout", () => {
  it("expires after 30 minutes without activity", () => {
    expect(isIdleExpired(T0 + IDLE_LOGOUT_MS - 1, T0)).toBe(false);
    expect(isIdleExpired(T0 + IDLE_LOGOUT_MS, T0)).toBe(true);
  });

  it("never expires when nothing is known yet", () => {
    expect(isIdleExpired(T0, null)).toBe(false);
  });

  it("a fresh sign-in resets an old stored activity", () => {
    const old = T0 - 5 * 60 * 60 * 1000;
    const signIn = new Date(T0 - 60 * 1000).toISOString();
    const last = effectiveLastActivity(old, signIn);
    expect(last).toBe(T0 - 60 * 1000);
    expect(isIdleExpired(T0, last)).toBe(false);
  });

  it("an old sign-in does not hide recent activity", () => {
    const signIn = new Date(T0 - 3 * 24 * 60 * 60 * 1000).toISOString();
    expect(effectiveLastActivity(T0 - 1000, signIn)).toBe(T0 - 1000);
  });

  it("reopening after hours away logs out", () => {
    const signIn = new Date(T0 - 10 * 60 * 60 * 1000).toISOString();
    const stored = T0 - 2 * 60 * 60 * 1000;
    expect(isIdleExpired(T0, effectiveLastActivity(stored, signIn))).toBe(true);
  });

  it("ignores garbage in storage and in the sign-in date", () => {
    expect(parseStoredActivity(null)).toBeNull();
    expect(parseStoredActivity("abc")).toBeNull();
    expect(parseStoredActivity("-5")).toBeNull();
    expect(parseStoredActivity(String(T0))).toBe(T0);
    expect(effectiveLastActivity(null, "not a date")).toBeNull();
  });
});
