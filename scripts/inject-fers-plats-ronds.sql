-- Script SQL pour l'injection des fers plats et fers ronds dans la table articles
-- Génère toutes les combinaisons spécifiées avec calculs de caractéristiques techniques
-- Auteur: Claude Code
-- Date: 2025-08-02

-- ============================================================================
-- CONSTANTES ET VARIABLES
-- ============================================================================

DO $$
DECLARE
    societe_id UUID;
    densite_acier CONSTANT NUMERIC := 7.85; -- kg/dm³
    pi CONSTANT NUMERIC := 3.14159265359;
    
    -- Variables pour les prix selon matériaux
    prix_s235jr NUMERIC := 1.20; -- €/kg
    prix_s275jr NUMERIC := 1.35; -- €/kg  
    prix_s355jr NUMERIC := 1.55; -- €/kg
    prix_304l NUMERIC := 8.50;   -- €/kg (inox)
    prix_316l NUMERIC := 12.00;  -- €/kg (inox)
    
    -- Variables de calcul
    diametre_mm NUMERIC;
    largeur_mm NUMERIC;
    epaisseur_mm NUMERIC;
    section_cm2 NUMERIC;
    poids_kg_m NUMERIC;
    moment_inertie_cm4 NUMERIC;
    module_resistance_cm3 NUMERIC;
    prix_base NUMERIC;
    prix_achat NUMERIC;
    prix_vente NUMERIC;
    
    -- Tableaux des dimensions
    diametres_ronds INTEGER[] := ARRAY[6,8,10,12,14,16,18,20,22,25,28,30,32,35,40,45,50,60,70,80,90,100];
    materiaux_acier TEXT[] := ARRAY['S235JR', 'S275JR', 'S355JR'];
    materiaux_inox TEXT[] := ARRAY['304L', '316L'];
    longueurs INTEGER[] := ARRAY[6, 12];
    
    -- Dimensions fers plats (largeur x épaisseur)
    dimensions_plats TEXT[] := ARRAY[
        '20x3','25x3','30x3','30x4','30x5',
        '40x3','40x4','40x5','40x6','40x8','40x10',
        '50x3','50x4','50x5','50x6','50x8','50x10','50x12',
        '60x5','60x6','60x8','60x10','60x12','60x15',
        '80x6','80x8','80x10','80x12','80x15','80x20',
        '100x6','100x8','100x10','100x12','100x15','100x20','100x25',
        '120x8','120x10','120x12','120x15','120x20','120x25',
        '150x10','150x12','150x15','150x20','150x25','150x30',
        '200x10','200x15','200x20','200x25','200x30'
    ];
    
    materiau TEXT;
    dimension TEXT;
    dimension_parts TEXT[];
    
BEGIN
    -- Récupération de l'ID de la première société
    SELECT id INTO societe_id FROM societes LIMIT 1;
    
    -- Vérification que la société existe
    IF societe_id IS NULL THEN
        RAISE EXCEPTION 'Aucune société trouvée. Veuillez créer une société avant d''insérer les articles.';
    END IF;

    RAISE NOTICE 'Début de l''injection des fers plats et ronds...';

