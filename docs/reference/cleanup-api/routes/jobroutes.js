const express = require('express');
const router = express.Router();
const { archiveJob } = require('../controllers/jobController');

// This creates the endpoint: POST /api/jobs/:jobId/finalize
router.post('/:jobId/finalize', archiveJob);

module.exports = router;