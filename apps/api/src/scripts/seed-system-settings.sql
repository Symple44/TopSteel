-- Script SQL pour alimenter la table system_settings avec les paramètres de métallurgie
-- Structure: id (UUID), category (VARCHAR), key (VARCHAR), value (JSONB), description (TEXT), created_at, updated_at

-- Suppression des paramètres existants pour éviter les doublons
DELETE FROM system_settings WHERE category IN (
  'MATERIALS_STEEL', 'MATERIALS_STAINLESS', 'MATERIALS_ALUMINUM', 'STEEL_SHAPES', 
  'TUBE_TYPES', 'SHEET_TYPES', 'COATING_TYPES', 'THICKNESS_STANDARD',
  'DIMENSIONS_IPE', 'DIMENSIONS_HEA', 'DIMENSIONS_HEB', 'DIMENSIONS_UPN', 
  'DIMENSIONS_IPN', 'TUBE_DIMENSIONS', 'UNITS'
);

-- 1. MATERIALS_STEEL - Nuances d'acier
INSERT INTO system_settings (id, category, key, value, description, created_at, updated_at) VALUES
(gen_random_uuid(), 'MATERIALS_STEEL', 'S235JR', '{
  "designation": "S235JR",
  "density": 7850,
  "yield_strength": 235,
  "tensile_strength": 360,
  "elongation": 26,
  "impact_energy": 27,
  "temperature": 20,
  "standards": ["EN 10025-2", "AFNOR NF A 35-501"],
  "applications": ["construction générale", "charpente", "serrurerie"],
  "weldability": "excellente",
  "machinability": "bonne"
}', 'Acier de construction S235JR - nuance la plus courante', NOW(), NOW()),

(gen_random_uuid(), 'MATERIALS_STEEL', 'S275JR', '{
  "designation": "S275JR",
  "density": 7850,
  "yield_strength": 275,
  "tensile_strength": 410,
  "elongation": 23,
  "impact_energy": 27,
  "temperature": 20,
  "standards": ["EN 10025-2", "AFNOR NF A 35-501"],
  "applications": ["charpente lourde", "ponts", "structures sollicitées"],
  "weldability": "excellente",
  "machinability": "bonne"
}', 'Acier de construction S275JR - résistance supérieure', NOW(), NOW()),

(gen_random_uuid(), 'MATERIALS_STEEL', 'S355JR', '{
  "designation": "S355JR",
  "density": 7850,
  "yield_strength": 355,
  "tensile_strength": 490,
  "elongation": 22,
  "impact_energy": 27,
  "temperature": 20,
  "standards": ["EN 10025-2", "AFNOR NF A 35-501"],
  "applications": ["charpente haute résistance", "grues", "structures importantes"],
  "weldability": "bonne",
  "machinability": "moyenne"
}', 'Acier haute résistance S355JR', NOW(), NOW()),

(gen_random_uuid(), 'MATERIALS_STEEL', 'S460JR', '{
  "designation": "S460JR",
  "density": 7850,
  "yield_strength": 460,
  "tensile_strength": 540,
  "elongation": 17,
  "impact_energy": 27,
  "temperature": 20,
  "standards": ["EN 10025-2"],
  "applications": ["structures très sollicitées", "équipements lourds"],
  "weldability": "moyenne",
  "machinability": "difficile"
}', 'Acier très haute résistance S460JR', NOW(), NOW());

-- 2. MATERIALS_STAINLESS - Nuances inox
INSERT INTO system_settings (id, category, key, value, description, created_at, updated_at) VALUES
(gen_random_uuid(), 'MATERIALS_STAINLESS', '304', '{
  "designation": "304",
  "density": 8000,
  "yield_strength": 205,
  "tensile_strength": 515,
  "elongation": 40,
  "composition": {"chromium": 18, "nickel": 8, "carbon": 0.08},
  "standards": ["EN 10088", "AISI 304"],
  "corrosion_resistance": "excellente",
  "temperature_range": {"min": -196, "max": 800},
  "applications": ["alimentaire", "chimie", "décoration"],
  "magnetic": false
}', 'Inox austénitique 304 - usage général', NOW(), NOW()),

(gen_random_uuid(), 'MATERIALS_STAINLESS', '304L', '{
  "designation": "304L",
  "density": 8000,
  "yield_strength": 170,
  "tensile_strength": 485,
  "elongation": 40,
  "composition": {"chromium": 18, "nickel": 8, "carbon": 0.03},
  "standards": ["EN 10088", "AISI 304L"],
  "corrosion_resistance": "excellente",
  "temperature_range": {"min": -196, "max": 800},
  "applications": ["soudage", "industrie chimique", "pharmaceutique"],
  "magnetic": false
}', 'Inox austénitique 304L - bas carbone pour soudage', NOW(), NOW()),

