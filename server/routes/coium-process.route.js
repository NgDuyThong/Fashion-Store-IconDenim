const express = require('express');
const router = express.Router();
const { runCoIUMProcess } = require('../controllers/CoIUMProcessController');

// POST /api/coium-process/run - Chạy quy trình CoIUM
router.post('/run', runCoIUMProcess);

module.exports = router;
