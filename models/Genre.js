/* ===================
   Import Node Modules
=================== */
const slug = require('mongoose-slug-updater');
const mongoose = require('mongoose'); // Node Tool for MongoDB
mongoose.Promise = global.Promise; // Configure Mongoose Promises
const Schema = mongoose.Schema; // Import Schema from Mongoose

// Blog Model Definition
const genreSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      unique: true,
    },
    color: {
      type: String,
      required: true,
    },
    slug: {
      type: String,
      slug: 'title',
    },
  },
  {
    timestamps: true,
  }
);

genreSchema.plugin(slug);

// Export Module/Schema
module.exports = mongoose.model('Genre', genreSchema);
