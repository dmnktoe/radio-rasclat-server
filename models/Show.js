/* ===================
   Import Node Modules
=================== */
const slug = require('mongoose-slug-updater');
const mongoose = require('mongoose'); // Node Tool for MongoDB
mongoose.Promise = global.Promise; // Configure Mongoose Promises
const Schema = mongoose.Schema; // Import Schema from Mongoose

// Blog Model Definition
const showSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      unique: true,
    },
    description: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      required: false,
    },
    objectID: {
      type: String,
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

showSchema.plugin(slug);

// Export Module/Schema
module.exports = mongoose.model('Show', showSchema);
