const { google } = require("googleapis");
const { auth } = require("./googleSheetsAuth");



const getDashboardStats = async () => {
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

  const dataRows = rows.slice(1).filter(row => row.length > 1 && row[0]?.trim() !== "");

    let total = 0;
    let pending = 0;
    let inProgress = 0;
    let resolved = 0;
    const departmentStats = {};

    for (const row of dataRows) {
      total++;
      const status = row[5]?.toLowerCase();
      const dept = row[7] || "Unknown";

      if (!departmentStats[dept]) {
        departmentStats[dept] = { total: 0, pending: 0, inProgress: 0, resolved: 0 };
      }

      departmentStats[dept].total++;

      if (status === "pending") {
        pending++;
        departmentStats[dept].pending++;
      } else if (status === "in-progress" || status === "in progress") {
        inProgress++;
        departmentStats[dept].inProgress++;
      } else {
        resolved++;
        departmentStats[dept].resolved++;
      }
    }

    return {
      totalComplaints: total,
      pendingComplaints: pending,
      inProgressComplaints: inProgress,
      resolvedComplaints: resolved,
      departmentWise: departmentStats
    };

  } catch (error) {
    console.error("Failed to fetch dashboard stats:", error.message);
    throw error;
  }
};

module.exports = { getDashboardStats };
