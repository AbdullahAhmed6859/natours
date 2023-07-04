const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const sendEmail = require('../utils/email');

// takes object id and returns the token to send
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

// creates the token and sends it as response
const createSendToken = (user, statusCode, res, sendData) => {
  // generate token
  const token = signToken(user._id);

  let cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true
  };
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  let jsonResponse = {
    status: 'success',
    token
  };
  if (sendData) jsonResponse.data = { user };

  res.cookie('jwt', token, cookieOptions);
  res.status(statusCode).json(jsonResponse);
};

// signup the user using minimal details and send a token for the user to use the website
exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm
  });

  createSendToken(newUser, 201, res, true);
});

// send a token for the user to use the website
exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError('Please provide an email and password', 400));
  }

  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.isPasswordCorrect(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }

  createSendToken(user, 200, res, false);
});

// function called to protect routes which require a logged in user
exports.protect = catchAsync(async (req, res, next) => {
  let token;

  // filter out the jwt
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  // cause an error if the token is not present
  if (!token) {
    return next(
      new AppError('You are not logged in! Plese log in to get Access', 401)
    );
  }

  // hash the token
  const decodedJWT = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  const currentUser = await User.findById(decodedJWT.id);

  if (!currentUser) {
    return next(
      new AppError('The User belonging to this token no longer Exists.', 401)
    );
  }
  // iat is the time stamp for issued at
  if (await currentUser.changedPasswordAfter(decodedJWT.iat)) {
    return next(
      new AppError('User recently changed their password! Please log in again.')
    );
  }

  req.user = currentUser;
  next();
});

// used to restrict routes to specific admin roles
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    }
    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // find user using the email address
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('There is no user with that email', 404));
  }

  //create a new random reset token
  const resetToken = user.createPasswordResetToken();

  await user.save({ validateBeforeSave: false });

  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/resetPassword/${resetToken}`;

  const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to ${resetURL}.\nIf your didn't forget thr password, please ignore this email`;
  try {
    await sendEmail({
      email: user.email,
      subject: 'Your Password reser token (valid for 10 mins)',
      message
    });

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email'
    });
  } catch (err) {
    user.createPasswordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(new AppError('Email could not be sent', 500));
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // hash the token from the parameter
  const hashedToked = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  // find user with the same hash
  const user = await User.findOne({
    passwordResetToken: hashedToked,
    passwordResetExpires: { $gt: Date.now() }
  });

  if (!user) {
    return next(
      new AppError('Password reset token is invalid or has expired', 400)
    );
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  createSendToken(user, 200, res, false);
});

exports.updateMyPassword = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id).select('+password');

  if (!(await user.correctPassword(req.body.password, user.password))) {
    return next(new AppError('Your current password is incorrect', 401));
  }

  user.password = req.body.passwordNew;
  user.passwordConfirm = req.body.passwordNew;
  await user.save();

  createSendToken(user, 200, res, false);
});
