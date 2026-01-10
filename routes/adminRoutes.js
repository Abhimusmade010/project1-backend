const { dashboard, adminlogin, adminLogout, getAllComplaintsForAdmin, updateComplaintStatusController, complaintsManagementPage } = require('../controllers/controllers');

const express = require('express');
const adminRouter = express.Router();
const verifyAdmin = require('../middleware/verifyAdmin');

// Serve login page

// adminRouter.get("/login", (req, res) => {
//   if (req.session?.isAdmin) {
//     return res.json("Success!!");
//   }
  
// });

//useless routes
// adminRouter.get("/dashboard-stats", verifyAdmin, dashboard);
// adminRouter.get("/complaints", verifyAdmin, complaintsManagementPage);

adminRouter.get("/api/complaints", verifyAdmin, getAllComplaintsForAdmin);
adminRouter.post("/update-status", verifyAdmin, updateComplaintStatusController);
adminRouter.post("/login", adminlogin);
adminRouter.get("/logout",verifyAdmin, adminLogout);

module.exports = adminRouter;