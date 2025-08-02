-- Script SQL pour l'injection des tubes métalliques dans la table articles
-- Génère les principales combinaisons de tubes ronds, carrés et rectangulaires
-- Auteur: Claude Code
-- Date: 2025-08-02

-- Début de la transaction
BEGIN;

-- ============================================================================
-- 1. TUBES RONDS
-- ============================================================================

-- Tubes ronds S235JR (acier de construction standard)
INSERT INTO articles (
    reference, designation, description, type, status, famille, sous_famille,
    unite_stock, unite_achat, unite_vente, coefficient_achat, coefficient_vente,
    gere_en_stock, stock_mini, stock_maxi, stock_securite,
    prix_achat_standard, prix_vente_ht, taux_tva, taux_marge,
    poids, longueur, caracteristiques_techniques,
    created_at, updated_at
) VALUES

-- Tubes ronds Ø20mm S235JR
('TUBE-RD-20x2.0-S235JR', 'Tube rond Ø20x2.0 S235JR', 'Tube rond acier Ø20mm épaisseur 2.0mm en S235JR', 'MATIERE_PREMIERE', 'ACTIF', 'TUBES_PROFILES', 'TUBE_ROND', 'M', 'M', 'M', 1.0, 1.0, true, 10, 100, 5, 4.50, 6.20, 20.0, 25.0, 0.943, 20.0, 
 '{"materiau": "S235JR", "diametre_ext": 20, "epaisseur": 2.0, "section": 0.0943, "poids_par_metre": 0.943, "moment_inertie": 0.57, "module_section": 0.057, "norme": "EN 10219-1"}', NOW(), NOW()),

('TUBE-RD-20x2.5-S235JR', 'Tube rond Ø20x2.5 S235JR', 'Tube rond acier Ø20mm épaisseur 2.5mm en S235JR', 'MATIERE_PREMIERE', 'ACTIF', 'TUBES_PROFILES', 'TUBE_ROND', 'M', 'M', 'M', 1.0, 1.0, true, 10, 100, 5, 5.40, 7.40, 20.0, 25.0, 1.155, 20.0,
 '{"materiau": "S235JR", "diametre_ext": 20, "epaisseur": 2.5, "section": 0.1155, "poids_par_metre": 1.155, "moment_inertie": 0.65, "module_section": 0.065, "norme": "EN 10219-1"}', NOW(), NOW()),

-- Tubes ronds Ø25mm S235JR
('TUBE-RD-25x2.0-S235JR', 'Tube rond Ø25x2.0 S235JR', 'Tube rond acier Ø25mm épaisseur 2.0mm en S235JR', 'MATIERE_PREMIERE', 'ACTIF', 'TUBES_PROFILES', 'TUBE_ROND', 'M', 'M', 'M', 1.0, 1.0, true, 10, 100, 5, 5.20, 7.15, 20.0, 25.0, 1.208, 25.0,
 '{"materiau": "S235JR", "diametre_ext": 25, "epaisseur": 2.0, "section": 0.1208, "poids_par_metre": 1.208, "moment_inertie": 1.23, "module_section": 0.098, "norme": "EN 10219-1"}', NOW(), NOW()),

('TUBE-RD-25x2.5-S235JR', 'Tube rond Ø25x2.5 S235JR', 'Tube rond acier Ø25mm épaisseur 2.5mm en S235JR', 'MATIERE_PREMIERE', 'ACTIF', 'TUBES_PROFILES', 'TUBE_ROND', 'M', 'M', 'M', 1.0, 1.0, true, 10, 100, 5, 6.20, 8.55, 20.0, 25.0, 1.473, 25.0,
 '{"materiau": "S235JR", "diametre_ext": 25, "epaisseur": 2.5, "section": 0.1473, "poids_par_metre": 1.473, "moment_inertie": 1.42, "module_section": 0.114, "norme": "EN 10219-1"}', NOW(), NOW()),

-- Tubes ronds Ø30mm S235JR
('TUBE-RD-30x2.0-S235JR', 'Tube rond Ø30x2.0 S235JR', 'Tube rond acier Ø30mm épaisseur 2.0mm en S235JR', 'MATIERE_PREMIERE', 'ACTIF', 'TUBES_PROFILES', 'TUBE_ROND', 'M', 'M', 'M', 1.0, 1.0, true, 10, 100, 5, 6.10, 8.40, 20.0, 25.0, 1.473, 30.0,
 '{"materiau": "S235JR", "diametre_ext": 30, "epaisseur": 2.0, "section": 0.1473, "poids_par_metre": 1.473, "moment_inertie": 2.41, "module_section": 0.161, "norme": "EN 10219-1"}', NOW(), NOW()),

('TUBE-RD-30x3.0-S235JR', 'Tube rond Ø30x3.0 S235JR', 'Tube rond acier Ø30mm épaisseur 3.0mm en S235JR', 'MATIERE_PREMIERE', 'ACTIF', 'TUBES_PROFILES', 'TUBE_ROND', 'M', 'M', 'M', 1.0, 1.0, true, 10, 100, 5, 8.70, 12.00, 20.0, 25.0, 2.14, 30.0,
 '{"materiau": "S235JR", "diametre_ext": 30, "epaisseur": 3.0, "section": 0.214, "poids_par_metre": 2.14, "moment_inertie": 3.32, "module_section": 0.221, "norme": "EN 10219-1"}', NOW(), NOW()),

-- Tubes ronds Ø42.4mm S235JR (dimension standard)
('TUBE-RD-42.4x2.6-S235JR', 'Tube rond Ø42.4x2.6 S235JR', 'Tube rond acier Ø42.4mm épaisseur 2.6mm en S235JR', 'MATIERE_PREMIERE', 'ACTIF', 'TUBES_PROFILES', 'TUBE_ROND', 'M', 'M', 'M', 1.0, 1.0, true, 10, 100, 5, 11.50, 15.85, 20.0, 25.0, 2.72, 42.4,
 '{"materiau": "S235JR", "diametre_ext": 42.4, "epaisseur": 2.6, "section": 0.272, "poids_par_metre": 2.72, "moment_inertie": 8.96, "module_section": 0.423, "norme": "EN 10219-1"}', NOW(), NOW()),

('TUBE-RD-42.4x3.2-S235JR', 'Tube rond Ø42.4x3.2 S235JR', 'Tube rond acier Ø42.4mm épaisseur 3.2mm en S235JR', 'MATIERE_PREMIERE', 'ACTIF', 'TUBES_PROFILES', 'TUBE_ROND', 'M', 'M', 'M', 1.0, 1.0, true, 10, 100, 5, 13.80, 19.05, 20.0, 25.0, 3.27, 42.4,
 '{"materiau": "S235JR", "diametre_ext": 42.4, "epaisseur": 3.2, "section": 0.327, "poids_par_metre": 3.27, "moment_inertie": 10.5, "module_section": 0.495, "norme": "EN 10219-1"}', NOW(), NOW()),

-- Tubes ronds Ø48.3mm S235JR (dimension standard)
('TUBE-RD-48.3x3.0-S235JR', 'Tube rond Ø48.3x3.0 S235JR', 'Tube rond acier Ø48.3mm épaisseur 3.0mm en S235JR', 'MATIERE_PREMIERE', 'ACTIF', 'TUBES_PROFILES', 'TUBE_ROND', 'M', 'M', 'M', 1.0, 1.0, true, 10, 100, 5, 14.20, 19.60, 20.0, 25.0, 3.58, 48.3,
 '{"materiau": "S235JR", "diametre_ext": 48.3, "epaisseur": 3.0, "section": 0.358, "poids_par_metre": 3.58, "moment_inertie": 14.8, "module_section": 0.613, "norme": "EN 10219-1"}', NOW(), NOW()),

