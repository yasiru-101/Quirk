const express = require('express');
const router = express.Router();
const { getTemplates, createTemplate, deleteTemplate } = require('../controllers/templateController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', getTemplates);
router.post('/', createTemplate);
router.delete('/:id', deleteTemplate);

module.exports = router;
