-- Script SQL pour créer la société par défaut
-- Usage: Exécutez ce script dans pgAdmin ou via psql

-- Vérifier si des sociétés existent déjà
DO $$
DECLARE
    societe_count INTEGER;
    new_societe_id UUID;
BEGIN
    SELECT COUNT(*) INTO societe_count FROM societes;

    IF societe_count > 0 THEN
        RAISE NOTICE 'Des sociétés existent déjà (%). Aucune création nécessaire.', societe_count;
    ELSE
        RAISE NOTICE 'Création de la société par défaut...';

        -- Créer la société par défaut
        INSERT INTO societes (
            nom, code, email, telephone, adresse, ville, code_postal, pays,
            actif, siret, tva_intra, forme_juridique, capital,
            created_at, updated_at
        )
        VALUES (
            'TopSteel',
            'TS',
            'contact@topsteel.tech',
            '+33 1 23 45 67 89',
            '1 Avenue de la Métallurgie',
            'Paris',
            '75001',
            'France',
            true,
            '12345678901234',
            'FR12345678901',
            'SAS',
            100000,
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
        )
        RETURNING id INTO new_societe_id;

        RAISE NOTICE 'Société créée avec ID: %', new_societe_id;

        -- Créer un site par défaut
        INSERT INTO sites (
            societe_id, nom, code, adresse, ville, code_postal, pays,
            actif, type, created_at, updated_at
        )
        VALUES (
            new_societe_id,
            'Siège Social',
            'HQ',
            '1 Avenue de la Métallurgie',
            'Paris',
            '75001',
            'France',
            true,
            'SIEGE',
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
        );

        RAISE NOTICE 'Site par défaut créé pour la société';
        RAISE NOTICE 'Société et site créés avec succès!';
    END IF;
END $$;
