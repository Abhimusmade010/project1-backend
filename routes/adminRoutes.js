const { dashboard, adminlogin, adminLogout, getAllComplaintsForAdmin, updateComplaintStatusController, complaintsManagementPage } = require('../controllers/controllers');

const express = require('express');
const adminRouter = express.Router();
const verifyAdmin = require('../middleware/verifyAdmin');


adminRouter.get("/api/complaints", verifyAdmin, getAllComplaintsForAdmin);
adminRouter.post("/update-status", verifyAdmin, updateComplaintStatusController);
adminRouter.post("/login", adminlogin);
adminRouter.post("/logout",verifyAdmin, adminLogout);


adminRouter.get("/check-auth", (req, res) => {
  if (req.session.isAdmin) {
    return res.json({ isAdmin: true });
  }
  return res.json({ isAdmin: false });
});



module.exports = adminRouter;



