import { describe, expect, it } from "vitest";
import { signupAllowed } from "./signup-open";

describe("signupAllowed (cadastro público fechado)", () => {
  it("bloqueia /signup sem convite", () => {
    expect(signupAllowed(null)).toBe(false);
    expect(signupAllowed("")).toBe(false);
  });
  it("libera /signup com convite", () => {
    expect(signupAllowed("abc123")).toBe(true);
  });
});
