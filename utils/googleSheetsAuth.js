const { google } = require("googleapis");
const path = require("path");

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];

function createSheetsGoogleAuth() {
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY;

  if (clientEmail && privateKey) {
    return new google.auth.GoogleAuth({
      credentials: {
        client_email: clientEmail,
        private_key: privateKey.replace(/\\n/g, "\n"),
      },
      scopes: SCOPES,
    });
  }

  return new google.auth.GoogleAuth({
    keyFile: path.join(__dirname, "credentials.json"),
    scopes: SCOPES,
  });
}

const auth = createSheetsGoogleAuth();

module.exports = { auth };
