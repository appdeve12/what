const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

const uploadPath = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max
});

router.post(
  '/upload',
  upload.fields([
    { name: 'photo', maxCount: 1 },
    { name: 'video', maxCount: 1 },
    { name: 'docx', maxCount: 1 },
    { name: 'pdf', maxCount: 1 },
  ]),
  (req, res) => {
    try {
      const files = req.files;
      const response = {};

      if (files.photo) response.photo = `/uploads/${files.photo[0].filename}`;
      if (files.video) response.video = `/uploads/${files.video[0].filename}`;
      if (files.docx) response.docx = `/uploads/${files.docx[0].filename}`;
      if (files.pdf) response.pdf = `/uploads/${files.pdf[0].filename}`;

      res.status(200).json({ status: 'success', files: response });
    } catch (err) {
      console.error('Upload Error:', err);
      res.status(500).json({ status: 'error', message: 'Upload failed' });
    }
  }
);

module.exports = router;
