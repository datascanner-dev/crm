// Logout por inatividade (Data Scanner CRM).
//
// Depois de IDLE_LOGOUT_MS sem nenhuma interação (clique, toque, tecla,
// rolagem) em nenhuma aba, a sessão é encerrada e a pessoa volta para o
// login. O último momento de atividade fica no localStorage para que
// todas as abas abertas compartilhem o mesmo relógio: usar o CRM numa
// aba mantém as outras vivas.
//
// Complementa o limite do lado do servidor (GOTRUE_SESSIONS_INACTIVITY_
// TIMEOUT no Supabase): aquele só age quando o token é renovado, e uma
// aba aberta renova sozinha mesmo sem ninguém mexendo.

export const IDLE_LOGOUT_MS = 30 * 60 * 1000;

/** Chave no localStorage com o timestamp (ms) da última atividade. */
export const LAST_ACTIVITY_KEY = "crm:last-activity";

/** Não grava no localStorage mais que uma vez neste intervalo. */
export const ACTIVITY_WRITE_THROTTLE_MS = 15 * 1000;

/** Motivo anexado ao /login para a página explicar a saída. */
export const IDLE_LOGOUT_REASON = "idle";

/**
 * Hora da última atividade considerada: a maior entre a gravada e o
 * último login. Um login novo zera o relógio mesmo que a última
 * atividade gravada seja antiga (de antes do login).
 */
export function effectiveLastActivity(
  storedLastActivity: number | null,
  lastSignInAt: string | null | undefined,
): number | null {
  const signIn = lastSignInAt ? Date.parse(lastSignInAt) : NaN;
  const candidates = [storedLastActivity, Number.isNaN(signIn) ? null : signIn].filter(
    (v): v is number => typeof v === "number" && Number.isFinite(v),
  );
  return candidates.length ? Math.max(...candidates) : null;
}

/** True quando passou o limite desde a última atividade conhecida. */
export function isIdleExpired(
  now: number,
  lastActivity: number | null,
  limitMs: number = IDLE_LOGOUT_MS,
): boolean {
  if (lastActivity === null) return false;
  return now - lastActivity >= limitMs;
}

/** Lê o timestamp gravado; null se ausente ou inválido. */
export function parseStoredActivity(raw: string | null): number | null {
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
}
