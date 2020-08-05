const moment = require('moment');
const aws = require('aws-sdk');
const fs = require('fs');
const Sentry = require('@sentry/node');
const slug = require('limax');

const uploadAudio = (req, res, next) => {
  if (req.files) {
    if (req.files['audio']) {
      aws.config.setPromisesDependency();
      aws.config.update({
        accessKeyId: process.env.WASABI_KEY,
        secretAccessKey: process.env.WASABI_KEY_SECRET,
        region: process.env.WASABI_REGION,
      });

      const ep = new aws.Endpoint('s3.wasabisys.com');
      const s3 = new aws.S3({ endpoint: ep });

      let params = {
        ACL: 'public-read',
        Bucket: process.env.WASABI_UPLOAD_CONTAINER,
        Body: fs.createReadStream(req.files['audio'][0].path),
        Key: `${moment(new Date()).format('YYYYMMDD')}/audio/${slug(req.files['audio'][0].originalname, {
          custom: ['.', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'],
        })}`,
      };
      s3.upload(params, (err, data) => {
        if (err) {
          Sentry.captureException(err);
          res.json({
            success: false,
            message: 'An unknown error occurred while uploading media. Please try again.',
            error: err,
          });
        }
        if (data) {
          fs.unlinkSync(req.files['audio'][0].path); // Empty temp folder
          req.body.audio = data.Location;
          next();
        }
      });
    } else {
      return next();
    }
  } else {
    return next();
  }
};

module.exports = {
  uploadAudio: uploadAudio,
};
