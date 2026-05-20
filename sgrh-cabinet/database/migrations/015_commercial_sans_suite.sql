-- Migration 015 — Ajouter SANS_SUITE à l'enum submission_status
-- Le statut "Sans suite" était utilisé dans le code mais absent de l'enum DB

ALTER TYPE submission_status ADD VALUE IF NOT EXISTS 'SANS_SUITE';
