// POST /api/auth/password-reset — "Esqueceu a senha?"
//
// 1. Gera o token de recuperação com a service role (admin.generateLink).
// 2. Monta o link https://<site>/auth/callback?token_hash=…&type=recovery
//    &next=/reset-password (ver src/lib/auth/password-reset.ts).
// 3. Envia {email, nome, link} ao webhook do n8n, que manda o e-mail
//    "Redefina sua senha" pelo SMTP da Data Scanner.
//
// Sempre responde { ok: true } (mesmo para e-mail sem conta), para não
// revelar quem tem cadastro. Limite: 3 pedidos por e-mail e 10 por IP
// a cada 15 minutos.
//
// Variáveis no deploy:
//   N8N_PASSWORD_RESET_WEBHOOK_URL  webhook do fluxo no n8n
//   N8N_WEBHOOK_SECRET              valor do cabeçalho X-Webhook-Secret
//   NEXT_PUBLIC_SITE_URL            (opcional) base do link

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/ai/admin-client";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { buildResetLink, normalizeEmail, resetBaseUrl } from "@/lib/auth/password-reset";

export const dynamic = "force-dynamic";

const WINDOW = 15 * 60 * 1000;

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email = normalizeEmail(body?.email);
  if (!email) {
    return NextResponse.json({ error: "invalid_email" }, { status: 400 });
  }

  const byIp = checkRateLimit(`pwreset:ip:${getClientIp(request)}`, { limit: 10, windowMs: WINDOW });
  if (!byIp.success) return rateLimitResponse(byIp);
  const byEmail = checkRateLimit(`pwreset:email:${email}`, { limit: 3, windowMs: WINDOW });
  if (!byEmail.success) return rateLimitResponse(byEmail);

  const webhookUrl = process.env.N8N_PASSWORD_RESET_WEBHOOK_URL?.trim();
  const secret = process.env.N8N_WEBHOOK_SECRET?.trim();
  if (!webhookUrl || !secret || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    // Sem configuração: a página usa o envio padrão do Supabase.
    return NextResponse.json({ error: "not_configured" }, { status: 501 });
  }

  const admin = supabaseAdmin();
  const { data, error } = await admin.auth.admin.generateLink({ type: "recovery", email });
  const hashedToken = data?.properties?.hashed_token;
  if (error || !hashedToken) {
    // E-mail sem conta (ou erro do auth): resposta igual, nada enviado.
    if (error && !/not.?found|no user/i.test(error.message)) {
      console.error("[password-reset] generateLink failed:", error.message);
    }
    return NextResponse.json({ ok: true });
  }

  const meta = (data.user?.user_metadata ?? {}) as { full_name?: string; name?: string };
  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: { "content-type": "application/json", "X-Webhook-Secret": secret },
    body: JSON.stringify({
      email,
      nome: meta.full_name || meta.name || "",
      link: buildResetLink(resetBaseUrl(), hashedToken),
    }),
    signal: AbortSignal.timeout(10_000),
  }).catch((e: unknown) => {
    console.error("[password-reset] webhook failed:", e);
    return null;
  });

  // Mesma resposta de sucesso mesmo se o n8n falhar: um 502 só para
  // e-mails cadastrados revelaria quem tem conta. A falha fica no log.
  if (res && !res.ok) {
    console.error("[password-reset] webhook responded", res.status);
  }
  return NextResponse.json({ ok: true });
}