(gen_random_uuid(), 'MATERIALS_STAINLESS', '316', '{
  "designation": "316",
  "density": 8000,
  "yield_strength": 205,
  "tensile_strength": 515,
  "elongation": 40,
  "composition": {"chromium": 17, "nickel": 10, "molybdenum": 2, "carbon": 0.08},
  "standards": ["EN 10088", "AISI 316"],
  "corrosion_resistance": "supérieure",
  "temperature_range": {"min": -196, "max": 800},
  "applications": ["marine", "chimie", "médical"],
  "magnetic": false
}', 'Inox austénitique 316 - résistance chlorures', NOW(), NOW()),

(gen_random_uuid(), 'MATERIALS_STAINLESS', '316L', '{
  "designation": "316L",
  "density": 8000,
  "yield_strength": 170,
  "tensile_strength": 485,
  "elongation": 40,
  "composition": {"chromium": 17, "nickel": 10, "molybdenum": 2, "carbon": 0.03},
  "standards": ["EN 10088", "AISI 316L"],
  "corrosion_resistance": "supérieure",
  "temperature_range": {"min": -196, "max": 800},
  "applications": ["marine", "offshore", "pharmaceutique"],
  "magnetic": false
}', 'Inox austénitique 316L - bas carbone marine', NOW(), NOW()),

(gen_random_uuid(), 'MATERIALS_STAINLESS', '430', '{
  "designation": "430",
  "density": 7700,
  "yield_strength": 280,
  "tensile_strength": 450,
  "elongation": 22,
  "composition": {"chromium": 17, "carbon": 0.12},
  "standards": ["EN 10088", "AISI 430"],
  "corrosion_resistance": "moyenne",
  "temperature_range": {"min": -50, "max": 815},
  "applications": ["électroménager", "décoration", "automobile"],
  "magnetic": true
}', 'Inox ferritique 430 - économique', NOW(), NOW());

-- 3. MATERIALS_ALUMINUM - Alliages aluminium
INSERT INTO system_settings (id, category, key, value, description, created_at, updated_at) VALUES
(gen_random_uuid(), 'MATERIALS_ALUMINUM', '1050', '{
  "designation": "1050",
  "density": 2700,
  "yield_strength": 30,
  "tensile_strength": 75,
  "elongation": 40,
  "purity": 99.5,
  "standards": ["EN 573-3", "AFNOR NF A 50-411"],
  "corrosion_resistance": "excellente",
  "conductivity": {"thermal": 230, "electrical": 59},
  "applications": ["alimentaire", "chimie", "électrique"],
  "weldability": "excellente"
}', 'Aluminium pur 1050 - excellente conductivité', NOW(), NOW()),

(gen_random_uuid(), 'MATERIALS_ALUMINUM', '5754', '{
  "designation": "5754",
  "density": 2670,
  "yield_strength": 80,
  "tensile_strength": 190,
  "elongation": 27,
  "composition": {"magnesium": 3.0, "manganese": 0.5},
  "standards": ["EN 573-3"],
  "corrosion_resistance": "excellente",
  "applications": ["marine", "transport", "réservoirs"],
  "weldability": "excellente"
}', 'Alliage aluminium-magnésium 5754 - marine', NOW(), NOW()),

(gen_random_uuid(), 'MATERIALS_ALUMINUM', '6060', '{
  "designation": "6060",
  "density": 2700,
  "yield_strength": 110,
  "tensile_strength": 160,
  "elongation": 20,
  "composition": {"magnesium": 0.5, "silicon": 0.4},
  "standards": ["EN 573-3"],
  "corrosion_resistance": "bonne",
  "applications": ["profilés", "fenêtres", "façades"],
  "weldability": "bonne",
  "extrudability": "excellente"
}', 'Alliage 6060 - profilés architecturaux', NOW(), NOW()),

(gen_random_uuid(), 'MATERIALS_ALUMINUM', '6082', '{
  "designation": "6082",
  "density": 2700,
  "yield_strength": 255,
  "tensile_strength": 290,
  "elongation": 10,
  "composition": {"magnesium": 0.8, "silicon": 1.0, "manganese": 0.7},
  "standards": ["EN 573-3"],
  "corrosion_resistance": "bonne",
  "applications": ["structure", "ponts", "véhicules"],
  "weldability": "bonne",
  "machinability": "excellente"
}', 'Alliage structural 6082 - haute résistance', NOW(), NOW());

