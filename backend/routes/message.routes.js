const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth.middleware');
const { getMessages, sendMessage } = require('../controllers/message.controller');

router.get('/:dealId', authenticate, getMessages);
router.post('/:dealId', authenticate, sendMessage);

module.exports = router;