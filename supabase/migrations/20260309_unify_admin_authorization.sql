-- 1. Création d'une fonction de vérification ultra-rapide
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
  SELECT is_admin FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- 2. Nettoyage et Unification pour les MENU_ITEMS (On enlève l'ID hardcodé !)
DROP POLICY IF EXISTS "Admins can do everything on menu_items" ON public.menu_items;
CREATE POLICY "admin_full_access_menu" ON public.menu_items
  FOR ALL TO authenticated
  USING (public.is_admin());

-- 3. Nettoyage et Unification pour les COUPONS (On enlève l'ID hardcodé !)
DROP POLICY IF EXISTS "Admins can manage coupons" ON public.coupons;
CREATE POLICY "admin_full_access_coupons" ON public.coupons
  FOR ALL TO authenticated
  USING (public.is_admin());

-- 4. Unification pour les ORDERS
DROP POLICY IF EXISTS "orders_admin_select" ON public.orders;
DROP POLICY IF EXISTS "orders_admin_update" ON public.orders;
DROP POLICY IF EXISTS "orders_admin_delete" ON public.orders;

CREATE POLICY "orders_admin_all" ON public.orders
  FOR ALL TO authenticated
  USING (public.is_admin());

-- 5. Sécurisation finale de la table PROFILES
-- On s'assure que personne (à part un admin) ne peut changer le flag is_admin
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own_safe" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id 
    AND (
      -- Soit on est admin et on a le droit de changer
      public.is_admin() 
      OR 
      -- Soit on n'est pas admin, et on n'a PAS le droit de toucher à is_admin
      (is_admin = (SELECT is_admin FROM public.profiles WHERE id = auth.uid()))
    )
  );