-- Migration 019 : suppression de la colonne leave_balance de la table employees
-- La source de vérité du solde de congés est exclusivement la table leave_balances.
-- Cette colonne créait un double état qui se désynchronisait silencieusement.

ALTER TABLE employees DROP COLUMN IF EXISTS leave_balance;
