const nodemailer = require("nodemailer");

const getFormattedDateTime = () => {
  return new Date().toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "full",
    timeStyle: "short",
  });
};

const sendEmail = async ({ emailId, department, natureOfComplaint, roomNo }) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS ,
      },
    });

    const submittedAt = getFormattedDateTime();
    const sheetLink = "https://docs.google.com/spreadsheets/d/1Ma-YVQXEiO8TyJiBh6sCQUSSMkSEN-o_K4wBn-wbK7E";
    
    

    await transporter.sendMail({
      from: `"Hardware Management System" <${process.env.EMAIL_USER || "abhishekmusmade342@gmail.com"}>`,
      to: process.env.ADMIN_EMAIL || "musmadesunanda6@gmail.com",
      subject: "Hardware Issue Reported - New Complaint",
      html: `
        <h2>New Complaint Reported</h2>
        <p><strong>Department:</strong> ${department}</p>
        <p><strong>Room No:</strong> ${roomNo}</p>
        <p><strong>Nature of Complaint:</strong> ${natureOfComplaint}</p>
        <p><strong>Submitted At:</strong> ${submittedAt}</p>
        <p><strong>View in Sheet:</strong> <a href="${sheetLink}">Complaint Sheet</a></p>
        <p><strong>Note:</strong> Please ensure to update the sheet with the status of this complaint.</p>
        <p>Thank you!</p>
        `
    });

    console.log("Email notification sent successfully");
    
  } catch (error) {
    console.error(" Email sending failed:", error);
    throw error;
  }
};

const sendStatusUpdateEmail = async ({ emailId, complaintId, department, natureOfComplaint, roomNo, oldStatus, newStatus, technician, updatedAt }) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      port: 587,
      secure: false,
      auth: {
       
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"Hardware Management System" <${process.env.EMAIL_USER || "abhishekmusmade342@gmail.com"}>`,
      to: emailId,
      subject: `Complaint Status Updated - ${newStatus}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
          <div style="background: white; padding: 25px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);">
            <h2 style="color: #007bff; margin: 0 0 20px 0; text-align: center;">Hardware Complaint Update</h2>
            
            <p style="color: #333; font-size: 16px; line-height: 1.5;">
              Dear User,
            </p>
            
            <p style="color: #333; font-size: 16px; line-height: 1.5;">
              Your complaint status has been updated to <strong style="color: #007bff;">${newStatus}</strong>.
            </p>
            
            <div style="background: #f8f9fa; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <p style="margin: 0; color: #666; font-size: 14px;">
                <strong>Complaint ID:</strong> ${complaintId}<br>
                <strong>Department:</strong> ${department}<br>
                <strong>Room:</strong> ${roomNo}<br>
                <strong>Issue:</strong> ${natureOfComplaint}
                ${technician ? `<br><strong>Technician:</strong> ${technician}` : ''}
              </p>
            </div>
            
            <p style="color: #333; font-size: 16px; line-height: 1.5;">
              Thank you for your patience.
            </p>
            
            <p style="color: #666; font-size: 14px; margin-top: 20px; text-align: center;">
              This is an automated notification from PICT Hardware Management System.
            </p>
          </div>
        </div>
      `
    });

    console.log(`Status update email sent successfully to ${emailId}`);
    
  } catch (error) {
    console.error("Status update email sending failed:", error);
    throw error;
  }
};


//optionall
const sendStatusToTechinician=async({emailId, complaintId, department, natureOfComplaint, roomNo,technician})=>{
  try{
    const transporter=nodemailer.createTransport({
      service:'gmail',
      port: 587,
      secure: false,
      auth:{
        user:process.env.EMAIL_USER,
        pass:process.env.EMAIL_PASS,
      },
    });
    await transporter.sendMail({
      from: `"Hardware Management System" <${process.env.EMAIL_USER}>`,
      to: technician,
      subject: `New Complaint Assigned | ID: ${complaintId}`,

      
      text: `
        New Complaint Assigned

        Complaint ID: ${complaintId}
        User Email: ${emailId}
        Department: ${department}
        Room No: ${roomNo}
        Nature of Complaint: ${natureOfComplaint}

        Please take necessary action.
        `,
    })
  }catch(error){
    console.error("Status update email sending failed:", error);
    throw error;
  }
} 


module.exports = { sendEmail, sendStatusUpdateEmail ,sendStatusToTechinician};
