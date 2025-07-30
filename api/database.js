const sqlite3 = require('sqlite3').verbose();
const DB_SOURCE = "db.sqlite";

const db = new sqlite3.Database(DB_SOURCE, (err) => {
    if (err) {
      console.error(err.message);
      throw err;
    } else {
        console.log('Terhubung ke database SQLite.');
        db.run(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nama TEXT NOT NULL,
                peran TEXT NOT NULL UNIQUE,
                password TEXT NOT NULL,
                avatarUrl TEXT 
            )`, 
        (err) => {
            if (!err) {
                const insert = 'INSERT OR IGNORE INTO users (nama, peran, password, avatarUrl) VALUES (?,?,?,?)';
                db.run(insert, ["Administrator", "admin", "admin123", "https://i.pravatar.cc/150?u=admin"]);
                db.run(insert, ["Manajer Proyek", "manager", "admin123", "https://i.pravatar.cc/150?u=manager"]);
                db.run(insert, ["Pengembang", "developer", "admin123", "https://i.pravatar.cc/150?u=developer"]);
                db.run(insert, ["Analis Sistem", "analyst", "admin123", "https://i.pravatar.cc/150?u=analyst"]);
            }
        });

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

module.exports = db;