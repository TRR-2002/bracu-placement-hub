# 📅 ADVANCED GOOGLE CALENDAR INTEGRATION GUIDE

## Overview

Your BRACU Placement Hub now supports advanced Google Calendar integration with four key use cases:

1. **📋 Application Deadline Tracking** - Auto-sync when students apply
2. **💼 Job Posting Events** - Auto-create when recruiters post jobs  
3. **📞 Interview Scheduling** - Book interview slots with students
4. **🎓 Campus Recruitment Drives** - Schedule and manage recruitment events

---

## Feature 1: Application Deadline Tracking (Already Implemented)

### What Happens
- When a student applies for a job with a deadline → Event auto-created in their Google Calendar
- Multiple reminders: Email (1 day before, 2 hours before) + Pop-up (30 min before)

### Endpoints
```
GET /api/calendar/deadlines
- Get all upcoming and passed application deadlines

POST /api/calendar/sync-deadlines
- Manually sync all applications with deadlines

DELETE /api/calendar/deadlines/:calendarEventId
- Remove a deadline from calendar

GET /api/calendar/status
- Check if Google Calendar is configured
```

### Example Response
```json
{
  "success": true,
  "upcoming": [
    {
      "_id": "event123",
      "deadline": "2025-01-15T18:00:00Z",
      "jobTitle": "Software Engineer",
      "company": "Tech Corp"
    }
  ],
  "totalUpcoming": 1
}
```

---

## Feature 2: Automatic Job Posting Events (NEW)

### What Happens
- When a recruiter creates a job posting with a deadline → Event auto-created on their calendar
- Shows job details, application deadline, and location
- Color-coded: **Purple** for job postings

### Enhanced Endpoint
```
POST /api/recruiter/jobs
```

### Request Body
```json
{
  "title": "Software Engineer",
  "company": "TechCorp",
  "location": "Dhaka, Bangladesh",
  "description": "Looking for experienced engineers",
  "applicationDeadline": "2025-01-15T18:00:00Z",
  "salaryMin": 50000,
  "salaryMax": 80000,
  "requiredSkills": ["JavaScript", "React", "Node.js"]
}
```

### Response
```json
{
  "success": true,
  "message": "Job posted successfully",
  "job": { ...jobDetails... },
  "calendarEvent": {
    "eventId": "calendar_event_123",
    "message": "Job posting added to calendar"
  }
}
```

### Benefits
- ✅ Recruiters automatically see job deadlines in their calendar
- ✅ No manual calendar management needed
- ✅ Easy deadline tracking

---

## Feature 3: Interview Scheduling (NEW)

### What Happens
- Recruiter schedules an interview with a student
- Both parties receive calendar invites with meeting details
- Automatic email reminders
- Optional meeting link included

### New Endpoint
```
POST /api/calendar/schedule-interview
```

### Request Body
```json
{
  "studentId": "student_user_id",
  "jobId": "job_id",
  "interviewTime": "2025-01-20T14:00:00Z",
  "meetingLink": "https://meet.google.com/abc-defg-hij"
}
```

### Response
```json
{
  "success": true,
  "message": "Interview scheduled successfully",
  "calendarEvent": {
    "eventId": "calendar_event_456",
    "studentEmail": "student@g.bracu.ac.bd",
    "recruiterEmail": "recruiter@company.com",
    "interviewTime": "2025-01-20T14:00:00Z",
    "jobTitle": "Software Engineer",
    "company": "TechCorp"
  }
}
```

### Features
- 📧 Email reminders to both parties
- 🔔 Pop-up reminders 15 minutes before
- 📞 Meeting link included in calendar event
- 📅 Color-coded: **Red** for interviews
- ✅ Both student and recruiter invited

### How to Use
1. Navigate to job applications
2. Find a promising candidate
3. Click "Schedule Interview"
4. Select date, time, and meeting link
5. Both parties automatically get calendar invite

---

## Feature 4: Campus Recruitment Drives (NEW)

### What Happens
- Recruiters can create campus recruitment events
- Automatically adds event to shared calendar
- Students get notifications about events
- Supports multiple invites

### New Endpoint
```
POST /api/calendar/recruitment-drive
```

### Request Body
```json
{
  "eventName": "Campus Placement Drive 2025",
  "startTime": "2025-02-01T09:00:00Z",
  "endTime": "2025-02-01T17:00:00Z",
  "location": "BRACU Main Campus, Auditorium",
  "description": "Join us for our annual campus recruitment drive. We'll be recruiting across all departments.",
  "studentEmails": [
    "student1@g.bracu.ac.bd",
    "student2@g.bracu.ac.bd",
    "student3@g.bracu.ac.bd"
  ]
}
```

