const Genre = require('../models/Genre');
const Sentry = require('@sentry/node');

const mongoose = require('mongoose');
const express = require('express');
const router = express.Router();

const jwtMiddleware = require('../middleware/jwt');

/* ===============================================================
   GET /genres
=============================================================== */
/**
 * This function comment is parsed by doctrine
 * @route GET /genres
 * @group Genres API - Manage genres and music styles.
 * @returns {object} 200 - An array of user info
 * @returns {Error} default - Unexpected error
 */
router.get('/', (req, res) => {
  Genre.find((err, genres) => {
    if (err) {
      res.json({ success: false, message: err });
    } else {
      if (!genres) {
        res.json({ success: false, message: 'No genres found.' });
      } else {
        res.json(genres);
      }
    }
  }).sort({ _id: -1 });
});

/* ===============================================================
   GET /genres/genre/:id
=============================================================== */
/**
 * This function comment is parsed by doctrine
 * @route GET /genres/genre/{id}
 * @group Genres API - Manage genres and music styles.
 * @returns {object} 200 - An array of user info
 * @returns {Error} default - Unexpected error
 */
router.get('/genre/:id', (req, res) => {
  if (!req.params.id) {
    res.json({ success: false, message: 'No genre ID was provided.' });
  } else {
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      Genre.aggregate(
        [
          {
            $match: {
              _id: mongoose.Types.ObjectId(req.params.id),
            },
          },
          {
            $lookup: {
              from: 'recordings',
              localField: '_id',
              foreignField: 'genres',
              as: 'recordings',
            },
          },
        ],
        (err, genre) => {
          if (err) {
            res.json({ success: false, message: 'Not a valid genre ID.' });
          } else {
            if (!genre || genre.length === 0) {
              res.json({ success: false, message: 'Genre not found.' });
            } else {
              res.json(genre[0]); // Return success
            }
          }
        }
      );
    } else {
      Genre.aggregate(
        [
          {
            $match: {
              slug: req.params.id,
            },
          },
          {
            $lookup: {
              from: 'recordings',
              localField: '_id',
              foreignField: 'genres',
              as: 'recordings',
            },
          },
        ],
        (err, genre) => {
          if (err) {
            res.json({ success: false, message: 'Not a valid genre ID.' });
          } else {
            if (genre.length === 0) {
              res.json({ success: false, message: 'Genre not found.' });
            } else {
              res.json(genre[0]); // Return success
            }
          }
        }
      );
    }
  }
});

/* ===============================================================
 POST /genres
=============================================================== */
/**
 * This function comment is parsed by doctrine
 * @route POST /genres
 * @group Genres API - Manage genres and music styles.
 * @returns {object} 200 - An array of user info
 * @returns {Error} default - Unexpected error
 * @security JWT
 */
router.post('/', jwtMiddleware, (req, res) => {
  if (!req.body.title) {
    res.json({
      success: false,
      message: 'No genre title was given.',
    });
  } else {
    if (!req.body.color) {
      res.json({
        success: false,
        message: 'No genre color was provided.',
      });
    } else {
      let newGenre = new Genre({
        title: req.body.title,
        color: req.body.color,
      });
      Genre.create(newGenre)
        .then((genre) => {
          res.json({
            success: true,
            message: 'Genre added.',
            genre: genre,
          });
        })
        .catch((error) => {
          if (error.code === 11000) {
            res.json({
              success: false,
              message: 'This genre already exists in the database.',
            });
          } else {
            Sentry.captureException(error);
            res.json({
              success: false,
              message: 'An unknown error occurred while creating the genre in the database.',
            });
          }
        });
    }
  }
});

/* ===============================================================
 UPDATE /genres/update
=============================================================== */
/**
 * This function comment is parsed by doctrine
 * @route PUT /genres/update
 * @group Genres API - Manage genres and music styles.
 * @returns {object} 200 - An array of user info
 * @returns {Error} default - Unexpected error
 * @security JWT
 */
router.put('/update', jwtMiddleware, (req, res) => {
  const _id = req.body._id;
  Genre.findOneAndUpdate(
    {
      _id: _id,
    },
    {
      $set: {
        ...req.body,
      },
    },
    {
      new: true,
    }
  )
    .then(() => {
      res.json({
        success: true,
        message: 'The genre has been updated.',
      });
    })
    .catch((err) => {
      Sentry.captureException(err);
      res.json({
        success: false,
        message: 'An unknown error occurred while updating the genre in the database.',
      });
    });
});

/* ===============================================================
 DELETE /genres/delete
=============================================================== */
/**
 * This function comment is parsed by doctrine
 * @route DELETE /genres/delete
 * @group Genres API - Manage genres and music styles.
 * @returns {object} 200 - An array of user info
 * @returns {Error} default - Unexpected error
 * @security JWT
 */
router.delete('/delete', jwtMiddleware, (req, res) => {
  const _id = req.body._id;
  Genre.findOneAndRemove({
    _id,
  })
    .then(() => {
      res.json({
        success: true,
        message: 'Genre has been removed.',
      });
    })
    .catch((error) => {
      Sentry.captureException(error);
      res.json({
        success: false,
        message: 'Genre could not be found.',
        error: error,
      });
    });
});

module.exports = router;