('TUBE-RD-48.3x4.0-S235JR', 'Tube rond Ø48.3x4.0 S235JR', 'Tube rond acier Ø48.3mm épaisseur 4.0mm en S235JR', 'MATIERE_PREMIERE', 'ACTIF', 'TUBES_PROFILES', 'TUBE_ROND', 'M', 'M', 'M', 1.0, 1.0, true, 10, 100, 5, 18.20, 25.10, 20.0, 25.0, 4.63, 48.3,
 '{"materiau": "S235JR", "diametre_ext": 48.3, "epaisseur": 4.0, "section": 0.463, "poids_par_metre": 4.63, "moment_inertie": 18.5, "module_section": 0.766, "norme": "EN 10219-1"}', NOW(), NOW()),

-- Tubes ronds Ø60.3mm S235JR (dimension standard)
('TUBE-RD-60.3x3.0-S235JR', 'Tube rond Ø60.3x3.0 S235JR', 'Tube rond acier Ø60.3mm épaisseur 3.0mm en S235JR', 'MATIERE_PREMIERE', 'ACTIF', 'TUBES_PROFILES', 'TUBE_ROND', 'M', 'M', 'M', 1.0, 1.0, true, 10, 100, 5, 17.50, 24.15, 20.0, 25.0, 4.52, 60.3,
 '{"materiau": "S235JR", "diametre_ext": 60.3, "epaisseur": 3.0, "section": 0.452, "poids_par_metre": 4.52, "moment_inertie": 29.5, "module_section": 0.978, "norme": "EN 10219-1"}', NOW(), NOW()),

('TUBE-RD-60.3x5.0-S235JR', 'Tube rond Ø60.3x5.0 S235JR', 'Tube rond acier Ø60.3mm épaisseur 5.0mm en S235JR', 'MATIERE_PREMIERE', 'ACTIF', 'TUBES_PROFILES', 'TUBE_ROND', 'M', 'M', 'M', 1.0, 1.0, true, 10, 100, 5, 27.80, 38.35, 20.0, 25.0, 7.24, 60.3,
 '{"materiau": "S235JR", "diametre_ext": 60.3, "epaisseur": 5.0, "section": 0.724, "poids_par_metre": 7.24, "moment_inertie": 45.8, "module_section": 1.518, "norme": "EN 10219-1"}', NOW(), NOW()),

-- Tubes ronds Ø76.1mm S235JR (dimension standard)
('TUBE-RD-76.1x3.0-S235JR', 'Tube rond Ø76.1x3.0 S235JR', 'Tube rond acier Ø76.1mm épaisseur 3.0mm en S235JR', 'MATIERE_PREMIERE', 'ACTIF', 'TUBES_PROFILES', 'TUBE_ROND', 'M', 'M', 'M', 1.0, 1.0, true, 10, 100, 5, 22.10, 30.50, 20.0, 25.0, 5.75, 76.1,
 '{"materiau": "S235JR", "diametre_ext": 76.1, "epaisseur": 3.0, "section": 0.575, "poids_par_metre": 5.75, "moment_inertie": 59.7, "module_section": 1.568, "norme": "EN 10219-1"}', NOW(), NOW()),

('TUBE-RD-76.1x5.0-S235JR', 'Tube rond Ø76.1x5.0 S235JR', 'Tube rond acier Ø76.1mm épaisseur 5.0mm en S235JR', 'MATIERE_PREMIERE', 'ACTIF', 'TUBES_PROFILES', 'TUBE_ROND', 'M', 'M', 'M', 1.0, 1.0, true, 10, 100, 5, 35.20, 48.60, 20.0, 25.0, 9.24, 76.1,
 '{"materiau": "S235JR", "diametre_ext": 76.1, "epaisseur": 5.0, "section": 0.924, "poids_par_metre": 9.24, "moment_inertie": 92.8, "module_section": 2.44, "norme": "EN 10219-1"}', NOW(), NOW()),

-- Tubes ronds Ø88.9mm S235JR (dimension standard)
('TUBE-RD-88.9x4.0-S235JR', 'Tube rond Ø88.9x4.0 S235JR', 'Tube rond acier Ø88.9mm épaisseur 4.0mm en S235JR', 'MATIERE_PREMIERE', 'ACTIF', 'TUBES_PROFILES', 'TUBE_ROND', 'M', 'M', 'M', 1.0, 1.0, true, 10, 100, 5, 32.50, 44.85, 20.0, 25.0, 8.55, 88.9,
 '{"materiau": "S235JR", "diametre_ext": 88.9, "epaisseur": 4.0, "section": 0.855, "poids_par_metre": 8.55, "moment_inertie": 113.2, "module_section": 2.547, "norme": "EN 10219-1"}', NOW(), NOW()),

('TUBE-RD-88.9x6.0-S235JR', 'Tube rond Ø88.9x6.0 S235JR', 'Tube rond acier Ø88.9mm épaisseur 6.0mm en S235JR', 'MATIERE_PREMIERE', 'ACTIF', 'TUBES_PROFILES', 'TUBE_ROND', 'M', 'M', 'M', 1.0, 1.0, true, 10, 100, 5, 47.20, 65.15, 20.0, 25.0, 12.42, 88.9,
 '{"materiau": "S235JR", "diametre_ext": 88.9, "epaisseur": 6.0, "section": 1.242, "poids_par_metre": 12.42, "moment_inertie": 158.5, "module_section": 3.564, "norme": "EN 10219-1"}', NOW(), NOW()),

-- Tubes ronds Ø100mm S235JR
('TUBE-RD-100x4.0-S235JR', 'Tube rond Ø100x4.0 S235JR', 'Tube rond acier Ø100mm épaisseur 4.0mm en S235JR', 'MATIERE_PREMIERE', 'ACTIF', 'TUBES_PROFILES', 'TUBE_ROND', 'M', 'M', 'M', 1.0, 1.0, true, 10, 100, 5, 36.80, 50.85, 20.0, 25.0, 9.68, 100.0,
 '{"materiau": "S235JR", "diametre_ext": 100, "epaisseur": 4.0, "section": 0.968, "poids_par_metre": 9.68, "moment_inertie": 166.8, "module_section": 3.336, "norme": "EN 10219-1"}', NOW(), NOW()),

('TUBE-RD-100x6.0-S235JR', 'Tube rond Ø100x6.0 S235JR', 'Tube rond acier Ø100mm épaisseur 6.0mm en S235JR', 'MATIERE_PREMIERE', 'ACTIF', 'TUBES_PROFILES', 'TUBE_ROND', 'M', 'M', 'M', 1.0, 1.0, true, 10, 100, 5, 53.40, 73.70, 20.0, 25.0, 14.07, 100.0,
 '{"materiau": "S235JR", "diametre_ext": 100, "epaisseur": 6.0, "section": 1.407, "poids_par_metre": 14.07, "moment_inertie": 235.8, "module_section": 4.716, "norme": "EN 10219-1"}', NOW(), NOW()),

