const createProjectsValidator = async (req, res, next) => {
  if (!req.body.title) {
    res.json({
      success: false,
      message: 'No project title was provided.',
    });
  } else {
    if (!req.body.description) {
      res.json({
        success: false,
        message: 'No project description was provided.',
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
          next();
        }
      }
    }
  }
};

module.exports = {
  createProjectsValidator: createProjectsValidator,
};
