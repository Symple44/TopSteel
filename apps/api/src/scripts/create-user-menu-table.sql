-- Create user_menu_preference_items table for TopSteel AUTH database

CREATE TABLE IF NOT EXISTS user_menu_preference_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    menu_id VARCHAR NOT NULL,
    is_visible BOOLEAN DEFAULT true,
    "order" INTEGER DEFAULT 0,
    custom_label VARCHAR,
    version INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Create unique index on user_id + menu_id
CREATE UNIQUE INDEX IF NOT EXISTS IDX_user_menu_preference_unique 
ON user_menu_preference_items (user_id, menu_id);

-- Create index on user_id for frequent queries
CREATE INDEX IF NOT EXISTS IDX_user_menu_preference_user_id 
ON user_menu_preference_items (user_id);

-- Add trigger to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_menu_preference_updated_at 
    BEFORE UPDATE ON user_menu_preference_items 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

SELECT 'Table user_menu_preference_items created or already exists' as result;