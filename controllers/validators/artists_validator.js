const createArtistValidator = async (req, res, next) => {
  if (!req.body.title) {
    res.json({
      success: false,
      message: 'No artist title was provided.',
    });
  } else {
    next();
  }
};

module.exports = {
  createArtistValidator: createArtistValidator,
};
