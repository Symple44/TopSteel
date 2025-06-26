-- =========================================================================
-- ERP TOPSTEEL - DONNÉES D'EXEMPLE RÉALISTES
-- Fichier: sql/seeds/01-sample-data.sql
-- =========================================================================

-- =====================================================
-- UTILISATEURS TOPSTEEL
-- =====================================================

-- Mot de passe : password123 (hashhé avec bcrypt)
INSERT INTO users (email, password, nom, prenom, role, telephone, is_active) VALUES
('admin@topsteel.fr', '$2b$10$5kPNr2kfLGR8zKn3aB6Ziu5HBkGZfC3xGKGGWZXZQKYjpZ8sXZ2Aq', 'Administrateur', 'Système', 'ADMIN', '0478123456', true),
('direction@topsteel.fr', '$2b$10$5kPNr2kfLGR8zKn3aB6Ziu5HBkGZfC3xGKGGWZXZQKYjpZ8sXZ2Aq', 'Durand', 'Michel', 'MANAGER', '0478123457', true),
('commercial@topsteel.fr', '$2b$10$5kPNr2kfLGR8zKn3aB6Ziu5HBkGZfC3xGKGGWZXZQKYjpZ8sXZ2Aq', 'Martin', 'Sophie', 'COMMERCIAL', '0478123458', true),
('technique@topsteel.fr', '$2b$10$5kPNr2kfLGR8zKn3aB6Ziu5HBkGZfC3xGKGGWZXZQKYjpZ8sXZ2Aq', 'Lemoine', 'Pierre', 'TECHNICIEN', '0478123459', true),
('comptable@topsteel.fr', '$2b$10$5kPNr2kfLGR8zKn3aB6Ziu5HBkGZfC3xGKGGWZXZQKYjpZ8sXZ2Aq', 'Rousseau', 'Marie', 'COMPTABLE', '0478123460', true),
('atelier@topsteel.fr', '$2b$10$5kPNr2kfLGR8zKn3aB6Ziu5HBkGZfC3xGKGGWZXZQKYjpZ8sXZ2Aq', 'Moreau', 'Jean', 'TECHNICIEN', '0478123461', true)
ON CONFLICT (email) DO NOTHING;

-- =====================================================
-- CLIENTS DIVERSIFIÉS
-- =====================================================

INSERT INTO clients (type, nom, email, telephone, siret, tva_intra, adresse, contact_principal, notes, credit_limite) VALUES
-- Clients professionnels
('PROFESSIONNEL', 'Constructeur Lyonnais SARL', 'contact@constructeur-lyonnais.fr', '0478901234', '12345678901234', 'FR12345678901', 
 '{"rue": "25 Avenue de la Construction", "ville": "Lyon", "cp": "69007", "pays": "France"}',
 '{"nom": "Dubois", "prenom": "François", "fonction": "Responsable achats", "email": "f.dubois@constructeur-lyonnais.fr"}',
 'Client fidèle depuis 5 ans. Spécialisé dans les résidences haut de gamme.', 100000.00),

('PROFESSIONNEL', 'Immobilière des Alpes', 'commandes@immo-alpes.com', '0476543210', '98765432109876', 'FR98765432109',
 '{"rue": "15 Rue de la Montagne", "ville": "Grenoble", "cp": "38000", "pays": "France"}',
 '{"nom": "Vasseur", "prenom": "Catherine", "fonction": "Directrice projets", "email": "c.vasseur@immo-alpes.com"}',
 'Spécialisé dans les chalets et résidences de montagne. Commandes importantes.', 150000.00),

('PROFESSIONNEL', 'Aménagement Urbain Plus', 'contact@amenagement-urbain.fr', '0472345678', '55443322110987', 'FR55443322110',
 '{"rue": "8 Boulevard de l''Urbanisme", "ville": "Villeurbanne", "cp": "69100", "pays": "France"}',
 '{"nom": "Leroy", "prenom": "Antoine", "fonction": "Chef de projet", "email": "a.leroy@amenagement-urbain.fr"}',
 'Spécialisé aménagements urbains, parcs et espaces publics.', 80000.00),

