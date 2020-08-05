const crypto = require('crypto').randomBytes(256).toString('hex');

// Export config object
module.exports = {
  uri: process.env.DB_URL, // Databse URI and database name
  secret: crypto, // Cryto-created secret
  tokenLife: '48h',
  refreshTokenSecret: crypto, // Cryto-created refreshTokenSecret
  refreshTokenLife: '7d',
  db: process.env.DB_NAME, // Database name
};
