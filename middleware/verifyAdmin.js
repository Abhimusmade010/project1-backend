

const verifyAdmin = (req, res, next) => {
  if (req.session && req.session.isAdmin) {
    return next();
  }

  return res.status(401).json({
    success: false,
    message: "Unauthorized"
  });
};

module.exports = verifyAdmin;

