# 📅 Google Calendar API - Application Deadline Tracking

## Overview
This document provides step-by-step instructions to set up Google Calendar API integration for automatic application deadline tracking.

**Feature**: When a student applies for a job, the application deadline is automatically added to their Google Calendar with reminders.

**Implementation**: Member 1/2 External API Integration

---

## ✨ Features

- ✅ Auto-sync application deadlines to Google Calendar
- ✅ Email reminders (1 day before, 2 hours before)
- ✅ Pop-up reminders (30 minutes before)
- ✅ View all upcoming deadlines
- ✅ Remove deadlines from calendar
- ✅ Fallback if API not configured (system continues working)

---

## 🔧 Setup Instructions

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **"Create Project"**
3. Name it: `BRACU Placement Hub` or similar
4. Click **Create**
5. Wait for project creation

### Step 2: Enable Google Calendar API

1. In the Cloud Console, search for **"Google Calendar API"**
2. Click on it
3. Click **ENABLE**
4. Wait for it to enable

### Step 3: Create Service Account

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **Service Account**
3. Fill in details:
   - **Service account name**: `BRACU Placement Hub`
   - **Service account ID**: `bracu-placement-hub`
4. Click **Create and Continue**
5. Click **Continue** again (skip optional steps)
6. Click **Done**

### Step 4: Create and Download Private Key

1. In the Credentials page, find your newly created service account
2. Click on it to open details
3. Go to the **Keys** tab
4. Click **Add Key** → **Create new key**
5. Choose **JSON** format
6. Click **Create**
7. A JSON file will download - **save this safely**

### Step 5: Extract Credentials from JSON

Open the downloaded JSON file. It will look like:

```json
{
  "type": "service_account",
  "project_id": "bracu-placement-hub-12345",
  "private_key_id": "abc123def456...",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQ...\n-----END PRIVATE KEY-----\n",
  "client_email": "bracu-placement-hub@bracu-placement-hub-12345.iam.gserviceaccount.com",
  "client_id": "123456789",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/bracu-placement-hub%40bracu-placement-hub-12345.iam.gserviceaccount.com"
}
```

### Step 6: Update .env File

Edit `.env` file and fill in the credentials:

```env
# Google Calendar API Configuration
GOOGLE_CALENDAR_EMAIL=bracu-placement-hub@bracu-placement-hub-12345.iam.gserviceaccount.com
GOOGLE_CALENDAR_PROJECT_ID=bracu-placement-hub-12345
GOOGLE_CALENDAR_KEY_ID=abc123def456...
GOOGLE_CALENDAR_CLIENT_ID=123456789
GOOGLE_CALENDAR_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nMIIEvQ...\n-----END PRIVATE KEY-----\n
GOOGLE_CALENDAR_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/bracu-placement-hub%40bracu-placement-hub-12345.iam.gserviceaccount.com
```

**⚠️ Important**: 
- Keep the private key safe - don't commit to GitHub
- The `\n` in GOOGLE_CALENDAR_PRIVATE_KEY is for line breaks

### Step 7: Share Calendar with Service Account

1. Open [Google Calendar](https://calendar.google.com)
2. Go to **Settings** → **Calendars**
3. Find **"Primary"** calendar
4. Click it → **Share this calendar**
5. Add the service account email: `bracu-placement-hub@bracu-placement-hub-12345.iam.gserviceaccount.com`
6. Give it **Editor** permission
7. Save

---

## 📱 API Endpoints

### Get Upcoming Application Deadlines
```
GET /api/calendar/deadlines
Headers: Authorization: Bearer <token>

Response:
{
  "success": true,
  "upcoming": [
    {
      "_id": "123...",
      "job": { "title": "Software Engineer", "company": "Google" },
      "deadline": "2025-01-15T23:59:59Z",
      "eventType": "application_deadline"
    }
  ],
  "passed": [],
  "totalUpcoming": 1
}
```

### Sync All Deadlines to Calendar
```
POST /api/calendar/sync-deadlines
Headers: Authorization: Bearer <token>

Response:
{
  "success": true,
  "message": "Synced 5 deadlines to Google Calendar",
  "synced": 5,
  "failed": 0,
  "total": 5
}
```

### Remove Deadline from Calendar
```
DELETE /api/calendar/deadlines/:calendarEventId
Headers: Authorization: Bearer <token>

Response:
{
  "success": true,
  "message": "Deadline removed from calendar"
}
```

### Check Calendar Status
```
GET /api/calendar/status
Headers: Authorization: Bearer <token>

Response:
{
  "success": true,
  "configured": true,
  "message": "Google Calendar is configured",
  "totalSyncedDeadlines": 5
}
```

---

## 🔄 How It Works

### When Student Applies for Job

1. Student submits application via `/api/jobs/apply`
2. System checks if job has `applicationDeadline`
3. If yes:
   - Creates calendar event in student's Google Calendar
   - Stores event ID in database
   - Sends notification to student
4. If API not configured:
   - Application still works
   - No calendar sync (graceful fallback)

### Automatic Reminders

Google Calendar automatically sends:
- 📧 Email 1 day before deadline
- 📧 Email 2 hours before deadline
- 🔔 Pop-up 30 minutes before deadline

---

## ✅ Testing

### 1. Verify Installation
```bash
npm install  # Install googleapis (should already be there)
```

### 2. Test Configuration
```bash
curl http://localhost:1350/api/calendar/status \
  -H "Authorization: Bearer <your-token>"
```

Expected response:
```json
{
  "success": true,
  "configured": true,
  "message": "Google Calendar is configured",
  "totalSyncedDeadlines": 0
}
```

### 3. Test Job Application
1. Login as student
2. Apply for a job with a deadline
3. Check Google Calendar - deadline should appear
4. Get deadlines: `/api/calendar/deadlines`

---

## 🎯 Database Schema

### CalendarEvent Model
```javascript
{
  user: ObjectId,                    // Student who applied
  application: ObjectId,             // Application reference
  job: ObjectId,                     // Job reference
  googleEventId: String,             // Google Calendar event ID
  deadline: Date,                    // Application deadline
  jobTitle: String,                  // Job title (for reference)
  company: String,                   // Company name
  eventType: "application_deadline", // Type of event
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🚨 Troubleshooting

### "Google Calendar not configured"
**Solution**: Fill in all .env variables and restart server

### "Invalid private key"
**Solution**: Ensure `\n` characters are properly escaped in .env

### "Permission denied"
**Solution**: 
- Share Google Calendar with service account email
- Ensure service account has **Editor** permission

### "Calendar event not created but application succeeds"
**Solution**: This is expected - system gracefully falls back if API fails. Check server logs for error details.

---

## 📚 References

- [Google Calendar API Docs](https://developers.google.com/calendar/api/guides/overview)
- [Service Account Setup](https://developers.google.com/identity/protocols/oauth2/service-account)
- [Node.js Google APIs](https://github.com/googleapis/google-api-nodejs-client)

---

## 🎓 For Evaluation

**Demonstrate**:
1. Apply for a job with deadline
2. Check Google Calendar (calendar.google.com)
3. Show deadline appears automatically
4. Show reminders in calendar settings
5. Use `/api/calendar/deadlines` endpoint

**Explain**:
- How service account authentication works
- Why graceful fallback is important
- How timezone handling works (Asia/Dhaka)
- Database tracking of calendar events

---

## Notes for Development

- Graceful degradation: If Google Calendar API fails, system continues working
- Timezone: Set to Asia/Dhaka (Bangladesh timezone)
- Reminders: Customizable in `addApplicationDeadlineToCalendar()` function
- No authentication dialog needed: Service account handles it

