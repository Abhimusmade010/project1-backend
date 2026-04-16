const jwt = require("jsonwebtoken");

const verifyAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    if (process.env.NODE_ENV === "production") {
      console.warn("❌ Admin Verification Failed: Missing or malformed Authorization header");
    }
    return res.status(401).json({
      success: false,
      message: "Unauthorized: Missing token"
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.SESSION_SECRET || "default_secret_key");
    if (decoded && decoded.isAdmin) {
      req.admin = decoded; // Attach decoded info to request
      return next();
    }
    throw new Error("Invalid token payload");
  } catch (error) {
    if (process.env.NODE_ENV === "production") {
      console.warn("❌ Admin Verification Failed: Invalid token", error.message);
    }
    return res.status(401).json({
      success: false,
      message: "Unauthorized: Invalid token"
    });
  }
};

module.exports = verifyAdmin;
