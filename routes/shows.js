const os = require('os');
const Show = require('../models/Show');
const Recording = require('../models/Recording');
const multer = require('multer');
const upload = multer({ dest: `${os.tmpdir()}/uploads/shows` });
const Sentry = require('@sentry/node');
const mongoose = require('mongoose');

const algoliasearch = require('algoliasearch');
const client = algoliasearch(process.env.ALGOLIA_APP_ID, process.env.ALGOLIA_ADMIN_KEY);
const index = client.initIndex(process.env.ALGOLIA_INDEX_SHOWS);

const express = require('express');
const router = express.Router();

const jwtMiddleware = require('../middleware/jwt');
const showsValidator = require('../controllers/validators/shows_validator');
const uploadImageController = require('../controllers/uploaders/upload_image');

/* ===============================================================
   GET /shows
=============================================================== */
/**
 * This function comment is parsed by doctrine
 * @route GET /shows
 * @group Shows API - Manage shows.
 * @returns {object} 200 - An array of user info
 * @returns {Error} default - Unexpected error
 */
router.get('/', (req, res) => {
  Show.find((err, shows) => {
    if (err) {
      res.json({
        success: false,
        message: err,
      });
    } else {
      if (!shows) {
        res.json({
          success: false,
          message: 'No shows found.',
        });
      } else {
        res.json(shows);
      }
    }
  }).sort({
    slug: 1,
  });
});

/* ===============================================================
   GET /shows/recently-updated
=============================================================== */
/**
 * This function comment is parsed by doctrine
 * @route GET /shows/recently-updated
 * @group Shows API - Manage shows.
 * @returns {object} 200 - An array of user info
 * @returns {Error} default - Unexpected error
 */
router.get('/recently-updated', (req, res) => {
  Recording.aggregate(
    [
      {
        $lookup: {
          from: 'shows',
          localField: 'show',
          foreignField: '_id',
          as: 'show',
        },
      },
      {
        $unwind: {
          path: '$show',
          preserveNullAndEmptyArrays: true,
        },
      },
    ],
    (err, recordings) => {
      let reduced;
      if (err) {
        res.json({ success: false, message: err });
      } else {
        if (!recordings) {
          res.json({ success: false, message: 'No recordings found.' });
        } else {
          reduced = [].concat(...recordings.map((o) => o.show));
          res.json(reduced);
        }
      }
    }
  )
    .sort({ timeStart: -1 })
    .limit(4);
});

/* ===============================================================
   GET /shows/show/:id
=============================================================== */
/**
 * This function comment is parsed by doctrine
 * @route GET /shows/show/{id}
 * @group Shows API - Manage shows.
 * @returns {object} 200 - An array of user info
 * @returns {Error} default - Unexpected error
 */
router.get('/show/:id', (req, res) => {
  if (!req.params.id) {
    res.json({ success: false, message: 'No show ID was provided.' });
  } else {
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      Show.aggregate(
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
              foreignField: 'show',
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
        (err, show) => {
          if (err) {
            res.json({ success: false, message: 'Not a valid show ID.' });
          } else {
            if (!show || show.length === 0) {
              res.status(404).json({ success: false, message: 'Show not found.' });
            } else {
              res.json(show[0]); // Return success
            }
          }
        }
      );
    } else {
      Show.aggregate(
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
              foreignField: 'show',
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
        (err, show) => {
          if (err) {
            res.json({ success: false, message: 'Not a valid show ID.' });
          } else {
            if (show.length === 0) {
              res.status(404).json({ success: false, message: 'Show not found.' });
            } else {
              res.json(show[0]); // Return success
            }
          }
        }
      );
    }
  }
});

/* ===============================================================
   POST /shows
=============================================================== */
/**
 * This function comment is parsed by doctrine
 * @route POST /shows
 * @group Shows API - Manage shows.
 * @returns {object} 200 - An array of user info
 * @returns {Error} default - Unexpected error
 */
router.post(
  '/',
  jwtMiddleware,
  upload.single('image'),
  showsValidator.createShowValidator,
  uploadImageController.resizeImages,
  uploadImageController.uploadImages,
  (req, res) => {
    let newShow = new Show({
      title: req.body.title,
      description: req.body.description,
      image: req.body.image,
    });
    Show.create(newShow)
      .then((show) => {
        index
          .addObject(show)
          .then(({ objectID }) => {
            Show.findOneAndUpdate(
              {
                _id: show._id,
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
              .then((show) => {
                res.json({
                  success: true,
                  message: 'Show added.',
                  show: show,
                });
              })
              .catch((error) => {
                res.json({
                  success: false,
                  message: 'An unknown error occurred while updating the new show with the given Algolia objectID.',
                  error: error,
                });
              });
          })
          .catch((err) => {
            Sentry.captureException(err);
            res.json({
              success: false,
              message: 'An unknown error occurred while creating the show to the Algolia Search API.',
            });
          });
      })
      .catch((error) => {
        if (error.code === 11000) {
          res.json({
            success: false,
            message: 'This show already exists in the database.',
          });
        } else {
          Sentry.captureException(error);
          res.json({
            success: false,
            message: 'An unknown error occurred while creating the show in the database.',
          });
        }
      });
  }
);

/* ===============================================================
 UPDATE /shows/update
=============================================================== */
/**
 * This function comment is parsed by doctrine
 * @route PUT /shows/update
 * @group Shows API - Manage shows and performers.
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
    Show.findOneAndUpdate(
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
      .then((show) => {
        index
          .saveObject(show)
          .then(() => {
            res.json({
              success: true,
              message: 'The show has been updated.',
            });
          })
          .catch((err) => {
            Sentry.captureException(err);
            res.json({
              success: false,
              message: 'An unknown error occurred while updating the show to the Algolia Search API.',
              error: err,
            });
          });
      })
      .catch((error) => {
        if (error.code === 11000) {
          res.json({
            success: false,
            message: 'This show already exists in the database.',
          });
        } else {
          Sentry.captureException(error);
          res.json({
            success: false,
            message: 'An unknown error occurred while updating the show in the database.',
          });
        }
      });
  }
);

/* ===============================================================
 DELETE /shows/delete
=============================================================== */
/**
 * This function comment is parsed by doctrine
 * @route DELETE /shows/delete
 * @group Shows API - Manage shows and performers.
 * @returns {object} 200 - An array of user info
 * @returns {Error} default - Unexpected error
 * @security JWT
 */
router.delete('/delete', jwtMiddleware, (req, res) => {
  const _id = req.body._id;
  Show.findOne({ _id })
    .then((show) => {
      index
        .deleteObject(show.objectID)
        .then(() => {
          Show.findOneAndRemove({
            _id,
          })
            .then(() => {
              res.json({
                success: true,
                message: 'Show has been removed.',
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
            message: 'An unknown error occurred while deleting the show on Algolia.',
            error: error,
          });
        });
    })
    .catch((error) => {
      Sentry.captureException(error);
      res.json({
        success: false,
        message: 'Show could not be found.',
      });
    });
});

module.exports = router;
