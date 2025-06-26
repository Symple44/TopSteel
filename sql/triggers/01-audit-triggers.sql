-- =========================================================================
-- ERP TOPSTEEL - TRIGGERS ET FONCTIONS
-- Fichier: sql/triggers/01-audit-triggers.sql
-- =========================================================================

-- Fonction de mise à jour automatique du timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers pour updated_at
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at 
    BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projets_updated_at 
    BEFORE UPDATE ON projets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at 
    BEFORE UPDATE ON documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Fonction de génération de numéro de projet
CREATE OR REPLACE FUNCTION generate_projet_numero()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.numero IS NULL THEN
        NEW.numero := 'PRJ-' || to_char(CURRENT_DATE, 'YYYY') || '-' || 
                      lpad(nextval('projets_numero_seq')::text, 4, '0');
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Séquence pour numérotation projets
CREATE SEQUENCE IF NOT EXISTS projets_numero_seq START 1;

-- Trigger pour numérotation automatique
CREATE TRIGGER generate_projet_numero_trigger
    BEFORE INSERT ON projets
    FOR EACH ROW EXECUTE FUNCTION generate_projet_numero();
