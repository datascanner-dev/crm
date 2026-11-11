// Supabase Auth (GoTrue) returns error text in English. When the app runs in
// Portuguese, map the known error codes/messages to pt-BR; anything unknown
// falls back to the original text so no detail is lost.

type AuthErrorLike = { code?: string | null; message?: string | null };

const PT_BY_CODE: Record<string, string> = {
  invalid_credentials: "E-mail ou senha incorretos.",
  email_not_confirmed: "Confirme seu e-mail antes de entrar.",
  user_already_exists: "Já existe uma conta com este e-mail.",
  email_exists: "Já existe uma conta com este e-mail.",
  weak_password: "Senha muito fraca. Use pelo menos 8 caracteres, misturando letras e números.",
  same_password: "A nova senha precisa ser diferente da atual.",
  over_email_send_rate_limit: "Muitas tentativas de envio de e-mail. Aguarde alguns minutos e tente de novo.",
  over_request_rate_limit: "Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente de novo.",
  signup_disabled: "Novos cadastros estão desativados.",
  email_address_invalid: "E-mail inválido.",
  user_not_found: "Usuário não encontrado.",
  session_expired: "Sua sessão expirou. Entre novamente.",
  session_not_found: "Sua sessão expirou. Entre novamente.",
  otp_expired: "O link expirou. Solicite um novo.",
  flow_state_expired: "O link expirou. Solicite um novo.",
  validation_failed: "Dados inválidos. Confira os campos e tente de novo.",
  email_address_not_authorized: "Este e-mail não está autorizado a receber mensagens.",
};

const PT_BY_MESSAGE: [RegExp, string][] = [
  [/invalid login credentials/i, PT_BY_CODE.invalid_credentials],
  [/email not confirmed/i, PT_BY_CODE.email_not_confirmed],
  [/user already registered/i, PT_BY_CODE.user_already_exists],
  [/password should be at least (\d+) characters/i, "A senha deve ter pelo menos $1 caracteres."],
  [/new password should be different/i, PT_BY_CODE.same_password],
  [/rate limit/i, PT_BY_CODE.over_request_rate_limit],
  [/signups not allowed/i, PT_BY_CODE.signup_disabled],
  [/unable to validate email address/i, PT_BY_CODE.email_address_invalid],
  [/failed to fetch|network/i, "Não foi possível conectar ao servidor. Verifique sua internet e tente de novo."],
];

export function authErrorMessage(error: AuthErrorLike): string {
  const original = error.message ?? "";
  if ((process.env.NEXT_PUBLIC_APP_LOCALE ?? "en") !== "pt") return original;
  if (error.code && PT_BY_CODE[error.code]) return PT_BY_CODE[error.code];
  for (const [re, pt] of PT_BY_MESSAGE) {
    const m = original.match(re);
    if (m) return pt.replace("$1", m[1] ?? "");
  }
  return original;
}
