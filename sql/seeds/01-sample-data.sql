-- =========================================================================
-- ERP TOPSTEEL - DONNÉES DE TEST
-- Fichier: sql/seeds/01-sample-data.sql
-- =========================================================================

-- Utilisateurs de test
INSERT INTO users (email, password, nom, prenom, role) VALUES
('admin@topsteel.fr', '$2b$10$5kPNr2kfLGR8zKn3aB6Ziu5HBkGZfC3xGKGGWZXZQKYjpZ8sXZ2Aq', 'Admin', 'System', 'ADMIN'),
('manager@topsteel.fr', '$2b$10$5kPNr2kfLGR8zKn3aB6Ziu5HBkGZfC3xGKGGWZXZQKYjpZ8sXZ2Aq', 'Martin', 'Jean', 'MANAGER'),
('commercial@topsteel.fr', '$2b$10$5kPNr2kfLGR8zKn3aB6Ziu5HBkGZfC3xGKGGWZXZQKYjpZ8sXZ2Aq', 'Dupont', 'Marie', 'COMMERCIAL')
ON CONFLICT (email) DO NOTHING;

-- Clients de test
INSERT INTO clients (type, nom, email, telephone, siret, adresse) VALUES
('PROFESSIONNEL', 'Entreprise Métallo', 'contact@metallo.fr', '0123456789', '12345678901234', '{"rue": "123 Rue de la Métallurgie", "ville": "Lyon", "cp": "69000"}'),
('PARTICULIER', 'Martin Dupond', 'martin.dupond@email.fr', '0987654321', NULL, '{"rue": "45 Avenue des Particuliers", "ville": "Paris", "cp": "75001"}'),
('COLLECTIVITE', 'Mairie de Testville', 'mairie@testville.fr', '0555666777', '99988877766655', '{"rue": "Place de la Mairie", "ville": "Testville", "cp": "12345"}')
ON CONFLICT (siret) DO NOTHING;

-- Fournisseurs de test (compatible avec existant)
INSERT INTO fournisseurs (nom, email, telephone, actif) VALUES
('Acier Pro', 'contact@acierpro.fr', '0123456789', true),
('Métaux et Cie', 'info@metauxcie.fr', '0987654321', true),
('Fournisseur Inactif', 'old@supplier.fr', '0000000000', false)
ON CONFLICT (email) DO NOTHING;

-- Projets de test
WITH client_ids AS (
    SELECT id, nom FROM clients LIMIT 3
),
user_ids AS (
    SELECT id, nom FROM users WHERE role IN ('MANAGER', 'COMMERCIAL') LIMIT 2
)
INSERT INTO projets (nom, description, type, statut, client_id, responsable_id, budget_estime) 
SELECT 
    'Projet Test ' || c.nom,
    'Description du projet pour ' || c.nom,
    'PORTAIL',
    'EN_COURS',
    c.id,
    u.id,
    15000.00
FROM client_ids c, user_ids u
LIMIT 3
ON CONFLICT (numero) DO NOTHING;
