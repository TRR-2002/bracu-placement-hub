# Calendar Integration - Frontend Guide

## Overview
Calendar components have been added to display events synced with Google Calendar. Users can view:
- **Calendar View**: Interactive monthly calendar with event indicators
- **Deadlines**: Application deadline countdown with urgency indicators
- **Interviews**: Interview schedule with status tracking

## Components Created

### 1. **CalendarView.jsx** (`src/components/CalendarView.jsx`)
Interactive calendar display showing all synced events.

**Features:**
- Monthly calendar navigation
- Event indicators on calendar days
- Click dates to see event details
- Upcoming deadlines list (sidebar)
- Event color coding:
  - Blue: Application deadlines
  - Red: Interviews
  - Cyan: Recruitment drives

**Usage:**
```jsx
import CalendarView from '../components/CalendarView';

<CalendarView token={authToken} />
```

---

### 2. **DeadlineCountdown.jsx** (`src/components/DeadlineCountdown.jsx`)
Deadline tracking with countdown timers and urgency indicators.

**Features:**
- Real-time countdown display
- Urgency levels (< 3 days = urgent)
- Progress bars showing time remaining
- Color-coded status (blue/red/green)
- Auto-refreshes every minute
- Status legend

**Usage:**
```jsx
import DeadlineCountdown from '../components/DeadlineCountdown';

<DeadlineCountdown token={authToken} />
```

---

### 3. **InterviewSchedule.jsx** (`src/components/InterviewSchedule.jsx`)
Interview management with scheduling and status tracking.

**Features:**
- Upcoming, past, and all interview filters
- Status badges (Today, This Week, Upcoming, Completed)
- Time until interview display
- Add to calendar button
- Join meeting button
- Interview count by status

**Usage:**
```jsx
import InterviewSchedule from '../components/InterviewSchedule';

<InterviewSchedule token={authToken} />
```

---

### 4. **CalendarPage.jsx** (`src/pages/CalendarPage.jsx`)
Main page combining all calendar components with tab navigation.

**Features:**
- Tab-based navigation (Calendar, Deadlines, Interviews)
- Responsive design
- Info footer with tips
- Authentication check

**Route:** `/calendar`

**Usage:**
```jsx
// In App.jsx or Router setup
import CalendarPage from './pages/CalendarPage';

const router = createBrowserRouter([
  {
    path: "/calendar",
    element: <CalendarPage />,
  },
]);
```

---

## API Endpoints Used

All components use these backend endpoints:

### 1. Get User's Calendar Deadlines
```
GET /api/calendar/deadlines
Authorization: Bearer {token}

Response:
{
  success: true,
  upcoming: [...],
  passed: [...],
  totalUpcoming: number
}
```

### 2. Get Calendar Status
```
GET /api/calendar/status
Authorization: Bearer {token}

Response:
{
  success: true,
  configured: true,
  message: "Google Calendar is configured",
  totalSyncedDeadlines: number
}
```

---

## Event Color Scheme

| Event Type | Color | Used For |
|-----------|-------|----------|
| Application Deadline | Cyan (#06B6D4) | Application deadlines |
| Interview | Red (#EF4444) | Interview scheduling |
| Recruitment Drive | Blue (#3B82F6) | Recruitment events |

---

## How It Works

### Data Flow
```
Backend (Google Calendar) 
    ↓
API Endpoints (/api/calendar/*)
    ↓
CalendarPage.jsx (Main Container)
    ↓
CalendarView / DeadlineCountdown / InterviewSchedule
    ↓
User Interface
```

### Event Syncing
1. When a student applies to a job → Backend creates Cyan event
2. When recruiter schedules interview → Backend creates Red event  
3. When recruitment drive is created → Backend creates Blue event
4. Events synced to Google Calendar Service Account
5. CalendarPage fetches and displays them

---

## Features

### Smart Filtering
- **Calendar**: Shows all events across all months
- **Deadlines**: Filters to only deadline events, sorted by date
- **Interviews**: Filters to interview events with status tracking

### Responsive Design
- Mobile-friendly
- Tablet optimized
- Desktop full-featured

### Real-time Updates
- Auto-refresh every 60 seconds
- Manual refresh button
- Live countdown timers

### User Feedback
- Loading states
- Error messages
- Empty states with helpful text
- Status badges and indicators

---

## Integration Steps

### 1. Already Added to Router
The route has been added to `src/main.jsx`:
```jsx
{
  path: "/calendar",
  element: <CalendarPage />,
}
```

### 2. Add Navigation Link (Optional)
Update your navigation component to include:
```jsx
<Link to="/calendar">📅 My Calendar</Link>
```

### 3. Test
1. Start frontend: `npm run dev`
2. Navigate to: `http://localhost:5173/calendar`
3. Login with your auth token
4. Should display three tabs

---

## Environment Setup

Ensure backend is running:
```bash
cd bracu-placement-hub-backend
npm start
# Should be running on http://localhost:1350
```

Start frontend:
```bash
cd bracu-placement-hub-frontend
npm run dev
# Should be running on http://localhost:5173
```

---

## Customization

### Change Colors
Edit component files to modify the color scheme:

**CalendarView.jsx** - Line ~180:
```jsx
const getEventColor = (event) => {
  if (event.eventType === 'interview') return 'bg-red-100 border-red-300 text-red-800';
  // Change colors here
};
```

### Adjust Refresh Rate
**DeadlineCountdown.jsx** - Line ~17:
```jsx
const interval = setInterval(fetchDeadlines, 60000); // Change 60000 to desired ms
```

### Modify Urgency Level
**DeadlineCountdown.jsx** - Line ~50:
```jsx
const isUrgent = days < 3; // Change 3 to desired day threshold
```

---

## Troubleshooting

### Calendar not loading
- ✅ Check backend is running on port 1350
- ✅ Verify token is valid
- ✅ Check browser console for errors

### No events showing
- ✅ Make sure you have applied to jobs or scheduled interviews
- ✅ Backend should have synced events to MongoDB
- ✅ Check `/api/calendar/status` endpoint

### API errors
- ✅ Verify `Authorization` header has valid Bearer token
- ✅ Check CORS is configured in backend
- ✅ Ensure token hasn't expired

---

## Next Steps

### Optional Enhancements
1. Add Google Calendar export button
2. Add event details modal
3. Add reminder notifications
4. Add filter by company
5. Add calendar sync toggle
6. Add event color customization

### Backend Features (Already Implemented)
✅ Application deadline syncing
✅ Interview scheduling
✅ Recruitment drive events
✅ Event color coding
✅ Automatic reminders
✅ Database tracking

---

## Files Created

```
src/
  ├── components/
  │   ├── CalendarView.jsx          (Interactive calendar)
  │   ├── DeadlineCountdown.jsx     (Deadline tracker)
  │   └── InterviewSchedule.jsx     (Interview manager)
  ├── pages/
  │   └── CalendarPage.jsx          (Main calendar page)
  └── main.jsx                       (Updated with calendar route)
```

---

## Notes

- All times display in user's local timezone
- Calendar fetches data on mount and every 60 seconds
- Empty states guide users if no events exist
- Mobile responsive - works on all devices
- Uses Tailwind CSS for styling
- Uses lucide-react icons

---

## Support

For issues or questions:
1. Check browser console for errors
2. Verify backend is running
3. Test API endpoints with Postman
4. Check that events exist in database
