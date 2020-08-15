const app = require('../index');
const fs = require('fs');
const Project = require('../models/Project');

let chai = require('chai');
let chaiHttp = require('chai-http');
let should = chai.should();
let async = require('async');
let faker = require('faker');
chai.use(chaiHttp);

const algoliasearch = require('algoliasearch');
const client = algoliasearch(process.env.ALGOLIA_APP_ID, process.env.ALGOLIA_ADMIN_KEY);
const index = client.initIndex(process.env.ALGOLIA_INDEX_PROJECTS);

const Sentry = require('@sentry/node');

describe('Projects', () => {
  beforeEach((done) => {
    Project.deleteMany({}, (err) => {
      done();
    });
  });
  describe('Public routes', function () {
    describe('/GET projects', () => {
      it('should GET all the projects', (done) => {
        chai
          .request(app)
          .get('/projects')
          .end((err, res) => {
            res.should.have.status(200);
            res.body.should.be.a('array');
            res.body.length.should.be.eql(0);
            done();
          });
      });
    });
    describe('/GET projects/project/:id', () => {
      it('should GET a project by the given id', (done) => {
        const newProject = new Project({
          title: faker.name.findName(),
          description: faker.lorem.sentence(),
          timeStart: Date.now(),
          timeEnd: Date.now(),
        });
        newProject.save((err, project) => {
          chai
            .request(app)
            .get('/projects/project/' + project.id)
            .end((err, res) => {
              res.should.have.status(200);
              res.body.should.be.a('object');
              res.body.should.have.property('title');
              res.body.should.have.property('_id').eql(project.id);
              done();
            });
        });
      });
      it('should display that the project was not found', (done) => {
        chai
          .request(app)
          .get('/projects/project/' + '0a00a0000aa0aa0000a0000a')
          .end((err, res) => {
            res.should.have.status(200);
            res.body.should.be.a('object');
            res.body.should.have.property('success');
            res.body.should.have.property('message');
            res.body.should.have.property('success').eql(false);
            res.body.should.have.property('message').eql('Project not found.');
            done();
          });
      });
    });
  });

  describe('Admin routes', () => {
    describe('/POST projects', () => {
      it('should not POST a project without title field', (done) => {
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
              let project = {
                image: '',
              };
              chai
                .request(app)
                .post('/projects')
                .set('Authorization', token)
                .send(project)
                .end((err, res) => {
                  res.should.have.status(200);
                  res.body.should.be.a('object');
                  res.body.should.have.property('success');
                  res.body.should.have.property('message');
                  res.body.should.have.property('success').eql(false);
                  res.body.should.have.property('message').eql('No project title was provided.');
                  next();
                });
            },
          ],
          function finish(err, result) {
            done(err);
          }
        );
      });
      it('should not POST a project without description field', (done) => {
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
              let project = {
                title: faker.name.findName(),
                image: '',
              };
              chai
                .request(app)
                .post('/projects')
                .set('Authorization', token)
                .send(project)
                .end((err, res) => {
                  res.should.have.status(200);
                  res.body.should.be.a('object');
                  res.body.should.have.property('success');
                  res.body.should.have.property('message');
                  res.body.should.have.property('success').eql(false);
                  res.body.should.have.property('message').eql('No project description was provided.');
                  next();
                });
            },
          ],
          function finish(err, result) {
            done(err);
          }
        );
      });
      it('should POST a project', (done) => {
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
              let project = {
                title: faker.name.findName(),
                description: faker.lorem.sentence(),
                timeStart: Date.now(),
                timeEnd: Date.now(),
              };
              chai
                .request(app)
                .post('/projects')
                .set('Authorization', token)
                .send(project)
                .end((err, res) => {
                  res.should.have.status(200);
                  res.body.should.be.a('object');
                  res.body.should.have.property('success');
                  res.body.should.have.property('message');
                  res.body.should.have.property('success').eql(true);
                  res.body.should.have.property('message').eql('Project added.');
                  next();
                });
            },
          ],
          function finish(err, result) {
            done(err);
          }
        );
      });
      it('should POST a project (with image)', (done) => {
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
              let project = {
                title: faker.name.findName(),
                description: faker.lorem.sentence(),
                timeStart: Date.now(),
                timeEnd: Date.now(),
              };
              chai
                .request(app)
                .post('/projects')
                .set('Authorization', token)
                .field('title', project.title)
                .field('description', project.description)
                .field('timeStart', project.timeStart)
                .field('timeEnd', project.timeEnd)
                .attach('image', fs.readFileSync(__dirname + '/files/testImgFile.jpg'), 'testImgFile.jpg')
                .end((err, res) => {
                  res.should.have.status(200);
                  res.body.should.be.a('object');
                  res.body.should.have.property('success');
                  res.body.should.have.property('message');
                  res.body.should.have.property('success').eql(true);
                  res.body.should.have.property('message').eql('Project added.');
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
    describe('/DELETE projects', () => {
      it('should DELETE a project', (done) => {
        async.waterfall(
          [
            function createProject(next) {
              const newProject = new Project({
                title: faker.name.findName(),
                description: faker.lorem.sentence(),
                timeStart: Date.now(),
                timeEnd: Date.now(),
              });
              newProject.save((err, project) => {
                if (err) return next(err);
                let id = project._id;
                index.addObject(project).then(({ objectID }) => {
                  Project.findOneAndUpdate(
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
                    .then((project) => {
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
                  let projectObj = {
                    token: response.token,
                    projectId: id,
                  };
                  next(null, projectObj);
                });
            },
            function consumeAdminRoute(projectObj, next) {
              let project = {
                _id: projectObj.projectId,
              };
              chai
                .request(app)
                .delete('/projects/delete')
                .set('Authorization', projectObj.token)
                .send(project)
                .end((err, res) => {
                  res.should.have.status(200);
                  res.body.should.be.a('object');
                  res.body.should.have.property('success');
                  res.body.should.have.property('message');
                  res.body.should.have.property('success').eql(true);
                  res.body.should.have.property('message').eql('Project has been removed.');
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
    client.deleteIndex(process.env.ALGOLIA_INDEX_PROJECTS, (err, content) => {
      if (err) throw err;
    });
    done();
  });
});