-- Collectivités
('COLLECTIVITE', 'Mairie de Saint-Étienne', 'services.techniques@mairie-saint-etienne.fr', '0477123456', '21420185600013', 'FR21420185600',
 '{"rue": "Place de l''Hôtel de Ville", "ville": "Saint-Étienne", "cp": "42000", "pays": "France"}',
 '{"nom": "Blanc", "prenom": "Christophe", "fonction": "Responsable services techniques", "email": "c.blanc@mairie-saint-etienne.fr"}',
 'Projets publics : écoles, parcs, équipements sportifs.', 200000.00),

('COLLECTIVITE', 'Communauté de Communes du Beaujolais', 'cc.beaujolais@territoire.fr', '0474567890', '21691234567890', 'FR21691234567',
 '{"rue": "12 Route des Vignobles", "ville": "Belleville-en-Beaujolais", "cp": "69220", "pays": "France"}',
 '{"nom": "Girard", "prenom": "Sylvie", "fonction": "Directrice équipements", "email": "s.girard@territoire.fr"}',
 'Équipements intercommunaux, aires de jeux, mobilier urbain.', 120000.00),

-- Particuliers haut de gamme
('PARTICULIER', 'M. et Mme BERNARD', 'contact@villa-bernard.fr', '0675432109', NULL, NULL,
 '{"rue": "Villa Les Cèdres, 45 Chemin des Hauteurs", "ville": "Caluire-et-Cuire", "cp": "69300", "pays": "France"}',
 '{"nom": "Bernard", "prenom": "Philippe", "email": "p.bernard@villa-bernard.fr"}',
 'Villa de prestige. Portails et garde-corps sur mesure, budget conséquent.', 50000.00),

('PARTICULIER', 'Famille ROUSSEAU', 'rousseau.renovation@gmail.com', '0623456789', NULL, NULL,
 '{"rue": "25 Avenue du Parc", "ville": "Lyon 6ème", "cp": "69006", "pays": "France"}',
 '{"nom": "Rousseau", "prenom": "Caroline", "email": "rousseau.renovation@gmail.com"}',
 'Rénovation maison bourgeoise. Escalier métallique et verrière.', 30000.00),

-- Associations
('ASSOCIATION', 'Association Sportive Métropole Lyon', 'technique@sport-metropole.org', '0478234567', '39812345678901', 'FR39812345678',
 '{"rue": "Stadium Complex, 50 Avenue du Sport", "ville": "Décines-Charpieu", "cp": "69150", "pays": "France"}',
 '{"nom": "Dumont", "prenom": "Eric", "fonction": "Responsable infrastructure", "email": "e.dumont@sport-metropole.org"}',
 'Équipements sportifs : clôtures terrains, structures métalliques.', 75000.00)

ON CONFLICT (siret) DO NOTHING;

-- =====================================================
-- FOURNISSEURS MÉTALLURGIE
-- =====================================================

INSERT INTO fournisseurs (nom, email, telephone, adresse, siret, actif) VALUES
('Acier Rhône-Alpes', 'commercial@acier-rhone-alpes.fr', '0478345678', '15 Zone Industrielle de Gerland, Lyon 69007', '12365478901234', true),
('Métaux Précision Plus', 'commandes@metaux-precision.com', '0476234567', '8 Rue de la Métallurgie, Grenoble 38000', '98732165498765', true),
('Profilés Expert Lyon', 'contact@profiles-expert.fr', '0472567890', 'ZI Chassieu, 22 Avenue des Profilés, Chassieu 69680', '55512378954623', true),
('Quincaillerie Pro Bâtiment', 'pro@quincaillerie-batiment.fr', '0478678901', '35 Boulevard de l''Industrie, Vénissieux 69200', '78945612378945', true),
('Tubes et Structures SA', 'ventes@tubes-structures.com', '0477789012', '12 Parc d''activité de Saint-Priest, Saint-Priest 69800', '85274196357421', true),
('Visserie Spécialisée Rhône', 'info@visserie-rhone.fr', '0474890123', '5 Route de l''Artisanat, Villefranche-sur-Saône 69400', '95175348628524', true)
ON CONFLICT (email) DO NOTHING;