-- Tubes ronds Ø114.3mm S235JR (dimension standard)
('TUBE-RD-114.3x5.0-S235JR', 'Tube rond Ø114.3x5.0 S235JR', 'Tube rond acier Ø114.3mm épaisseur 5.0mm en S235JR', 'MATIERE_PREMIERE', 'ACTIF', 'TUBES_PROFILES', 'TUBE_ROND', 'M', 'M', 'M', 1.0, 1.0, true, 10, 100, 5, 52.50, 72.45, 20.0, 25.0, 13.82, 114.3,
 '{"materiau": "S235JR", "diametre_ext": 114.3, "epaisseur": 5.0, "section": 1.382, "poids_par_metre": 13.82, "moment_inertie": 365.2, "module_section": 6.389, "norme": "EN 10219-1"}', NOW(), NOW()),

('TUBE-RD-114.3x8.0-S235JR', 'Tube rond Ø114.3x8.0 S235JR', 'Tube rond acier Ø114.3mm épaisseur 8.0mm en S235JR', 'MATIERE_PREMIERE', 'ACTIF', 'TUBES_PROFILES', 'TUBE_ROND', 'M', 'M', 'M', 1.0, 1.0, true, 10, 100, 5, 81.20, 112.05, 20.0, 25.0, 21.36, 114.3,
 '{"materiau": "S235JR", "diametre_ext": 114.3, "epaisseur": 8.0, "section": 2.136, "poids_par_metre": 21.36, "moment_inertie": 551.8, "module_section": 9.655, "norme": "EN 10219-1"}', NOW(), NOW()),

-- Quelques tubes S355JR (acier haute résistance)
('TUBE-RD-60.3x4.0-S355JR', 'Tube rond Ø60.3x4.0 S355JR', 'Tube rond acier Ø60.3mm épaisseur 4.0mm en S355JR', 'MATIERE_PREMIERE', 'ACTIF', 'TUBES_PROFILES', 'TUBE_ROND', 'M', 'M', 'M', 1.0, 1.0, true, 10, 100, 5, 22.50, 31.05, 20.0, 25.0, 5.92, 60.3,
 '{"materiau": "S355JR", "diametre_ext": 60.3, "epaisseur": 4.0, "section": 0.592, "poids_par_metre": 5.92, "moment_inertie": 37.8, "module_section": 1.254, "norme": "EN 10219-1"}', NOW(), NOW()),

('TUBE-RD-88.9x5.0-S355JR', 'Tube rond Ø88.9x5.0 S355JR', 'Tube rond acier Ø88.9mm épaisseur 5.0mm en S355JR', 'MATIERE_PREMIERE', 'ACTIF', 'TUBES_PROFILES', 'TUBE_ROND', 'M', 'M', 'M', 1.0, 1.0, true, 10, 100, 5, 42.80, 59.05, 20.0, 25.0, 10.64, 88.9,
 '{"materiau": "S355JR", "diametre_ext": 88.9, "epaisseur": 5.0, "section": 1.064, "poids_par_metre": 10.64, "moment_inertie": 140.2, "module_section": 3.154, "norme": "EN 10219-1"}', NOW(), NOW()),

-- Quelques tubes inox 304L
('TUBE-RD-42.4x2.0-304L', 'Tube rond Ø42.4x2.0 304L', 'Tube rond inox Ø42.4mm épaisseur 2.0mm en 304L', 'MATIERE_PREMIERE', 'ACTIF', 'TUBES_PROFILES', 'TUBE_ROND', 'M', 'M', 'M', 1.0, 1.0, true, 5, 50, 3, 28.50, 39.35, 20.0, 25.0, 2.14, 42.4,
 '{"materiau": "304L", "diametre_ext": 42.4, "epaisseur": 2.0, "section": 0.214, "poids_par_metre": 2.14, "moment_inertie": 7.8, "module_section": 0.368, "norme": "EN 10357"}', NOW(), NOW()),

('TUBE-RD-48.3x2.0-304L', 'Tube rond Ø48.3x2.0 304L', 'Tube rond inox Ø48.3mm épaisseur 2.0mm en 304L', 'MATIERE_PREMIERE', 'ACTIF', 'TUBES_PROFILES', 'TUBE_ROND', 'M', 'M', 'M', 1.0, 1.0, true, 5, 50, 3, 32.40, 44.75, 20.0, 25.0, 2.44, 48.3,
 '{"materiau": "304L", "diametre_ext": 48.3, "epaisseur": 2.0, "section": 0.244, "poids_par_metre": 2.44, "moment_inertie": 11.8, "module_section": 0.488, "norme": "EN 10357"}', NOW(), NOW());

-- ============================================================================
-- 2. TUBES CARRÉS
-- ============================================================================

INSERT INTO articles (
    reference, designation, description, type, status, famille, sous_famille,
    unite_stock, unite_achat, unite_vente, coefficient_achat, coefficient_vente,
    gere_en_stock, stock_mini, stock_maxi, stock_securite,
    prix_achat_standard, prix_vente_ht, taux_tva, taux_marge,
    poids, longueur, largeur, hauteur, caracteristiques_techniques,
    created_at, updated_at
) VALUES

-- Tubes carrés 20x20mm S235JR
('TUBE-CA-20x20x2.0-S235JR', 'Tube carré 20x20x2.0 S235JR', 'Tube carré acier 20x20mm épaisseur 2.0mm en S235JR', 'MATIERE_PREMIERE', 'ACTIF', 'TUBES_PROFILES', 'TUBE_CARRE', 'M', 'M', 'M', 1.0, 1.0, true, 10, 100, 5, 4.80, 6.62, 20.0, 25.0, 1.19, 20.0, 20.0, 20.0,
 '{"materiau": "S235JR", "cote": 20, "epaisseur": 2.0, "section": 0.119, "poids_par_metre": 1.19, "moment_inertie_x": 0.47, "moment_inertie_y": 0.47, "module_section": 0.047, "norme": "EN 10219-2"}', NOW(), NOW()),

('TUBE-CA-20x20x2.5-S235JR', 'Tube carré 20x20x2.5 S235JR', 'Tube carré acier 20x20mm épaisseur 2.5mm en S235JR', 'MATIERE_PREMIERE', 'ACTIF', 'TUBES_PROFILES', 'TUBE_CARRE', 'M', 'M', 'M', 1.0, 1.0, true, 10, 100, 5, 5.70, 7.87, 20.0, 25.0, 1.42, 20.0, 20.0, 20.0,
 '{"materiau": "S235JR", "cote": 20, "epaisseur": 2.5, "section": 0.142, "poids_par_metre": 1.42, "moment_inertie_x": 0.53, "moment_inertie_y": 0.53, "module_section": 0.053, "norme": "EN 10219-2"}', NOW(), NOW()),

-- Tubes carrés 25x25mm S235JR
('TUBE-CA-25x25x2.0-S235JR', 'Tube carré 25x25x2.0 S235JR', 'Tube carré acier 25x25mm épaisseur 2.0mm en S235JR', 'MATIERE_PREMIERE', 'ACTIF', 'TUBES_PROFILES', 'TUBE_CARRE', 'M', 'M', 'M', 1.0, 1.0, true, 10, 100, 5, 5.90, 8.15, 20.0, 25.0, 1.49, 25.0, 25.0, 25.0,
 '{"materiau": "S235JR", "cote": 25, "epaisseur": 2.0, "section": 0.149, "poids_par_metre": 1.49, "moment_inertie_x": 0.95, "moment_inertie_y": 0.95, "module_section": 0.076, "norme": "EN 10219-2"}', NOW(), NOW()),

