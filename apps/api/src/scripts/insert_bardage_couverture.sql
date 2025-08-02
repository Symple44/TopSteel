-- Script d'injection des éléments de bardage et couverture
-- TopSteel ERP - Éléments de construction métallique

DO $$
DECLARE
    societe_id UUID;
    current_date TIMESTAMP := NOW();
BEGIN
    -- Récupération de l'ID de société
    SELECT id INTO societe_id FROM societes WHERE code = 'topsteel' LIMIT 1;
    
    IF societe_id IS NULL THEN
        RAISE EXCEPTION 'Aucune société trouvée. Veuillez d''abord créer une société.';
    END IF;
    
    RAISE NOTICE 'Injection des éléments bardage/couverture pour la société: %', societe_id;

    -- Nettoyage préalable
    DELETE FROM articles WHERE famille = 'COUVERTURE_BARDAGE';

    -- ============================================
    -- 1. BACS ACIER COUVERTURE
    -- ============================================
    
    -- BAC COUVERTURE 35.207.1035 - 0.75mm Galvanisé
    INSERT INTO articles (
        id, reference, designation, description, type, status,
        famille, sous_famille, unite_stock, unite_achat, unite_vente,
        coefficient_achat, coefficient_vente, gere_en_stock,
        poids, prix_achat_standard, prix_vente_ht, taux_marge,
        caracteristiques_techniques, societe_id, created_at, updated_at
    ) VALUES (
        gen_random_uuid(),
        'BAC-COUV-35.207-0.75-GALVA',
        'Bac acier couverture 35.207.1035 0.75mm galvanisé',
        'Bac de couverture nervuré hauteur 35mm, largeur utile 1035mm, acier galvanisé Z275',
        'MATIERE_PREMIERE', 'ACTIF',
        'COUVERTURE_BARDAGE', 'BAC_COUVERTURE',
        'M2', 'PCS', 'M2',
        1.0000, 1.0000, true,
        7.5, 8.50, 12.50, 47.0,
        jsonb_build_object(
            'hauteurOnde', 35,
            'entraxeOndulation', 207,
            'largeurUtile', 1035,
            'largeurBrute', 1100,
            'epaisseur', 0.75,
            'revetement', 'Galvanisé Z275',
            'poidsParmSquare', 7.5,
            'momentInertie', 18.2,
            'moduleResistance', 1.04,
            'porteeAdmissible', 3.5,
            'norme', 'EN 14782',
            'classeFeu', 'A1',
            'resistanceVent', 'Classe 5'
        ),
        societe_id, current_date, current_date
    );

    -- BAC COUVERTURE 40.183.1100 - 0.75mm Prélaqué RAL9002
    INSERT INTO articles (
        id, reference, designation, description, type, status,
        famille, sous_famille, unite_stock, unite_achat, unite_vente,
        coefficient_achat, coefficient_vente, gere_en_stock,
        poids, prix_achat_standard, prix_vente_ht, taux_marge,
        caracteristiques_techniques, societe_id, created_at, updated_at
    ) VALUES (
        gen_random_uuid(),
        'BAC-COUV-40.183-0.75-RAL9002',
        'Bac acier couverture 40.183.1100 0.75mm RAL9002',
        'Bac de couverture nervuré hauteur 40mm, largeur utile 1100mm, prélaqué blanc RAL9002',
        'MATIERE_PREMIERE', 'ACTIF',
        'COUVERTURE_BARDAGE', 'BAC_COUVERTURE',
        'M2', 'PCS', 'M2',
        1.0000, 1.0000, true,
        7.8, 11.20, 16.50, 47.0,
        jsonb_build_object(
            'hauteurOnde', 40,
            'entraxeOndulation', 183,
            'largeurUtile', 1100,
            'largeurBrute', 1175,
            'epaisseur', 0.75,
            'revetement', 'Prélaqué RAL9002 25µm',
            'poidsParmSquare', 7.8,
            'momentInertie', 24.5,
            'moduleResistance', 1.23,
            'porteeAdmissible', 4.0,
            'norme', 'EN 14782',
            'classeFeu', 'A1',
            'durabiliteLaquage', '15 ans'
        ),
        societe_id, current_date, current_date
    );

    -- BAC COUVERTURE 59.200.1000 - 1.0mm Prélaqué RAL7016
    INSERT INTO articles (
        id, reference, designation, description, type, status,
        famille, sous_famille, unite_stock, unite_achat, unite_vente,
        coefficient_achat, coefficient_vente, gere_en_stock,
        poids, prix_achat_standard, prix_vente_ht, taux_marge,
        caracteristiques_techniques, societe_id, created_at, updated_at
    ) VALUES (
        gen_random_uuid(),
        'BAC-COUV-59.200-1.0-RAL7016',
        'Bac acier couverture 59.200.1000 1.0mm RAL7016',
        'Bac de couverture hautes performances hauteur 59mm, largeur utile 1000mm, prélaqué gris RAL7016',
        'MATIERE_PREMIERE', 'ACTIF',
        'COUVERTURE_BARDAGE', 'BAC_COUVERTURE',
        'M2', 'PCS', 'M2',
        1.0000, 1.0000, true,
        11.2, 15.80, 23.50, 48.7,
        jsonb_build_object(
            'hauteurOnde', 59,
            'entraxeOndulation', 200,
            'largeurUtile', 1000,
            'largeurBrute', 1080,
            'epaisseur', 1.0,
            'revetement', 'Prélaqué RAL7016 25µm',
            'poidsParmSquare', 11.2,
            'momentInertie', 58.7,
            'moduleResistance', 1.99,
            'porteeAdmissible', 6.0,
            'norme', 'EN 14782',
            'classeFeu', 'A1',
            'isolationPhonique', 'Rw 28dB'
        ),
        societe_id, current_date, current_date
    );

    -- ============================================
    -- 2. BACS ACIER BARDAGE
    -- ============================================
    
    -- BAC BARDAGE 33.250.1000 - 0.75mm RAL9002
    INSERT INTO articles (
        id, reference, designation, description, type, status,
        famille, sous_famille, unite_stock, unite_achat, unite_vente,
        coefficient_achat, coefficient_vente, gere_en_stock,
        poids, prix_achat_standard, prix_vente_ht, taux_marge,
        caracteristiques_techniques, societe_id, created_at, updated_at
    ) VALUES (
        gen_random_uuid(),
        'BAC-BARD-33.250-0.75-RAL9002',
        'Bac acier bardage 33.250.1000 0.75mm RAL9002',
        'Bac de bardage vertical nervuré hauteur 33mm, largeur utile 1000mm, prélaqué blanc RAL9002',
        'MATIERE_PREMIERE', 'ACTIF',
        'COUVERTURE_BARDAGE', 'BAC_BARDAGE',
        'M2', 'PCS', 'M2',
        1.0000, 1.0000, true,
        7.2, 10.50, 15.75, 50.0,
        jsonb_build_object(
            'hauteurOnde', 33,
            'entraxeOndulation', 250,
            'largeurUtile', 1000,
            'largeurBrute', 1080,
            'epaisseur', 0.75,
            'revetement', 'Prélaqué RAL9002 25µm',
            'poidsParmSquare', 7.2,
            'application', 'Bardage vertical',
            'entraxeLisses', 1.5,
            'norme', 'EN 14782',
            'resistanceVent', 'Classe 4',
            'etancheite', 'IP54'
        ),
        societe_id, current_date, current_date
    );

    -- BAC BARDAGE 40.250.1100 - 1.0mm RAL7016
    INSERT INTO articles (
        id, reference, designation, description, type, status,
        famille, sous_famille, unite_stock, unite_achat, unite_vente,
        coefficient_achat, coefficient_vente, gere_en_stock,
        poids, prix_achat_standard, prix_vente_ht, taux_marge,
        caracteristiques_techniques, societe_id, created_at, updated_at
    ) VALUES (
        gen_random_uuid(),
        'BAC-BARD-40.250-1.0-RAL7016',
        'Bac acier bardage 40.250.1100 1.0mm RAL7016',
        'Bac de bardage renforcé hauteur 40mm, largeur utile 1100mm, prélaqué gris RAL7016',
        'MATIERE_PREMIERE', 'ACTIF',
        'COUVERTURE_BARDAGE', 'BAC_BARDAGE',
        'M2', 'PCS', 'M2',
        1.0000, 1.0000, true,
        10.8, 14.20, 21.30, 50.0,
        jsonb_build_object(
            'hauteurOnde', 40,
            'entraxeOndulation', 250,
            'largeurUtile', 1100,
            'largeurBrute', 1180,
            'epaisseur', 1.0,
            'revetement', 'Prélaqué RAL7016 25µm',
            'poidsParmSquare', 10.8,
            'application', 'Bardage haute résistance',
            'entraxeLisses', 2.0,
            'norme', 'EN 14782',
            'resistanceVent', 'Classe 5',
            'durabiliteLaquage', '20 ans'
        ),
        societe_id, current_date, current_date
    );

    -- ============================================
    -- 3. PANNEAUX SANDWICH COUVERTURE
    -- ============================================
    
    -- Panneau sandwich PU 60mm
    INSERT INTO articles (
        id, reference, designation, description, type, status,
        famille, sous_famille, unite_stock, unite_achat, unite_vente,
        coefficient_achat, coefficient_vente, gere_en_stock,
        poids, prix_achat_standard, prix_vente_ht, taux_marge,
        caracteristiques_techniques, societe_id, created_at, updated_at
    ) VALUES (
        gen_random_uuid(),
        'PANN-COUV-PU-60',
        'Panneau sandwich couverture PU 60mm',
        'Panneau sandwich isolant polyuréthane 60mm, parements acier prélaqué/galvanisé',
        'MATIERE_PREMIERE', 'ACTIF',
        'COUVERTURE_BARDAGE', 'PANNEAU_SANDWICH',
        'M2', 'PCS', 'M2',
        1.0000, 1.0000, true,
        12.5, 28.50, 42.50, 49.1,
        jsonb_build_object(
            'epaisseurTotale', 60,
            'ameIsolante', 'Polyuréthane (PU)',
            'largeurUtile', 1000,
            'parementSuperieur', 'Acier prélaqué 0.6mm',
            'parementInferieur', 'Acier galvanisé 0.5mm',
            'poidsParmSquare', 12.5,
            'conductiviteThermique', 0.025,
            'resistanceThermique', 2.40,
            'reactionFeu', 'B-s2,d0',
            'porteeAdmissible', 4.5,
            'norme', 'EN 14509',
            'garantie', '10 ans'
        ),
        societe_id, current_date, current_date
    );

    -- Panneau sandwich laine de roche 100mm
    INSERT INTO articles (
        id, reference, designation, description, type, status,
        famille, sous_famille, unite_stock, unite_achat, unite_vente,
        coefficient_achat, coefficient_vente, gere_en_stock,
        poids, prix_achat_standard, prix_vente_ht, taux_marge,
        caracteristiques_techniques, societe_id, created_at, updated_at
    ) VALUES (
        gen_random_uuid(),
        'PANN-COUV-LR-100',
        'Panneau sandwich couverture LR 100mm',
        'Panneau sandwich isolant laine de roche 100mm, parements acier prélaqué/galvanisé',
        'MATIERE_PREMIERE', 'ACTIF',
        'COUVERTURE_BARDAGE', 'PANNEAU_SANDWICH',
        'M2', 'PCS', 'M2',
        1.0000, 1.0000, true,
        18.2, 35.80, 53.50, 49.4,
        jsonb_build_object(
            'epaisseurTotale', 100,
            'ameIsolante', 'Laine de roche',
            'largeurUtile', 1000,
            'parementSuperieur', 'Acier prélaqué 0.6mm',
            'parementInferieur', 'Acier galvanisé 0.5mm',
            'poidsParmSquare', 18.2,
            'conductiviteThermique', 0.040,
            'resistanceThermique', 2.50,
            'reactionFeu', 'A2-s1,d0',
            'porteeAdmissible', 6.0,
            'isolationPhonique', 'Rw 35dB',
            'norme', 'EN 14509'
        ),
        societe_id, current_date, current_date
    );

    -- ============================================
    -- 4. PLAQUES FIBROCIMENT
    -- ============================================
    
    -- Plaque ondulée 6 ondes
    INSERT INTO articles (
        id, reference, designation, description, type, status,
        famille, sous_famille, unite_stock, unite_achat, unite_vente,
        coefficient_achat, coefficient_vente, gere_en_stock,
        poids, prix_achat_standard, prix_vente_ht, taux_marge,
        caracteristiques_techniques, societe_id, created_at, updated_at
    ) VALUES (
        gen_random_uuid(),
        'FIBRO-OND6-1095x2000',
        'Plaque fibrociment ondulée 6 ondes 1095x2000',
        'Plaque de couverture fibrociment ondulée 6 ondes, dimensions 1095x2000mm, épaisseur 6mm',
        'MATIERE_PREMIERE', 'ACTIF',
        'COUVERTURE_BARDAGE', 'FIBROCIMENT',
        'M2', 'PCS', 'M2',
        2.19, 1.0000, true,
        16.8, 8.50, 12.75, 50.0,
        jsonb_build_object(
            'longueur', 2000,
            'largeur', 1095,
            'largeurUtile', 1000,
            'nombreOndes', 6,
            'hauteurOnde', 51,
            'epaisseur', 6,
            'surface', 2.19,
            'poidsParmSquare', 16.8,
            'poidsPiece', 36.8,
            'porteeAdmissible', 1.35,
            'recouvrement', 200,
            'norme', 'EN 494',
            'classeFeu', 'A1',
            'garantie', '30 ans'
        ),
        societe_id, current_date, current_date
    );

    -- Plaque plane haute résistance
    INSERT INTO articles (
        id, reference, designation, description, type, status,
        famille, sous_famille, unite_stock, unite_achat, unite_vente,
        coefficient_achat, coefficient_vente, gere_en_stock,
        poids, prix_achat_standard, prix_vente_ht, taux_marge,
        caracteristiques_techniques, societe_id, created_at, updated_at
    ) VALUES (
        gen_random_uuid(),
        'FIBRO-PLANE-1200x3000',
        'Plaque fibrociment plane 1200x3000',
        'Plaque plane fibrociment haute résistance 1200x3000mm, épaisseur 8mm',
        'MATIERE_PREMIERE', 'ACTIF',
        'COUVERTURE_BARDAGE', 'FIBROCIMENT',
        'M2', 'PCS', 'M2',
        3.60, 1.0000, true,
        18.5, 12.80, 19.20, 50.0,
        jsonb_build_object(
            'longueur', 3000,
            'largeur', 1200,
            'epaisseur', 8,
            'surface', 3.60,
            'poidsParmSquare', 18.5,
            'poidsPiece', 66.6,
            'type', 'Plane haute résistance',
            'applications', ['Bardage', 'Cloisons'],
            'porteeAdmissible', 2.0,
            'norme', 'EN 12467',
            'classeFeu', 'A1',
            'resistanceGel', 'F3'
        ),
        societe_id, current_date, current_date
    );

    -- ============================================
    -- 5. ACCESSOIRES COUVERTURE
    -- ============================================
    
    -- Faîtière universelle
    INSERT INTO articles (
        id, reference, designation, description, type, status,
        famille, sous_famille, unite_stock, unite_achat, unite_vente,
        coefficient_achat, coefficient_vente, gere_en_stock,
        poids, prix_achat_standard, prix_vente_ht, taux_marge,
        caracteristiques_techniques, societe_id, created_at, updated_at
    ) VALUES (
        gen_random_uuid(),
        'ACCESS-FAITIERE-GALVA-200',
        'Faîtière universelle galvanisée 200mm',
        'Faîtière universelle acier galvanisé, développé 200mm, longueur 2m',
        'MATIERE_PREMIERE', 'ACTIF',
        'COUVERTURE_BARDAGE', 'ACCESSOIRES',
        'ML', 'PCS', 'ML',
        2.0000, 1.0000, true,
        1.2, 8.50, 13.50, 58.8,
        jsonb_build_object(
            'type', 'Faîtière universelle',
            'developpe', 200,
            'hauteur', 100,
            'longueur', 2000,
            'materiau', 'Acier galvanisé Z275',
            'epaisseur', 0.63,
            'poidsmetre', 1.2,
            'applications', ['Couverture bac acier', 'Fibrociment'],
            'fixation', 'Vis autoperceuses + joint EPDM',
            'recouvrement', 100,
            'norme', 'DTU 40.35'
        ),
        societe_id, current_date, current_date
    );

    -- Rive d'égout
    INSERT INTO articles (
        id, reference, designation, description, type, status,
        famille, sous_famille, unite_stock, unite_achat, unite_vente,
        coefficient_achat, coefficient_vente, gere_en_stock,
        poids, prix_achat_standard, prix_vente_ht, taux_marge,
        caracteristiques_techniques, societe_id, created_at, updated_at
    ) VALUES (
        gen_random_uuid(),
        'ACCESS-RIVE-EGOUT-RAL7016',
        'Rive d''égout prélaquée RAL7016',
        'Rive d''égout acier prélaqué RAL7016, développé 250mm, longueur 2m',
        'MATIERE_PREMIERE', 'ACTIF',
        'COUVERTURE_BARDAGE', 'ACCESSOIRES',
        'ML', 'PCS', 'ML',
        2.0000, 1.0000, true,
        1.8, 12.50, 18.75, 50.0,
        jsonb_build_object(
            'type', 'Rive d''égout',
            'developpe', 250,
            'longueur', 2000,
            'materiau', 'Acier prélaqué',
            'couleur', 'RAL7016',
            'epaisseur', 0.75,
            'poidsmetre', 1.8,
            'bavette', 120,
            'retour', 30,
            'fixation', 'Vis autoperceuses Ø4.8',
            'entraxeFixation', 500,
            'norme', 'DTU 40.35'
        ),
        societe_id, current_date, current_date
    );

    -- Gouttière demi-ronde
    INSERT INTO articles (
        id, reference, designation, description, type, status,
        famille, sous_famille, unite_stock, unite_achat, unite_vente,
        coefficient_achat, coefficient_vente, gere_en_stock,
        poids, prix_achat_standard, prix_vente_ht, taux_marge,
        caracteristiques_techniques, societe_id, created_at, updated_at
    ) VALUES (
        gen_random_uuid(),
        'ACCESS-GOUTT-125-ALU',
        'Gouttière demi-ronde aluminium 125mm',
        'Gouttière demi-ronde aluminium prélaqué, diamètre 125mm, longueur 4m',
        'MATIERE_PREMIERE', 'ACTIF',
        'COUVERTURE_BARDAGE', 'ACCESSOIRES',
        'ML', 'PCS', 'ML',
        4.0000, 1.0000, true,
        0.8, 18.50, 27.75, 50.0,
        jsonb_build_object(
            'type', 'Gouttière demi-ronde',
            'diametre', 125,
            'longueur', 4000,
            'materiau', 'Aluminium prélaqué',
            'epaisseur', 1.0,
            'poidsmetre', 0.8,
            'section', 56,
            'debitEvacuation', 180,
            'fixation', 'Crochets aluminium',
            'entraxeCrochets', 600,
            'joints', 'À emboîtement + mastic',
            'norme', 'EN 612'
        ),
        societe_id, current_date, current_date
    );

    RAISE NOTICE 'Injection des éléments bardage/couverture terminée avec succès !';
    
