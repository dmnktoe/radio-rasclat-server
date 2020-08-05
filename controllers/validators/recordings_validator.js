const createRecordingValidator = async (req, res, next) => {
  if (!req.body.title) {
    res.json({
      success: false,
      message: 'No recording title was provided.',
    });
  } else {
    if (!req.body.artists) {
      res.json({
        success: false,
        message: 'No artist was given.',
      });
    } else {
      if (!req.body.genres) {
        res.json({
          success: false,
          message: 'No describing genre was given.',
        });
      } else {
        if (!req.body.timeStart) {
          res.json({
            success: false,
            message: 'No starting time was provided.',
          });
        } else {
          if (!req.body.timeEnd) {
            res.json({
              success: false,
              message: 'No ending time was provided.',
            });
          } else {
            if (!req.body.show) {
              res.json({
                success: false,
                message: 'No show was provided.',
              });
            } else {
              if (!req.files['audio']) {
                res.json({
                  success: false,
                  message: 'No audio file was uploaded.',
                });
              } else {
                if (!req.files['image']) {
                  res.json({
                    success: false,
                    message: 'No image was uploaded.',
                  });
                } else {
                  next();
                }
              }
            }
          }
        }
      }
    }
  }
};

module.exports = {
  createRecordingValidator: createRecordingValidator,
};
