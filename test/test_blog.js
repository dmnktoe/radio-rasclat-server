const app = require('../index');
const fs = require('fs');
const Blog = require('../models/Blog');

let chai = require('chai');
let chaiHttp = require('chai-http');
let should = chai.should();
let async = require('async');
let faker = require('faker');
chai.use(chaiHttp);

const algoliasearch = require('algoliasearch');
const client = algoliasearch(process.env.ALGOLIA_APP_ID, process.env.ALGOLIA_ADMIN_KEY);
const index = client.initIndex(process.env.ALGOLIA_INDEX_BLOG);

const Sentry = require('@sentry/node');

describe('Blog Posts', () => {
  beforeEach((done) => {
    Blog.deleteMany({}, (err) => {
      done();
    });
  });
  describe('Public routes', function () {
    describe('/GET blog/posts', () => {
      it('should GET all the blog posts', (done) => {
        chai
          .request(app)
          .get('/blog/posts')
          .end((err, res) => {
            res.should.have.status(200);
            res.body.should.be.a('array');
            res.body.length.should.be.eql(0);
            done();
          });
      });
    });
    describe('/GET blog/post/:id', () => {
      it('should GET a blog post by the given id', (done) => {
        const newBlogPost = new Blog({
          title: faker.name.findName(),
          description: faker.lorem.sentence(),
        });
        newBlogPost.save((err, blogPost) => {
          chai
            .request(app)
            .get('/blog/post/' + blogPost.id)
            .end((err, res) => {
              res.should.have.status(200);
              res.body.should.be.a('object');
              res.body.should.have.property('title');
              res.body.should.have.property('_id').eql(blogPost.id);
              done();
            });
        });
      });
      it('should display that the blog post was not found', (done) => {
        chai
          .request(app)
          .get('/blog/post/' + '0a00a0000aa0aa0000a0000a')
          .end((err, res) => {
            res.should.have.status(200);
            res.body.should.be.a('object');
            res.body.should.have.property('success');
            res.body.should.have.property('message');
            res.body.should.have.property('success').eql(false);
            res.body.should.have.property('message').eql('Blog post not found.');
            done();
          });
      });
    });
  });

  describe('Admin routes', () => {
    describe('/POST blog', () => {
      it('should not POST a blog post without title field', (done) => {
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
              let blogPost = {
                image: '',
              };
              chai
                .request(app)
                .post('/blog')
                .set('Authorization', token)
                .send(blogPost)
                .end((err, res) => {
                  res.should.have.status(200);
                  res.body.should.be.a('object');
                  res.body.should.have.property('success');
                  res.body.should.have.property('message');
                  res.body.should.have.property('success').eql(false);
                  res.body.should.have.property('message').eql('No blog post title was provided.');
                  next();
                });
            },
          ],
          function finish(err, result) {
            done(err);
          }
        );
      });
      it('should not POST a blog post without description field', (done) => {
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
              let blogPost = {
                title: faker.name.findName(),
                image: '',
              };
              chai
                .request(app)
                .post('/blog')
                .set('Authorization', token)
                .send(blogPost)
                .end((err, res) => {
                  res.should.have.status(200);
                  res.body.should.be.a('object');
                  res.body.should.have.property('success');
                  res.body.should.have.property('message');
                  res.body.should.have.property('success').eql(false);
                  res.body.should.have.property('message').eql('No blog post description was provided.');
                  next();
                });
            },
          ],
          function finish(err, result) {
            done(err);
          }
        );
      });
      it('should POST a blog post', (done) => {
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
              let blogPost = {
                title: faker.name.findName(),
                description: faker.lorem.sentence(),
              };
              chai
                .request(app)
                .post('/blog')
                .set('Authorization', token)
                .send(blogPost)
                .end((err, res) => {
                  res.should.have.status(200);
                  res.body.should.be.a('object');
                  res.body.should.have.property('success');
                  res.body.should.have.property('message');
                  res.body.should.have.property('success').eql(true);
                  res.body.should.have.property('message').eql('Blog post added.');
                  next();
                });
            },
          ],
          function finish(err, result) {
            done(err);
          }
        );
      });
      it('should POST a blog post (with image)', (done) => {
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
              let blogPost = {
                title: faker.name.findName(),
                description: faker.lorem.sentence(),
              };
              chai
                .request(app)
                .post('/blog')
                .set('Authorization', token)
                .field('title', blogPost.title)
                .field('description', blogPost.description)
                .attach('image', fs.readFileSync(__dirname + '/files/testImgFile.jpg'), 'testImgFile.jpg')
                .end((err, res) => {
                  res.should.have.status(200);
                  res.body.should.be.a('object');
                  res.body.should.have.property('success');
                  res.body.should.have.property('message');
                  res.body.should.have.property('success').eql(true);
                  res.body.should.have.property('message').eql('Blog post added.');
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
    describe('/DELETE blog', () => {
      it('should DELETE a blog post', (done) => {
        async.waterfall(
          [
            function createBlogPost(next) {
              const newBlogPost = new Blog({
                title: faker.name.findName(),
                description: faker.lorem.sentence(),
              });
              newBlogPost.save((err, blogPost) => {
                if (err) return next(err);
                let id = blogPost._id;
                index.addObject(blogPost).then(({ objectID }) => {
                  Blog.findOneAndUpdate(
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
                    .then((blogPost) => {
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
                  let blogPostObj = {
                    token: response.token,
                    blogPostId: id,
                  };
                  next(null, blogPostObj);
                });
            },
            function consumeAdminRoute(blogPostObj, next) {
              let blogPost = {
                _id: blogPostObj.blogPostId,
              };
              chai
                .request(app)
                .delete('/blog/delete')
                .set('Authorization', blogPostObj.token)
                .send(blogPost)
                .end((err, res) => {
                  res.should.have.status(200);
                  res.body.should.be.a('object');
                  res.body.should.have.property('success');
                  res.body.should.have.property('message');
                  res.body.should.have.property('success').eql(true);
                  res.body.should.have.property('message').eql('Blog post has been removed.');
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
    client.deleteIndex(process.env.ALGOLIA_INDEX_BLOG, (err, content) => {
      if (err) throw err;
    });
    done();
  });
});
