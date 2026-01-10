const express = require("express");
const dotenv = require("dotenv");
dotenv.config();
const session=require("express-session");
const rateLimit = require("express-rate-limit");
const cors = require("cors");
const path = require("path");
const userRouter = require("./routes/userRoutes");
const adminRouter = require("./routes/adminRoutes"); 

const app = express();

const allowedOrigins =
  process.env.NODE_ENV === "production"
    ? [process.env.FRONTEND_URL]
    : ["http://localhost:3000", "http://localhost:3001", "http://localhost:3002"];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({extended:true}));

app.use(session({
  secret:process.env.SESSION_SECRET || "mycustomsessionkey",
  resave:false,
  saveUninitialized:false,
  cookie:{
    secure: process.env.NODE_ENV === 'production',          // Use secure cookies in production
    httpOnly: true,                                         // Prevent XSS attacks
    maxAge: 24 * 60 * 60 * 1000,                            // 24 hours session timeout
    sameSite: 'none'                                          // Prevent CSRF attacks
  }
}))

app.use("/user", userRouter);
app.use("/admin", adminRouter);

module.exports = app;

