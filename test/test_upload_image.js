const imageController = require('../controllers/uploaders/upload_image');

let chai = require('chai');
let chaiHttp = require('chai-http');
let should = chai.should();
let async = require('async');
chai.use(chaiHttp);

const Sentry = require('@sentry/node');
const jest = require('jest-mock');
const sizeOf = require('image-size');

/*describe("Image upload controller", function() {
  it('should resize an image', async () =>  {
    let sharp;
    let req = {
      file: {
        path: __dirname + '/files/testImgFile.jpg'
      }
    };
    let res = {
      sendCalledWith: '',
      send: function(arg) {
        this.sendCalledWith = arg;
      },
      json: function(err){
        console.log("\n : " + err);
      },
      status: function(s) {this.statusCode = s; return this;}
    };
    let next = jest.fn();

    try {
      sharp = await imageController.resizeImages(req, res, next);
      sizeOf(__dirname + '/files/testImgFile.jpg', function (err, dimensions) {
        console.log(dimensions.width, dimensions.height);
      });
    } catch (e) {
      Sentry.captureException(e);
    }
  });
});*/
