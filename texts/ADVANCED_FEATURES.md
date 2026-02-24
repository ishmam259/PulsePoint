# PulsePoint HMS - Advanced Booking Features Setup Guide

This guide covers the advanced booking features including cascading search, appointment slot grid, triage notes, and notifications.

## New Database Tables

The following tables have been added to support advanced booking features:

### 1. doctor_schedules

Stores doctor availability schedules for different facilities.

```sql
CREATE TABLE doctor_schedules (
    schedule_id SERIAL PRIMARY KEY,
    doctor_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    facility_type VARCHAR(50) CHECK (facility_type IN ('hospital', 'chamber')),
    facility_id INT NOT NULL,
    day_of_week INT CHECK (day_of_week BETWEEN 0 AND 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    slot_duration INT DEFAULT 30,
    consultation_fee DECIMAL(10, 2),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 2. appointment_slots

Individual bookable time slots generated from schedules.

```sql
CREATE TABLE appointment_slots (
    slot_id SERIAL PRIMARY KEY,
    schedule_id INT REFERENCES doctor_schedules(schedule_id) ON DELETE CASCADE,
    slot_date DATE NOT NULL,
    slot_time TIME NOT NULL,
    status VARCHAR(20) DEFAULT 'free' CHECK (status IN ('free', 'booked', 'blocked')),
    appointment_id INT REFERENCES appointments(appt_id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 3. triage_notes

Pre-appointment triage information from patients.

```sql
CREATE TABLE triage_notes (
    triage_id SERIAL PRIMARY KEY,
    appointment_id INT REFERENCES appointments(appt_id) ON DELETE CASCADE,
    symptoms TEXT NOT NULL,
    severity VARCHAR(20) CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    triage_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 4. notifications

System notifications for appointment changes.

```sql
CREATE TABLE notifications (
    notification_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Database Setup

**IMPORTANT**: You need to run the schema enhancements to add these tables to your database.

### Windows (if psql is in PATH):

```bash
psql -U ishmam -d hospital_management -f schema_enhancements.sql
```

### Alternative - Using pgAdmin or DBeaver:

1. Open schema_enhancements.sql
2. Copy all the SQL content
3. Open your database tool and connect to `hospital_management` database
4. Paste and execute the SQL statements

## New Backend Features

### 1. Search Controller (Cascading Filters)

**File**: `server/src/controllers/searchController.js`

Endpoints:

- `GET /api/search/doctors` - Search doctors with filters
  - Query params: `specialization`, `location`, `facility_type`, `facility_id`, `doctor_name`
- `GET /api/search/locations` - Get all unique locations
  - Query params: `specialization` (optional)
- `GET /api/search/facilities` - Get facilities by location
  - Query params: `location`, `type` (hospital/chamber)

### 2. Schedule Controller (Slot Management)

**File**: `server/src/controllers/scheduleController.js`

Endpoints:

- `GET /api/schedules/doctor/:doctorId` - Get all schedules for a doctor
- `POST /api/schedules` - Create a new schedule
- `GET /api/schedules/slots/:doctorId` - Get available slots
  - Query params: `start_date`, `end_date`
- `POST /api/schedules/:scheduleId/generate-slots` - Generate slots from schedule
- `POST /api/schedules/book-slot` - Book an appointment slot
  - Body: `{ slot_id, patient_id, doctor_id, triage_notes }`
- `PUT /api/schedules/slot/:slotId` - Update slot status

### 3. Notification Controller

**File**: `server/src/controllers/notificationController.js`

Endpoints:

- `GET /api/notifications/:userId` - Get all notifications for user
- `GET /api/notifications/unread-count/:userId` - Get unread count
- `PUT /api/notifications/:notificationId/read` - Mark notification as read
- `PUT /api/notifications/:userId/read-all` - Mark all as read

### 4. Enhanced Appointment Controller

**Updated**: `server/src/controllers/appointmentController.js`

- `GET /api/appointments/patient/:patientId?filter=today|upcoming|past`
  - Now includes triage notes, location, and consultation fee in response

## New Frontend Components

### 1. DoctorSearch Component

**File**: `client/src/components/DoctorSearch.jsx`

**Purpose**: Implements the 5-step cascading search filter:

1. Select Specialization
2. Select Location
3. Select Facility Type (Hospital/Chamber)
4. Select Specific Facility
5. Optional: Search by Doctor Name

**Features**:

- Real-time cascading dropdowns
- Results display with all doctor facilities
- "Book Appointment" button per doctor
- Responsive design with Tailwind CSS

**Usage**:

```jsx
<DoctorSearch
  onSelectDoctor={(doctor) => {
    // Handle doctor selection
    console.log("Selected doctor:", doctor);
  }}
/>
```

### 2. AppointmentGrid Component

**File**: `client/src/components/AppointmentGrid.jsx`

**Purpose**: Visual slot booking interface with color-coded statuses.

**Color Coding**:

- 🟢 **Green**: Hospital slot - Free (clickable)
- 🔵 **Blue**: Clinic/Chamber slot - Free (clickable)
- 🔴 **Red**: Hospital slot - Booked (not clickable)
- 🟠 **Orange**: Clinic/Chamber slot - Booked (not clickable)
- ⚫ **Gray**: Blocked slot with ✕ icon (not clickable)

**Features**:

- 2-week ahead view
- Grouped by date with day headers
- Click on free slots to book
- Booking modal with triage notes form
- Real-time slot updates after booking

**Usage**:

```jsx
<AppointmentGrid doctor={selectedDoctor} patientId={currentPatientId} />
```

### 3. PatientDashboard Component

**File**: `client/src/components/PatientDashboard.jsx`

**Purpose**: Patient's appointment management dashboard with tabs.

**Tabs**:

- 📍 **Today**: Highlighted appointments for current day
- 📅 **Upcoming**: Future appointments sorted by date
- 🕒 **Past**: Historical appointments

**Features**:

- Notification bell with unread count badge
- Triage information display
- Cancel button for future appointments
- Status badges (confirmed, pending, cancelled)
- Severity indicators for triage notes

**Usage**:

```jsx
<PatientDashboard patientId={1} />
```

## Frontend API Service Updates

**File**: `client/src/services/api.js`

### New API Exports:

```javascript
// Search API
export const searchAPI = {
  searchDoctors: (params) => api.get("/search/doctors", { params }),
  getLocations: (params) => api.get("/search/locations", { params }),
  getFacilities: (params) => api.get("/search/facilities", { params }),
};

// Schedules API
export const schedulesAPI = {
  getDoctorSchedules: (doctorId) => api.get(`/schedules/doctor/${doctorId}`),
  createSchedule: (data) => api.post("/schedules", data),
  getAvailableSlots: (doctorId, params) =>
    api.get(`/schedules/slots/${doctorId}`, { params }),
  generateSlots: (scheduleId) =>
    api.post(`/schedules/${scheduleId}/generate-slots`),
  bookSlot: (data) => api.post("/schedules/book-slot", data),
  updateSlotStatus: (slotId, data) =>
    api.put(`/schedules/slot/${slotId}`, data),
};

// Notifications API
export const notificationsAPI = {
  getNotifications: (userId) => api.get(`/notifications/${userId}`),
  getUnreadCount: (userId) => api.get(`/notifications/unread-count/${userId}`),
  markAsRead: (notificationId) =>
    api.put(`/notifications/${notificationId}/read`),
  markAllAsRead: (userId) => api.put(`/notifications/${userId}/read-all`),
};
```

## App Routes

**Updated**: `client/src/App.jsx`

New routes added:

- `/search-doctors` - Doctor search with cascading filters
- `/my-appointments` - Patient dashboard with today/upcoming/past tabs

## Testing the Features

### 1. Create Doctor Schedules

First, create schedules for doctors:

```bash
POST http://localhost:5000/api/schedules
Content-Type: application/json

{
  "doctor_id": 1,
  "facility_type": "hospital",
  "facility_id": 1,
  "day_of_week": 1,
  "start_time": "09:00",
  "end_time": "17:00",
  "slot_duration": 30,
  "consultation_fee": 100.00,
  "is_active": true
}
```

### 2. Generate Slots

Generate slots for a schedule (for the next 30 days):

```bash
POST http://localhost:5000/api/schedules/1/generate-slots
```

### 3. Search for Doctors

Use the cascading search interface:

1. Navigate to `/search-doctors`
2. Select a specialization
3. Select a location
4. Choose facility type
5. Pick a specific facility
6. Click "Search"
7. Click "Book Appointment" on a doctor

### 4. View Appointment Grid

After selecting a doctor, the AppointmentGrid will show:

- Available slots in green (hospital) or blue (chamber)
- Booked slots in red (hospital) or orange (chamber)
- Blocked slots in gray with X

### 5. Book Appointment

1. Click on a free (green/blue) slot
2. Modal appears with booking form
3. Fill in triage information:
   - Symptoms
   - Severity (low/medium/high/critical)
   - Additional notes
4. Click "Confirm Booking"
5. Appointment is created with triage notes
6. Notification is automatically sent (via database trigger)

### 6. View Patient Dashboard

Navigate to `/my-appointments` to see:

- **Today tab**: Appointments for current day (highlighted in blue)
- **Upcoming tab**: Future appointments
- **Past tab**: Historical appointments
- Notification bell with unread count
- Triage information displayed for each appointment
- Cancel button for future appointments

## Database Triggers

The system includes an automatic trigger that creates notifications when:

- New appointment is created
- Appointment is updated
- Appointment is deleted

**Trigger**: `notify_appointment_change()`

- Automatically creates notifications for both patient and doctor
- Messages include appointment details
- Marked as unread by default

## Sample Data Setup

### Step 1: Insert Sample Doctor Schedules

```sql
-- Hospital schedule for Monday
INSERT INTO doctor_schedules (doctor_id, facility_type, facility_id, day_of_week, start_time, end_time, slot_duration, consultation_fee)
VALUES (1, 'hospital', 1, 1, '09:00', '13:00', 30, 150.00);

-- Chamber schedule for Monday evening
INSERT INTO doctor_schedules (doctor_id, facility_type, facility_id, day_of_week, start_time, end_time, slot_duration, consultation_fee)
VALUES (1, 'chamber', 1, 1, '17:00', '21:00', 30, 100.00);
```

### Step 2: Generate Slots

Use the API endpoint to generate slots for next 30 days based on these schedules.

### Step 3: Test Booking Flow

1. Search for doctor using cascading filters
2. View appointment grid with color-coded slots
3. Click a free slot to book
4. Add triage information
5. Confirm booking
6. View notification in dashboard
7. Check appointment in "Today" or "Upcoming" tab

## Troubleshooting

### Issue: "No slots available"

**Solution**:

1. Check if doctor schedules exist in database
2. Run generate-slots endpoint for each schedule
3. Verify the date range in the API call includes future dates

### Issue: "Cannot read property 'user_id' of undefined"

**Solution**:

1. Ensure doctor object is passed correctly to AppointmentGrid
2. Check that doctor has user_id field from search results

### Issue: Notifications not appearing

**Solution**:

1. Verify the trigger `notify_appointment_change` is installed
2. Check that appointments have both patient_id and doctor_id
3. Query notifications table directly to debug

### Issue: Cascading filters not working

**Solution**:

1. Check browser console for API errors
2. Verify backend search routes are registered in routes/index.js
3. Test search endpoints directly with Postman

## Next Steps

1. ✅ Database schema enhancements installed
2. ✅ Backend controllers implemented
3. ✅ Frontend components created
4. ⏳ **Run schema_enhancements.sql** (Manual step required)
5. ⏳ Create sample doctor schedules
6. ⏳ Generate slots using API
7. ⏳ Test complete booking flow

## Key Files Reference

**Backend**:

- `schema_enhancements.sql` - New database tables and triggers
- `server/src/controllers/searchController.js` - Cascading search logic
- `server/src/controllers/scheduleController.js` - Slot management
- `server/src/controllers/notificationController.js` - Notification CRUD
- `server/src/controllers/appointmentController.js` - Enhanced appointments
- `server/src/routes/search.js` - Search routes
- `server/src/routes/schedules.js` - Schedule routes
- `server/src/routes/notifications.js` - Notification routes

**Frontend**:

- `client/src/components/DoctorSearch.jsx` - Cascading filter UI
- `client/src/components/AppointmentGrid.jsx` - Slot grid with booking
- `client/src/components/PatientDashboard.jsx` - Patient appointment dashboard
- `client/src/services/api.js` - API client with new endpoints
- `client/src/App.jsx` - Updated with new routes

## Support

For issues or questions, please refer to the main README.md or check the inline code comments in each file.
