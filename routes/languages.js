const fetch = require('node-fetch');
const crowdinUrl = process.env.CROWDIN_PROJECT_URL;
const _ = require('lodash');
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
  const token = 'Bearer ' + process.env.CROWDIN_AUTH_KEY;
  fetch(crowdinUrl, {
    method: 'GET',
    withCredentials: true,
    credentials: 'include',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
    .then((response) => response.json())
    .then((languages) => {
      fetch(crowdinUrl + '/languages/progress', {
        method: 'GET',
        withCredentials: true,
        credentials: 'include',
        headers: {
          Authorization: token,
          'Content-Type': 'application/json',
        },
      })
        .then((response) => response.json())
        .then((progress) => {
          _.forEach(progress.data, (item, i) => {
            progress.data[i] = item.data;
          });
          let newLanguages = languages.data['targetLanguages'].map((itm) => ({
            ...progress.data.find((item) => item.languageId === itm.id && item),
            ...itm,
          }));
          res.json(newLanguages);
        })
        .catch((error) => {
          throw error;
        });
    })
    .catch((error) => {
      throw error;
    });
});

module.exports = router;
