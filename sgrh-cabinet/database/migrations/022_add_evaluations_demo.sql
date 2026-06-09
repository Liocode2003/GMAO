-- Migration 022: données de démo pour les évaluations (2025 + 2026)
INSERT INTO evaluations (id, employee_id, evaluator_id, year, period, status, overall_score, objectives_score, skills_score, behavior_score, comments, strengths, improvements)
SELECT
  gen_random_uuid(),
  e.id,
  'a0000001-0000-0000-0000-000000000001',
  2025,
  'ANNUEL',
  CASE ROW_NUMBER() OVER (ORDER BY e.last_name)
    WHEN 1 THEN 'TERMINE'
    WHEN 2 THEN 'TERMINE'
    WHEN 3 THEN 'EN_COURS'
    WHEN 4 THEN 'TERMINE'
    WHEN 5 THEN 'TERMINE'
    WHEN 6 THEN 'BROUILLON'
    WHEN 7 THEN 'TERMINE'
    ELSE 'TERMINE'
  END,
  CASE ROW_NUMBER() OVER (ORDER BY e.last_name)
    WHEN 1 THEN 16.5 WHEN 2 THEN 14.0 WHEN 3 THEN NULL
    WHEN 4 THEN 15.5 WHEN 5 THEN 17.5 WHEN 6 THEN NULL
    WHEN 7 THEN 13.0 ELSE 14.5
  END,
  CASE ROW_NUMBER() OVER (ORDER BY e.last_name)
    WHEN 1 THEN 17.0 WHEN 2 THEN 13.5 WHEN 3 THEN NULL
    WHEN 4 THEN 15.0 WHEN 5 THEN 18.0 WHEN 6 THEN NULL
    WHEN 7 THEN 12.5 ELSE 14.0
  END,
  CASE ROW_NUMBER() OVER (ORDER BY e.last_name)
    WHEN 1 THEN 16.0 WHEN 2 THEN 14.5 WHEN 3 THEN NULL
    WHEN 4 THEN 16.0 WHEN 5 THEN 17.0 WHEN 6 THEN NULL
    WHEN 7 THEN 13.5 ELSE 15.0
  END,
  CASE ROW_NUMBER() OVER (ORDER BY e.last_name)
    WHEN 1 THEN 16.5 WHEN 2 THEN 14.0 WHEN 3 THEN NULL
    WHEN 4 THEN 15.5 WHEN 5 THEN 17.5 WHEN 6 THEN NULL
    WHEN 7 THEN 13.0 ELSE 14.5
  END,
  CASE ROW_NUMBER() OVER (ORDER BY e.last_name)
    WHEN 1 THEN 'Excellent travail. Très rigoureux et autonome.'
    WHEN 2 THEN 'Bonnes performances. Progression notable sur l''année.'
    WHEN 3 THEN NULL
    WHEN 4 THEN 'Très bon niveau technique. Fiable et engagé.'
    WHEN 5 THEN 'Performance exceptionnelle. Forte valeur ajoutée.'
    WHEN 6 THEN NULL
    WHEN 7 THEN 'Résultats satisfaisants. Marge de progression identifiée.'
    ELSE 'Bonne performance générale.'
  END,
  CASE ROW_NUMBER() OVER (ORDER BY e.last_name)
    WHEN 1 THEN 'Rigueur, autonomie, sens du détail'
    WHEN 2 THEN 'Esprit d''équipe, disponibilité'
    WHEN 3 THEN NULL
    WHEN 4 THEN 'Expertise technique, réactivité'
    WHEN 5 THEN 'Leadership, expertise, orientation client'
    WHEN 6 THEN NULL
    WHEN 7 THEN 'Motivation, esprit d''initiative'
    ELSE 'Sérieux, ponctualité'
  END,
  CASE ROW_NUMBER() OVER (ORDER BY e.last_name)
    WHEN 1 THEN 'Améliorer le management d''équipe'
    WHEN 2 THEN 'Renforcer les compétences techniques IFRS'
    WHEN 3 THEN NULL
    WHEN 4 THEN 'Développer le leadership'
    WHEN 5 THEN 'Partager davantage les connaissances en interne'
    WHEN 6 THEN NULL
    WHEN 7 THEN 'Améliorer la gestion du temps et des priorités'
    ELSE 'Renforcer les compétences digitales'
  END
FROM employees e
WHERE e.exit_date IS NULL
  AND e.grade NOT IN ('ASSOCIE', 'DIRECTEUR')
ORDER BY e.last_name
LIMIT 12
ON CONFLICT (employee_id, year, period) DO NOTHING;

-- Données 2026 (mi-annuel)
INSERT INTO evaluations (id, employee_id, evaluator_id, year, period, status, overall_score, objectives_score, skills_score, behavior_score, comments, strengths, improvements)
SELECT
  gen_random_uuid(),
  e.id,
  'a0000001-0000-0000-0000-000000000001',
  2026,
  'MI_ANNUEL',
  CASE (ROW_NUMBER() OVER (ORDER BY e.last_name) % 3)
    WHEN 0 THEN 'TERMINE'
    WHEN 1 THEN 'EN_COURS'
    ELSE 'BROUILLON'
  END,
  CASE (ROW_NUMBER() OVER (ORDER BY e.last_name) % 3) WHEN 0 THEN 15.0 ELSE NULL END,
  CASE (ROW_NUMBER() OVER (ORDER BY e.last_name) % 3) WHEN 0 THEN 15.0 ELSE NULL END,
  CASE (ROW_NUMBER() OVER (ORDER BY e.last_name) % 3) WHEN 0 THEN 15.0 ELSE NULL END,
  CASE (ROW_NUMBER() OVER (ORDER BY e.last_name) % 3) WHEN 0 THEN 15.0 ELSE NULL END,
  CASE (ROW_NUMBER() OVER (ORDER BY e.last_name) % 3) WHEN 0 THEN 'Bonne progression sur le premier semestre 2026.' ELSE NULL END,
  CASE (ROW_NUMBER() OVER (ORDER BY e.last_name) % 3) WHEN 0 THEN 'Engagement, qualité du travail' ELSE NULL END,
  CASE (ROW_NUMBER() OVER (ORDER BY e.last_name) % 3) WHEN 0 THEN 'Continuer le développement des compétences' ELSE NULL END
FROM employees e
WHERE e.exit_date IS NULL
  AND e.grade NOT IN ('ASSOCIE', 'DIRECTEUR')
ORDER BY e.last_name
LIMIT 15
ON CONFLICT (employee_id, year, period) DO NOTHING;
