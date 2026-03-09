-- 1. On ajoute la colonne is_admin à la table profiles
-- On la met à FALSE par défaut pour que les nouveaux inscrits soient de simples clients
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- 2. On te donne la couronne d'administrateur (Remplace par ton vrai mail)
UPDATE public.profiles
SET is_admin = TRUE
WHERE id = (SELECT id FROM auth.users WHERE email = 'ton_adresse_email@exemple.com');