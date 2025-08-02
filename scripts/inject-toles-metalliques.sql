-- Script SQL pour l'injection des tôles métalliques dans la table articles
-- Génère tous les types de tôles : acier lisses, inox, aluminium, spéciales et galvanisées
-- Auteur: Claude Code
-- Date: 2025-08-02

-- Début de la transaction
BEGIN;

-- ============================================================================
-- 1. TÔLES ACIER LISSES
-- ============================================================================

INSERT INTO articles (
    reference, designation, description, type, status, famille, sous_famille,
    unite_stock, unite_achat, unite_vente, coefficient_achat, coefficient_vente,
    gere_en_stock, stock_mini, stock_maxi, stock_securite,
    prix_achat_standard, prix_vente_ht, taux_tva, taux_marge,
    poids, longueur, largeur, hauteur, caracteristiques_techniques,
    created_at, updated_at
) VALUES

-- Tôles S235JR lisses - Épaisseur 0.5mm
('TOLE-S235JR-0.5-1000x2000', 'Tôle S235JR lisse 0.5mm 1000x2000', 'Tôle acier lisse S235JR épaisseur 0.5mm dimensions 1000x2000mm', 'MATIERE_PREMIERE', 'ACTIF', 'TOLES_PLAQUES', 'TOLE_LISSE', 'M2', 'PCS', 'PCS', 2.0, 2.0, true, 5, 50, 2, 18.50, 25.58, 20.0, 25.0, 7.85, 1000.0, 2000.0, 0.5,
 '{"materiau": "S235JR", "epaisseur": 0.5, "longueur": 1000, "largeur": 2000, "surface": 2.0, "poids_par_m2": 3.925, "poids_total": 7.85, "densite": 7.85, "limite_elastique": 235, "resistance_traction": 360, "finition": "laminée à chaud", "norme": "EN 10025-2"}', NOW(), NOW()),

('TOLE-S235JR-0.5-1250x2500', 'Tôle S235JR lisse 0.5mm 1250x2500', 'Tôle acier lisse S235JR épaisseur 0.5mm dimensions 1250x2500mm', 'MATIERE_PREMIERE', 'ACTIF', 'TOLES_PLAQUES', 'TOLE_LISSE', 'M2', 'PCS', 'PCS', 3.125, 3.125, true, 5, 50, 2, 28.90, 39.99, 20.0, 25.0, 12.27, 1250.0, 2500.0, 0.5,
 '{"materiau": "S235JR", "epaisseur": 0.5, "longueur": 1250, "largeur": 2500, "surface": 3.125, "poids_par_m2": 3.925, "poids_total": 12.27, "densite": 7.85, "limite_elastique": 235, "resistance_traction": 360, "finition": "laminée à chaud", "norme": "EN 10025-2"}', NOW(), NOW()),

('TOLE-S235JR-0.5-1500x3000', 'Tôle S235JR lisse 0.5mm 1500x3000', 'Tôle acier lisse S235JR épaisseur 0.5mm dimensions 1500x3000mm', 'MATIERE_PREMIERE', 'ACTIF', 'TOLES_PLAQUES', 'TOLE_LISSE', 'M2', 'PCS', 'PCS', 4.5, 4.5, true, 5, 50, 2, 41.65, 57.59, 20.0, 25.0, 17.66, 1500.0, 3000.0, 0.5,
 '{"materiau": "S235JR", "epaisseur": 0.5, "longueur": 1500, "largeur": 3000, "surface": 4.5, "poids_par_m2": 3.925, "poids_total": 17.66, "densite": 7.85, "limite_elastique": 235, "resistance_traction": 360, "finition": "laminée à chaud", "norme": "EN 10025-2"}', NOW(), NOW()),

('TOLE-S235JR-0.5-2000x3000', 'Tôle S235JR lisse 0.5mm 2000x3000', 'Tôle acier lisse S235JR épaisseur 0.5mm dimensions 2000x3000mm', 'MATIERE_PREMIERE', 'ACTIF', 'TOLES_PLAQUES', 'TOLE_LISSE', 'M2', 'PCS', 'PCS', 6.0, 6.0, true, 5, 50, 2, 55.50, 76.73, 20.0, 25.0, 23.55, 2000.0, 3000.0, 0.5,
 '{"materiau": "S235JR", "epaisseur": 0.5, "longueur": 2000, "largeur": 3000, "surface": 6.0, "poids_par_m2": 3.925, "poids_total": 23.55, "densite": 7.85, "limite_elastique": 235, "resistance_traction": 360, "finition": "laminée à chaud", "norme": "EN 10025-2"}', NOW(), NOW()),

('TOLE-S235JR-0.5-2000x4000', 'Tôle S235JR lisse 0.5mm 2000x4000', 'Tôle acier lisse S235JR épaisseur 0.5mm dimensions 2000x4000mm', 'MATIERE_PREMIERE', 'ACTIF', 'TOLES_PLAQUES', 'TOLE_LISSE', 'M2', 'PCS', 'PCS', 8.0, 8.0, true, 5, 50, 2, 74.00, 102.30, 20.0, 25.0, 31.40, 2000.0, 4000.0, 0.5,
 '{"materiau": "S235JR", "epaisseur": 0.5, "longueur": 2000, "largeur": 4000, "surface": 8.0, "poids_par_m2": 3.925, "poids_total": 31.40, "densite": 7.85, "limite_elastique": 235, "resistance_traction": 360, "finition": "laminée à chaud", "norme": "EN 10025-2"}', NOW(), NOW()),

('TOLE-S235JR-0.5-2000x6000', 'Tôle S235JR lisse 0.5mm 2000x6000', 'Tôle acier lisse S235JR épaisseur 0.5mm dimensions 2000x6000mm', 'MATIERE_PREMIERE', 'ACTIF', 'TOLES_PLAQUES', 'TOLE_LISSE', 'M2', 'PCS', 'PCS', 12.0, 12.0, true, 5, 50, 2, 111.00, 153.45, 20.0, 25.0, 47.10, 2000.0, 6000.0, 0.5,
 '{"materiau": "S235JR", "epaisseur": 0.5, "longueur": 2000, "largeur": 6000, "surface": 12.0, "poids_par_m2": 3.925, "poids_total": 47.10, "densite": 7.85, "limite_elastique": 235, "resistance_traction": 360, "finition": "laminée à chaud", "norme": "EN 10025-2"}', NOW(), NOW()),

-- Tôles S235JR lisses - Épaisseur 0.75mm
('TOLE-S235JR-0.75-1000x2000', 'Tôle S235JR lisse 0.75mm 1000x2000', 'Tôle acier lisse S235JR épaisseur 0.75mm dimensions 1000x2000mm', 'MATIERE_PREMIERE', 'ACTIF', 'TOLES_PLAQUES', 'TOLE_LISSE', 'M2', 'PCS', 'PCS', 2.0, 2.0, true, 5, 50, 2, 22.35, 30.90, 20.0, 25.0, 11.78, 1000.0, 2000.0, 0.75,
 '{"materiau": "S235JR", "epaisseur": 0.75, "longueur": 1000, "largeur": 2000, "surface": 2.0, "poids_par_m2": 5.888, "poids_total": 11.78, "densite": 7.85, "limite_elastique": 235, "resistance_traction": 360, "finition": "laminée à chaud", "norme": "EN 10025-2"}', NOW(), NOW()),

('TOLE-S235JR-0.75-1250x2500', 'Tôle S235JR lisse 0.75mm 1250x2500', 'Tôle acier lisse S235JR épaisseur 0.75mm dimensions 1250x2500mm', 'MATIERE_PREMIERE', 'ACTIF', 'TOLES_PLAQUES', 'TOLE_LISSE', 'M2', 'PCS', 'PCS', 3.125, 3.125, true, 5, 50, 2, 34.95, 48.32, 20.0, 25.0, 18.40, 1250.0, 2500.0, 0.75,
 '{"materiau": "S235JR", "epaisseur": 0.75, "longueur": 1250, "largeur": 2500, "surface": 3.125, "poids_par_m2": 5.888, "poids_total": 18.40, "densite": 7.85, "limite_elastique": 235, "resistance_traction": 360, "finition": "laminée à chaud", "norme": "EN 10025-2"}', NOW(), NOW()),

('TOLE-S235JR-0.75-1500x3000', 'Tôle S235JR lisse 0.75mm 1500x3000', 'Tôle acier lisse S235JR épaisseur 0.75mm dimensions 1500x3000mm', 'MATIERE_PREMIERE', 'ACTIF', 'TOLES_PLAQUES', 'TOLE_LISSE', 'M2', 'PCS', 'PCS', 4.5, 4.5, true, 5, 50, 2, 50.40, 69.68, 20.0, 25.0, 26.50, 1500.0, 3000.0, 0.75,
 '{"materiau": "S235JR", "epaisseur": 0.75, "longueur": 1500, "largeur": 3000, "surface": 4.5, "poids_par_m2": 5.888, "poids_total": 26.50, "densite": 7.85, "limite_elastique": 235, "resistance_traction": 360, "finition": "laminée à chaud", "norme": "EN 10025-2"}', NOW(), NOW()),