-- =====================================================
-- PRODUITS MÉTALLURGIE TOPSTEEL
-- =====================================================

INSERT INTO produits (code, nom, description, categorie, unite, prix_achat, prix_vente, stock_actuel, stock_minimum, stock_maximum, fournisseur_principal_id, actif, notes) VALUES
-- Profilés
('PROF-IPE-200', 'Poutrelle IPE 200', 'Poutrelle IPE 200x100x5.6mm, acier S235JR', 'PROFILE', 'ML', 45.50, 68.25, 150.5, 50.0, 500.0, 1, true, 'Standard charpente métallique'),
('PROF-HEA-160', 'Profilé HEA 160', 'Profilé HEA 160x82x7.5mm, acier S235JR', 'PROFILE', 'ML', 38.20, 57.30, 89.2, 30.0, 300.0, 1, true, 'Poteaux et structures'),
('PROF-UPN-120', 'Profilé UPN 120', 'Profilé UPN 120x55x7mm, acier S235JR', 'PROFILE', 'ML', 22.80, 34.20, 234.5, 40.0, 400.0, 1, true, 'Cadres et châssis'),
('PROF-CORNIERE-50', 'Cornière 50x50x5', 'Cornière égale 50x50x5mm, acier S235JR', 'PROFILE', 'ML', 12.45, 18.68, 445.8, 100.0, 800.0, 1, true, 'Renforts et structures'),

-- Tôles
('TOLE-ACIER-3MM', 'Tôle acier 3mm', 'Tôle acier S235JR épaisseur 3mm, 2000x1000mm', 'TOLE', 'M2', 28.50, 42.75, 45.8, 20.0, 200.0, 1, true, 'Découpe plasma et oxycoupage'),
('TOLE-ACIER-5MM', 'Tôle acier 5mm', 'Tôle acier S235JR épaisseur 5mm, 2000x1000mm', 'TOLE', 'M2', 47.50, 71.25, 32.4, 15.0, 150.0, 1, true, 'Pièces de forte épaisseur'),
('TOLE-PERFOREE-2MM', 'Tôle perforée 2mm', 'Tôle perforée décorative 2mm, perforations Ø5mm', 'TOLE', 'M2', 38.90, 58.35, 28.6, 10.0, 100.0, 2, true, 'Garde-corps design'),

-- Tubes
('TUBE-CARRE-40X40', 'Tube carré 40x40x3', 'Tube carré 40x40x3mm, acier S235JR', 'TUBE', 'ML', 15.80, 23.70, 156.2, 50.0, 400.0, 3, true, 'Structures légères'),
('TUBE-RECT-80X40', 'Tube rectangulaire 80x40x3', 'Tube rectangulaire 80x40x3mm, acier S235JR', 'TUBE', 'ML', 22.40, 33.60, 98.7, 40.0, 300.0, 3, true, 'Cadres et ossatures'),
('TUBE-ROND-42', 'Tube rond Ø42x3', 'Tube rond diamètre 42mm épaisseur 3mm', 'TUBE', 'ML', 18.60, 27.90, 67.3, 30.0, 250.0, 3, true, 'Rampes et main-courantes'),

