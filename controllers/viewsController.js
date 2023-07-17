const Tour = require('../models/tourModel');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

mapContentPolicy = [
  'Content-Security-Policy',
  `default-src 'self' https://*.mapbox.com ;base-uri 'self';block-all-mixed-content;font-src 'self' https: data:;frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src https://cdnjs.cloudflare.com https://api.mapbox.com 'self' blob: ;script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests;`
];

axiosContentPolicy = [
  'Content-Security-Policy',
  `default-src 'self' https://cdnjs.cloudflare.com/ajax/libs/axios/1.4.0/axios.min.js ;base-uri 'self';block-all-mixed-content;font-src 'self' https: data:;frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src https://cdnjs.cloudflare.com https://api.mapbox.com 'self' blob: ;script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests;`
];

exports.getOverview = catchAsync(async (req, res, next) => {
  const tours = await Tour.find();
  res
    .status(200)
    // .set(...axiosContentPolicy)
    .render('overview', {
      title: 'All Tours',
      tours
    });
});

exports.getTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findOne({ slug: req.params.slug }).populate({
    path: 'reviews',
    fields: ' review rating user'
  });

  if (!tour) return next(new AppError('Tour not found', 404));

  res
    .status(200)
    // .set(...axiosContentPolicy)
    .set(...mapContentPolicy)
    .render('tour', {
      title: tour.name,
      tour
    });
});

exports.getLoginForm = (req, res) => {
  res
    .status(200)
    // .set(...axiosContentPolicy)
    .render('login', {
      title: 'Log in to your account'
    });
};

exports.getAccount = (req, res) => {
  res
    .status(200)
    // .set(...axiosContentPolicy)
    .render('account', { title: 'Your Account' });
};
