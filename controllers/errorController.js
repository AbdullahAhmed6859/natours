const AppError = require('../utils/appError');

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
  const message = err.message;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
  const value = err.message.match(/(["'])(\\?.)*?\1/)[0];
  const message = `Duplicate field value: ${value}, Please use another value`;
  return new AppError(message, 400);
};

const handleJWTError = () =>
  new AppError('Invalid Token Please Log in Again', 401);

const handleJWTExpiredError = () =>
  new AppError('Your Token has expired! Please log in again', 401);

const sendErrorDev = (err, req, res) => {
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack
    });
  } else {
    return res
      .status(err.statusCode)
      .render('error', { title: 'Something went Wrong', message: err.message });
  }
};

const sendErrorProd = (err, req, res) => {
  if (req.originalUrl.startsWith('/api')) {
    if (err.isOperational) {
      return res.status(err.statusCode).render('error', {
        title: 'Something went Wrong',
        message: err.message
      });
    } else {
      // console.error('ERROR', err);
      return res.status(500).json({
        status: 'error',
        message: 'Something went very wrong!'
      });
    }
  } else {
    return res.status(err.statusCode).render('error', {
      title: 'Something went Wrong',
      message: 'Please Try Again Later'
    });
  }
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
    console.log(err.name);
  } else if (process.env.NODE_ENV === 'production') {
    let error;

    if (err.name === 'CastError') error = handleCastErrorDB(err);
    if (err.name === 'ValidationError') error = handleValidationErrorDB(err);
    if (err.code === 11000) error = handleDuplicateFieldsDB(err);
    if (err.name === 'JsonWebTokenError') error = handleJWTError();
    if (err.name === 'TokenExpiredError') error = handleJWTExpiredError();

    if (!error) error = new AppError(err.message, err.statusCode);

    sendErrorProd(error, req, res);
  }
};
