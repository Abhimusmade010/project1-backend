# Hardware Complaint Management System

A Node.js/Express-based system for managing hardware complaints in educational institutions. The system allows users to submit hardware-related issues, which are automatically logged to Google Sheets and trigger email notifications to administrators.

## 🚀 Features

- **Complaint Submission**: Submit hardware complaints with department, room number, and issue description
- **Data Validation**: Input validation using Zod schema
- **Google Sheets Integration**: Automatic logging of complaints to Google Sheets
- **Email Notifications**: Instant email alerts to administrators
- **Rate Limiting**: Protection against spam and abuse
- **Error Handling**: Comprehensive error handling and logging
- **CORS Support**: Cross-origin request support
- **Health Check**: Server health monitoring endpoint

## 📋 Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Google Cloud Platform account
- [Brevo](https://www.brevo.com) account (free tier) for transactional email

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Complaint
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   PORT=3001
   NODE_ENV=development
   
   # Google Sheets Configuration
   SPREADSHEET_ID=your_google_sheet_id
   
   # Email (Brevo REST API)
BREVO_API_KEY=your_brevo_v3_api_key
BREVO_SENDER_EMAIL=verified-sender@yourdomain.com
BREVO_SENDER_NAME=Hardware Management System
ADMIN_EMAIL=admin@college.edu

# Admin Authentication
ADMIN_PASSWORD=your-secure-admin-password-here
SESSION_SECRET=your-super-secret-session-key-here
   ```

4. **Set up Google Sheets API**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one
   - Enable Google Sheets API
   - Create a service account
   - Download the credentials JSON file
   - Place it as `utils/credentials.json`

5. **Set up Brevo email**
   - Create an API key (SMTP & API → API keys) and add `BREVO_API_KEY` to `.env`
   - Add and verify a sender under **Senders**; use that address as `BREVO_SENDER_EMAIL`

## 🚀 Usage

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The server will start on `http://localhost:3001`

## 📡 API Endpoints

### Submit Complaint
```http
POST /api/submit
Content-Type: application/json

{
  "natureOfComplaint": "Computer not turning on",
  "department": "Computer Science",
  "roomNo": "CS-101",
  "emailId": "student@college.edu"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Complaint submitted successfully!",
  "data": {
    "complaintId": "HC-1703123456789-ABC12",
    "department": "Computer Science",
    "roomNo": "CS-101",
    "submittedAt": "2023-12-21T10:30:45.123Z"
  }
}
```

### Health Check
```http
GET /health
```

**Response:**
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2023-12-21T10:30:45.123Z",
  "uptime": 123.456
}
```

### Admin Authentication

#### Login Page
```http
GET /admin/login
```
Serves the admin login page with a password form.

#### Admin Login
```http
POST /admin/login
Content-Type: application/x-www-form-urlencoded

password=your-admin-password
```

#### Admin Dashboard
```http
GET /admin/dashboard
```
Protected route that requires admin authentication. Shows complaint statistics and department-wise data.

#### Admin Logout
```http
GET /admin/logout
```
Logs out the admin and destroys the session.

## 📁 Project Structure

```
Complaint/
├── controllers/
│   └── controllers.js      # Request handlers
├── middleware/
│   └── middlewares.js      # Validation middleware
├── routes/
│   └── routes.js          # API routes
├── utils/
│   ├── email.js           # Brevo transactional email (REST API)
│   ├── sheet.js           # Google Sheets integration
│   └── credentials.json   # Google API credentials
├── validations/
│   └── zod.js             # Input validation schemas
├── server.js              # Main server file
├── package.json           # Dependencies and scripts
└── README.md              # This file
```

## 🔧 Configuration

### Google Sheets Setup
1. Create a Google Sheet with the following columns:
   - Complaint ID
   - Nature of Complaint
   - Complaint Received On
   - Complaint Attended On
   - Complaint Resolved On
   - Status
   - Reason for Pendency
   - Department
   - Room No
   - Email ID
   - Name of Technician
   - Timestamp

2. Share the sheet with your service account email

### Email Configuration
- Use Brevo (`BREVO_API_KEY`, `BREVO_SENDER_EMAIL`); `ADMIN_EMAIL` receives new-complaint alerts

## 🛡️ Security Features

- **Rate Limiting**: 100 requests per 15 minutes per IP
- **Input Validation**: All inputs validated using Zod schemas
- **Error Handling**: Comprehensive error handling without exposing sensitive information
- **CORS**: Configurable cross-origin request handling
- **Session Security**: Secure session configuration with httpOnly cookies and CSRF protection
- **Admin Authentication**: Fixed password system with session-based authentication
- **Session Expiration**: Automatic session timeout after 24 hours

## 📝 Validation Rules

- **Nature of Complaint**: Required string
- **Department**: Required string
- **Room No**: Required string
- **Email ID**: Required valid email address

## 🐛 Troubleshooting

### Common Issues

1. **"ENOENT: no such file or directory, open 'credentials.json'"**
   - Ensure `utils/credentials.json` exists
   - Check file permissions

2. **Email not sending (Brevo)**
   - Confirm `BREVO_API_KEY` and `BREVO_SENDER_EMAIL` are set and the sender is verified in Brevo
   - Check server logs for `Brevo error` and HTTP status (401 = bad key, 400 = invalid sender)

3. **Google Sheets access denied**
   - Verify service account has access to the sheet
   - Check spreadsheet ID is correct

4. **Validation errors**
   - Ensure all required fields are provided
   - Check email format is valid

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 📞 Support

For support and questions, please contact the development team or create an issue in the repository. 