import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max file size
  fileFilter: (req, file, cb) => {
    console.log("📂 File received by Multer:", file);
    if (!file.mimetype.startsWith("audio/")) {
      return cb(new Error("Invalid file type"), false);
    }
    cb(null, true);
  },
});

// Configure S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

app.use(cors());
app.use(express.json());

// Upload endpoint
app.post('/api/upload', upload.single('audio'), async (req, res) => {
  try {
    console.log("🔍 Request received:", req.body);
    console.log("📝 Headers:", req.headers);
    console.log("📂 File:", req.file);

    if (!req.file) {
      console.log("❌ No file received");
      return res.status(400).json({ error: 'No audio file provided' });
    }

    const fileName = `${Date.now()}-${req.body.fileName}.webm`;
    
    const command = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: fileName,
      Body: req.file.buffer,
      ContentType: 'audio/webm',
    });

    await s3Client.send(command);

    console.log("✅ Upload Successful:", fileName);
    res.json({ message: 'File uploaded successfully', fileName });
  } catch (error) {
    console.error("❌ Upload error:", error);
    res.status(500).json({ error: 'Error uploading file' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});