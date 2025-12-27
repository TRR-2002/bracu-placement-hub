# 🔧 Google Calendar Integration - Troubleshooting Guide

## Quick Diagnostics

### Check if Calendar is Configured

```bash
# In backend directory
curl -X GET http://localhost:1350/api/calendar/status \
  -H "Authorization: Bearer {your_token}"
```

**Expected Response:**
```json
{
  "success": true,
  "configured": true,
  "message": "Google Calendar is configured",
  "totalSyncedDeadlines": 3
}
```

---

## Common Issues & Solutions

### ❌ Issue 1: "Calendar is not configured"

**Symptoms:**
- Job posting succeeds but no calendar event created
- Interview scheduling fails
- Response: `{ "success": false, "reason": "not_configured" }`

**Root Causes:**
1. Google Calendar credentials not in `.env`
2. Missing required environment variables
3. Invalid service account credentials

**Solutions:**

**Step 1: Check .env file exists**
```bash
# In backend root directory
ls -la .env
cat .env | grep GOOGLE_CALENDAR
```

**Step 2: Verify all 6 required variables**
```bash
echo $GOOGLE_CALENDAR_EMAIL
echo $GOOGLE_CALENDAR_PROJECT_ID
echo $GOOGLE_CALENDAR_KEY_ID
echo $GOOGLE_CALENDAR_CLIENT_ID
echo $GOOGLE_CALENDAR_PRIVATE_KEY
echo $GOOGLE_CALENDAR_CERT_URL
```

All should output values (not empty).

**Step 3: Check JSON format of PRIVATE_KEY**
```bash
# Should be a valid JSON escaped string
echo $GOOGLE_CALENDAR_PRIVATE_KEY | head -20
# Should start with: -----BEGIN PRIVATE KEY-----
```

**Step 4: Restart backend server**
```bash
# Stop current server (Ctrl+C)
# Then restart
npm start
```

**Step 5: Test calendar status again**
```bash
curl -X GET http://localhost:1350/api/calendar/status \
  -H "Authorization: Bearer {token}"
```

**If still failing:** Check server logs for initialization errors on startup.

---

### ❌ Issue 2: "Error creating calendar event"

**Symptoms:**
- Creating job fails completely
- Response: `{ "success": false, "error": "Error creating calendar event" }`
- Server logs show Google API error

**Root Causes:**
1. Invalid credentials format
2. Service account has no Calendar API access
3. Google API disabled on project
4. Quota exceeded

**Solutions:**

**Step 1: Check server logs for specific error**
```bash
# Look for errors like:
# - "invalid_grant"
# - "permission_denied"
# - "RESOURCE_EXHAUSTED"
```

**Step 2: Re-generate service account key**
- Go to Google Cloud Console
- Select project
- Service Accounts → Select account
- Delete existing key
- Create new JSON key
- Copy credentials to .env

**Step 3: Enable Calendar API**
- Google Cloud Console
- APIs & Services → Library
- Search "Google Calendar API"
- Click "ENABLE"
- Wait 2-3 minutes

**Step 4: Check quota**
- Google Cloud Console
- APIs & Services → Quotas
- Search "Calendar"
- Check if quota is exceeded
- If yes, request increase

**Step 5: Verify service account has Editor role**
- Google Cloud Console
- IAM & Admin → IAM
- Find service account row
- Edit → Add "Editor" role if missing

**Step 6: Test API directly**
```javascript
// In Node.js console (npm start, then Ctrl+C to stop, then run)
const { google } = require('googleapis');
const auth = new google.auth.GoogleAuth({
  keyFile: 'path/to/keyfile.json',
  scopes: ['https://www.googleapis.com/auth/calendar']
});

const cal = google.calendar({ version: 'v3', auth });
cal.calendarList.list({}, (err, res) => {
  if (err) console.error('ERROR:', err);
  else console.log('SUCCESS:', res.data.items.length, 'calendars');
});
```

---