-- 4. STEEL_SHAPES - Formes d'acier
INSERT INTO system_settings (id, category, key, value, description, created_at, updated_at) VALUES
(gen_random_uuid(), 'STEEL_SHAPES', 'IPE', '{
  "designation": "IPE",
  "type": "poutre en I",
  "standard": "EN 10034",
  "characteristics": {
    "flanges": "parallèles",
    "web": "perpendiculaire",
    "tolerance": "normale"
  },
  "applications": ["charpente", "planchers", "poteaux"],
  "available_grades": ["S235JR", "S275JR", "S355JR"],
  "surface_treatment": ["brut", "galvanisé", "peint"]
}', 'Poutrelles IPE - profil en I européen', NOW(), NOW()),

(gen_random_uuid(), 'STEEL_SHAPES', 'HEA', '{
  "designation": "HEA",
  "type": "poutre H",
  "standard": "EN 10034",
  "characteristics": {
    "flanges": "larges et épaisses",
    "web": "relativement mince",
    "tolerance": "normale"
  },
  "applications": ["poteaux", "charpente lourde", "structures"],
  "available_grades": ["S235JR", "S275JR", "S355JR"],
  "surface_treatment": ["brut", "galvanisé"]
}', 'Profilés HEA - poutre H européenne série A', NOW(), NOW()),

(gen_random_uuid(), 'STEEL_SHAPES', 'HEB', '{
  "designation": "HEB",
  "type": "poutre H",
  "standard": "EN 10034",
  "characteristics": {
    "flanges": "très larges et épaisses",
    "web": "épais",
    "tolerance": "normale"
  },
  "applications": ["poteaux lourds", "structures importantes"],
  "available_grades": ["S235JR", "S275JR", "S355JR"],
  "surface_treatment": ["brut", "galvanisé"]
}', 'Profilés HEB - poutre H européenne série B', NOW(), NOW()),

(gen_random_uuid(), 'STEEL_SHAPES', 'UPN', '{
  "designation": "UPN",
  "type": "U",
  "standard": "EN 10034",
  "characteristics": {
    "flanges": "inclinées 8%",
    "web": "perpendiculaire",
    "tolerance": "normale"
  },
  "applications": ["ossatures", "rails", "guides"],
  "available_grades": ["S235JR", "S275JR"],
  "surface_treatment": ["brut", "galvanisé", "peint"]
}', 'Profilés UPN - U à flanges inclinées', NOW(), NOW()),

(gen_random_uuid(), 'STEEL_SHAPES', 'L', '{
  "designation": "L",
  "type": "cornière",
  "standard": "EN 10056-1",
  "characteristics": {
    "angles": "égaux ou inégaux",
    "tolerance": "normale"
  },
  "applications": ["ossatures", "renforts", "assemblages"],
  "available_grades": ["S235JR", "S275JR"],
  "surface_treatment": ["brut", "galvanisé", "peint"]
}', 'Cornières L - angles droits', NOW(), NOW());

-- 5. TUBE_TYPES - Types de tubes
INSERT INTO system_settings (id, category, key, value, description, created_at, updated_at) VALUES
(gen_random_uuid(), 'TUBE_TYPES', 'ROUND', '{
  "designation": "ROND",
  "geometry": "circulaire",
  "standards": ["EN 10210-2", "EN 10219-2"],
  "characteristics": {
    "resistance": "uniforme",
    "weight": "optimisé",
    "aesthetic": "classique"
  },
  "applications": ["structure", "mobilier", "garde-corps"],
  "manufacturing": ["soudé", "étiré à froid"],
  "tolerances": "H8 à H11"
}', 'Tubes ronds - section circulaire', NOW(), NOW()),

(gen_random_uuid(), 'TUBE_TYPES', 'SQUARE', '{
  "designation": "CARRÉ",
  "geometry": "carrée",
  "standards": ["EN 10210-2", "EN 10219-2"],
  "characteristics": {
    "resistance": "bidirectionnelle égale",
    "assemblage": "facile",
    "aesthetic": "moderne"
  },
  "applications": ["structure", "mobilier", "clôtures"],
  "manufacturing": ["soudé", "formé à froid"],
  "tolerances": "H8 à H11"
}', 'Tubes carrés - section carrée', NOW(), NOW()),

(gen_random_uuid(), 'TUBE_TYPES', 'RECTANGULAR', '{
  "designation": "RECTANGULAIRE",
  "geometry": "rectangulaire",
  "standards": ["EN 10210-2", "EN 10219-2"],
  "characteristics": {
    "resistance": "directionnelle",
    "inertie": "optimisée selon axe",
    "aesthetic": "élégante"
  },
  "applications": ["charpente", "mobilier", "cadres"],
  "manufacturing": ["soudé", "formé à froid"],
  "tolerances": "H8 à H11"
}', 'Tubes rectangulaires - section rectangulaire', NOW(), NOW());

