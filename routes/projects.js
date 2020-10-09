const os = require('os');
const Project = require('../models/Project');
const multer = require('multer');
const upload = multer({ dest: `${os.tmpdir()}/uploads/projects` });
const Sentry = require('@sentry/node');
const mongoose = require('mongoose');

const algoliasearch = require('algoliasearch');
const client = algoliasearch(process.env.ALGOLIA_APP_ID, process.env.ALGOLIA_ADMIN_KEY);
const index = client.initIndex(process.env.ALGOLIA_INDEX_PROJECTS);

const express = require('express');
const router = express.Router();

const jwtMiddleware = require('../middleware/jwt');
const projectsValidator = require('../controllers/validators/projects_validator');
const uploadImageController = require('../controllers/uploaders/upload_image');

/* ===============================================================
   GET /projects
=============================================================== */
/**
 * This function comment is parsed by doctrine
 * @route GET /projects
 * @group Projects API - Manage project entries.
 * @returns {object} 200 - An array of user info
 * @returns {Error} default - Unexpected error
 */
router.get('/', (req, res) => {
  Project.find((err, projects) => {
    if (err) {
      res.json({ success: false, message: err });
    } else {
      if (!projects) {
        res.json({ success: false, message: 'No projects found.' });
      } else {
        res.json(projects);
      }
    }
  }).sort({
    createdAt: -1,
  });
});

/* ===============================================================
   GET /projects/project/:id
=============================================================== */
/**
 * This function comment is parsed by doctrine
 * @route GET /projects/project/{id}
 * @group Projects API - Manage project entries.
 * @returns {object} 200 - An array of user info
 * @returns {Error} default - Unexpected error
 */
router.get('/project/:id', (req, res) => {
  if (!req.params.id) {
    res.json({ success: false, message: 'No project ID was provided.' });
  } else {
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      Project.aggregate(
        [
          {
            $match: {
              _id: mongoose.Types.ObjectId(req.params.id),
            },
          },
        ],
        (err, project) => {
          if (err) {
            res.json({ success: false, message: 'Not a valid project ID.' });
          } else {
            if (!project || project.length === 0) {
              res.json({ success: false, message: 'Project not found.' });
            } else {
              res.json(project[0]); // Return success
            }
          }
        }
      );
    } else {
      Project.aggregate(
        [
          {
            $match: {
              slug: req.params.id,
            },
          },
        ],
        (err, project) => {
          if (err) {
            res.json({ success: false, message: 'Not a valid project ID.' });
          } else {
            if (project.length === 0) {
              res.json({ success: false, message: 'Project not found.' });
            } else {
              res.json(project[0]); // Return success
            }
          }
        }
      );
    }
  }
});

/* ===============================================================
 POST /projects
=============================================================== */
/**
 * This function comment is parsed by doctrine
 * @route POST /projects
 * @group Projects API - Manage projects.
 * @returns {object} 200 - An array of user info
 * @returns {Error} default - Unexpected error
 * @security JWT
 */
router.post(
  '/',
  jwtMiddleware,
  upload.single('image'),
  projectsValidator.createProjectsValidator,
  uploadImageController.uploadImages,
  (req, res) => {
    let newProject = new Project({
      title: req.body.title,
      description: req.body.description,
      timeStart: req.body.timeStart,
      timeEnd: req.body.timeEnd,
      image: req.body.image,
    });
    Project.create(newProject)
      .then((project) => {
        index
          .addObject(project)
          .then(({ objectID }) => {
            Project.findOneAndUpdate(
              {
                _id: project._id,
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
              .then((project) => {
                res.json({
                  success: true,
                  message: 'Project added.',
                  project: project,
                });
              })
              .catch((error) => {
                res.json({
                  success: false,
                  message: 'An unknown error occurred while updating the new project with the given Algolia objectID.',
                  error: error,
                });
              });
          })
          .catch((err) => {
            Sentry.captureException(err);
            res.json({
              success: false,
              message: 'An unknown error occurred while creating the project to the Algolia Search API.',
            });
          });
      })
      .catch((error) => {
        if (error.code === 11000) {
          res.json({
            success: false,
            message: 'This project already exists in the database.',
          });
        } else {
          Sentry.captureException(error);
          res.json({
            success: false,
            message: 'An unknown error occurred while creating the project in the database.',
            error: error,
          });
        }
      });
  }
);

/* ===============================================================
 UPDATE /projects/update
=============================================================== */
/**
 * This function comment is parsed by doctrine
 * @route PUT /projects/update
 * @group Projects API - Manage projects.
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
    Project.findOneAndUpdate(
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
      .then((project) => {
        index
          .saveObject(project)
          .then(() => {
            res.json({
              success: true,
              message: 'The project has been updated.',
            });
          })
          .catch((err) => {
            Sentry.captureException(err);
            res.json({
              success: false,
              message: 'An unknown error occurred while updating the project to the Algolia Search API.',
              error: err,
            });
          });
      })
      .catch((error) => {
        if (error.code === 11000) {
          res.json({
            success: false,
            message: 'This project already exists in the database.',
          });
        } else {
          Sentry.captureException(error);
          res.json({
            success: false,
            message: 'An unknown error occurred while creating the project in the database.',
          });
        }
      });
  }
);

/* ===============================================================
 DELETE /projects/delete
=============================================================== */
/**
 * This function comment is parsed by doctrine
 * @route DELETE /projects/delete
 * @group Projects API - Manage projects.
 * @returns {object} 200 - An array of user info
 * @returns {Error} default - Unexpected error
 * @security JWT
 */
router.delete('/delete', jwtMiddleware, (req, res) => {
  const _id = req.body._id;
  Project.findOne({ _id })
    .then((project) => {
      index
        .deleteObject(project.objectID)
        .then(() => {
          Project.findOneAndRemove({
            _id,
          })
            .then(() => {
              res.json({
                success: true,
                message: 'Project has been removed.',
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
            message: 'An unknown error occurred while deleting the project on Algolia.',
            error: error,
          });
        });
    })
    .catch((error) => {
      Sentry.captureException(error);
      res.json({
        success: false,
        message: 'Project could not be found.',
      });
    });
});

module.exports = router;

module.exports = router;
