-- ============================================================
-- 061 — Negócios novos não vistos pelo responsável (Data Scanner CRM)
--
-- Badge com número ao lado de "Funis" (e no sino do mobile): quantos
-- negócios abertos estão atribuídos a mim e eu ainda não abri.
--
-- - deals.assignee_seen_at: quando o responsável abriu o negócio.
--   NULL = novo/não visto.
-- - Ao trocar o responsável, volta a NULL (vira novo para quem recebeu).
--   Quem assume um negócio para si mesmo já conta como visto.
-- - mark_deal_seen(deal_id): o responsável marca como visto ao abrir.
-- - deals entra no Realtime para o número atualizar sem recarregar.
-- ============================================================

ALTER TABLE deals ADD COLUMN IF NOT EXISTS assignee_seen_at timestamptz;

CREATE INDEX IF NOT EXISTS deals_assignee_unseen_idx
  ON deals (assigned_to)
  WHERE assignee_seen_at IS NULL AND status = 'open';

CREATE OR REPLACE FUNCTION public.deals_reset_assignee_seen()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' OR NEW.assigned_to IS DISTINCT FROM OLD.assigned_to THEN
    IF NEW.assigned_to IS NOT NULL AND NEW.assigned_to = current_profile_id() THEN
      NEW.assignee_seen_at := now();
    ELSIF TG_OP = 'UPDATE' THEN
      NEW.assignee_seen_at := NULL;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

ALTER FUNCTION public.deals_reset_assignee_seen() OWNER TO postgres;

DROP TRIGGER IF EXISTS deals_reset_assignee_seen ON deals;
CREATE TRIGGER deals_reset_assignee_seen
  BEFORE INSERT OR UPDATE OF assigned_to ON deals
  FOR EACH ROW EXECUTE FUNCTION public.deals_reset_assignee_seen();

CREATE OR REPLACE FUNCTION public.mark_deal_seen(p_deal_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE deals
     SET assignee_seen_at = now()
   WHERE id = p_deal_id
     AND assignee_seen_at IS NULL
     AND assigned_to = current_profile_id();
$$;

ALTER FUNCTION public.mark_deal_seen(uuid) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.mark_deal_seen(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.mark_deal_seen(uuid) TO authenticated;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'deals'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE deals;
  END IF;
END;
$$;