-- 6. SHEET_TYPES - Types de tôles
INSERT INTO system_settings (id, category, key, value, description, created_at, updated_at) VALUES
(gen_random_uuid(), 'SHEET_TYPES', 'SMOOTH', '{
  "designation": "LISSE",
  "surface": "plane et lisse",
  "standards": ["EN 10029", "EN 10051"],
  "characteristics": {
    "roughness": "Ra < 1.6",
    "flatness": "excellente",
    "finish": "uniforme"
  },
  "applications": ["carrosserie", "électroménager", "décoration"],
  "treatments": ["brut", "décapé", "huilé"],
  "thicknesses": "0.5 à 100 mm"
}', 'Tôles lisses - surface plane standard', NOW(), NOW()),

(gen_random_uuid(), 'SHEET_TYPES', 'CHECKERED', '{
  "designation": "STRIÉE",
  "surface": "motif en relief",
  "standards": ["EN 10029"],
  "characteristics": {
    "pattern": "stries ou losanges",
    "anti_slip": "excellent",
    "drainage": "bon"
  },
  "applications": ["planchers", "escaliers", "rampes"],
  "patterns": ["5 barres", "losanges", "pastilles"],
  "thicknesses": "2 à 15 mm"
}', 'Tôles striées - surface antidérapante', NOW(), NOW()),

(gen_random_uuid(), 'SHEET_TYPES', 'PERFORATED', '{
  "designation": "PERFORÉE",
  "surface": "perforations régulières",
  "standards": ["EN 10029"],
  "characteristics": {
    "perforation": "ronde ou carrée",
    "open_area": "20% à 60%",
    "filtration": "excellente"
  },
  "applications": ["filtration", "ventilation", "décoration"],
  "hole_patterns": ["rond", "carré", "oblong"],
  "thicknesses": "0.5 à 10 mm"
}', 'Tôles perforées - avec perforations', NOW(), NOW()),

(gen_random_uuid(), 'SHEET_TYPES', 'EMBOSSED', '{
  "designation": "GAUFFRÉE",
  "surface": "motif en relief",
  "standards": ["EN 10029"],
  "characteristics": {
    "texture": "relief décoratif",
    "rigidity": "améliorée",
    "aesthetic": "décorative"
  },
  "applications": ["décoration", "isolation", "emballage"],
  "patterns": ["orange", "cuir", "losanges"],
  "thicknesses": "0.5 à 3 mm"
}', 'Tôles gaufrées - surface texturée', NOW(), NOW());

-- 7. COATING_TYPES - Types de revêtements
INSERT INTO system_settings (id, category, key, value, description, created_at, updated_at) VALUES
(gen_random_uuid(), 'COATING_TYPES', 'GALVANIZED', '{
  "designation": "GALVANISÉ",
  "process": "galvanisation à chaud",
  "standards": ["EN ISO 1461", "EN 10240"],
  "characteristics": {
    "thickness": "45 à 85 μm",
    "corrosion_protection": "excellente",
    "durability": "50+ ans"
  },
  "applications": ["extérieur", "milieu humide", "structures"],
  "appearance": "gris métallique",
  "post_treatment": "passivation possible"
}', 'Galvanisation à chaud - protection anticorrosion', NOW(), NOW()),

(gen_random_uuid(), 'COATING_TYPES', 'POWDER_COATED', '{
  "designation": "THERMOLAQUÉ",
  "process": "peinture poudre polyester",
  "standards": ["EN 12206-1", "QUALICOAT"],
  "characteristics": {
    "thickness": "60 à 120 μm",
    "durability": "15 à 25 ans",
    "colors": "RAL complet"
  },
  "applications": ["menuiserie", "façades", "mobilier"],
  "pre_treatment": "phosphatation ou chromage",
  "finish": ["mat", "satiné", "brillant"]
}', 'Thermolaquage - finition colorée durable', NOW(), NOW()),

(gen_random_uuid(), 'COATING_TYPES', 'ANODIZED', '{
  "designation": "ANODISÉ",
  "process": "oxydation électrolytique",
  "standards": ["EN 12373", "EURAS"],
  "characteristics": {
    "thickness": "15 à 25 μm",
    "hardness": "très élevée",
    "transparency": "conserve l\'aspect métal"
  },
  "applications": ["aluminium", "architecture", "décoration"],
  "colors": ["naturel", "bronze", "noir", "coloré"],
  "material": "aluminium uniquement"
}', 'Anodisation - traitement aluminium', NOW(), NOW());

