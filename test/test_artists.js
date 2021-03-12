const app = require('../index');
const Artist = require('../models/Artist');

let chai = require('chai');
let chaiHttp = require('chai-http');
let should = chai.should();
let async = require('async');
let faker = require('faker');
chai.use(chaiHttp);

const algoliasearch = require('algoliasearch');
const client = algoliasearch(process.env.ALGOLIA_APP_ID, process.env.ALGOLIA_ADMIN_KEY);
const index = client.initIndex(process.env.ALGOLIA_INDEX_ARTISTS);

faker.locale = 'de';

const Sentry = require('@sentry/node');

describe('Artists', () => {
  beforeEach((done) => {
    Artist.deleteMany({}, (err) => {
      done();
    });
  });
  describe('Public routes', function () {
    describe('/GET artists', () => {
      it('should GET all the artists', (done) => {
        chai
          .request(app)
          .get('/artists')
          .end((err, res) => {
            res.should.have.status(200);
            res.body.should.be.a('array');
            res.body.length.should.be.eql(0);
            done();
          });
      });
    });
    describe('/GET artists/artist/:id', () => {
      it('should GET an artist by the given id', (done) => {
        const newArtist = new Artist({
          title: faker.name.findName(),
        });
        newArtist.save((err, artist) => {
          chai
            .request(app)
            .get('/artists/artist/' + artist.id)
            .end((err, res) => {
              res.should.have.status(200);
              res.body.should.be.a('object');
              res.body.should.have.property('title');
              res.body.should.have.property('_id').eql(artist.id);
              done();
            });
        });
      });
      it('should display that the artist was not found', (done) => {
        chai
          .request(app)
          .get('/artists/artist/' + '0a00a0000aa0aa0000a0000a')
          .end((err, res) => {
            res.should.have.status(404);
            res.body.should.be.a('object');
            res.body.should.have.property('success');
            res.body.should.have.property('message');
            res.body.should.have.property('success').eql(false);
            res.body.should.have.property('message').eql('Artist not found.');
            done();
          });
      });
    });
  });

  describe('Admin routes', () => {
    describe('/POST artists', () => {
      it('should not POST an artist without title field', (done) => {
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
              let artist = {
                image: '',
              };
              chai
                .request(app)
                .post('/artists')
                .set('Authorization', token)
                .send(artist)
                .end((err, res) => {
                  res.should.have.status(200);
                  res.body.should.be.a('object');
                  res.body.should.have.property('success');
                  res.body.should.have.property('message');
                  res.body.should.have.property('success').eql(false);
                  res.body.should.have.property('message').eql('No artist title was provided.');
                  next();
                });
            },
          ],
          function finish(err, result) {
            done(err);
          }
        );
      });
      it('should POST an artist', (done) => {
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
              let artist = {
                title: faker.name.findName(),
              };
              chai
                .request(app)
                .post('/artists')
                .set('Authorization', token)
                .send(artist)
                .end((err, res) => {
                  res.should.have.status(200);
                  res.body.should.be.a('object');
                  res.body.should.have.property('success');
                  res.body.should.have.property('message');
                  res.body.should.have.property('success').eql(true);
                  res.body.should.have.property('message').eql('Artist added.');
                  next();
                });
            },
          ],
          function finish(err, result) {
            done(err);
          }
        );
      });
    });
    describe('/DELETE artists', () => {
      it('should DELETE an artist', (done) => {
        async.waterfall(
          [
            function createArtist(next) {
              const newArtist = new Artist({
                title: faker.name.findName(),
              });
              newArtist.save((err, artist) => {
                if (err) return next(err);
                let id = artist._id;
                index.addObject(artist).then(({ objectID }) => {
                  Artist.findOneAndUpdate(
                    {
                      _id: id,
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
                    .then((artist) => {
                      next(null, id);
                    })
                    .catch((error) => {
                      Sentry.captureException(error);
                    });
                });
              });
            },
            function login(id, next) {
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
                  let artistObj = {
                    token: response.token,
                    artistId: id,
                  };
                  next(null, artistObj);
                });
            },
            function consumeAdminRoute(artistObj, next) {
              let artist = {
                _id: artistObj.artistId,
              };
              chai
                .request(app)
                .delete('/artists/delete')
                .set('Authorization', artistObj.token)
                .send(artist)
                .end((err, res) => {
                  res.should.have.status(200);
                  res.body.should.be.a('object');
                  res.body.should.have.property('success');
                  res.body.should.have.property('message');
                  res.body.should.have.property('success').eql(true);
                  res.body.should.have.property('message').eql('Artist has been removed.');
                  next();
                });
            },
          ],
          function finish(err, result) {
            done(err);
          }
        );
      });
    });
  });
  after((done) => {
    client.deleteIndex(process.env.ALGOLIA_INDEX_ARTISTS, (err, content) => {
      if (err) throw err;
    });
    done();
  });
});
