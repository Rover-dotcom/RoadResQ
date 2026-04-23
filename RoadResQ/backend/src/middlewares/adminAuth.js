module.exports = (req, res, next) => {
  // Replace with JWT later
  const isAdmin = true;

  if (!isAdmin) {
    return res.status(403).json({ message: "Admin only" });
  }

  next();
};
