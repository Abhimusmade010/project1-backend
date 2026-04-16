const express = require("express");
const session = require("cookie-session");
const dotenv = require("dotenv");
dotenv.config();
const rateLimit = require("express-rate-limit");
const cors = require("cors");
const path = require("path");
const userRouter = require("./routes/userRoutes");
const adminRouter = require("./routes/adminRoutes");
const { adminSessionCookieOptions } = require("./config/sessionCookie");

const isProd = process.env.NODE_ENV === "production";

const app = express();

// app.use(
//   cors({
//     origin: process.env.FRONTEND_URL,
//     // origin: "http://localhost:3002",
//     credentials: true,
//     methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
//     allowedHeaders: ["Content-Type", "Authorization"],
//   })
// );
const normalizeOrigin = (u) => (u || "").trim().replace(/\/$/, "");
const frontendOrigin = normalizeOrigin(process.env.FRONTEND_URL);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      const o = normalizeOrigin(origin);
      if (frontendOrigin && o === frontendOrigin) return callback(null, true);
      if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin)) {
        return callback(null, true);
      }
      if (!isProd) return callback(null, true);
      return callback(null, false);
    },
    credentials: true,
  })
);


// app.options("*", cors());/

app.use(express.json());
app.use(express.urlencoded({extended:true}));


app.use(
  session({
    name: "admin-session",
    keys: [process.env.SESSION_SECRET || "default_secret_key"],
    ...adminSessionCookieOptions(),
  })
);



app.use("/user", userRouter);
app.use("/admin", adminRouter);

module.exports = app;

