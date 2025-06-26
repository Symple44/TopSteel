-- =========================================================================
-- ERP TOPSTEEL - TRIGGERS ET FONCTIONS MÉTIER
-- Fichier: sql/triggers/01-audit-triggers.sql
-- =========================================================================

-- =====================================================
-- FONCTIONS UTILITAIRES GÉNÉRALES
-- =====================================================

-- Fonction de mise à jour automatique du timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FONCTIONS MÉTIER SPÉCIFIQUES MÉTALLERIE
-- =====================================================

-- Fonction de génération de numéros de référence TopSteel
CREATE OR REPLACE FUNCTION generate_reference(prefix text, table_name text, date_column text DEFAULT 'created_at')
RETURNS text AS $$
DECLARE
    current_year text;
    sequence_name text;
    next_number integer;
    reference text;
BEGIN
    current_year := to_char(CURRENT_DATE, 'YYYY');
    sequence_name := table_name || '_seq_' || current_year;
    
    -- Créer la séquence si elle n'existe pas
    EXECUTE format('CREATE SEQUENCE IF NOT EXISTS %I START 1', sequence_name);
    
    -- Obtenir le prochain numéro
    EXECUTE format('SELECT nextval(%L)', sequence_name) INTO next_number;
    
    -- Formater la référence : PRJ-2025-0001
    reference := prefix || '-' || current_year || '-' || lpad(next_number::text, 4, '0');
    
    RETURN reference;
END;
$$ LANGUAGE plpgsql;

-- Fonction de génération spécifique pour projets
CREATE OR REPLACE FUNCTION generate_projet_numero()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.numero IS NULL OR NEW.numero = '' THEN
        NEW.numero := generate_reference('PRJ', 'projets');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fonction de génération pour devis
CREATE OR REPLACE FUNCTION generate_devis_numero()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.numero IS NULL OR NEW.numero = '' THEN
        NEW.numero := generate_reference('DEV', 'devis');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fonction de génération pour commandes
CREATE OR REPLACE FUNCTION generate_commande_numero()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.numero IS NULL OR NEW.numero = '' THEN
        NEW.numero := generate_reference('CMD', 'commandes');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FONCTIONS DE CALCUL AUTOMATIQUE
-- =====================================================

-- Calcul automatique du montant TTC pour devis
CREATE OR REPLACE FUNCTION calculate_devis_montant_ttc()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculer le montant HT avec remise
    NEW.montant_ht := NEW.montant_ht * (1 - COALESCE(NEW.remise_pct, 0) / 100);
    
    -- Calculer le TTC
    NEW.montant_ttc := NEW.montant_ht * (1 + COALESCE(NEW.taux_tva, 20) / 100);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Mise à jour automatique de l'encours client
CREATE OR REPLACE FUNCTION update_client_encours()
RETURNS TRIGGER AS $$
DECLARE
    client_uuid uuid;
    new_encours numeric(10,2);
BEGIN
    -- Déterminer l'ID client selon le contexte
    IF TG_TABLE_NAME = 'devis' THEN
        client_uuid := COALESCE(NEW.client_id, OLD.client_id);
    ELSIF TG_TABLE_NAME = 'projets' THEN
        client_uuid := COALESCE(NEW.client_id, OLD.client_id);
    END IF;
    
    -- Calculer le nouvel encours
    SELECT COALESCE(SUM(d.montant_ttc), 0)
    INTO new_encours
    FROM devis d
    INNER JOIN projets p ON d.projet_id = p.id
    WHERE p.client_id = client_uuid
    AND d.statut IN ('ACCEPTE')
    AND p.statut NOT IN ('FACTURE', 'CLOTURE', 'ANNULE');
    
    -- Mettre à jour l'encours du client
    UPDATE clients 
    SET encours = new_encours, updated_at = CURRENT_TIMESTAMP
    WHERE id = client_uuid;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FONCTIONS DE GESTION STOCK
-- =====================================================

