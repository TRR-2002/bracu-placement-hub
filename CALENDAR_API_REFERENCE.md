# 📚 API QUICK REFERENCE - Advanced Calendar Features

## All Calendar Endpoints

### Existing Endpoints (Enhanced)

#### POST /api/recruiter/jobs
**Create a job (NOW WITH CALENDAR SYNC)**

```bash
POST /api/recruiter/jobs
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "Software Engineer",
  "company": "TechCorp",
  "location": "Dhaka, Bangladesh",
  "description": "Build scalable backend systems",
  "requiredSkills": ["Node.js", "JavaScript", "MongoDB"],
  "type": "Full-time",
  "salaryMin": 50000,
  "salaryMax": 80000,
  "applicationDeadline": "2025-01-31T18:00:00Z"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Job posted successfully",
  "job": {
    "_id": "job_123",
    "title": "Software Engineer",
    "company": "TechCorp",
    "status": "Open",
    "applicationDeadline": "2025-01-31T18:00:00Z"
  },
  "calendarEvent": {
    "eventId": "google_event_123",
    "message": "Job posting added to calendar"
  }
}
```

---

### New Endpoints

#### 1. POST /api/calendar/schedule-interview
**Schedule an interview with a student**

```bash
POST /api/calendar/schedule-interview
Authorization: Bearer {recruiter_token}
Content-Type: application/json

{
  "studentId": "student_user_id_123",
  "jobId": "job_id_456",
  "interviewTime": "2025-01-22T14:00:00Z",
  "meetingLink": "https://meet.google.com/abc-defg-hij"
}
```

**Required Fields:**
- `studentId` - Student MongoDB ID
- `jobId` - Job MongoDB ID
- `interviewTime` - ISO 8601 datetime

**Optional Fields:**
- `meetingLink` - Google Meet or video conference link

**Response:**
```json
{
  "success": true,
  "message": "Interview scheduled successfully",
  "calendarEvent": {
    "eventId": "google_event_456",
    "studentEmail": "student@g.bracu.ac.bd",
    "recruiterEmail": "recruiter@company.com",
    "interviewTime": "2025-01-22T14:00:00Z",
    "jobTitle": "Software Engineer",
    "company": "TechCorp"
  }
}
```

**What Happens:**
- ✅ Calendar event created (Red color)
- ✅ Both parties invited
- ✅ Email reminders scheduled (1 day, 30 min)
- ✅ Pop-up reminder (15 min before)
- ✅ Meeting link included in invite
- ✅ Both get notifications in app

**Error Responses:**
```json
// Student not found
{
  "success": false,
  "error": "Student not found"
}

// Job not found or permission denied
{
  "success": false,
  "error": "Job not found or you don't have permission"
}

// Missing required fields
{
  "success": false,
  "error": "studentId, jobId, and interviewTime are required"
}
```

---

#### 2. POST /api/calendar/recruitment-drive
**Create a campus recruitment event**

```bash
POST /api/calendar/recruitment-drive
Authorization: Bearer {recruiter_token}
Content-Type: application/json

{
  "eventName": "Campus Placement Drive Spring 2025",
  "startTime": "2025-02-15T09:00:00Z",
  "endTime": "2025-02-15T17:00:00Z",
  "location": "BRACU Main Campus, Auditorium A",
  "description": "Annual campus placement drive. We're hiring for various positions. Bring your resume and portfolio.",
  "studentEmails": [
    "student1@g.bracu.ac.bd",
    "student2@g.bracu.ac.bd",
    "student3@g.bracu.ac.bd",
    "student4@g.bracu.ac.bd",
    "student5@g.bracu.ac.bd"
  ]
}
```

**Required Fields:**
- `eventName` - Name of the recruitment event
- `startTime` - Event start (ISO 8601)
- `endTime` - Event end (ISO 8601)
- `location` - Physical location

**Optional Fields:**
- `description` - Event details
- `studentEmails` - Array of student emails to invite (max 100+)

**Response:**
```json
{
  "success": true,
  "message": "Recruitment drive created successfully",
  "event": {
    "eventId": "google_event_789",
    "eventName": "Campus Placement Drive Spring 2025",
    "company": "TechCorp",
    "startTime": "2025-02-15T09:00:00Z",
    "endTime": "2025-02-15T17:00:00Z",
    "location": "BRACU Main Campus, Auditorium A",
    "invitedStudents": 5
  }
}
```

**What Happens:**
- ✅ Calendar event created (Blue color)
- ✅ All invited students notified
- ✅ Event in recruiter's calendar
- ✅ Event in all students' calendars
- ✅ Email reminders (1 day, 2 hours)
- ✅ Pop-up reminder (30 min)
- ✅ RSVP possible from calendar

**Error Responses:**
```json
// Missing required fields
{
  "success": false,
  "error": "eventName, startTime, endTime, and location are required"
}

// Calendar API not configured
{
  "success": false,
  "error": "Failed to create recruitment drive event on calendar"
}
```

---

#### 3. GET /api/calendar/recruitment-events
**View all recruitment events status**

```bash
GET /api/calendar/recruitment-events
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "message": "Recruitment events are synced to Google Calendar",
  "note": "Check your Google Calendar for campus recruitment drives and events",
  "upcomingEvents": []
}
```

---

## Existing Calendar Endpoints (Unchanged)

### Application Deadlines

#### GET /api/calendar/deadlines
**Get upcoming and past application deadlines**

