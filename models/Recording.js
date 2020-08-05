/* ===================
   Import Node Modules
=================== */
const slug = require('mongoose-slug-updater');
const mongoose = require('mongoose'); // Node Tool for MongoDB
mongoose.Promise = global.Promise; // Configure Mongoose Promises
const Schema = mongoose.Schema; // Import Schema from Mongoose

// Blog Model Definition
const recordingSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: false,
    },
    show: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Show',
      required: true,
    },
    artists: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Artist',
        required: true,
      },
    ],
    genres: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Genre',
        required: true,
      },
    ],
    audio: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      required: true,
    },
    objectID: {
      type: String,
    },
    timeStart: {
      type: Date,
      required: true,
    },
    timeEnd: {
      type: Date,
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

recordingSchema.plugin(slug);

// Export Module/Schema
module.exports = mongoose.model('Recording', recordingSchema);