-- 8. THICKNESS_STANDARD - Épaisseurs standard
INSERT INTO system_settings (id, category, key, value, description, created_at, updated_at) VALUES
(gen_random_uuid(), 'THICKNESS_STANDARD', 'STEEL_SHEET', '{
  "material": "tôle acier",
  "standard": "EN 10029",
  "thicknesses": [
    0.5, 0.6, 0.7, 0.8, 1.0, 1.2, 1.5, 2.0, 2.5, 3.0,
    4.0, 5.0, 6.0, 8.0, 10.0, 12.0, 15.0, 20.0, 25.0, 30.0,
    35.0, 40.0, 50.0, 60.0, 70.0, 80.0, 90.0, 100.0
  ],
  "tolerance": "±10%",
  "applications": ["construction", "chaudronnerie", "mécanique"]
}', 'Épaisseurs standard tôles acier', NOW(), NOW()),

(gen_random_uuid(), 'THICKNESS_STANDARD', 'ALUMINUM_SHEET', '{
  "material": "tôle aluminium",
  "standard": "EN 485-2",
  "thicknesses": [
    0.4, 0.5, 0.6, 0.8, 1.0, 1.2, 1.5, 2.0, 2.5, 3.0,
    4.0, 5.0, 6.0, 8.0, 10.0, 12.0, 15.0, 20.0, 25.0, 30.0
  ],
  "tolerance": "±5%",
  "applications": ["transport", "marine", "architecture"]
}', 'Épaisseurs standard tôles aluminium', NOW(), NOW()),

(gen_random_uuid(), 'THICKNESS_STANDARD', 'TUBE_WALL', '{
  "material": "tube acier",
  "standard": "EN 10210-2",
  "thicknesses": [
    1.0, 1.5, 2.0, 2.5, 3.0, 4.0, 5.0, 6.0, 8.0, 10.0,
    12.0, 16.0, 20.0, 25.0, 30.0, 40.0
  ],
  "tolerance": "±10%",
  "applications": ["structure", "mécanique", "hydraulique"]
}', 'Épaisseurs standard parois tubes', NOW(), NOW());

-- 9. DIMENSIONS_IPE - Dimensions IPE
INSERT INTO system_settings (id, category, key, value, description, created_at, updated_at) VALUES
(gen_random_uuid(), 'DIMENSIONS_IPE', 'IPE80', '{
  "designation": "IPE 80",
  "height": 80,
  "width": 46,
  "web_thickness": 3.8,
  "flange_thickness": 5.2,
  "weight": 6.0,
  "area": 7.64,
  "moment_inertia": {"Ix": 80.1, "Iy": 8.49},
  "section_modulus": {"Wx": 20.0, "Wy": 3.69},
  "radius": 5
}', 'IPE 80 - dimensions et caractéristiques', NOW(), NOW()),

(gen_random_uuid(), 'DIMENSIONS_IPE', 'IPE100', '{
  "designation": "IPE 100",
  "height": 100,
  "width": 55,
  "web_thickness": 4.1,
  "flange_thickness": 5.7,
  "weight": 8.1,
  "area": 10.3,
  "moment_inertia": {"Ix": 171, "Iy": 15.9},
  "section_modulus": {"Wx": 34.2, "Wy": 5.79},
  "radius": 7
}', 'IPE 100 - dimensions et caractéristiques', NOW(), NOW()),

(gen_random_uuid(), 'DIMENSIONS_IPE', 'IPE120', '{
  "designation": "IPE 120",
  "height": 120,
  "width": 64,
  "web_thickness": 4.4,
  "flange_thickness": 6.3,
  "weight": 10.4,
  "area": 13.2,
  "moment_inertia": {"Ix": 318, "Iy": 27.7},
  "section_modulus": {"Wx": 53.0, "Wy": 8.65},
  "radius": 7
}', 'IPE 120 - dimensions et caractéristiques', NOW(), NOW()),

(gen_random_uuid(), 'DIMENSIONS_IPE', 'IPE160', '{
  "designation": "IPE 160",
  "height": 160,
  "width": 82,
  "web_thickness": 5.0,
  "flange_thickness": 7.4,
  "weight": 15.8,
  "area": 20.1,
  "moment_inertia": {"Ix": 869, "Iy": 68.3},
  "section_modulus": {"Wx": 109, "Wy": 16.7},
  "radius": 9
}', 'IPE 160 - dimensions et caractéristiques', NOW(), NOW()),

(gen_random_uuid(), 'DIMENSIONS_IPE', 'IPE200', '{
  "designation": "IPE 200",
  "height": 200,
  "width": 100,
  "web_thickness": 5.6,
  "flange_thickness": 8.5,
  "weight": 22.4,
  "area": 28.5,
  "moment_inertia": {"Ix": 1943, "Iy": 142},
  "section_modulus": {"Wx": 194, "Wy": 28.5},
  "radius": 12
}', 'IPE 200 - dimensions et caractéristiques', NOW(), NOW()),