```bash
GET /api/calendar/deadlines
Authorization: Bearer {student_token}
```

**Response:**
```json
{
  "success": true,
  "upcoming": [
    {
      "_id": "event_123",
      "deadline": "2025-01-25T18:00:00Z",
      "jobTitle": "Software Engineer",
      "company": "TechCorp",
      "job": "job_id_123"
    }
  ],
  "passed": [
    {
      "_id": "event_456",
      "deadline": "2025-01-10T18:00:00Z",
      "jobTitle": "Data Analyst",
      "company": "DataCorp",
      "job": "job_id_456"
    }
  ],
  "totalUpcoming": 1
}
```

---

#### POST /api/calendar/sync-deadlines
**Manually sync all applications to calendar**

```bash
POST /api/calendar/sync-deadlines
Authorization: Bearer {student_token}
```

**Response:**
```json
{
  "success": true,
  "message": "Synced 5 deadlines to Google Calendar",
  "synced": 5,
  "failed": 0,
  "total": 5
}
```

---

#### DELETE /api/calendar/deadlines/:calendarEventId
**Remove a deadline from calendar**

```bash
DELETE /api/calendar/deadlines/event_123
Authorization: Bearer {student_token}
```

**Response:**
```json
{
  "success": true,
  "message": "Deadline removed from calendar"
}
```

---

#### GET /api/calendar/status
**Check calendar configuration**

```bash
GET /api/calendar/status
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "configured": true,
  "message": "Google Calendar is configured",
  "totalSyncedDeadlines": 3
}
```

---

## Event Color Guide

```
Calendar Events by Color:

🔴 RED (#F4511E)
- Interview events
- Meeting color: 1
- When: Scheduled interviews

🟣 PURPLE (#9E27B0)
- Job postings
- Meeting color: 5
- When: Recruiter creates job

🔵 CYAN (#00ACC1)
- Application deadlines
- Meeting color: 3
- When: Student applies

🔷 BLUE (#1976D2)
- Recruitment drives
- Meeting color: 2
- When: Campus events
```

---

## Reminder Settings by Event

```
APPLICATION DEADLINE (Student):
- Email: 1 day before
- Email: 2 hours before
- Pop-up: 30 minutes before

INTERVIEW (Both):
- Email: 1 day before
- Email: 30 minutes before
- Pop-up: 15 minutes before

JOB POSTING (Recruiter):
- Pop-up: At time

RECRUITMENT DRIVE (Invited):
- Email: 1 day before
- Email: 2 hours before
- Pop-up: 30 minutes before
```

---

## Error Codes

```
400 - Bad Request
- Missing required fields
- Invalid field format
- Duplicate entry

401 - Unauthorized
- No token provided
- Invalid token
- Token expired

403 - Forbidden
- Recruiter action on non-owned job
- Admin action without permission
- Role mismatch

404 - Not Found
- Student not found
- Job not found
- Event not found
- Calendar event not found

500 - Server Error
- Google Calendar API failure
- Database error
- Email service error
```

---

## Workflow Examples

### Example 1: Complete Recruitment Flow

```
STEP 1: Recruiter posts job
POST /api/recruiter/jobs
✅ Job created
✅ Calendar event created (Purple)
✅ Recruiter notified

STEP 2: Student applies
POST /api/jobs/apply
✅ Application created
✅ Calendar event created (Cyan)
✅ Reminders scheduled

STEP 3: Recruiter schedules interview
POST /api/calendar/schedule-interview
✅ Interview scheduled
✅ Calendar event created (Red)
✅ Both parties get invite

STEP 4: Student views events
GET /api/calendar/deadlines
✅ All deadlines shown
✅ Interview showing
✅ Recruitment drives visible

STEP 5: Auto-deadline closure
(Cron runs hourly)
✅ Deadline passes
✅ Job status → "Closed"
✅ Applications blocked
✅ Recruiter notified
```

---

### Example 2: Recruitment Drive Flow

```
STEP 1: Create recruitment drive
POST /api/calendar/recruitment-drive
✅ Event created
✅ Calendar event (Blue)
✅ Students identified

STEP 2: Students get notifications
(Automatic)
✅ 45 students notified
✅ Calendar events sent
✅ RSVP available

STEP 3: Day before event
(Automatic reminders)
✅ Email reminders sent
✅ Pop-up reminders in calendar

STEP 4: Event day
✅ Quick pop-up reminder
✅ Students can join from calendar
✅ Meeting link available
```

---

## Rate Limiting

Currently no rate limiting. Recommended limits:
- Job creation: 10/min per recruiter
- Interview scheduling: 50/min per recruiter
- Recruitment drives: 5/min per recruiter
- Calendar sync: 5/min per student

---

## Testing with cURL

### Test Job Posting
```bash
curl -X POST http://localhost:1350/api/recruiter/jobs \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Position",
    "company": "Test Co",
    "location": "Dhaka",
    "applicationDeadline": "2025-02-01T18:00:00Z",
    "requiredSkills": ["Test"]
  }'
```

### Test Interview Scheduling
```bash
curl -X POST http://localhost:1350/api/calendar/schedule-interview \
  -H "Authorization: Bearer {recruiter_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": "student_id_123",
    "jobId": "job_id_456",
    "interviewTime": "2025-01-25T14:00:00Z",
    "meetingLink": "https://meet.google.com/test"
  }'
```

---

**Last Updated**: December 26, 2025
**API Version**: 2.0
**Status**: ✅ Production Ready
