const os = require('os');
const Recording = require('../models/Recording');
const multer = require('multer');
const upload = multer({ dest: `${os.tmpdir()}/uploads/recordings` });
const Sentry = require('@sentry/node');
const mongoose = require('mongoose');

const { google } = require('googleapis');

const scopes = 'https://www.googleapis.com/auth/analytics.readonly';
const jwt = new google.auth.JWT(process.env.GOOGLE_API_CLIENT_E_MAIL, null, process.env.GOOGLE_API_PRIVATE_KEY, scopes);
const view_id = '198346380';

const algoliasearch = require('algoliasearch');
const client = algoliasearch(process.env.ALGOLIA_APP_ID, process.env.ALGOLIA_ADMIN_KEY);
const index = client.initIndex(process.env.ALGOLIA_INDEX_RECORDINGS);

const express = require('express');
const router = express.Router();

const jwtMiddleware = require('../middleware/jwt');
const recordingsValidator = require('../controllers/validators/recordings_validator');
const uploadAudioController = require('../controllers/uploaders/upload_audio');
const uploadImageController = require('../controllers/uploaders/upload_image');

/* ===============================================================
   Cache Middleware
=============================================================== */
const cache = require('memory-cache');
let memCache = new cache.Cache();
let cacheMiddleware = (duration) => {
  return (req, res, next) => {
    let key = '__express__' + req.originalUrl || req.url;
    let cacheContent = memCache.get(key);
    if (cacheContent) {
      res.send(cacheContent);
    } else {
      res.sendResponse = res.send;
      res.send = (body) => {
        memCache.put(key, body, duration * 1000);
        res.sendResponse(body);
      };
      next();
    }
  };
};

/* ===============================================================
   GET /recordings
=============================================================== */
/**
 * This function comment is parsed by doctrine
 * @route GET /recordings
 * @group Recordings API - Manage audio recordings.
 * @returns {object} 200 - An array of user info
 * @returns {Error}  default - Unexpected error
 */
router.get('/', cacheMiddleware(30), (req, res) => {
  Recording.aggregate(
    [
      {
        $lookup: {
          from: 'artists',
          localField: 'artists',
          foreignField: '_id',
          as: 'artists',
        },
      },
      {
        $lookup: {
          from: 'genres',
          localField: 'genres',
          foreignField: '_id',
          as: 'genres',
        },
      },
      {
        $lookup: {
          from: 'shows',
          localField: 'show',
          foreignField: '_id',
          as: 'show',
        },
      },
      {
        $unwind: '$show',
      },
    ],
    (err, recordings) => {
      if (err) {
        res.json({ success: false, message: err });
      } else {
        if (!recordings) {
          res.json({ success: false, message: 'No recordings found.' });
        } else {
          res.json(recordings);
        }
      }
    }
  ).sort({ timeStart: -1 });
});

/* ===============================================================
   GET /recordings/recording/{id}
=============================================================== */
/**
 * Get a single recording saved in the database.
 * @route GET /recordings/recording/{id}
 * @group Recordings API - Manage audio recordings.
 * @returns {object} 200 - An array of user info
 * @returns {Error}  default - Unexpected error
 */
router.get('/recording/:id', (req, res) => {
  if (!req.params.id) {
    res.json({ success: false, message: 'No recording ID was provided.' });
  } else {
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      Recording.aggregate(
        [
          {
            $match: {
              _id: mongoose.Types.ObjectId(req.params.id),
            },
          },
          {
            $lookup: {
              from: 'artists' /* collection name here, not model name */,
              localField: 'artists',
              foreignField: '_id',
              as: 'artists',
            },
          },
          {
            $lookup: {
              from: 'genres' /* collection name here, not model name */,
              localField: 'genres',
              foreignField: '_id',
              as: 'genres',
            },
          },
          {
            $lookup: {
              from: 'shows',
              localField: 'show',
              foreignField: '_id',
              as: 'show',
            },
          },
          {
            $unwind: '$show',
          },
        ],
        (err, recording) => {
          if (err) {
            res.json({ success: false, message: 'Not a valid recording ID.' });
          } else {
            if (!recording || recording.length === 0) {
              res.json({ success: false, message: 'Recording not found.' });
            } else {
              res.json(recording[0]); // Return success
            }
          }
        }
      );
    } else {
      Recording.aggregate(
        [
          {
            $match: {
              slug: req.params.id,
            },
          },
          {
            $lookup: {
              from: 'artists' /* collection name here, not model name */,
              localField: 'artists',
              foreignField: '_id',
              as: 'artists',
            },
          },
          {
            $lookup: {
              from: 'genres' /* collection name here, not model name */,
              localField: 'genres',
              foreignField: '_id',
              as: 'genres',
            },
          },
          {
            $lookup: {
              from: 'shows',
              localField: 'show',
              foreignField: '_id',
              as: 'show',
            },
          },
          {
            $unwind: '$show',
          },
        ],
        (err, recording) => {
          if (err) {
            res.json({ success: false, message: 'Not a valid recording ID.' });
          } else {
            if (recording.length === 0) {
              res.json({ success: false, message: 'Recording not found.' });
            } else {
              res.json(recording[0]); // Return success
            }
          }
        }
      );
    }
  }
});

