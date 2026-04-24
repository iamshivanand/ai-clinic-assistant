const { AppError } = require('./errorHandler');

const validate = (schema) => (req, res, next) => {
  try {
    schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    next();
  } catch (error) {
    const details = error.errors.map(err => ({
      path: err.path.join('.'),
      message: err.message
    }));
    return next(new AppError('Validation Failed', 400, 'VALIDATION_ERROR', details));
  }
};

module.exports = validate;