-- Quincaillerie
('QUINC-VIS-M8', 'Vis inox M8x40', 'Vis à tête hexagonale M8x40mm, inox A2', 'QUINCAILLERIE', 'PIECE', 0.85, 1.53, 2450, 500, 5000, 4, true, 'Fixations inox'),
('QUINC-CHEV-M12', 'Cheville chimique M12', 'Cheville chimique scellement M12x110mm', 'QUINCAILLERIE', 'PIECE', 2.80, 5.04, 156, 50, 500, 4, true, 'Fixation béton'),
('QUINC-SOUDURE-316L', 'Électrode inox 316L', 'Électrode soudage inox 316L diamètre 2.5mm', 'CONSOMMABLE', 'KG', 18.50, 33.30, 45.8, 10.0, 100.0, 5, true, 'Soudage inox'),

-- Accessoires
('ACC-GOND-PORTAIL', 'Gond portail lourd', 'Gond pour portail lourd, capacité 150kg par gond', 'ACCESSOIRE', 'PIECE', 45.80, 82.44, 24, 10, 50, 4, true, 'Portails battants'),
('ACC-SERRURE-3POINTS', 'Serrure 3 points portail', 'Serrure 3 points avec cylindre européen', 'ACCESSOIRE', 'PIECE', 125.00, 225.00, 8, 5, 25, 4, true, 'Sécurité portails'),
('ACC-AUTOMATISME', 'Automatisme portail coulissant', 'Moteur portail coulissant jusqu''à 600kg', 'ACCESSOIRE', 'PIECE', 380.00, 684.00, 3, 2, 10, 6, true, 'Motorisation'),

-- Outillage
('OUTIL-DISQUE-125', 'Disque à tronçonner 125mm', 'Disque tronçonnage métal 125x1.6mm', 'OUTILLAGE', 'PIECE', 3.20, 6.40, 85, 20, 200, 5, true, 'Consommable atelier'),
('OUTIL-FORET-HSS', 'Forets HSS série métaux', 'Coffret forets HSS Ø1-13mm, série métaux', 'OUTILLAGE', 'PIECE', 28.50, 57.00, 5, 2, 15, 5, true, 'Outillage perçage')

ON CONFLICT (code) DO NOTHING;

-- =====================================================
-- PROJETS RÉALISTES TOPSTEEL
-- =====================================================

-- Récupérer les IDs pour les relations
DO $$
DECLARE
    client_constructeur_id uuid;
    client_mairie_id uuid;
    client_bernard_id uuid;
    client_immobiliere_id uuid;
    user_commercial_id uuid;
    user_technique_id uuid;
    user_manager_id uuid;
