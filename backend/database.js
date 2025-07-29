const { Pool } = require('pg');

// ▼▼▼ PASTE CONNECTION STRING ANDA DARI SUPABASE DI SINI ▼▼▼
const connectionString = 'postgresql://postgres:Vinolia1302!@db.otcmpktvbeqlfiefgvhh.supabase.co:5432/postgres';
// ▲▲▲ PASTE CONNECTION STRING ANDA DARI SUPABASE DI SINI ▲▲▲

const pool = new Pool({
  connectionString,
});

const initializeDb = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          nama TEXT NOT NULL,
          peran TEXT NOT NULL UNIQUE,
          password TEXT NOT NULL,
          avatarUrl TEXT
      );
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS shipments (
          id SERIAL PRIMARY KEY,
          userId INTEGER REFERENCES users(id),
          tanggal DATE NOT NULL,
          shipment TEXT NOT NULL UNIQUE,
          jumlahToko INTEGER,
          terkirim INTEGER,
          gagal INTEGER,
          alasan TEXT
      );
    `);
    const insertUser = 'INSERT INTO users (nama, peran, password, avatarUrl) VALUES ($1, $2, $3, $4) ON CONFLICT (peran) DO NOTHING';
    await pool.query(insertUser, ["Administrator", "admin", "admin123", "https://i.pravatar.cc/150?u=admin"]);
    await pool.query(insertUser, ["Manajer Proyek", "manager", "admin123", "https://i.pravatar.cc/150?u=manager"]);
    console.log("Database Supabase siap.");
  } catch (err) {
    console.error("Gagal menginisialisasi database:", err);
  }
};

initializeDb();

module.exports = pool;