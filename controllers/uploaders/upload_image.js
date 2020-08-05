const moment = require('moment');
const sharp = require('sharp');
const aws = require('aws-sdk');
const fs = require('fs');
const Sentry = require('@sentry/node');
const slug = require('limax');

const resizeImages = async (req, res, next) => {
  let filePath;

  if (req.file) {
    filePath = req.file.path;
  } else {
    if (req.files) {
      filePath = req.files['image'][0].path;
    } else {
      return next();
    }
  }

  let buffer;

  try {
    buffer = await sharp(filePath).resize(1000).toFormat('jpeg').jpeg({ quality: 80 }).toBuffer();
  } catch (err) {
    Sentry.captureException(err);
  }

  if (!buffer) {
    res.json({
      success: false,
      message: 'Image resizing went wrong. please view log files!',
    });
  }

  fs.writeFile(filePath, buffer, function (err, result) {
    if (err) {
      Sentry.captureException(err);
      res.json({
        success: false,
        message: 'Image resize saving went wrong. please view log files!',
      });
    }
    next();
  });
};

const uploadImages = (req, res, next) => {
  let filePath;
  let fileName;

  if (req.file) {
    filePath = req.file.path;
    fileName = req.file.originalname;
  } else {
    if (req.files) {
      filePath = req.files['image'][0].path;
      fileName = req.files['image'][0].originalname;
    } else {
      return next();
    }
  }

  aws.config.setPromisesDependency();
  aws.config.update({
    accessKeyId: process.env.WASABI_KEY,
    secretAccessKey: process.env.WASABI_KEY_SECRET,
    region: process.env.WASABI_REGION,
  });

  const ep = new aws.Endpoint('s3.wasabisys.com');
  const s3 = new aws.S3({ endpoint: ep });

  fileName = fileName.replace(/\..+$/, '');
  fileName = `${fileName}.jpg`;

  let params = {
    ACL: 'public-read',
    Bucket: process.env.WASABI_UPLOAD_CONTAINER,
    Body: fs.createReadStream(filePath),
    Key: `${moment(new Date()).format('YYYYMMDD')}/images/${slug(fileName, {
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
      fs.unlinkSync(filePath); // Empty temp folder
      req.body.image = data.Location;
      next();
    }
  });
};

module.exports = {
  uploadImages: uploadImages,
  resizeImages: resizeImages,
};