-- ============================================================================
-- 1. FERS RONDS (barres rondes pleines)
-- ============================================================================

    RAISE NOTICE 'Injection des fers ronds...';

    -- Fers ronds en acier (S235JR, S275JR, S355JR)
    FOREACH diametre_mm IN ARRAY diametres_ronds
    LOOP
        FOREACH materiau IN ARRAY materiaux_acier
        LOOP
            -- Calculs des caractéristiques
            section_cm2 := pi * POWER(diametre_mm/20.0, 2); -- section en cm²
            poids_kg_m := section_cm2 * densite_acier / 10; -- poids en kg/m
            moment_inertie_cm4 := pi * POWER(diametre_mm/20.0, 4) / 4; -- moment d'inertie en cm⁴
            module_resistance_cm3 := moment_inertie_cm4 / (diametre_mm/20.0); -- module de résistance en cm³
            
            -- Prix selon matériau
            prix_base := CASE materiau
                WHEN 'S235JR' THEN prix_s235jr
                WHEN 'S275JR' THEN prix_s275jr
                WHEN 'S355JR' THEN prix_s355jr
            END;
            
            prix_achat := prix_base * poids_kg_m;
            prix_vente := prix_achat * 1.35; -- marge de 35%

            INSERT INTO articles (
                id, reference, designation, description, type, status, famille, sous_famille,
                unite_stock, unite_achat, unite_vente, coefficient_achat, coefficient_vente,
                gere_en_stock, stock_mini, stock_maxi, stock_securite,
                prix_achat_standard, prix_vente_standard, taux_tva,
                poids_unitaire, longueur_standard,
                societe_id, caracteristiques_techniques, created_at, updated_at
            ) VALUES (
                gen_random_uuid(),
                'FER-RD-' || diametre_mm || '-' || materiau,
                'Fer rond Ø' || diametre_mm || 'mm ' || materiau,
                'Barre ronde pleine acier ' || materiau || ' diamètre ' || diametre_mm || 'mm - Longueurs 6m et 12m disponibles',
                'MATIERE_PREMIERE',
                'ACTIF',
                'ACIERS_LONGS',
                'FER_ROND',
                'M', 'M', 'M', 1.0, 1.0,
                true, 50, 500, 100,
                ROUND(prix_achat::numeric, 3),
                ROUND(prix_vente::numeric, 3),
                20.0,
                ROUND(poids_kg_m::numeric, 3),
                6.0,
                societe_id,
                jsonb_build_object(
                    'diametre', diametre_mm,
                    'section_cm2', ROUND(section_cm2::numeric, 2),
                    'poids_lineique_kg_m', ROUND(poids_kg_m::numeric, 3),
                    'moment_inertie_cm4', ROUND(moment_inertie_cm4::numeric, 2),
                    'module_resistance_cm3', ROUND(module_resistance_cm3::numeric, 2),
                    'rayon_giration_cm', ROUND((diametre_mm/40.0)::numeric, 2),
                    'materiau', materiau,
                    'norme', 'EN 10025-2',
                    'longueurs_standard', ARRAY[6, 12],
                    'applications', ARRAY[
                        'Construction métallique',
                        'Charpente légère', 
                        'Barres de liaison',
                        'Éléments de renfort',
                        'Axes et pivots'
                    ],
                    'tolérances_dimensionnelles', 'EN 10060',
                    'limite_elastique_mpa', CASE materiau
                        WHEN 'S235JR' THEN 235
                        WHEN 'S275JR' THEN 275  
                        WHEN 'S355JR' THEN 355
                    END,
                    'resistance_traction_mpa', CASE materiau
                        WHEN 'S235JR' THEN 360
                        WHEN 'S275JR' THEN 430
                        WHEN 'S355JR' THEN 510
                    END
                ),
                NOW(),
                NOW()
            );
        END LOOP;
    END LOOP;

    -- Fers ronds en inox (304L, 316L)
    FOREACH diametre_mm IN ARRAY diametres_ronds
    LOOP
        FOREACH materiau IN ARRAY materiaux_inox
        LOOP
            -- Calculs des caractéristiques (densité inox = 8.0 kg/dm³)
            section_cm2 := pi * POWER(diametre_mm/20.0, 2);
            poids_kg_m := section_cm2 * 8.0 / 10; -- densité inox
            moment_inertie_cm4 := pi * POWER(diametre_mm/20.0, 4) / 4;
            module_resistance_cm3 := moment_inertie_cm4 / (diametre_mm/20.0);
            
            -- Prix selon matériau inox
            prix_base := CASE materiau
                WHEN '304L' THEN prix_304l
                WHEN '316L' THEN prix_316l
            END;
            
            prix_achat := prix_base * poids_kg_m;
            prix_vente := prix_achat * 1.25; -- marge de 25% pour inox

            INSERT INTO articles (
                id, reference, designation, description, type, status, famille, sous_famille,
                unite_stock, unite_achat, unite_vente, coefficient_achat, coefficient_vente,
                gere_en_stock, stock_mini, stock_maxi, stock_securite,
                prix_achat_standard, prix_vente_standard, taux_tva,
                poids_unitaire, longueur_standard,
                societe_id, caracteristiques_techniques, created_at, updated_at
            ) VALUES (
                gen_random_uuid(),
                'FER-RD-' || diametre_mm || '-' || materiau,
                'Fer rond inox Ø' || diametre_mm || 'mm ' || materiau,
                'Barre ronde pleine inox ' || materiau || ' diamètre ' || diametre_mm || 'mm - Finition brossée',
                'MATIERE_PREMIERE',
                'ACTIF',
                'ACIERS_LONGS',
                'FER_ROND',
                'M', 'M', 'M', 1.0, 1.0,
                true, 20, 200, 50,
                ROUND(prix_achat::numeric, 3),
                ROUND(prix_vente::numeric, 3),
                20.0,
                ROUND(poids_kg_m::numeric, 3),
                6.0,
                societe_id,
                jsonb_build_object(
                    'diametre', diametre_mm,
                    'section_cm2', ROUND(section_cm2::numeric, 2),
                    'poids_lineique_kg_m', ROUND(poids_kg_m::numeric, 3),
                    'moment_inertie_cm4', ROUND(moment_inertie_cm4::numeric, 2),
                    'module_resistance_cm3', ROUND(module_resistance_cm3::numeric, 2),
                    'rayon_giration_cm', ROUND((diametre_mm/40.0)::numeric, 2),
                    'materiau', materiau,
                    'norme', 'EN 10088-3',
                    'longueurs_standard', ARRAY[6, 12],
                    'finition', 'Brossée',
                    'applications', ARRAY[
                        'Industrie alimentaire',
                        'Industrie chimique',
                        'Secteur médical',
                        'Construction navale',
                        'Éléments décoratifs'
                    ],
                    'resistance_corrosion', 'Excellente',
                    'limite_elastique_mpa', CASE materiau
                        WHEN '304L' THEN 210
                        WHEN '316L' THEN 220
                    END,
                    'resistance_traction_mpa', CASE materiau
                        WHEN '304L' THEN 520
                        WHEN '316L' THEN 540
                    END
                ),
                NOW(),
                NOW()
            );
        END LOOP;
    END LOOP;

