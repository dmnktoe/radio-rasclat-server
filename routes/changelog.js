const fetch = require('node-fetch');

const express = require('express');
const router = express.Router();

/* ===============================================================
  GET /changelog/radio-rasclat-web
=============================================================== */
/**
 * Route: Get changelog from radio-rasclat-web
 * @route GET /changelog/radio-rasclat-web
 * @group Changelog API
 * @returns {object} 200 - An array of user info
 * @returns {Error} default - Unexpected error
 */
router.get('/radio-rasclat-web', (req, res) => {
  const url = "https://api.github.com/repos/dmnktoe/radio-rasclat-web/releases"
  fetch(url)
    .then((response) => response.json())
    .then((json) => {
      res.json(json);
    })
    .catch((error) => {
      throw error;
    });
});

/* ===============================================================
  GET /changelog/radio-rasclat-ios
=============================================================== */
/**
 * Route: Get changelog from radio-rasclat-ios
 * @route GET /changelog/radio-rasclat-ios
 * @group Changelog API
 * @returns {object} 200 - An array of user info
 * @returns {Error} default - Unexpected error
 */
router.get('/radio-rasclat-ios', (req, res) => {
  const url = "https://api.github.com/repos/dmnktoe/radio-rasclat-ios/releases"
  fetch(url)
    .then((response) => response.json())
    .then((json) => {
      res.json(json);
    })
    .catch((error) => {
      throw error;
    });
});

/* ===============================================================
  GET /changelog/radio-rasclat-server
=============================================================== */
/**
 * Route: Get changelog from radio-rasclat-server
 * @route GET /changelog/radio-rasclat-server
 * @group Changelog API
 * @returns {object} 200 - An array of user info
 * @returns {Error} default - Unexpected error
 */
router.get('/radio-rasclat-server', (req, res) => {
  const url = "https://api.github.com/repos/dmnktoe/radio-rasclat-server/releases"
  fetch(url)
    .then((response) => response.json())
    .then((json) => {
      res.json(json);
    })
    .catch((error) => {
      throw error;
    });
});

module.exports = router;
