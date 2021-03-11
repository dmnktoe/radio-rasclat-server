const os = require('os');
const Artist = require('../models/Artist');
const multer = require('multer');
const upload = multer({ dest: `${os.tmpdir()}/uploads/artists` });
const Sentry = require('@sentry/node');
const mongoose = require('mongoose');

const algoliasearch = require('algoliasearch');
const client = algoliasearch(process.env.ALGOLIA_APP_ID, process.env.ALGOLIA_ADMIN_KEY);
const index = client.initIndex(process.env.ALGOLIA_INDEX_ARTISTS);

const express = require('express');
const router = express.Router();

const jwtMiddleware = require('../middleware/jwt');
const artistsValidator = require('../controllers/validators/artists_validator');
const uploadImageController = require('../controllers/uploaders/upload_image');

/* ===============================================================
   GET /artists
=============================================================== */
/**
 * This function comment is parsed by doctrine
 * @route GET /artists
 * @group Artists API - Manage artists and performers.
 * @returns {object} 200 - An array of user info
 * @returns {Error} default - Unexpected error
 */
router.get('/', (req, res) => {
  Artist.aggregate(
    [
      {
        $lookup: {
          from: 'recordings',
          localField: '_id',
          foreignField: 'artists',
          as: 'recordings',
        },
      },
    ],
    (err, artists) => {
      if (err) {
        res.json({ success: false, message: err });
      } else {
        if (!artists) {
          res.json({ success: false, message: 'No artists found.' });
        } else {
          res.json(artists);
        }
      }
    }
  ).sort({
    slug: 1,
  });
});

/* ===============================================================
   GET /artists/artist/:id
=============================================================== */
/**
 * This function comment is parsed by doctrine
 * @route GET /artists/artist/{id}
 * @group Artists API - Manage artists and performers.
 * @returns {object} 200 - An array of user info
 * @returns {Error} default - Unexpected error
 */
router.get('/artist/:id', (req, res) => {
  if (!req.params.id) {
    res.json({ success: false, message: 'No artist ID was provided.' });
  } else {
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      Artist.aggregate(
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
              foreignField: 'artists',
              as: 'recordings',
            },
          },
          {
            $unwind: {
              path: '$recordings',
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $sort: {
              'recordings.timeStart': -1,
            },
          },
          {
            $lookup: {
              from: 'genres',
              localField: 'recordings.genres',
              foreignField: '_id',
              as: 'recordings.genres',
            },
          },
          {
            $group: {
              _id: '$_id',
              title: { $first: '$title' },
              description: { $first: '$description' },
              image: { $first: '$image' },
              slug: { $first: '$slug' },
              recordings: {
                $push: '$recordings',
              },
            },
          },
        ],
        (err, artist) => {
          if (err) {
            res.json({ success: false, message: 'Not a valid artist ID.' });
          } else {
            if (!artist || artist.length === 0) {
              res.status(404).json({ success: false, message: 'Artist not found.' });
            } else {
              res.json(artist[0]); // Return success
            }
          }
        }
      );
    } else {
      Artist.aggregate(
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
              foreignField: 'artists',
              as: 'recordings',
            },
          },
          {
            $unwind: {
              path: '$recordings',
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $sort: {
              'recordings.timeStart': -1,
            },
          },
          {
            $lookup: {
              from: 'genres',
              localField: 'recordings.genres',
              foreignField: '_id',
              as: 'recordings.genres',
            },
          },
          {
            $group: {
              _id: '$_id',
              title: { $first: '$title' },
              description: { $first: '$description' },
              image: { $first: '$image' },
              recordings: {
                $push: '$recordings',
              },
            },
          },
        ],
        (err, artist) => {
          if (err) {
            res.json({ success: false, message: 'Not a valid artist ID.' });
          } else {
            if (artist.length === 0) {
              res.status(404).json({ success: false, message: 'Artist not found.' });
            } else {
              res.json(artist[0]); // Return success
            }
          }
        }
      );
    }
  }
});

/* ===============================================================
 POST /artists
=============================================================== */
/**
 * This function comment is parsed by doctrine
 * @route POST /artists
 * @group Artists API - Manage artists and performers.
 * @returns {object} 200 - An array of user info
 * @returns {Error} default - Unexpected error
 * @security JWT
 */