-- ============================================================================
-- 2. FERS PLATS (barres plates)
-- ============================================================================

    RAISE NOTICE 'Injection des fers plats...';

    -- Fers plats en acier uniquement (S235JR, S275JR, S355JR)
    FOREACH dimension IN ARRAY dimensions_plats
    LOOP
        -- Extraction des dimensions (largeur x épaisseur)
        dimension_parts := string_to_array(dimension, 'x');
        largeur_mm := dimension_parts[1]::NUMERIC;
        epaisseur_mm := dimension_parts[2]::NUMERIC;
        
        FOREACH materiau IN ARRAY materiaux_acier
        LOOP
            -- Calculs des caractéristiques
            section_cm2 := (largeur_mm * epaisseur_mm) / 100; -- section en cm²
            poids_kg_m := section_cm2 * densite_acier / 10; -- poids en kg/m
            
            -- Moment d'inertie selon axe fort (axe perpendiculaire à l'épaisseur)
            moment_inertie_cm4 := (largeur_mm/10) * POWER(epaisseur_mm/10, 3) / 12; -- en cm⁴
            module_resistance_cm3 := moment_inertie_cm4 / (epaisseur_mm/20); -- en cm³
            
            -- Prix selon matériau
            prix_base := CASE materiau
                WHEN 'S235JR' THEN prix_s235jr
                WHEN 'S275JR' THEN prix_s275jr
                WHEN 'S355JR' THEN prix_s355jr
            END;
            
            prix_achat := prix_base * poids_kg_m;
            prix_vente := prix_achat * 1.35; -- marge de 35%

            INSERT INTO articles (
                id, reference, designation, description, type, status, famille, sous_famille,
                unite_stock, unite_achat, unite_vente, coefficient_achat, coefficient_vente,
                gere_en_stock, stock_mini, stock_maxi, stock_securite,
                prix_achat_standard, prix_vente_standard, taux_tva,
                poids_unitaire, longueur_standard,
                societe_id, caracteristiques_techniques, created_at, updated_at
            ) VALUES (
                gen_random_uuid(),
                'FER-PL-' || dimension || '-' || materiau,
                'Fer plat ' || dimension || 'mm ' || materiau,
                'Barre plate acier ' || materiau || ' section ' || dimension || 'mm - Longueurs 6m et 12m disponibles',
                'MATIERE_PREMIERE',
                'ACTIF',
                'ACIERS_LONGS',
                'FER_PLAT',
                'M', 'M', 'M', 1.0, 1.0,
                true, 50, 500, 100,
                ROUND(prix_achat::numeric, 3),
                ROUND(prix_vente::numeric, 3),
                20.0,
                ROUND(poids_kg_m::numeric, 3),
                6.0,
                societe_id,
                jsonb_build_object(
                    'largeur', largeur_mm,
                    'epaisseur', epaisseur_mm,
                    'section_cm2', ROUND(section_cm2::numeric, 2),
                    'poids_lineique_kg_m', ROUND(poids_kg_m::numeric, 3),
                    'moment_inertie_axe_fort_cm4', ROUND(moment_inertie_cm4::numeric, 2),
                    'moment_inertie_axe_faible_cm4', ROUND(((epaisseur_mm/10) * POWER(largeur_mm/10, 3) / 12)::numeric, 2),
                    'module_resistance_axe_fort_cm3', ROUND(module_resistance_cm3::numeric, 2),
                    'module_resistance_axe_faible_cm3', ROUND(((epaisseur_mm/10) * POWER(largeur_mm/10, 2) / 6)::numeric, 2),
                    'rayon_giration_axe_fort_cm', ROUND((SQRT(moment_inertie_cm4 / section_cm2))::numeric, 2),
                    'rayon_giration_axe_faible_cm', ROUND((SQRT(((epaisseur_mm/10) * POWER(largeur_mm/10, 3) / 12) / section_cm2))::numeric, 2),
                    'materiau', materiau,
                    'norme', 'EN 10025-2',
                    'longueurs_standard', ARRAY[6, 12],
                    'applications', ARRAY[
                        'Ossatures métalliques',
                        'Éléments de liaison',
                        'Platines de fixation', 
                        'Cornières de renfort',
                        'Ferrures diverses',
                        'Charpente légère'
                    ],
                    'tolérances_dimensionnelles', 'EN 10058',
                    'limite_elastique_mpa', CASE materiau
                        WHEN 'S235JR' THEN 235
                        WHEN 'S275JR' THEN 275
                        WHEN 'S355JR' THEN 355
                    END,
                    'resistance_traction_mpa', CASE materiau
                        WHEN 'S235JR' THEN 360
                        WHEN 'S275JR' THEN 430
                        WHEN 'S355JR' THEN 510
                    END,
                    'surface_par_metre_m2', ROUND((2 * (largeur_mm + epaisseur_mm) / 1000)::numeric, 4)
                ),
                NOW(),
                NOW()
            );
        END LOOP;
    END LOOP;

    RAISE NOTICE 'Injection terminée !';

