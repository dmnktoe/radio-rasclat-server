const fetch = require('node-fetch');

const express = require('express');
const router = express.Router();

let uptimeRobotBaseUrl = process.env.UPTIMEROBOT_API_URL;

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
  const body = {
    api_key: process.env.UPTIMEROBOT_API_KEY,
    monitors: '783021589-783021541-783288091',
  };
  fetch(uptimeRobotBaseUrl + 'getMonitors', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
    .then((response) => response.json())
    .then((status) => {
      const statusArr = [status.monitors['0'].status, status.monitors['1'].status, status.monitors['2'].status];

      let successCheck = (arr) => arr.every((v) => v === 2);
      let failureCheck = (arr) => arr.every((v) => v === 9);

      if (successCheck(statusArr)) {
        res.json({
          status: 2,
        });
      } else {
        if (failureCheck(statusArr)) {
          res.json({
            status: 0,
          });
        } else {
          res.json({
            status: 1,
          });
        }
      }
    })
    .catch((error) => {
      throw error;
    });
});

module.exports = router;