('TOLE-S235JR-0.75-2000x3000', 'Tôle S235JR lisse 0.75mm 2000x3000', 'Tôle acier lisse S235JR épaisseur 0.75mm dimensions 2000x3000mm', 'MATIERE_PREMIERE', 'ACTIF', 'TOLES_PLAQUES', 'TOLE_LISSE', 'M2', 'PCS', 'PCS', 6.0, 6.0, true, 5, 50, 2, 67.20, 92.90, 20.0, 25.0, 35.33, 2000.0, 3000.0, 0.75,
 '{"materiau": "S235JR", "epaisseur": 0.75, "longueur": 2000, "largeur": 3000, "surface": 6.0, "poids_par_m2": 5.888, "poids_total": 35.33, "densite": 7.85, "limite_elastique": 235, "resistance_traction": 360, "finition": "laminée à chaud", "norme": "EN 10025-2"}', NOW(), NOW()),

('TOLE-S235JR-0.75-2000x4000', 'Tôle S235JR lisse 0.75mm 2000x4000', 'Tôle acier lisse S235JR épaisseur 0.75mm dimensions 2000x4000mm', 'MATIERE_PREMIERE', 'ACTIF', 'TOLES_PLAQUES', 'TOLE_LISSE', 'M2', 'PCS', 'PCS', 8.0, 8.0, true, 5, 50, 2, 89.60, 123.87, 20.0, 25.0, 47.10, 2000.0, 4000.0, 0.75,
 '{"materiau": "S235JR", "epaisseur": 0.75, "longueur": 2000, "largeur": 4000, "surface": 8.0, "poids_par_m2": 5.888, "poids_total": 47.10, "densite": 7.85, "limite_elastique": 235, "resistance_traction": 360, "finition": "laminée à chaud", "norme": "EN 10025-2"}', NOW(), NOW()),

('TOLE-S235JR-0.75-2000x6000', 'Tôle S235JR lisse 0.75mm 2000x6000', 'Tôle acier lisse S235JR épaisseur 0.75mm dimensions 2000x6000mm', 'MATIERE_PREMIERE', 'ACTIF', 'TOLES_PLAQUES', 'TOLE_LISSE', 'M2', 'PCS', 'PCS', 12.0, 12.0, true, 5, 50, 2, 134.40, 185.80, 20.0, 25.0, 70.66, 2000.0, 6000.0, 0.75,
 '{"materiau": "S235JR", "epaisseur": 0.75, "longueur": 2000, "largeur": 6000, "surface": 12.0, "poids_par_m2": 5.888, "poids_total": 70.66, "densite": 7.85, "limite_elastique": 235, "resistance_traction": 360, "finition": "laminée à chaud", "norme": "EN 10025-2"}', NOW(), NOW()),

-- Tôles S235JR lisses - Épaisseur 1.0mm
('TOLE-S235JR-1.0-1000x2000', 'Tôle S235JR lisse 1.0mm 1000x2000', 'Tôle acier lisse S235JR épaisseur 1.0mm dimensions 1000x2000mm', 'MATIERE_PREMIERE', 'ACTIF', 'TOLES_PLAQUES', 'TOLE_LISSE', 'M2', 'PCS', 'PCS', 2.0, 2.0, true, 5, 50, 2, 26.20, 36.23, 20.0, 25.0, 15.70, 1000.0, 2000.0, 1.0,
 '{"materiau": "S235JR", "epaisseur": 1.0, "longueur": 1000, "largeur": 2000, "surface": 2.0, "poids_par_m2": 7.85, "poids_total": 15.70, "densite": 7.85, "limite_elastique": 235, "resistance_traction": 360, "finition": "laminée à chaud", "norme": "EN 10025-2"}', NOW(), NOW()),

('TOLE-S235JR-1.0-1250x2500', 'Tôle S235JR lisse 1.0mm 1250x2500', 'Tôle acier lisse S235JR épaisseur 1.0mm dimensions 1250x2500mm', 'MATIERE_PREMIERE', 'ACTIF', 'TOLES_PLAQUES', 'TOLE_LISSE', 'M2', 'PCS', 'PCS', 3.125, 3.125, true, 5, 50, 2, 40.95, 56.64, 20.0, 25.0, 24.53, 1250.0, 2500.0, 1.0,
 '{"materiau": "S235JR", "epaisseur": 1.0, "longueur": 1250, "largeur": 2500, "surface": 3.125, "poids_par_m2": 7.85, "poids_total": 24.53, "densite": 7.85, "limite_elastique": 235, "resistance_traction": 360, "finition": "laminée à chaud", "norme": "EN 10025-2"}', NOW(), NOW()),

('TOLE-S235JR-1.0-1500x3000', 'Tôle S235JR lisse 1.0mm 1500x3000', 'Tôle acier lisse S235JR épaisseur 1.0mm dimensions 1500x3000mm', 'MATIERE_PREMIERE', 'ACTIF', 'TOLES_PLAQUES', 'TOLE_LISSE', 'M2', 'PCS', 'PCS', 4.5, 4.5, true, 5, 50, 2, 59.05, 81.63, 20.0, 25.0, 35.33, 1500.0, 3000.0, 1.0,
 '{"materiau": "S235JR", "epaisseur": 1.0, "longueur": 1500, "largeur": 3000, "surface": 4.5, "poids_par_m2": 7.85, "poids_total": 35.33, "densite": 7.85, "limite_elastique": 235, "resistance_traction": 360, "finition": "laminée à chaud", "norme": "EN 10025-2"}', NOW(), NOW()),

('TOLE-S235JR-1.0-2000x3000', 'Tôle S235JR lisse 1.0mm 2000x3000', 'Tôle acier lisse S235JR épaisseur 1.0mm dimensions 2000x3000mm', 'MATIERE_PREMIERE', 'ACTIF', 'TOLES_PLAQUES', 'TOLE_LISSE', 'M2', 'PCS', 'PCS', 6.0, 6.0, true, 5, 50, 2, 78.75, 108.89, 20.0, 25.0, 47.10, 2000.0, 3000.0, 1.0,
 '{"materiau": "S235JR", "epaisseur": 1.0, "longueur": 2000, "largeur": 3000, "surface": 6.0, "poids_par_m2": 7.85, "poids_total": 47.10, "densite": 7.85, "limite_elastique": 235, "resistance_traction": 360, "finition": "laminée à chaud", "norme": "EN 10025-2"}', NOW(), NOW()),

('TOLE-S235JR-1.0-2000x4000', 'Tôle S235JR lisse 1.0mm 2000x4000', 'Tôle acier lisse S235JR épaisseur 1.0mm dimensions 2000x4000mm', 'MATIERE_PREMIERE', 'ACTIF', 'TOLES_PLAQUES', 'TOLE_LISSE', 'M2', 'PCS', 'PCS', 8.0, 8.0, true, 5, 50, 2, 105.00, 145.18, 20.0, 25.0, 62.80, 2000.0, 4000.0, 1.0,
 '{"materiau": "S235JR", "epaisseur": 1.0, "longueur": 2000, "largeur": 4000, "surface": 8.0, "poids_par_m2": 7.85, "poids_total": 62.80, "densite": 7.85, "limite_elastique": 235, "resistance_traction": 360, "finition": "laminée à chaud", "norme": "EN 10025-2"}', NOW(), NOW()),

('TOLE-S235JR-1.0-2000x6000', 'Tôle S235JR lisse 1.0mm 2000x6000', 'Tôle acier lisse S235JR épaisseur 1.0mm dimensions 2000x6000mm', 'MATIERE_PREMIERE', 'ACTIF', 'TOLES_PLAQUES', 'TOLE_LISSE', 'M2', 'PCS', 'PCS', 12.0, 12.0, true, 5, 50, 2, 157.50, 217.78, 20.0, 25.0, 94.20, 2000.0, 6000.0, 1.0,
 '{"materiau": "S235JR", "epaisseur": 1.0, "longueur": 2000, "largeur": 6000, "surface": 12.0, "poids_par_m2": 7.85, "poids_total": 94.20, "densite": 7.85, "limite_elastique": 235, "resistance_traction": 360, "finition": "laminée à chaud", "norme": "EN 10025-2"}', NOW(), NOW()),

-- Tôles S235JR lisses - Épaisseur 1.5mm
('TOLE-S235JR-1.5-1000x2000', 'Tôle S235JR lisse 1.5mm 1000x2000', 'Tôle acier lisse S235JR épaisseur 1.5mm dimensions 1000x2000mm', 'MATIERE_PREMIERE', 'ACTIF', 'TOLES_PLAQUES', 'TOLE_LISSE', 'M2', 'PCS', 'PCS', 2.0, 2.0, true, 5, 50, 2, 35.45, 49.04, 20.0, 25.0, 23.55, 1000.0, 2000.0, 1.5,
 '{"materiau": "S235JR", "epaisseur": 1.5, "longueur": 1000, "largeur": 2000, "surface": 2.0, "poids_par_m2": 11.775, "poids_total": 23.55, "densite": 7.85, "limite_elastique": 235, "resistance_traction": 360, "finition": "laminée à chaud", "norme": "EN 10025-2"}', NOW(), NOW()),

('TOLE-S235JR-1.5-1250x2500', 'Tôle S235JR lisse 1.5mm 1250x2500', 'Tôle acier lisse S235JR épaisseur 1.5mm dimensions 1250x2500mm', 'MATIERE_PREMIERE', 'ACTIF', 'TOLES_PLAQUES', 'TOLE_LISSE', 'M2', 'PCS', 'PCS', 3.125, 3.125, true, 5, 50, 2, 55.40, 76.60, 20.0, 25.0, 36.80, 1250.0, 2500.0, 1.5,
 '{"materiau": "S235JR", "epaisseur": 1.5, "longueur": 1250, "largeur": 2500, "surface": 3.125, "poids_par_m2": 11.775, "poids_total": 36.80, "densite": 7.85, "limite_elastique": 235, "resistance_traction": 360, "finition": "laminée à chaud", "norme": "EN 10025-2"}', NOW(), NOW()),

