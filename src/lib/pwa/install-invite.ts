// Regras do convite de instalação do PWA (Data Scanner CRM).
//
// - Primeiro acesso: o convite aparece.
// - Se a pessoa cancelar ("Agora não", X ou recusar o prompt do
//   navegador), ele volta apenas nos próximos 3 logins — uma vez em
//   cada — e depois não aparece mais.
// - Se a pessoa aceitar (instalar, ou "Entendi" no passo a passo do
//   iPhone), ele deixa de aparecer.
//
// - Abrir qualquer página com ?instalar (ex.: /login?instalar) zera o
//   estado e o convite aparece de novo, como no primeiro acesso.
//
// Estado guardado no localStorage do navegador (por aparelho).

export const INVITE_KEY = "dscrm.pwa.invite";
export const MAX_LOGIN_REMINDERS = 3;

export interface InviteState {
  /** Instalou / aceitou: nunca mais mostrar. */
  accepted: boolean;
  /** Já cancelou ao menos uma vez. */
  dismissed: boolean;
  /** Quantos lembretes por login ainda restam após o cancelamento. */
  remindersLeft: number;
  /** Um login aconteceu e o lembrete desse login ainda não foi mostrado/cancelado. */
  pendingReminder: boolean;
}

export const INITIAL_STATE: InviteState = {
  accepted: false,
  dismissed: false,
  remindersLeft: MAX_LOGIN_REMINDERS,
  pendingReminder: false,
};

export function shouldShow(state: InviteState): boolean {
  if (state.accepted) return false;
  if (!state.dismissed) return true;
  return state.pendingReminder;
}

export function onDismiss(state: InviteState): InviteState {
  if (!state.dismissed) {
    return { ...state, dismissed: true, remindersLeft: MAX_LOGIN_REMINDERS, pendingReminder: false };
  }
  return { ...state, pendingReminder: false };
}

export function onAccept(state: InviteState): InviteState {
  return { ...state, accepted: true, pendingReminder: false };
}

export function onLogin(state: InviteState): InviteState {
  if (state.accepted || !state.dismissed || state.remindersLeft <= 0) return state;
  // Lembrete anterior ainda não visto: não consome outro.
  if (state.pendingReminder) return state;
  return { ...state, remindersLeft: state.remindersLeft - 1, pendingReminder: true };
}

interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export function readState(storage: StorageLike): InviteState {
  try {
    const raw = storage.getItem(INVITE_KEY);
    if (!raw) {
      // Quem já tinha cancelado na versão anterior (chave antiga) entra
      // direto no regime dos 3 lembretes.
      if (storage.getItem("dscrm.pwa.dismissedAt")) {
        return { ...INITIAL_STATE, dismissed: true };
      }
      return { ...INITIAL_STATE };
    }
    return { ...INITIAL_STATE, ...(JSON.parse(raw) as Partial<InviteState>) };
  } catch {
    return { ...INITIAL_STATE };
  }
}

export function writeState(storage: StorageLike, state: InviteState): void {
  try {
    storage.setItem(INVITE_KEY, JSON.stringify(state));
  } catch {
    // modo privado / storage indisponível: vale só para esta visita
  }
}

/** Volta ao estado de primeiro acesso (link com ?instalar). */
export function resetState(storage: StorageLike): void {
  writeState(storage, { ...INITIAL_STATE });
}

/** Chamado pela tela de login depois de entrar com sucesso. */
export function registerLogin(storage: StorageLike = window.localStorage): void {
  writeState(storage, onLogin(readState(storage)));
}
