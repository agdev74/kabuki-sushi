-- Migration: add_store_settings
-- Table de configuration unique pour le contrôle d'urgence du restaurant

CREATE TABLE IF NOT EXISTS store_settings (
  id               INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  is_emergency_closed     BOOLEAN      NOT NULL DEFAULT FALSE,
  emergency_closed_until  TIMESTAMPTZ,
  updated_at              TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Ligne unique avec les valeurs par défaut
INSERT INTO store_settings (id, is_emergency_closed)
VALUES (1, false)
ON CONFLICT (id) DO NOTHING;

-- Row Level Security
ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;

-- Lecture publique : nécessaire pour la bannière et le panier côté client
CREATE POLICY "store_settings_public_read"
  ON store_settings FOR SELECT
  USING (true);

-- Écriture réservée aux admins (utilise la fonction is_admin() déjà définie)
CREATE POLICY "store_settings_admin_write"
  ON store_settings FOR UPDATE
  USING (is_admin());
