const router = require('express').Router();
const authenticate = require('../middleware/authenticate');
const multer = require('multer');
const path = require('path');

// MIME type mapping for security validation
const ALLOWED_MIME_TYPES = {
  '.pdf': ['application/pdf'],
  '.doc': ['application/msword'],
  '.docx': ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  '.jpg': ['image/jpeg'],
  '.jpeg': ['image/jpeg'],
  '.png': ['image/png'],
  '.webp': ['image/webp'],
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', '..', 'uploads'));
  },
  filename: (req, file, cb) => {
    const prefix = req.fileType || 'file';
    const ext = path.extname(file.originalname).toLowerCase();
    // Use sanitized filename with user ID to prevent path traversal
    const sanitized = `${prefix}-${req.user._id}-${Date.now()}${ext}`;
    cb(null, sanitized);
  },
});

const validateFile = (allowedExts, allowedMimes) => (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  
  // Check extension
  if (!allowedExts.includes(ext)) {
    return cb(new Error(`File type ${ext} is not allowed. Allowed: ${allowedExts.join(', ')}`));
  }
  
  // Validate MIME type against extension (prevents extension spoofing)
  const expectedMimes = ALLOWED_MIME_TYPES[ext] || [];
  if (expectedMimes.length > 0 && !expectedMimes.includes(file.mimetype)) {
    return cb(new Error(`Invalid file content. Expected ${ext} but received ${file.mimetype}.`));
  }      // Security: reject path traversal characters
      if (ext === '' || file.originalname.includes('..') || file.originalname.includes('/') || file.originalname.includes('\\')) {
        return cb(new Error('Invalid filename.'));
      }
  
  cb(null, true);
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: validateFile(['.pdf', '.doc', '.docx'], ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']),
});

const avatarUpload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: validateFile(['.jpg', '.jpeg', '.png', '.webp'], ['image/jpeg', 'image/png', 'image/webp']),
});

router.post('/resume', authenticate, (req, res, next) => { req.fileType = 'resume'; next(); }, upload.single('resume'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: { code: 'NO_FILE', message: 'No file uploaded.' } });
    const { Student } = require('../models');
    const port = process.env.PORT || 5000;
    const baseUrl = `${req.protocol}://${req.hostname}${req.hostname === 'localhost' ? `:${port}` : ''}`;
    const resumeUrl = `${baseUrl}/uploads/${req.file.filename}`;
    await Student.findOneAndUpdate({ userId: req.user._id }, { resumeUrl });
    res.json({ success: true, data: { resumeUrl }, message: 'Resume uploaded.' });
  } catch (err) { next(err); }
});

router.post('/avatar', authenticate, (req, res, next) => { req.fileType = 'avatar'; next(); }, avatarUpload.single('avatar'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: { code: 'NO_FILE', message: 'No file uploaded.' } });
    const { User } = require('../models');
    const port = process.env.PORT || 5000;
    const baseUrl = `${req.protocol}://${req.hostname}${req.hostname === 'localhost' ? `:${port}` : ''}`;
    const avatarUrl = `${baseUrl}/uploads/${req.file.filename}`;
    await User.findByIdAndUpdate(req.user._id, { avatar: avatarUrl });
    res.json({ success: true, data: { avatarUrl }, message: 'Avatar uploaded.' });
  } catch (err) { next(err); }
});

module.exports = router;
