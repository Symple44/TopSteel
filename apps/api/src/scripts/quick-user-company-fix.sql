-- Script SQL rapide pour créer des associations utilisateur-société
-- À exécuter dans la base topsteel_auth

-- 1. Vérifier les utilisateurs sans société par défaut
SELECT 
    u.id, 
    u.email, 
    u.nom, 
    u.prenom,
    'Pas de société par défaut' as status
FROM users u
LEFT JOIN societe_users su ON u.id = su.userId AND su.isDefault = true
WHERE su.userId IS NULL;

-- 2. Vérifier les sociétés disponibles
SELECT id, nom, code, actif 
FROM societes 
WHERE actif = true 
ORDER BY nom;

-- 3. Si aucune société n'existe, en créer une (décommentez si nécessaire)
/*
INSERT INTO societes (nom, code, type, statut, actif, created_at, updated_at)
VALUES ('TopSteel Défaut', 'TOPSTEEL_DEFAULT', 'HOLDING', 'ACTIVE', true, NOW(), NOW())
RETURNING id, nom, code;
*/

-- 4. Associer tous les utilisateurs à la première société active
-- ATTENTION: Remplacez 'SOCIETE_ID_HERE' par l'ID réel d'une société
/*
INSERT INTO societe_users (userId, societeId, role, actif, isDefault, created_at, updated_at)
SELECT 
    u.id,
    'SOCIETE_ID_HERE'::uuid,  -- Remplacez par l'ID réel
    'ADMIN',
    true,
    true,
    NOW(),
    NOW()
FROM users u
LEFT JOIN societe_users su ON u.id = su.userId AND su.isDefault = true
WHERE su.userId IS NULL;
*/

-- 5. Vérifier le résultat
SELECT 
    u.email,
    s.nom as societe_nom,
    su.role,
    su.isDefault,
    su.actif
FROM users u
JOIN societe_users su ON u.id = su.userId
JOIN societes s ON su.societeId = s.id
WHERE su.isDefault = true
ORDER BY u.email;