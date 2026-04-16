const { adminSessionCookieOptions } = require("../config/sessionCookie");
const {
  sendEmail,
  sendStatusUpdateEmail,
  sendStatusToTechinician,
} = require("../utils/email");
const { appendToSheet, getAllComplaints, updateComplaintStatus } = require("../utils/sheet");
// const {v4: uuid} = require("uuid");
const { getDashboardStats } = require("../utils/stats");
const {uploadToCloudinary} =require("../services/uploadService")


function isCloudinaryConfigured() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );
}

const submitForm = async (req, res) => {

  try {

    const { natureOfComplaint, department, roomNo, emailId,dsrNo} =req.body;
    
    let imageUrl = null;

    if (req.file) {
      if (!isCloudinaryConfigured()) {
        console.warn(
          "Complaint submit: image received but CLOUDINARY_* env vars are missing; saving complaint without image URL."
        );
      } else {
        try {
          imageUrl = await uploadToCloudinary(req.file.buffer);
        } catch (uploadErr) {
          console.error("Cloudinary upload failed:", uploadErr);
          return res.status(500).json({
            success: false,
            errors:
              "Image upload failed. Check Cloudinary credentials in .env or try again without an image.",
          });
        }
      }
    }

    console.log("Image url:-",imageUrl)

    const allComplaints = await getAllComplaints();
    
    let complaintId;

    if (allComplaints.length === 0) {
      complaintId = "PICT-MNTC-1";            
    } else {
      const lastComplaint = allComplaints[allComplaints.length - 1];
      const lastId = lastComplaint.complaintId; // ex: "C7"
      const lastNum = parseInt(lastId.replace("PICT-MNTC-", ""), 10);
      complaintId = `PICT-MNTC-${lastNum + 1}`; // ex: C8
    }



    await appendToSheet({complaintId,natureOfComplaint, department, roomNo, emailId,dsrNo,imageUrl});

    let emailSent = false;
    try {
      await sendEmail({ complaintId, emailId, department, natureOfComplaint, roomNo, imageUrl });
      emailSent = true;
    } catch (emailErr) {
      // Details logged in utils/email.js (Brevo API)
      console.error(
        "Admin notification email failed (complaint was still saved):",
        emailErr?.message || emailErr
      );
    }

    res.status(200).json({ 
      success: true,
      message: "Complaint submitted successfully!",
      data: {
        complaintId,
        department,
        roomNo,
        submittedAt: new Date().toISOString(),
        dsrNo,
        imageUrl,
        emailSent,
      }
    });
    
  } catch (errors) {
    console.error("Error submitting complaint:", errors);
    
    if (errors.code === 'ENOENT') {
      return res.status(500).json({ 
        success: false,
        errors: "Configuration error: Missing credentials file"
      });
    }
    
    if (
      errors.code === "EAUTH" ||
      errors.code === "EBREVO" ||
      errors.code === "EMISSING"
    ) {
      return res.status(500).json({
        success: false,
        errors: "Email service configuration error (check Brevo API key and sender)",
      });
    }
    
    res.status(500).json({ 
      success: false,
      errors: "Failed to submit complaint. Please try again later."
    });
  }
};

const checkAdminAuth = (req, res) => {
  res.json({ isAdmin: Boolean(req.session && req.session.isAdmin) });
};

const adminlogin = async (req, res) => {
  const { password } = req.body;
  
  if (password === process.env.ADMIN_PASSWORD) {
    req.session.isAdmin = true;
    console.log("session id:",req.sessionID);

    return res.json({
      success: true,
      message: "Admin login successful"
    });
  }

  return res.status(401).json({
    success: false,
    message: "Invalid password"
  });
};

const adminLogout = async (req, res) => {
  try {
    req.session = null; // Clears the session cookie

    const cookieOpts = adminSessionCookieOptions();
    res.clearCookie("admin-session", {
      path: "/",
      httpOnly: cookieOpts.httpOnly,
      secure: cookieOpts.secure,
      sameSite: cookieOpts.sameSite,
    });

    return res.json({
      success: true,
      message: "Logout Successfully!"
    });
  } catch (error) {
    console.error("Admin logout failed:", error);
    res.status(500).json({
      success: false,
      message: "Failed to logout"
    });
  }
};


// Get all complaints for admin management
const getAllComplaintsForAdmin = async (req, res) => {
  try {
    const complaints = await getAllComplaints();
    res.json({
      success: true,
      data: complaints
    });
  } catch (error) {
    console.error("Error fetching complaints:", error);
    res.status(500).json({
      success: false,
      errors: "Failed to fetch complaints"
    });
  }
};

// Update complaint status
const updateComplaintStatusController = async (req, res) => {
  try {
    const { rowIndex, status, technician } = req.body;
    
    if (!rowIndex || !status) {
      return res.status(400).json({
        success: false,
        errors: "Row index and status are required"
      });
    }

    // First, get the current complaint data to get the old status and email
    const complaints = await getAllComplaints();
    const complaint = complaints.find(c => c.rowIndex === rowIndex);
    
    if (!complaint) {
      return res.status(404).json({
        success: false,
        errors: "Complaint not found"
      });
    }

    const oldStatus = complaint.status;
    const updatedAt = new Date().toLocaleString();

    let attendedOn = "";
    let resolvedOn = "";

    // Set appropriate timestamps based on status
    if (status === "In-progress") {
      attendedOn = updatedAt;
    } else if (status === "Resolved") {
      resolvedOn = updatedAt;
    }

    // Update the complaint in the sheet
    await updateComplaintStatus(rowIndex, status, attendedOn, resolvedOn);

    // Send email notification to the complainant
    try {
      await sendStatusUpdateEmail({
        emailId: complaint.emailId,
        complaintId: complaint.complaintId,
        department: complaint.department,
        natureOfComplaint: complaint.natureOfComplaint,
        roomNo: complaint.roomNo,
        oldStatus: oldStatus,
        newStatus: status,
        technician: technician || '',
        updatedAt: updatedAt
      });

      await sendStatusToTechinician({
        emailId: complaint.emailId,
        complaintId: complaint.complaintId,
        department: complaint.department,
        natureOfComplaint: complaint.natureOfComplaint,
        roomNo: complaint.roomNo,
        technician:technician
      });
      
    } catch (emailError) {
      console.error("Failed to send status update email:", emailError);
      // Don't fail the entire request if email fails
    }

    res.json({
      success: true,
      message: "Complaint status updated successfully and notification sent"
    });
  } catch (error) {
    console.error("Error updating complaint status:", error);
    res.status(500).json({
      success: false,
      errors: "Failed to update complaint status"
    });
  }
};

module.exports = {
  submitForm,
  checkAdminAuth,
  adminlogin,
  adminLogout,
  getAllComplaintsForAdmin,
  updateComplaintStatusController,
};

