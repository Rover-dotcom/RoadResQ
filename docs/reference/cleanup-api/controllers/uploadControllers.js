const sharp = require('sharp');
const heicConvert = require('heic-convert');
const { uploadToStorage } = require('../utils/storageService');

exports.uploadJobPhotos = async (req, res) => {
  try {
    const files = req.files; 
    if (!files || files.length === 0) {
      return res.status(400).json({ error: "No files provided." });
    }

    const uploadPromises = files.map(async (file) => {
      let buffer = file.buffer;

      // 1. Convert iPhone HEIC to JPEG if detected
      if (file.mimetype === 'image/heic' || file.originalname.toLowerCase().endsWith('.heic')) {
        buffer = await heicConvert({ 
          buffer: file.buffer, 
          format: 'JPEG', 
          quality: 1 
        });
      }

      // 2. Resize and optimize for PDF report standards (max 1200px)
      const processedBuffer = await sharp(buffer)
        .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 80 })
        .toBuffer();

      // 3. Define a standard filename and upload to Cloud Storage[cite: 1]
      const fileName = `jobs/${Date.now()}-${file.originalname.split('.')[0]}.jpg`;
      return uploadToStorage(fileName, processedBuffer, 'image/jpeg');
    });

    const imageUrls = await Promise.all(uploadPromises);
    
    res.status(200).json({ 
      message: "Images processed and uploaded successfully.",
      urls: imageUrls 
    });

  } catch (error) {
    console.error("Upload Controller Error:", error);
    res.status(500).json({ error: "Failed to process and upload images." });
  }
};