(gen_random_uuid(), 'DIMENSIONS_IPE', 'IPE300', '{
  "designation": "IPE 300",
  "height": 300,
  "width": 150,
  "web_thickness": 7.1,
  "flange_thickness": 10.7,
  "weight": 42.2,
  "area": 53.8,
  "moment_inertia": {"Ix": 8356, "Iy": 604},
  "section_modulus": {"Wx": 557, "Wy": 80.5},
  "radius": 15
}', 'IPE 300 - dimensions et caractéristiques', NOW(), NOW()),

(gen_random_uuid(), 'DIMENSIONS_IPE', 'IPE400', '{
  "designation": "IPE 400",
  "height": 400,
  "width": 180,
  "web_thickness": 8.6,
  "flange_thickness": 13.5,
  "weight": 66.3,
  "area": 84.5,
  "moment_inertia": {"Ix": 23130, "Iy": 1318},
  "section_modulus": {"Wx": 1156, "Wy": 146},
  "radius": 21
}', 'IPE 400 - dimensions et caractéristiques', NOW(), NOW()),

(gen_random_uuid(), 'DIMENSIONS_IPE', 'IPE500', '{
  "designation": "IPE 500",
  "height": 500,
  "width": 200,
  "web_thickness": 10.2,
  "flange_thickness": 16.0,
  "weight": 90.7,
  "area": 116,
  "moment_inertia": {"Ix": 48200, "Iy": 2142},
  "section_modulus": {"Wx": 1928, "Wy": 214},
  "radius": 21
}', 'IPE 500 - dimensions et caractéristiques', NOW(), NOW()),

(gen_random_uuid(), 'DIMENSIONS_IPE', 'IPE600', '{
  "designation": "IPE 600",
  "height": 600,
  "width": 220,
  "web_thickness": 12.0,
  "flange_thickness": 19.0,
  "weight": 122,
  "area": 156,
  "moment_inertia": {"Ix": 92080, "Iy": 3387},
  "section_modulus": {"Wx": 3069, "Wy": 308},
  "radius": 24
}', 'IPE 600 - dimensions et caractéristiques', NOW(), NOW());

-- 10. DIMENSIONS_HEA - Dimensions HEA (sélection)
INSERT INTO system_settings (id, category, key, value, description, created_at, updated_at) VALUES
(gen_random_uuid(), 'DIMENSIONS_HEA', 'HEA100', '{
  "designation": "HEA 100",
  "height": 96,
  "width": 100,
  "web_thickness": 5.0,
  "flange_thickness": 8.0,
  "weight": 16.7,
  "area": 21.2,
  "moment_inertia": {"Ix": 349, "Iy": 134},
  "section_modulus": {"Wx": 72.7, "Wy": 26.8},
  "radius": 12
}', 'HEA 100 - dimensions et caractéristiques', NOW(), NOW()),

(gen_random_uuid(), 'DIMENSIONS_HEA', 'HEA200', '{
  "designation": "HEA 200",
  "height": 190,
  "width": 200,
  "web_thickness": 6.5,
  "flange_thickness": 10.0,
  "weight": 42.3,
  "area": 53.8,
  "moment_inertia": {"Ix": 3692, "Iy": 1336},
  "section_modulus": {"Wx": 389, "Wy": 133.6},
  "radius": 18
}', 'HEA 200 - dimensions et caractéristiques', NOW(), NOW()),

(gen_random_uuid(), 'DIMENSIONS_HEA', 'HEA300', '{
  "designation": "HEA 300",
  "height": 290,
  "width": 300,
  "web_thickness": 8.5,
  "flange_thickness": 14.0,
  "weight": 88.3,
  "area": 112.5,
  "moment_inertia": {"Ix": 18263, "Iy": 6310},
  "section_modulus": {"Wx": 1260, "Wy": 420.7},
  "radius": 27
}', 'HEA 300 - dimensions et caractéristiques', NOW(), NOW());

-- 11. DIMENSIONS_HEB - Dimensions HEB (sélection)
INSERT INTO system_settings (id, category, key, value, description, created_at, updated_at) VALUES
(gen_random_uuid(), 'DIMENSIONS_HEB', 'HEB100', '{
  "designation": "HEB 100",
  "height": 100,
  "width": 100,
  "web_thickness": 6.0,
  "flange_thickness": 10.0,
  "weight": 20.4,
  "area": 26.0,
  "moment_inertia": {"Ix": 450, "Iy": 167},
  "section_modulus": {"Wx": 89.9, "Wy": 33.5},
  "radius": 12
}', 'HEB 100 - dimensions et caractéristiques', NOW(), NOW()),

