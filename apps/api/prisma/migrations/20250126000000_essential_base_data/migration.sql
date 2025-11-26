-- Essential Base Data Migration
-- This migration contains essential system-level data required for the ERP socle
-- These are NOT test/development data - they are production-ready defaults
-- Note: Menu configuration is in seed.ts because it requires a societe_id

-- ============================================
-- DEFAULT SYSTEM ROLES
-- Roles without societe_id are system-wide roles
-- ============================================
INSERT INTO "roles" ("id", "name", "label", "description", "level", "is_system", "is_active", "created_at", "updated_at")
VALUES
  (gen_random_uuid(), 'SUPER_ADMIN', 'Super Administrateur', 'Accès complet à toutes les fonctionnalités du système', 100, true, true, NOW(), NOW()),
  (gen_random_uuid(), 'OWNER', 'Propriétaire', 'Propriétaire de la société avec droits complets', 95, true, true, NOW(), NOW()),
  (gen_random_uuid(), 'ADMIN', 'Administrateur', 'Gestion des utilisateurs et paramètres de la société', 90, true, true, NOW(), NOW()),
  (gen_random_uuid(), 'MANAGER', 'Manager', 'Supervision des équipes et validation des opérations', 80, true, true, NOW(), NOW()),
  (gen_random_uuid(), 'OPERATEUR', 'Opérateur', 'Opérations métier quotidiennes', 50, true, true, NOW(), NOW()),
  (gen_random_uuid(), 'USER', 'Utilisateur', 'Accès standard aux fonctionnalités métier', 30, true, true, NOW(), NOW()),
  (gen_random_uuid(), 'READONLY', 'Lecture seule', 'Consultation uniquement, aucune modification', 10, true, true, NOW(), NOW())
ON CONFLICT ("name") DO NOTHING;

-- ============================================
-- DEFAULT SYSTEM PERMISSIONS
-- Permissions without societe_id are system-wide
-- ============================================
INSERT INTO "permissions" ("id", "name", "label", "description", "module", "action", "is_active", "created_at", "updated_at")
VALUES
  -- User Management
  (gen_random_uuid(), 'users:read', 'Voir les utilisateurs', 'Consulter la liste des utilisateurs', 'users', 'read', true, NOW(), NOW()),
  (gen_random_uuid(), 'users:create', 'Créer des utilisateurs', 'Créer de nouveaux utilisateurs', 'users', 'create', true, NOW(), NOW()),
  (gen_random_uuid(), 'users:update', 'Modifier des utilisateurs', 'Modifier les informations utilisateurs', 'users', 'update', true, NOW(), NOW()),
  (gen_random_uuid(), 'users:delete', 'Supprimer des utilisateurs', 'Supprimer des utilisateurs', 'users', 'delete', true, NOW(), NOW()),

  -- Role Management
  (gen_random_uuid(), 'roles:read', 'Voir les rôles', 'Consulter la liste des rôles', 'roles', 'read', true, NOW(), NOW()),
  (gen_random_uuid(), 'roles:create', 'Créer des rôles', 'Créer de nouveaux rôles', 'roles', 'create', true, NOW(), NOW()),
  (gen_random_uuid(), 'roles:update', 'Modifier des rôles', 'Modifier les rôles existants', 'roles', 'update', true, NOW(), NOW()),
  (gen_random_uuid(), 'roles:delete', 'Supprimer des rôles', 'Supprimer des rôles', 'roles', 'delete', true, NOW(), NOW()),

  -- Company/Societe Management
  (gen_random_uuid(), 'societes:read', 'Voir les sociétés', 'Consulter les informations des sociétés', 'societes', 'read', true, NOW(), NOW()),
  (gen_random_uuid(), 'societes:create', 'Créer des sociétés', 'Créer de nouvelles sociétés', 'societes', 'create', true, NOW(), NOW()),
  (gen_random_uuid(), 'societes:update', 'Modifier des sociétés', 'Modifier les informations des sociétés', 'societes', 'update', true, NOW(), NOW()),
  (gen_random_uuid(), 'societes:delete', 'Supprimer des sociétés', 'Supprimer des sociétés', 'societes', 'delete', true, NOW(), NOW()),

  -- Settings
  (gen_random_uuid(), 'settings:read', 'Voir les paramètres', 'Consulter les paramètres système', 'settings', 'read', true, NOW(), NOW()),
  (gen_random_uuid(), 'settings:update', 'Modifier les paramètres', 'Modifier les paramètres système', 'settings', 'update', true, NOW(), NOW()),

  -- Database Administration
  (gen_random_uuid(), 'database:admin', 'Accès base de données', 'Accès aux outils de base de données', 'database', 'admin', true, NOW(), NOW()),

  -- Menu Configuration
  (gen_random_uuid(), 'menu:read', 'Voir les menus', 'Consulter les configurations de menu', 'menu', 'read', true, NOW(), NOW()),
  (gen_random_uuid(), 'menu:admin', 'Configurer les menus', 'Configurer les menus système', 'menu', 'admin', true, NOW(), NOW())