### ❌ Issue 3: "Students not receiving calendar invites"

**Symptoms:**
- Interview scheduled successfully
- Student email shows in response
- But student doesn't get calendar invite
- Event doesn't appear in student's calendar

**Root Causes:**
1. Student email is wrong
2. Email forwarding issue at BRACU
3. Invite sent but caught in spam
4. Invalid OAuth scope

**Solutions:**

**Step 1: Verify student email format**
```javascript
// Should be exactly: firstname@g.bracu.ac.bd
// NOT: firstname@bracu.ac.bd
// NOT: student@gmail.com

// Check email in response
POST /api/calendar/schedule-interview
Response: { calendarEvent: { studentEmail: "student@g.bracu.ac.bd" } }
// Should have "@g.bracu.ac.bd" domain
```

**Step 2: Check Gmail forwarding rules**
- Ask student to check: Settings → Forwarding and POP/IMAP
- Ensure forwarding is not breaking calendar invites

**Step 3: Check spam folder**
- Ask student to check Spam/Junk folder in Gmail
- Add `noreply@google.com` to contacts to prevent blocking

**Step 4: Check OAuth scope**
```javascript
// In server.js, look for:
const auth = new google.auth.GoogleAuth({
  keyFile: process.env.GOOGLE_CALENDAR_KEYFILE,
  scopes: ['https://www.googleapis.com/auth/calendar']
});

// Should have EXACTLY this scope (not just "calendar")
```

**Step 5: Resend invite**
- Delete event from Google Calendar
- Schedule interview again
- Student should receive new invite

---

### ❌ Issue 4: "Can't delete calendar events"

**Symptoms:**
- Job deadline event can't be deleted
- Response: `{ "success": false, "error": "..." }`
- DELETE request fails

**Root Causes:**
1. Event was created by service account
2. Student doesn't have permission
3. Event ID is invalid
4. Event already deleted from Google Calendar

**Solutions:**

**Step 1: Verify event ID**
```javascript
// Event ID should be stored in CalendarEvent collection
// Check in MongoDB:
db.calendarevents.findOne({ _id: ObjectId("...") })

// Should show:
// { _id: ..., googleEventId: "aBc123xyz", ... }
```

**Step 2: Check permissions**
```javascript
// Only the creator can delete:
// - Student deletes their own deadline events
// - Recruiter can delete their own job events
// - Interview event can be deleted by either party
```

**Step 3: Verify event still exists in Google**
```bash
# In Google Calendar UI
# Or use API:
GET https://www.googleapis.com/calendar/v3/calendars/primary/events/{eventId}
# If 404: event already deleted
```

**Step 4: Clear local database**
```javascript
// If event exists locally but not in Google:
db.calendarevents.deleteOne({ googleEventId: "abc123" })

// Try DELETE again
```

---

### ❌ Issue 5: "Color ID wrong for events"

**Symptoms:**
- Interview shows Purple instead of Red
- Job shows Blue instead of Purple
- Deadline shows wrong color

**Root Causes:**
1. Wrong colorId in helper function
2. Calendar doesn't support colorId
3. Different timezone affecting display

**Solutions:**

**Step 1: Check color mapping**
```javascript
// In server.js, look for createJobPostingEvent():
// Should have: colorId: '5' (Purple)

// createRecruitmentDriveEvent():
// Should have: colorId: '2' (Blue)

// scheduleInterviewSlot():
// Should have: colorId: '1' (Red)

// Application deadlines:
// Should have: colorId: '3' (Cyan)
```

**Step 2: Valid colorId values**
```
1 = Peacock (Cyan)
2 = Flamingo (Pink)  
3 = Tangerine (Orange)
4 = Banana (Yellow)
5 = Sage (Green)
6 = Basil (Dark Green)
7 = Peacock (Blue) ← Use for recruitment drives
8 = Blueberry (Dark Blue)
9 = Lavender (Purple) ← Use for job postings
10 = Grape (Purple)
11 = Graphite (Gray)

// For our case:
// Purple: '5' (Sage) or '9' (Lavender)
// Red: '1' (Peacock)
// Blue: '2' (Flamingo) or '8' (Blueberry)
// Cyan: '3' (Tangerine) or '1' (Peacock)
```

