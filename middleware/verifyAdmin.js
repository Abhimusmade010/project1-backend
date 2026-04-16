const verifyAdmin = (req, res, next) => {
  if (req.session && req.session.isAdmin) {
    return next();
  }
  
  if (process.env.NODE_ENV === "production" || true) {
    console.warn("❌ Admin Verification Failed");
    console.warn("Session data:", JSON.stringify(req.session));
    console.warn("Cookies present in header:", !!req.headers.cookie);
  }

  return res.status(401).json({
    success: false,
    message: "Unauthorized"
  });
};

module.exports = verifyAdmin;