('TOLE-S235JR-1.5-1500x3000', 'Tôle S235JR lisse 1.5mm 1500x3000', 'Tôle acier lisse S235JR épaisseur 1.5mm dimensions 1500x3000mm', 'MATIERE_PREMIERE', 'ACTIF', 'TOLES_PLAQUES', 'TOLE_LISSE', 'M2', 'PCS', 'PCS', 4.5, 4.5, true, 5, 50, 2, 79.90, 110.50, 20.0, 25.0, 53.00, 1500.0, 3000.0, 1.5,
 '{"materiau": "S235JR", "epaisseur": 1.5, "longueur": 1500, "largeur": 3000, "surface": 4.5, "poids_par_m2": 11.775, "poids_total": 53.00, "densite": 7.85, "limite_elastique": 235, "resistance_traction": 360, "finition": "laminée à chaud", "norme": "EN 10025-2"}', NOW(), NOW()),

('TOLE-S235JR-1.5-2000x3000', 'Tôle S235JR lisse 1.5mm 2000x3000', 'Tôle acier lisse S235JR épaisseur 1.5mm dimensions 2000x3000mm', 'MATIERE_PREMIERE', 'ACTIF', 'TOLES_PLAQUES', 'TOLE_LISSE', 'M2', 'PCS', 'PCS', 6.0, 6.0, true, 5, 50, 2, 106.55, 147.37, 20.0, 25.0, 70.65, 2000.0, 3000.0, 1.5,
 '{"materiau": "S235JR", "epaisseur": 1.5, "longueur": 2000, "largeur": 3000, "surface": 6.0, "poids_par_m2": 11.775, "poids_total": 70.65, "densite": 7.85, "limite_elastique": 235, "resistance_traction": 360, "finition": "laminée à chaud", "norme": "EN 10025-2"}', NOW(), NOW()),

('TOLE-S235JR-1.5-2000x4000', 'Tôle S235JR lisse 1.5mm 2000x4000', 'Tôle acier lisse S235JR épaisseur 1.5mm dimensions 2000x4000mm', 'MATIERE_PREMIERE', 'ACTIF', 'TOLES_PLAQUES', 'TOLE_LISSE', 'M2', 'PCS', 'PCS', 8.0, 8.0, true, 5, 50, 2, 142.10, 196.48, 20.0, 25.0, 94.20, 2000.0, 4000.0, 1.5,
 '{"materiau": "S235JR", "epaisseur": 1.5, "longueur": 2000, "largeur": 4000, "surface": 8.0, "poids_par_m2": 11.775, "poids_total": 94.20, "densite": 7.85, "limite_elastique": 235, "resistance_traction": 360, "finition": "laminée à chaud", "norme": "EN 10025-2"}', NOW(), NOW()),

('TOLE-S235JR-1.5-2000x6000', 'Tôle S235JR lisse 1.5mm 2000x6000', 'Tôle acier lisse S235JR épaisseur 1.5mm dimensions 2000x6000mm', 'MATIERE_PREMIERE', 'ACTIF', 'TOLES_PLAQUES', 'TOLE_LISSE', 'M2', 'PCS', 'PCS', 12.0, 12.0, true, 5, 50, 2, 213.15, 294.73, 20.0, 25.0, 141.30, 2000.0, 6000.0, 1.5,
 '{"materiau": "S235JR", "epaisseur": 1.5, "longueur": 2000, "largeur": 6000, "surface": 12.0, "poids_par_m2": 11.775, "poids_total": 141.30, "densite": 7.85, "limite_elastique": 235, "resistance_traction": 360, "finition": "laminée à chaud", "norme": "EN 10025-2"}', NOW(), NOW()),

-- Tôles S235JR lisses - Épaisseur 2.0mm
('TOLE-S235JR-2.0-1000x2000', 'Tôle S235JR lisse 2.0mm 1000x2000', 'Tôle acier lisse S235JR épaisseur 2.0mm dimensions 1000x2000mm', 'MATIERE_PREMIERE', 'ACTIF', 'TOLES_PLAQUES', 'TOLE_LISSE', 'M2', 'PCS', 'PCS', 2.0, 2.0, true, 5, 50, 2, 42.50, 58.80, 20.0, 25.0, 31.40, 1000.0, 2000.0, 2.0,
 '{"materiau": "S235JR", "epaisseur": 2.0, "longueur": 1000, "largeur": 2000, "surface": 2.0, "poids_par_m2": 15.7, "poids_total": 31.40, "densite": 7.85, "limite_elastique": 235, "resistance_traction": 360, "finition": "laminée à chaud", "norme": "EN 10025-2"}', NOW(), NOW()),

('TOLE-S235JR-2.0-1250x2500', 'Tôle S235JR lisse 2.0mm 1250x2500', 'Tôle acier lisse S235JR épaisseur 2.0mm dimensions 1250x2500mm', 'MATIERE_PREMIERE', 'ACTIF', 'TOLES_PLAQUES', 'TOLE_LISSE', 'M2', 'PCS', 'PCS', 3.125, 3.125, true, 5, 50, 2, 66.40, 91.85, 20.0, 25.0, 49.06, 1250.0, 2500.0, 2.0,
 '{"materiau": "S235JR", "epaisseur": 2.0, "longueur": 1250, "largeur": 2500, "surface": 3.125, "poids_par_m2": 15.7, "poids_total": 49.06, "densite": 7.85, "limite_elastique": 235, "resistance_traction": 360, "finition": "laminée à chaud", "norme": "EN 10025-2"}', NOW(), NOW()),

('TOLE-S235JR-2.0-1500x3000', 'Tôle S235JR lisse 2.0mm 1500x3000', 'Tôle acier lisse S235JR épaisseur 2.0mm dimensions 1500x3000mm', 'MATIERE_PREMIERE', 'ACTIF', 'TOLES_PLAQUES', 'TOLE_LISSE', 'M2', 'PCS', 'PCS', 4.5, 4.5, true, 5, 50, 2, 95.85, 132.60, 20.0, 25.0, 70.65, 1500.0, 3000.0, 2.0,
 '{"materiau": "S235JR", "epaisseur": 2.0, "longueur": 1500, "largeur": 3000, "surface": 4.5, "poids_par_m2": 15.7, "poids_total": 70.65, "densite": 7.85, "limite_elastique": 235, "resistance_traction": 360, "finition": "laminée à chaud", "norme": "EN 10025-2"}', NOW(), NOW()),

('TOLE-S235JR-2.0-2000x3000', 'Tôle S235JR lisse 2.0mm 2000x3000', 'Tôle acier lisse S235JR épaisseur 2.0mm dimensions 2000x3000mm', 'MATIERE_PREMIERE', 'ACTIF', 'TOLES_PLAQUES', 'TOLE_LISSE', 'M2', 'PCS', 'PCS', 6.0, 6.0, true, 5, 50, 2, 127.80, 176.83, 20.0, 25.0, 94.20, 2000.0, 3000.0, 2.0,
 '{"materiau": "S235JR", "epaisseur": 2.0, "longueur": 2000, "largeur": 3000, "surface": 6.0, "poids_par_m2": 15.7, "poids_total": 94.20, "densite": 7.85, "limite_elastique": 235, "resistance_traction": 360, "finition": "laminée à chaud", "norme": "EN 10025-2"}', NOW(), NOW()),

('TOLE-S235JR-2.0-2000x4000', 'Tôle S235JR lisse 2.0mm 2000x4000', 'Tôle acier lisse S235JR épaisseur 2.0mm dimensions 2000x4000mm', 'MATIERE_PREMIERE', 'ACTIF', 'TOLES_PLAQUES', 'TOLE_LISSE', 'M2', 'PCS', 'PCS', 8.0, 8.0, true, 5, 50, 2, 170.40, 235.78, 20.0, 25.0, 125.60, 2000.0, 4000.0, 2.0,
 '{"materiau": "S235JR", "epaisseur": 2.0, "longueur": 2000, "largeur": 4000, "surface": 8.0, "poids_par_m2": 15.7, "poids_total": 125.60, "densite": 7.85, "limite_elastique": 235, "resistance_traction": 360, "finition": "laminée à chaud", "norme": "EN 10025-2"}', NOW(), NOW()),

('TOLE-S235JR-2.0-2000x6000', 'Tôle S235JR lisse 2.0mm 2000x6000', 'Tôle acier lisse S235JR épaisseur 2.0mm dimensions 2000x6000mm', 'MATIERE_PREMIERE', 'ACTIF', 'TOLES_PLAQUES', 'TOLE_LISSE', 'M2', 'PCS', 'PCS', 12.0, 12.0, true, 5, 50, 2, 255.60, 353.67, 20.0, 25.0, 188.40, 2000.0, 6000.0, 2.0,
 '{"materiau": "S235JR", "epaisseur": 2.0, "longueur": 2000, "largeur": 6000, "surface": 12.0, "poids_par_m2": 15.7, "poids_total": 188.40, "densite": 7.85, "limite_elastique": 235, "resistance_traction": 360, "finition": "laminée à chaud", "norme": "EN 10025-2"}', NOW(), NOW()),

