-- Script d'injection des profilés IPE dans la table articles
-- Génère tous les IPE de 80 à 600 avec 3 nuances chacun
-- Caractéristiques techniques conformes aux normes EN 10025-2

-- Variable pour l'ID de société (à adapter selon votre contexte)
-- Remplacez par l'ID de société approprié
DO $$
DECLARE
    societe_id UUID;
BEGIN
    -- Récupération de l'ID de la première société (à adapter selon vos besoins)
    SELECT id INTO societe_id FROM societes LIMIT 1;
    
    -- Vérification que la société existe
    IF societe_id IS NULL THEN
        RAISE EXCEPTION 'Aucune société trouvée. Veuillez créer une société avant d''insérer les articles.';
    END IF;

    -- IPE 80
    INSERT INTO articles (id, reference, designation, type, status, famille, sous_famille, unite_stock, unite_achat, unite_vente, gere_en_stock, societe_id, caracteristiques_techniques, created_at, updated_at)
    VALUES 
    (gen_random_uuid(), 'IPE-80-S235JR', 'Poutrelle IPE 80 S235JR', 'MATIERE_PREMIERE', 'ACTIF', 'PROFILES_ACIER', 'IPE', 'M', 'M', 'M', true, societe_id, 
     '{"hauteur": 80, "largeur": 46, "epaisseurAme": 3.8, "epaisseurAile": 5.2, "poids": 6.0, "section": 7.64, "momentInertieX": 80.1, "momentInertieY": 8.49, "moduleResistanceX": 20.0, "moduleResistanceY": 3.69, "rayonGiration": 3.24, "norme": "EN 10025-2"}'::jsonb, NOW(), NOW()),
    (gen_random_uuid(), 'IPE-80-S275JR', 'Poutrelle IPE 80 S275JR', 'MATIERE_PREMIERE', 'ACTIF', 'PROFILES_ACIER', 'IPE', 'M', 'M', 'M', true, societe_id, 
     '{"hauteur": 80, "largeur": 46, "epaisseurAme": 3.8, "epaisseurAile": 5.2, "poids": 6.0, "section": 7.64, "momentInertieX": 80.1, "momentInertieY": 8.49, "moduleResistanceX": 20.0, "moduleResistanceY": 3.69, "rayonGiration": 3.24, "norme": "EN 10025-2"}'::jsonb, NOW(), NOW()),
    (gen_random_uuid(), 'IPE-80-S355JR', 'Poutrelle IPE 80 S355JR', 'MATIERE_PREMIERE', 'ACTIF', 'PROFILES_ACIER', 'IPE', 'M', 'M', 'M', true, societe_id, 
     '{"hauteur": 80, "largeur": 46, "epaisseurAme": 3.8, "epaisseurAile": 5.2, "poids": 6.0, "section": 7.64, "momentInertieX": 80.1, "momentInertieY": 8.49, "moduleResistanceX": 20.0, "moduleResistanceY": 3.69, "rayonGiration": 3.24, "norme": "EN 10025-2"}'::jsonb, NOW(), NOW());

    -- IPE 100
    INSERT INTO articles (id, reference, designation, type, status, famille, sous_famille, unite_stock, unite_achat, unite_vente, gere_en_stock, societe_id, caracteristiques_techniques, created_at, updated_at)
    VALUES 
    (gen_random_uuid(), 'IPE-100-S235JR', 'Poutrelle IPE 100 S235JR', 'MATIERE_PREMIERE', 'ACTIF', 'PROFILES_ACIER', 'IPE', 'M', 'M', 'M', true, societe_id, 
     '{"hauteur": 100, "largeur": 55, "epaisseurAme": 4.1, "epaisseurAile": 5.7, "poids": 8.1, "section": 10.3, "momentInertieX": 171, "momentInertieY": 15.9, "moduleResistanceX": 34.2, "moduleResistanceY": 5.79, "rayonGiration": 4.07, "norme": "EN 10025-2"}'::jsonb, NOW(), NOW()),
    (gen_random_uuid(), 'IPE-100-S275JR', 'Poutrelle IPE 100 S275JR', 'MATIERE_PREMIERE', 'ACTIF', 'PROFILES_ACIER', 'IPE', 'M', 'M', 'M', true, societe_id, 
     '{"hauteur": 100, "largeur": 55, "epaisseurAme": 4.1, "epaisseurAile": 5.7, "poids": 8.1, "section": 10.3, "momentInertieX": 171, "momentInertieY": 15.9, "moduleResistanceX": 34.2, "moduleResistanceY": 5.79, "rayonGiration": 4.07, "norme": "EN 10025-2"}'::jsonb, NOW(), NOW()),
    (gen_random_uuid(), 'IPE-100-S355JR', 'Poutrelle IPE 100 S355JR', 'MATIERE_PREMIERE', 'ACTIF', 'PROFILES_ACIER', 'IPE', 'M', 'M', 'M', true, societe_id, 
     '{"hauteur": 100, "largeur": 55, "epaisseurAme": 4.1, "epaisseurAile": 5.7, "poids": 8.1, "section": 10.3, "momentInertieX": 171, "momentInertieY": 15.9, "moduleResistanceX": 34.2, "moduleResistanceY": 5.79, "rayonGiration": 4.07, "norme": "EN 10025-2"}'::jsonb, NOW(), NOW());

    -- IPE 120
    INSERT INTO articles (id, reference, designation, type, status, famille, sous_famille, unite_stock, unite_achat, unite_vente, gere_en_stock, societe_id, caracteristiques_techniques, created_at, updated_at)
    VALUES 
    (gen_random_uuid(), 'IPE-120-S235JR', 'Poutrelle IPE 120 S235JR', 'MATIERE_PREMIERE', 'ACTIF', 'PROFILES_ACIER', 'IPE', 'M', 'M', 'M', true, societe_id, 
     '{"hauteur": 120, "largeur": 64, "epaisseurAme": 4.4, "epaisseurAile": 6.3, "poids": 10.4, "section": 13.2, "momentInertieX": 318, "momentInertieY": 27.7, "moduleResistanceX": 53.0, "moduleResistanceY": 8.65, "rayonGiration": 4.90, "norme": "EN 10025-2"}'::jsonb, NOW(), NOW()),
    (gen_random_uuid(), 'IPE-120-S275JR', 'Poutrelle IPE 120 S275JR', 'MATIERE_PREMIERE', 'ACTIF', 'PROFILES_ACIER', 'IPE', 'M', 'M', 'M', true, societe_id, 
     '{"hauteur": 120, "largeur": 64, "epaisseurAme": 4.4, "epaisseurAile": 6.3, "poids": 10.4, "section": 13.2, "momentInertieX": 318, "momentInertieY": 27.7, "moduleResistanceX": 53.0, "moduleResistanceY": 8.65, "rayonGiration": 4.90, "norme": "EN 10025-2"}'::jsonb, NOW(), NOW()),
    (gen_random_uuid(), 'IPE-120-S355JR', 'Poutrelle IPE 120 S355JR', 'MATIERE_PREMIERE', 'ACTIF', 'PROFILES_ACIER', 'IPE', 'M', 'M', 'M', true, societe_id, 
     '{"hauteur": 120, "largeur": 64, "epaisseurAme": 4.4, "epaisseurAile": 6.3, "poids": 10.4, "section": 13.2, "momentInertieX": 318, "momentInertieY": 27.7, "moduleResistanceX": 53.0, "moduleResistanceY": 8.65, "rayonGiration": 4.90, "norme": "EN 10025-2"}'::jsonb, NOW(), NOW());

    -- IPE 140
    INSERT INTO articles (id, reference, designation, type, status, famille, sous_famille, unite_stock, unite_achat, unite_vente, gere_en_stock, societe_id, caracteristiques_techniques, created_at, updated_at)
    VALUES 
    (gen_random_uuid(), 'IPE-140-S235JR', 'Poutrelle IPE 140 S235JR', 'MATIERE_PREMIERE', 'ACTIF', 'PROFILES_ACIER', 'IPE', 'M', 'M', 'M', true, societe_id, 
     '{"hauteur": 140, "largeur": 73, "epaisseurAme": 4.7, "epaisseurAile": 6.9, "poids": 12.9, "section": 16.4, "momentInertieX": 541, "momentInertieY": 44.9, "moduleResistanceX": 77.3, "moduleResistanceY": 12.3, "rayonGiration": 5.74, "norme": "EN 10025-2"}'::jsonb, NOW(), NOW()),
    (gen_random_uuid(), 'IPE-140-S275JR', 'Poutrelle IPE 140 S275JR', 'MATIERE_PREMIERE', 'ACTIF', 'PROFILES_ACIER', 'IPE', 'M', 'M', 'M', true, societe_id, 
     '{"hauteur": 140, "largeur": 73, "epaisseurAme": 4.7, "epaisseurAile": 6.9, "poids": 12.9, "section": 16.4, "momentInertieX": 541, "momentInertieY": 44.9, "moduleResistanceX": 77.3, "moduleResistanceY": 12.3, "rayonGiration": 5.74, "norme": "EN 10025-2"}'::jsonb, NOW(), NOW()),
    (gen_random_uuid(), 'IPE-140-S355JR', 'Poutrelle IPE 140 S355JR', 'MATIERE_PREMIERE', 'ACTIF', 'PROFILES_ACIER', 'IPE', 'M', 'M', 'M', true, societe_id, 
     '{"hauteur": 140, "largeur": 73, "epaisseurAme": 4.7, "epaisseurAile": 6.9, "poids": 12.9, "section": 16.4, "momentInertieX": 541, "momentInertieY": 44.9, "moduleResistanceX": 77.3, "moduleResistanceY": 12.3, "rayonGiration": 5.74, "norme": "EN 10025-2"}'::jsonb, NOW(), NOW());

    -- IPE 160
    INSERT INTO articles (id, reference, designation, type, status, famille, sous_famille, unite_stock, unite_achat, unite_vente, gere_en_stock, societe_id, caracteristiques_techniques, created_at, updated_at)
    VALUES 
    (gen_random_uuid(), 'IPE-160-S235JR', 'Poutrelle IPE 160 S235JR', 'MATIERE_PREMIERE', 'ACTIF', 'PROFILES_ACIER', 'IPE', 'M', 'M', 'M', true, societe_id, 
     '{"hauteur": 160, "largeur": 82, "epaisseurAme": 5.0, "epaisseurAile": 7.4, "poids": 15.8, "section": 20.1, "momentInertieX": 869, "momentInertieY": 68.3, "moduleResistanceX": 109, "moduleResistanceY": 16.7, "rayonGiration": 6.58, "norme": "EN 10025-2"}'::jsonb, NOW(), NOW()),
    (gen_random_uuid(), 'IPE-160-S275JR', 'Poutrelle IPE 160 S275JR', 'MATIERE_PREMIERE', 'ACTIF', 'PROFILES_ACIER', 'IPE', 'M', 'M', 'M', true, societe_id, 
     '{"hauteur": 160, "largeur": 82, "epaisseurAme": 5.0, "epaisseurAile": 7.4, "poids": 15.8, "section": 20.1, "momentInertieX": 869, "momentInertieY": 68.3, "moduleResistanceX": 109, "moduleResistanceY": 16.7, "rayonGiration": 6.58, "norme": "EN 10025-2"}'::jsonb, NOW(), NOW()),
    (gen_random_uuid(), 'IPE-160-S355JR', 'Poutrelle IPE 160 S355JR', 'MATIERE_PREMIERE', 'ACTIF', 'PROFILES_ACIER', 'IPE', 'M', 'M', 'M', true, societe_id, 
     '{"hauteur": 160, "largeur": 82, "epaisseurAme": 5.0, "epaisseurAile": 7.4, "poids": 15.8, "section": 20.1, "momentInertieX": 869, "momentInertieY": 68.3, "moduleResistanceX": 109, "moduleResistanceY": 16.7, "rayonGiration": 6.58, "norme": "EN 10025-2"}'::jsonb, NOW(), NOW());

    -- IPE 180
    INSERT INTO articles (id, reference, designation, type, status, famille, sous_famille, unite_stock, unite_achat, unite_vente, gere_en_stock, societe_id, caracteristiques_techniques, created_at, updated_at)
    VALUES 
    (gen_random_uuid(), 'IPE-180-S235JR', 'Poutrelle IPE 180 S235JR', 'MATIERE_PREMIERE', 'ACTIF', 'PROFILES_ACIER', 'IPE', 'M', 'M', 'M', true, societe_id, 
     '{"hauteur": 180, "largeur": 91, "epaisseurAme": 5.3, "epaisseurAile": 8.0, "poids": 18.8, "section": 23.9, "momentInertieX": 1317, "momentInertieY": 100, "moduleResistanceX": 146, "moduleResistanceY": 22.2, "rayonGiration": 7.42, "norme": "EN 10025-2"}'::jsonb, NOW(), NOW()),
    (gen_random_uuid(), 'IPE-180-S275JR', 'Poutrelle IPE 180 S275JR', 'MATIERE_PREMIERE', 'ACTIF', 'PROFILES_ACIER', 'IPE', 'M', 'M', 'M', true, societe_id, 
     '{"hauteur": 180, "largeur": 91, "epaisseurAme": 5.3, "epaisseurAile": 8.0, "poids": 18.8, "section": 23.9, "momentInertieX": 1317, "momentInertieY": 100, "moduleResistanceX": 146, "moduleResistanceY": 22.2, "rayonGiration": 7.42, "norme": "EN 10025-2"}'::jsonb, NOW(), NOW()),
    (gen_random_uuid(), 'IPE-180-S355JR', 'Poutrelle IPE 180 S355JR', 'MATIERE_PREMIERE', 'ACTIF', 'PROFILES_ACIER', 'IPE', 'M', 'M', 'M', true, societe_id, 
     '{"hauteur": 180, "largeur": 91, "epaisseurAme": 5.3, "epaisseurAile": 8.0, "poids": 18.8, "section": 23.9, "momentInertieX": 1317, "momentInertieY": 100, "moduleResistanceX": 146, "moduleResistanceY": 22.2, "rayonGiration": 7.42, "norme": "EN 10025-2"}'::jsonb, NOW(), NOW());

    -- IPE 200
    INSERT INTO articles (id, reference, designation, type, status, famille, sous_famille, unite_stock, unite_achat, unite_vente, gere_en_stock, societe_id, caracteristiques_techniques, created_at, updated_at)
    VALUES 
    (gen_random_uuid(), 'IPE-200-S235JR', 'Poutrelle IPE 200 S235JR', 'MATIERE_PREMIERE', 'ACTIF', 'PROFILES_ACIER', 'IPE', 'M', 'M', 'M', true, societe_id, 
     '{"hauteur": 200, "largeur": 100, "epaisseurAme": 5.6, "epaisseurAile": 8.5, "poids": 22.4, "section": 28.5, "momentInertieX": 1943, "momentInertieY": 142, "moduleResistanceX": 194, "moduleResistanceY": 28.5, "rayonGiration": 8.26, "norme": "EN 10025-2"}'::jsonb, NOW(), NOW()),
    (gen_random_uuid(), 'IPE-200-S275JR', 'Poutrelle IPE 200 S275JR', 'MATIERE_PREMIERE', 'ACTIF', 'PROFILES_ACIER', 'IPE', 'M', 'M', 'M', true, societe_id, 
     '{"hauteur": 200, "largeur": 100, "epaisseurAme": 5.6, "epaisseurAile": 8.5, "poids": 22.4, "section": 28.5, "momentInertieX": 1943, "momentInertieY": 142, "moduleResistanceX": 194, "moduleResistanceY": 28.5, "rayonGiration": 8.26, "norme": "EN 10025-2"}'::jsonb, NOW(), NOW()),
    (gen_random_uuid(), 'IPE-200-S355JR', 'Poutrelle IPE 200 S355JR', 'MATIERE_PREMIERE', 'ACTIF', 'PROFILES_ACIER', 'IPE', 'M', 'M', 'M', true, societe_id, 
     '{"hauteur": 200, "largeur": 100, "epaisseurAme": 5.6, "epaisseurAile": 8.5, "poids": 22.4, "section": 28.5, "momentInertieX": 1943, "momentInertieY": 142, "moduleResistanceX": 194, "moduleResistanceY": 28.5, "rayonGiration": 8.26, "norme": "EN 10025-2"}'::jsonb, NOW(), NOW());

    -- IPE 220
    INSERT INTO articles (id, reference, designation, type, status, famille, sous_famille, unite_stock, unite_achat, unite_vente, gere_en_stock, societe_id, caracteristiques_techniques, created_at, updated_at)
    VALUES 
    (gen_random_uuid(), 'IPE-220-S235JR', 'Poutrelle IPE 220 S235JR', 'MATIERE_PREMIERE', 'ACTIF', 'PROFILES_ACIER', 'IPE', 'M', 'M', 'M', true, societe_id, 
     '{"hauteur": 220, "largeur": 110, "epaisseurAme": 5.9, "epaisseurAile": 9.2, "poids": 26.2, "section": 33.4, "momentInertieX": 2772, "momentInertieY": 205, "moduleResistanceX": 252, "moduleResistanceY": 37.3, "rayonGiration": 9.11, "norme": "EN 10025-2"}'::jsonb, NOW(), NOW()),
    (gen_random_uuid(), 'IPE-220-S275JR', 'Poutrelle IPE 220 S275JR', 'MATIERE_PREMIERE', 'ACTIF', 'PROFILES_ACIER', 'IPE', 'M', 'M', 'M', true, societe_id, 
     '{"hauteur": 220, "largeur": 110, "epaisseurAme": 5.9, "epaisseurAile": 9.2, "poids": 26.2, "section": 33.4, "momentInertieX": 2772, "momentInertieY": 205, "moduleResistanceX": 252, "moduleResistanceY": 37.3, "rayonGiration": 9.11, "norme": "EN 10025-2"}'::jsonb, NOW(), NOW()),
    (gen_random_uuid(), 'IPE-220-S355JR', 'Poutrelle IPE 220 S355JR', 'MATIERE_PREMIERE', 'ACTIF', 'PROFILES_ACIER', 'IPE', 'M', 'M', 'M', true, societe_id, 
     '{"hauteur": 220, "largeur": 110, "epaisseurAme": 5.9, "epaisseurAile": 9.2, "poids": 26.2, "section": 33.4, "momentInertieX": 2772, "momentInertieY": 205, "moduleResistanceX": 252, "moduleResistanceY": 37.3, "rayonGiration": 9.11, "norme": "EN 10025-2"}'::jsonb, NOW(), NOW());

    -- IPE 240
    INSERT INTO articles (id, reference, designation, type, status, famille, sous_famille, unite_stock, unite_achat, unite_vente, gere_en_stock, societe_id, caracteristiques_techniques, created_at, updated_at)
    VALUES 
    (gen_random_uuid(), 'IPE-240-S235JR', 'Poutrelle IPE 240 S235JR', 'MATIERE_PREMIERE', 'ACTIF', 'PROFILES_ACIER', 'IPE', 'M', 'M', 'M', true, societe_id, 
     '{"hauteur": 240, "largeur": 120, "epaisseurAme": 6.2, "epaisseurAile": 9.8, "poids": 30.7, "section": 39.1, "momentInertieX": 3892, "momentInertieY": 284, "moduleResistanceX": 324, "moduleResistanceY": 47.3, "rayonGiration": 9.97, "norme": "EN 10025-2"}'::jsonb, NOW(), NOW()),
    (gen_random_uuid(), 'IPE-240-S275JR', 'Poutrelle IPE 240 S275JR', 'MATIERE_PREMIERE', 'ACTIF', 'PROFILES_ACIER', 'IPE', 'M', 'M', 'M', true, societe_id, 
     '{"hauteur": 240, "largeur": 120, "epaisseurAme": 6.2, "epaisseurAile": 9.8, "poids": 30.7, "section": 39.1, "momentInertieX": 3892, "momentInertieY": 284, "moduleResistanceX": 324, "moduleResistanceY": 47.3, "rayonGiration": 9.97, "norme": "EN 10025-2"}'::jsonb, NOW(), NOW()),
    (gen_random_uuid(), 'IPE-240-S355JR', 'Poutrelle IPE 240 S355JR', 'MATIERE_PREMIERE', 'ACTIF', 'PROFILES_ACIER', 'IPE', 'M', 'M', 'M', true, societe_id, 
     '{"hauteur": 240, "largeur": 120, "epaisseurAme": 6.2, "epaisseurAile": 9.8, "poids": 30.7, "section": 39.1, "momentInertieX": 3892, "momentInertieY": 284, "moduleResistanceX": 324, "moduleResistanceY": 47.3, "rayonGiration": 9.97, "norme": "EN 10025-2"}'::jsonb, NOW(), NOW());

    -- IPE 270
    INSERT INTO articles (id, reference, designation, type, status, famille, sous_famille, unite_stock, unite_achat, unite_vente, gere_en_stock, societe_id, caracteristiques_techniques, created_at, updated_at)
    VALUES 
    (gen_random_uuid(), 'IPE-270-S235JR', 'Poutrelle IPE 270 S235JR', 'MATIERE_PREMIERE', 'ACTIF', 'PROFILES_ACIER', 'IPE', 'M', 'M', 'M', true, societe_id, 
     '{"hauteur": 270, "largeur": 135, "epaisseurAme": 6.6, "epaisseurAile": 10.2, "poids": 36.1, "section": 45.9, "momentInertieX": 5790, "momentInertieY": 420, "moduleResistanceX": 429, "moduleResistanceY": 62.2, "rayonGiration": 11.2, "norme": "EN 10025-2"}'::jsonb, NOW(), NOW()),
    (gen_random_uuid(), 'IPE-270-S275JR', 'Poutrelle IPE 270 S275JR', 'MATIERE_PREMIERE', 'ACTIF', 'PROFILES_ACIER', 'IPE', 'M', 'M', 'M', true, societe_id, 
     '{"hauteur": 270, "largeur": 135, "epaisseurAme": 6.6, "epaisseurAile": 10.2, "poids": 36.1, "section": 45.9, "momentInertieX": 5790, "momentInertieY": 420, "moduleResistanceX": 429, "moduleResistanceY": 62.2, "rayonGiration": 11.2, "norme": "EN 10025-2"}'::jsonb, NOW(), NOW()),
    (gen_random_uuid(), 'IPE-270-S355JR', 'Poutrelle IPE 270 S355JR', 'MATIERE_PREMIERE', 'ACTIF', 'PROFILES_ACIER', 'IPE', 'M', 'M', 'M', true, societe_id, 
     '{"hauteur": 270, "largeur": 135, "epaisseurAme": 6.6, "epaisseurAile": 10.2, "poids": 36.1, "section": 45.9, "momentInertieX": 5790, "momentInertieY": 420, "moduleResistanceX": 429, "moduleResistanceY": 62.2, "rayonGiration": 11.2, "norme": "EN 10025-2"}'::jsonb, NOW(), NOW());

    -- IPE 300
    INSERT INTO articles (id, reference, designation, type, status, famille, sous_famille, unite_stock, unite_achat, unite_vente, gere_en_stock, societe_id, caracteristiques_techniques, created_at, updated_at)
    VALUES 
    (gen_random_uuid(), 'IPE-300-S235JR', 'Poutrelle IPE 300 S235JR', 'MATIERE_PREMIERE', 'ACTIF', 'PROFILES_ACIER', 'IPE', 'M', 'M', 'M', true, societe_id, 
     '{"hauteur": 300, "largeur": 150, "epaisseurAme": 7.1, "epaisseurAile": 10.7, "poids": 42.2, "section": 53.8, "momentInertieX": 8356, "momentInertieY": 604, "moduleResistanceX": 557, "moduleResistanceY": 80.5, "rayonGiration": 12.5, "norme": "EN 10025-2"}'::jsonb, NOW(), NOW()),
    (gen_random_uuid(), 'IPE-300-S275JR', 'Poutrelle IPE 300 S275JR', 'MATIERE_PREMIERE', 'ACTIF', 'PROFILES_ACIER', 'IPE', 'M', 'M', 'M', true, societe_id, 
     '{"hauteur": 300, "largeur": 150, "epaisseurAme": 7.1, "epaisseurAile": 10.7, "poids": 42.2, "section": 53.8, "momentInertieX": 8356, "momentInertieY": 604, "moduleResistanceX": 557, "moduleResistanceY": 80.5, "rayonGiration": 12.5, "norme": "EN 10025-2"}'::jsonb, NOW(), NOW()),
    (gen_random_uuid(), 'IPE-300-S355JR', 'Poutrelle IPE 300 S355JR', 'MATIERE_PREMIERE', 'ACTIF', 'PROFILES_ACIER', 'IPE', 'M', 'M', 'M', true, societe_id, 
     '{"hauteur": 300, "largeur": 150, "epaisseurAme": 7.1, "epaisseurAile": 10.7, "poids": 42.2, "section": 53.8, "momentInertieX": 8356, "momentInertieY": 604, "moduleResistanceX": 557, "moduleResistanceY": 80.5, "rayonGiration": 12.5, "norme": "EN 10025-2"}'::jsonb, NOW(), NOW());

    -- IPE 330
    INSERT INTO articles (id, reference, designation, type, status, famille, sous_famille, unite_stock, unite_achat, unite_vente, gere_en_stock, societe_id, caracteristiques_techniques, created_at, updated_at)
    VALUES 
    (gen_random_uuid(), 'IPE-330-S235JR', 'Poutrelle IPE 330 S235JR', 'MATIERE_PREMIERE', 'ACTIF', 'PROFILES_ACIER', 'IPE', 'M', 'M', 'M', true, societe_id, 
     '{"hauteur": 330, "largeur": 160, "epaisseurAme": 7.5, "epaisseurAile": 11.5, "poids": 49.1, "section": 62.6, "momentInertieX": 11770, "momentInertieY": 788, "moduleResistanceX": 713, "moduleResistanceY": 98.5, "rayonGiration": 13.7, "norme": "EN 10025-2"}'::jsonb, NOW(), NOW()),
    (gen_random_uuid(), 'IPE-330-S275JR', 'Poutrelle IPE 330 S275JR', 'MATIERE_PREMIERE', 'ACTIF', 'PROFILES_ACIER', 'IPE', 'M', 'M', 'M', true, societe_id, 
     '{"hauteur": 330, "largeur": 160, "epaisseurAme": 7.5, "epaisseurAile": 11.5, "poids": 49.1, "section": 62.6, "momentInertieX": 11770, "momentInertieY": 788, "moduleResistanceX": 713, "moduleResistanceY": 98.5, "rayonGiration": 13.7, "norme": "EN 10025-2"}'::jsonb, NOW(), NOW()),
    (gen_random_uuid(), 'IPE-330-S355JR', 'Poutrelle IPE 330 S355JR', 'MATIERE_PREMIERE', 'ACTIF', 'PROFILES_ACIER', 'IPE', 'M', 'M', 'M', true, societe_id, 
     '{"hauteur": 330, "largeur": 160, "epaisseurAme": 7.5, "epaisseurAile": 11.5, "poids": 49.1, "section": 62.6, "momentInertieX": 11770, "momentInertieY": 788, "moduleResistanceX": 713, "moduleResistanceY": 98.5, "rayonGiration": 13.7, "norme": "EN 10025-2"}'::jsonb, NOW(), NOW());

    -- IPE 360
    INSERT INTO articles (id, reference, designation, type, status, famille, sous_famille, unite_stock, unite_achat, unite_vente, gere_en_stock, societe_id, caracteristiques_techniques, created_at, updated_at)
    VALUES 
    (gen_random_uuid(), 'IPE-360-S235JR', 'Poutrelle IPE 360 S235JR', 'MATIERE_PREMIERE', 'ACTIF', 'PROFILES_ACIER', 'IPE', 'M', 'M', 'M', true, societe_id, 
     '{"hauteur": 360, "largeur": 170, "epaisseurAme": 8.0, "epaisseurAile": 12.7, "poids": 57.1, "section": 72.7, "momentInertieX": 16270, "momentInertieY": 1043, "moduleResistanceX": 904, "moduleResistanceY": 123, "rayonGiration": 14.9, "norme": "EN 10025-2"}'::jsonb, NOW(), NOW()),
    (gen_random_uuid(), 'IPE-360-S275JR', 'Poutrelle IPE 360 S275JR', 'MATIERE_PREMIERE', 'ACTIF', 'PROFILES_ACIER', 'IPE', 'M', 'M', 'M', true, societe_id, 
     '{"hauteur": 360, "largeur": 170, "epaisseurAme": 8.0, "epaisseurAile": 12.7, "poids": 57.1, "section": 72.7, "momentInertieX": 16270, "momentInertieY": 1043, "moduleResistanceX": 904, "moduleResistanceY": 123, "rayonGiration": 14.9, "norme": "EN 10025-2"}'::jsonb, NOW(), NOW()),
    (gen_random_uuid(), 'IPE-360-S355JR', 'Poutrelle IPE 360 S355JR', 'MATIERE_PREMIERE', 'ACTIF', 'PROFILES_ACIER', 'IPE', 'M', 'M', 'M', true, societe_id, 
     '{"hauteur": 360, "largeur": 170, "epaisseurAme": 8.0, "epaisseurAile": 12.7, "poids": 57.1, "section": 72.7, "momentInertieX": 16270, "momentInertieY": 1043, "moduleResistanceX": 904, "moduleResistanceY": 123, "rayonGiration": 14.9, "norme": "EN 10025-2"}'::jsonb, NOW(), NOW());

    -- IPE 400
    INSERT INTO articles (id, reference, designation, type, status, famille, sous_famille, unite_stock, unite_achat, unite_vente, gere_en_stock, societe_id, caracteristiques_techniques, created_at, updated_at)
    VALUES 
    (gen_random_uuid(), 'IPE-400-S235JR', 'Poutrelle IPE 400 S235JR', 'MATIERE_PREMIERE', 'ACTIF', 'PROFILES_ACIER', 'IPE', 'M', 'M', 'M', true, societe_id, 
     '{"hauteur": 400, "largeur": 180, "epaisseurAme": 8.6, "epaisseurAile": 13.5, "poids": 66.3, "section": 84.5, "momentInertieX": 23130, "momentInertieY": 1318, "moduleResistanceX": 1156, "moduleResistanceY": 146, "rayonGiration": 16.5, "norme": "EN 10025-2"}'::jsonb, NOW(), NOW()),
    (gen_random_uuid(), 'IPE-400-S275JR', 'Poutrelle IPE 400 S275JR', 'MATIERE_PREMIERE', 'ACTIF', 'PROFILES_ACIER', 'IPE', 'M', 'M', 'M', true, societe_id, 
     '{"hauteur": 400, "largeur": 180, "epaisseurAme": 8.6, "epaisseurAile": 13.5, "poids": 66.3, "section": 84.5, "momentInertieX": 23130, "momentInertieY": 1318, "moduleResistanceX": 1156, "moduleResistanceY": 146, "rayonGiration": 16.5, "norme": "EN 10025-2"}'::jsonb, NOW(), NOW()),
    (gen_random_uuid(), 'IPE-400-S355JR', 'Poutrelle IPE 400 S355JR', 'MATIERE_PREMIERE', 'ACTIF', 'PROFILES_ACIER', 'IPE', 'M', 'M', 'M', true, societe_id, 
     '{"hauteur": 400, "largeur": 180, "epaisseurAme": 8.6, "epaisseurAile": 13.5, "poids": 66.3, "section": 84.5, "momentInertieX": 23130, "momentInertieY": 1318, "moduleResistanceX": 1156, "moduleResistanceY": 146, "rayonGiration": 16.5, "norme": "EN 10025-2"}'::jsonb, NOW(), NOW());

    -- IPE 450
    INSERT INTO articles (id, reference, designation, type, status, famille, sous_famille, unite_stock, unite_achat, unite_vente, gere_en_stock, societe_id, caracteristiques_techniques, created_at, updated_at)
    VALUES 
    (gen_random_uuid(), 'IPE-450-S235JR', 'Poutrelle IPE 450 S235JR', 'MATIERE_PREMIERE', 'ACTIF', 'PROFILES_ACIER', 'IPE', 'M', 'M', 'M', true, societe_id, 
     '{"hauteur": 450, "largeur": 190, "epaisseurAme": 9.4, "epaisseurAile": 14.6, "poids": 77.6, "section": 98.8, "momentInertieX": 33740, "momentInertieY": 1676, "moduleResistanceX": 1500, "moduleResistanceY": 176, "rayonGiration": 18.5, "norme": "EN 10025-2"}'::jsonb, NOW(), NOW()),
    (gen_random_uuid(), 'IPE-450-S275JR', 'Poutrelle IPE 450 S275JR', 'MATIERE_PREMIERE', 'ACTIF', 'PROFILES_ACIER', 'IPE', 'M', 'M', 'M', true, societe_id, 
     '{"hauteur": 450, "largeur": 190, "epaisseurAme": 9.4, "epaisseurAile": 14.6, "poids": 77.6, "section": 98.8, "momentInertieX": 33740, "momentInertieY": 1676, "moduleResistanceX": 1500, "moduleResistanceY": 176, "rayonGiration": 18.5, "norme": "EN 10025-2"}'::jsonb, NOW(), NOW()),
    (gen_random_uuid(), 'IPE-450-S355JR', 'Poutrelle IPE 450 S355JR', 'MATIERE_PREMIERE', 'ACTIF', 'PROFILES_ACIER', 'IPE', 'M', 'M', 'M', true, societe_id, 
     '{"hauteur": 450, "largeur": 190, "epaisseurAme": 9.4, "epaisseurAile": 14.6, "poids": 77.6, "section": 98.8, "momentInertieX": 33740, "momentInertieY": 1676, "moduleResistanceX": 1500, "moduleResistanceY": 176, "rayonGiration": 18.5, "norme": "EN 10025-2"}'::jsonb, NOW(), NOW());

    -- IPE 500
    INSERT INTO articles (id, reference, designation, type, status, famille, sous_famille, unite_stock, unite_achat, unite_vente, gere_en_stock, societe_id, caracteristiques_techniques, created_at, updated_at)
    VALUES 
    (gen_random_uuid(), 'IPE-500-S235JR', 'Poutrelle IPE 500 S235JR', 'MATIERE_PREMIERE', 'ACTIF', 'PROFILES_ACIER', 'IPE', 'M', 'M', 'M', true, societe_id, 
     '{"hauteur": 500, "largeur": 200, "epaisseurAme": 10.2, "epaisseurAile": 16.0, "poids": 90.7, "section": 116, "momentInertieX": 48200, "momentInertieY": 2142, "moduleResistanceX": 1928, "moduleResistanceY": 214, "rayonGiration": 20.4, "norme": "EN 10025-2"}'::jsonb, NOW(), NOW()),
    (gen_random_uuid(), 'IPE-500-S275JR', 'Poutrelle IPE 500 S275JR', 'MATIERE_PREMIERE', 'ACTIF', 'PROFILES_ACIER', 'IPE', 'M', 'M', 'M', true, societe_id, 
     '{"hauteur": 500, "largeur": 200, "epaisseurAme": 10.2, "epaisseurAile": 16.0, "poids": 90.7, "section": 116, "momentInertieX": 48200, "momentInertieY": 2142, "moduleResistanceX": 1928, "moduleResistanceY": 214, "rayonGiration": 20.4, "norme": "EN 10025-2"}'::jsonb, NOW(), NOW()),
    (gen_random_uuid(), 'IPE-500-S355JR', 'Poutrelle IPE 500 S355JR', 'MATIERE_PREMIERE', 'ACTIF', 'PROFILES_ACIER', 'IPE', 'M', 'M', 'M', true, societe_id, 
     '{"hauteur": 500, "largeur": 200, "epaisseurAme": 10.2, "epaisseurAile": 16.0, "poids": 90.7, "section": 116, "momentInertieX": 48200, "momentInertieY": 2142, "moduleResistanceX": 1928, "moduleResistanceY": 214, "rayonGiration": 20.4, "norme": "EN 10025-2"}'::jsonb, NOW(), NOW());

    -- IPE 550
    INSERT INTO articles (id, reference, designation, type, status, famille, sous_famille, unite_stock, unite_achat, unite_vente, gere_en_stock, societe_id, caracteristiques_techniques, created_at, updated_at)
    VALUES 
    (gen_random_uuid(), 'IPE-550-S235JR', 'Poutrelle IPE 550 S235JR', 'MATIERE_PREMIERE', 'ACTIF', 'PROFILES_ACIER', 'IPE', 'M', 'M', 'M', true, societe_id, 
     '{"hauteur": 550, "largeur": 210, "epaisseurAme": 11.1, "epaisseurAile": 17.2, "poids": 106, "section": 134, "momentInertieX": 67120, "momentInertieY": 2668, "moduleResistanceX": 2441, "moduleResistanceY": 254, "rayonGiration": 22.4, "norme": "EN 10025-2"}'::jsonb, NOW(), NOW()),
    (gen_random_uuid(), 'IPE-550-S275JR', 'Poutrelle IPE 550 S275JR', 'MATIERE_PREMIERE', 'ACTIF', 'PROFILES_ACIER', 'IPE', 'M', 'M', 'M', true, societe_id, 
     '{"hauteur": 550, "largeur": 210, "epaisseurAme": 11.1, "epaisseurAile": 17.2, "poids": 106, "section": 134, "momentInertieX": 67120, "momentInertieY": 2668, "moduleResistanceX": 2441, "moduleResistanceY": 254, "rayonGiration": 22.4, "norme": "EN 10025-2"}'::jsonb, NOW(), NOW()),
    (gen_random_uuid(), 'IPE-550-S355JR', 'Poutrelle IPE 550 S355JR', 'MATIERE_PREMIERE', 'ACTIF', 'PROFILES_ACIER', 'IPE', 'M', 'M', 'M', true, societe_id, 
     '{"hauteur": 550, "largeur": 210, "epaisseurAme": 11.1, "epaisseurAile": 17.2, "poids": 106, "section": 134, "momentInertieX": 67120, "momentInertieY": 2668, "moduleResistanceX": 2441, "moduleResistanceY": 254, "rayonGiration": 22.4, "norme": "EN 10025-2"}'::jsonb, NOW(), NOW());

    -- IPE 600
    INSERT INTO articles (id, reference, designation, type, status, famille, sous_famille, unite_stock, unite_achat, unite_vente, gere_en_stock, societe_id, caracteristiques_techniques, created_at, updated_at)
    VALUES 
    (gen_random_uuid(), 'IPE-600-S235JR', 'Poutrelle IPE 600 S235JR', 'MATIERE_PREMIERE', 'ACTIF', 'PROFILES_ACIER', 'IPE', 'M', 'M', 'M', true, societe_id, 
     '{"hauteur": 600, "largeur": 220, "epaisseurAme": 12.0, "epaisseurAile": 19.0, "poids": 122, "section": 156, "momentInertieX": 92080, "momentInertieY": 3387, "moduleResistanceX": 3069, "moduleResistanceY": 308, "rayonGiration": 24.3, "norme": "EN 10025-2"}'::jsonb, NOW(), NOW()),
    (gen_random_uuid(), 'IPE-600-S275JR', 'Poutrelle IPE 600 S275JR', 'MATIERE_PREMIERE', 'ACTIF', 'PROFILES_ACIER', 'IPE', 'M', 'M', 'M', true, societe_id, 
     '{"hauteur": 600, "largeur": 220, "epaisseurAme": 12.0, "epaisseurAile": 19.0, "poids": 122, "section": 156, "momentInertieX": 92080, "momentInertieY": 3387, "moduleResistanceX": 3069, "moduleResistanceY": 308, "rayonGiration": 24.3, "norme": "EN 10025-2"}'::jsonb, NOW(), NOW()),
    (gen_random_uuid(), 'IPE-600-S355JR', 'Poutrelle IPE 600 S355JR', 'MATIERE_PREMIERE', 'ACTIF', 'PROFILES_ACIER', 'IPE', 'M', 'M', 'M', true, societe_id, 
     '{"hauteur": 600, "largeur": 220, "epaisseurAme": 12.0, "epaisseurAile": 19.0, "poids": 122, "section": 156, "momentInertieX": 92080, "momentInertieY": 3387, "moduleResistanceX": 3069, "moduleResistanceY": 308, "rayonGiration": 24.3, "norme": "EN 10025-2"}'::jsonb, NOW(), NOW());

    RAISE NOTICE 'Injection terminée : 54 profilés IPE créés (18 hauteurs × 3 nuances)';
    RAISE NOTICE 'Société utilisée : %', societe_id;
END $$;

-- Vérification de l'insertion
SELECT 
    sous_famille,
    COUNT(*) as nombre_articles,
    MIN(reference) as premier_ref,
    MAX(reference) as dernier_ref
FROM articles 
WHERE famille = 'PROFILES_ACIER' AND sous_famille = 'IPE'
GROUP BY sous_famille;

-- Affichage d'un échantillon pour vérification
SELECT 
    reference, 
    designation,
    caracteristiques_techniques->>'hauteur' as hauteur,
    caracteristiques_techniques->>'poids' as poids,
    caracteristiques_techniques->>'norme' as norme
FROM articles 
WHERE famille = 'PROFILES_ACIER' AND sous_famille = 'IPE'
ORDER BY 
    CAST(caracteristiques_techniques->>'hauteur' AS INTEGER),
    reference
LIMIT 10;