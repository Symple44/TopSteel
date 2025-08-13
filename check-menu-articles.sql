-- Vérifier l'existence du menu Articles dans menu_items
SELECT 
    id,
    title,
    "programId",
    type,
    "isVisible",
    "configId",
    "orderIndex"
FROM menu_items
WHERE 
    LOWER(title) LIKE '%article%'
    OR LOWER("programId") LIKE '%article%'
ORDER BY title;