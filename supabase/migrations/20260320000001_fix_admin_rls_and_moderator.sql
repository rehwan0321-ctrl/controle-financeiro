
-- Drop existing conflicting policies for delay_clientes
DROP POLICY IF EXISTS "Admins can view delay_clientes" ON public.delay_clientes;
DROP POLICY IF EXISTS "Admins can insert delay_clientes" ON public.delay_clientes;
DROP POLICY IF EXISTS "Admins can update delay_clientes" ON public.delay_clientes;
DROP POLICY IF EXISTS "Admins can delete delay_clientes" ON public.delay_clientes;
DROP POLICY IF EXISTS "Users can view own delay_clientes" ON public.delay_clientes;
DROP POLICY IF EXISTS "Users can insert own delay_clientes" ON public.delay_clientes;
DROP POLICY IF EXISTS "Users can update own delay_clientes" ON public.delay_clientes;
DROP POLICY IF EXISTS "Users can delete own delay_clientes" ON public.delay_clientes;

-- Unified policies: admins see all, moderators see all, regular users see own
CREATE POLICY "Admin and moderators can view all delay_clientes"
ON public.delay_clientes FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR
  public.has_role(auth.uid(), 'moderator') OR
  auth.uid() = user_id
);

CREATE POLICY "Admin and moderators can insert delay_clientes"
ON public.delay_clientes FOR INSERT TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR
  public.has_role(auth.uid(), 'moderator') OR
  auth.uid() = user_id
);

CREATE POLICY "Admin and moderators can update delay_clientes"
ON public.delay_clientes FOR UPDATE TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR
  public.has_role(auth.uid(), 'moderator') OR
  auth.uid() = user_id
);

CREATE POLICY "Admin and moderators can delete delay_clientes"
ON public.delay_clientes FOR DELETE TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR
  public.has_role(auth.uid(), 'moderator') OR
  auth.uid() = user_id
);

-- Drop existing conflicting policies for delay_transacoes
DROP POLICY IF EXISTS "Admins can view delay_transacoes" ON public.delay_transacoes;
DROP POLICY IF EXISTS "Admins can insert delay_transacoes" ON public.delay_transacoes;
DROP POLICY IF EXISTS "Admins can update delay_transacoes" ON public.delay_transacoes;
DROP POLICY IF EXISTS "Admins can delete delay_transacoes" ON public.delay_transacoes;
DROP POLICY IF EXISTS "Users can view own delay_transacoes" ON public.delay_transacoes;
DROP POLICY IF EXISTS "Users can insert own delay_transacoes" ON public.delay_transacoes;
DROP POLICY IF EXISTS "Users can update own delay_transacoes" ON public.delay_transacoes;
DROP POLICY IF EXISTS "Users can delete own delay_transacoes" ON public.delay_transacoes;

-- Unified policies for delay_transacoes
CREATE POLICY "Admin and moderators can view all delay_transacoes"
ON public.delay_transacoes FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR
  public.has_role(auth.uid(), 'moderator') OR
  auth.uid() = user_id
);

CREATE POLICY "Admin and moderators can insert delay_transacoes"
ON public.delay_transacoes FOR INSERT TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR
  public.has_role(auth.uid(), 'moderator') OR
  auth.uid() = user_id
);

CREATE POLICY "Admin and moderators can update delay_transacoes"
ON public.delay_transacoes FOR UPDATE TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR
  public.has_role(auth.uid(), 'moderator') OR
  auth.uid() = user_id
);

CREATE POLICY "Admin and moderators can delete delay_transacoes"
ON public.delay_transacoes FOR DELETE TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR
  public.has_role(auth.uid(), 'moderator') OR
  auth.uid() = user_id
);