/* ===============================================================
   GET /recordings/most-viewed
=============================================================== */
/**
 * Get the most viewed recordings by Google Analytics
 * @route GET /recordings/most-viewed
 * @group Recordings API - Manage audio recordings.
 * @returns {object} 200 - An array of user info
 * @returns {Error}  default - Unexpected error
 */
router.get('/most-viewed', (req, res) => {
  jwt.authorize((err, response) => {
    google.analytics('v3').data.ga.get(
      {
        auth: jwt,
        ids: 'ga:' + view_id,
        'start-date': '15daysAgo',
        'end-date': 'today',
        metrics: 'ga:pageviews',
        dimensions: 'ga:pagePath',
        sort: '-ga:pageviews',
        filters: 'ga:pagePath=~/broadcasts/',
        'max-results': '1',
      },
      (err, result) => {
        if (err) {
          Sentry.captureException(err);
          res.json({ success: false, message: 'An error occurred.' });
        } else {
          let mostViewed = result.data.rows[0][0].replace('/broadcasts/', '');
          let viewCounter = result.data.rows[0][1];
          Recording.aggregate(
            [
              {
                $match: {
                  slug: mostViewed,
                },
              },
              {
                $lookup: {
                  from: 'genres' /* collection name here, not model name */,
                  localField: 'genres',
                  foreignField: '_id',
                  as: 'genres',
                },
              },
            ],
            (err, recording) => {
              if (err) {
                Sentry.captureException(err);
                res.json({ success: false, message: 'Most viewed recording could not be loaded.' });
              } else {
                recording[0].viewCounter = viewCounter;
                res.json(recording); // Return success
              }
            }
          );
        }
      }
    );
  });
});

/* ===============================================================
   GET /recordings/top-3-viewed
=============================================================== */
/**
 * Get the 3 most viewed recordings by Google Analytics
 * @route GET /recordings/top-3-viewed
 * @group Recordings API - Manage audio recordings.
 * @returns {object} 200 - An array of user info
 * @returns {Error}  default - Unexpected error
 */
router.get('/top-3-viewed', (req, res) => {
  jwt.authorize((err, response) => {
    google.analytics('v3').data.ga.get(
      {
        auth: jwt,
        ids: 'ga:' + view_id,
        'start-date': '15daysAgo',
        'end-date': 'today',
        metrics: 'ga:pageviews',
        dimensions: 'ga:pagePath',
        sort: '-ga:pageviews',
        filters: 'ga:pagePath=~/broadcasts/',
        'max-results': '3',
      },
      (err, result) => {
        if (err) {
          Sentry.captureException(err);
          res.json({ success: false, message: 'An error occurred.' });
        } else {
          let mostViewedFirst = {
            slug: result.data.rows[0][0].replace('/broadcasts/', ''),
            views: result.data.rows[0][1],
          };
          const mostViewedSecond = {
            slug: result.data.rows[1][0].replace('/broadcasts/', ''),
            views: result.data.rows[1][1],
          };
          const mostViewedThird = {
            slug: result.data.rows[2][0].replace('/broadcasts/', ''),
            views: result.data.rows[2][1],
          };
          let searchArr = [mostViewedFirst.slug, mostViewedSecond.slug, mostViewedThird.slug];
          Recording.find({ slug: searchArr }, (err, recordingsDb) => {
            if (err) {
              Sentry.captureException(err);
              res.json({ success: false, message: 'Most viewed recording could not be loaded.' });
            } else {
              let googleArray = [
                {
                  slug: mostViewedFirst.slug,
                  views: mostViewedFirst.views,
                },
                {
                  slug: mostViewedSecond.slug,
                  views: mostViewedSecond.views,
                },
                {
                  slug: mostViewedThird.slug,
                  views: mostViewedThird.views,
                },
              ];
              let recordings = googleArray.map((x) =>
                Object.assign(
                  x,
                  recordingsDb.find((y) => y.slug === x.slug)
                )
              );
              res.json(recordings);
            }
          })
            .lean()
            .populate('genres');
        }
      }
    );
  });
});