(gen_random_uuid(), 'DIMENSIONS_HEB', 'HEB200', '{
  "designation": "HEB 200",
  "height": 200,
  "width": 200,
  "web_thickness": 9.0,
  "flange_thickness": 15.0,
  "weight": 61.3,
  "area": 78.1,
  "moment_inertia": {"Ix": 5696, "Iy": 2003},
  "section_modulus": {"Wx": 569.6, "Wy": 200.3},
  "radius": 18
}', 'HEB 200 - dimensions et caractéristiques', NOW(), NOW()),

(gen_random_uuid(), 'DIMENSIONS_HEB', 'HEB300', '{
  "designation": "HEB 300",
  "height": 300,
  "width": 300,
  "web_thickness": 11.0,
  "flange_thickness": 19.0,
  "weight": 117,
  "area": 149,
  "moment_inertia": {"Ix": 25170, "Iy": 8563},
  "section_modulus": {"Wx": 1678, "Wy": 570.9},
  "radius": 27
}', 'HEB 300 - dimensions et caractéristiques', NOW(), NOW());

-- 12. DIMENSIONS_UPN - Dimensions UPN (sélection)
INSERT INTO system_settings (id, category, key, value, description, created_at, updated_at) VALUES
(gen_random_uuid(), 'DIMENSIONS_UPN', 'UPN80', '{
  "designation": "UPN 80",
  "height": 80,
  "width": 45,
  "web_thickness": 6.0,
  "flange_thickness": 8.0,
  "weight": 8.64,
  "area": 11.0,
  "moment_inertia": {"Ix": 106, "Iy": 19.4},
  "section_modulus": {"Wx": 26.4, "Wy": 7.49},
  "center_gravity": 13.3
}', 'UPN 80 - dimensions et caractéristiques', NOW(), NOW()),

(gen_random_uuid(), 'DIMENSIONS_UPN', 'UPN120', '{
  "designation": "UPN 120",
  "height": 120,
  "width": 55,
  "web_thickness": 7.0,
  "flange_thickness": 9.0,
  "weight": 13.4,
  "area": 17.0,
  "moment_inertia": {"Ix": 364, "Iy": 43.2},
  "section_modulus": {"Wx": 60.7, "Wy": 13.0},
  "center_gravity": 15.6
}', 'UPN 120 - dimensions et caractéristiques', NOW(), NOW()),

(gen_random_uuid(), 'DIMENSIONS_UPN', 'UPN200', '{
  "designation": "UPN 200",
  "height": 200,
  "width": 75,
  "web_thickness": 8.5,
  "flange_thickness": 11.0,
  "weight": 25.3,
  "area": 32.2,
  "moment_inertia": {"Ix": 1910, "Iy": 134},
  "section_modulus": {"Wx": 191, "Wy": 29.3},
  "center_gravity": 20.0
}', 'UPN 200 - dimensions et caractéristiques', NOW(), NOW());

-- 13. TUBE_DIMENSIONS - Dimensions tubes standard
INSERT INTO system_settings (id, category, key, value, description, created_at, updated_at) VALUES
(gen_random_uuid(), 'TUBE_DIMENSIONS', 'ROUND_STANDARD', '{
  "type": "rond",
  "standard": "EN 10210-2",
  "dimensions": [
    {"diameter": 20, "thicknesses": [1.0, 1.5, 2.0, 2.5]},
    {"diameter": 25, "thicknesses": [1.0, 1.5, 2.0, 2.5, 3.0]},
    {"diameter": 30, "thicknesses": [1.5, 2.0, 2.5, 3.0]},
    {"diameter": 40, "thicknesses": [1.5, 2.0, 2.5, 3.0, 4.0]},
    {"diameter": 50, "thicknesses": [2.0, 2.5, 3.0, 4.0, 5.0]},
    {"diameter": 60, "thicknesses": [2.0, 2.5, 3.0, 4.0, 5.0, 6.0]},
    {"diameter": 80, "thicknesses": [2.5, 3.0, 4.0, 5.0, 6.0, 8.0]},
    {"diameter": 100, "thicknesses": [3.0, 4.0, 5.0, 6.0, 8.0, 10.0]}
  ]
}', 'Tubes ronds - dimensions standard', NOW(), NOW()),

