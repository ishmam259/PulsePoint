# PulsePoint HMS - Authentication Guide

## Overview

The application now includes a complete authentication system with JWT tokens, role-based access control, and protected routes.

## Demo Accounts

All demo accounts use the password: **password123**

| Role        | Email                | Password    | Description                   |
| ----------- | -------------------- | ----------- | ----------------------------- |
| **Admin**   | admin@pulsepoint.com | password123 | Full system access            |
| **Doctor**  | doctor@test.com      | password123 | Dr. Sarah Smith (Cardiology)  |
| **Doctor**  | dr.jones@test.com    | password123 | Dr. Michael Jones (Neurology) |
| **Doctor**  | dr.wilson@test.com   | password123 | Dr. Emily Wilson (Pediatrics) |
| **Patient** | patient@test.com     | password123 | John Patient                  |
| **Patient** | jane.doe@test.com    | password123 | Jane Doe                      |

## Features

### 1. User Registration

- **Endpoint**: `POST /api/auth/register`
- **Features**:
  - Email & password validation
  - Password hashing with bcrypt (10 rounds)
  - Automatic patient/doctor record creation
  - JWT token generation
  - Role selection (patient/doctor)

**Request Body** (Patient):

```json
{
  "email": "newpatient@test.com",
  "password": "securepass123",
  "full_name": "New Patient",
  "phone": "+1234567890",
  "date_of_birth": "1995-06-15",
  "gender": "Male",
  "address": "123 Main St",
  "role": "patient"
}
```

**Request Body** (Doctor):

```json
{
  "email": "newdoctor@test.com",
  "password": "securepass123",
  "full_name": "Dr. New Doctor",
  "phone": "+1234567890",
  "date_of_birth": "1980-03-20",
  "gender": "Female",
  "address": "456 Medical Plaza",
  "role": "doctor",
  "license_number": "LIC-123-2024",
  "specialization_id": 1,
  "experience_years": 5,
  "qualification": "MBBS, MD"
}
```

### 2. User Login

- **Endpoint**: `POST /api/auth/login`
- **Features**:
  - Email & password verification
  - Account status check (active/inactive)
  - JWT token with 7-day expiration
  - Last login timestamp update

**Request**:

```json
{
  "email": "patient@test.com",
  "password": "password123"
}
```

**Response**:

```json
{
  "message": "Login successful",
  "user": {
    "user_id": 1,
    "email": "patient@test.com",
    "full_name": "John Patient",
    "role": "patient",
    "phone": "+1234567891",
    "date_of_birth": "1990-05-15",
    "gender": "Male",
    "address": "456 Patient Ave, City"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 3. Protected Routes

All API endpoints (except /auth/register and /auth/login) require authentication.

**Authorization Header**:

```
Authorization: Bearer <your_jwt_token>
```

### 4. Role-Based Access Control

**Frontend Routes**:

- **Public**: `/login`, `/register`
- **All Authenticated Users**: `/`, `/medical-history`
- **Patients Only**: `/search-doctors`, `/my-appointments`
- **Doctors Only**: `/appointments`, `/prescriptions`
- **Admin Only**: `/patients`, `/doctors`, `/hospitals`, `/appointments` (all)

### 5. User Profile Management

**Get Profile** - `GET /api/auth/profile`

- Returns current user info
- Includes role-specific data (patient_info/doctor_info)

**Update Profile** - `PUT /api/auth/profile`

```json
{
  "full_name": "Updated Name",
  "phone": "+1987654321",
  "address": "New Address"
}
```

**Change Password** - `PUT /api/auth/change-password`

```json
{
  "currentPassword": "password123",
  "newPassword": "newsecurepass456"
}
```

**Logout** - `POST /api/auth/logout`

- Server-side acknowledgment
- Client removes token from localStorage

## Frontend Integration

### 1. Login Flow

1. User enters credentials on `/login` page
2. Frontend sends POST to `/api/auth/login`
3. On success:
   - Token saved to `localStorage.setItem('token', data.token)`
   - User data saved to `localStorage.setItem('user', JSON.stringify(data.user))`
   - Redirected based on role
4. On error:
   - Error message displayed

### 2. Protected Routes

```jsx
function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/login" replace />;
}
```

### 3. API Interceptors

**Request Interceptor** (adds token):

```javascript
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

**Response Interceptor** (handles 401):

```javascript
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);
```

