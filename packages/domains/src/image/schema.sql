-- Table des métadonnées d'images
CREATE TABLE IF NOT EXISTS images (
    id VARCHAR(36) PRIMARY KEY,
    file_name VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    size INTEGER NOT NULL,
    width INTEGER NOT NULL,
    height INTEGER NOT NULL,
    hash VARCHAR(64) NOT NULL UNIQUE,
    category ENUM('avatar', 'logo', 'document') NOT NULL,
    uploaded_by VARCHAR(36) NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    tags JSON,
    alt TEXT,
    description TEXT,
    entity_type ENUM('user', 'company', 'project'),
    entity_id VARCHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_category (category),
    INDEX idx_entity (entity_type, entity_id),
    INDEX idx_uploaded_by (uploaded_by),
    INDEX idx_hash (hash),
    INDEX idx_uploaded_at (uploaded_at)
);

-- Table des variantes d'images
CREATE TABLE IF NOT EXISTS image_variants (
    id VARCHAR(36) PRIMARY KEY,
    image_id VARCHAR(36) NOT NULL,
    variant ENUM('original', 'thumbnail', 'medium', 'large') NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    width INTEGER NOT NULL,
    height INTEGER NOT NULL,
    size INTEGER NOT NULL,
    path VARCHAR(500) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (image_id) REFERENCES images(id) ON DELETE CASCADE,
    UNIQUE KEY unique_image_variant (image_id, variant),
    INDEX idx_image_id (image_id),
    INDEX idx_variant (variant)
);

-- Table de liaison pour les tags (si vous voulez une normalisation complète)
CREATE TABLE IF NOT EXISTS image_tags (
    id VARCHAR(36) PRIMARY KEY,
    image_id VARCHAR(36) NOT NULL,
    tag VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (image_id) REFERENCES images(id) ON DELETE CASCADE,
    UNIQUE KEY unique_image_tag (image_id, tag),
    INDEX idx_tag (tag)
);

-- Vue pour faciliter les requêtes avec toutes les informations
CREATE VIEW IF NOT EXISTS images_with_variants AS
SELECT 
    i.*,
    JSON_ARRAYAGG(
        JSON_OBJECT(
            'variant', iv.variant,
            'file_name', iv.file_name,
            'width', iv.width,
            'height', iv.height,
            'size', iv.size,
            'path', iv.path
        )
    ) as variants
FROM images i
LEFT JOIN image_variants iv ON i.id = iv.image_id
GROUP BY i.id;

-- Fonctions pour la recherche Elasticsearch (métadonnées indexables)
-- Cette requête peut être utilisée pour synchroniser avec Elasticsearch
SELECT 
    i.id,
    i.file_name,
    i.original_name,
    i.mime_type,
    i.size,
    i.width,
    i.height,
    i.category,
    i.uploaded_by,
    i.uploaded_at,
    i.tags,
    i.alt,
    i.description,
    i.entity_type,
    i.entity_id,
    GROUP_CONCAT(it.tag) as tag_list
FROM images i
LEFT JOIN image_tags it ON i.id = it.image_id
GROUP BY i.id;