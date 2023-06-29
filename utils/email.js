const nodemailer = require('nodemailer');

const sendEmail = (options) => {
  const transport = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};
