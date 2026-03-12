# 🚀 Quick Setup Guide for PulsePoint HMS

## Step-by-Step Setup

### 1️⃣ Database Setup

```bash
# Login to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE hospital_management;

# Exit PostgreSQL
\q

# Run schema file (from project root)
psql -U postgres -d hospital_management -f schema.sql
```

### 2️⃣ Backend Setup

```bash
# Navigate to server directory
cd server

# Install dependencies (if not already installed)
npm install

# Create .env file with these settings:
# PORT=5000
# DB_HOST=localhost
# DB_PORT=5432
# DB_NAME=hospital_management
# DB_USER=postgres
# DB_PASSWORD=your_password

# Start the backend server
npm run dev
```

✅ Backend should be running on http://localhost:5000

### 3️⃣ Frontend Setup

```bash
# Open a new terminal
# Navigate to client directory
cd client

# Install dependencies (if not already installed)
npm install

# Start the frontend server
npm run dev
```

✅ Frontend should be running on http://localhost:5173

### 4️⃣ Test the Application

1. Open your browser and go to http://localhost:5173
2. You should see the PulsePoint Hospital Management System dashboard
3. Try adding some test data:
   - Add a few patients
   - Add some doctors
   - Schedule appointments
   - Create prescriptions

## 🔧 Troubleshooting

### Database Connection Issues

- Make sure PostgreSQL is running
- Check your database credentials in server/.env
- Verify the database exists: `psql -U postgres -l`

### Port Already in Use

- Backend: Change PORT in server/.env
- Frontend: Vite will automatically suggest another port

### Module Not Found

- Run `npm install` in both server and client directories
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`

### API Connection Issues

- Make sure backend is running on port 5000
- Check client/.env has correct API URL
- Verify CORS is enabled in server

## 📊 Sample Data

You can insert sample data using pgAdmin or psql:

```sql
-- Sample User
INSERT INTO users (full_name, email, phone, dob, address)
VALUES ('Dr. John Smith', 'john@hospital.com', '555-0100', '1980-01-15', '123 Medical St');

-- Sample Specialization
INSERT INTO specializations (name) VALUES ('Cardiology');

-- Sample Department
INSERT INTO departments (name) VALUES ('Emergency');
```

## 🎯 Next Steps

1. ✅ Database created and schema loaded
2. ✅ Backend server running
3. ✅ Frontend application running
4. ✅ Test basic CRUD operations
5. 🔜 Add authentication (optional)
6. 🔜 Deploy to production (optional)

## 📞 Need Help?

Check the main README.md for detailed API documentation and features.

Happy coding! 🏥💻