### 4. Navigation Component

- Shows user name and role in navbar
- Displays role-specific menu items
- Logout button removes token and redirects

## Security Features

### 1. Password Security

- **Hashing**: Bcrypt with 10 salt rounds
- **Minimum Length**: 6 characters
- **Never Stored Plain**: Only hash in database

### 2. JWT Tokens

- **Secret**: Stored in environment variable (`JWT_SECRET`)
- **Expiration**: 7 days
- **Payload**: userId, email, role
- **Verification**: On every protected route

### 3. Input Validation

- **Email**: Format validation
- **Password**: Length requirements
- **Role**: Enum constraint (patient, doctor, admin)
- **SQL Injection**: Parameterized queries

### 4. Error Handling

- Generic error messages (no hint about what's wrong)
- Account status verification
- Token expiration handling

## Database Schema Updates

### users Table (Updated)

```sql
CREATE TABLE users (
  user_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  phone VARCHAR(20),
  date_of_birth DATE,
  address TEXT,
  password_hash VARCHAR(255),              -- NEW
  role VARCHAR(20) DEFAULT 'patient',      -- NEW
  gender VARCHAR(20),                      -- NEW
  is_active BOOLEAN DEFAULT TRUE,          -- NEW
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP  -- NEW
);
```

## Testing

### 1. Start the Servers

```bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend
cd client
npm run dev
```

### 2. Test Flow

1. **Register**: Go to `http://localhost:5173/register`
   - Create a new patient account
   - Verify redirect to `/my-appointments`

2. **Logout**: Click logout button
   - Verify redirect to `/login`

3. **Login as Patient**: Use `patient@test.com` / `password123`
   - Verify patient menu items visible
   - Access `/search-doctors` and `/my-appointments`

4. **Login as Doctor**: Use `doctor@test.com` / `password123`
   - Verify doctor menu items visible
   - Access `/appointments` and `/prescriptions`

5. **Login as Admin**: Use `admin@pulsepoint.com` / `password123`
   - Verify admin has access to all routes

### 3. API Testing with Postman

**1. Register**:

```
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "test123456",
  "full_name": "Test User",
  "phone": "+1111111111",
  "role": "patient"
}
```

**2. Login**:

```
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "test123456"
}
```

**3. Get Profile** (copy token from login response):

```
GET http://localhost:5000/api/auth/profile
Authorization: Bearer <paste_token_here>
```

**4. Access Protected Route**:

```
GET http://localhost:5000/api/appointments
Authorization: Bearer <paste_token_here>
```

## Environment Variables

**server/.env**:

```env
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=hospital_management
DB_USER=ishmam
DB_PASSWORD=220041259
JWT_SECRET=pulsepoint_hospital_management_secret_key_2026_change_in_production
```

⚠️ **Important**: Change `JWT_SECRET` to a strong random string in production!

## Troubleshooting

### Issue: "Invalid token" or "Token expired"

**Solution**:

- Clear localStorage: `localStorage.clear()`
- Login again to get a new token

### Issue: "User with this email already exists"

**Solution**:

- Use a different email
- Or delete existing user from database

### Issue: "Authentication required"

**Solution**:

- Verify token is in Authorization header
- Check token hasn't expired (7 days)
- Ensure JWT_SECRET is same in .env

### Issue: Cannot access route (403 Forbidden)

**Solution**:

- Check user role matches required role for route
- Admin can access all routes
- Patients/Doctors have specific route restrictions

## Password Reset (Future Enhancement)

Currently not implemented. To reset a password manually:

```sql
-- Generate new hash using bcrypt online tool or Node.js
-- Then update database:
UPDATE users
SET password_hash = '$2b$10$NEW_HASH_HERE'
WHERE email = 'user@example.com';
```

## Next Steps

✅ Authentication system complete
✅ Protected routes implemented
✅ Role-based access control working
✅ JWT token management
✅ Demo users created

**Future Enhancements**:

- [ ] Password reset via email
- [ ] Two-factor authentication
- [ ] Account lockout after failed attempts
- [ ] Session management (logout all devices)
- [ ] Password strength meter
- [ ] Remember me functionality
- [ ] OAuth integration (Google, Facebook)

## Support

For issues or questions:

1. Check browser console for errors
2. Verify backend server is running on port 5000
3. Check database connection
4. Ensure migrations ran successfully
5. Review token in localStorage
