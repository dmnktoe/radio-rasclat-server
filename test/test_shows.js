const app = require('../index');
const fs = require('fs');
const Show = require('../models/Show');

let chai = require('chai');
let chaiHttp = require('chai-http');
let should = chai.should();
let async = require('async');
let faker = require('faker');
chai.use(chaiHttp);

const algoliasearch = require('algoliasearch');
const client = algoliasearch(process.env.ALGOLIA_APP_ID, process.env.ALGOLIA_ADMIN_KEY);
const index = client.initIndex(process.env.ALGOLIA_INDEX_SHOWS);

const Sentry = require('@sentry/node');

describe('Shows', () => {
  beforeEach((done) => {
    Show.deleteMany({}, (err) => {
      done();
    });
  });
  describe('Public routes', function () {
    describe('/GET shows', () => {
      it('should GET all the shows', (done) => {
        chai
          .request(app)
          .get('/shows')
          .end((err, res) => {
            res.should.have.status(200);
            res.body.should.be.a('array');
            res.body.length.should.be.eql(0);
            done();
          });
      });
    });
    describe('/GET shows/show/:id', () => {
      it('should GET a show by the given id', (done) => {
        const newShow = new Show({
          title: faker.name.findName(),
          description: faker.lorem.sentence(),
        });
        newShow.save((err, show) => {
          chai
            .request(app)
            .get('/shows/show/' + show.id)
            .end((err, res) => {
              res.should.have.status(200);
              res.body.should.be.a('object');
              res.body.should.have.property('title');
              res.body.should.have.property('_id').eql(show.id);
              done();
            });
        });
      });
      it('should display that the show was not found', (done) => {
        chai
          .request(app)
          .get('/shows/show/' + '0a00a0000aa0aa0000a0000a')
          .end((err, res) => {
            res.should.have.status(404);
            res.body.should.be.a('object');
            res.body.should.have.property('success');
            res.body.should.have.property('message');
            res.body.should.have.property('success').eql(false);
            res.body.should.have.property('message').eql('Show not found.');
            done();
          });
      });
    });
  });

  describe('Admin routes', () => {
    describe('/POST shows', () => {
      it('should not POST a show without title field', (done) => {
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
              let show = {
                image: '',
              };
              chai
                .request(app)
                .post('/shows')
                .set('Authorization', token)
                .send(show)
                .end((err, res) => {
                  res.should.have.status(200);
                  res.body.should.be.a('object');
                  res.body.should.have.property('success');
                  res.body.should.have.property('message');
                  res.body.should.have.property('success').eql(false);
                  res.body.should.have.property('message').eql('No show title was provided.');
                  next();
                });
            },
          ],
          function finish(err, result) {
            done(err);
          }
        );
      });
      it('should not POST a show without description field', (done) => {
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
              let show = {
                title: faker.name.findName(),
                image: '',
              };
              chai
                .request(app)
                .post('/shows')
                .set('Authorization', token)
                .send(show)
                .end((err, res) => {
                  res.should.have.status(200);
                  res.body.should.be.a('object');
                  res.body.should.have.property('success');
                  res.body.should.have.property('message');
                  res.body.should.have.property('success').eql(false);
                  res.body.should.have.property('message').eql('No show description was provided.');
                  next();
                });
            },
          ],
          function finish(err, result) {
            done(err);
          }
        );
      });
      it('should POST a show', (done) => {
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
              let show = {
                title: faker.name.findName(),
                description: faker.lorem.sentence(),
              };
              chai
                .request(app)
                .post('/shows')
                .set('Authorization', token)
                .send(show)
                .end((err, res) => {
                  res.should.have.status(200);
                  res.body.should.be.a('object');
                  res.body.should.have.property('success');
                  res.body.should.have.property('message');
                  res.body.should.have.property('success').eql(true);
                  res.body.should.have.property('message').eql('Show added.');
                  next();
                });
            },
          ],
          function finish(err, result) {
            done(err);
          }
        );
      });
      it('should POST a show (with image)', (done) => {
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
              let show = {
                title: faker.name.findName(),
                description: faker.lorem.sentence(),
              };
              chai
                .request(app)
                .post('/shows')
                .set('Authorization', token)
                .field('title', show.title)
                .field('description', show.description)
                .attach('image', fs.readFileSync(__dirname + '/files/testImgFile.jpg'), 'testImgFile.jpg')
                .end((err, res) => {
                  res.should.have.status(200);
                  res.body.should.be.a('object');
                  res.body.should.have.property('success');
                  res.body.should.have.property('message');
                  res.body.should.have.property('success').eql(true);
                  res.body.should.have.property('message').eql('Show added.');
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
    describe('/DELETE shows', () => {
      it('should DELETE a show', (done) => {
        async.waterfall(
          [
            function createShow(next) {
              const newShow = new Show({
                title: faker.name.findName(),
                description: faker.lorem.sentence(),
              });
              newShow.save((err, show) => {
                if (err) return next(err);
                let id = show._id;
                index.addObject(show).then(({ objectID }) => {
                  Show.findOneAndUpdate(
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
                    .then((show) => {
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
                  let showObj = {
                    token: response.token,
                    showId: id,
                  };
                  next(null, showObj);
                });
            },
            function consumeAdminRoute(showObj, next) {
              let show = {
                _id: showObj.showId,
              };
              chai
                .request(app)
                .delete('/shows/delete')
                .set('Authorization', showObj.token)
                .send(show)
                .end((err, res) => {
                  res.should.have.status(200);
                  res.body.should.be.a('object');
                  res.body.should.have.property('success');
                  res.body.should.have.property('message');
                  res.body.should.have.property('success').eql(true);
                  res.body.should.have.property('message').eql('Show has been removed.');
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
    client.deleteIndex(process.env.ALGOLIA_INDEX_SHOWS, (err, content) => {
      if (err) throw err;
    });
    done();
  });
});
