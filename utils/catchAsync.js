module.exports = (fn) => {
  return (err, res, next) => {
    fn(err, res, next).catch(next);
  };
};