('TUBE-CA-25x25x3.0-S235JR', 'Tube carré 25x25x3.0 S235JR', 'Tube carré acier 25x25mm épaisseur 3.0mm en S235JR', 'MATIERE_PREMIERE', 'ACTIF', 'TUBES_PROFILES', 'TUBE_CARRE', 'M', 'M', 'M', 1.0, 1.0, true, 10, 100, 5, 8.20, 11.32, 20.0, 25.0, 2.10, 25.0, 25.0, 25.0,
 '{"materiau": "S235JR", "cote": 25, "epaisseur": 3.0, "section": 0.210, "poids_par_metre": 2.10, "moment_inertie_x": 1.25, "moment_inertie_y": 1.25, "module_section": 0.100, "norme": "EN 10219-2"}', NOW(), NOW()),

-- Tubes carrés 30x30mm S235JR
('TUBE-CA-30x30x2.0-S235JR', 'Tube carré 30x30x2.0 S235JR', 'Tube carré acier 30x30mm épaisseur 2.0mm en S235JR', 'MATIERE_PREMIERE', 'ACTIF', 'TUBES_PROFILES', 'TUBE_CARRE', 'M', 'M', 'M', 1.0, 1.0, true, 10, 100, 5, 7.10, 9.80, 20.0, 25.0, 1.79, 30.0, 30.0, 30.0,
 '{"materiau": "S235JR", "cote": 30, "epaisseur": 2.0, "section": 0.179, "poids_par_metre": 1.79, "moment_inertie_x": 1.74, "moment_inertie_y": 1.74, "module_section": 0.116, "norme": "EN 10219-2"}', NOW(), NOW()),

('TUBE-CA-30x30x3.0-S235JR', 'Tube carré 30x30x3.0 S235JR', 'Tube carré acier 30x30mm épaisseur 3.0mm en S235JR', 'MATIERE_PREMIERE', 'ACTIF', 'TUBES_PROFILES', 'TUBE_CARRE', 'M', 'M', 'M', 1.0, 1.0, true, 10, 100, 5, 10.20, 14.08, 20.0, 25.0, 2.55, 30.0, 30.0, 30.0,
 '{"materiau": "S235JR", "cote": 30, "epaisseur": 3.0, "section": 0.255, "poids_par_metre": 2.55, "moment_inertie_x": 2.35, "moment_inertie_y": 2.35, "module_section": 0.157, "norme": "EN 10219-2"}', NOW(), NOW()),

-- Tubes carrés 40x40mm S235JR
('TUBE-CA-40x40x2.0-S235JR', 'Tube carré 40x40x2.0 S235JR', 'Tube carré acier 40x40mm épaisseur 2.0mm en S235JR', 'MATIERE_PREMIERE', 'ACTIF', 'TUBES_PROFILES', 'TUBE_CARRE', 'M', 'M', 'M', 1.0, 1.0, true, 10, 100, 5, 9.40, 12.98, 20.0, 25.0, 2.39, 40.0, 40.0, 40.0,
 '{"materiau": "S235JR", "cote": 40, "epaisseur": 2.0, "section": 0.239, "poids_par_metre": 2.39, "moment_inertie_x": 4.23, "moment_inertie_y": 4.23, "module_section": 0.212, "norme": "EN 10219-2"}', NOW(), NOW()),

('TUBE-CA-40x40x3.0-S235JR', 'Tube carré 40x40x3.0 S235JR', 'Tube carré acier 40x40mm épaisseur 3.0mm en S235JR', 'MATIERE_PREMIERE', 'ACTIF', 'TUBES_PROFILES', 'TUBE_CARRE', 'M', 'M', 'M', 1.0, 1.0, true, 10, 100, 5, 13.50, 18.64, 20.0, 25.0, 3.45, 40.0, 40.0, 40.0,
 '{"materiau": "S235JR", "cote": 40, "epaisseur": 3.0, "section": 0.345, "poids_par_metre": 3.45, "moment_inertie_x": 5.89, "moment_inertie_y": 5.89, "module_section": 0.295, "norme": "EN 10219-2"}', NOW(), NOW()),

('TUBE-CA-40x40x4.0-S235JR', 'Tube carré 40x40x4.0 S235JR', 'Tube carré acier 40x40mm épaisseur 4.0mm en S235JR', 'MATIERE_PREMIERE', 'ACTIF', 'TUBES_PROFILES', 'TUBE_CARRE', 'M', 'M', 'M', 1.0, 1.0, true, 10, 100, 5, 17.20, 23.75, 20.0, 25.0, 4.42, 40.0, 40.0, 40.0,
 '{"materiau": "S235JR", "cote": 40, "epaisseur": 4.0, "section": 0.442, "poids_par_metre": 4.42, "moment_inertie_x": 7.38, "moment_inertie_y": 7.38, "module_section": 0.369, "norme": "EN 10219-2"}', NOW(), NOW()),

-- Tubes carrés 50x50mm S235JR
('TUBE-CA-50x50x3.0-S235JR', 'Tube carré 50x50x3.0 S235JR', 'Tube carré acier 50x50mm épaisseur 3.0mm en S235JR', 'MATIERE_PREMIERE', 'ACTIF', 'TUBES_PROFILES', 'TUBE_CARRE', 'M', 'M', 'M', 1.0, 1.0, true, 10, 100, 5, 16.80, 23.20, 20.0, 25.0, 4.35, 50.0, 50.0, 50.0,
 '{"materiau": "S235JR", "cote": 50, "epaisseur": 3.0, "section": 0.435, "poids_par_metre": 4.35, "moment_inertie_x": 11.7, "moment_inertie_y": 11.7, "module_section": 0.468, "norme": "EN 10219-2"}', NOW(), NOW()),

('TUBE-CA-50x50x4.0-S235JR', 'Tube carré 50x50x4.0 S235JR', 'Tube carré acier 50x50mm épaisseur 4.0mm en S235JR', 'MATIERE_PREMIERE', 'ACTIF', 'TUBES_PROFILES', 'TUBE_CARRE', 'M', 'M', 'M', 1.0, 1.0, true, 10, 100, 5, 21.50, 29.68, 20.0, 25.0, 5.62, 50.0, 50.0, 50.0,
 '{"materiau": "S235JR", "cote": 50, "epaisseur": 4.0, "section": 0.562, "poids_par_metre": 5.62, "moment_inertie_x": 14.8, "moment_inertie_y": 14.8, "module_section": 0.592, "norme": "EN 10219-2"}', NOW(), NOW()),

('TUBE-CA-50x50x5.0-S235JR', 'Tube carré 50x50x5.0 S235JR', 'Tube carré acier 50x50mm épaisseur 5.0mm en S235JR', 'MATIERE_PREMIERE', 'ACTIF', 'TUBES_PROFILES', 'TUBE_CARRE', 'M', 'M', 'M', 1.0, 1.0, true, 10, 100, 5, 26.20, 36.16, 20.0, 25.0, 6.79, 50.0, 50.0, 50.0,
 '{"materiau": "S235JR", "cote": 50, "epaisseur": 5.0, "section": 0.679, "poids_par_metre": 6.79, "moment_inertie_x": 17.5, "moment_inertie_y": 17.5, "module_section": 0.700, "norme": "EN 10219-2"}', NOW(), NOW()),

