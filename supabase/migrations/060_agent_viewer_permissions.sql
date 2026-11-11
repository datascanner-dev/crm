-- ============================================================
-- 060 — Permissões de Agente e Visualizador (Data Scanner CRM)
--
-- 1. Só Proprietário/Administrador reatribuem negócios. O Agente pode
--    apenas assumir um negócio sem responsável (atribuir a si mesmo).
-- 2. Só Proprietário/Administrador excluem contatos e negócios.
-- 3. Só Proprietário/Administrador criam, editam e enviam disparos.
-- 4. O Agente vê (e edita) só os negócios e conversas atribuídos a ele
--    ou ainda sem responsável. Mensagens seguem a conversa.
--    Proprietário, Administrador e Visualizador continuam vendo tudo.
-- 5. O Visualizador pode adicionar notas no contato (só as próprias;
--    editar e excluir notas continua a partir de Agente).
--
-- Acessos de serviço (webhook do WhatsApp, n8n, automações, API v1)
-- não têm auth.uid() e não são afetados.
-- ============================================================

-- ---- helpers --------------------------------------------------
CREATE OR REPLACE FUNCTION public.current_profile_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM profiles WHERE user_id = auth.uid() LIMIT 1;
$$;

-- True quando quem chama é Agente (exatamente) na conta: é o único
-- papel com visão restrita aos próprios registros.
CREATE OR REPLACE FUNCTION public.is_scoped_agent(target_account_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.user_id = auth.uid()
      AND p.account_id = target_account_id
      AND p.account_role = 'agent'
  );
$$;

ALTER FUNCTION public.current_profile_id() OWNER TO postgres;
ALTER FUNCTION public.is_scoped_agent(uuid) OWNER TO postgres;
GRANT EXECUTE ON FUNCTION public.current_profile_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_scoped_agent(uuid) TO authenticated;

-- ---- deals ----------------------------------------------------
DROP POLICY IF EXISTS deals_select ON deals;
CREATE POLICY deals_select ON deals FOR SELECT USING (
  is_account_member(account_id)
  AND (
    NOT is_scoped_agent(account_id)
    OR assigned_to IS NULL
    OR assigned_to = current_profile_id()
  )
);

DROP POLICY IF EXISTS deals_update ON deals;
CREATE POLICY deals_update ON deals FOR UPDATE USING (
  is_account_member(account_id, 'agent')
  AND (
    NOT is_scoped_agent(account_id)
    OR assigned_to IS NULL
    OR assigned_to = current_profile_id()
  )
);

DROP POLICY IF EXISTS deals_delete ON deals;
CREATE POLICY deals_delete ON deals FOR DELETE USING (
  is_account_member(account_id, 'admin')
);

-- Reatribuição: Agente só pode deixar sem responsável ou assumir para si
-- um negócio que estava sem responsável. Nunca passar para outra pessoa.
CREATE OR REPLACE FUNCTION public.deals_guard_reassign()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR is_account_member(NEW.account_id, 'admin') THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.assigned_to IS NOT NULL AND NEW.assigned_to <> current_profile_id() THEN
      RAISE EXCEPTION 'Only owners and admins can assign deals to other members'
        USING ERRCODE = '42501';
    END IF;
  ELSIF NEW.assigned_to IS DISTINCT FROM OLD.assigned_to
        AND NOT (OLD.assigned_to IS NULL AND NEW.assigned_to = current_profile_id()) THEN
    RAISE EXCEPTION 'Only owners and admins can reassign deals'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

ALTER FUNCTION public.deals_guard_reassign() OWNER TO postgres;

DROP TRIGGER IF EXISTS deals_guard_reassign ON deals;
CREATE TRIGGER deals_guard_reassign
  BEFORE INSERT OR UPDATE OF assigned_to ON deals
  FOR EACH ROW EXECUTE FUNCTION public.deals_guard_reassign();

-- ---- conversations (mensagens seguem via messages_select) ------
DROP POLICY IF EXISTS conversations_select ON conversations;
CREATE POLICY conversations_select ON conversations FOR SELECT USING (
  is_account_member(account_id)
  AND (
    NOT is_scoped_agent(account_id)
    OR assigned_agent_id IS NULL
    OR assigned_agent_id = auth.uid()
  )
);

DROP POLICY IF EXISTS conversations_update ON conversations;
CREATE POLICY conversations_update ON conversations FOR UPDATE USING (
  is_account_member(account_id, 'agent')
  AND (
    NOT is_scoped_agent(account_id)
    OR assigned_agent_id IS NULL
    OR assigned_agent_id = auth.uid()
  )
);

-- ---- contacts -------------------------------------------------
DROP POLICY IF EXISTS contacts_delete ON contacts;
CREATE POLICY contacts_delete ON contacts FOR DELETE USING (
  is_account_member(account_id, 'admin')
);

-- ---- broadcasts -----------------------------------------------
DROP POLICY IF EXISTS broadcasts_insert ON broadcasts;
CREATE POLICY broadcasts_insert ON broadcasts FOR INSERT WITH CHECK (
  is_account_member(account_id, 'admin')
);
DROP POLICY IF EXISTS broadcasts_update ON broadcasts;
CREATE POLICY broadcasts_update ON broadcasts FOR UPDATE USING (
  is_account_member(account_id, 'admin')
);
DROP POLICY IF EXISTS broadcasts_delete ON broadcasts;
CREATE POLICY broadcasts_delete ON broadcasts FOR DELETE USING (
  is_account_member(account_id, 'admin')
);

-- ---- contact_notes --------------------------------------------
DROP POLICY IF EXISTS contact_notes_insert ON contact_notes;
CREATE POLICY contact_notes_insert ON contact_notes FOR INSERT WITH CHECK (
  is_account_member(account_id)
  AND (is_account_member(account_id, 'agent') OR user_id = auth.uid())
);