END $$;

-- ============================================================================
-- STATISTIQUES ET RÉSUMÉ
-- ============================================================================

-- Affichage du résumé par sous-famille
SELECT 
    sous_famille,
    COUNT(*) as nombre_articles,
    ROUND(AVG(prix_achat_standard), 2) as prix_achat_moyen,
    ROUND(MIN(prix_achat_standard), 2) as prix_achat_min,
    ROUND(MAX(prix_achat_standard), 2) as prix_achat_max,
    ROUND(AVG(poids_unitaire), 3) as poids_moyen_kg_m
FROM articles 
WHERE famille = 'ACIERS_LONGS' 
  AND sous_famille IN ('FER_ROND', 'FER_PLAT')
GROUP BY sous_famille
ORDER BY sous_famille;

-- Affichage du résumé par matériau
SELECT 
    (caracteristiques_techniques->>'materiau') as materiau,
    sous_famille,
    COUNT(*) as nombre_articles,
    ROUND(AVG(prix_achat_standard), 2) as prix_achat_moyen
FROM articles 
WHERE famille = 'ACIERS_LONGS' 
  AND sous_famille IN ('FER_ROND', 'FER_PLAT')
GROUP BY (caracteristiques_techniques->>'materiau'), sous_famille
ORDER BY materiau, sous_famille;

-- Vérification des diamètres/dimensions uniques
SELECT 
    'FERS RONDS' as type,
    COUNT(DISTINCT (caracteristiques_techniques->>'diametre')::integer) as dimensions_distinctes,
    array_agg(DISTINCT (caracteristiques_techniques->>'diametre')::integer ORDER BY (caracteristiques_techniques->>'diametre')::integer) as liste_dimensions
FROM articles 
WHERE sous_famille = 'FER_ROND'

UNION ALL

SELECT 
    'FERS PLATS' as type,
    COUNT(DISTINCT CONCAT(caracteristiques_techniques->>'largeur', 'x', caracteristiques_techniques->>'epaisseur')) as dimensions_distinctes,
    array_agg(DISTINCT CONCAT(caracteristiques_techniques->>'largeur', 'x', caracteristiques_techniques->>'epaisseur') ORDER BY CONCAT(caracteristiques_techniques->>'largeur', 'x', caracteristiques_techniques->>'epaisseur')) as liste_dimensions
FROM articles 
WHERE sous_famille = 'FER_PLAT';

-- Message de fin
SELECT 'Script d''injection des fers plats et ronds terminé avec succès !' as message;

-- Total d'articles ajoutés
SELECT CONCAT('Total d''articles fers ajoutés: ', COUNT(*)) as total_ajoute 
FROM articles 
WHERE famille = 'ACIERS_LONGS' 
  AND sous_famille IN ('FER_ROND', 'FER_PLAT');

-- Exemples d'articles créés
SELECT 
    reference,
    designation,
    ROUND(prix_achat_standard, 2) as prix_achat_eur_m,
    ROUND(poids_unitaire, 3) as poids_kg_m,
    caracteristiques_techniques->>'section_cm2' as section_cm2
FROM articles 
WHERE famille = 'ACIERS_LONGS' 
  AND sous_famille IN ('FER_ROND', 'FER_PLAT')
ORDER BY sous_famille, reference
LIMIT 10;