const os = require('os');
const Blog = require('../models/Blog');
const multer = require('multer');
const upload = multer({ dest: `${os.tmpdir()}/uploads/blog` });
const Sentry = require('@sentry/node');
const mongoose = require('mongoose');

const algoliasearch = require('algoliasearch');
const client = algoliasearch(process.env.ALGOLIA_APP_ID, process.env.ALGOLIA_ADMIN_KEY);
const index = client.initIndex(process.env.ALGOLIA_INDEX_BLOG);

const express = require('express');
const router = express.Router();

const jwtMiddleware = require('../middleware/jwt');
const blogValidator = require('../controllers/validators/blog_validator');
const uploadImageController = require('../controllers/uploaders/upload_image');

/* ===============================================================
   GET /blog/posts
=============================================================== */
/**
 * This function comment is parsed by doctrine
 * @route GET /blog/posts
 * @group Blog API - Manage blog posts.
 * @returns {object} 200 - An array of user info
 * @returns {Error} default - Unexpected error
 */
router.get('/posts', (req, res) => {
  Blog.find((err, blogPosts) => {
    if (err) {
      res.json({ success: false, message: err });
    } else {
      if (!blogPosts) {
        res.json({ success: false, message: 'No blog posts found.' });
      } else {
        res.json(blogPosts);
      }
    }
  }).sort({
    createdAt: -1,
  });
});

/* ===============================================================
   GET /blog/post/:id
=============================================================== */
/**
 * This function comment is parsed by doctrine
 * @route GET /blog/post/{id}
 * @group Blog API - Manage blog posts.
 * @returns {object} 200 - An array of user info
 * @returns {Error} default - Unexpected error
 */
router.get('/post/:id', (req, res) => {
  if (!req.params.id) {
    res.json({ success: false, message: 'No blog post ID was provided.' });
  } else {
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      Blog.aggregate(
        [
          {
            $match: {
              _id: mongoose.Types.ObjectId(req.params.id),
            },
          },
        ],
        (err, blogPost) => {
          if (err) {
            res.json({ success: false, message: 'Not a valid blog post ID.' });
          } else {
            if (!blogPost || blogPost.length === 0) {
              res.status(404).json({ success: false, message: 'Blog post not found.' });
            } else {
              res.json(blogPost[0]); // Return success
            }
          }
        }
      );
    } else {
      Blog.aggregate(
        [
          {
            $match: {
              slug: req.params.id,
            },
          },
        ],
        (err, blogPost) => {
          if (err) {
            res.json({ success: false, message: 'Not a valid blog post ID.' });
          } else {
            if (blogPost.length === 0) {
              res.status(404).json({ success: false, message: 'Blog post not found.' });
            } else {
              res.json(blogPost[0]); // Return success
            }
          }
        }
      );
    }
  }
});

/* ===============================================================
 POST /blog
=============================================================== */
/**
 * This function comment is parsed by doctrine
 * @route POST /blog
 * @group Blog API - Manage blog posts.
 * @returns {object} 200 - An array of user info
 * @returns {Error} default - Unexpected error
 * @security JWT
 */
router.post(
  '/',
  jwtMiddleware,
  upload.single('image'),
  blogValidator.createBlogValidator,
  uploadImageController.uploadImages,
  (req, res) => {
    let newBlogPost = new Blog({
      title: req.body.title,
      description: req.body.description,
      image: req.body.image,
    });
    Blog.create(newBlogPost)
      .then((blogPost) => {
        index
          .addObject(blogPost)
          .then(({ objectID }) => {
            Blog.findOneAndUpdate(
              {
                _id: blogPost._id,
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
              .then((blogPost) => {
                res.json({
                  success: true,
                  message: 'Blog post added.',
                  blogPost: blogPost,
                });
              })
              .catch((error) => {
                res.json({
                  success: false,
                  message:
                    'An unknown error occurred while updating the new blog post with the given Algolia objectID.',
                  error: error,
                });
              });
          })
          .catch((err) => {
            Sentry.captureException(err);
            res.json({
              success: false,
              message: 'An unknown error occurred while creating the blog post to the Algolia Search API.',
            });
          });
      })
      .catch((error) => {
        if (error.code === 11000) {
          res.json({
            success: false,
            message: 'This blog post already exists in the database.',
          });
        } else {
          Sentry.captureException(error);
          res.json({
            success: false,
            message: 'An unknown error occurred while creating the blog post in the database.',
          });
        }
      });
  }
);

/* ===============================================================
 UPDATE /blog/update
=============================================================== */
/**
 * This function comment is parsed by doctrine
 * @route PUT /blog/update
 * @group Blog API - Manage blog posts.
 * @returns {object} 200 - An array of user info
 * @returns {Error} default - Unexpected error
 * @security JWT
 */
router.put('/update', jwtMiddleware, upload.single('image'), uploadImageController.uploadImages, (req, res) => {
  const _id = req.body._id;
  Blog.findOneAndUpdate(
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
    .then((blogPost) => {
      index
        .saveObject(blogPost)
        .then(() => {
          res.json({
            success: true,
            message: 'The blog post has been updated.',
          });
        })
        .catch((err) => {
          Sentry.captureException(err);
          res.json({
            success: false,
            message: 'An unknown error occurred while updating the blog post to the Algolia Search API.',
            error: err,
          });
        });
    })
    .catch((error) => {
      if (error.code === 11000) {
        res.json({
          success: false,
          message: 'This blog post already exists in the database.',
        });
      } else {
        Sentry.captureException(error);
        res.json({
          success: false,
          message: 'An unknown error occurred while creating the blog post in the database.',
        });
      }
    });
});

/* ===============================================================
 DELETE /blog/delete
=============================================================== */
/**
 * This function comment is parsed by doctrine
 * @route DELETE /blog/delete
 * @group Blog API - Manage blog posts.
 * @returns {object} 200 - An array of user info
 * @returns {Error} default - Unexpected error
 * @security JWT
 */
router.delete('/delete', jwtMiddleware, (req, res) => {
  const _id = req.body._id;
  Blog.findOne({ _id })
    .then((blogPost) => {
      index
        .deleteObject(blogPost.objectID)
        .then(() => {
          Blog.findOneAndRemove({
            _id,
          })
            .then(() => {
              res.json({
                success: true,
                message: 'Blog post has been removed.',
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
            message: 'An unknown error occurred while deleting the blog post on Algolia.',
            error: error,
          });
        });
    })
    .catch((error) => {
      Sentry.captureException(error);
      res.json({
        success: false,
        message: 'Blog post could not be found.',
      });
    });
});

module.exports = router;
