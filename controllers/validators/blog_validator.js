const createBlogValidator = async (req, res, next) => {
  if (!req.body.title) {
    res.json({
      success: false,
      message: 'No blog post title was provided.',
    });
  } else {
    if (!req.body.description) {
      res.json({
        success: false,
        message: 'No blog post description was provided.',
      });
    } else {
      next();
    }
  }
};

module.exports = {
  createBlogValidator: createBlogValidator,
};
