-- Migration : Étendre les rôles admin
-- Ajoute super_admin et moderator à l'enum app_role
-- et une colonne permissions sur user_roles

-- 1. Ajouter les nouveaux types de rôles
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'super_admin';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'moderator';

-- 2. Ajouter une colonne notes optionnelle sur user_roles (label interne)
ALTER TABLE user_roles ADD COLUMN IF NOT EXISTS label text;

-- 3. Vue pratique pour l'admin : liste des admins avec leur profil
CREATE OR REPLACE VIEW admin_users AS
  SELECT
    ur.user_id,
    ur.role,
    ur.label,
    ur.created_at,
    p.display_name,
    p.email
  FROM user_roles ur
  LEFT JOIN profiles p ON p.user_id = ur.user_id
  WHERE ur.role IN ('admin', 'super_admin', 'moderator');

-- 4. Mettre à jour la fonction has_role pour les niveaux
-- super_admin a accès à tout ce qu'admin a accès
CREATE OR REPLACE FUNCTION has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = _user_id
      AND (
        role = _role
        OR (role = 'super_admin') -- super_admin has all permissions
      )
  )
$$;
