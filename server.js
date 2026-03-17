const express = require("express");
const path = require("path");
const rateLimit = require("express-rate-limit");
const PORT = process.env.PORT || 3000 ;
const app = require("./index");



// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API info endpoint
app.get("/api", (req, res) => {
  res.json({
    success: true,
    message: "Hardware Complaint Management System API",
    endpoints: {
      user: "/user",
      admin: "/admin",
      health: "/health"
    }
  });
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,     // 15 minutes
  max: 100,                     // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: "Too many requests from this IP, please try again later."
  }
});

// Apply to all API routes  limits everything 
// app.use(apiLimiter);

app.use("/admin", apiLimiter);
app.use("/user", apiLimiter);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Admin login: http://localhost:${PORT}/admin/login`);
});