### Response
```json
{
  "success": true,
  "message": "Recruitment drive created successfully",
  "event": {
    "eventId": "calendar_event_789",
    "eventName": "Campus Placement Drive 2025",
    "company": "TechCorp",
    "startTime": "2025-02-01T09:00:00Z",
    "endTime": "2025-02-01T17:00:00Z",
    "location": "BRACU Main Campus, Auditorium",
    "invitedStudents": 3
  }
}
```

### Features
- 📌 Event shows up on recruiter's calendar
- 🎓 All invited students get notifications
- 📅 Color-coded: **Blue** for recruitment drives
- ⏰ Reminders: Email (1 day, 2 hours), Pop-up (30 min)
- 📍 Location and event details included

### How to Use
1. Go to Recruiter Dashboard
2. Click "Create Recruitment Drive"
3. Fill in event details
4. Add student emails (comma-separated)
5. Event automatically synced to calendar
6. Students receive notifications

---

## Feature 5: View Recruitment Events

### Endpoint
```
GET /api/calendar/recruitment-events
```

### Response
```json
{
  "success": true,
  "message": "Recruitment events are synced to Google Calendar",
  "note": "Check your Google Calendar for campus recruitment drives and events",
  "upcomingEvents": []
}
```

### How to View
- All events appear in Google Calendar automatically
- Students can subscribe to their calendar
- Events include location, time, description
- RSVP directly from Google Calendar

---

## Automatic Job Status Management

### Deadline-Based Status Changes

```
Timeline:
1. Job Posted → Status: "Open", Calendar event created
2. Application Deadline Approaches → Reminders sent automatically
3. Deadline Passes → Status: "Closed"
   - NO new applications allowed
   - Notification sent to recruiter
   - Calendar updated

How It Works:
- Cron job runs every hour
- Checks all jobs with past deadlines
- Updates status to "Closed"
- Prevents new applications
```

### Backend Implementation
```javascript
// Automatic deadline check (runs every hour)
cron.schedule('0 * * * *', async () => {
  const expiredJobs = await Job.find({
    status: 'Open',
    applicationDeadline: { $lt: new Date() }
  });
  
  for (const job of expiredJobs) {
    job.status = 'Closed';
    await job.save();
    // Notify recruiter
  }
});
```

---

## Dynamic Application Blocking

### Frontend Implementation (JobDetailsPage.jsx)

```javascript
// Check if deadline passed
const isDeadlinePassed = job.applicationDeadline && 
                        new Date() > new Date(job.applicationDeadline);

// Disable apply button if deadline passed
<button disabled={isDeadlinePassed || job.status !== 'Open'}>
  {isDeadlinePassed ? '❌ Application Deadline Closed' : '📝 Apply Now'}
</button>
```

### API Validation (Backend)
```javascript
// Verify deadline before accepting application
if (job.applicationDeadline && new Date() > job.applicationDeadline) {
  return res.status(400).json({
    success: false,
    error: "Application deadline has passed"
  });
}
```

---

## Data Flow Diagram

```
┌─────────────────────────────────────┐
│  Recruiter Posts Job                │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│  Backend: POST /api/recruiter/jobs  │
└────────────┬────────────────────────┘
             │
             ├─► Save Job to Database
             │
             ├─► Create Calendar Event
             │   (createJobPostingEvent)
             │
             └─► Send Notification
                 to Recruiter
                 
┌─────────────────────────────────────┐
│  Event in Google Calendar           │
│  - Purple color                     │
│  - Deadline shown                   │
│  - Location included                │
└─────────────────────────────────────┘

                ▼
                
┌─────────────────────────────────────┐
│  Student Applies for Job            │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│  Backend: POST /api/jobs/apply      │
└────────────┬────────────────────────┘
             │
             ├─► Save Application
             │
             ├─► Create Calendar Event
             │   (for student deadline)
             │
             └─► Send Notifications
                 (Student + Recruiter)
                 
┌─────────────────────────────────────┐
│  Two Calendar Events Created:       │
│  1. Recruiter: Job posted (Purple)  │
│  2. Student: Deadline (Cyan)        │
└─────────────────────────────────────┘

                ▼
                
┌─────────────────────────────────────┐
│  Recruiter Schedules Interview      │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│  POST /api/calendar/schedule-...    │
└────────────┬────────────────────────┘
             │
             ├─► Create Interview Event
             │   (scheduleInterviewSlot)
             │
             └─► Send Notifications
                 to Both Parties
                 
┌─────────────────────────────────────┐
│  Interview Event (Red):             │
│  - Both calendars updated           │
│  - Meeting link included            │
│  - Reminders set                    │
└─────────────────────────────────────┘

                ▼
                
┌─────────────────────────────────────┐
│  Recruiter Creates Recruitment Drive│
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│  POST /api/calendar/recruitment-... │
└────────────┬────────────────────────┘
             │
             ├─► Create Drive Event
             │   (createRecruitmentDrive)
             │
             └─► Notify All Students
                 (batch notifications)
                 
┌─────────────────────────────────────┐
│  Recruitment Drive Event (Blue):    │
│  - All invited students notified    │
│  - Location & time included         │
│  - RSVP via calendar                │
└─────────────────────────────────────┘
```

