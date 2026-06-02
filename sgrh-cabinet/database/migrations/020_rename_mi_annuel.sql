-- Rename MI_ANNUEL → MI_PERIODE in evaluations
UPDATE evaluations SET period = 'MI_PERIODE' WHERE period = 'MI_ANNUEL';