-- Mise à jour automatique du stock après mouvement
CREATE OR REPLACE FUNCTION update_stock_after_movement()
RETURNS TRIGGER AS $$
DECLARE
    old_stock numeric(10,3);
    new_stock numeric(10,3);
BEGIN
    -- Récupérer le stock actuel
    SELECT stock_actuel INTO old_stock
    FROM produits
    WHERE id = NEW.produit_id;
    
    -- Calculer le nouveau stock selon le type de mouvement
    CASE NEW.type
        WHEN 'ENTREE' THEN
            new_stock := old_stock + NEW.quantite;
        WHEN 'SORTIE' THEN
            new_stock := old_stock - NEW.quantite;
        WHEN 'AJUSTEMENT' THEN
            new_stock := NEW.quantite; -- Quantité absolue
        WHEN 'INVENTAIRE' THEN
            new_stock := NEW.quantite; -- Quantité absolue
        ELSE
            new_stock := old_stock; -- Pas de changement pour autres types
    END CASE;
    
    -- Mettre à jour le stock produit
    UPDATE produits 
    SET stock_actuel = new_stock, updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.produit_id;
    
    -- Créer une notification si stock critique
    IF new_stock <= (SELECT stock_minimum FROM produits WHERE id = NEW.produit_id) THEN
        INSERT INTO notifications (titre, message, type, utilisateur_id, data)
        SELECT 
            'Stock critique',
            'Le produit ' || nom || ' est en stock critique (' || new_stock || ' restant)',
            'WARNING',
            id,
            json_build_object('produit_id', NEW.produit_id, 'stock_actuel', new_stock)
        FROM users 
        WHERE role IN ('ADMIN', 'MANAGER')
        AND is_active = true;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FONCTIONS D'AUDIT ET NOTIFICATIONS
-- =====================================================

-- Fonction d'audit générique pour toutes les tables
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
DECLARE
    audit_table text := 'audit_logs';
    user_id uuid;
BEGIN
    -- Récupérer l'ID utilisateur depuis la session ou utiliser null
    BEGIN
        user_id := current_setting('app.current_user_id', true)::uuid;
    EXCEPTION WHEN OTHERS THEN
        user_id := null;
    END;
    
    -- Insérer dans les logs d'audit
    IF TG_OP = 'INSERT' THEN
        EXECUTE format('INSERT INTO %I (utilisateur_id, entite, entite_id, action, nouvelles_valeurs, created_at) VALUES ($1, $2, $3, $4, $5, $6)', audit_table)
        USING user_id, TG_TABLE_NAME, NEW.id, TG_OP, to_jsonb(NEW), CURRENT_TIMESTAMP;
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        EXECUTE format('INSERT INTO %I (utilisateur_id, entite, entite_id, action, anciennes_valeurs, nouvelles_valeurs, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7)', audit_table)
        USING user_id, TG_TABLE_NAME, NEW.id, TG_OP, to_jsonb(OLD), to_jsonb(NEW), CURRENT_TIMESTAMP;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        EXECUTE format('INSERT INTO %I (utilisateur_id, entite, entite_id, action, anciennes_valeurs, created_at) VALUES ($1, $2, $3, $4, $5, $6)', audit_table)
        USING user_id, TG_TABLE_NAME, OLD.id, TG_OP, to_jsonb(OLD), CURRENT_TIMESTAMP;
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Notification automatique pour changements critiques
CREATE OR REPLACE FUNCTION notify_critical_changes()
RETURNS TRIGGER AS $$
BEGIN
    -- Notifications pour changements de statut projet
    IF TG_TABLE_NAME = 'projets' AND OLD.statut IS DISTINCT FROM NEW.statut THEN
        INSERT INTO notifications (titre, message, utilisateur_id, data)
        SELECT 
            'Changement statut projet',
            'Le projet ' || NEW.nom || ' est passé de ' || OLD.statut || ' à ' || NEW.statut,
            NEW.responsable_id,
            json_build_object('projet_id', NEW.id, 'ancien_statut', OLD.statut, 'nouveau_statut', NEW.statut);
    END IF;
    
    -- Notifications pour dépassement budget
    IF TG_TABLE_NAME = 'projets' AND NEW.cout_reel > NEW.budget_estime * 1.1 THEN
        INSERT INTO notifications (titre, message, type, utilisateur_id, data)
        SELECT 
            'Dépassement budget',
            'Le projet ' || NEW.nom || ' dépasse son budget de ' || 
            round(((NEW.cout_reel - NEW.budget_estime) / NEW.budget_estime * 100)::numeric, 1) || '%',
            'WARNING',
            id,
            json_build_object('projet_id', NEW.id, 'budget_estime', NEW.budget_estime, 'cout_reel', NEW.cout_reel)
        FROM users 
        WHERE role IN ('ADMIN', 'MANAGER') AND is_active = true;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS SUR LES TABLES
