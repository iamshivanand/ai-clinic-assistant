const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const sharp = require('sharp');
const fs = require('fs');
const Clinic = require('../models/Clinic');
const { protect } = require('../middleware/authMiddleware');

// Multer config for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    if (mimetype && extname) return cb(null, true);
    cb(new Error('Only images (jpeg, jpg, png, webp) are allowed'));
  }
});

// @route   GET /api/portfolio/me
// @desc    Get current clinic's portfolio settings
// @access  Private
router.get('/me', protect, async (req, res, next) => {
  try {
    const clinic = await Clinic.findById(req.user.clinicId);
    if (!clinic) return res.status(404).json({ success: false, message: 'Clinic not found' });
    res.status(200).json({ success: true, data: clinic.portfolio, slug: clinic.slug });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/portfolio/update
// @desc    Update portfolio settings
// @access  Private
router.put('/update', protect, async (req, res, next) => {
  try {
    const { portfolio, slug } = req.body;
    
    // Check if slug is unique if changed
    if (slug) {
      const existingClinic = await Clinic.findOne({ slug, _id: { $ne: req.user.clinicId } });
      if (existingClinic) {
        return res.status(400).json({ success: false, message: 'URL slug is already taken' });
      }
    }

    const clinic = await Clinic.findByIdAndUpdate(
      req.user.clinicId,
      { portfolio, slug },
      { new: true, runValidators: true }
    );

    res.status(200).json({ success: true, data: clinic.portfolio, slug: clinic.slug });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/portfolio/upload
// @desc    Upload an image for portfolio (profile or achievement)
// @access  Private
router.post('/upload', protect, upload.single('image'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

    const filePath = `/uploads/${req.file.filename}`;
    
    // Optional: Image optimization with Sharp
    // const optimizedName = `opt-${req.file.filename}`;
    // await sharp(req.file.path)
    //   .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
    //   .toFile(`public/uploads/${optimizedName}`);
    // fs.unlinkSync(req.file.path); // Remove original
    
    res.status(200).json({ success: true, url: filePath });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/portfolio/public/:slug
// @desc    Get public portfolio data by slug
// @access  Public
router.get('/public/:slug', async (req, res, next) => {
  try {
    const clinic = await Clinic.findOne({ slug: req.params.slug, 'portfolio.isPublished': true })
      .select('name ownerName portfolio address phone whatsappNumber googleMapsUrl');
    
    if (!clinic) return res.status(404).json({ success: false, message: 'Portfolio not found or not published' });

    res.status(200).json({ success: true, data: clinic });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
