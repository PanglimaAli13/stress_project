const express = require('express');
const db = require('./database.js'); // Sekarang ini adalah koneksi ke Supabase
const cors = require('cors');
// ... (sisa kode multer tidak berubah)

const app = express();
// ... (sisa middleware tidak berubah)

// Endpoint Login
app.post("/api/login", async (req, res) => {
    const { peran, password } = req.body;
    const sql = "SELECT * FROM users WHERE peran = $1 AND password = $2";
    try {
        const result = await db.query(sql, [peran, password]);
        if (result.rows.length > 0) {
            const user = result.rows[0];
            // Perhatikan 'avatarurl' menjadi huruf kecil
            res.json({ message: "success", data: { nama: user.nama, peran: user.peran, avatarUrl: user.avatarurl } });
        } else {
            res.status(401).json({ "error": "Peran atau password salah" });
        }
    } catch (err) {
        res.status(500).json({ "error": err.message });
    }
});

// (Semua endpoint lain seperti GET, POST, PUT, DELETE shipments juga perlu diubah menggunakan async/await dan db.query)
// ...

module.exports = app; // Ekspor app untuk Vercel