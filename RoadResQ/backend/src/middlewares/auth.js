module.exports = (req, res, next) => {
  // Dummy auth for now
  req.user = { id: "123" };
  next();
};
