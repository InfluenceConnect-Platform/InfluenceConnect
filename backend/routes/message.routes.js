const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth.middleware');
const { getMessages, sendMessage, getUnreadCount, downloadAttachment } = require('../controllers/message.controller');

router.get('/unread-count', authenticate, getUnreadCount);
// Must come before the /:dealId catch-all below.
router.get('/download', downloadAttachment);
router.get('/:dealId', authenticate, getMessages);
router.post('/:dealId', authenticate, sendMessage);

module.exports = router;