(gen_random_uuid(), 'TUBE_DIMENSIONS', 'SQUARE_STANDARD', '{
  "type": "carré",
  "standard": "EN 10210-2",
  "dimensions": [
    {"side": 20, "thicknesses": [1.0, 1.5, 2.0, 2.5]},
    {"side": 25, "thicknesses": [1.0, 1.5, 2.0, 2.5, 3.0]},
    {"side": 30, "thicknesses": [1.5, 2.0, 2.5, 3.0]},
    {"side": 40, "thicknesses": [1.5, 2.0, 2.5, 3.0, 4.0]},
    {"side": 50, "thicknesses": [2.0, 2.5, 3.0, 4.0, 5.0]},
    {"side": 60, "thicknesses": [2.0, 2.5, 3.0, 4.0, 5.0, 6.0]},
    {"side": 80, "thicknesses": [2.5, 3.0, 4.0, 5.0, 6.0, 8.0]},
    {"side": 100, "thicknesses": [3.0, 4.0, 5.0, 6.0, 8.0, 10.0]}
  ]
}', 'Tubes carrés - dimensions standard', NOW(), NOW()),

(gen_random_uuid(), 'TUBE_DIMENSIONS', 'RECTANGULAR_STANDARD', '{
  "type": "rectangulaire",
  "standard": "EN 10210-2",
  "dimensions": [
    {"width": 40, "height": 20, "thicknesses": [1.5, 2.0, 2.5, 3.0]},
    {"width": 50, "height": 25, "thicknesses": [1.5, 2.0, 2.5, 3.0]},
    {"width": 60, "height": 30, "thicknesses": [2.0, 2.5, 3.0, 4.0]},
    {"width": 80, "height": 40, "thicknesses": [2.0, 2.5, 3.0, 4.0, 5.0]},
    {"width": 100, "height": 50, "thicknesses": [2.5, 3.0, 4.0, 5.0, 6.0]},
    {"width": 120, "height": 60, "thicknesses": [3.0, 4.0, 5.0, 6.0, 8.0]},
    {"width": 140, "height": 70, "thicknesses": [3.0, 4.0, 5.0, 6.0, 8.0]},
    {"width": 160, "height": 80, "thicknesses": [4.0, 5.0, 6.0, 8.0, 10.0]}
  ]
}', 'Tubes rectangulaires - dimensions standard', NOW(), NOW());

-- 14. UNITS - Unités de mesure
INSERT INTO system_settings (id, category, key, value, description, created_at, updated_at) VALUES
(gen_random_uuid(), 'UNITS', 'WEIGHT', '{
  "type": "poids",
  "units": [
    {"symbol": "g", "name": "gramme", "factor": 0.001},
    {"symbol": "kg", "name": "kilogramme", "factor": 1.0},
    {"symbol": "t", "name": "tonne", "factor": 1000.0}
  ],
  "default": "kg",
  "precision": 3
}', 'Unités de poids', NOW(), NOW()),

(gen_random_uuid(), 'UNITS', 'LENGTH', '{
  "type": "longueur",
  "units": [
    {"symbol": "mm", "name": "millimètre", "factor": 0.001},
    {"symbol": "cm", "name": "centimètre", "factor": 0.01},
    {"symbol": "m", "name": "mètre", "factor": 1.0},
    {"symbol": "km", "name": "kilomètre", "factor": 1000.0}
  ],
  "default": "m",
  "precision": 3
}', 'Unités de longueur', NOW(), NOW()),

(gen_random_uuid(), 'UNITS', 'AREA', '{
  "type": "surface",
  "units": [
    {"symbol": "cm²", "name": "centimètre carré", "factor": 0.0001},
    {"symbol": "m²", "name": "mètre carré", "factor": 1.0},
    {"symbol": "ha", "name": "hectare", "factor": 10000.0}
  ],
  "default": "m²",
  "precision": 3
}', 'Unités de surface', NOW(), NOW()),

(gen_random_uuid(), 'UNITS', 'VOLUME', '{
  "type": "volume",
  "units": [
    {"symbol": "cm³", "name": "centimètre cube", "factor": 0.000001},
    {"symbol": "dm³", "name": "décimètre cube", "factor": 0.001},
    {"symbol": "m³", "name": "mètre cube", "factor": 1.0},
    {"symbol": "l", "name": "litre", "factor": 0.001}
  ],
  "default": "m³",
  "precision": 6
}', 'Unités de volume', NOW(), NOW()),

(gen_random_uuid(), 'UNITS', 'QUANTITY', '{
  "type": "quantité",
  "units": [
    {"symbol": "pcs", "name": "pièces", "factor": 1.0},
    {"symbol": "dz", "name": "douzaine", "factor": 12.0},
    {"symbol": "c", "name": "centaine", "factor": 100.0},
    {"symbol": "ml", "name": "millier", "factor": 1000.0}
  ],
  "default": "pcs",
  "precision": 0
}', 'Unités de quantité', NOW(), NOW());

-- Confirmation de l'insertion
SELECT 'Script d''alimentation system_settings exécuté avec succès' as status;