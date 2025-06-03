const express = require('express');
const router = express.Router();

const whatsappController = require('../controllers/whatsappController');
const authMiddleware = require('../middlewares/authMiddleware');

router.post('/send', authMiddleware, whatsappController.sendMessage);
router.post('/sendsc', authMiddleware, whatsappController.scheduleMessage);
router.get('/all', authMiddleware, whatsappController.getAllMessages); // NEW route

module.exports = router;