-- =====================================================

-- Triggers pour updated_at automatique
CREATE TRIGGER trigger_users_updated_at 
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_clients_updated_at 
    BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_projets_updated_at 
    BEFORE UPDATE ON projets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_devis_updated_at 
    BEFORE UPDATE ON devis
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_produits_updated_at 
    BEFORE UPDATE ON produits
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_commandes_updated_at 
    BEFORE UPDATE ON commandes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_documents_updated_at 
    BEFORE UPDATE ON documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Triggers pour génération automatique de numéros
CREATE TRIGGER trigger_generate_projet_numero
    BEFORE INSERT ON projets
    FOR EACH ROW EXECUTE FUNCTION generate_projet_numero();

CREATE TRIGGER trigger_generate_devis_numero
    BEFORE INSERT ON devis
    FOR EACH ROW EXECUTE FUNCTION generate_devis_numero();

CREATE TRIGGER trigger_generate_commande_numero
    BEFORE INSERT ON commandes
    FOR EACH ROW EXECUTE FUNCTION generate_commande_numero();

-- Triggers pour calculs automatiques
CREATE TRIGGER trigger_calculate_devis_montant
    BEFORE INSERT OR UPDATE ON devis
    FOR EACH ROW EXECUTE FUNCTION calculate_devis_montant_ttc();

-- Triggers pour gestion stock
CREATE TRIGGER trigger_update_stock_movement
    AFTER INSERT ON mouvements_stock
    FOR EACH ROW EXECUTE FUNCTION update_stock_after_movement();

-- Triggers pour encours client
CREATE TRIGGER trigger_update_client_encours_devis
    AFTER INSERT OR UPDATE OR DELETE ON devis
    FOR EACH ROW EXECUTE FUNCTION update_client_encours();

-- Triggers pour notifications
CREATE TRIGGER trigger_notify_projets_changes
    AFTER UPDATE ON projets
    FOR EACH ROW EXECUTE FUNCTION notify_critical_changes();

-- =====================================================
-- TRIGGERS D'AUDIT (OPTIONNELS - À ACTIVER SI BESOIN)
-- =====================================================

-- Décommenter pour activer l'audit sur les tables critiques

-- CREATE TRIGGER audit_projets 
--     AFTER INSERT OR UPDATE OR DELETE ON projets
--     FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- CREATE TRIGGER audit_devis 
--     AFTER INSERT OR UPDATE OR DELETE ON devis
--     FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- CREATE TRIGGER audit_clients 
--     AFTER INSERT OR UPDATE OR DELETE ON clients
--     FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- CREATE TRIGGER audit_produits 
--     AFTER INSERT OR UPDATE OR DELETE ON produits
--     FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- =====================================================
-- COMMENTAIRES POUR DOCUMENTATION
-- =====================================================

COMMENT ON FUNCTION generate_reference IS 'Génère des références uniques au format PREFIX-YEAR-NNNN';
COMMENT ON FUNCTION update_stock_after_movement IS 'Met à jour automatiquement le stock après un mouvement';
COMMENT ON FUNCTION update_client_encours IS 'Calcule et met à jour l''encours client automatiquement';
COMMENT ON FUNCTION notify_critical_changes IS 'Crée des notifications pour les changements critiques';