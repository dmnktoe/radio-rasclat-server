const app = require('../index');
const Genre = require('../models/Genre');

let chai = require('chai');
let chaiHttp = require('chai-http');
let should = chai.should();
let async = require('async');

chai.use(chaiHttp);

describe('Genres', () => {
  beforeEach((done) => {
    Genre.deleteMany({}, (err) => {
      done();
    });
  });
  describe('Public routes', function () {
    describe('/GET genres', () => {
      it('should GET all the genres', (done) => {
        chai
          .request(app)
          .get('/genres')
          .end((err, res) => {
            res.should.have.status(200);
            res.body.should.be.a('array');
            res.body.length.should.be.eql(0);
            done();
          });
      });
    });
    describe('/GET genres/genre/:id', () => {
      it('should GET a genre by the given id', (done) => {
        const newGenre = new Genre({
          title: 'Jazz',
          color: '#FF0000',
        });
        newGenre.save((err, genre) => {
          chai
            .request(app)
            .get('/genres/genre/' + genre.id)
            .end((err, res) => {
              res.should.have.status(200);
              res.body.should.be.a('object');
              res.body.should.have.property('title');
              res.body.should.have.property('color');
              res.body.should.have.property('_id').eql(genre.id);
              done();
            });
        });
      });
      it('should display that the genre was not found', (done) => {
        chai
          .request(app)
          .get('/genres/genre/' + '0a00a0000aa0aa0000a0000a')
          .end((err, res) => {
            res.should.have.status(200);
            res.body.should.be.a('object');
            res.body.should.have.property('success');
            res.body.should.have.property('message');
            res.body.should.have.property('success').eql(false);
            res.body.should.have.property('message').eql('Genre not found.');
            done();
          });
      });
    });
  });

  describe('Admin routes', () => {
    describe('/POST genres', () => {
      it('should not POST a genre without color field', (done) => {
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
              let genre = {
                title: 'Jazz',
              };
              chai
                .request(app)
                .post('/genres')
                .set('Authorization', token)
                .send(genre)
                .end((err, res) => {
                  res.should.have.status(200);
                  res.body.should.be.a('object');
                  res.body.should.have.property('success');
                  res.body.should.have.property('message');
                  res.body.should.have.property('success').eql(false);
                  res.body.should.have.property('message').eql('No genre color was provided.');
                  next();
                });
            },
          ],
          function finish(err, result) {
            done(err);
          }
        );
      });
      it('should POST a genre', (done) => {
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
              let genre = {
                title: 'Jazz',
                color: '#FF0000',
              };
              chai
                .request(app)
                .post('/genres')
                .set('Authorization', token)
                .send(genre)
                .end((err, res) => {
                  res.should.have.status(200);
                  res.body.should.be.a('object');
                  res.body.should.have.property('success');
                  res.body.should.have.property('message');
                  res.body.should.have.property('success').eql(true);
                  res.body.should.have.property('message').eql('Genre added.');
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
    describe('/DELETE genres', () => {
      it('should DELETE a genre', (done) => {
        async.waterfall(
          [
            function createGenre(next) {
              const newGenre = new Genre({
                title: 'Jazz',
                color: '#FF0000',
              });
              newGenre.save((err, genre) => {
                if (err) return next(err);
                let id = genre._id;
                next(null, id);
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
                  let genreObj = {
                    token: response.token,
                    genreId: id,
                  };
                  next(null, genreObj);
                });
            },
            function consumeAdminRoute(genreObj, next) {
              let genre = {
                _id: genreObj.genreId,
              };
              chai
                .request(app)
                .delete('/genres/delete')
                .set('Authorization', genreObj.token)
                .send(genre)
                .end((err, res) => {
                  res.should.have.status(200);
                  res.body.should.be.a('object');
                  res.body.should.have.property('success');
                  res.body.should.have.property('message');
                  res.body.should.have.property('success').eql(true);
                  res.body.should.have.property('message').eql('Genre has been removed.');
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
});
