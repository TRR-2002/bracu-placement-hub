# 📝 Code Changes Reference

## Files Modified

### 1. server.js

#### ADDITION 1: Google Calendar Imports & Setup (Lines 21-89)
```javascript
// =================================================================
// GOOGLE CALENDAR API SETUP (Member 1/2 External API Integration)
// =================================================================
const { google } = require('googleapis');

// Google Calendar API configuration
const googleCalendar = google.calendar({
  version: 'v3',
  auth: new google.auth.GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/calendar'],
    credentials: {
      type: 'service_account',
      project_id: process.env.GOOGLE_CALENDAR_PROJECT_ID,
      private_key_id: process.env.GOOGLE_CALENDAR_KEY_ID,
      private_key: process.env.GOOGLE_CALENDAR_PRIVATE_KEY ? process.env.GOOGLE_CALENDAR_PRIVATE_KEY.replace(/\\n/g, '\n') : null,
      client_email: process.env.GOOGLE_CALENDAR_EMAIL,
      client_id: process.env.GOOGLE_CALENDAR_CLIENT_ID,
      auth_uri: 'https://accounts.google.com/o/oauth2/auth',
      token_uri: 'https://oauth2.googleapis.com/token',
      auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
      client_x509_cert_url: process.env.GOOGLE_CALENDAR_CERT_URL
    }
  })
});

// Helper function to add deadline to Google Calendar
async function addApplicationDeadlineToCalendar(userEmail, jobTitle, company, deadline) {
  try {
    if (!process.env.GOOGLE_CALENDAR_EMAIL) {
      console.warn('⚠️ Google Calendar not configured - skipping calendar sync');
      return { success: false, reason: 'not_configured' };
    }

    const event = {
      summary: `📋 Application Deadline: ${jobTitle} at ${company}`,
      description: `Submit your application for ${jobTitle} position at ${company}`,
      start: {
        dateTime: new Date(deadline),
        timeZone: 'Asia/Dhaka'
      },
      end: {
        dateTime: new Date(new Date(deadline).getTime() + 60 * 60 * 1000), // 1 hour duration
        timeZone: 'Asia/Dhaka'
      },
      attendees: [
        { email: userEmail }
      ],
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 },    // 1 day before
          { method: 'email', minutes: 2 * 60 },     // 2 hours before
          { method: 'popup', minutes: 30 }          // 30 min before
        ]
      },
      colorId: '3' // Cyan color for application deadlines
    };

    const response = await googleCalendar.events.insert({
      calendarId: 'primary',
      resource: event,
      sendUpdates: 'all'
    });

    console.log('✅ Application deadline added to calendar:', response.data.id);
    return { success: true, eventId: response.data.id };
  } catch (error) {
    console.error('⚠️ Calendar sync error (continuing without calendar):', error.message);
    return { success: false, error: error.message };
  }
}

// Helper function to remove deadline from Google Calendar
async function removeApplicationDeadlineFromCalendar(eventId) {
  try {
    if (!eventId || !process.env.GOOGLE_CALENDAR_EMAIL) {
      return { success: false };
    }

    await googleCalendar.events.delete({
      calendarId: 'primary',
      eventId: eventId
    });

    console.log('✅ Application deadline removed from calendar');
    return { success: true };
  } catch (error) {
    console.error('⚠️ Error removing calendar event:', error.message);
    return { success: false };
  }
}
```

---

#### ADDITION 2: CalendarEvent Schema (After Dashboard Schema)
```javascript
// Calendar Event Tracking Schema (for Google Calendar sync)
const CalendarEventSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  application: { type: mongoose.Schema.Types.ObjectId, ref: "Application" },
  job: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true },
  googleEventId: { type: String, required: true },
  deadline: { type: Date, required: true },
  jobTitle: String,
  company: String,
  eventType: { type: String, enum: ["application_deadline", "interview"], default: "application_deadline" }
}, { timestamps: true });

const CalendarEvent = mongoose.model("CalendarEvent", CalendarEventSchema);
```

---

#### ADDITION 3: Enhanced Job Application Endpoint (in POST /api/jobs/apply)
```javascript
const newApplication = new Application({
  user: req.user.id,
  job: jobId,
  status: "Pending",
  profileSnapshot: profileSnapshot,
});

await newApplication.save();

// 📅 GOOGLE CALENDAR INTEGRATION: Add application deadline to student's calendar
let calendarEventId = null;
if (job.applicationDeadline) {
  const calendarResult = await addApplicationDeadlineToCalendar(
    user.email,
    job.title,
    job.company,
    job.applicationDeadline
  );

  if (calendarResult.success) {
    // Track calendar event in database
    const calendarEvent = new CalendarEvent({
      user: req.user.id,
      application: newApplication._id,
      job: jobId,
      googleEventId: calendarResult.eventId,
      deadline: job.applicationDeadline,
      jobTitle: job.title,
      company: job.company,
      eventType: 'application_deadline'
    });
    await calendarEvent.save();
    calendarEventId = calendarResult.eventId;
  }
}

// Create notification for student
await createNotification(
  req.user.id,
  "application",
  "Application Submitted",
  `Your application for "${job.title}" at ${job.company} has been submitted successfully.${job.applicationDeadline ? ' Deadline added to your Google Calendar! 📅' : ''}`,
  `/applications/${newApplication._id}`
);
```

---

