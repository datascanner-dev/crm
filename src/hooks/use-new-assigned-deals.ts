"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/use-auth";

/** Disparado depois de marcar um negócio como visto, para o badge
 *  atualizar na hora (sem esperar o Realtime). */
export const DEAL_SEEN_EVENT = "dscrm:deal-seen";

/**
 * Quantos negócios abertos estão atribuídos ao usuário logado e ele
 * ainda não abriu (deals.assignee_seen_at IS NULL — migration 061).
 * Usado no badge de "Funis" (menu lateral) e no sino do mobile.
 */
export function useNewAssignedDeals(): number {
  const { accountId, profile } = useAuth();
  const profileId = profile?.id;
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!accountId || !profileId) return;
    const supabase = createClient();
    let cancelled = false;

    const load = async () => {
      const { count: n, error } = await supabase
        .from("deals")
        .select("id", { count: "exact", head: true })
        .eq("account_id", accountId)
        .eq("assigned_to", profileId)
        .eq("status", "open")
        .is("assignee_seen_at", null);
      if (cancelled) return;
      // Antes da migration 061 a coluna não existe: sem badge.
      setCount(error ? 0 : (n ?? 0));
    };

    void load();

    // Qualquer mudança em negócios da conta pode mexer na contagem
    // (atribuição, status, visto) — recontar é barato (head: true).
    const channel = supabase
      // Nome único por instância: o hook roda no menu lateral e no sino.
      .channel(`deals-new-assigned:${accountId}:${profileId}:${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "deals", filter: `account_id=eq.${accountId}` },
        () => void load(),
      )
      .subscribe();

    const onSeen = () => void load();
    const onFocus = () => {
      if (document.visibilityState === "visible") void load();
    };
    window.addEventListener(DEAL_SEEN_EVENT, onSeen);
    document.addEventListener("visibilitychange", onFocus);
    const poll = window.setInterval(load, 60_000);

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
      window.removeEventListener(DEAL_SEEN_EVENT, onSeen);
      document.removeEventListener("visibilitychange", onFocus);
      window.clearInterval(poll);
    };
  }, [accountId, profileId]);

  return accountId && profileId ? count : 0;
}
