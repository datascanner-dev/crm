// ============================================================
// POST /api/invitations/[token]/signup
//
// Public. Creates the account for someone who received an invite
// and joins them to the inviter's account in the same request.
//
// Why server-side
//   Public sign-up is closed at the Supabase Auth level
//   (GOTRUE_DISABLE_SIGNUP=true), so the browser can no longer call
//   `supabase.auth.signUp`. The admin API still creates users, so the
//   invite flow goes through here:
//
//   1. Check the invite is valid (peek_invitation).
//   2. Create the user, already confirmed (admin.createUser).
//   3. Sign in as that user and redeem the invite (redeem_invitation),
//      which consumes the token: one invite → one account.
//   4. If step 3 fails, delete the user so nothing is left half-made.
//
// Body: { full_name, email, password }
// Errors: 400 invalid_input | invite_invalid, 409 email_taken,
//         429 rate limited, 501 not_configured, 500 signup_failed
// ============================================================

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

import { supabaseAdmin } from "@/lib/ai/admin-client";
import { hashInviteToken } from "@/lib/auth/invitations";
import { normalizeEmail } from "@/lib/auth/password-reset";
import {
  checkRateLimit,
  getClientIp,
  rateLimitResponse,
  RATE_LIMITS,
} from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const MIN_PASSWORD = 6;
const MAX_PASSWORD = 72; // bcrypt limit used by Supabase Auth
const MAX_NAME = 120;

function fail(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const ip = getClientIp(request);
  const limit = checkRateLimit(`invite-signup:${ip}`, RATE_LIMITS.invitationSignup);
  if (!limit.success) return rateLimitResponse(limit);

  const { token } = await params;
  const body = await request.json().catch(() => null);
  const email = normalizeEmail(body?.email);
  const password = typeof body?.password === "string" ? body.password : "";
  const fullName =
    typeof body?.full_name === "string" ? body.full_name.trim().slice(0, MAX_NAME) : "";

  if (
    !token ||
    !email ||
    !fullName ||
    password.length < MIN_PASSWORD ||
    password.length > MAX_PASSWORD
  ) {
    return fail("invalid_input", 400);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return fail("not_configured", 501);
  }

  const tokenHash = hashInviteToken(token);
  const admin = supabaseAdmin();

  // 1. Invite still valid? Checked before creating anything.
  const { data: peek, error: peekError } = await admin.rpc("peek_invitation", {
    p_token_hash: tokenHash,
  });
  if (peekError) {
    console.error("[invite-signup] peek failed:", peekError.message);
    return fail("signup_failed", 500);
  }
  if (!peek || (peek as { ok?: boolean }).ok !== true) {
    return fail("invite_invalid", 400);
  }

  // 2. Create the user, already confirmed. The auth trigger gives them
  //    a personal account that redeem_invitation replaces below.
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });
  if (createError || !created?.user) {
    if (createError && /already.*(registered|exists)|email_exists/i.test(`${createError.code ?? ""} ${createError.message}`)) {
      return fail("email_taken", 409);
    }
    console.error("[invite-signup] createUser failed:", createError?.message);
    return fail("signup_failed", 500);
  }
  const userId = created.user.id;

  // 3. Act as the new user so redeem_invitation sees auth.uid().
  const userClient = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error: signInError } = await userClient.auth.signInWithPassword({
    email,
    password,
  });

  const { error: redeemError } = signInError
    ? { error: signInError }
    : await userClient.rpc("redeem_invitation", { p_token_hash: tokenHash });

  if (redeemError) {
    // 4. Roll back so a failed join doesn't leave a stray owner account.
    const { error: deleteError } = await admin.auth.admin.deleteUser(userId);
    if (deleteError) {
      console.error("[invite-signup] rollback deleteUser failed:", deleteError.message);
    }
    const code = (redeemError as { code?: string }).code;
    if (code === "22023") return fail("invite_invalid", 400);
    console.error("[invite-signup] redeem failed:", redeemError.message);
    return fail("signup_failed", 500);
  }

  await userClient.auth.signOut().catch(() => undefined);
  return NextResponse.json({ ok: true });
}
