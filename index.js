const express = require("express");
const dotenv = require("dotenv");
dotenv.config();
const session=require("express-session");
const rateLimit = require("express-rate-limit");
const cors = require("cors");
const path = require("path");
const userRouter = require("./routes/userRoutes");
const adminRouter = require("./routes/adminRoutes"); 

const isProd=process.env.NODE_ENV==="development";
// const session = require("express-session");
const FileStore = require("session-file-store")(session);

const app = express();

app.use(
  cors({
    // origin: process.env.FRONTEND_URL,
    origin: "http://localhost:3002",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);


app.options("*", cors());

app.use(express.json());
app.use(express.urlencoded({extended:true}));


app.use(
  session({
    name: "admin-session",
    store: new FileStore({
      path: "./sessions",
      retries: 0,
    }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: isProd,                         //  MUST be false for HTTP only
      sameSite: isProd ? "none" : "lax",      // NOT "none" for HTTP
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);



app.use("/user", userRouter);
app.use("/admin", adminRouter);

module.exports = app;

