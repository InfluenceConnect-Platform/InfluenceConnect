const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth.middleware');
const { getSignature, savePortfolioItem, saveProfilePicture, saveBrandLogo, removeProfilePicture, removeBrandLogo, saveCoverPhoto, removeCoverPhoto } = require('../controllers/upload.controller');

// GET /api/upload/signature?context=portfolio|profile-pic|brand-logo
router.get('/signature', authenticate, getSignature);

// POST /api/upload/portfolio  — save uploaded portfolio item URL
router.post('/portfolio', authenticate, savePortfolioItem);

// POST /api/upload/profile-picture  — save influencer profile picture URL
router.post('/profile-picture', authenticate, saveProfilePicture);
// DELETE /api/upload/profile-picture  — remove influencer profile picture
router.delete('/profile-picture', authenticate, removeProfilePicture);

// POST /api/upload/brand-logo  — save brand logo URL
router.post('/brand-logo', authenticate, saveBrandLogo);
// DELETE /api/upload/brand-logo  — remove brand logo
router.delete('/brand-logo', authenticate, removeBrandLogo);

// POST /api/upload/cover-photo  — save influencer cover photo URL
router.post('/cover-photo', authenticate, saveCoverPhoto);
// DELETE /api/upload/cover-photo  — remove influencer cover photo
router.delete('/cover-photo', authenticate, removeCoverPhoto);

module.exports = router;