// Cadastro aberto ao público? Por enquanto não: só quem recebe um
// convite (link /join/<token> → /signup?invite=...) consegue criar conta.
// Para reabrir, defina NEXT_PUBLIC_ALLOW_SIGNUP=true no deploy.
export const PUBLIC_SIGNUP_OPEN = process.env.NEXT_PUBLIC_ALLOW_SIGNUP === "true";

/** /signup só abre com convite enquanto o cadastro público estiver fechado. */
export function signupAllowed(inviteToken: string | null | undefined): boolean {
  return PUBLIC_SIGNUP_OPEN || !!inviteToken;
}
