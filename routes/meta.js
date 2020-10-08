const fetch = require('node-fetch');
const radioUrl = process.env.RADIO_URL;
const crowdinUrl = "https://api.crowdin.com/api/project/radio-rasclat-web/status?login=dmnktoe&account-key=" + process.env.CROWDIN_ACCOUNT_KEY + "&json";

const express = require('express');
const router = express.Router();

/* ===============================================================
    TODO: Radio Rasclat Meta Route - Logo, Name etc.
=============================================================== */

/* ===============================================================
    GET /meta/live-info
=============================================================== */
/**
 * Route: Get live radio info
 * @route GET /meta/live-info
 * @group Meta API - Get current radio station information.
 * @returns {object} 200 - An array of user info
 * @returns {Error} default - Unexpected error
 */
router.get('/live-info', (req, res) => {
  const url = radioUrl + 'live-info-v2';
  // Search database for all blog posts
  fetch(url)
    .then((response) => response.json())
    .then((json) => {
      res.json(json.station);
    })
    .catch((error) => {
      throw error;
    });
});

/* ===============================================================
    TODO: Live listeners route (secured)
=============================================================== */

/* ===============================================================
    GET /meta/tracks/previous
=============================================================== */
/**
 * Route: Get previous radio track
 * @route GET /meta/tracks/previous
 * @group Meta API - Get current radio station information.
 * @returns {object} 200 - An array of user info
 * @returns {Error} default - Unexpected error
 */
router.get('/track/previous', (req, res) => {
  const url = radioUrl + 'live-info-v2';
  // Search database for all blog posts
  fetch(url)
    .then((response) => response.json())
    .then((json) => {
      res.json(json.tracks.previous);
    })
    .catch((error) => {
      throw error;
    });
});

/* ===============================================================
 GET /meta/tracks/current
=============================================================== */
/**
 * Route: Get current radio track played by the playlist.
 * @route GET /meta/tracks/current
 * @group Meta API - Get current radio station information.
 * @returns {object} 200 - An array of user info
 * @returns {Error} default - Unexpected error
 */
router.get('/tracks/current', (req, res) => {
  const url = radioUrl + 'live-info-v2';
  // Search database for all blog posts
  fetch(url)
    .then((response) => response.json())
    .then((json) => {
      res.json(json.tracks.current);
    })
    .catch((error) => {
      throw error;
    });
});

/* ===============================================================
  GET /meta/tracks/next
=============================================================== */
/**
 * Route: Get next radio track played by the playlist.
 * @route GET /meta/tracks/next
 * @group Meta API - Get current radio station information.
 * @returns {object} 200 - An array of user info
 * @returns {Error} default - Unexpected error
 */
router.get('/tracks/next', (req, res) => {
  const url = radioUrl + 'live-info-v2';
  // Search database for all blog posts
  fetch(url)
    .then((response) => response.json())
    .then((json) => {
      res.json(json.tracks.next);
    })
    .catch((error) => {
      throw error;
    });
});

/* ===============================================================
  GET /meta/shows/previous
=============================================================== */
/**
 * Route: Get previous radio show
 * @route GET /meta/shows/previous
 * @group Meta API - Get current radio station information.
 * @returns {object} 200 - An array of user info
 * @returns {Error} default - Unexpected error
 */
router.get('/shows/previous', (req, res) => {
  const url = radioUrl + 'live-info-v2';
  // Search database for all blog posts
  fetch(url)
    .then((response) => response.json())
    .then((json) => {
      res.json(json.shows.previous);
    })
    .catch((error) => {
      throw error;
    });
});

/* ===============================================================
  GET /meta/shows/current
=============================================================== */
/**
 * Route: Get current radio show
 * @route GET /meta/shows/current
 * @group Meta API - Get current radio station information.
 * @returns {object} 200 - An array of user info
 * @returns {Error} default - Unexpected error
 */
router.get('/shows/current', (req, res) => {
  const url = radioUrl + 'live-info-v2';
  // Search database for all blog posts
  fetch(url)
    .then((response) => response.json())
    .then((json) => {
      res.json(json.shows.current);
    })
    .catch((error) => {
      throw error;
    });
});

/* ===============================================================
  GET /meta/shows/next
=============================================================== */
/**
 * Route: Get next radio show
 * @route GET /meta/shows/next
 * @group Meta API - Get current radio station information.
 * @returns {object} 200 - An array of user info
 * @returns {Error} default - Unexpected error
 */
router.get('/shows/next', (req, res) => {
  const url = radioUrl + 'live-info-v2';
  // Search database for all blog posts
  fetch(url)
    .then((response) => response.json())
    .then((json) => {
      res.json(json.shows.next);
    })
    .catch((error) => {
      throw error;
    });
});

/* ===============================================================
  GET /meta/schedule
=============================================================== */
/**
 * Route: Get weekly schedule
 * @route GET /meta/schedule
 * @group Meta API - Get current radio station information.
 * @returns {object} 200 - An array of user info
 * @returns {Error} default - Unexpected error
 */
router.get('/schedule', (req, res) => {
  const url = radioUrl + 'week-info';
  // Search database for all blog posts
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
  GET /meta/languages
=============================================================== */
/**
 * Route: Get all available languages from Crowdin API
 * @route GET /meta/languages
 * @group Meta API - Get current radio station information.
 * @returns {object} 200 - An array of user info
 * @returns {Error} default - Unexpected error
 */
router.get('/languages', (req, res) => {
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
