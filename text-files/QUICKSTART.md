# 🏥 PulsePoint Hospital Management System

## Quick Start Guide

### ✅ System Ready!

Both servers are now running:

- **Backend**: http://localhost:5000
- **Frontend**: http://localhost:5173

### 🚀 Login Now!

Open your browser and go to: **http://localhost:5173**

You'll be automatically redirected to the login page.

### 👥 Demo Accounts

| Role           | Email                | Password    |
| -------------- | -------------------- | ----------- |
| **👤 Patient** | patient@test.com     | password123 |
| **👤 Patient** | jane.doe@test.com    | password123 |
| **👨‍⚕️ Doctor**  | doctor@test.com      | password123 |
| **👨‍⚕️ Doctor**  | dr.jones@test.com    | password123 |
| **👨‍⚕️ Doctor**  | dr.wilson@test.com   | password123 |
| **⚙️ Admin**   | admin@pulsepoint.com | password123 |

## 📋 Features

### For Patients

- ✅ Register and login
- ✅ Search for doctors with cascading filters (Specialization → Location → Facility)
- ✅ View available appointment slots with color coding
- ✅ Book appointments with triage notes
- ✅ View today/upcoming/past appointments
- ✅ Cancel future appointments
- ✅ Receive notifications

### For Doctors

- ✅ Register and login with medical credentials
- ✅ View appointment schedule
- ✅ Manage prescriptions
- ✅ Access patient medical history

### For Admin

- ✅ Full access to all features
- ✅ Manage patients, doctors, hospitals
- ✅ View all appointments
- ✅ System-wide overview

## 🎯 Test the Full Flow

### 1. **Patient Registration & Login**

1. Go to http://localhost:5173
2. Click "Register here"
3. Fill in the form as a Patient
4. Click "Create Account"
5. You'll be logged in automatically and redirected to "My Appointments"

### 2. **Search for Doctors**

1. Click "Search Doctors" in navigation
2. Select a specialization (e.g., Cardiology)
3. Select a location
4. Choose facility type (Hospital/Chamber)
5. Select specific facility
6. Click "Search"
7. View doctors with their facilities

### 3. **Book an Appointment**

1. Click "Book Appointment" on a doctor
2. View the color-coded appointment grid:
   - 🟢 Green = Hospital slot available
   - 🔵 Blue = Chamber slot available
   - 🔴 Red = Hospital booked
   - 🟠 Orange = Chamber booked
   - ⚫ Gray = Blocked
3. Click on a free slot (green/blue)
4. Fill in triage information:
   - Symptoms
   - Severity (low/medium/high/critical)
   - Additional notes
5. Click "Confirm Booking"

### 4. **View Appointments**

1. Click "My Appointments"
2. Use tabs to filter:
   - **Today**: Current day appointments
   - **Upcoming**: Future appointments
   - **Past**: Historical appointments
3. View triage notes and appointment details
4. Cancel future appointments if needed

### 5. **Doctor Login**

1. Logout (click Logout button)
2. Login as doctor: doctor@test.com / password123
3. View different menu options
4. Access "My Appointments" to see scheduled patients
5. Manage prescriptions

### 6. **Admin Access**

1. Logout
2. Login as admin: admin@pulsepoint.com / password123
3. Access all system features
4. Manage patients, doctors, hospitals
5. View system-wide statistics

## 📊 Database Features

### Automatic Triggers

- ✅ **Notifications**: Auto-created when appointments are added/updated/deleted
- ✅ **Timestamps**: Automatic created_at and updated_at tracking
- ✅ **Cascade Deletes**: Related records cleaned up automatically

### Advanced Queries

- ✅ **Cascading Search**: Complex SQL with UNION and JSONB aggregation
- ✅ **Date Filtering**: Today/upcoming/past appointment queries
- ✅ **Slot Management**: Automatic slot generation from schedules
- ✅ **Transaction Safety**: Race condition prevention in booking

## 🔧 System Architecture

