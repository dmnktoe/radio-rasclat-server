const createShowValidator = async (req, res, next) => {
  if (!req.body.title) {
    res.json({
      success: false,
      message: 'No show title was provided.',
    });
  } else {
    if (!req.body.description) {
      res.json({
        success: false,
        message: 'No show description was provided.',
      });
    } else {
      next();
    }
  }
};

module.exports = {
  createShowValidator: createShowValidator,
};
