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

const app = express();
app.set('trust proxy', 1);
const isProd = process.env.NODE_ENV === "production";

if (isProd) {
  console.log("🚀 Production mode detected. Trust Proxy enabled.");
  console.log("Frontend URL configured as:", process.env.FRONTEND_URL);
}

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
      const f = frontendOrigin;
      const matched = f && o === f;
      
      if (!matched && isProd) {
        console.warn(`⚠️ CORS mismatch: Received [${o}] but expected [${f}]`);
      }
      
      if (matched) return callback(null, true);
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