router.post(
  '/',
  jwtMiddleware,
  upload.single('image'),
  artistsValidator.createArtistValidator,
  uploadImageController.resizeImages,
  uploadImageController.uploadImages,
  (req, res) => {
    let newArtist = new Artist({
      title: req.body.title,
      image: req.body.image,
    });
    Artist.create(newArtist)
      .then((artist) => {
        index
          .addObject(artist)
          .then(({ objectID }) => {
            Artist.findOneAndUpdate(
              {
                _id: artist._id,
              },
              {
                $set: {
                  objectID: objectID,
                },
              },
              {
                new: true,
              }
            )
              .then((artist) => {
                res.json({
                  success: true,
                  message: 'Artist added.',
                  artist: artist,
                });
              })
              .catch((error) => {
                res.json({
                  success: false,
                  message: 'An unknown error occurred while updating the new artist with the given Algolia objectID.',
                  error: error,
                });
              });
          })
          .catch((err) => {
            Sentry.captureException(err);
            res.json({
              success: false,
              message: 'An unknown error occurred while creating the artist to the Algolia Search API.',
            });
          });
      })
      .catch((error) => {
        if (error.code === 11000) {
          res.json({
            success: false,
            message: 'This artist already exists in the database.',
          });
        } else {
          Sentry.captureException(error);
          res.json({
            success: false,
            message: 'An unknown error occurred while creating the artist in the database.',
          });
        }
      });
  }
);

/* ===============================================================
 UPDATE /artists/update
=============================================================== */
/**
 * This function comment is parsed by doctrine
 * @route PUT /artists/update
 * @group Artists API - Manage artists and performers.
 * @returns {object} 200 - An array of user info
 * @returns {Error} default - Unexpected error
 * @security JWT
 */
router.put(
  '/update',
  jwtMiddleware,
  upload.single('image'),
  uploadImageController.resizeImages,
  uploadImageController.uploadImages,
  (req, res) => {
    const _id = req.body._id;
    Artist.findOneAndUpdate(
      {
        _id: _id,
      },
      {
        $set: req.body,
      },
      {
        new: true,
      }
    )
      .then((artist) => {
        index
          .saveObject(artist)
          .then(() => {
            res.json({
              success: true,
              message: 'The artist has been updated.',
            });
          })
          .catch((err) => {
            Sentry.captureException(err);
            res.json({
              success: false,
              message: 'An unknown error occurred while updating the artist to the Algolia Search API.',
              error: err,
            });
          });
      })
      .catch((error) => {
        if (error.code === 11000) {
          res.json({
            success: false,
            message: 'This artist already exists in the database.',
          });
        } else {
          Sentry.captureException(error);
          res.json({
            success: false,
            message: 'An unknown error occurred while creating the artist in the database.',
          });
        }
      });
  }
);

/* ===============================================================
 DELETE /artists/delete
=============================================================== */
/**
 * This function comment is parsed by doctrine
 * @route DELETE /artists/delete
 * @group Artists API - Manage artists and performers.
 * @returns {object} 200 - An array of user info
 * @returns {Error} default - Unexpected error
 * @security JWT
 */
router.delete('/delete', jwtMiddleware, (req, res) => {
  const _id = req.body._id;
  Artist.findOne({ _id })
    .then((artist) => {
      index
        .deleteObject(artist.objectID)
        .then(() => {
          Artist.findOneAndRemove({
            _id,
          })
            .then(() => {
              res.json({
                success: true,
                message: 'Artist has been removed.',
              });
            })
            .catch((error) => {
              Sentry.captureException(error);
              res.json({
                success: false,
                message: 'An error occurred.',
                error: error,
              });
            });
        })
        .catch((error) => {
          Sentry.captureException(error);
          res.json({
            success: false,
            message: 'An unknown error occurred while deleting the artist on Algolia.',
            error: error,
          });
        });
    })
    .catch((error) => {
      Sentry.captureException(error);
      res.json({
        success: false,
        message: 'Artist could not be found.',
      });
    });
});

module.exports = router;