-- Tubes carrés 60x60mm S235JR
('TUBE-CA-60x60x4.0-S235JR', 'Tube carré 60x60x4.0 S235JR', 'Tube carré acier 60x60mm épaisseur 4.0mm en S235JR', 'MATIERE_PREMIERE', 'ACTIF', 'TUBES_PROFILES', 'TUBE_CARRE', 'M', 'M', 'M', 1.0, 1.0, true, 10, 100, 5, 25.80, 35.61, 20.0, 25.0, 6.82, 60.0, 60.0, 60.0,
 '{"materiau": "S235JR", "cote": 60, "epaisseur": 4.0, "section": 0.682, "poids_par_metre": 6.82, "moment_inertie_x": 26.1, "moment_inertie_y": 26.1, "module_section": 0.870, "norme": "EN 10219-2"}', NOW(), NOW()),

('TUBE-CA-60x60x5.0-S235JR', 'Tube carré 60x60x5.0 S235JR', 'Tube carré acier 60x60mm épaisseur 5.0mm en S235JR', 'MATIERE_PREMIERE', 'ACTIF', 'TUBES_PROFILES', 'TUBE_CARRE', 'M', 'M', 'M', 1.0, 1.0, true, 10, 100, 5, 31.50, 43.48, 20.0, 25.0, 8.19, 60.0, 60.0, 60.0,
 '{"materiau": "S235JR", "cote": 60, "epaisseur": 5.0, "section": 0.819, "poids_par_metre": 8.19, "moment_inertie_x": 31.4, "moment_inertie_y": 31.4, "module_section": 1.047, "norme": "EN 10219-2"}', NOW(), NOW()),

-- Tubes carrés 80x80mm S235JR
('TUBE-CA-80x80x4.0-S235JR', 'Tube carré 80x80x4.0 S235JR', 'Tube carré acier 80x80mm épaisseur 4.0mm en S235JR', 'MATIERE_PREMIERE', 'ACTIF', 'TUBES_PROFILES', 'TUBE_CARRE', 'M', 'M', 'M', 1.0, 1.0, true, 10, 100, 5, 34.20, 47.23, 20.0, 25.0, 9.02, 80.0, 80.0, 80.0,
 '{"materiau": "S235JR", "cote": 80, "epaisseur": 4.0, "section": 0.902, "poids_par_metre": 9.02, "moment_inertie_x": 66.8, "moment_inertie_y": 66.8, "module_section": 1.670, "norme": "EN 10219-2"}', NOW(), NOW()),

('TUBE-CA-80x80x6.0-S235JR', 'Tube carré 80x80x6.0 S235JR', 'Tube carré acier 80x80mm épaisseur 6.0mm en S235JR', 'MATIERE_PREMIERE', 'ACTIF', 'TUBES_PROFILES', 'TUBE_CARRE', 'M', 'M', 'M', 1.0, 1.0, true, 10, 100, 5, 49.50, 68.33, 20.0, 25.0, 12.99, 80.0, 80.0, 80.0,
 '{"materiau": "S235JR", "cote": 80, "epaisseur": 6.0, "section": 1.299, "poids_par_metre": 12.99, "moment_inertie_x": 94.5, "moment_inertie_y": 94.5, "module_section": 2.363, "norme": "EN 10219-2"}', NOW(), NOW()),

-- Tubes carrés 100x100mm S235JR
('TUBE-CA-100x100x5.0-S235JR', 'Tube carré 100x100x5.0 S235JR', 'Tube carré acier 100x100mm épaisseur 5.0mm en S235JR', 'MATIERE_PREMIERE', 'ACTIF', 'TUBES_PROFILES', 'TUBE_CARRE', 'M', 'M', 'M', 1.0, 1.0, true, 10, 100, 5, 55.20, 76.25, 20.0, 25.0, 14.59, 100.0, 100.0, 100.0,
 '{"materiau": "S235JR", "cote": 100, "epaisseur": 5.0, "section": 1.459, "poids_par_metre": 14.59, "moment_inertie_x": 173.5, "moment_inertie_y": 173.5, "module_section": 3.470, "norme": "EN 10219-2"}', NOW(), NOW()),

('TUBE-CA-100x100x6.0-S235JR', 'Tube carré 100x100x6.0 S235JR', 'Tube carré acier 100x100mm épaisseur 6.0mm en S235JR', 'MATIERE_PREMIERE', 'ACTIF', 'TUBES_PROFILES', 'TUBE_CARRE', 'M', 'M', 'M', 1.0, 1.0, true, 10, 100, 5, 65.40, 90.30, 20.0, 25.0, 17.19, 100.0, 100.0, 100.0,
 '{"materiau": "S235JR", "cote": 100, "epaisseur": 6.0, "section": 1.719, "poids_par_metre": 17.19, "moment_inertie_x": 204.2, "moment_inertie_y": 204.2, "module_section": 4.084, "norme": "EN 10219-2"}', NOW(), NOW()),

('TUBE-CA-100x100x8.0-S235JR', 'Tube carré 100x100x8.0 S235JR', 'Tube carré acier 100x100mm épaisseur 8.0mm en S235JR', 'MATIERE_PREMIERE', 'ACTIF', 'TUBES_PROFILES', 'TUBE_CARRE', 'M', 'M', 'M', 1.0, 1.0, true, 10, 100, 5, 84.20, 116.28, 20.0, 25.0, 22.19, 100.0, 100.0, 100.0,
 '{"materiau": "S235JR", "cote": 100, "epaisseur": 8.0, "section": 2.219, "poids_par_metre": 22.19, "moment_inertie_x": 261.2, "module_section": 5.224, "norme": "EN 10219-2"}', NOW(), NOW()),

-- Quelques tubes carrés S355JR
('TUBE-CA-60x60x6.0-S355JR', 'Tube carré 60x60x6.0 S355JR', 'Tube carré acier 60x60mm épaisseur 6.0mm en S355JR', 'MATIERE_PREMIERE', 'ACTIF', 'TUBES_PROFILES', 'TUBE_CARRE', 'M', 'M', 'M', 1.0, 1.0, true, 10, 100, 5, 38.50, 53.18, 20.0, 25.0, 9.45, 60.0, 60.0, 60.0,
 '{"materiau": "S355JR", "cote": 60, "epaisseur": 6.0, "section": 0.945, "poids_par_metre": 9.45, "moment_inertie_x": 35.8, "moment_inertie_y": 35.8, "module_section": 1.193, "norme": "EN 10219-2"}', NOW(), NOW()),

('TUBE-CA-80x80x5.0-S355JR', 'Tube carré 80x80x5.0 S355JR', 'Tube carré acier 80x80mm épaisseur 5.0mm en S355JR', 'MATIERE_PREMIERE', 'ACTIF', 'TUBES_PROFILES', 'TUBE_CARRE', 'M', 'M', 'M', 1.0, 1.0, true, 10, 100, 5, 48.20, 66.55, 20.0, 25.0, 11.79, 80.0, 80.0, 80.0,
 '{"materiau": "S355JR", "cote": 80, "epaisseur": 5.0, "section": 1.179, "poids_par_metre": 11.79, "moment_inertie_x": 83.2, "moment_inertie_y": 83.2, "module_section": 2.080, "norme": "EN 10219-2"}', NOW(), NOW());

-- ============================================================================
-- 3. TUBES RECTANGULAIRES
-- ============================================================================