```
PulsePoint HMS
│
├── Backend (Port 5000)
│   ├── Express.js REST API
│   ├── PostgreSQL Database
│   ├── JWT Authentication
│   ├── Bcrypt Password Hashing
│   └── Connection Pooling (pg)
│
├── Frontend (Port 5173)
│   ├── React 19 + Vite
│   ├── React Router DOM
│   ├── TanStack Query
│   ├── Axios with Interceptors
│   └── Tailwind CSS
│
└── Database
    ├── 15+ Tables
    ├── Triggers & Functions
    ├── Indexes for Performance
    └── Foreign Key Constraints
```

## 📚 Documentation

- **[AUTHENTICATION.md](AUTHENTICATION.md)** - Complete authentication guide
- **[ADVANCED_FEATURES.md](ADVANCED_FEATURES.md)** - Booking system documentation
- **[README.md](README.md)** - Main project documentation
- **[SETUP.md](SETUP.md)** - Installation guide

## 🗄️ Database Scripts

- **[schema.sql](schema.sql)** - Original database schema
- **[schema_enhancements.sql](schema_enhancements.sql)** - Advanced booking tables
- **[auth_migration.sql](auth_migration.sql)** - Authentication schema updates
- **[demo_users.sql](demo_users.sql)** - Demo account creation

## 🛠️ Development Commands

### Backend

```bash
cd server
npm run dev          # Start with nodemon (auto-reload)
npm start            # Start production server
```

### Frontend

```bash
cd client
npm run dev          # Start Vite dev server
npm run build        # Build for production
npm run preview      # Preview production build
```

### Database

```bash
# Connect to database
psql -U ishmam -d hospital_management

# Run schema
psql -U ishmam -d hospital_management -f schema.sql

# Run migrations
psql -U ishmam -d hospital_management -f auth_migration.sql
psql -U ishmam -d hospital_management -f schema_enhancements.sql
psql -U ishmam -d hospital_management -f demo_users.sql
```

## 🔐 Security Notes

⚠️ **Important for Production**:

1. **Change JWT Secret**: Update `JWT_SECRET` in `server/.env`
2. **Use HTTPS**: Enable SSL/TLS in production
3. **Environment Variables**: Never commit `.env` files
4. **Password Policy**: Enforce stronger passwords
5. **Rate Limiting**: Add rate limiting middleware
6. **CORS**: Configure proper CORS settings
7. **Input Sanitization**: Add additional validation

## 🐛 Troubleshooting

### Backend won't start

```bash
# Check PostgreSQL is running
# Verify credentials in server/.env
# Check port 5000 is available
netstat -ano | findstr :5000
```

### Frontend can't connect to backend

```bash
# Verify backend is running on port 5000
# Check VITE_API_URL in client/.env
# Clear browser cache and localStorage
```

### Database connection error

```bash
# Test connection
psql -U ishmam -d hospital_management

# Verify password doesn't have quotes in .env
DB_PASSWORD=220041259   ✅ Correct
DB_PASSWORD="220041259" ❌ Wrong
```

### Can't login

```bash
# Clear localStorage
localStorage.clear()

# Verify demo users exist
psql -U ishmam -d hospital_management
SELECT email, role FROM users WHERE role IN ('patient', 'doctor', 'admin');
```

## 📈 Next Steps

Want to enhance the system? Consider:

1. **Email Notifications**: Send appointment reminders
2. **File Upload**: Add profile pictures and medical documents
3. **Video Consultation**: Integrate video calling
4. **Payment Gateway**: Process consultation fees
5. **Mobile App**: React Native companion app
6. **Reports**: Generate PDF reports and charts
7. **Analytics**: Dashboard with statistics
8. **Search**: Full-text search with Elasticsearch

## 🎉 You're All Set!

Your complete Hospital Management System is now running with:

- ✅ Authentication (Login/Register)
- ✅ Role-based access control
- ✅ Advanced appointment booking
- ✅ Cascading doctor search
- ✅ Color-coded slot grid
- ✅ Triage notes
- ✅ Automatic notifications
- ✅ Database triggers
- ✅ Protected routes
- ✅ Responsive UI

**Open http://localhost:5173 and start exploring!** 🚀
