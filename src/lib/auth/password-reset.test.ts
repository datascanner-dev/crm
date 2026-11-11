import { describe, expect, it } from "vitest";
import { buildResetLink, normalizeEmail, resetBaseUrl } from "./password-reset";

describe("password reset link", () => {
  it("usa a URL fixa do site, nunca o host da requisição", () => {
    expect(resetBaseUrl({})).toBe("https://crm.datascanner.com.br");
    expect(resetBaseUrl({ NEXT_PUBLIC_SITE_URL: "https://x.com/" })).toBe("https://x.com");
  });
  it("monta o link para o callback com token_hash", () => {
    const link = new URL(buildResetLink("https://crm.datascanner.com.br", "abc"));
    expect(link.pathname).toBe("/auth/callback");
    expect(link.searchParams.get("token_hash")).toBe("abc");
    expect(link.searchParams.get("type")).toBe("recovery");
    expect(link.searchParams.get("next")).toBe("/reset-password");
  });
  it("valida o e-mail", () => {
    expect(normalizeEmail(" Amanda@X.com ")).toBe("amanda@x.com");
    expect(normalizeEmail("nao-e-email")).toBeNull();
    expect(normalizeEmail(42)).toBeNull();
  });
});