ON CONFLICT ("name") DO NOTHING;

-- ============================================
-- ASSIGN PERMISSIONS TO ROLES
-- ============================================
-- Super Admin gets all permissions
INSERT INTO "role_permissions" ("id", "role_id", "permission_id", "created_at")
SELECT gen_random_uuid(), r.id, p.id, NOW()
FROM "roles" r
CROSS JOIN "permissions" p
WHERE r.name = 'SUPER_ADMIN'
  AND NOT EXISTS (
    SELECT 1 FROM "role_permissions" rp
    WHERE rp.role_id = r.id AND rp.permission_id = p.id
  );

-- Owner gets all permissions except database:admin
INSERT INTO "role_permissions" ("id", "role_id", "permission_id", "created_at")
SELECT gen_random_uuid(), r.id, p.id, NOW()
FROM "roles" r
CROSS JOIN "permissions" p
WHERE r.name = 'OWNER'
  AND p.name != 'database:admin'
  AND NOT EXISTS (
    SELECT 1 FROM "role_permissions" rp
    WHERE rp.role_id = r.id AND rp.permission_id = p.id
  );

-- Admin gets most permissions except database admin and societe creation/deletion
INSERT INTO "role_permissions" ("id", "role_id", "permission_id", "created_at")
SELECT gen_random_uuid(), r.id, p.id, NOW()
FROM "roles" r
CROSS JOIN "permissions" p
WHERE r.name = 'ADMIN'
  AND p.name NOT IN ('database:admin', 'societes:create', 'societes:delete')
  AND NOT EXISTS (
    SELECT 1 FROM "role_permissions" rp
    WHERE rp.role_id = r.id AND rp.permission_id = p.id
  );

-- Manager gets read permissions and some updates
INSERT INTO "role_permissions" ("id", "role_id", "permission_id", "created_at")
SELECT gen_random_uuid(), r.id, p.id, NOW()
FROM "roles" r
CROSS JOIN "permissions" p
WHERE r.name = 'MANAGER'
  AND (p.action = 'read' OR p.name IN ('users:update', 'settings:read'))
  AND NOT EXISTS (
    SELECT 1 FROM "role_permissions" rp
    WHERE rp.role_id = r.id AND rp.permission_id = p.id
  );

-- Operateur gets read permissions only
INSERT INTO "role_permissions" ("id", "role_id", "permission_id", "created_at")
SELECT gen_random_uuid(), r.id, p.id, NOW()
FROM "roles" r
CROSS JOIN "permissions" p
WHERE r.name = 'OPERATEUR'
  AND p.action = 'read'
  AND NOT EXISTS (
    SELECT 1 FROM "role_permissions" rp
    WHERE rp.role_id = r.id AND rp.permission_id = p.id
  );

-- User gets basic read permissions
INSERT INTO "role_permissions" ("id", "role_id", "permission_id", "created_at")
SELECT gen_random_uuid(), r.id, p.id, NOW()
FROM "roles" r
CROSS JOIN "permissions" p
WHERE r.name = 'USER'
  AND p.action = 'read'
  AND p.module IN ('settings', 'menu')
  AND NOT EXISTS (
    SELECT 1 FROM "role_permissions" rp
    WHERE rp.role_id = r.id AND rp.permission_id = p.id
  );

-- Readonly gets only settings and menu read
INSERT INTO "role_permissions" ("id", "role_id", "permission_id", "created_at")
SELECT gen_random_uuid(), r.id, p.id, NOW()
FROM "roles" r
CROSS JOIN "permissions" p
WHERE r.name = 'READONLY'
  AND p.name IN ('settings:read', 'menu:read')
  AND NOT EXISTS (
    SELECT 1 FROM "role_permissions" rp
    WHERE rp.role_id = r.id AND rp.permission_id = p.id
  );
