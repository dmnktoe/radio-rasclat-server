const app = require('../index');
const Show = require('../models/Show');

let chai = require('chai');
let chaiHttp = require('chai-http');
let should = chai.should();
let async = require('async');
let faker = require('faker');
chai.use(chaiHttp);

const Sentry = require('@sentry/node');

describe('Authentication', () => {
  describe('Admin routes', () => {
    describe('Test JWT Middleware controller', () => {
      it('should return a 401 error', (done) => {
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
              let tokenEmpty = '';
              let show = {
                title: faker.name.findName(),
                description: faker.lorem.sentence(),
              };
              chai
                .request(app)
                .post('/shows')
                .set('Authorization', tokenEmpty)
                .send(show)
                .end((err, res) => {
                  res.should.have.status(401);
                  res.body.should.be.a('object');
                  res.body.should.have.property('success');
                  res.body.should.have.property('message');
                  res.body.should.have.property('success').eql(false);
                  res.body.should.have
                    .property('message')
                    .eql('Es konnte kein Authentifizierungs-Token gefunden werden.');
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
    describe('Test JWT Middleware controller', () => {
      it('should return a 403 error', (done) => {
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
              let tokenEmpty = faker.random.number();
              let show = {
                title: faker.name.findName(),
                description: faker.lorem.sentence(),
              };
              chai
                .request(app)
                .post('/shows')
                .set('Authorization', tokenEmpty)
                .send(show)
                .end((err, res) => {
                  res.should.have.status(403);
                  res.body.should.be.a('object');
                  res.body.should.have.property('success');
                  res.body.should.have.property('message');
                  res.body.should.have.property('success').eql(false);
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