-- Tôles S235JR lisses - Épaisseur 3.0mm
('TOLE-S235JR-3.0-1000x2000', 'Tôle S235JR lisse 3.0mm 1000x2000', 'Tôle acier lisse S235JR épaisseur 3.0mm dimensions 1000x2000mm', 'MATIERE_PREMIERE', 'ACTIF', 'TOLES_PLAQUES', 'TOLE_LISSE', 'M2', 'PCS', 'PCS', 2.0, 2.0, true, 5, 50, 2, 58.50, 80.93, 20.0, 25.0, 47.10, 1000.0, 2000.0, 3.0,
 '{"materiau": "S235JR", "epaisseur": 3.0, "longueur": 1000, "largeur": 2000, "surface": 2.0, "poids_par_m2": 23.55, "poids_total": 47.10, "densite": 7.85, "limite_elastique": 235, "resistance_traction": 360, "finition": "laminée à chaud", "norme": "EN 10025-2"}', NOW(), NOW()),

('TOLE-S235JR-3.0-1250x2500', 'Tôle S235JR lisse 3.0mm 1250x2500', 'Tôle acier lisse S235JR épaisseur 3.0mm dimensions 1250x2500mm', 'MATIERE_PREMIERE', 'ACTIF', 'TOLES_PLAQUES', 'TOLE_LISSE', 'M2', 'PCS', 'PCS', 3.125, 3.125, true, 5, 50, 2, 91.40, 126.45, 20.0, 25.0, 73.59, 1250.0, 2500.0, 3.0,
 '{"materiau": "S235JR", "epaisseur": 3.0, "longueur": 1250, "largeur": 2500, "surface": 3.125, "poids_par_m2": 23.55, "poids_total": 73.59, "densite": 7.85, "limite_elastique": 235, "resistance_traction": 360, "finition": "laminée à chaud", "norme": "EN 10025-2"}', NOW(), NOW()),

('TOLE-S235JR-3.0-1500x3000', 'Tôle S235JR lisse 3.0mm 1500x3000', 'Tôle acier lisse S235JR épaisseur 3.0mm dimensions 1500x3000mm', 'MATIERE_PREMIERE', 'ACTIF', 'TOLES_PLAQUES', 'TOLE_LISSE', 'M2', 'PCS', 'PCS', 4.5, 4.5, true, 5, 50, 2, 131.95, 182.44, 20.0, 25.0, 105.98, 1500.0, 3000.0, 3.0,
 '{"materiau": "S235JR", "epaisseur": 3.0, "longueur": 1500, "largeur": 3000, "surface": 4.5, "poids_par_m2": 23.55, "poids_total": 105.98, "densite": 7.85, "limite_elastique": 235, "resistance_traction": 360, "finition": "laminée à chaud", "norme": "EN 10025-2"}', NOW(), NOW()),

('TOLE-S235JR-3.0-2000x3000', 'Tôle S235JR lisse 3.0mm 2000x3000', 'Tôle acier lisse S235JR épaisseur 3.0mm dimensions 2000x3000mm', 'MATIERE_PREMIERE', 'ACTIF', 'TOLES_PLAQUES', 'TOLE_LISSE', 'M2', 'PCS', 'PCS', 6.0, 6.0, true, 5, 50, 2, 175.95, 243.23, 20.0, 25.0, 141.30, 2000.0, 3000.0, 3.0,
 '{"materiau": "S235JR", "epaisseur": 3.0, "longueur": 2000, "largeur": 3000, "surface": 6.0, "poids_par_m2": 23.55, "poids_total": 141.30, "densite": 7.85, "limite_elastique": 235, "resistance_traction": 360, "finition": "laminée à chaud", "norme": "EN 10025-2"}', NOW(), NOW()),

('TOLE-S235JR-3.0-2000x4000', 'Tôle S235JR lisse 3.0mm 2000x4000', 'Tôle acier lisse S235JR épaisseur 3.0mm dimensions 2000x4000mm', 'MATIERE_PREMIERE', 'ACTIF', 'TOLES_PLAQUES', 'TOLE_LISSE', 'M2', 'PCS', 'PCS', 8.0, 8.0, true, 5, 50, 2, 234.60, 324.31, 20.0, 25.0, 188.40, 2000.0, 4000.0, 3.0,
 '{"materiau": "S235JR", "epaisseur": 3.0, "longueur": 2000, "largeur": 4000, "surface": 8.0, "poids_par_m2": 23.55, "poids_total": 188.40, "densite": 7.85, "limite_elastique": 235, "resistance_traction": 360, "finition": "laminée à chaud", "norme": "EN 10025-2"}', NOW(), NOW()),

('TOLE-S235JR-3.0-2000x6000', 'Tôle S235JR lisse 3.0mm 2000x6000', 'Tôle acier lisse S235JR épaisseur 3.0mm dimensions 2000x6000mm', 'MATIERE_PREMIERE', 'ACTIF', 'TOLES_PLAQUES', 'TOLE_LISSE', 'M2', 'PCS', 'PCS', 12.0, 12.0, true, 5, 50, 2, 351.90, 486.46, 20.0, 25.0, 282.60, 2000.0, 6000.0, 3.0,
 '{"materiau": "S235JR", "epaisseur": 3.0, "longueur": 2000, "largeur": 6000, "surface": 12.0, "poids_par_m2": 23.55, "poids_total": 282.60, "densite": 7.85, "limite_elastique": 235, "resistance_traction": 360, "finition": "laminée à chaud", "norme": "EN 10025-2"}', NOW(), NOW());

-- Suite avec les autres épaisseurs et matériaux...
-- [Le script continuera avec S275JR, S355JR, les tôles inox, aluminium, spéciales et galvanisées]

-- ============================================================================
-- 2. TÔLES INOX LISSES
-- ============================================================================

INSERT INTO articles (
    reference, designation, description, type, status, famille, sous_famille,
    unite_stock, unite_achat, unite_vente, coefficient_achat, coefficient_vente,
    gere_en_stock, stock_mini, stock_maxi, stock_securite,
    prix_achat_standard, prix_vente_ht, taux_tva, taux_marge,
    poids, longueur, largeur, hauteur, caracteristiques_techniques,
    created_at, updated_at
) VALUES

-- Tôles 304L lisses - Épaisseur 0.5mm
('TOLE-304L-0.5-1000x2000', 'Tôle 304L lisse 0.5mm 1000x2000', 'Tôle inox lisse 304L épaisseur 0.5mm dimensions 1000x2000mm', 'MATIERE_PREMIERE', 'ACTIF', 'TOLES_PLAQUES', 'TOLE_LISSE', 'M2', 'PCS', 'PCS', 2.0, 2.0, true, 3, 30, 1, 125.50, 173.58, 20.0, 25.0, 8.00, 1000.0, 2000.0, 0.5,
 '{"materiau": "304L", "epaisseur": 0.5, "longueur": 1000, "largeur": 2000, "surface": 2.0, "poids_par_m2": 4.0, "poids_total": 8.0, "densite": 8.0, "limite_elastique": 210, "resistance_traction": 520, "finition": "laminée à froid", "norme": "EN 10088-2"}', NOW(), NOW()),

('TOLE-304L-0.5-1250x2500', 'Tôle 304L lisse 0.5mm 1250x2500', 'Tôle inox lisse 304L épaisseur 0.5mm dimensions 1250x2500mm', 'MATIERE_PREMIERE', 'ACTIF', 'TOLES_PLAQUES', 'TOLE_LISSE', 'M2', 'PCS', 'PCS', 3.125, 3.125, true, 3, 30, 1, 196.10, 271.17, 20.0, 25.0, 12.50, 1250.0, 2500.0, 0.5,
 '{"materiau": "304L", "epaisseur": 0.5, "longueur": 1250, "largeur": 2500, "surface": 3.125, "poids_par_m2": 4.0, "poids_total": 12.5, "densite": 8.0, "limite_elastique": 210, "resistance_traction": 520, "finition": "laminée à froid", "norme": "EN 10088-2"}', NOW(), NOW()),

('TOLE-304L-0.5-1500x3000', 'Tôle 304L lisse 0.5mm 1500x3000', 'Tôle inox lisse 304L épaisseur 0.5mm dimensions 1500x3000mm', 'MATIERE_PREMIERE', 'ACTIF', 'TOLES_PLAQUES', 'TOLE_LISSE', 'M2', 'PCS', 'PCS', 4.5, 4.5, true, 3, 30, 1, 282.75, 390.85, 20.0, 25.0, 18.00, 1500.0, 3000.0, 0.5,
 '{"materiau": "304L", "epaisseur": 0.5, "longueur": 1500, "largeur": 3000, "surface": 4.5, "poids_par_m2": 4.0, "poids_total": 18.0, "densite": 8.0, "limite_elastique": 210, "resistance_traction": 520, "finition": "laminée à froid", "norme": "EN 10088-2"}', NOW(), NOW()),

-- Tôles 304L lisses - Épaisseur 0.8mm
('TOLE-304L-0.8-1000x2000', 'Tôle 304L lisse 0.8mm 1000x2000', 'Tôle inox lisse 304L épaisseur 0.8mm dimensions 1000x2000mm', 'MATIERE_PREMIERE', 'ACTIF', 'TOLES_PLAQUES', 'TOLE_LISSE', 'M2', 'PCS', 'PCS', 2.0, 2.0, true, 3, 30, 1, 145.20, 200.78, 20.0, 25.0, 12.80, 1000.0, 2000.0, 0.8,
 '{"materiau": "304L", "epaisseur": 0.8, "longueur": 1000, "largeur": 2000, "surface": 2.0, "poids_par_m2": 6.4, "poids_total": 12.8, "densite": 8.0, "limite_elastique": 210, "resistance_traction": 520, "finition": "laminée à froid", "norme": "EN 10088-2"}', NOW(), NOW()),