INSERT INTO articles (
    reference, designation, description, type, status, famille, sous_famille,
    unite_stock, unite_achat, unite_vente, coefficient_achat, coefficient_vente,
    gere_en_stock, stock_mini, stock_maxi, stock_securite,
    prix_achat_standard, prix_vente_ht, taux_tva, taux_marge,
    poids, longueur, largeur, hauteur, caracteristiques_techniques,
    created_at, updated_at
) VALUES

-- Tubes rectangulaires 40x20mm S235JR
('TUBE-RE-40x20x2.0-S235JR', 'Tube rectangulaire 40x20x2.0 S235JR', 'Tube rectangulaire acier 40x20mm épaisseur 2.0mm en S235JR', 'MATIERE_PREMIERE', 'ACTIF', 'TUBES_PROFILES', 'TUBE_RECTANGULAIRE', 'M', 'M', 'M', 1.0, 1.0, true, 10, 100, 5, 6.80, 9.39, 20.0, 25.0, 1.79, 40.0, 20.0, 40.0,
 '{"materiau": "S235JR", "longueur": 40, "largeur": 20, "epaisseur": 2.0, "section": 0.179, "poids_par_metre": 1.79, "moment_inertie_x": 2.31, "moment_inertie_y": 0.77, "module_section_x": 0.116, "module_section_y": 0.077, "norme": "EN 10219-2"}', NOW(), NOW()),

('TUBE-RE-40x20x2.5-S235JR', 'Tube rectangulaire 40x20x2.5 S235JR', 'Tube rectangulaire acier 40x20mm épaisseur 2.5mm en S235JR', 'MATIERE_PREMIERE', 'ACTIF', 'TUBES_PROFILES', 'TUBE_RECTANGULAIRE', 'M', 'M', 'M', 1.0, 1.0, true, 10, 100, 5, 8.10, 11.18, 20.0, 25.0, 2.15, 40.0, 20.0, 40.0,
 '{"materiau": "S235JR", "longueur": 40, "largeur": 20, "epaisseur": 2.5, "section": 0.215, "poids_par_metre": 2.15, "moment_inertie_x": 2.68, "moment_inertie_y": 0.87, "module_section_x": 0.134, "module_section_y": 0.087, "norme": "EN 10219-2"}', NOW(), NOW()),

-- Tubes rectangulaires 50x25mm S235JR
('TUBE-RE-50x25x2.0-S235JR', 'Tube rectangulaire 50x25x2.0 S235JR', 'Tube rectangulaire acier 50x25mm épaisseur 2.0mm en S235JR', 'MATIERE_PREMIERE', 'ACTIF', 'TUBES_PROFILES', 'TUBE_RECTANGULAIRE', 'M', 'M', 'M', 1.0, 1.0, true, 10, 100, 5, 8.50, 11.74, 20.0, 25.0, 2.24, 50.0, 25.0, 50.0,
 '{"materiau": "S235JR", "longueur": 50, "largeur": 25, "epaisseur": 2.0, "section": 0.224, "poids_par_metre": 2.24, "moment_inertie_x": 4.58, "moment_inertie_y": 1.52, "module_section_x": 0.183, "module_section_y": 0.122, "norme": "EN 10219-2"}', NOW(), NOW()),

('TUBE-RE-50x25x3.0-S235JR', 'Tube rectangulaire 50x25x3.0 S235JR', 'Tube rectangulaire acier 50x25mm épaisseur 3.0mm en S235JR', 'MATIERE_PREMIERE', 'ACTIF', 'TUBES_PROFILES', 'TUBE_RECTANGULAIRE', 'M', 'M', 'M', 1.0, 1.0, true, 10, 100, 5, 12.20, 16.84, 20.0, 25.0, 3.22, 50.0, 25.0, 50.0,
 '{"materiau": "S235JR", "longueur": 50, "largeur": 25, "epaisseur": 3.0, "section": 0.322, "poids_par_metre": 3.22, "moment_inertie_x": 6.28, "moment_inertie_y": 2.02, "module_section_x": 0.251, "module_section_y": 0.162, "norme": "EN 10219-2"}', NOW(), NOW()),

-- Tubes rectangulaires 60x30mm S235JR
('TUBE-RE-60x30x3.0-S235JR', 'Tube rectangulaire 60x30x3.0 S235JR', 'Tube rectangulaire acier 60x30mm épaisseur 3.0mm en S235JR', 'MATIERE_PREMIERE', 'ACTIF', 'TUBES_PROFILES', 'TUBE_RECTANGULAIRE', 'M', 'M', 'M', 1.0, 1.0, true, 10, 100, 5, 14.60, 20.17, 20.0, 25.0, 3.87, 60.0, 30.0, 60.0,
 '{"materiau": "S235JR", "longueur": 60, "largeur": 30, "epaisseur": 3.0, "section": 0.387, "poids_par_metre": 3.87, "moment_inertie_x": 11.2, "moment_inertie_y": 4.12, "module_section_x": 0.373, "module_section_y": 0.275, "norme": "EN 10219-2"}', NOW(), NOW()),

('TUBE-RE-60x30x4.0-S235JR', 'Tube rectangulaire 60x30x4.0 S235JR', 'Tube rectangulaire acier 60x30mm épaisseur 4.0mm en S235JR', 'MATIERE_PREMIERE', 'ACTIF', 'TUBES_PROFILES', 'TUBE_RECTANGULAIRE', 'M', 'M', 'M', 1.0, 1.0, true, 10, 100, 5, 18.80, 25.95, 20.0, 25.0, 4.96, 60.0, 30.0, 60.0,
 '{"materiau": "S235JR", "longueur": 60, "largeur": 30, "epaisseur": 4.0, "section": 0.496, "poids_par_metre": 4.96, "moment_inertie_x": 14.2, "moment_inertie_y": 5.12, "module_section_x": 0.473, "module_section_y": 0.341, "norme": "EN 10219-2"}', NOW(), NOW()),

-- Tubes rectangulaires 80x40mm S235JR
('TUBE-RE-80x40x3.0-S235JR', 'Tube rectangulaire 80x40x3.0 S235JR', 'Tube rectangulaire acier 80x40mm épaisseur 3.0mm en S235JR', 'MATIERE_PREMIERE', 'ACTIF', 'TUBES_PROFILES', 'TUBE_RECTANGULAIRE', 'M', 'M', 'M', 1.0, 1.0, true, 10, 100, 5, 19.50, 26.93, 20.0, 25.0, 5.17, 80.0, 40.0, 80.0,
 '{"materiau": "S235JR", "longueur": 80, "largeur": 40, "epaisseur": 3.0, "section": 0.517, "poids_par_metre": 5.17, "moment_inertie_x": 27.8, "moment_inertie_y": 11.2, "module_section_x": 0.695, "module_section_y": 0.560, "norme": "EN 10219-2"}', NOW(), NOW()),

('TUBE-RE-80x40x4.0-S235JR', 'Tube rectangulaire 80x40x4.0 S235JR', 'Tube rectangulaire acier 80x40mm épaisseur 4.0mm en S235JR', 'MATIERE_PREMIERE', 'ACTIF', 'TUBES_PROFILES', 'TUBE_RECTANGULAIRE', 'M', 'M', 'M', 1.0, 1.0, true, 10, 100, 5, 25.20, 34.78, 20.0, 25.0, 6.66, 80.0, 40.0, 80.0,
 '{"materiau": "S235JR", "longueur": 80, "largeur": 40, "epaisseur": 4.0, "section": 0.666, "poids_par_metre": 6.66, "moment_inertie_x": 35.2, "moment_inertie_y": 13.8, "module_section_x": 0.880, "module_section_y": 0.690, "norme": "EN 10219-2"}', NOW(), NOW()),