BEGIN
    -- Récupérer les IDs clients
    SELECT id INTO client_constructeur_id FROM clients WHERE nom = 'Constructeur Lyonnais SARL';
    SELECT id INTO client_mairie_id FROM clients WHERE nom = 'Mairie de Saint-Étienne';
    SELECT id INTO client_bernard_id FROM clients WHERE nom = 'M. et Mme BERNARD';
    SELECT id INTO client_immobiliere_id FROM clients WHERE nom = 'Immobilière des Alpes';
    
    -- Récupérer les IDs utilisateurs
    SELECT id INTO user_commercial_id FROM users WHERE email = 'commercial@topsteel.fr';
    SELECT id INTO user_technique_id FROM users WHERE email = 'technique@topsteel.fr';
    SELECT id INTO user_manager_id FROM users WHERE email = 'direction@topsteel.fr';
    
    -- Insérer les projets
    INSERT INTO projets (nom, description, type, statut, priorite, client_id, responsable_id, date_debut, date_fin_prevue, budget_estime, cout_reel, avancement_pct, adresse_chantier, notes) VALUES
    
    ('Résidence Les Jardins - Portails', 
     'Fabrication et pose de 12 portails coulissants pour residence haut de gamme. Portails 4m largeur, hauteur 1.8m, motorises avec visiophones.',
     'PORTAIL', 'EN_COURS', 'HAUTE', client_constructeur_id, user_technique_id,
     '2025-01-15', '2025-03-30', 45600.00, 28750.00, 65,
     '{"rue": "Résidence Les Jardins, Allée des Roses", "ville": "Lyon 6ème", "cp": "69006", "pays": "France"}',
     'Projet prestige. Finition thermolaquee RAL 7016. Attention delais serres.'),
    
    ('École Primaire Fauriel - Clôtures sécurisées',
     'Clôture perimétrique ecole primaire : 280ml de cloture H=2.20m avec portillons securises et portail vehicules.',
     'CLOTURE', 'ACCEPTE', 'URGENTE', client_mairie_id, user_technique_id,
     '2025-02-01', '2025-04-15', 32400.00, 0.00, 0,
     '{"rue": "École Primaire Fauriel, 15 Rue de l''École", "ville": "Saint-Étienne", "cp": "42000", "pays": "France"}',
     'Marche public. Respect normes ERP. Finition galvanisee + thermolaquage.'),
    
    ('Villa Les Cèdres - Escalier design',
     'Escalier metallique design avec garde-corps verre. Structure acier thermolaque, marches bois massif, garde-corps verre securit.',
     'ESCALIER', 'EN_COURS', 'NORMALE', client_bernard_id, user_commercial_id,
     '2024-12-10', '2025-02-28', 28500.00, 18200.00, 80,
     '{"rue": "Villa Les Cèdres, 45 Chemin des Hauteurs", "ville": "Caluire-et-Cuire", "cp": "69300", "pays": "France"}',
     'Client exigeant. Finition soignee. Escalier helicoidal sur mesure.'),
    
    ('Chalet Alpe d''Huez - Garde-corps terrasses',
     'Garde-corps metalliques pour terrasses panoramiques. 85ml de garde-corps design montagne, resistance neige et gel.',
     'GARDE_CORPS', 'DEVIS', 'NORMALE', client_immobiliere_id, user_commercial_id,
     NULL, '2025-05-30', 15800.00, 0.00, 0,
     '{"rue": "Résidence Le Panoramic, Route de l''Alpe", "ville": "Huez", "cp": "38750", "pays": "France"}',
     'Contraintes montagne. Materiaux resistants UV et corrosion.'),
    
    ('Verrière Atelier Confluence',
     'Verriere style industriel pour loft. Structure acier patine, verres feuilletees, ouvertures oscillo-battantes.',
     'VERRIERE', 'TERMINE', 'BASSE', client_constructeur_id, user_technique_id,
     '2024-10-15', '2024-12-20', 18900.00, 19350.00, 100,
     '{"rue": "Loft Confluence, 8 Quai des Docks", "ville": "Lyon 2ème", "cp": "69002", "pays": "France"}',
     'Projet termine. Petit depassement budget mais client satisfait.')
    
    ON CONFLICT (numero) DO NOTHING;

END $$;

-- =====================================================
-- DEVIS CORRESPONDANTS
-- =====================================================

DO $$
DECLARE
    projet_record RECORD;
BEGIN
    FOR projet_record IN 
        SELECT id, nom, client_id, budget_estime, statut 
        FROM projets 
        WHERE numero IS NOT NULL
    LOOP
        INSERT INTO devis (projet_id, client_id, redacteur_id, statut, date_emission, date_validite, montant_ht, taux_tva, montant_ttc, notes)
        SELECT 
            projet_record.id,
            projet_record.client_id,
            u.id,
            CASE 
                WHEN projet_record.statut = 'TERMINE' THEN 'ACCEPTE'::devis_statut
                WHEN projet_record.statut IN ('EN_COURS', 'ACCEPTE') THEN 'ACCEPTE'::devis_statut
                WHEN projet_record.statut = 'DEVIS' THEN 'ENVOYE'::devis_statut
                ELSE 'BROUILLON'::devis_statut
            END,
            CASE 
                WHEN projet_record.statut = 'TERMINE' THEN CURRENT_DATE - INTERVAL '90 days'
                WHEN projet_record.statut IN ('EN_COURS', 'ACCEPTE') THEN CURRENT_DATE - INTERVAL '30 days'
                ELSE CURRENT_DATE - INTERVAL '5 days'
            END,
            CASE 
                WHEN projet_record.statut = 'DEVIS' THEN CURRENT_DATE + INTERVAL '25 days'
                ELSE CURRENT_DATE - INTERVAL '5 days'
            END,
            projet_record.budget_estime / 1.20, -- HT
            20.00, -- TVA
            projet_record.budget_estime, -- TTC
            'Devis detaille fourni. Conditions de paiement : 30% a la commande, 40% a la livraison, 30% a la reception.'
        FROM users u 
        WHERE u.email = 'commercial@topsteel.fr'
        ON CONFLICT (numero) DO NOTHING;
    END LOOP;
