const fetch = require('node-fetch');
const crowdinUrl =
  'https://api.crowdin.com/api/project/radio-rasclat-web/status?login=dmnktoe&account-key=' +
  process.env.CROWDIN_ACCOUNT_KEY +
  '&json';

const express = require('express');
const router = express.Router();

/* ===============================================================
  GET /languages
=============================================================== */
/**
 * Route: Get all available languages from Crowdin API
 * @route GET /languages
 * @group Languages API - Get all available languages.
 * @returns {object} 200 - An array of user info
 * @returns {Error} default - Unexpected error
 */
router.get('/', (req, res) => {
  fetch(crowdinUrl)
    .then((response) => response.json())
    .then((json) => {
      res.json(json);
    })
    .catch((error) => {
      throw error;
    });
});

module.exports = router;
