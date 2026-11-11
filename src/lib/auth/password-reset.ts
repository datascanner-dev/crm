// Link de redefinição de senha enviado pelo n8n (Data Scanner CRM).
//
// O Supabase self-hosted do CRM não tem SMTP. Em vez de depender do
// e-mail do Supabase, o servidor gera o token de recuperação (admin
// generateLink) e monta o link para /auth/callback com token_hash —
// o mesmo caminho que o callback já aceita — e o n8n envia o e-mail.

export const DEFAULT_SITE_URL = "https://crm.datascanner.com.br";

/** Base fixa para o link (nunca o Host da requisição: evita links
 *  apontando para domínio de terceiros via cabeçalho forjado). */
export function resetBaseUrl(env: Record<string, string | undefined> = process.env): string {
  const explicit = env.NEXT_PUBLIC_SITE_URL?.trim();
  return (explicit || DEFAULT_SITE_URL).replace(/\/+$/, "");
}

export function buildResetLink(baseUrl: string, hashedToken: string): string {
  const params = new URLSearchParams({
    token_hash: hashedToken,
    type: "recovery",
    next: "/reset-password",
  });
  return `${baseUrl}/auth/callback?${params.toString()}`;
}

export function normalizeEmail(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const email = raw.trim().toLowerCase();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  return email;
}
