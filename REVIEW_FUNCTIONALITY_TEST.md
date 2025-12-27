# Review Functionality - Complete Test Guide

## Overview
Review system now supports full CRUD operations: Create, Read, Update, Delete

---

## Features Implemented

### 1. **ADD REVIEW** ✅
**Location:** Company Profile Page → "Write Review" button

**How to test:**
1. Navigate to any company profile page
2. Click "Write Review" button
3. Fill in the form:
   - Overall Rating (1-5)
   - Work Culture Rating (1-5)
   - Salary Rating (1-5)
   - Career Growth Rating (1-5)
   - Comment (optional)
4. Click "Submit Review"

**Expected Results:**
- Review appears in the reviews list
- User cannot submit duplicate reviews (error message shown)
- If flagged by AI moderation, shows message: "Your review has been submitted and is under moderation."
- Average rating updates in the header

**Backend Endpoint:**
```
POST /api/reviews/submit
Body: { companyId, rating, workCulture, salary, careerGrowth, comment }
```

---

### 2. **VIEW REVIEWS** ✅
**Location:** Company Profile Page → Reviews section

**How to test:**
1. Navigate to any company profile
2. Scroll to "Reviews" section at bottom
3. See all reviews displayed with:
   - Overall rating (stars)
   - Work Culture, Salary, Career Growth ratings
   - Reviewer name and date
   - Full comment text
   - "Flagged" badge (if flagged by AI)

**Features:**
- Reviews sorted by newest first
- Shows "No reviews yet" message if empty
- Rating breakdown card shows averages for:
  - Overall
  - Work Culture
  - Salary
  - Career Growth

**Backend Endpoint:**
```
GET /api/reviews/company/:companyId
Response: { reviews: [...], stats: { totalReviews, averageRating, ... } }
```

---

### 3. **EDIT REVIEW** ✅ (NEW)
**Location:** Your own review → "✏️ Edit" button

**How to test:**
1. Navigate to a company where you wrote a review
2. Find your review in the list (shows Edit/Delete buttons for your reviews only)
3. Click "✏️ Edit" button
4. Modal opens with title: "Edit Your Review"
5. Modify any ratings or comment
6. Click "Update Review"

**Expected Results:**
- Review updates immediately
- Changes reflected in rating breakdown
- Updated timestamp not changed (backend timestamp preserved)
- Only your own reviews show edit button

**Visibility Rules:**
- Edit/Delete buttons only appear on YOUR reviews
- Shows when: `userInfo._id === review.reviewer._id`

**Backend Endpoint:**
```
PUT /api/reviews/:reviewId
Body: { rating, workCulture, salary, careerGrowth, comment }
Auth Required: Bearer token (reviewer must be logged-in user)
Error if: Review belongs to different user
```

---

### 4. **DELETE REVIEW** ✅ (NEW)
**Location:** Your own review → "🗑️ Delete" button

**How to test:**
1. Navigate to a company where you wrote a review
2. Find your review in the list
3. Click "🗑️ Delete" button
4. Confirmation dialog appears: "Are you sure you want to delete this review?"
5. Click "OK" to confirm

**Expected Results:**
- Review is permanently removed
- Rating breakdown recalculates without deleted review
- Success message: "Review deleted successfully!"
- Page refreshes to show updated list

**Visibility Rules:**
- Delete button only appears on YOUR reviews
- Admins can also delete any review (not UI visible, backend only)

**Backend Endpoint:**
```
DELETE /api/reviews/:reviewId
Auth Required: Bearer token
Allowed Users: 
  - Original reviewer
  - Admins (role === 'admin')
```

---

### 5. **RATING BREAKDOWN CARD** ✅
**Location:** Below company info, above reviews list

**Shows:**
- Overall rating (average)
- Work Culture rating (average)
- Salary rating (average)
- Career Growth rating (average)

**Conditions:**
- Only displays if company has at least 1 review
- Updates automatically when reviews are added/edited/deleted
- Color-coded display for each metric

---

## Security Features

### ✅ Authorization
- Users can only edit their own reviews
- Users can only delete their own reviews
- Admins can delete any review
- Reviewer ID verified server-side

### ✅ Content Moderation
- AI content moderation on all comments
- Flagged reviews marked in UI
- Admin notified when content flagged
- Review not visible if moderated (pending review)

---

## Complete Test Checklist

### Create Review
- [ ] Navigate to company profile
- [ ] Click "Write Review"
- [ ] Fill all required fields
- [ ] Submit successfully
- [ ] Review appears in list
- [ ] Rating breakdown updates
- [ ] Try duplicate (should error)

### View Reviews
- [ ] Reviews display with all ratings
- [ ] Reviewer name and date shown
- [ ] Stars render correctly
- [ ] Comment text displays
- [ ] Flagged badge shows if applicable
- [ ] Rating breakdown card accurate

### Edit Review
- [ ] Own review shows Edit button
- [ ] Click Edit opens modal
- [ ] Modal title says "Edit Your Review"
- [ ] Can change all fields
- [ ] Click Update saves changes
- [ ] Changes reflected immediately
- [ ] Other users' reviews don't have Edit button

### Delete Review
- [ ] Own review shows Delete button
- [ ] Click Delete shows confirmation
- [ ] Cancel doesn't delete
- [ ] Confirm deletes review
- [ ] List updates after delete
- [ ] Rating breakdown recalculates
- [ ] Other users' reviews don't have Delete button

### Edge Cases
- [ ] User can review multiple companies
- [ ] One review per company per user (constraint)
- [ ] Edit doesn't allow duplicate reviews
- [ ] Delete works even if flagged
- [ ] Rating validation (1-5 range)
- [ ] Comment can be empty
- [ ] Large comments display correctly

---

## API Summary

### POST /api/reviews/submit
Create a new review

### GET /api/reviews/company/:companyId
Get all reviews for a company + stats

### GET /api/reviews/my-reviews
Get all your reviews

### PUT /api/reviews/:reviewId
Edit existing review (must be reviewer)

### DELETE /api/reviews/:reviewId
Delete review (must be reviewer or admin)

---

## Frontend Components Updated

- **CompanyProfilePage.jsx**
  - Added edit state (`editingReviewId`)
  - Added user info state (`userInfo`)
  - New handlers: `handleEditReview`, `handleDeleteReview`
  - Updated form for edit/create mode
  - Added Edit/Delete buttons to review cards

---

## Backend Endpoints Added

- `PUT /api/reviews/:reviewId` - Edit review
- `DELETE /api/reviews/:reviewId` - Delete review
- `GET /api/reviews/my-reviews` - Get user's reviews

---

## Known Limitations

- ⚠️ No pagination (all reviews load at once)
- ⚠️ No filtering by rating or date
- ⚠️ No comment sorting/filtering
- ⚠️ No upload for review documents/media

---

## Testing Tips

1. **Create multiple test accounts** to verify you can't edit others' reviews
2. **Try AI moderation** by adding offensive content to test flagging
3. **Check timestamp** doesn't change on edit
4. **Test rating breakdown** math accuracy with multiple reviews
5. **Verify mobile responsiveness** of review cards and buttons