('TOLE-304L-0.8-1250x2500', 'Tôle 304L lisse 0.8mm 1250x2500', 'Tôle inox lisse 304L épaisseur 0.8mm dimensions 1250x2500mm', 'MATIERE_PREMIERE', 'ACTIF', 'TOLES_PLAQUES', 'TOLE_LISSE', 'M2', 'PCS', 'PCS', 3.125, 3.125, true, 3, 30, 1, 227.00, 313.98, 20.0, 25.0, 20.00, 1250.0, 2500.0, 0.8,
 '{"materiau": "304L", "epaisseur": 0.8, "longueur": 1250, "largeur": 2500, "surface": 3.125, "poids_par_m2": 6.4, "poids_total": 20.0, "densite": 8.0, "limite_elastique": 210, "resistance_traction": 520, "finition": "laminée à froid", "norme": "EN 10088-2"}', NOW(), NOW()),

('TOLE-304L-0.8-1500x3000', 'Tôle 304L lisse 0.8mm 1500x3000', 'Tôle inox lisse 304L épaisseur 0.8mm dimensions 1500x3000mm', 'MATIERE_PREMIERE', 'ACTIF', 'TOLES_PLAQUES', 'TOLE_LISSE', 'M2', 'PCS', 'PCS', 4.5, 4.5, true, 3, 30, 1, 327.25, 452.73, 20.0, 25.0, 28.80, 1500.0, 3000.0, 0.8,
 '{"materiau": "304L", "epaisseur": 0.8, "longueur": 1500, "largeur": 3000, "surface": 4.5, "poids_par_m2": 6.4, "poids_total": 28.8, "densite": 8.0, "limite_elastique": 210, "resistance_traction": 520, "finition": "laminée à froid", "norme": "EN 10088-2"}', NOW(), NOW()),

-- Tôles 304L lisses - Épaisseur 1.0mm
('TOLE-304L-1.0-1000x2000', 'Tôle 304L lisse 1.0mm 1000x2000', 'Tôle inox lisse 304L épaisseur 1.0mm dimensions 1000x2000mm', 'MATIERE_PREMIERE', 'ACTIF', 'TOLES_PLAQUES', 'TOLE_LISSE', 'M2', 'PCS', 'PCS', 2.0, 2.0, true, 3, 30, 1, 162.50, 224.78, 20.0, 25.0, 16.00, 1000.0, 2000.0, 1.0,
 '{"materiau": "304L", "epaisseur": 1.0, "longueur": 1000, "largeur": 2000, "surface": 2.0, "poids_par_m2": 8.0, "poids_total": 16.0, "densite": 8.0, "limite_elastique": 210, "resistance_traction": 520, "finition": "laminée à froid", "norme": "EN 10088-2"}', NOW(), NOW()),

('TOLE-304L-1.0-1250x2500', 'Tôle 304L lisse 1.0mm 1250x2500', 'Tôle inox lisse 304L épaisseur 1.0mm dimensions 1250x2500mm', 'MATIERE_PREMIERE', 'ACTIF', 'TOLES_PLAQUES', 'TOLE_LISSE', 'M2', 'PCS', 'PCS', 3.125, 3.125, true, 3, 30, 1, 253.90, 351.47, 20.0, 25.0, 25.00, 1250.0, 2500.0, 1.0,
 '{"materiau": "304L", "epaisseur": 1.0, "longueur": 1250, "largeur": 2500, "surface": 3.125, "poids_par_m2": 8.0, "poids_total": 25.0, "densite": 8.0, "limite_elastique": 210, "resistance_traction": 520, "finition": "laminée à froid", "norme": "EN 10088-2"}', NOW(), NOW()),

('TOLE-304L-1.0-1500x3000', 'Tôle 304L lisse 1.0mm 1500x3000', 'Tôle inox lisse 304L épaisseur 1.0mm dimensions 1500x3000mm', 'MATIERE_PREMIERE', 'ACTIF', 'TOLES_PLAQUES', 'TOLE_LISSE', 'M2', 'PCS', 'PCS', 4.5, 4.5, true, 3, 30, 1, 366.25, 506.55, 20.0, 25.0, 36.00, 1500.0, 3000.0, 1.0,
 '{"materiau": "304L", "epaisseur": 1.0, "longueur": 1500, "largeur": 3000, "surface": 4.5, "poids_par_m2": 8.0, "poids_total": 36.0, "densite": 8.0, "limite_elastique": 210, "resistance_traction": 520, "finition": "laminée à froid", "norme": "EN 10088-2"}', NOW(), NOW()),

-- Tôles 316L lisses - Épaisseur 1.0mm
('TOLE-316L-1.0-1000x2000', 'Tôle 316L lisse 1.0mm 1000x2000', 'Tôle inox lisse 316L épaisseur 1.0mm dimensions 1000x2000mm', 'MATIERE_PREMIERE', 'ACTIF', 'TOLES_PLAQUES', 'TOLE_LISSE', 'M2', 'PCS', 'PCS', 2.0, 2.0, true, 3, 30, 1, 185.50, 256.70, 20.0, 25.0, 16.00, 1000.0, 2000.0, 1.0,
 '{"materiau": "316L", "epaisseur": 1.0, "longueur": 1000, "largeur": 2000, "surface": 2.0, "poids_par_m2": 8.0, "poids_total": 16.0, "densite": 8.0, "limite_elastique": 220, "resistance_traction": 520, "finition": "laminée à froid", "norme": "EN 10088-2"}', NOW(), NOW()),

('TOLE-316L-1.0-1250x2500', 'Tôle 316L lisse 1.0mm 1250x2500', 'Tôle inox lisse 316L épaisseur 1.0mm dimensions 1250x2500mm', 'MATIERE_PREMIERE', 'ACTIF', 'TOLES_PLAQUES', 'TOLE_LISSE', 'M2', 'PCS', 'PCS', 3.125, 3.125, true, 3, 30, 1, 289.70, 400.73, 20.0, 25.0, 25.00, 1250.0, 2500.0, 1.0,
 '{"materiau": "316L", "epaisseur": 1.0, "longueur": 1250, "largeur": 2500, "surface": 3.125, "poids_par_m2": 8.0, "poids_total": 25.0, "densite": 8.0, "limite_elastique": 220, "resistance_traction": 520, "finition": "laminée à froid", "norme": "EN 10088-2"}', NOW(), NOW()),

('TOLE-316L-1.0-1500x3000', 'Tôle 316L lisse 1.0mm 1500x3000', 'Tôle inox lisse 316L épaisseur 1.0mm dimensions 1500x3000mm', 'MATIERE_PREMIERE', 'ACTIF', 'TOLES_PLAQUES', 'TOLE_LISSE', 'M2', 'PCS', 'PCS', 4.5, 4.5, true, 3, 30, 1, 417.40, 577.73, 20.0, 25.0, 36.00, 1500.0, 3000.0, 1.0,
 '{"materiau": "316L", "epaisseur": 1.0, "longueur": 1500, "largeur": 3000, "surface": 4.5, "poids_par_m2": 8.0, "poids_total": 36.0, "densite": 8.0, "limite_elastique": 220, "resistance_traction": 520, "finition": "laminée à froid", "norme": "EN 10088-2"}', NOW(), NOW());

-- ============================================================================
-- 3. TÔLES ALUMINIUM LISSES
-- ============================================================================

INSERT INTO articles (
    reference, designation, description, type, status, famille, sous_famille,
    unite_stock, unite_achat, unite_vente, coefficient_achat, coefficient_vente,
    gere_en_stock, stock_mini, stock_maxi, stock_securite,
    prix_achat_standard, prix_vente_ht, taux_tva, taux_marge,
    poids, longueur, largeur, hauteur, caracteristiques_techniques,
    created_at, updated_at
) VALUES

-- Tôles 1050A lisses - Épaisseur 0.5mm
('TOLE-1050A-0.5-1000x2000', 'Tôle 1050A lisse 0.5mm 1000x2000', 'Tôle aluminium lisse 1050A épaisseur 0.5mm dimensions 1000x2000mm', 'MATIERE_PREMIERE', 'ACTIF', 'TOLES_PLAQUES', 'TOLE_LISSE', 'M2', 'PCS', 'PCS', 2.0, 2.0, true, 3, 30, 1, 45.50, 62.95, 20.0, 25.0, 2.70, 1000.0, 2000.0, 0.5,
 '{"materiau": "1050A", "epaisseur": 0.5, "longueur": 1000, "largeur": 2000, "surface": 2.0, "poids_par_m2": 1.35, "poids_total": 2.7, "densite": 2.7, "limite_elastique": 35, "resistance_traction": 75, "finition": "laminée", "norme": "EN 573-3"}', NOW(), NOW()),

('TOLE-1050A-0.5-1250x2500', 'Tôle 1050A lisse 0.5mm 1250x2500', 'Tôle aluminium lisse 1050A épaisseur 0.5mm dimensions 1250x2500mm', 'MATIERE_PREMIERE', 'ACTIF', 'TOLES_PLAQUES', 'TOLE_LISSE', 'M2', 'PCS', 'PCS', 3.125, 3.125, true, 3, 30, 1, 71.10, 98.27, 20.0, 25.0, 4.22, 1250.0, 2500.0, 0.5,
 '{"materiau": "1050A", "epaisseur": 0.5, "longueur": 1250, "largeur": 2500, "surface": 3.125, "poids_par_m2": 1.35, "poids_total": 4.22, "densite": 2.7, "limite_elastique": 35, "resistance_traction": 75, "finition": "laminée", "norme": "EN 573-3"}', NOW(), NOW()),