**Step 3: Update color IDs if needed**
- Edit server.js helper functions
- Change `colorId` values
- Restart server
- New events will use new colors

**Note:** Existing events won't change color retroactively.

---

### ❌ Issue 6: "Reminders not triggering"

**Symptoms:**
- Event created successfully
- But no email/popup reminders
- Student misses deadline

**Root Causes:**
1. Wrong reminder format
2. Reminder time in past
3. Gmail notifications disabled
4. Calendar notifications disabled

**Solutions:**

**Step 1: Check reminder configuration**
```javascript
// In server.js, look for reminder setup:
reminders: {
  useDefault: false,
  overrides: [
    { method: 'email', minutes: 1440 },  // 1 day
    { method: 'popup', minutes: 30 }     // 30 min
  ]
}

// 'minutes' must be positive integer
// 'method' must be 'email' or 'popup'
```

**Step 2: Enable Gmail notifications**
- Gmail Settings → Notifications
- Under "Notification settings" → Enable all options
- Save

**Step 3: Enable Google Calendar notifications**
- Google Calendar → Settings → Notifications
- Ensure notification methods enabled
- Check email and browser notifications

**Step 4: Check timezone**
```javascript
// Reminders calculated from event startTime
// Make sure startTime is correct ISO 8601 format
// "2025-01-25T18:00:00Z"  ✅ Correct
// "2025-01-25T18:00:00"   ❌ Wrong (no timezone)

// In server.js:
timeZone: 'Asia/Dhaka'
// Should match your timezone
```

**Step 5: Test reminder manually**
- Go to Google Calendar
- Edit event
- Set reminder to "Now" (-0 minutes)
- Save
- Should get immediate reminder

---

### ❌ Issue 7: "Deadline closure not working"

**Symptoms:**
- Deadline passes but job still "Open"
- Students can still apply
- Cron job not running

**Root Causes:**
1. Cron job not configured
2. Wrong timezone comparison
3. Database not updated

**Solutions:**

**Step 1: Check if cron is running**
```bash
# In server logs, should see:
# "[CRON] Checking for expired application deadlines..."
# Every hour at :00 minutes

# Check server startup logs for:
# "Job deadline closure scheduler started"
```

**Step 2: Verify cron schedule**
```javascript
// In server.js, look for:
schedule.scheduleJob('0 * * * *', async () => {
  // This should run every hour at :00
});

// '0 * * * *' = every hour
// Should be correct
```

**Step 3: Check timezone in deadline comparison**
```javascript
// Should compare with current time in Asia/Dhaka timezone
const now = moment().tz('Asia/Dhaka');
const deadline = moment(job.applicationDeadline);

if (now.isAfter(deadline)) {
  // Close job
}
```

**Step 4: Manually trigger cron**
- Stop server (Ctrl+C)
- Restart server
- Check logs for first run
- Should process within 1 minute

**Step 5: Force check specific job**
```bash
# Get job's deadline
GET /api/jobs/{jobId}
# Note the applicationDeadline

# Check if past your current time
# If yes, job should be closed soon
```

**Step 6: Check database update**
```javascript
// In MongoDB:
db.jobs.findOne({ _id: ObjectId("...") })
// Look for: "status": "Closed"
// If still "Open" after deadline: cron didn't run
```

---

### ❌ Issue 8: "Too many calendar events in quota"

**Symptoms:**
- Creating new events starts failing
- Response: `quota_exceeded` or `RESOURCE_EXHAUSTED`
- Suddenly stops working after working fine

**Root Causes:**
1. Daily API quota exceeded
2. Test events not cleaned up
3. Sync loop creating duplicates

**Solutions:**

