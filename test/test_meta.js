const app = require('../index');

let chai = require('chai');
let chaiHttp = require('chai-http');
let should = chai.should();
let async = require('async');

chai.use(chaiHttp);

describe('Meta', () => {
  describe('/GET meta/live-info', () => {
    it('should GET the radio live info', (done) => {
      chai
        .request(app)
        .get('/meta/live-info')
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.a('object');
          done();
        });
    });
  });
  describe('Public routes', function () {
    describe('/GET meta/track/previous', () => {
      it('should GET the previous track', (done) => {
        chai
          .request(app)
          .get('/meta/track/previous')
          .end((err, res) => {
            res.should.have.status(200);
            res.body.should.be.a('object');
            done();
          });
      });
    });
    /*describe('/GET meta/track/current', () => {
      it('should GET the current track', done => {
        chai
          .request(app)
          .get('/meta/track/current')
          .end((err, res) => {
            res.should.have.status(200);
            res.body.should.be.a('object');
            done();
          });
      });
    });*/
    describe('/GET meta/track/next', () => {
      it('should GET the next track', (done) => {
        chai
          .request(app)
          .get('/meta/track/next')
          .end((err, res) => {
            res.should.have.status(200);
            res.body.should.be.a('object');
            done();
          });
      });
    });
    describe('/GET meta/shows/previous', () => {
      it('should GET the previous shows', (done) => {
        chai
          .request(app)
          .get('/meta/shows/previous')
          .end((err, res) => {
            res.should.have.status(200);
            res.body.should.be.a('array');
            done();
          });
      });
    });
    /*describe('/GET meta/shows/current', () => {
      it('should GET the current shows', done => {
        chai
          .request(app)
          .get('/meta/shows/current')
          .end((err, res) => {
            res.should.have.status(200);
            res.body.should.be.a('object');
            done();
          });
      });
    });*/
    describe('/GET meta/shows/next', () => {
      it('should GET the next shows', (done) => {
        chai
          .request(app)
          .get('/meta/shows/next')
          .end((err, res) => {
            res.should.have.status(200);
            res.body.should.be.a('array');
            done();
          });
      });
    });
    describe('/GET meta/schedule', () => {
      it('should GET the radio schedule', (done) => {
        chai
          .request(app)
          .get('/meta/schedule')
          .end((err, res) => {
            res.should.have.status(200);
            res.body.should.be.a('object');
            done();
          });
      });
    });
  });
});
