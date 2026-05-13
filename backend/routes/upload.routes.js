const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth.middleware');
const { getSignature, savePortfolioItem } = require('../controllers/upload.controller');

// GET /api/upload/signature  — get signed upload ticket
router.get('/signature', authenticate, getSignature);

// POST /api/upload/portfolio  — save uploaded item URL to profile
router.post('/portfolio', authenticate, savePortfolioItem);

module.exports = router;