('TUBE-RE-80x40x5.0-S235JR', 'Tube rectangulaire 80x40x5.0 S235JR', 'Tube rectangulaire acier 80x40mm épaisseur 5.0mm en S235JR', 'MATIERE_PREMIERE', 'ACTIF', 'TUBES_PROFILES', 'TUBE_RECTANGULAIRE', 'M', 'M', 'M', 1.0, 1.0, true, 10, 100, 5, 30.50, 42.12, 20.0, 25.0, 8.07, 80.0, 40.0, 80.0,
 '{"materiau": "S235JR", "longueur": 80, "largeur": 40, "epaisseur": 5.0, "section": 0.807, "poids_par_metre": 8.07, "moment_inertie_x": 41.5, "moment_inertie_y": 15.8, "module_section_x": 1.038, "module_section_y": 0.790, "norme": "EN 10219-2"}', NOW(), NOW()),

-- Tubes rectangulaires 100x50mm S235JR
('TUBE-RE-100x50x4.0-S235JR', 'Tube rectangulaire 100x50x4.0 S235JR', 'Tube rectangulaire acier 100x50mm épaisseur 4.0mm en S235JR', 'MATIERE_PREMIERE', 'ACTIF', 'TUBES_PROFILES', 'TUBE_RECTANGULAIRE', 'M', 'M', 'M', 1.0, 1.0, true, 10, 100, 5, 31.50, 43.48, 20.0, 25.0, 8.33, 100.0, 50.0, 100.0,
 '{"materiau": "S235JR", "longueur": 100, "largeur": 50, "epaisseur": 4.0, "section": 0.833, "poids_par_metre": 8.33, "moment_inertie_x": 69.5, "moment_inertie_y": 27.8, "module_section_x": 1.390, "module_section_y": 1.112, "norme": "EN 10219-2"}', NOW(), NOW()),

('TUBE-RE-100x50x5.0-S235JR', 'Tube rectangulaire 100x50x5.0 S235JR', 'Tube rectangulaire acier 100x50mm épaisseur 5.0mm en S235JR', 'MATIERE_PREMIERE', 'ACTIF', 'TUBES_PROFILES', 'TUBE_RECTANGULAIRE', 'M', 'M', 'M', 1.0, 1.0, true, 10, 100, 5, 38.20, 52.78, 20.0, 25.0, 10.12, 100.0, 50.0, 100.0,
 '{"materiau": "S235JR", "longueur": 100, "largeur": 50, "epaisseur": 5.0, "section": 1.012, "poids_par_metre": 10.12, "moment_inertie_x": 82.5, "moment_inertie_y": 32.2, "module_section_x": 1.650, "module_section_y": 1.288, "norme": "EN 10219-2"}', NOW(), NOW()),

('TUBE-RE-100x50x6.0-S235JR', 'Tube rectangulaire 100x50x6.0 S235JR', 'Tube rectangulaire acier 100x50mm épaisseur 6.0mm en S235JR', 'MATIERE_PREMIERE', 'ACTIF', 'TUBES_PROFILES', 'TUBE_RECTANGULAIRE', 'M', 'M', 'M', 1.0, 1.0, true, 10, 100, 5, 44.50, 61.48, 20.0, 25.0, 11.72, 100.0, 50.0, 100.0,
 '{"materiau": "S235JR", "longueur": 100, "largeur": 50, "epaisseur": 6.0, "section": 1.172, "poids_par_metre": 11.72, "moment_inertie_x": 94.2, "moment_inertie_y": 36.2, "module_section_x": 1.884, "module_section_y": 1.448, "norme": "EN 10219-2"}', NOW(), NOW()),

-- Tubes rectangulaires 120x60mm S235JR
('TUBE-RE-120x60x5.0-S235JR', 'Tube rectangulaire 120x60x5.0 S235JR', 'Tube rectangulaire acier 120x60mm épaisseur 5.0mm en S235JR', 'MATIERE_PREMIERE', 'ACTIF', 'TUBES_PROFILES', 'TUBE_RECTANGULAIRE', 'M', 'M', 'M', 1.0, 1.0, true, 10, 100, 5, 46.20, 63.83, 20.0, 25.0, 12.22, 120.0, 60.0, 120.0,
 '{"materiau": "S235JR", "longueur": 120, "largeur": 60, "epaisseur": 5.0, "section": 1.222, "poids_par_metre": 12.22, "moment_inertie_x": 151.2, "moment_inertie_y": 60.5, "module_section_x": 2.520, "module_section_y": 2.017, "norme": "EN 10219-2"}', NOW(), NOW()),

('TUBE-RE-120x60x6.0-S235JR', 'Tube rectangulaire 120x60x6.0 S235JR', 'Tube rectangulaire acier 120x60mm épaisseur 6.0mm en S235JR', 'MATIERE_PREMIERE', 'ACTIF', 'TUBES_PROFILES', 'TUBE_RECTANGULAIRE', 'M', 'M', 'M', 1.0, 1.0, true, 10, 100, 5, 54.20, 74.85, 20.0, 25.0, 14.32, 120.0, 60.0, 120.0,
 '{"materiau": "S235JR", "longueur": 120, "largeur": 60, "epaisseur": 6.0, "section": 1.432, "poids_par_metre": 14.32, "moment_inertie_x": 173.5, "moment_inertie_y": 68.5, "module_section_x": 2.892, "module_section_y": 2.283, "norme": "EN 10219-2"}', NOW(), NOW()),

('TUBE-RE-120x60x8.0-S235JR', 'Tube rectangulaire 120x60x8.0 S235JR', 'Tube rectangulaire acier 120x60mm épaisseur 8.0mm en S235JR', 'MATIERE_PREMIERE', 'ACTIF', 'TUBES_PROFILES', 'TUBE_RECTANGULAIRE', 'M', 'M', 'M', 1.0, 1.0, true, 10, 100, 5, 69.50, 95.98, 20.0, 25.0, 18.32, 120.0, 60.0, 120.0,
 '{"materiau": "S235JR", "longueur": 120, "largeur": 60, "epaisseur": 8.0, "section": 1.832, "poids_par_metre": 18.32, "moment_inertie_x": 214.5, "moment_inertie_y": 82.2, "module_section_x": 3.575, "module_section_y": 2.740, "norme": "EN 10219-2"}', NOW(), NOW()),

-- Tubes rectangulaires 140x80mm S235JR
('TUBE-RE-140x80x5.0-S235JR', 'Tube rectangulaire 140x80x5.0 S235JR', 'Tube rectangulaire acier 140x80mm épaisseur 5.0mm en S235JR', 'MATIERE_PREMIERE', 'ACTIF', 'TUBES_PROFILES', 'TUBE_RECTANGULAIRE', 'M', 'M', 'M', 1.0, 1.0, true, 10, 100, 5, 58.50, 80.83, 20.0, 25.0, 15.47, 140.0, 80.0, 140.0,
 '{"materiau": "S235JR", "longueur": 140, "largeur": 80, "epaisseur": 5.0, "section": 1.547, "poids_par_metre": 15.47, "moment_inertie_x": 262.8, "moment_inertie_y": 125.2, "module_section_x": 3.754, "module_section_y": 3.130, "norme": "EN 10219-2"}', NOW(), NOW()),

