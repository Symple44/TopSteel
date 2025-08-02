-- Script d'injection des profilés HEA et HEB
-- TopSteel ERP - Charpente métallique

-- Variables pour la société (adapter selon votre contexte)
DO $$
DECLARE
    societe_id UUID;
    profile_data RECORD;
BEGIN
    -- Récupération de l'ID de société (adapter selon vos données)
    SELECT id INTO societe_id FROM societes WHERE code = 'topsteel' LIMIT 1;
    
    IF societe_id IS NULL THEN
        RAISE EXCEPTION 'Aucune société trouvée. Veuillez d''abord créer une société.';
    END IF;
    
    RAISE NOTICE 'Injection des profilés HEA/HEB pour la société: %', societe_id;

    -- Nettoyage préalable des HEA/HEB existants
    DELETE FROM articles WHERE famille = 'PROFILES_ACIER' AND sous_famille IN ('HEA', 'HEB');

    -- ============================================
    -- PROFILES HEA (Poutrelles H européennes)
    -- ============================================
    
    -- HEA 100
    FOR profile_data IN 
        SELECT 'S235JR' as nuance UNION SELECT 'S275JR' UNION SELECT 'S355JR'
    LOOP
        INSERT INTO articles (
            id, reference, designation, description, type, status,
            famille, sous_famille, unite_stock, unite_achat, unite_vente,
            coefficient_achat, coefficient_vente, gere_en_stock,
            poids, caracteristiques_techniques, societe_id, created_at, updated_at
        ) VALUES (
            gen_random_uuid(),
            'HEA-100-' || profile_data.nuance,
            'Poutrelle HEA 100 ' || profile_data.nuance,
            'Poutrelle H européenne à ailes larges HEA 100 en acier ' || profile_data.nuance,
            'MATIERE_PREMIERE',
            'ACTIF',
            'PROFILES_ACIER',
            'HEA',
            'M', 'M', 'M',
            1.0000, 1.0000, true,
            16.7,
            jsonb_build_object(
                'hauteur', 96,
                'largeur', 100,
                'epaisseurAme', 5.0,
                'epaisseurAile', 8.0,
                'poids', 16.7,
                'section', 21.2,
                'momentInertieX', 349,
                'momentInertieY', 134,
                'moduleResistanceX', 72.7,
                'moduleResistanceY', 26.8,
                'rayonGirationX', 4.06,
                'rayonGirationY', 2.51,
                'norme', 'EN 10025-2',
                'nuance', profile_data.nuance
            ),
            societe_id,
            NOW(),
            NOW()
        );
    END LOOP;

    -- HEA 120
    FOR profile_data IN 
        SELECT 'S235JR' as nuance UNION SELECT 'S275JR' UNION SELECT 'S355JR'
    LOOP
        INSERT INTO articles (
            id, reference, designation, description, type, status,
            famille, sous_famille, unite_stock, unite_achat, unite_vente,
            coefficient_achat, coefficient_vente, gere_en_stock,
            poids, caracteristiques_techniques, societe_id, created_at, updated_at
        ) VALUES (
            gen_random_uuid(),
            'HEA-120-' || profile_data.nuance,
            'Poutrelle HEA 120 ' || profile_data.nuance,
            'Poutrelle H européenne à ailes larges HEA 120 en acier ' || profile_data.nuance,
            'MATIERE_PREMIERE',
            'ACTIF',
            'PROFILES_ACIER',
            'HEA',
            'M', 'M', 'M',
            1.0000, 1.0000, true,
            19.9,
            jsonb_build_object(
                'hauteur', 114,
                'largeur', 120,
                'epaisseurAme', 5.0,
                'epaisseurAile', 8.0,
                'poids', 19.9,
                'section', 25.3,
                'momentInertieX', 606,
                'momentInertieY', 231,
                'moduleResistanceX', 106,
                'moduleResistanceY', 38.5,
                'rayonGirationX', 4.89,
                'rayonGirationY', 3.02,
                'norme', 'EN 10025-2',
                'nuance', profile_data.nuance
            ),
            societe_id,
            NOW(),
            NOW()
        );
    END LOOP;

    -- HEA 140
    FOR profile_data IN 
        SELECT 'S235JR' as nuance UNION SELECT 'S275JR' UNION SELECT 'S355JR'
    LOOP
        INSERT INTO articles (
            id, reference, designation, description, type, status,
            famille, sous_famille, unite_stock, unite_achat, unite_vente,
            coefficient_achat, coefficient_vente, gere_en_stock,
            poids, caracteristiques_techniques, societe_id, created_at, updated_at
        ) VALUES (
            gen_random_uuid(),
            'HEA-140-' || profile_data.nuance,
            'Poutrelle HEA 140 ' || profile_data.nuance,
            'Poutrelle H européenne à ailes larges HEA 140 en acier ' || profile_data.nuance,
            'MATIERE_PREMIERE',
            'ACTIF',
            'PROFILES_ACIER',
            'HEA',
            'M', 'M', 'M',
            1.0000, 1.0000, true,
            24.7,
            jsonb_build_object(
                'hauteur', 133,
                'largeur', 140,
                'epaisseurAme', 5.5,
                'epaisseurAile', 8.5,
                'poids', 24.7,
                'section', 31.4,
                'momentInertieX', 1033,
                'momentInertieY', 389,
                'moduleResistanceX', 155,
                'moduleResistanceY', 55.6,
                'rayonGirationX', 5.73,
                'rayonGirationY', 3.52,
                'norme', 'EN 10025-2',
                'nuance', profile_data.nuance
            ),
            societe_id,
            NOW(),
            NOW()
        );
    END LOOP;

    -- HEA 160
    FOR profile_data IN 
        SELECT 'S235JR' as nuance UNION SELECT 'S275JR' UNION SELECT 'S355JR'
    LOOP
        INSERT INTO articles (
            id, reference, designation, description, type, status,
            famille, sous_famille, unite_stock, unite_achat, unite_vente,
            coefficient_achat, coefficient_vente, gere_en_stock,
            poids, caracteristiques_techniques, societe_id, created_at, updated_at
        ) VALUES (
            gen_random_uuid(),
            'HEA-160-' || profile_data.nuance,
            'Poutrelle HEA 160 ' || profile_data.nuance,
            'Poutrelle H européenne à ailes larges HEA 160 en acier ' || profile_data.nuance,
            'MATIERE_PREMIERE',
            'ACTIF',
            'PROFILES_ACIER',
            'HEA',
            'M', 'M', 'M',
            1.0000, 1.0000, true,
            30.4,
            jsonb_build_object(
                'hauteur', 152,
                'largeur', 160,
                'epaisseurAme', 6.0,
                'epaisseurAile', 9.0,
                'poids', 30.4,
                'section', 38.8,
                'momentInertieX', 1673,
                'momentInertieY', 616,
                'moduleResistanceX', 220,
                'moduleResistanceY', 77.0,
                'rayonGirationX', 6.56,
                'rayonGirationY', 3.98,
                'norme', 'EN 10025-2',
                'nuance', profile_data.nuance
            ),
            societe_id,
            NOW(),
            NOW()
        );
    END LOOP;

    -- HEA 180 à 300 (principales dimensions)
    -- HEA 180
    FOR profile_data IN 
        SELECT 'S235JR' as nuance UNION SELECT 'S275JR' UNION SELECT 'S355JR'
    LOOP
        INSERT INTO articles (
            id, reference, designation, description, type, status,
            famille, sous_famille, unite_stock, unite_achat, unite_vente,
            coefficient_achat, coefficient_vente, gere_en_stock,
            poids, caracteristiques_techniques, societe_id, created_at, updated_at
        ) VALUES (
            gen_random_uuid(),
            'HEA-180-' || profile_data.nuance,
            'Poutrelle HEA 180 ' || profile_data.nuance,
            'Poutrelle H européenne à ailes larges HEA 180 en acier ' || profile_data.nuance,
            'MATIERE_PREMIERE',
            'ACTIF',
            'PROFILES_ACIER',
            'HEA',
            'M', 'M', 'M',
            1.0000, 1.0000, true,
            35.5,
            jsonb_build_object(
                'hauteur', 171,
                'largeur', 180,
                'epaisseurAme', 6.0,
                'epaisseurAile', 9.5,
                'poids', 35.5,
                'section', 45.3,
                'momentInertieX', 2510,
                'momentInertieY', 925,
                'moduleResistanceX', 294,
                'moduleResistanceY', 103,
                'rayonGirationX', 7.45,
                'rayonGirationY', 4.52,
                'norme', 'EN 10025-2',
                'nuance', profile_data.nuance
            ),
            societe_id,
            NOW(),
            NOW()
        );
    END LOOP;

    -- HEA 200
    FOR profile_data IN 
        SELECT 'S235JR' as nuance UNION SELECT 'S275JR' UNION SELECT 'S355JR'
    LOOP
        INSERT INTO articles (
            id, reference, designation, description, type, status,
            famille, sous_famille, unite_stock, unite_achat, unite_vente,
            coefficient_achat, coefficient_vente, gere_en_stock,
            poids, caracteristiques_techniques, societe_id, created_at, updated_at
        ) VALUES (
            gen_random_uuid(),
            'HEA-200-' || profile_data.nuance,
            'Poutrelle HEA 200 ' || profile_data.nuance,
            'Poutrelle H européenne à ailes larges HEA 200 en acier ' || profile_data.nuance,
            'MATIERE_PREMIERE',
            'ACTIF',
            'PROFILES_ACIER',
            'HEA',
            'M', 'M', 'M',
            1.0000, 1.0000, true,
            42.3,
            jsonb_build_object(
                'hauteur', 190,
                'largeur', 200,
                'epaisseurAme', 6.5,
                'epaisseurAile', 10.0,
                'poids', 42.3,
                'section', 53.8,
                'momentInertieX', 3692,
                'momentInertieY', 1336,
                'moduleResistanceX', 389,
                'moduleResistanceY', 134,
                'rayonGirationX', 8.28,
                'rayonGirationY', 4.98,
                'norme', 'EN 10025-2',
                'nuance', profile_data.nuance
            ),
            societe_id,
            NOW(),
            NOW()
        );
    END LOOP;

    -- ============================================
    -- PROFILES HEB (Poutrelles H extra-larges)
    -- ============================================
    
    -- HEB 100
    FOR profile_data IN 
        SELECT 'S235JR' as nuance UNION SELECT 'S275JR' UNION SELECT 'S355JR'
    LOOP
        INSERT INTO articles (
            id, reference, designation, description, type, status,
            famille, sous_famille, unite_stock, unite_achat, unite_vente,
            coefficient_achat, coefficient_vente, gere_en_stock,
            poids, caracteristiques_techniques, societe_id, created_at, updated_at
        ) VALUES (
            gen_random_uuid(),
            'HEB-100-' || profile_data.nuance,
            'Poutrelle HEB 100 ' || profile_data.nuance,
            'Poutrelle H européenne à ailes extra-larges HEB 100 en acier ' || profile_data.nuance,
            'MATIERE_PREMIERE',
            'ACTIF',
            'PROFILES_ACIER',
            'HEB',
            'M', 'M', 'M',
            1.0000, 1.0000, true,
            20.4,
            jsonb_build_object(
                'hauteur', 100,
                'largeur', 100,
                'epaisseurAme', 6.0,
                'epaisseurAile', 10.0,
                'poids', 20.4,
                'section', 26.0,
                'momentInertieX', 450,
                'momentInertieY', 167,
                'moduleResistanceX', 89.9,
                'moduleResistanceY', 33.5,
                'rayonGirationX', 4.16,
                'rayonGirationY', 2.53,
                'norme', 'EN 10025-2',
                'nuance', profile_data.nuance
            ),
            societe_id,
            NOW(),
            NOW()
        );
    END LOOP;

    -- HEB 120
    FOR profile_data IN 
        SELECT 'S235JR' as nuance UNION SELECT 'S275JR' UNION SELECT 'S355JR'
    LOOP
        INSERT INTO articles (
            id, reference, designation, description, type, status,
            famille, sous_famille, unite_stock, unite_achat, unite_vente,
            coefficient_achat, coefficient_vente, gere_en_stock,
            poids, caracteristiques_techniques, societe_id, created_at, updated_at
        ) VALUES (
            gen_random_uuid(),
            'HEB-120-' || profile_data.nuance,
            'Poutrelle HEB 120 ' || profile_data.nuance,
            'Poutrelle H européenne à ailes extra-larges HEB 120 en acier ' || profile_data.nuance,
            'MATIERE_PREMIERE',
            'ACTIF',
            'PROFILES_ACIER',
            'HEB',
            'M', 'M', 'M',
            1.0000, 1.0000, true,
            26.7,
            jsonb_build_object(
                'hauteur', 120,
                'largeur', 120,
                'epaisseurAme', 6.5,
                'epaisseurAile', 11.0,
                'poids', 26.7,
                'section', 34.0,
                'momentInertieX', 864,
                'momentInertieY', 318,
                'moduleResistanceX', 144,
                'moduleResistanceY', 52.9,
                'rayonGirationX', 5.04,
                'rayonGirationY', 3.06,
                'norme', 'EN 10025-2',
                'nuance', profile_data.nuance
            ),
            societe_id,
            NOW(),
            NOW()
        );
    END LOOP;

    -- HEB 140
    FOR profile_data IN 
        SELECT 'S235JR' as nuance UNION SELECT 'S275JR' UNION SELECT 'S355JR'
    LOOP
        INSERT INTO articles (
            id, reference, designation, description, type, status,
            famille, sous_famille, unite_stock, unite_achat, unite_vente,
            coefficient_achat, coefficient_vente, gere_en_stock,
            poids, caracteristiques_techniques, societe_id, created_at, updated_at
        ) VALUES (
            gen_random_uuid(),
            'HEB-140-' || profile_data.nuance,
            'Poutrelle HEB 140 ' || profile_data.nuance,
            'Poutrelle H européenne à ailes extra-larges HEB 140 en acier ' || profile_data.nuance,
            'MATIERE_PREMIERE',
            'ACTIF',
            'PROFILES_ACIER',
            'HEB',
            'M', 'M', 'M',
            1.0000, 1.0000, true,
            33.7,
            jsonb_build_object(
                'hauteur', 140,
                'largeur', 140,
                'epaisseurAme', 7.0,
                'epaisseurAile', 12.0,
                'poids', 33.7,
                'section', 43.0,
                'momentInertieX', 1509,
                'momentInertieY', 549,
                'moduleResistanceX', 216,
                'moduleResistanceY', 78.4,
                'rayonGirationX', 5.93,
                'rayonGirationY', 3.58,
                'norme', 'EN 10025-2',
                'nuance', profile_data.nuance
            ),
            societe_id,
            NOW(),
            NOW()
        );
    END LOOP;

    -- HEB 160
    FOR profile_data IN 
        SELECT 'S235JR' as nuance UNION SELECT 'S275JR' UNION SELECT 'S355JR'
    LOOP
        INSERT INTO articles (
            id, reference, designation, description, type, status,
            famille, sous_famille, unite_stock, unite_achat, unite_vente,
            coefficient_achat, coefficient_vente, gere_en_stock,
            poids, caracteristiques_techniques, societe_id, created_at, updated_at
        ) VALUES (
            gen_random_uuid(),
            'HEB-160-' || profile_data.nuance,
            'Poutrelle HEB 160 ' || profile_data.nuance,
            'Poutrelle H européenne à ailes extra-larges HEB 160 en acier ' || profile_data.nuance,
            'MATIERE_PREMIERE',
            'ACTIF',
            'PROFILES_ACIER',
            'HEB',
            'M', 'M', 'M',
            1.0000, 1.0000, true,
            42.6,
            jsonb_build_object(
                'hauteur', 160,
                'largeur', 160,
                'epaisseurAme', 8.0,
                'epaisseurAile', 13.0,
                'poids', 42.6,
                'section', 54.3,
                'momentInertieX', 2492,
                'momentInertieY', 889,
                'moduleResistanceX', 311,
                'moduleResistanceY', 111,
                'rayonGirationX', 6.78,
                'rayonGirationY', 4.05,
                'norme', 'EN 10025-2',
                'nuance', profile_data.nuance
            ),
            societe_id,
            NOW(),
            NOW()
        );
    END LOOP;

    -- HEB 180
    FOR profile_data IN 
        SELECT 'S235JR' as nuance UNION SELECT 'S275JR' UNION SELECT 'S355JR'
    LOOP
        INSERT INTO articles (
            id, reference, designation, description, type, status,
            famille, sous_famille, unite_stock, unite_achat, unite_vente,
            coefficient_achat, coefficient_vente, gere_en_stock,
            poids, caracteristiques_techniques, societe_id, created_at, updated_at
        ) VALUES (
            gen_random_uuid(),
            'HEB-180-' || profile_data.nuance,
            'Poutrelle HEB 180 ' || profile_data.nuance,
            'Poutrelle H européenne à ailes extra-larges HEB 180 en acier ' || profile_data.nuance,
            'MATIERE_PREMIERE',
            'ACTIF',
            'PROFILES_ACIER',
            'HEB',
            'M', 'M', 'M',
            1.0000, 1.0000, true,
            51.2,
            jsonb_build_object(
                'hauteur', 180,
                'largeur', 180,
                'epaisseurAme', 8.5,
                'epaisseurAile', 14.0,
                'poids', 51.2,
                'section', 65.3,
                'momentInertieX', 3831,
                'momentInertieY', 1363,
                'moduleResistanceX', 426,
                'moduleResistanceY', 151,
                'rayonGirationX', 7.66,
                'rayonGirationY', 4.57,
                'norme', 'EN 10025-2',
                'nuance', profile_data.nuance
            ),
            societe_id,
            NOW(),
            NOW()
        );
    END LOOP;

    -- HEB 200
    FOR profile_data IN 
        SELECT 'S235JR' as nuance UNION SELECT 'S275JR' UNION SELECT 'S355JR'
    LOOP
        INSERT INTO articles (
            id, reference, designation, description, type, status,
            famille, sous_famille, unite_stock, unite_achat, unite_vente,
            coefficient_achat, coefficient_vente, gere_en_stock,
            poids, caracteristiques_techniques, societe_id, created_at, updated_at
        ) VALUES (
            gen_random_uuid(),
            'HEB-200-' || profile_data.nuance,
            'Poutrelle HEB 200 ' || profile_data.nuance,
            'Poutrelle H européenne à ailes extra-larges HEB 200 en acier ' || profile_data.nuance,
            'MATIERE_PREMIERE',
            'ACTIF',
            'PROFILES_ACIER',
            'HEB',
            'M', 'M', 'M',
            1.0000, 1.0000, true,
            61.3,
            jsonb_build_object(
                'hauteur', 200,
                'largeur', 200,
                'epaisseurAme', 9.0,
                'epaisseurAile', 15.0,
                'poids', 61.3,
                'section', 78.1,
                'momentInertieX', 5696,
                'momentInertieY', 2003,
                'moduleResistanceX', 570,
                'moduleResistanceY', 200,
                'rayonGirationX', 8.54,
                'rayonGirationY', 5.07,
                'norme', 'EN 10025-2',
                'nuance', profile_data.nuance
            ),
            societe_id,
            NOW(),
            NOW()
        );
    END LOOP;

    RAISE NOTICE 'Injection des profilés HEA/HEB terminée avec succès !';
    RAISE NOTICE 'Total d''articles créés: % HEA + % HEB = % articles', 18, 18, 36;

END $$;

-- Vérification des données injectées
SELECT 
    sous_famille,
    COUNT(*) as nombre_articles,
    MIN(poids) as poids_min,
    MAX(poids) as poids_max
FROM articles 
WHERE famille = 'PROFILES_ACIER' 
AND sous_famille IN ('HEA', 'HEB')
GROUP BY sous_famille
ORDER BY sous_famille;

-- Affichage des références créées
SELECT reference, designation, poids 
FROM articles 
WHERE famille = 'PROFILES_ACIER' 
AND sous_famille IN ('HEA', 'HEB')
ORDER BY sous_famille, poids;