END $$;

-- =====================================================
-- QUELQUES MOUVEMENTS DE STOCK
-- =====================================================

DO $$
DECLARE
    produit_record RECORD;
    user_id uuid;
    projet_id uuid;
BEGIN
    SELECT id INTO user_id FROM users WHERE email = 'technique@topsteel.fr';
    SELECT id INTO projet_id FROM projets WHERE nom LIKE 'Résidence Les Jardins%' LIMIT 1;
    
    -- Mouvement de sortie pour projet en cours
    FOR produit_record IN 
        SELECT id, code FROM produits WHERE code IN ('PROF-IPE-200', 'TUBE-CARRE-40X40', 'QUINC-VIS-M8') 
    LOOP
        INSERT INTO mouvements_stock (produit_id, type, quantite, reference_document, commentaire, effectue_par, projet_id)
        VALUES 
        (produit_record.id, 'SORTIE', 
         CASE 
            WHEN produit_record.code = 'PROF-IPE-200' THEN 25.5
            WHEN produit_record.code = 'TUBE-CARRE-40X40' THEN 48.0
            WHEN produit_record.code = 'QUINC-VIS-M8' THEN 150
         END,
         'BL-2025-001', 
         'Sortie matériaux pour projet ' || (SELECT nom FROM projets WHERE id = projet_id),
         user_id, projet_id);
    END LOOP;
END $$;

-- =====================================================
-- NOTIFICATIONS D'EXEMPLE
-- =====================================================

INSERT INTO notifications (titre, message, type, utilisateur_id, data) 
SELECT 
    'Stock critique',
    'Le produit ' || p.nom || ' est en stock critique (' || p.stock_actuel || ' restant)',
    'WARNING',
    u.id,
    json_build_object('produit_id', p.id, 'stock_actuel', p.stock_actuel)
FROM produits p
CROSS JOIN users u
WHERE p.stock_actuel <= p.stock_minimum 
AND u.role IN ('ADMIN', 'MANAGER')
AND u.is_active = true;

INSERT INTO notifications (titre, message, type, utilisateur_id, lu) VALUES
('Bienvenue dans TopSteel ERP', 'Votre système ERP TopSteel est maintenant opérationnel. Consultez le tableau de bord pour commencer.', 'INFO', 
 (SELECT id FROM users WHERE email = 'admin@topsteel.fr'), false),
('Projet en retard', 'Le projet "Villa Les Cèdres" approche de sa date limite. Vérifiez l''avancement.', 'WARNING',
 (SELECT id FROM users WHERE email = 'technique@topsteel.fr'), false);

-- =====================================================
-- COMMENTAIRES ET VALIDATION
-- =====================================================

-- Mise à jour des séquences pour éviter les conflits
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.sequences WHERE sequence_name = 'fournisseurs_id_seq') THEN
        PERFORM setval('fournisseurs_id_seq', (SELECT COALESCE(MAX(id), 1) FROM fournisseurs));
    END IF;
END $$;

COMMENT ON TABLE users IS 'Utilisateurs TopSteel avec données de test réalistes';
COMMENT ON TABLE clients IS 'Clients variés : professionnels, collectivités, particuliers, associations';
COMMENT ON TABLE produits IS 'Catalogue produits métallurgie complet avec tarifs et stocks';
COMMENT ON TABLE projets IS 'Projets métallerie réalistes en cours et terminés';