---

## Calendar Event Color Coding

| Event Type | Color | Meaning |
|---|---|---|
| Interview | 🔴 Red (1) | Meeting with candidate |
| Job Posting | 🟣 Purple (5) | New job opportunity |
| Application Deadline | 🔵 Cyan (3) | Student deadline |
| Recruitment Drive | 🔷 Blue (2) | Campus event |

---

## Setup Checklist

### Prerequisites
- [x] Google Calendar API credentials configured (.env)
- [x] Service account created
- [x] Calendar sharing permissions set

### Configuration
```
.env variables:
GOOGLE_CALENDAR_EMAIL = your-service-account@project.iam.gserviceaccount.com
GOOGLE_CALENDAR_PROJECT_ID = your-project-id
GOOGLE_CALENDAR_KEY_ID = your-key-id
GOOGLE_CALENDAR_CLIENT_ID = your-client-id
GOOGLE_CALENDAR_PRIVATE_KEY = your-private-key (with newlines)
GOOGLE_CALENDAR_CERT_URL = your-cert-url
```

---

## Testing Calendar Features

### 1. Test Job Posting Calendar Event
```bash
POST /api/recruiter/jobs
{
  "title": "Test Position",
  "company": "Test Company",
  "location": "Dhaka",
  "applicationDeadline": "2025-02-01T18:00:00Z",
  "description": "Test job",
  "requiredSkills": ["Test"]
}
```

### 2. Test Interview Scheduling
```bash
POST /api/calendar/schedule-interview
{
  "studentId": "student_id",
  "jobId": "job_id",
  "interviewTime": "2025-01-25T14:00:00Z",
  "meetingLink": "https://meet.google.com/test-link"
}
```

### 3. Test Recruitment Drive
```bash
POST /api/calendar/recruitment-drive
{
  "eventName": "Test Drive",
  "startTime": "2025-02-05T09:00:00Z",
  "endTime": "2025-02-05T17:00:00Z",
  "location": "Test Venue",
  "description": "Test recruitment",
  "studentEmails": ["student@g.bracu.ac.bd"]
}
```

---

## Benefits Summary

### For Students
✅ Never miss application deadlines
✅ Automatic calendar reminders
✅ Interview dates synced to calendar
✅ Know about recruitment events early
✅ RSVP directly from calendar

### For Recruiters
✅ Job deadlines auto-tracked
✅ Interview scheduling made easy
✅ Campus events coordinated
✅ Student notifications automatic
✅ No manual calendar management

### For Admin
✅ Platform events visible
✅ Recruitment drive tracking
✅ Deadline enforcement automatic
✅ Better event coordination
✅ Audit trail in Google Calendar

---

## Troubleshooting

### Event Not Created?
- Check .env configuration
- Verify Google Calendar API enabled
- Ensure service account has permissions
- Check application deadline is in future

### Students Not Getting Notifications?
- Verify email addresses correct
- Check email service configured
- Look in spam folder
- Verify student accounts verified

### Application Deadline Not Closing?
- Check cron job running (hourly)
- Verify job status field
- Test with past deadline
- Check server logs

---

## Future Enhancements

1. **📹 Video Interview Integration**
   - Auto-create Google Meet links
   - Record interviews

2. **🔔 Smart Reminders**
   - AI-powered timing
   - Personalized notifications

3. **📊 Analytics Dashboard**
   - Interview completion rates
   - Deadline statistics
   - Recruitment drive attendance

4. **🔄 Calendar Sync**
   - Two-way sync with Gmail
   - Teams/Outlook integration

5. **📱 Mobile App**
   - Calendar widget
   - Quick interview booking

---

**Documentation Version:** 1.0
**Last Updated:** December 26, 2025
**Status:** ✅ Production Ready
