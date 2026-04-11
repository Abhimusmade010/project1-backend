/**
 * Transactional email via Brevo REST API (HTTPS :443).
 * Works on Render free tier (no SMTP ports). No Nodemailer.
 *
 * Env: BREVO_API_KEY, BREVO_SENDER_EMAIL (verified sender in Brevo), optional BREVO_SENDER_NAME.
 * ADMIN_EMAIL = inbox for new-complaint alerts.
 */

const BREVO_URL = "https://api.brevo.com/v3/smtp/email";

function getApiKey() {
  return (process.env.BREVO_API_KEY || "").trim();
}

function getSenderEmail() {
  return (process.env.BREVO_SENDER_EMAIL || process.env.MAIL_FROM || "").trim();
}

function getSenderName() {
  return (
    (process.env.BREVO_SENDER_NAME || "Hardware Management System").trim()
  );
}

function adminRecipient() {
  return (process.env.ADMIN_EMAIL || "").trim() || "musmadesunanda6@gmail.com";
}

function assertBrevoConfig() {
  const key = getApiKey();
  const sender = getSenderEmail();
  if (!key || !sender) {
    const err = new Error(
      "Set BREVO_API_KEY and BREVO_SENDER_EMAIL (verified sender in Brevo dashboard)."
    );
    err.code = "EMISSING";
    throw err;
  }
}

async function brevoSend({ toAddresses, subject, htmlContent, textContent }) {
  assertBrevoConfig();

  const recipients = (Array.isArray(toAddresses) ? toAddresses : [toAddresses])
    .map((e) => String(e || "").trim())
    .filter(Boolean);

  if (recipients.length === 0) {
    const err = new Error("No recipient email addresses");
    err.code = "EINVALID_TO";
    throw err;
  }

  const payload = {
    sender: {
      name: getSenderName(),
      email: getSenderEmail(),
    },
    to: recipients.map((email) => ({ email })),
    subject,
  };

  if (htmlContent) payload.htmlContent = htmlContent;
  if (textContent) payload.textContent = textContent;

  const res = await fetch(BREVO_URL, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "api-key": getApiKey(),
    },
    body: JSON.stringify(payload),
  });

  const raw = await res.text();
  let data = {};
  try {
    data = raw ? JSON.parse(raw) : {};
  } catch {
    data = { raw };
  }

  if (!res.ok) {
    const err = new Error(
      data.message ||
        data.error ||
        `Brevo API HTTP ${res.status}: ${raw.slice(0, 200)}`
    );
    err.code = "EBREVO";
    err.status = res.status;
    err.details = data;
    console.error("[email] Brevo error:", res.status, data);
    throw err;
  }

  return data;
}

const getFormattedDateTime = () =>
  new Date().toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "full",
    timeStyle: "short",
  });

const sendEmail = async ({
  emailId,
  department,
  natureOfComplaint,
  roomNo,
}) => {
  const toAddr = adminRecipient();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(toAddr)) {
    const err = new Error(`ADMIN_EMAIL looks invalid: ${JSON.stringify(toAddr)}`);
    err.code = "EINVALID_TO";
    throw err;
  }

  const submittedAt = getFormattedDateTime();
  const sheetLink =
    "https://docs.google.com/spreadsheets/d/1Ma-YVQXEiO8TyJiBh6sCQUSSMkSEN-o_K4wBn-wbK7E";

  console.log("[email] Brevo new-complaint →", toAddr);

  const data = await brevoSend({
    toAddresses: [toAddr],
    subject: "Hardware Issue Reported - New Complaint",
    htmlContent: `
        <h2>New Complaint Reported</h2>
        <p><strong>Department:</strong> ${department}</p>
        <p><strong>Room No:</strong> ${roomNo}</p>
        <p><strong>Nature of Complaint:</strong> ${natureOfComplaint}</p>
        <p><strong>Submitted At:</strong> ${submittedAt}</p>
        <p><strong>View in Sheet:</strong> <a href="${sheetLink}">Complaint Sheet</a></p>
        <p><strong>Note:</strong> Please ensure to update the sheet with the status of this complaint.</p>
        <p>Thank you!</p>
        `,
  });

  console.log("[email] Brevo accepted new-complaint; messageId:", data.messageId);
};

const sendStatusUpdateEmail = async ({
  emailId,
  complaintId,
  department,
  natureOfComplaint,
  roomNo,
  newStatus,
  technician,
}) => {
  const to = (emailId || "").trim();
  if (!to) {
    const err = new Error("Complainant email missing");
    err.code = "EINVALID_TO";
    throw err;
  }

  const data = await brevoSend({
    toAddresses: [to],
    subject: `Complaint Status Updated - ${newStatus}`,
    htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
          <div style="background: white; padding: 25px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);">
            <h2 style="color: #007bff; margin: 0 0 20px 0; text-align: center;">Hardware Complaint Update</h2>
            <p style="color: #333; font-size: 16px; line-height: 1.5;">Dear User,</p>
            <p style="color: #333; font-size: 16px; line-height: 1.5;">
              Your complaint status has been updated to <strong style="color: #007bff;">${newStatus}</strong>.
            </p>
            <div style="background: #f8f9fa; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <p style="margin: 0; color: #666; font-size: 14px;">
                <strong>Complaint ID:</strong> ${complaintId}<br>
                <strong>Department:</strong> ${department}<br>
                <strong>Room:</strong> ${roomNo}<br>
                <strong>Issue:</strong> ${natureOfComplaint}
                ${technician ? `<br><strong>Technician:</strong> ${technician}` : ""}
              </p>
            </div>
            <p style="color: #333; font-size: 16px; line-height: 1.5;">Thank you for your patience.</p>
            <p style="color: #666; font-size: 14px; margin-top: 20px; text-align: center;">
              This is an automated notification from PICT Hardware Management System.
            </p>
          </div>
        </div>
      `,
  });

  console.log("[email] Brevo status update; messageId:", data.messageId, "to", to);
};

const sendStatusToTechinician = async ({
  emailId,
  complaintId,
  department,
  natureOfComplaint,
  roomNo,
  technician,
}) => {
  const to = (technician || "").trim();
  if (!to) return;

  await brevoSend({
    toAddresses: [to],
    subject: `New Complaint Assigned | ID: ${complaintId}`,
    textContent: `
New Complaint Assigned

Complaint ID: ${complaintId}
User Email: ${emailId}
Department: ${department}
Room No: ${roomNo}
Nature of Complaint: ${natureOfComplaint}

Please take necessary action.
`.trim(),
  });
};

module.exports = {
  sendEmail,
  sendStatusUpdateEmail,
  sendStatusToTechinician,
};
