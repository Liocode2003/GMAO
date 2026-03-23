/**
 * Runner de migrations SQL
 * Exécute les fichiers dans database/migrations/ dans l'ordre numérique.
 * Utilise une table `schema_migrations` pour tracker les migrations déjà appliquées.
 */
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'sgrh_cabinet',
  user: process.env.DB_USER || 'sgrh_user',
  password: process.env.DB_PASSWORD || 'sgrh_pass',
});

const MIGRATIONS_DIR = path.join(__dirname, '..', '..', '..', 'database', 'migrations');

async function runMigrations() {
  const client = await pool.connect();

  try {
    // Créer la table de tracking si elle n'existe pas
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) UNIQUE NOT NULL,
        applied_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Lister les migrations disponibles triées par nom
    const files = fs
      .readdirSync(MIGRATIONS_DIR)
      .filter(f => f.endsWith('.sql'))
      .sort();

    // Récupérer les migrations déjà appliquées
    const { rows } = await client.query('SELECT filename FROM schema_migrations');
    const applied = new Set(rows.map((r: { filename: string }) => r.filename));

    let count = 0;
    for (const file of files) {
      if (applied.has(file)) {
        console.log(`⏭  ${file} (déjà appliquée)`);
        continue;
      }

      const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
      console.log(`▶  Applying ${file}...`);

      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query(
          'INSERT INTO schema_migrations(filename) VALUES($1)',
          [file]
        );
        await client.query('COMMIT');
        console.log(`✓  ${file} appliquée`);
        count++;
      } catch (err) {
        await client.query('ROLLBACK');
        console.error(`✗  Erreur sur ${file}:`, err);
        throw err;
      }
    }

    if (count === 0) {
      console.log('✓  Toutes les migrations sont déjà à jour.');
    } else {
      console.log(`\n✓  ${count} migration(s) appliquée(s) avec succès.`);
    }
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations().catch(err => {
  console.error('Erreur de migration:', err);
  process.exit(1);
});