('TUBE-RE-140x80x6.0-S235JR', 'Tube rectangulaire 140x80x6.0 S235JR', 'Tube rectangulaire acier 140x80mm épaisseur 6.0mm en S235JR', 'MATIERE_PREMIERE', 'ACTIF', 'TUBES_PROFILES', 'TUBE_RECTANGULAIRE', 'M', 'M', 'M', 1.0, 1.0, true, 10, 100, 5, 68.50, 94.63, 20.0, 25.0, 18.12, 140.0, 80.0, 140.0,
 '{"materiau": "S235JR", "longueur": 140, "largeur": 80, "epaisseur": 6.0, "section": 1.812, "poids_par_metre": 18.12, "moment_inertie_x": 302.5, "moment_inertie_y": 142.8, "module_section_x": 4.321, "module_section_y": 3.570, "norme": "EN 10219-2"}', NOW(), NOW()),

-- Tubes rectangulaires 160x80mm S235JR
('TUBE-RE-160x80x5.0-S235JR', 'Tube rectangulaire 160x80x5.0 S235JR', 'Tube rectangulaire acier 160x80mm épaisseur 5.0mm en S235JR', 'MATIERE_PREMIERE', 'ACTIF', 'TUBES_PROFILES', 'TUBE_RECTANGULAIRE', 'M', 'M', 'M', 1.0, 1.0, true, 10, 100, 5, 64.20, 88.68, 20.0, 25.0, 16.97, 160.0, 80.0, 160.0,
 '{"materiau": "S235JR", "longueur": 160, "largeur": 80, "epaisseur": 5.0, "section": 1.697, "poids_par_metre": 16.97, "moment_inertie_x": 368.5, "moment_inertie_y": 125.2, "module_section_x": 4.606, "module_section_y": 3.130, "norme": "EN 10219-2"}', NOW(), NOW()),

('TUBE-RE-160x80x6.0-S235JR', 'Tube rectangulaire 160x80x6.0 S235JR', 'Tube rectangulaire acier 160x80mm épaisseur 6.0mm en S235JR', 'MATIERE_PREMIERE', 'ACTIF', 'TUBES_PROFILES', 'TUBE_RECTANGULAIRE', 'M', 'M', 'M', 1.0, 1.0, true, 10, 100, 5, 75.20, 103.85, 20.0, 25.0, 19.87, 160.0, 80.0, 160.0,
 '{"materiau": "S355JR", "longueur": 160, "largeur": 80, "epaisseur": 6.0, "section": 1.987, "poids_par_metre": 19.87, "moment_inertie_x": 425.8, "moment_inertie_y": 142.8, "module_section_x": 5.323, "module_section_y": 3.570, "norme": "EN 10219-2"}', NOW(), NOW()),

-- Tubes rectangulaires 200x100mm S235JR
('TUBE-RE-200x100x6.0-S235JR', 'Tube rectangulaire 200x100x6.0 S235JR', 'Tube rectangulaire acier 200x100mm épaisseur 6.0mm en S235JR', 'MATIERE_PREMIERE', 'ACTIF', 'TUBES_PROFILES', 'TUBE_RECTANGULAIRE', 'M', 'M', 'M', 1.0, 1.0, true, 10, 100, 5, 92.50, 127.83, 20.0, 25.0, 24.42, 200.0, 100.0, 200.0,
 '{"materiau": "S235JR", "longueur": 200, "largeur": 100, "epaisseur": 6.0, "section": 2.442, "poids_par_metre": 24.42, "moment_inertie_x": 825.8, "moment_inertie_y": 275.2, "module_section_x": 8.258, "module_section_y": 5.504, "norme": "EN 10219-2"}', NOW(), NOW()),

('TUBE-RE-200x100x8.0-S235JR', 'Tube rectangulaire 200x100x8.0 S235JR', 'Tube rectangulaire acier 200x100mm épaisseur 8.0mm en S235JR', 'MATIERE_PREMIERE', 'ACTIF', 'TUBES_PROFILES', 'TUBE_RECTANGULAIRE', 'M', 'M', 'M', 1.0, 1.0, true, 10, 100, 5, 118.50, 163.73, 20.0, 25.0, 31.27, 200.0, 100.0, 200.0,
 '{"materiau": "S235JR", "longueur": 200, "largeur": 100, "epaisseur": 8.0, "section": 3.127, "poids_par_metre": 31.27, "moment_inertie_x": 1025.5, "moment_inertie_y": 334.2, "module_section_x": 10.255, "module_section_y": 6.684, "norme": "EN 10219-2"}', NOW(), NOW()),

-- Quelques tubes rectangulaires S355JR
('TUBE-RE-100x50x5.0-S355JR', 'Tube rectangulaire 100x50x5.0 S355JR', 'Tube rectangulaire acier 100x50mm épaisseur 5.0mm en S355JR', 'MATIERE_PREMIERE', 'ACTIF', 'TUBES_PROFILES', 'TUBE_RECTANGULAIRE', 'M', 'M', 'M', 1.0, 1.0, true, 10, 100, 5, 46.50, 64.23, 20.0, 25.0, 10.12, 100.0, 50.0, 100.0,
 '{"materiau": "S355JR", "longueur": 100, "largeur": 50, "epaisseur": 5.0, "section": 1.012, "poids_par_metre": 10.12, "moment_inertie_x": 82.5, "moment_inertie_y": 32.2, "module_section_x": 1.650, "module_section_y": 1.288, "norme": "EN 10219-2"}', NOW(), NOW()),

('TUBE-RE-120x80x6.0-S355JR', 'Tube rectangulaire 120x80x6.0 S355JR', 'Tube rectangulaire acier 120x80mm épaisseur 6.0mm en S355JR', 'MATIERE_PREMIERE', 'ACTIF', 'TUBES_PROFILES', 'TUBE_RECTANGULAIRE', 'M', 'M', 'M', 1.0, 1.0, true, 10, 100, 5, 67.50, 93.25, 20.0, 25.0, 17.82, 120.0, 80.0, 120.0,
 '{"materiau": "S355JR", "longueur": 120, "largeur": 80, "epaisseur": 6.0, "section": 1.782, "poids_par_metre": 17.82, "moment_inertie_x": 285.2, "moment_inertie_y": 142.8, "module_section_x": 4.753, "module_section_y": 3.570, "norme": "EN 10219-2"}', NOW(), NOW());

-- ============================================================================
-- FINALISATION
-- ============================================================================

-- Validation de la transaction
COMMIT;

-- Affichage du résumé
SELECT 
    sous_famille,
    COUNT(*) as nombre_articles,
    AVG(prix_achat_standard) as prix_moyen,
    MIN(prix_achat_standard) as prix_min,
    MAX(prix_achat_standard) as prix_max
FROM articles 
WHERE famille = 'TUBES_PROFILES'
GROUP BY sous_famille
ORDER BY sous_famille;

-- Message de fin
SELECT 'Script d''injection des tubes métalliques terminé avec succès !' as message;
SELECT CONCAT('Total d''articles tubes ajoutés: ', COUNT(*)) as total_ajoute 
FROM articles 
WHERE famille = 'TUBES_PROFILES';