END $$;

-- Statistiques finales
SELECT 
    sous_famille,
    COUNT(*) as nombre_articles,
    ROUND(AVG(prix_vente_ht), 2) as prix_moyen,
    ROUND(MIN(prix_vente_ht), 2) as prix_min,
    ROUND(MAX(prix_vente_ht), 2) as prix_max
FROM articles 
WHERE famille = 'COUVERTURE_BARDAGE'
GROUP BY sous_famille
ORDER BY sous_famille;

-- Résumé par famille
SELECT 
    famille,
    COUNT(*) as total_articles,
    ROUND(SUM(CASE WHEN unite_stock = 'M2' THEN prix_vente_ht ELSE 0 END) / 
          NULLIF(SUM(CASE WHEN unite_stock = 'M2' THEN 1 ELSE 0 END), 0), 2) as prix_moyen_m2,
    ROUND(SUM(CASE WHEN unite_stock = 'ML' THEN prix_vente_ht ELSE 0 END) / 
          NULLIF(SUM(CASE WHEN unite_stock = 'ML' THEN 1 ELSE 0 END), 0), 2) as prix_moyen_ml
FROM articles 
WHERE famille = 'COUVERTURE_BARDAGE'
GROUP BY famille;

RAISE NOTICE 'Articles bardage/couverture créés : Bacs acier, Panneaux sandwich, Fibrociment, Accessoires';
RAISE NOTICE 'Total des références injectées dans la famille COUVERTURE_BARDAGE';