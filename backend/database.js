const sqlite3 = require('sqlite3').verbose();
const DB_SOURCE = "db.sqlite";

const db = new sqlite3.Database(DB_SOURCE, (err) => {
    if (err) {
      // Gagal membuat atau terhubung ke file database
      console.error(err.message);
      throw err;
    } else {
        console.log('Terhubung ke database SQLite.');
        
        // Membuat tabel 'users' jika belum ada
        db.run(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nama TEXT NOT NULL,
                peran TEXT NOT NULL UNIQUE,
                password TEXT NOT NULL,
                avatarUrl TEXT 
            )`, 
        (err) => {
            if (err) {
                // Gagal membuat tabel
                console.error("Gagal membuat tabel users:", err.message);
            } else {
                // Tambahkan data user contoh jika tabel baru berhasil dibuat
                // 'INSERT OR IGNORE' mencegah error jika data sudah ada
                const insert = 'INSERT OR IGNORE INTO users (nama, peran, password, avatarUrl) VALUES (?,?,?,?)';
                db.run(insert, ["Administrator", "admin", "admin123", "https://i.pravatar.cc/150?u=admin"]);
                db.run(insert, ["Manajer Proyek", "manager", "admin123", "https://i.pravatar.cc/150?u=manager"]);
                db.run(insert, ["Pengembang", "developer", "admin123", "https://i.pravatar.cc/150?u=developer"]);
                db.run(insert, ["Analis Sistem", "analyst", "admin123", "https://i.pravatar.cc/150?u=analyst"]);
            }
        });

        // Membuat tabel 'shipments' jika belum ada
        db.run(`
            CREATE TABLE IF NOT EXISTS shipments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                userId INTEGER,
                tanggal TEXT NOT NULL,
                shipment TEXT NOT NULL UNIQUE,
                jumlahToko INTEGER,
                terkirim INTEGER,
                gagal INTEGER,
                alasan TEXT,
                FOREIGN KEY (userId) REFERENCES users(id)
            )`);
    }
});

// Ekspor koneksi database agar bisa digunakan di file server.js
module.exports = db;