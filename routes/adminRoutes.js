const {
  checkAdminAuth,
  adminlogin,
  adminLogout,
  getAllComplaintsForAdmin,
  updateComplaintStatusController,
} = require("../controllers/controllers");

const express = require('express');
const adminRouter = express.Router();
const verifyAdmin = require('../middleware/verifyAdmin');


adminRouter.get("/check-auth", checkAdminAuth);
adminRouter.get("/api/complaints", verifyAdmin, getAllComplaintsForAdmin);
adminRouter.post("/update-status", verifyAdmin, updateComplaintStatusController);
adminRouter.post("/login", adminlogin);
adminRouter.post("/logout",verifyAdmin, adminLogout);

module.exports = adminRouter;



