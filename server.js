const express = require('express');
const db = require('./database.js');
const cors = require('cors');
const multer = require('multer');
const path = require('path');

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Membuat folder 'uploads' bisa diakses secara publik oleh browser
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Konfigurasi Multer untuk menangani penyimpanan file
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Simpan file di folder yang sudah kita buat
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// === API ENDPOINTS ===

// Endpoint Login
app.post("/api/login", (req, res) => {
    const { peran, password } = req.body;
    const sql = "SELECT * FROM users WHERE peran = ? AND password = ?";
    db.get(sql, [peran, password], (err, user) => {
        if (err || !user) {
            return res.status(401).json({ "error": "Peran atau password salah" });
        }
        res.json({
            message: "success",
            data: { 
                nama: user.nama, 
                peran: user.peran, 
                avatarUrl: user.avatarUrl 
            }
        });
    });
});

// Endpoint untuk Upload Avatar
app.post('/api/avatar', upload.single('avatar'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'Tidak ada file yang diunggah.' });
    }
    const peran = req.body.peran;
    const avatarUrl = `/uploads/${req.file.filename}`;
    
    db.run(`UPDATE users SET avatarUrl = ? WHERE peran = ?`, [avatarUrl, peran], function (err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ message: 'Avatar berhasil diperbarui', avatarUrl: avatarUrl });
    });
});

// Endpoint untuk mendapatkan SEMUA data shipment
app.get("/api/shipments", (req, res) => {
    const sql = "SELECT u.nama as namaDriver, s.* FROM shipments s JOIN users u ON s.userId = u.id";
    db.all(sql, [], (err, rows) => {
        if (err) {
          res.status(400).json({"error":err.message});
          return;
        }
        res.json({ "message":"success", "data":rows });
    });
});

// Endpoint untuk MENAMBAH data shipment baru
app.post("/api/shipments", (req, res) => {
    const { tanggal, shipment, jumlahToko, terkirim, gagal, alasan, namaDriver } = req.body;
    const sql = `INSERT INTO shipments (tanggal, shipment, jumlahToko, terkirim, gagal, alasan, userId) VALUES (?,?,?,?,?,?,(SELECT id FROM users WHERE nama = ?))`;
    const params = [tanggal, shipment, jumlahToko, terkirim, gagal, alasan, namaDriver];
    
    db.run(sql, params, function(err) {
        if (err) {
            return res.status(400).json({ "error": err.message });
        }
        res.json({ "message": "success", "data": { "id" : this.lastID } });
    });
});

// Endpoint untuk MEMPERBARUI (Edit) data shipment yang ada
app.put("/api/shipments/:id", (req, res) => {
    const { tanggal, shipment, jumlahToko, terkirim, gagal, alasan } = req.body;
    const sql = `UPDATE shipments SET tanggal = ?, shipment = ?, jumlahToko = ?, terkirim = ?, gagal = ?, alasan = ? WHERE id = ?`;
    const params = [tanggal, shipment, jumlahToko, terkirim, gagal, alasan, req.params.id];

    db.run(sql, params, function(err) {
        if (err) {
            if (err.message.includes("UNIQUE constraint failed")) {
                return res.status(400).json({ "error": "Nomor shipment tersebut sudah digunakan oleh data lain." });
            }
            return res.status(400).json({ "error": err.message });
        }
        res.json({ message: "success", changes: this.changes });
    });
});

// Endpoint untuk MENGHAPUS data shipment
app.delete("/api/shipments/:id", (req, res) => {
    const sql = 'DELETE FROM shipments WHERE id = ?';
    db.run(sql, req.params.id, function (err) {
        if (err) {
            return res.status(400).json({ "error": err.message });
        }
        res.json({ "message": "deleted", changes: this.changes });
    });
});

// Menjalankan server
app.listen(port, () => {
    console.log(`Server backend berjalan di http://localhost:${port}`);
});