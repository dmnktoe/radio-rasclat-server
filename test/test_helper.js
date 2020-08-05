//inside tests/test_helper.js
const mongoose = require('mongoose');
//tell mongoose to use es6 implementation of promises
mongoose.Promise = global.Promise;
const Artist = require('../models/Artist');
const Genre = require('../models/Genre');
const Recording = require('../models/Recording');
const Show = require('../models/Show');

before((done) => {
  Artist.collection.deleteMany(() => {});
  Genre.collection.deleteMany(() => {});
  Recording.collection.deleteMany(() => {});
  Show.collection.deleteMany(() => {});
  done();
});

after((done) => {
  Artist.collection.deleteMany(() => {});
  Genre.collection.deleteMany(() => {});
  Recording.collection.deleteMany(() => {});
  Show.collection.deleteMany(() => {});
  done();
});
