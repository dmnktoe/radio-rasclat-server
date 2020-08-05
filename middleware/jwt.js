const User = require('../models/User'); // Import User Model Schema
const jwt = require('jsonwebtoken'); // Compact, URL-safe means of representing claims to be transferred between two parties.
const config = require('../config/database'); // Import database configuration
const randtoken = require('rand-token');

module.exports = function (req, res, next) {
  const token = req.header('Authorization').replace('Bearer ', ''); // Create token found in headers
  // Check if token was found in headers
  if (!token) {
    res.status(401).json({
      success: false,
      message: 'Es konnte kein Authentifizierungs-Token gefunden werden.',
    }); // Return error
  } else {
    // Verify the token is valid
    jwt.verify(token, config.secret, (err, decoded) => {
      // Check if error is expired or invalid
      if (err) {
        res.status(403).json({
          success: false,
          message: 'Dieser Token ist ungültig: ' + err,
        }); // Return error for token validation
      } else {
        req.decoded = decoded; // Create global variable to use in any request beyond
        next(); // Exit middleware
      }
    });
  }
};
