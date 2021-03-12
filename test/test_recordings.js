const app = require('../index');
const fs = require('fs');
const Artist = require('../models/Artist');
const Genre = require('../models/Genre');
const Recording = require('../models/Recording');
const Show = require('../models/Show');

let chai = require('chai');
let chaiHttp = require('chai-http');
let should = chai.should();
let async = require('async');
let faker = require('faker');
chai.use(chaiHttp);

const FormData = require('form-data');

const algoliasearch = require('algoliasearch');
const client = algoliasearch(process.env.ALGOLIA_APP_ID, process.env.ALGOLIA_ADMIN_KEY);
const index = client.initIndex(process.env.ALGOLIA_INDEX_RECORDINGS);

const path = require('path');
const Sentry = require('@sentry/node');

faker.locale = 'de';

describe('Recordings', () => {
  beforeEach((done) => {
    Recording.deleteMany({}, (err) => {
      done();
    });
  });
  describe('Public routes', function () {
    describe('/GET recordings', () => {
      it('should GET all the recordings', (done) => {
        chai
          .request(app)
          .get('/recordings')
          .end((err, res) => {
            res.should.have.status(200);
            res.body.should.be.a('array');
            res.body.length.should.be.eql(0);
            done();
          });
      });
    });
    describe('/GET recordings/recording/:id', () => {
      it('should GET a recording by the given id', (done) => {
        const newArtist = new Artist({
          title: faker.name.findName(),
        });
        const newGenre = new Genre({
          title: faker.name.findName(),
          color: faker.internet.color(),
        });
        const newShow = new Show({
          title: faker.name.findName(),
          description: faker.lorem.sentence(),
        });
        newArtist.save((err, artist) => {
          let artistId = artist._id;
          newGenre.save((err, genre) => {
            let genreId = genre._id;
            newShow.save((err, show) => {
              let showId = show._id;
              const newRecording = new Recording({
                title: faker.name.findName(),
                show: showId,
                artists: artistId,
                genres: genreId,
                audio: 'fakeFilePath',
                image: 'fakeFilePath',
                timeStart: Date.now(),
                timeEnd: Date.now(),
              });
              newRecording.save((err, recording) => {
                chai
                  .request(app)
                  .get('/recordings/recording/' + recording.id)
                  .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.be.a('object');
                    res.body.should.have.property('title');
                    res.body.should.have.property('_id').eql(recording.id);
                    done();
                  });
              });
            });
          });
        });
      });
      it('should display that the recording was not found', (done) => {
        chai
          .request(app)
          .get('/recordings/recording/' + '0a00a0000aa0aa0000a0000a')
          .end((err, res) => {
            res.should.have.status(404);
            res.body.should.be.a('object');
            res.body.should.have.property('success');
            res.body.should.have.property('message');
            res.body.should.have.property('success').eql(false);
            res.body.should.have.property('message').eql('Recording not found.');
            done();
          });
      });
    });
    // TODO: Test routes based on Google Analytics
  });
  describe('Admin routes', () => {
    describe('/POST recordings', () => {
      it('should not POST a recording without title field', (done) => {
        async.waterfall(
          [
            function login(next) {
              let user = {
                username: process.env.BACKEND_ADMIN_USER,
                password: process.env.BACKEND_ADMIN_PASSWORD,
              };
              chai
                .request(app)
                .post('/auth/login')
                .send(user)
                .end((err, res) => {
                  res.should.have.status(200);
                  res.body.should.be.a('object');
                  if (err) return next(err);

                  let response = JSON.parse(res.text);
                  next(null, response.token);
                });
            },
            function consumeAdminRoute(token, next) {
              let recording = {
                image: '',
              };
              chai
                .request(app)
                .post('/recordings')
                .set('Authorization', token)
                .send(recording)
                .end((err, res) => {
                  res.should.have.status(200);
                  res.body.should.be.a('object');
                  res.body.should.have.property('success');
                  res.body.should.have.property('message');
                  res.body.should.have.property('success').eql(false);
                  res.body.should.have.property('message').eql('No recording title was provided.');
                  next();
                });
            },
          ],
          function finish(err, result) {
            done(err);
          }
        );
      });
      it('should not POST a recording without artist', (done) => {
        async.waterfall(
          [
            function login(next) {
              let user = {
                username: process.env.BACKEND_ADMIN_USER,
                password: process.env.BACKEND_ADMIN_PASSWORD,
              };
              chai
                .request(app)
                .post('/auth/login')
                .send(user)
                .end((err, res) => {
                  res.should.have.status(200);
                  res.body.should.be.a('object');
                  if (err) return next(err);

                  let response = JSON.parse(res.text);
                  next(null, response.token);
                });
            },
            function consumeAdminRoute(token, next) {
              let recording = {
                title: faker.name.findName(),
                image: '',
              };
              chai
                .request(app)
                .post('/recordings')
                .set('Authorization', token)
                .send(recording)
                .end((err, res) => {
                  res.should.have.status(200);
                  res.body.should.be.a('object');
                  res.body.should.have.property('success');
                  res.body.should.have.property('message');
                  res.body.should.have.property('success').eql(false);
                  res.body.should.have.property('message').eql('No artist was given.');
                  next();
                });
            },
          ],
          function finish(err, result) {
            done(err);
          }
        );
      });
      it('should not POST a recording without genre', (done) => {
        async.waterfall(
          [
            function login(next) {
              let user = {
                username: process.env.BACKEND_ADMIN_USER,
                password: process.env.BACKEND_ADMIN_PASSWORD,
              };
              chai
                .request(app)
                .post('/auth/login')
                .send(user)
                .end((err, res) => {
                  res.should.have.status(200);
                  res.body.should.be.a('object');
                  if (err) return next(err);

                  let response = JSON.parse(res.text);
                  next(null, response.token);
                });
            },
            function consumeAdminRoute(token, next) {
              let recording = {
                title: faker.name.findName(),
                artists: faker.name.firstName(),
                genres: '',
              };
              chai
                .request(app)
                .post('/recordings')
                .set('Authorization', token)
                .send(recording)
                .end((err, res) => {
                  res.should.have.status(200);
                  res.body.should.be.a('object');
                  res.body.should.have.property('success');
                  res.body.should.have.property('message');
                  res.body.should.have.property('success').eql(false);
                  res.body.should.have.property('message').eql('No describing genre was given.');
                  next();
                });
            },
          ],
          function finish(err, result) {
            done(err);
          }
        );
      });
      it('should not POST a recording without timeStart', (done) => {
        async.waterfall(
          [
            function login(next) {
              let user = {
                username: process.env.BACKEND_ADMIN_USER,
                password: process.env.BACKEND_ADMIN_PASSWORD,
              };
              chai
                .request(app)
                .post('/auth/login')
                .send(user)
                .end((err, res) => {
                  res.should.have.status(200);
                  res.body.should.be.a('object');
                  if (err) return next(err);

                  let response = JSON.parse(res.text);
                  next(null, response.token);
                });
            },
            function consumeAdminRoute(token, next) {
              let recording = {
                title: faker.name.findName(),
                artists: faker.name.firstName(),
                genres: faker.name.jobType(),
                timeStart: '',
              };
              chai
                .request(app)
                .post('/recordings')
                .set('Authorization', token)
                .send(recording)
                .end((err, res) => {
                  res.should.have.status(200);
                  res.body.should.be.a('object');
                  res.body.should.have.property('success');
                  res.body.should.have.property('message');
                  res.body.should.have.property('success').eql(false);
                  res.body.should.have.property('message').eql('No starting time was provided.');
                  next();
                });
            },
          ],
          function finish(err, result) {
            done(err);
          }
        );
      });
      it('should not POST a recording without timeEnd', (done) => {
        async.waterfall(
          [
            function login(next) {
              let user = {
                username: process.env.BACKEND_ADMIN_USER,
                password: process.env.BACKEND_ADMIN_PASSWORD,
              };
              chai
                .request(app)
                .post('/auth/login')
                .send(user)
                .end((err, res) => {
                  res.should.have.status(200);
                  res.body.should.be.a('object');
                  if (err) return next(err);

                  let response = JSON.parse(res.text);
                  next(null, response.token);
                });
            },
            function consumeAdminRoute(token, next) {
              let recording = {
                title: faker.name.findName(),
                artists: faker.name.firstName(),
                genres: faker.name.jobType(),
                timeStart: faker.date.past(),
                timeEnd: '',
              };
              chai
                .request(app)
                .post('/recordings')
                .set('Authorization', token)
                .send(recording)
                .end((err, res) => {
                  res.should.have.status(200);
                  res.body.should.be.a('object');
                  res.body.should.have.property('success');
                  res.body.should.have.property('message');
                  res.body.should.have.property('success').eql(false);
                  res.body.should.have.property('message').eql('No ending time was provided.');
                  next();
                });
            },
          ],
          function finish(err, result) {
            done(err);
          }
        );
      });
      it('should not POST a recording without show', (done) => {
        async.waterfall(
          [
            function login(next) {
              let user = {
                username: process.env.BACKEND_ADMIN_USER,
                password: process.env.BACKEND_ADMIN_PASSWORD,
              };
              chai
                .request(app)
                .post('/auth/login')
                .send(user)
                .end((err, res) => {
                  res.should.have.status(200);
                  res.body.should.be.a('object');
                  if (err) return next(err);

                  let response = JSON.parse(res.text);
                  next(null, response.token);
                });
            },
            function consumeAdminRoute(token, next) {
              let recording = {
                title: faker.name.findName(),
                artists: faker.name.firstName(),
                genres: faker.name.jobType(),
                timeStart: faker.date.past(),
                timeEnd: faker.date.future(),
                show: '',
              };
              chai
                .request(app)
                .post('/recordings')
                .set('Authorization', token)
                .send(recording)
                .end((err, res) => {
                  res.should.have.status(200);
                  res.body.should.be.a('object');
                  res.body.should.have.property('success');
                  res.body.should.have.property('message');
                  res.body.should.have.property('success').eql(false);
                  res.body.should.have.property('message').eql('No show was provided.');
                  next();
                });
            },
          ],
          function finish(err, result) {
            done(err);
          }
        );
      });
      it('should not POST a recording without audio file', (done) => {
        async.waterfall(
          [
            function createObjects(next) {
              const newArtist = new Artist({
                title: faker.name.findName(),
              });
              const newGenre = new Genre({
                title: faker.name.findName(),
                color: faker.internet.color(),
              });
              const newShow = new Show({
                title: faker.name.findName(),
                description: faker.lorem.sentence(),
              });
              newArtist.save((err, artist) => {
                let artistId = artist._id;
                newGenre.save((err, genre) => {
                  let genreId = genre._id;
                  newShow.save((err, show) => {
                    let showId = show._id;
                    let recording = {
                      title: faker.name.findName(),
                      show: showId,
                      artists: artistId,
                      genres: genreId,
                      timeStart: Date.now(),
                      timeEnd: Date.now(),
                    };
                    next(null, recording);
                  });
                });
              });
            },
            function login(recording, next) {
              let user = {
                username: process.env.BACKEND_ADMIN_USER,
                password: process.env.BACKEND_ADMIN_PASSWORD,
              };
              chai
                .request(app)
                .post('/auth/login')
                .send(user)
                .end((err, res) => {
                  res.should.have.status(200);
                  res.body.should.be.a('object');
                  if (err) return next(err);

                  let response = JSON.parse(res.text);
                  let recordingObj = {
                    token: response.token,
                    recording: recording,
                  };

                  next(null, recordingObj);
                });
            },
            function consumeAdminRoute(recordingObj, next) {
              chai
                .request(app)
                .post('/recordings')
                .set('Authorization', recordingObj.token)
                .field('title', recordingObj.recording.title)
                .field('show', recordingObj.recording.show.toString())
                .field('artists', recordingObj.recording.artists.toString())
                .field('genres', recordingObj.recording.genres.toString())
                .field('timeStart', recordingObj.recording.timeStart)
                .field('timeEnd', recordingObj.recording.timeEnd)
                .attach('image', fs.readFileSync(__dirname + '/files/testImgFile.jpg'), 'testImgFile.jpg')
                .end((err, res) => {
                  res.should.have.status(200);
                  res.body.should.be.a('object');
                  res.body.should.have.property('success');
                  res.body.should.have.property('message');
                  res.body.should.have.property('success').eql(false);
                  res.body.should.have.property('message').eql('No audio file was uploaded.');
                  next();
                });
            },
          ],
          function finish(err, result) {
            done(err);
          }
        );
      });
      it('should not POST a recording without image', (done) => {
        async.waterfall(
          [
            function createObjects(next) {
              const newArtist = new Artist({
                title: faker.name.findName(),
              });
              const newGenre = new Genre({
                title: faker.name.findName(),
                color: faker.internet.color(),
              });
              const newShow = new Show({
                title: faker.name.findName(),
                description: faker.lorem.sentence(),
              });
              newArtist.save((err, artist) => {
                let artistId = artist._id;
                newGenre.save((err, genre) => {
                  let genreId = genre._id;
                  newShow.save((err, show) => {
                    let showId = show._id;
                    let recording = {
                      title: faker.name.findName(),
                      show: showId,
                      artists: artistId,
                      genres: genreId,
                      timeStart: Date.now(),
                      timeEnd: Date.now(),
                    };
                    next(null, recording);
                  });
                });
              });
            },
            function login(recording, next) {
              let user = {
                username: process.env.BACKEND_ADMIN_USER,
                password: process.env.BACKEND_ADMIN_PASSWORD,
              };
              chai
                .request(app)
                .post('/auth/login')
                .send(user)
                .end((err, res) => {
                  res.should.have.status(200);
                  res.body.should.be.a('object');
                  if (err) return next(err);

                  let response = JSON.parse(res.text);
                  let recordingObj = {
                    token: response.token,
                    recording: recording,
                  };

                  next(null, recordingObj);
                });
            },
            function consumeAdminRoute(recordingObj, next) {
              chai
                .request(app)
                .post('/recordings')
                .set('Authorization', recordingObj.token)
                .field('title', recordingObj.recording.title)
                .field('show', recordingObj.recording.show.toString())
                .field('artists', recordingObj.recording.artists.toString())
                .field('genres', recordingObj.recording.genres.toString())
                .field('timeStart', recordingObj.recording.timeStart)
                .field('timeEnd', recordingObj.recording.timeEnd)
                .attach('audio', fs.readFileSync(__dirname + '/files/testAudioFile.wav'), 'testAudioFile.wav')
                .end((err, res) => {
                  res.should.have.status(200);
                  res.body.should.be.a('object');
                  res.body.should.have.property('success');
                  res.body.should.have.property('message');
                  res.body.should.have.property('success').eql(false);
                  res.body.should.have.property('message').eql('No image was uploaded.');
                  next();
                });
            },
          ],
          function finish(err, result) {
            done(err);
          }
        );
      });
      it('should POST a recording', (done) => {
        async.waterfall(
          [
            function createObjects(next) {
              const newArtist = new Artist({
                title: faker.name.findName(),
              });
              const newGenre = new Genre({
                title: faker.name.findName(),
                color: faker.internet.color(),
              });
              const newShow = new Show({
                title: faker.name.findName(),
                description: faker.lorem.sentence(),
              });
              newArtist.save((err, artist) => {
                let artistId = artist._id;
                newGenre.save((err, genre) => {
                  let genreId = genre._id;
                  newShow.save((err, show) => {
                    let showId = show._id;
                    let recording = {
                      title: faker.name.findName(),
                      show: showId,
                      artists: artistId,
                      genres: genreId,
                      timeStart: Date.now(),
                      timeEnd: Date.now(),
                    };
                    next(null, recording);
                  });
                });
              });
            },
            function login(recording, next) {
              let user = {
                username: process.env.BACKEND_ADMIN_USER,
                password: process.env.BACKEND_ADMIN_PASSWORD,
              };
              chai
                .request(app)
                .post('/auth/login')
                .send(user)
                .end((err, res) => {
                  res.should.have.status(200);
                  res.body.should.be.a('object');
                  if (err) return next(err);

                  let response = JSON.parse(res.text);
                  let recordingObj = {
                    token: response.token,
                    recording: recording,
                  };

                  next(null, recordingObj);
                });
            },
            function consumeAdminRoute(recordingObj, next) {
              chai
                .request(app)
                .post('/recordings')
                .set('Authorization', recordingObj.token)
                .field('title', recordingObj.recording.title)
                .field('show', recordingObj.recording.show.toString())
                .field('artists', recordingObj.recording.artists.toString())
                .field('genres', recordingObj.recording.genres.toString())
                .field('timeStart', recordingObj.recording.timeStart)
                .field('timeEnd', recordingObj.recording.timeEnd)
                .attach('image', fs.readFileSync(__dirname + '/files/testImgFile.jpg'), 'testImgFile.jpg')
                .attach('audio', fs.readFileSync(__dirname + '/files/testAudioFile.wav'), 'testAudioFile.wav')
                .end((err, res) => {
                  res.should.have.status(200);
                  res.body.should.be.a('object');
                  res.body.should.have.property('success');
                  res.body.should.have.property('message');
                  res.body.should.have.property('success').eql(true);
                  res.body.should.have.property('message').eql('Recording added.');
                  next();
                });
            },
          ],
          function finish(err, result) {
            done(err);
          }
        );
      }); /*
    });
    describe('/DELETE recordings', () => {
      it('should DELETE a recording', done => {
        async.waterfall(
          [
            function createGenre(next) {
              const newArtist = new Artist({
                title: faker.name.findName()
              });
              const newGenre = new Genre({
                title: faker.name.findName(),
                color: faker.internet.color()
              });
              const newShow = new Show({
                title: faker.name.findName(),
                description: faker.lorem.sentence()
              });
              newArtist.save((err, artist) => {
                let artistId = artist._id;
                newGenre.save((err, genre) => {
                  let genreId = genre._id;
                  newShow.save((err, show) => {
                    let showId = show._id;
                    const newRecording = new Recording({
                      title: faker.name.findName(),
                      show: showId,
                      artists: artistId,
                      genres: genreId,
                      audio: 'fakeFilePath',
                      image: 'fakeFilePath',
                      timeStart: Date.now(),
                      timeEnd: Date.now()
                    });
                    newRecording.save((err, recording) => {
                      if (err) {
                        Sentry.captureException(error);
                        return next(err);
                      } else {
                        next(null, recording);
                      }
                    })
                  })
                })
              })
            },
            function login(recording, next) {
              let user = {
                username: process.env.BACKEND_ADMIN_USER,
                password: process.env.BACKEND_ADMIN_PASSWORD
              };
              chai
                .request(app)
                .post('/auth/login')
                .send(user)
                .end((err, res) => {
                  res.should.have.status(200);
                  res.body.should.be.a('object');
                  if (err) return next(err);

                  let response = JSON.parse(res.text);
                  let recordingObj = {
                    token: response.token,
                    recording: recording
                  };
                  next(null, recordingObj);
                });
            },
            function consumeAdminRoute(recordingObj, next) {
              chai
                .request(app)
                .delete('/recordings/delete')
                .set('Authorization', recordingObj.token)
                .send(recordingObj.recording)
                .end((err, res) => {
                  console.log(res);
                  res.should.have.status(200);
                  res.body.should.be.a('object');
                  res.body.should.have.property('success');
                  res.body.should.have.property('message');
                  res.body.should.have.property('success').eql(true);
                  res.body.should.have.property('message').eql('Recording has been removed.');
                  next();
                });
            }
          ],
          function finish(err, result) {
            done(err);
          }
        );
      });*/
    });
  });
  after((done) => {
    client.deleteIndex(process.env.ALGOLIA_INDEX_RECORDINGS, (err, content) => {
      if (err) throw err;
    });
    done();
  });
});