**Step 1: Check current quota usage**
- Google Cloud Console
- APIs & Services → Quotas
- Search "Calendar"
- View current usage vs limit

**Step 2: Clean up test events**
```javascript
// In Google Calendar UI:
// Search for "test"
// Delete all test events manually

// Or use API to list & delete:
GET https://www.googleapis.com/calendar/v3/calendars/primary/events
DELETE each test event
```

**Step 3: Check for duplicate syncing**
```javascript
// In MongoDB:
db.calendarevents.aggregate([
  { $group: { _id: "$googleEventId", count: { $sum: 1 } } },
  { $match: { count: { $gt: 1 } } }
])

// If results show duplicates:
// Delete duplicate records
```

**Step 4: Request quota increase**
- Google Cloud Console
- APIs & Services → Quotas
- Select Calendar API
- Click "EDIT QUOTAS"
- Request increase for Quota "Queries per day"
- Takes 1-2 hours

**Step 5: Implement rate limiting** (optional)
```javascript
// Add in server.js:
const rateLimit = require('express-rate-limit');
const eventLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10 // max 10 events per minute
});

app.post('/api/recruiter/jobs', eventLimiter, ...);
```

---

## Debug Mode

### Enable detailed logging

```javascript
// In server.js, at top:
const DEBUG_CALENDAR = true;

// In helper functions:
if (DEBUG_CALENDAR) {
  console.log('📅 Creating event:', { summary, startTime, endTime });
}

// Then search logs for "📅"
```

### Check all calendar events

```bash
# Using Google Calendar API directly:
curl -H "Authorization: Bearer {ACCESS_TOKEN}" \
  "https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=50" \
  | jq '.items[] | {id, summary, start, colorId}'
```

### Test calendar connection

```javascript
// Quick test script
const { google } = require('googleapis');

const auth = new google.auth.GoogleAuth({
  keyFile: './google-calendar-key.json',
  scopes: ['https://www.googleapis.com/auth/calendar']
});

async function test() {
  const calendar = google.calendar({ version: 'v3', auth });
  
  try {
    const response = await calendar.calendarList.list();
    console.log('✅ Connected to Google Calendar');
    console.log('📅 Your calendars:', response.data.items.map(c => c.summary));
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
  }
}

test();
```

---

## Prevention & Best Practices

### ✅ Do's
- ✅ Always verify email format before scheduling
- ✅ Check calendar status on app startup
- ✅ Log all calendar API calls
- ✅ Test in dev environment first
- ✅ Keep credentials secure in .env
- ✅ Monitor quota usage weekly
- ✅ Set up alerts for API errors
- ✅ Backup calendar events data

### ❌ Don'ts
- ❌ Don't hardcode credentials in code
- ❌ Don't share service account key file
- ❌ Don't create events with invalid timezones
- ❌ Don't skip error handling for API calls
- ❌ Don't store sensitive data in logs
- ❌ Don't ignore quota warnings
- ❌ Don't modify credentials while server running
- ❌ Don't create duplicate events without cleanup

---

## Support Resources

**Google Calendar API Documentation:**
https://developers.google.com/calendar/api/guides

**Service Account Setup:**
https://developers.google.com/identity/protocols/oauth2/service-account

**OAuth 2.0 Troubleshooting:**
https://developers.google.com/identity/protocols/oauth2/troubleshoot-auth-flows

**Rate Limits:**
https://developers.google.com/calendar/api/guides/rate-limits-and-quotas

---

## Emergency Contacts

**If nothing works:**

1. Restart backend server
2. Check .env file
3. Verify Google Cloud permissions
4. Check server logs for stack trace
5. If still broken: Re-generate service account key from scratch

**Last Resort:**
- Disable calendar temporarily: Comment out calendar functions
- App will still work, just without calendar sync
- Fix calendar later without breaking application

---

**Last Updated**: December 26, 2025
**Version**: 1.0
**Status**: ✅ Complete