('TOLE-1050A-0.5-1500x3000', 'Tôle 1050A lisse 0.5mm 1500x3000', 'Tôle aluminium lisse 1050A épaisseur 0.5mm dimensions 1500x3000mm', 'MATIERE_PREMIERE', 'ACTIF', 'TOLES_PLAQUES', 'TOLE_LISSE', 'M2', 'PCS', 'PCS', 4.5, 4.5, true, 3, 30, 1, 102.40, 141.60, 20.0, 25.0, 6.08, 1500.0, 3000.0, 0.5,
 '{"materiau": "1050A", "epaisseur": 0.5, "longueur": 1500, "largeur": 3000, "surface": 4.5, "poids_par_m2": 1.35, "poids_total": 6.08, "densite": 2.7, "limite_elastique": 35, "resistance_traction": 75, "finition": "laminée", "norme": "EN 573-3"}', NOW(), NOW()),

-- Tôles 1050A lisses - Épaisseur 1.0mm
('TOLE-1050A-1.0-1000x2000', 'Tôle 1050A lisse 1.0mm 1000x2000', 'Tôle aluminium lisse 1050A épaisseur 1.0mm dimensions 1000x2000mm', 'MATIERE_PREMIERE', 'ACTIF', 'TOLES_PLAQUES', 'TOLE_LISSE', 'M2', 'PCS', 'PCS', 2.0, 2.0, true, 3, 30, 1, 68.50, 94.75, 20.0, 25.0, 5.40, 1000.0, 2000.0, 1.0,
 '{"materiau": "1050A", "epaisseur": 1.0, "longueur": 1000, "largeur": 2000, "surface": 2.0, "poids_par_m2": 2.7, "poids_total": 5.4, "densite": 2.7, "limite_elastique": 35, "resistance_traction": 75, "finition": "laminée", "norme": "EN 573-3"}', NOW(), NOW()),

('TOLE-1050A-1.0-1250x2500', 'Tôle 1050A lisse 1.0mm 1250x2500', 'Tôle aluminium lisse 1050A épaisseur 1.0mm dimensions 1250x2500mm', 'MATIERE_PREMIERE', 'ACTIF', 'TOLES_PLAQUES', 'TOLE_LISSE', 'M2', 'PCS', 'PCS', 3.125, 3.125, true, 3, 30, 1, 107.00, 147.98, 20.0, 25.0, 8.44, 1250.0, 2500.0, 1.0,
 '{"materiau": "1050A", "epaisseur": 1.0, "longueur": 1250, "largeur": 2500, "surface": 3.125, "poids_par_m2": 2.7, "poids_total": 8.44, "densite": 2.7, "limite_elastique": 35, "resistance_traction": 75, "finition": "laminée", "norme": "EN 573-3"}', NOW(), NOW()),

('TOLE-1050A-1.0-1500x3000', 'Tôle 1050A lisse 1.0mm 1500x3000', 'Tôle aluminium lisse 1050A épaisseur 1.0mm dimensions 1500x3000mm', 'MATIERE_PREMIERE', 'ACTIF', 'TOLES_PLAQUES', 'TOLE_LISSE', 'M2', 'PCS', 'PCS', 4.5, 4.5, true, 3, 30, 1, 154.25, 213.35, 20.0, 25.0, 12.15, 1500.0, 3000.0, 1.0,
 '{"materiau": "1050A", "epaisseur": 1.0, "longueur": 1500, "largeur": 3000, "surface": 4.5, "poids_par_m2": 2.7, "poids_total": 12.15, "densite": 2.7, "limite_elastique": 35, "resistance_traction": 75, "finition": "laminée", "norme": "EN 573-3"}', NOW(), NOW()),

-- Tôles 5754 lisses - Épaisseur 1.0mm
('TOLE-5754-1.0-1000x2000', 'Tôle 5754 lisse 1.0mm 1000x2000', 'Tôle aluminium lisse 5754 épaisseur 1.0mm dimensions 1000x2000mm', 'MATIERE_PREMIERE', 'ACTIF', 'TOLES_PLAQUES', 'TOLE_LISSE', 'M2', 'PCS', 'PCS', 2.0, 2.0, true, 3, 30, 1, 78.50, 108.58, 20.0, 25.0, 5.40, 1000.0, 2000.0, 1.0,
 '{"materiau": "5754", "epaisseur": 1.0, "longueur": 1000, "largeur": 2000, "surface": 2.0, "poids_par_m2": 2.7, "poids_total": 5.4, "densite": 2.7, "limite_elastique": 80, "resistance_traction": 190, "finition": "laminée", "norme": "EN 573-3"}', NOW(), NOW()),

('TOLE-5754-1.0-1250x2500', 'Tôle 5754 lisse 1.0mm 1250x2500', 'Tôle aluminium lisse 5754 épaisseur 1.0mm dimensions 1250x2500mm', 'MATIERE_PREMIERE', 'ACTIF', 'TOLES_PLAQUES', 'TOLE_LISSE', 'M2', 'PCS', 'PCS', 3.125, 3.125, true, 3, 30, 1, 122.80, 169.88, 20.0, 25.0, 8.44, 1250.0, 2500.0, 1.0,
 '{"materiau": "5754", "epaisseur": 1.0, "longueur": 1250, "largeur": 2500, "surface": 3.125, "poids_par_m2": 2.7, "poids_total": 8.44, "densite": 2.7, "limite_elastique": 80, "resistance_traction": 190, "finition": "laminée", "norme": "EN 573-3"}', NOW(), NOW()),

('TOLE-5754-1.0-1500x3000', 'Tôle 5754 lisse 1.0mm 1500x3000', 'Tôle aluminium lisse 5754 épaisseur 1.0mm dimensions 1500x3000mm', 'MATIERE_PREMIERE', 'ACTIF', 'TOLES_PLAQUES', 'TOLE_LISSE', 'M2', 'PCS', 'PCS', 4.5, 4.5, true, 3, 30, 1, 176.90, 244.70, 20.0, 25.0, 12.15, 1500.0, 3000.0, 1.0,
 '{"materiau": "5754", "epaisseur": 1.0, "longueur": 1500, "largeur": 3000, "surface": 4.5, "poids_par_m2": 2.7, "poids_total": 12.15, "densite": 2.7, "limite_elastique": 80, "resistance_traction": 190, "finition": "laminée", "norme": "EN 573-3"}', NOW(), NOW());

-- ============================================================================
-- 4. TÔLES SPÉCIALES ACIER
-- ============================================================================

INSERT INTO articles (
    reference, designation, description, type, status, famille, sous_famille,
    unite_stock, unite_achat, unite_vente, coefficient_achat, coefficient_vente,
    gere_en_stock, stock_mini, stock_maxi, stock_securite,
    prix_achat_standard, prix_vente_ht, taux_tva, taux_marge,
    poids, longueur, largeur, hauteur, caracteristiques_techniques,
    created_at, updated_at
) VALUES

-- Tôles larmées (Duett) S235JR - Épaisseur 2.0mm
('TOLE-S235JR-LARMEE-2.0-1250x2500', 'Tôle S235JR larmée 2.0mm 1250x2500', 'Tôle acier larmée (Duett) S235JR épaisseur 2.0mm dimensions 1250x2500mm', 'MATIERE_PREMIERE', 'ACTIF', 'TOLES_PLAQUES', 'TOLE_LARMEE', 'M2', 'PCS', 'PCS', 3.125, 3.125, true, 3, 30, 1, 85.20, 117.83, 20.0, 25.0, 49.06, 1250.0, 2500.0, 2.0,
 '{"materiau": "S235JR", "epaisseur": 2.0, "longueur": 1250, "largeur": 2500, "surface": 3.125, "poids_par_m2": 15.7, "poids_total": 49.06, "densite": 7.85, "limite_elastique": 235, "resistance_traction": 360, "finition": "larmée Duett", "antiderapant": true, "norme": "EN 10025-2"}', NOW(), NOW()),

('TOLE-S235JR-LARMEE-2.0-1500x3000', 'Tôle S235JR larmée 2.0mm 1500x3000', 'Tôle acier larmée (Duett) S235JR épaisseur 2.0mm dimensions 1500x3000mm', 'MATIERE_PREMIERE', 'ACTIF', 'TOLES_PLAQUES', 'TOLE_LARMEE', 'M2', 'PCS', 'PCS', 4.5, 4.5, true, 3, 30, 1, 122.80, 169.88, 20.0, 25.0, 70.65, 1500.0, 3000.0, 2.0,
 '{"materiau": "S235JR", "epaisseur": 2.0, "longueur": 1500, "largeur": 3000, "surface": 4.5, "poids_par_m2": 15.7, "poids_total": 70.65, "densite": 7.85, "limite_elastique": 235, "resistance_traction": 360, "finition": "larmée Duett", "antiderapant": true, "norme": "EN 10025-2"}', NOW(), NOW()),

-- Tôles larmées (Duett) S235JR - Épaisseur 3.0mm
('TOLE-S235JR-LARMEE-3.0-1250x2500', 'Tôle S235JR larmée 3.0mm 1250x2500', 'Tôle acier larmée (Duett) S235JR épaisseur 3.0mm dimensions 1250x2500mm', 'MATIERE_PREMIERE', 'ACTIF', 'TOLES_PLAQUES', 'TOLE_LARMEE', 'M2', 'PCS', 'PCS', 3.125, 3.125, true, 3, 30, 1, 115.20, 159.33, 20.0, 25.0, 73.59, 1250.0, 2500.0, 3.0,
 '{"materiau": "S235JR", "epaisseur": 3.0, "longueur": 1250, "largeur": 2500, "surface": 3.125, "poids_par_m2": 23.55, "poids_total": 73.59, "densite": 7.85, "limite_elastique": 235, "resistance_traction": 360, "finition": "larmée Duett", "antiderapant": true, "norme": "EN 10025-2"}', NOW(), NOW()),