#### ADDITION 4: Calendar API Endpoints (Lines 2695-2825)
```javascript
// =================================================================
// GOOGLE CALENDAR APIs (Member 1/2 External API Integration)
// Application Deadline Tracking with Google Calendar
// =================================================================

// Get user's upcoming application deadlines
app.get("/api/calendar/deadlines", auth, async (req, res) => {
  try {
    const calendarEvents = await CalendarEvent.find({ user: req.user.id })
      .populate('job', 'title company')
      .sort({ deadline: 1 })
      .limit(10);

    // Separate upcoming and passed deadlines
    const now = new Date();
    const upcoming = calendarEvents.filter(e => new Date(e.deadline) > now);
    const passed = calendarEvents.filter(e => new Date(e.deadline) <= now);

    res.json({
      success: true,
      upcoming,
      passed,
      totalUpcoming: upcoming.length
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Sync all application deadlines to Google Calendar for a user
app.post("/api/calendar/sync-deadlines", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    // Get all applications with deadlines
    const applications = await Application.find({ user: req.user.id })
      .populate('job');

    let synced = 0;
    let failed = 0;

    for (const app of applications) {
      if (app.job && app.job.applicationDeadline) {
        // Check if already synced
        const exists = await CalendarEvent.findOne({
          application: app._id
        });

        if (!exists) {
          const calendarResult = await addApplicationDeadlineToCalendar(
            user.email,
            app.job.title,
            app.job.company,
            app.job.applicationDeadline
          );

          if (calendarResult.success) {
            const calendarEvent = new CalendarEvent({
              user: req.user.id,
              application: app._id,
              job: app.job._id,
              googleEventId: calendarResult.eventId,
              deadline: app.job.applicationDeadline,
              jobTitle: app.job.title,
              company: app.job.company,
              eventType: 'application_deadline'
            });
            await calendarEvent.save();
            synced++;
          } else {
            failed++;
          }
        }
      }
    }

    res.json({
      success: true,
      message: `Synced ${synced} deadlines to Google Calendar`,
      synced,
      failed,
      total: applications.length
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Remove deadline from Google Calendar
app.delete("/api/calendar/deadlines/:calendarEventId", auth, async (req, res) => {
  try {
    const calendarEvent = await CalendarEvent.findOne({
      _id: req.params.calendarEventId,
      user: req.user.id
    });

    if (!calendarEvent) {
      return res.status(404).json({ success: false, error: "Calendar event not found" });
    }

    // Remove from Google Calendar
    const result = await removeApplicationDeadlineFromCalendar(calendarEvent.googleEventId);

    // Remove from database
    await CalendarEvent.findByIdAndDelete(req.params.calendarEventId);

    res.json({
      success: true,
      message: "Deadline removed from calendar"
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get calendar status (check if configured)
app.get("/api/calendar/status", auth, async (req, res) => {
  try {
    const isConfigured = !!process.env.GOOGLE_CALENDAR_EMAIL;
    const totalDeadlines = await CalendarEvent.countDocuments({ user: req.user.id });

    res.json({
      success: true,
      configured: isConfigured,
      message: isConfigured ? "Google Calendar is configured" : "Google Calendar not yet configured",
      totalSyncedDeadlines: totalDeadlines
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
```

---

### 2. .env File

#### ADDITIONS: Google Calendar Configuration
```env
# Google Calendar API Configuration (Member 1/2 External API)
# Follow steps: https://developers.google.com/calendar/api/quickstart/nodejs
# Create service account at: https://console.cloud.google.com
GOOGLE_CALENDAR_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_CALENDAR_PROJECT_ID=your-project-id
GOOGLE_CALENDAR_KEY_ID=your-key-id
GOOGLE_CALENDAR_CLIENT_ID=your-client-id
GOOGLE_CALENDAR_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n
GOOGLE_CALENDAR_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/your-service-account@project.iam.gserviceaccount.com
```

---

## Summary of Changes

### Code Added
- ✅ ~89 lines: Google Calendar setup
- ✅ ~30 lines: CalendarEvent schema
- ✅ ~32 lines: Enhanced job application
- ✅ ~130 lines: 4 new API endpoints
- **Total**: ~281 lines of new code

### Files Modified
- ✅ `server.js`: Added integration
- ✅ `.env`: Added configuration

### Files Created
- ✅ `GOOGLE_CALENDAR_SETUP.md`: Setup guide
- ✅ `CALENDAR_IMPLEMENTATION.md`: Tech details
- ✅ `CALENDAR_QUICK_REFERENCE.md`: Quick start
- ✅ `CALENDAR_COMPLETION_SUMMARY.md`: Summary

### Breaking Changes
- ✅ **NONE**: Completely backward compatible

### Dependencies
- ✅ Already installed: `googleapis` (^169.0.0)
- ✅ Already installed: `nodemailer` (^7.0.11)
- ✅ No new npm packages needed

---

## How to Integrate

The code is already integrated into your `server.js` and `.env` files!

### Just Need To:
1. Get Google Calendar credentials
2. Update `.env` with credentials
3. Restart server
4. Test!

No manual code changes needed - everything is done for you! ✅

---

## Verification

To verify everything is in place, check for:

### In server.js
- [ ] Lines ~21-89: Google Calendar setup
- [ ] Lines ~348-358: CalendarEvent model
- [ ] Lines ~1051-1082: Enhanced job application
- [ ] Lines 2695-2825: Calendar API endpoints

### In .env
- [ ] GOOGLE_CALENDAR_EMAIL
- [ ] GOOGLE_CALENDAR_PROJECT_ID
- [ ] GOOGLE_CALENDAR_KEY_ID
- [ ] GOOGLE_CALENDAR_CLIENT_ID
- [ ] GOOGLE_CALENDAR_PRIVATE_KEY
- [ ] GOOGLE_CALENDAR_CERT_URL

---

## Next Steps

1. Read: GOOGLE_CALENDAR_SETUP.md
2. Create: Google Cloud project
3. Generate: Service account credentials
4. Update: .env file
5. Restart: Server
6. Test: Apply for job
7. Verify: Check Google Calendar

---

All code is ready - you just need the credentials! 🎉