/* ===============================================================
 POST /recordings
=============================================================== */
/**
 * This function comment is parsed by doctrine
 * @route POST /recordings
 * @group Recordings API - Manage audio recordings.
 * @returns {object} 200 - An array of user info
 * @returns {Error}  default - Unexpected error
 * @security JWT
 */
router.post(
  '/',
  jwtMiddleware,
  upload.fields([
    {
      name: 'image',
      maxCount: 1,
    },
    {
      name: 'audio',
      maxCount: 1,
    },
  ]),
  recordingsValidator.createRecordingValidator,
  uploadAudioController.uploadAudio,
  uploadImageController.resizeImages,
  uploadImageController.uploadImages,
  (req, res) => {
    let newRecording = new Recording({
      ...req.body,
      audio: req.body.audio,
      image: req.body.image,
    });
    Recording.create(newRecording)
      .then((recording) => {
        index
          .addObject(recording)
          .then(({ objectID }) => {
            Recording.findOneAndUpdate(
              {
                _id: recording._id,
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
              .then((recording) => {
                res.json({
                  success: true,
                  message: 'Recording added.',
                  recording: recording,
                });
              })
              .catch((error) => {
                res.json({
                  success: false,
                  message:
                    'An unknown error occurred while updating the new recording with the given Algolia objectID.',
                  error: error,
                });
              });
          })
          .catch((err) => {
            Sentry.captureException(err);
            res.json({
              success: false,
              message: 'An unknown error occurred while creating the recording to the Algolia Search API.',
            });
          });
      })
      .catch((error) => {
        if (error.code === 11000) {
          res.json({
            success: false,
            message: 'This recording already exists in the database.',
          });
        } else {
          Sentry.captureException(error);
          res.json({
            success: false,
            message: 'An unknown error occurred while creating the recording in the database.',
          });
        }
      });
  }
);

/* ===============================================================
 UPDATE /recordings/update
=============================================================== */
/**
 * This function comment is parsed by doctrine
 * @route PUT /recordings/update
 * @group Recordings API - Manage audio recordings.
 * @returns {object} 200 - An array of user info
 * @returns {Error} default - Unexpected error
 * @security JWT
 */
router.put(
  '/update',
  jwtMiddleware,
  upload.fields([
    {
      name: 'image',
      maxCount: 1,
    },
    {
      name: 'audio',
      maxCount: 1,
    },
  ]),
  uploadAudioController.uploadAudio,
  uploadImageController.resizeImages,
  uploadImageController.uploadImages,
  (req, res) => {
    const _id = req.body._id;
    Recording.findOneAndUpdate(
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
      .then((recording) => {
        index
          .saveObject(recording)
          .then(() => {
            res.json({
              success: true,
              message: 'The recording has been updated.',
            });
          })
          .catch((err) => {
            Sentry.captureException(err);
            res.json({
              success: false,
              message: 'An unknown error occurred while updating the recording to the Algolia Search API.',
              error: err,
            });
          });
      })
      .catch((error) => {
        if (error.code === 11000) {
          res.json({
            success: false,
            message: 'This recording already exists in the database.',
          });
        } else {
          Sentry.captureException(error);
          res.json({
            success: false,
            message: 'An unknown error occurred while updating the recording in the database.',
          });
        }
      });
  }
);

/* ===============================================================
 DELETE /recordings/delete
=============================================================== */
/**
 * This function comment is parsed by doctrine
 * @route DELETE /recordings/delete
 * @group Recordings API - Manage audio recordings.
 * @returns {object} 200 - An array of user info
 * @returns {Error}  default - Unexpected error
 * @security JWT
 */
router.delete('/delete', jwtMiddleware, (req, res) => {
  const _id = req.body._id;
  Recording.findOne({ _id })
    .then((recording) => {
      index
        .deleteObject(recording.objectID)
        .then(() => {
          Recording.findOneAndRemove({
            _id,
          })
            .then(() => {
              res.json({
                success: true,
                message: 'Recording has been removed.',
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
            message: 'An unknown error occurred while deleting the recording on Algolia.',
            error: error,
          });
        });
    })
    .catch((error) => {
      Sentry.captureException(error);
      res.json({
        success: false,
        message: 'Recording could not be found.',
      });
    });
});

module.exports = router;
