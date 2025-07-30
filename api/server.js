const express = require('express');
const db = require('./database.js');
const cors = require('cors');
const multer = require('multer');
const path = require('path');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

app.post("/api/login", (req, res) => {
    const { peran, password } = req.body;
    const sql = "SELECT * FROM users WHERE peran = ? AND password = ?";
    db.get(sql, [peran, password], (err, user) => {
        if (err || !user) { return res.status(401).json({ "error": "Peran atau password salah" }); }
        res.json({ message: "success", data: { nama: user.nama, peran: user.peran, avatarUrl: user.avatarUrl } });
    });
});

app.post('/api/avatar', upload.single('avatar'), (req, res) => {
    if (!req.file) { return res.status(400).json({ error: 'Tidak ada file yang diunggah.' }); }
    const peran = req.body.peran;
    const avatarUrl = `/uploads/${req.file.filename}`;
    db.run(`UPDATE users SET avatarUrl = ? WHERE peran = ?`, [avatarUrl, peran], function (err) {
        if (err) { return res.status(500).json({ error: err.message }); }
        res.json({ message: 'Avatar berhasil diperbarui', avatarUrl: avatarUrl });
    });
});

app.get("/api/shipments", (req, res) => {
    const sql = "SELECT u.nama as namaDriver, s.* FROM shipments s JOIN users u ON s.userId = u.id";
    db.all(sql, [], (err, rows) => {
        if (err) { return res.status(400).json({"error":err.message}); }
        res.json({ "message":"success", "data":rows });
    });
});

app.post("/api/shipments", (req, res) => {
    const { tanggal, shipment, jumlahToko, terkirim, gagal, alasan, namaDriver } = req.body;
    const sql = `INSERT INTO shipments (tanggal, shipment, jumlahToko, terkirim, gagal, alasan, userId) VALUES (?,?,?,?,?,?,(SELECT id FROM users WHERE nama = ?))`;
    const params = [tanggal, shipment, jumlahToko, terkirim, gagal, alasan, namaDriver];
    db.run(sql, params, function(err) {
        if (err) { return res.status(400).json({ "error": err.message }); }
        res.json({ "message": "success", "data": { "id" : this.lastID } });
    });
});

app.put("/api/shipments/:id", (req, res) => {
    const { tanggal, shipment, jumlahToko, terkirim, gagal, alasan } = req.body;
    const sql = `UPDATE shipments SET tanggal = ?, shipment = ?, jumlahToko = ?, terkirim = ?, gagal = ?, alasan = ? WHERE id = ?`;
    const params = [tanggal, shipment, jumlahToko, terkirim, gagal, alasan, req.params.id];
    db.run(sql, params, function(err) {
        if (err) {
            if (err.message.includes("UNIQUE constraint failed")) { return res.status(400).json({ "error": "Nomor shipment tersebut sudah digunakan." }); }
            return res.status(400).json({ "error": err.message });
        }
        res.json({ message: "success", changes: this.changes });
    });
});

app.delete("/api/shipments/:id", (req, res) => {
    const sql = 'DELETE FROM shipments WHERE id = ?';
    db.run(sql, req.params.id, function (err) {
        if (err) { return res.status(400).json({ "error": err.message }); }
        res.json({ "message": "deleted", changes: this.changes });
    });
});

// Jalankan server jika dijalankan secara lokal
if (require.main === module) {
    app.listen(port, () => {
        console.log(`Server backend berjalan di http://localhost:${port}`);
    });
}

// Ekspor app untuk Vercel
module.exports = app;