const User = require('../models/User'); // Import User Model Schema
const jwt = require('jsonwebtoken'); // Compact, URL-safe means of representing claims to be transferred between two parties.
const config = require('../config/database'); // Import database configuration
const randtoken = require('rand-token');

const express = require('express');
const router = express.Router();

const refreshTokens = {};

/* ============================================================
   Register route
============================================================ */
router.post('/register', (req, res) => {});

/* ============================================================
   Login route
============================================================ */
router.post('/login', (req, res) => {
  // Check if username was provided
  if (!req.body.username) {
    res.status(401).json({
      error: {
        message: 'Login fehlgeschlagen.',
      },
    }); // Return error
  } else {
    // Check if password was provided
    if (!req.body.password) {
      res.status(401).json({
        error: {
          message: 'Login fehlgeschlagen.',
        },
      }); // Return error
    } else {
      // Check if username exists in database
      User.findOne(
        {
          username: req.body.username.toLowerCase(),
        },
        (err, user) => {
          // Check if error was found
          if (err) {
            res.status(401).json({
              error: {
                message: 'Login fehlgeschlagen.',
              },
            }); // Return error
          } else {
            // Check if username was found
            if (!user) {
              res.status(401).json({
                error: {
                  message: 'Benutzername nicht gefunden.',
                },
              }); // Return error
            } else {
              const validPassword = user.comparePassword(req.body.password); // Compare password provided to password in database
              // Check if password is a match
              if (!validPassword) {
                res.status(401).json({
                  error: {
                    message: 'Passwort falsch.',
                  },
                }); // Return error
              } else {
                const user = {
                  username: req.body.username.toLowerCase(),
                  role: 'admin',
                };
                const token = jwt.sign(
                  {
                    user,
                  },
                  config.secret,
                  {
                    expiresIn: config.tokenLife,
                  }
                ); // Create a token for client
                const refreshToken = randtoken.uid(256);
                refreshTokens[refreshToken] = req.body.username.toLowerCase();
                res.json({
                  success: true,
                  message: 'Sie werden eingeloggt...',
                  token: token,
                  refreshToken: refreshToken,
                  username: user.username,
                });
              }
            }
          }
        }
      );
    }
  }
});

/* ============================================================
  Logout route
============================================================ */
router.post('/logout', function (req, res) {
  const refreshToken = req.body.refreshToken;
  if (refreshToken in refreshTokens) {
    delete refreshTokens[refreshToken];
  }
  res.json({
    success: true,
    message: 'You will be signed out.',
  });
});

/* ============================================================
   Refresh token
============================================================ */
router.post('/refresh-token', function (req, res) {
  const refreshToken = req.body.refreshToken;
  if (refreshToken in refreshTokens) {
    const user = {
      username: refreshTokens[refreshToken],
      role: 'admin',
    };
    const token = jwt.sign(
      {
        user,
      },
      config.secret,
      {
        expiresIn: config.tokenLife,
      }
    ); // Create a token for client
    res.json({
      success: true,
      message: 'You will be signed in.',
      token: token,
      refreshToken: refreshToken,
      username: user.username,
    });
  } else {
    res.sendStatus(401);
  }
});

module.exports = router;
