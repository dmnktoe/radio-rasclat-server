const fetch = require('node-fetch');

const express = require('express');
const router = express.Router();

/* ===============================================================
  GET /status
=============================================================== */
/**
 * Route: Get current system status
 * @route GET /status
 * @group Status API
 * @returns {object} 200 - An array of user info
 * @returns {Error} default - Unexpected error
 */
router.get('/', (req, res) => {
});

module.exports = router;