('TOLE-S235JR-LARMEE-3.0-1500x3000', 'Tôle S235JR larmée 3.0mm 1500x3000', 'Tôle acier larmée (Duett) S235JR épaisseur 3.0mm dimensions 1500x3000mm', 'MATIERE_PREMIERE', 'ACTIF', 'TOLES_PLAQUES', 'TOLE_LARMEE', 'M2', 'PCS', 'PCS', 4.5, 4.5, true, 3, 30, 1, 166.00, 229.68, 20.0, 25.0, 105.98, 1500.0, 3000.0, 3.0,
 '{"materiau": "S235JR", "epaisseur": 3.0, "longueur": 1500, "largeur": 3000, "surface": 4.5, "poids_par_m2": 23.55, "poids_total": 105.98, "densite": 7.85, "limite_elastique": 235, "resistance_traction": 360, "finition": "larmée Duett", "antiderapant": true, "norme": "EN 10025-2"}', NOW(), NOW()),

-- Tôles gaufrées (Quintett) S235JR - Épaisseur 2.0mm
('TOLE-S235JR-GAUFREE-2.0-1250x2500', 'Tôle S235JR gaufrée 2.0mm 1250x2500', 'Tôle acier gaufrée (Quintett) S235JR épaisseur 2.0mm dimensions 1250x2500mm', 'MATIERE_PREMIERE', 'ACTIF', 'TOLES_PLAQUES', 'TOLE_GAUFREE', 'M2', 'PCS', 'PCS', 3.125, 3.125, true, 3, 30, 1, 88.50, 122.40, 20.0, 25.0, 49.06, 1250.0, 2500.0, 2.0,
 '{"materiau": "S235JR", "epaisseur": 2.0, "longueur": 1250, "largeur": 2500, "surface": 3.125, "poids_par_m2": 15.7, "poids_total": 49.06, "densite": 7.85, "limite_elastique": 235, "resistance_traction": 360, "finition": "gaufrée Quintett", "antiderapant": true, "norme": "EN 10025-2"}', NOW(), NOW()),

('TOLE-S235JR-GAUFREE-2.0-1500x3000', 'Tôle S235JR gaufrée 2.0mm 1500x3000', 'Tôle acier gaufrée (Quintett) S235JR épaisseur 2.0mm dimensions 1500x3000mm', 'MATIERE_PREMIERE', 'ACTIF', 'TOLES_PLAQUES', 'TOLE_GAUFREE', 'M2', 'PCS', 'PCS', 4.5, 4.5, true, 3, 30, 1, 127.50, 176.38, 20.0, 25.0, 70.65, 1500.0, 3000.0, 2.0,
 '{"materiau": "S235JR", "epaisseur": 2.0, "longueur": 1500, "largeur": 3000, "surface": 4.5, "poids_par_m2": 15.7, "poids_total": 70.65, "densite": 7.85, "limite_elastique": 235, "resistance_traction": 360, "finition": "gaufrée Quintett", "antiderapant": true, "norme": "EN 10025-2"}', NOW(), NOW()),

-- Tôles perforées Rv5-8 S235JR - Épaisseur 2.0mm
('TOLE-S235JR-PERFOREE-RV5-8-2.0-1250x2500', 'Tôle S235JR perforée Rv5-8 2.0mm 1250x2500', 'Tôle acier perforée Rv5-8 S235JR épaisseur 2.0mm dimensions 1250x2500mm', 'MATIERE_PREMIERE', 'ACTIF', 'TOLES_PLAQUES', 'TOLE_PERFOREE', 'M2', 'PCS', 'PCS', 3.125, 3.125, true, 3, 30, 1, 95.20, 131.68, 20.0, 25.0, 39.25, 1250.0, 2500.0, 2.0,
 '{"materiau": "S235JR", "epaisseur": 2.0, "longueur": 1250, "largeur": 2500, "surface": 3.125, "poids_par_m2": 12.56, "poids_total": 39.25, "densite": 7.85, "limite_elastique": 235, "resistance_traction": 360, "finition": "perforée Rv5-8", "diametre_trous": 5, "entraxe": 8, "surface_libre": 0.6, "norme": "EN 10025-2"}', NOW(), NOW()),

('TOLE-S235JR-PERFOREE-RV5-8-2.0-1500x3000', 'Tôle S235JR perforée Rv5-8 2.0mm 1500x3000', 'Tôle acier perforée Rv5-8 S235JR épaisseur 2.0mm dimensions 1500x3000mm', 'MATIERE_PREMIERE', 'ACTIF', 'TOLES_PLAQUES', 'TOLE_PERFOREE', 'M2', 'PCS', 'PCS', 4.5, 4.5, true, 3, 30, 1, 137.25, 189.79, 20.0, 25.0, 56.52, 1500.0, 3000.0, 2.0,
 '{"materiau": "S235JR", "epaisseur": 2.0, "longueur": 1500, "largeur": 3000, "surface": 4.5, "poids_par_m2": 12.56, "poids_total": 56.52, "densite": 7.85, "limite_elastique": 235, "resistance_traction": 360, "finition": "perforée Rv5-8", "diametre_trous": 5, "entraxe": 8, "surface_libre": 0.6, "norme": "EN 10025-2"}', NOW(), NOW()),

-- Tôles striées S235JR - Épaisseur 3.0mm
('TOLE-S235JR-STRIEE-3.0-1250x2500', 'Tôle S235JR striée 3.0mm 1250x2500', 'Tôle acier striée S235JR épaisseur 3.0mm dimensions 1250x2500mm', 'MATIERE_PREMIERE', 'ACTIF', 'TOLES_PLAQUES', 'TOLE_STRIEE', 'M2', 'PCS', 'PCS', 3.125, 3.125, true, 3, 30, 1, 118.50, 163.98, 20.0, 25.0, 73.59, 1250.0, 2500.0, 3.0,
 '{"materiau": "S235JR", "epaisseur": 3.0, "longueur": 1250, "largeur": 2500, "surface": 3.125, "poids_par_m2": 23.55, "poids_total": 73.59, "densite": 7.85, "limite_elastique": 235, "resistance_traction": 360, "finition": "striée", "antiderapant": true, "norme": "EN 10025-2"}', NOW(), NOW()),

('TOLE-S235JR-STRIEE-3.0-1500x3000', 'Tôle S235JR striée 3.0mm 1500x3000', 'Tôle acier striée S235JR épaisseur 3.0mm dimensions 1500x3000mm', 'MATIERE_PREMIERE', 'ACTIF', 'TOLES_PLAQUES', 'TOLE_STRIEE', 'M2', 'PCS', 'PCS', 4.5, 4.5, true, 3, 30, 1, 170.75, 236.33, 20.0, 25.0, 105.98, 1500.0, 3000.0, 3.0,
 '{"materiau": "S235JR", "epaisseur": 3.0, "longueur": 1500, "largeur": 3000, "surface": 4.5, "poids_par_m2": 23.55, "poids_total": 105.98, "densite": 7.85, "limite_elastique": 235, "resistance_traction": 360, "finition": "striée", "antiderapant": true, "norme": "EN 10025-2"}', NOW(), NOW());

-- ============================================================================
-- 5. TÔLES GALVANISÉES
-- ============================================================================

INSERT INTO articles (
    reference, designation, description, type, status, famille, sous_famille,
    unite_stock, unite_achat, unite_vente, coefficient_achat, coefficient_vente,
    gere_en_stock, stock_mini, stock_maxi, stock_securite,
    prix_achat_standard, prix_vente_ht, taux_tva, taux_marge,
    poids, longueur, largeur, hauteur, caracteristiques_techniques,
    created_at, updated_at
) VALUES

-- Tôles galvanisées Z275 S235JR - Épaisseur 0.75mm
('TOLE-S235JR-GALVA-0.75-1250x2500', 'Tôle S235JR galvanisée Z275 0.75mm 1250x2500', 'Tôle acier galvanisée Z275 S235JR épaisseur 0.75mm dimensions 1250x2500mm', 'MATIERE_PREMIERE', 'ACTIF', 'TOLES_PLAQUES', 'TOLE_GALVANISEE', 'M2', 'PCS', 'PCS', 3.125, 3.125, true, 3, 30, 1, 48.20, 66.68, 20.0, 25.0, 19.24, 1250.0, 2500.0, 0.75,
 '{"materiau": "S235JR", "epaisseur": 0.75, "longueur": 1250, "largeur": 2500, "surface": 3.125, "poids_par_m2": 6.16, "poids_total": 19.24, "densite": 7.85, "limite_elastique": 235, "resistance_traction": 360, "finition": "galvanisée Z275", "revetement": "275g/m²", "protection_corrosion": "excellente", "norme": "EN 10346"}', NOW(), NOW()),

