const { sendEmail, sendStatusUpdateEmail } = require("../utils/nodemailer");
const { appendToSheet, getAllComplaints, updateComplaintStatus } = require("../utils/sheet");
// const {v4: uuid} = require("uuid");
const { getDashboardStats } = require("../utils/stats");


const submitForm = async (req, res) => {
  try {

    const { natureOfComplaint, department, roomNo, emailId} =req.body;

    const allComplaints = await getAllComplaints();
    
    let complaintId;

    if (allComplaints.length === 0) {
      complaintId = "C1";            
    } else {
      const lastComplaint = allComplaints[allComplaints.length - 1];
      const lastId = lastComplaint.complaintId; // ex: "C7"
      const lastNum = parseInt(lastId.replace("C", ""), 10);
      complaintId = `C${lastNum + 1}`; // ex: C8
    }



    await appendToSheet({complaintId,natureOfComplaint, department, roomNo, emailId});
        await sendEmail({ complaintId,emailId,department,natureOfComplaint,roomNo});
    
    res.status(200).json({ 
      success: true,
      message: "Complaint submitted successfully!",
      data: {
        complaintId,
        department,
        roomNo,
        submittedAt: new Date().toISOString()
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
    
    if (errors.code === 'EAUTH') {
      return res.status(500).json({ 
        success: false,
        errors: "Email service configuration error"
      });
    }
    
    res.status(500).json({ 
      success: false,
      errors: "Failed to submit complaint. Please try again later."
    });
  }
};

const dashboard=async (req, res) => {
  try {
    const stats = await getDashboardStats();
    
    // Serve HTML dashboard page
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
          <title>Admin Dashboard</title>
          <style>
              body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: linear-gradient(135deg, #007bff 0%, #0056b3 100%); min-height: 100vh; }
              .dashboard-container { max-width: 1200px; margin: 0 auto; }
              .header { background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 8px 32px rgba(0, 123, 255, 0.15); border: 1px solid rgba(0, 123, 255, 0.1); }
              .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 30px; }
              .stat-card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 8px 32px rgba(0, 123, 255, 0.15); border: 1px solid rgba(0, 123, 255, 0.1); text-align: center; transition: transform 0.3s ease; }
              .stat-card:hover { transform: translateY(-4px); }
              .stat-number { font-size: 2.5em; font-weight: bold; color: #007bff; margin-bottom: 10px; }
              .stat-label { color: #495057; font-size: 1.1em; font-weight: 500; }
              .logout-btn { background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; text-decoration: none; display: inline-block; font-weight: 500; transition: transform 0.2s ease; }
              .logout-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(220, 53, 69, 0.3); }
              .department-stats { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 8px 32px rgba(0, 123, 255, 0.15); border: 1px solid rgba(0, 123, 255, 0.1); }
              .dept-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #dee2e6; }
              .dept-row:last-child { border-bottom: none; }
          </style>
      </head>
      <body>
          <div class="dashboard-container">
              <div class="header">
                  <h1 style="color: #007bff; margin-bottom: 10px;">PICT Hardware Complaint Dashboard</h1>
                  <p style="color: #6c757d; margin-bottom: 20px;">Pune Institute of Computer Technology</p>
                  <div style="display: flex; gap: 10px;">
                      <a href="/admin/complaints" style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; text-decoration: none; display: inline-block; font-weight: 500; transition: transform 0.2s ease;">Manage Complaints</a>
                  <a href="/admin/logout" class="logout-btn">Logout</a>
                  </div>
              </div>
              
              <div class="stats-grid">
                  <div class="stat-card">
                      <div class="stat-number">${stats.totalComplaints}</div>
                      <div class="stat-label">Total Complaints</div>
                  </div>
                  <div class="stat-card">
                      <div class="stat-number">${stats.pendingComplaints}</div>
                      <div class="stat-label">Pending</div>
                  </div>
                  <div class="stat-card">
                      <div class="stat-number">${stats.inProgressComplaints}</div>
                      <div class="stat-label">In Progress</div>
                  </div>
                  <div class="stat-card">
                      <div class="stat-number">${stats.resolvedComplaints}</div>
                      <div class="stat-label">Resolved</div>
                  </div>
              </div>
              
              <div class="department-stats">
                  <h2>Department-wise Statistics</h2>
                  ${Object.entries(stats.departmentWise).map(([dept, data]) => `
                      <div class="dept-row">
                          <strong>${dept}</strong>
                          <span>Total: ${data.total} | Pending: ${data.pending} | In Progress: ${data.inProgress} | Resolved: ${data.resolved}</span>
                      </div>
                  `).join('')}
              </div>
          </div>
      </body>
      </html>
    `);
  } catch (errors) {
    console.error("Dashboard error:", errors);
    return res.status(500).json({
      success: false, 
      errors: "Failed to load dashboard stats" 
    });
  }
};
const adminlogin=async (req,res)=>{
  const password=req.body.password;
  try {
    if (password === process.env.ADMIN_PASSWORD) {
      req.session.isAdmin = true;
      req.session.adminLoginTime = new Date().toISOString();
      return res.redirect('/admin/dashboard');
    }
    else{
      return res.status(401).json({
        success: false,
        message:"Invalid password"
      })
    }
}catch (errors) {
    console.error("Admin login failed:", errors);
    res.status(500).json({ 
      success: false,
      errors: "Failed to login as admin. Please try again."
    });
  }
}

const adminLogout = async (req, res) => {
  try {
    req.session.destroy((err) => {
      if (err) {
        console.error("Error destroying session:", err);
        return res.status(500).json({
          success: false,
          message: "Failed to logout"
        });
      }
      res.redirect('/admin/login');
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
    await updateComplaintStatus(rowIndex, status, attendedOn, resolvedOn, technician);

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

// Serve complaints management page
const complaintsManagementPage = async (req, res) => {
  try {
    const complaints = await getAllComplaints();
    
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
          <title>Complaints Management</title>
          <style>
              body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: linear-gradient(135deg, #007bff 0%, #0056b3 100%); min-height: 100vh; }
              .container { max-width: 1400px; margin: 0 auto; }
              .header { background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 8px 32px rgba(0, 123, 255, 0.15); border: 1px solid rgba(0, 123, 255, 0.1); }
              .nav-buttons { margin-bottom: 20px; }
              .nav-btn { background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; text-decoration: none; display: inline-block; font-weight: 500; transition: transform 0.2s ease; margin-right: 10px; }
              .nav-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(40, 167, 69, 0.3); }
              .logout-btn { background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); }
              .logout-btn:hover { box-shadow: 0 6px 20px rgba(220, 53, 69, 0.3); }
              .complaints-table { background: white; border-radius: 8px; box-shadow: 0 8px 32px rgba(0, 123, 255, 0.15); border: 1px solid rgba(0, 123, 255, 0.1); overflow: hidden; }
              table { width: 100%; border-collapse: collapse; }
              th, td { padding: 12px; text-align: left; border-bottom: 1px solid #dee2e6; }
              th { background: #f8f9fa; font-weight: 600; color: #495057; }
              .status-pending { color: #ffc107; font-weight: 600; }
              .status-inprogress { color: #17a2b8; font-weight: 600; }
              .status-resolved { color: #28a745; font-weight: 600; }
              .status-select { padding: 5px; border: 1px solid #dee2e6; border-radius: 4px; }
              .update-btn { background: #007bff; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; }
              .update-btn:hover { background: #0056b3; }
              .technician-input { padding: 5px; border: 1px solid #dee2e6; border-radius: 4px; width: 120px; }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <h1 style="color: #007bff; margin-bottom: 10px;">PICT Hardware Complaint Management</h1>
                  <p style="color: #6c757d; margin-bottom: 20px;">Manage and update complaint statuses</p>
                  <div class="nav-buttons">
                      <a href="/admin/dashboard" class="nav-btn">Dashboard</a>
                      <a href="/admin/logout" class="nav-btn logout-btn">Logout</a>
                  </div>
              </div>
              
              <div class="complaints-table">
                  <table>
                      <thead>
                          <tr>
                              <th>Complaint ID</th>
                              <th>Nature of Complaint</th>
                              <th>Department</th>
                              <th>Room No</th>
                              <th>Email</th>
                              <th>Received On</th>
                              <th>Status</th>
                              <th>Technician</th>
                              <th>Action</th>
                          </tr>
                      </thead>
                      <tbody>
                          ${complaints.map(complaint => `
                              <tr>
                                  <td>${complaint.complaintId}</td>
                                  <td>${complaint.natureOfComplaint}</td>
                                  <td>${complaint.department}</td>
                                  <td>${complaint.roomNo}</td>
                                  <td>${complaint.emailId}</td>
                                  <td>${complaint.receivedOn}</td>
                                  <td>
                                      <select class="status-select" id="status-${complaint.rowIndex}">
                                          <option value="Pending" ${complaint.status === 'Pending' ? 'selected' : ''}>Pending</option>
                                          <option value="In-progress" ${complaint.status === 'In-progress' ? 'selected' : ''}>In-progress</option>
                                          <option value="Resolved" ${complaint.status === 'Resolved' ? 'selected' : ''}>Resolved</option>
                                      </select>
                                  </td>
                                  <td>
                                      <input type="text" class="technician-input" id="technician-${complaint.rowIndex}" value="${complaint.technician}" placeholder="Technician name">
                                  </td>
                                  <td>
                                      <button class="update-btn" onclick="updateStatus(${complaint.rowIndex})">Update</button>
                                  </td>
                              </tr>
                          `).join('')}
                      </tbody>
                  </table>
              </div>
          </div>

          <script>
              async function updateStatus(rowIndex) {
                  const status = document.getElementById('status-' + rowIndex).value;
                  const technician = document.getElementById('technician-' + rowIndex).value;
                  
                  try {
                      const response = await fetch('/admin/update-status', {
                          method: 'POST',
                          headers: {
                              'Content-Type': 'application/json',
                          },
                          body: JSON.stringify({
                              rowIndex: rowIndex,
                              status: status,
                              technician: technician
                          })
                      });
                      
                      const result = await response.json();
                      
                      if (result.success) {
                          alert('Status updated successfully!');
                          location.reload();
                      } else {
                          alert('Error updating status: ' + result.errors);
                      }
                  } catch (error) {
                      alert('Error updating status: ' + error.message);
                  }
              }
          </script>
      </body>
      </html>
    `);
  } catch (error) {
    console.error("Error loading complaints management page:", error);
    res.status(500).json({
      success: false,
      errors: "Failed to load complaints management page"
    });
  }
};

module.exports ={submitForm,dashboard,adminlogin,adminLogout,getAllComplaintsForAdmin,updateComplaintStatusController,complaintsManagementPage};