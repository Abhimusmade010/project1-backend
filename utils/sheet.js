const { google } = require("googleapis");
const path = require("path");
const {v4:uuid} = require("uuid");

const auth = new google.auth.GoogleAuth({
  keyFile: path.join(__dirname, "credentials.json"),
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const appendToSheet = async ({ complaintId,natureOfComplaint, department, roomNo,emailId}) => {
  try{const client = await auth.getClient();
  const sheets = google.sheets({ version: "v4", auth: client });
  

  const spreadsheetId = process.env.SPREADSHEET_ID || "1Ma-YVQXEiO8TyJiBh6sCQUSSMkSEN-o_K4wBn-wbK7E";
  const range = "Sheet1!A:K"; // 11 columns
  // const complaintId= uuid(); // Generate a unique ID for the complaint

  // Append the complaint data to the Google Sheet
    
  const response = await sheets.spreadsheets.values.append({
    spreadsheetId,
    range,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [[
        complaintId,                   // unique ID for the complaint
        natureOfComplaint,             // Nature of Complaint
        new Date().toLocaleDateString(),   // Complaint received on
        "",                            // Complaint attended on (admin fills)
        "",                            // Complaint resolved on (admin fills)
        "Pending",                     // Remark
        "",                            // Reason for Pendency
        department,                    // Department
        roomNo,
        emailId,                       // Room No
        ""                             //Name of Technician (admin fills)
      ]],
    },
  });
  return response.data;
}catch (error) {
    console.error(" Error appending to Google Sheet:", error);
    
    if (error.code === 403) {
      throw new Error("Access denied to Google Sheets. Check credentials and permissions.");
    }
    
    if (error.code === 404) {
      throw new Error("Google Sheet not found. Check spreadsheet ID.");
    }
    
    throw error;
  }
 
};

// Function to get all complaints from the sheet
const getAllComplaints = async () => {
  try {
    const client = await auth.getClient();
    const sheets = google.sheets({ version: "v4", auth: client });

    const spreadsheetId = process.env.SPREADSHEET_ID || "1Ma-YVQXEiO8TyJiBh6sCQUSSMkSEN-o_K4wBn-wbK7E";
    const range = "Sheet1!A:K";

    const result = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    const rows = result.data.values || [];
    const headers = rows[0] || [];
    const dataRows = rows.slice(1).filter(row => row.length > 1 && row[0]?.trim() !== "");

    return dataRows.map((row, index) => ({
      rowIndex: index + 2, // +2 because we skip header and start from 1-indexed
      complaintId: row[0] || "",
      natureOfComplaint: row[1] || "",
      receivedOn: row[2] || "",
      attendedOn: row[3] || "",
      resolvedOn: row[4] || "",
      status: row[5] || "Pending",
      reasonForPendency: row[6] || "",
      department: row[7] || "",
      roomNo: row[8] || "",
      emailId: row[9] || "",
      technician: row[10] || ""
    }));
  } catch (error) {
    console.error("Error fetching complaints:", error);
    throw error;
  }
};

// Function to update complaint status
const updateComplaintStatus = async (rowIndex, status, attendedOn = "", resolvedOn = "", technician = "") => {
  try {
    const client = await auth.getClient();
    const sheets = google.sheets({ version: "v4", auth: client });

    const spreadsheetId = process.env.SPREADSHEET_ID || "1Ma-YVQXEiO8TyJiBh6sCQUSSMkSEN-o_K4wBn-wbK7E";
    
    // Update status column (F)
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `Sheet1!F${rowIndex}`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[status]]
      }
    });

    // Update attended on column (D) if provided
    if (attendedOn) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `Sheet1!D${rowIndex}`,
        valueInputOption: "USER_ENTERED",
        requestBody: {
          values: [[attendedOn]]
        }
      });
    }

    // Update resolved on column (E) if provided
    if (resolvedOn) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `Sheet1!E${rowIndex}`,
        valueInputOption: "USER_ENTERED",
        requestBody: {
          values: [[resolvedOn]]
        }
      });
    }

    // Update technician column (K) if provided
    if (technician) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `Sheet1!K${rowIndex}`,
        valueInputOption: "USER_ENTERED",
        requestBody: {
          values: [[technician]]
        }
      });
    }

    return { success: true };
  } catch (error) {
    console.error("Error updating complaint status:", error);
    throw error;
  }
};

module.exports = { appendToSheet, getAllComplaints, updateComplaintStatus };