('TOLE-S235JR-GALVA-0.75-1500x3000', 'Tôle S235JR galvanisée Z275 0.75mm 1500x3000', 'Tôle acier galvanisée Z275 S235JR épaisseur 0.75mm dimensions 1500x3000mm', 'MATIERE_PREMIERE', 'ACTIF', 'TOLES_PLAQUES', 'TOLE_GALVANISEE', 'M2', 'PCS', 'PCS', 4.5, 4.5, true, 3, 30, 1, 69.50, 96.15, 20.0, 25.0, 27.72, 1500.0, 3000.0, 0.75,
 '{"materiau": "S235JR", "epaisseur": 0.75, "longueur": 1500, "largeur": 3000, "surface": 4.5, "poids_par_m2": 6.16, "poids_total": 27.72, "densite": 7.85, "limite_elastique": 235, "resistance_traction": 360, "finition": "galvanisée Z275", "revetement": "275g/m²", "protection_corrosion": "excellente", "norme": "EN 10346"}', NOW(), NOW()),

-- Tôles galvanisées Z275 S235JR - Épaisseur 1.0mm
('TOLE-S235JR-GALVA-1.0-1250x2500', 'Tôle S235JR galvanisée Z275 1.0mm 1250x2500', 'Tôle acier galvanisée Z275 S235JR épaisseur 1.0mm dimensions 1250x2500mm', 'MATIERE_PREMIERE', 'ACTIF', 'TOLES_PLAQUES', 'TOLE_GALVANISEE', 'M2', 'PCS', 'PCS', 3.125, 3.125, true, 3, 30, 1, 56.80, 78.58, 20.0, 25.0, 25.36, 1250.0, 2500.0, 1.0,
 '{"materiau": "S235JR", "epaisseur": 1.0, "longueur": 1250, "largeur": 2500, "surface": 3.125, "poids_par_m2": 8.115, "poids_total": 25.36, "densite": 7.85, "limite_elastique": 235, "resistance_traction": 360, "finition": "galvanisée Z275", "revetement": "275g/m²", "protection_corrosion": "excellente", "norme": "EN 10346"}', NOW(), NOW()),

('TOLE-S235JR-GALVA-1.0-1500x3000', 'Tôle S235JR galvanisée Z275 1.0mm 1500x3000', 'Tôle acier galvanisée Z275 S235JR épaisseur 1.0mm dimensions 1500x3000mm', 'MATIERE_PREMIERE', 'ACTIF', 'TOLES_PLAQUES', 'TOLE_GALVANISEE', 'M2', 'PCS', 'PCS', 4.5, 4.5, true, 3, 30, 1, 81.90, 113.33, 20.0, 25.0, 36.52, 1500.0, 3000.0, 1.0,
 '{"materiau": "S235JR", "epaisseur": 1.0, "longueur": 1500, "largeur": 3000, "surface": 4.5, "poids_par_m2": 8.115, "poids_total": 36.52, "densite": 7.85, "limite_elastique": 235, "resistance_traction": 360, "finition": "galvanisée Z275", "revetement": "275g/m²", "protection_corrosion": "excellente", "norme": "EN 10346"}', NOW(), NOW()),

-- Tôles galvanisées Z275 S235JR - Épaisseur 1.5mm
('TOLE-S235JR-GALVA-1.5-1250x2500', 'Tôle S235JR galvanisée Z275 1.5mm 1250x2500', 'Tôle acier galvanisée Z275 S235JR épaisseur 1.5mm dimensions 1250x2500mm', 'MATIERE_PREMIERE', 'ACTIF', 'TOLES_PLAQUES', 'TOLE_GALVANISEE', 'M2', 'PCS', 'PCS', 3.125, 3.125, true, 3, 30, 1, 76.50, 105.83, 20.0, 25.0, 38.52, 1250.0, 2500.0, 1.5,
 '{"materiau": "S235JR", "epaisseur": 1.5, "longueur": 1250, "largeur": 2500, "surface": 3.125, "poids_par_m2": 12.335, "poids_total": 38.52, "densite": 7.85, "limite_elastique": 235, "resistance_traction": 360, "finition": "galvanisée Z275", "revetement": "275g/m²", "protection_corrosion": "excellente", "norme": "EN 10346"}', NOW(), NOW()),

('TOLE-S235JR-GALVA-1.5-1500x3000', 'Tôle S235JR galvanisée Z275 1.5mm 1500x3000', 'Tôle acier galvanisée Z275 S235JR épaisseur 1.5mm dimensions 1500x3000mm', 'MATIERE_PREMIERE', 'ACTIF', 'TOLES_PLAQUES', 'TOLE_GALVANISEE', 'M2', 'PCS', 'PCS', 4.5, 4.5, true, 3, 30, 1, 110.25, 152.59, 20.0, 25.0, 55.51, 1500.0, 3000.0, 1.5,
 '{"materiau": "S235JR", "epaisseur": 1.5, "longueur": 1500, "largeur": 3000, "surface": 4.5, "poids_par_m2": 12.335, "poids_total": 55.51, "densite": 7.85, "limite_elastique": 235, "resistance_traction": 360, "finition": "galvanisée Z275", "revetement": "275g/m²", "protection_corrosion": "excellente", "norme": "EN 10346"}', NOW(), NOW()),

-- Tôles galvanisées Z275 S235JR - Épaisseur 2.0mm
('TOLE-S235JR-GALVA-2.0-1250x2500', 'Tôle S235JR galvanisée Z275 2.0mm 1250x2500', 'Tôle acier galvanisée Z275 S235JR épaisseur 2.0mm dimensions 1250x2500mm', 'MATIERE_PREMIERE', 'ACTIF', 'TOLES_PLAQUES', 'TOLE_GALVANISEE', 'M2', 'PCS', 'PCS', 3.125, 3.125, true, 3, 30, 1, 91.50, 126.58, 20.0, 25.0, 51.35, 1250.0, 2500.0, 2.0,
 '{"materiau": "S235JR", "epaisseur": 2.0, "longueur": 1250, "largeur": 2500, "surface": 3.125, "poids_par_m2": 16.435, "poids_total": 51.35, "densite": 7.85, "limite_elastique": 235, "resistance_traction": 360, "finition": "galvanisée Z275", "revetement": "275g/m²", "protection_corrosion": "excellente", "norme": "EN 10346"}', NOW(), NOW()),

('TOLE-S235JR-GALVA-2.0-1500x3000', 'Tôle S235JR galvanisée Z275 2.0mm 1500x3000', 'Tôle acier galvanisée Z275 S235JR épaisseur 2.0mm dimensions 1500x3000mm', 'MATIERE_PREMIERE', 'ACTIF', 'TOLES_PLAQUES', 'TOLE_GALVANISEE', 'M2', 'PCS', 'PCS', 4.5, 4.5, true, 3, 30, 1, 131.85, 182.43, 20.0, 25.0, 73.96, 1500.0, 3000.0, 2.0,
 '{"materiau": "S235JR", "epaisseur": 2.0, "longueur": 1500, "largeur": 3000, "surface": 4.5, "poids_par_m2": 16.435, "poids_total": 73.96, "densite": 7.85, "limite_elastique": 235, "resistance_traction": 360, "finition": "galvanisée Z275", "revetement": "275g/m²", "protection_corrosion": "excellente", "norme": "EN 10346"}', NOW(), NOW()),

-- Tôles galvanisées Z275 S235JR - Épaisseur 3.0mm
('TOLE-S235JR-GALVA-3.0-1250x2500', 'Tôle S235JR galvanisée Z275 3.0mm 1250x2500', 'Tôle acier galvanisée Z275 S235JR épaisseur 3.0mm dimensions 1250x2500mm', 'MATIERE_PREMIERE', 'ACTIF', 'TOLES_PLAQUES', 'TOLE_GALVANISEE', 'M2', 'PCS', 'PCS', 3.125, 3.125, true, 3, 30, 1, 125.80, 173.93, 20.0, 25.0, 77.01, 1250.0, 2500.0, 3.0,
 '{"materiau": "S235JR", "epaisseur": 3.0, "longueur": 1250, "largeur": 2500, "surface": 3.125, "poids_par_m2": 24.655, "poids_total": 77.01, "densite": 7.85, "limite_elastique": 235, "resistance_traction": 360, "finition": "galvanisée Z275", "revetement": "275g/m²", "protection_corrosion": "excellente", "norme": "EN 10346"}', NOW(), NOW()),

('TOLE-S235JR-GALVA-3.0-1500x3000', 'Tôle S235JR galvanisée Z275 3.0mm 1500x3000', 'Tôle acier galvanisée Z275 S235JR épaisseur 3.0mm dimensions 1500x3000mm', 'MATIERE_PREMIERE', 'ACTIF', 'TOLES_PLAQUES', 'TOLE_GALVANISEE', 'M2', 'PCS', 'PCS', 4.5, 4.5, true, 3, 30, 1, 181.25, 250.73, 20.0, 25.0, 110.95, 1500.0, 3000.0, 3.0,
 '{"materiau": "S235JR", "epaisseur": 3.0, "longueur": 1500, "largeur": 3000, "surface": 4.5, "poids_par_m2": 24.655, "poids_total": 110.95, "densite": 7.85, "limite_elastique": 235, "resistance_traction": 360, "finition": "galvanisée Z275", "revetement": "275g/m²", "protection_corrosion": "excellente", "norme": "EN 10346"}', NOW(), NOW());

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
WHERE famille = 'TOLES_PLAQUES'
GROUP BY sous_famille
ORDER BY sous_famille;

-- Message de fin
SELECT 'Script d''injection des tôles métalliques terminé avec succès !' as message;
SELECT CONCAT('Total d''articles tôles ajoutés: ', COUNT(*)) as total_ajoute 
FROM articles 
WHERE famille = 'TOLES_PLAQUES';