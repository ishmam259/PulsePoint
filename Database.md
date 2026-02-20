# PulsePoint Database Documentation

**Last Updated:** March 4, 2026  
**Database System:** PostgreSQL 13+  
**Application:** Healthcare Management System (PERN Stack)

---

## Table of Contents
1. [All Tables Created](#1-all-tables-created)
2. [All Triggers Created](#2-all-triggers-created)
3. [Functions and Procedures](#3-functions-and-procedures)
4. [Independent Queries](#4-independent-queries)
5. [Regex Patterns Implemented](#5-regex-patterns-implemented)
6. [ROLLUP and CUBE Operations](#6-rollup-and-cube-operations)
7. [Cursors Implemented](#7-cursors-implemented)
8. [Normalization Decisions](#8-normalization-decisions)
9. [Analytical and Reporting Queries](#9-analytical-and-reporting-queries)
10. [Views](#10-views)
11. [Indexing Strategies](#11-indexing-strategies)

---

## 1. All Tables Created

### Core User Management Tables

#### 1.1 `users`
**File:** `schema.sql`  
**Purpose:** Base user table storing all system users with role-based access control

**Columns:**
- `user_id` INT PRIMARY KEY (GENERATED ALWAYS AS IDENTITY)
- `full_name` VARCHAR(100) NOT NULL
- `email` VARCHAR(100) UNIQUE NOT NULL
- `phone` VARCHAR(20)
- `date_of_birth` DATE
- `age_years` INT
- `gender` VARCHAR(20)
- `address` TEXT
- `password_hash` VARCHAR(255)
- `role` VARCHAR(20) DEFAULT 'patient' ✓ CHECK constraint: `('patient', 'doctor', 'hospital_admin', 'admin')`
- `is_active` BOOLEAN DEFAULT TRUE
- `is_verified` BOOLEAN DEFAULT FALSE
- `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
- `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP

**Indexes:**
- Primary key on `user_id`
- Unique index on `email`
- Index on `role`

**Constraints:**
- Check constraint on `role` values
- Unique constraint on `email`

---

#### 1.2 `departments`
**File:** `schema.sql`  
**Purpose:** Medical departments reference table

**Columns:**
- `dept_id` INT PRIMARY KEY (GENERATED ALWAYS AS IDENTITY)
- `name` VARCHAR(100) UNIQUE NOT NULL

**Indexes:** Primary key on `dept_id`

---

#### 1.3 `specializations`
**File:** `schema.sql`  
**Purpose:** Doctor specialization reference data

**Columns:**
- `spec_id` INT PRIMARY KEY (GENERATED ALWAYS AS IDENTITY)
- `spec_name` VARCHAR(100) UNIQUE NOT NULL
- `dept_id` INT FOREIGN KEY REFERENCES `departments(dept_id)`

**Constraints:** Foreign key to `departments`

---

#### 1.4 `doctors`
**File:** `schema.sql`  
**Purpose:** Doctor-specific profile information extending `users`

**Columns:**
- `user_id` INT PRIMARY KEY FOREIGN KEY REFERENCES `users(user_id) ON DELETE CASCADE`
- `doctor_code` VARCHAR(50) UNIQUE
- `consultation_fee` DECIMAL(10,2)
- `license_number` VARCHAR(50)
- `specialization_id` INT FOREIGN KEY REFERENCES `specializations(spec_id)`
- `experience_years` INT
- `qualification` VARCHAR(255)
- `degrees` TEXT[]
- `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP

**Constraints:**
- Primary & Foreign key to `users.user_id` with ON DELETE CASCADE
- Foreign key to `specializations(spec_id)`

---

#### 1.5 `doctor_specializations`
**File:** `schema.sql`  
**Purpose:** Junction table for N-to-N doctor-to-specialization mapping (supports multi-specialization doctors)

**Columns:**
- `doctor_id` INT FOREIGN KEY REFERENCES `doctors(user_id) ON DELETE CASCADE`
- `spec_id` INT FOREIGN KEY REFERENCES `specializations(spec_id)`

**Constraints:**
- Composite primary key: `(doctor_id, spec_id)`
- Foreign keys with cascading deletes

**Normalization Note:** Enables multi-specialization doctors without redundant data

---

#### 1.6 `patients`
**File:** `schema.sql`  
**Purpose:** Patient-specific health profile extending `users`

**Columns:**
- `user_id` INT PRIMARY KEY FOREIGN KEY REFERENCES `users(user_id) ON DELETE CASCADE`
- `patient_code` VARCHAR(50) UNIQUE
- `height_cm` DECIMAL(5,2)
- `weight_kg` DECIMAL(5,2)
- `bmi` DECIMAL(5,2) *(Computed via trigger)*
- `blood_group` VARCHAR(5)
- `medical_notes` TEXT
- `emergency_contact` VARCHAR(20)

**Constraints:** Primary & Foreign key to `users.user_id`

**Auto-computed Field:** BMI recalculated on height/weight changes via `calculate_bmi()` trigger

---

### Hospital & Facility Management Tables

#### 1.7 `hospitals`
**File:** `schema.sql`  
**Purpose:** Hospital registration and master data

**Columns:**
- `hospital_id` INT PRIMARY KEY (GENERATED ALWAYS AS IDENTITY)
- `admin_user_id` INT NOT NULL FOREIGN KEY REFERENCES `users(user_id)`
- `name` VARCHAR(150) NOT NULL
- `est_year` INT
- `email` VARCHAR(100)
- `phone` VARCHAR(20)
- `address` TEXT
- `license_number` VARCHAR(50) *(Note: Uniqueness removed in enhancements to allow multiple branches)*
- `tax_id` VARCHAR(50)
- `hospital_type` VARCHAR(30) CHECK `('public', 'private', 'trust_charity', 'military')`
- `category` VARCHAR(30) CHECK `('general', 'multi_specialty', 'single_specialty')`
- `specialty` VARCHAR(100)
- `website_url` TEXT
- `location` VARCHAR(100)
- `branch_names` TEXT[] *(Array field for branches)*
- `branch_addresses` TEXT[] *(Array field for branch locations)*

**Constraints:** Foreign key to `users(admin_user_id)`

**Note:** Multiple branches supported via array fields and branch_name columns in related tables

---

#### 1.8 `hospital_doctors`
**File:** `schema.sql`  
**Purpose:** Junction table linking doctors to hospitals with facility-specific fees

**Columns:**
- `hospital_id` INT FOREIGN KEY REFERENCES `hospitals(hospital_id) ON DELETE CASCADE`
- `doctor_id` INT FOREIGN KEY REFERENCES `doctors(user_id) ON DELETE CASCADE`
- `consultation_fee` DECIMAL(10,2) *(Hospital-specific override)*

**Constraints:**
- Composite primary key: `(hospital_id, doctor_id)`
- Foreign keys with cascading deletes

**Normalization Note:** Allows the same doctor to work at multiple hospitals with different fees

---

#### 1.9 `chambers`
**File:** `schema.sql`  
**Purpose:** Doctor's private consultation chambers

**Columns:**
- `chamber_id` INT PRIMARY KEY (GENERATED ALWAYS AS IDENTITY)
- `doctor_id` INT NOT NULL FOREIGN KEY REFERENCES `doctors(user_id) ON DELETE CASCADE`
- `name` VARCHAR(150)
- `phone` VARCHAR(20)
- `address` TEXT
- `location` VARCHAR(100)

**Constraints:** Foreign key to `doctors(user_id)`

---

### Appointment & Clinical Tables

#### 1.10 `appointments`
**File:** `schema.sql`  
**Purpose:** Core appointment scheduling and tracking

**Columns:**
- `appointment_id` INT PRIMARY KEY (GENERATED ALWAYS AS IDENTITY)
- `patient_id` INT NOT NULL FOREIGN KEY REFERENCES `patients(user_id) ON DELETE CASCADE`
- `doctor_id` INT NOT NULL FOREIGN KEY REFERENCES `doctors(user_id)`
- `hospital_id` INT FOREIGN KEY REFERENCES `hospitals(hospital_id)`
- `chamber_id` INT FOREIGN KEY REFERENCES `chambers(chamber_id)`
- `department_id` INT FOREIGN KEY REFERENCES `departments(dept_id)`
- `branch_name` VARCHAR(150) *(For multi-branch hospitals)*
- `appt_date` DATE NOT NULL
- `appt_time` TIME NOT NULL
- `status` VARCHAR(20) DEFAULT 'scheduled'
- `note` TEXT

**Constraints:**
- CHECK constraint: Either `hospital_id` OR `chamber_id` must be NOT NULL (mutually exclusive)
- Foreign keys to `patients`, `doctors`, `hospitals`, `chambers`, `departments`

**Indexes:**
- `idx_appointments_doctor_date` on `(doctor_id, appt_date)`
- `idx_appointments_patient` on `(patient_id)`

---

#### 1.11 `prescriptions`
**File:** `schema.sql`  
**Purpose:** Prescription master record

**Columns:**
- `prescription_id` INT PRIMARY KEY (GENERATED ALWAYS AS IDENTITY)
- `appointment_id` INT NOT NULL FOREIGN KEY REFERENCES `appointments(appointment_id) ON DELETE CASCADE`
- `doctor_id` INT NOT NULL FOREIGN KEY REFERENCES `doctors(user_id)`
- `patient_id` INT NOT NULL FOREIGN KEY REFERENCES `patients(user_id)`
- `notes` TEXT
- `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP

**Constraints:** Foreign keys to `appointments`, `doctors`, `patients`

---

#### 1.12 `prescription_medications`
**File:** `schema.sql`  
**Purpose:** Line items for medications in prescriptions (supports multi-drug prescriptions)

**Columns:**
- `medication_id` INT PRIMARY KEY (GENERATED ALWAYS AS IDENTITY)
- `prescription_id` INT NOT NULL FOREIGN KEY REFERENCES `prescriptions(prescription_id) ON DELETE CASCADE`
- `medicine_name` VARCHAR(100) NOT NULL
- `dosage` VARCHAR(50) NOT NULL
- `duration` VARCHAR(50)

**Constraints:** Foreign key to `prescriptions(prescription_id)`

**Normalization Note:** Separates medications into detail table for better data integrity and flexibility

---

#### 1.13 `medical_history`
**File:** `schema.sql`  
**Purpose:** Patient visit-based medical history records

**Columns:**
- `history_id` INT PRIMARY KEY (GENERATED ALWAYS AS IDENTITY)
- `patient_id` INT NOT NULL FOREIGN KEY REFERENCES `patients(user_id) ON DELETE CASCADE`
- `doctor_id` INT NOT NULL FOREIGN KEY REFERENCES `doctors(user_id)`
- `visit_date` DATE NOT NULL
- `diagnosis` TEXT
- `notes` TEXT

**Constraints:** Foreign keys to `patients`, `doctors`

**Indexes:** `idx_medical_history_patient` on `(patient_id)`

---

#### 1.14 `medical_records`
**File:** `schema.sql`  
**Purpose:** Document-based medical records (lab reports, imaging, etc.)

**Columns:**
- `record_id` INT PRIMARY KEY (GENERATED ALWAYS AS IDENTITY)
- `patient_id` INT NOT NULL FOREIGN KEY REFERENCES `patients(user_id) ON DELETE CASCADE`
- `title` VARCHAR(255) NOT NULL
- `record_type` VARCHAR(50) NOT NULL
- `record_date` DATE NOT NULL DEFAULT CURRENT_DATE
- `description` TEXT
- `file_url` TEXT
- `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP

**Constraints:** Foreign key to `patients(user_id)`

**Indexes:** `idx_medical_records_patient` on `(patient_id)`

---

### Advanced Booking Tables

#### 1.15 `doctor_schedules`
**File:** `schema_enhancements.sql`  
**Purpose:** Doctor availability schedules for both hospitals and chambers (supports recurring and single-date schedules)

**Columns:**
- `schedule_id` INT PRIMARY KEY (GENERATED ALWAYS AS IDENTITY)
- `doctor_id` INT NOT NULL FOREIGN KEY REFERENCES `doctors(user_id) ON DELETE CASCADE`
- `facility_id` INT *(References hospital_id or chamber_id)*
- `facility_type` VARCHAR(10) CHECK `('hospital', 'chamber')`
- `branch_name` VARCHAR(150) *(For multi-branch hospitals)*
- `schedule_type` VARCHAR(10) DEFAULT 'weekly' CHECK `('weekly', 'single')`
- `specific_date` DATE *(Used when schedule_type = 'single')*
- `day_of_week` VARCHAR(10) CHECK `('Monday', 'Tuesday', ..., 'Sunday')`
- `start_time` TIME NOT NULL
- `end_time` TIME NOT NULL
- `slot_duration_minutes` INT DEFAULT 30
- `is_active` BOOLEAN DEFAULT TRUE

**Constraints:**
- Foreign key to `doctors(user_id)`
- Check constraint: `(schedule_type = 'weekly') OR (schedule_type = 'single' AND specific_date IS NOT NULL)`

**Indexes:** `idx_doctor_schedules_doctor` on `(doctor_id)`

---

#### 1.16 `appointment_slots`
**File:** `schema_enhancements.sql`  
**Purpose:** Individual bookable time slots generated from doctor schedules

**Columns:**
- `slot_id` INT PRIMARY KEY (GENERATED ALWAYS AS IDENTITY)
- `schedule_id` INT NOT NULL FOREIGN KEY REFERENCES `doctor_schedules(schedule_id) ON DELETE CASCADE`
- `doctor_id` INT NOT NULL FOREIGN KEY REFERENCES `doctors(user_id) ON DELETE CASCADE`
- `slot_date` DATE NOT NULL
- `slot_time` TIME NOT NULL
- `facility_id` INT
- `facility_type` VARCHAR(10) CHECK `('hospital', 'chamber')`
- `branch_name` VARCHAR(150)
- `status` VARCHAR(20) DEFAULT 'free' CHECK `('free', 'booked', 'blocked', 'cancelled')`
- `appointment_id` INT FOREIGN KEY REFERENCES `appointments(appointment_id) ON DELETE SET NULL`

**Constraints:**
- Composite unique constraint: `(doctor_id, slot_date, slot_time, facility_type, branch_name)`
- Foreign keys to `doctor_schedules`, `doctors`, `appointments`

**Indexes:**
- `idx_appointment_slots_doctor_date` on `(doctor_id, slot_date)`
- `idx_appointment_slots_status` on `(status)`

---

#### 1.17 `triage_notes`
**File:** `schema_enhancements.sql`  
**Purpose:** Pre-appointment patient information collected during triage

**Columns:**
- `triage_id` INT PRIMARY KEY (GENERATED ALWAYS AS IDENTITY)
- `appointment_id` INT NOT NULL FOREIGN KEY REFERENCES `appointments(appointment_id) ON DELETE CASCADE`
- `patient_id` INT NOT NULL FOREIGN KEY REFERENCES `patients(user_id) ON DELETE CASCADE`
- `symptoms` TEXT
- `severity` VARCHAR(20) CHECK `('low', 'medium', 'high', 'critical')`
- `notes` TEXT
- `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP

**Constraints:** Foreign keys to `appointments`, `patients`

**Indexes:** `idx_triage_notes_appointment` on `(appointment_id)`

---

### Notification System Table

#### 1.18 `notifications`
**File:** `schema_enhancements.sql`  
**Purpose:** System notifications for appointment updates and reminders

**Columns:**
- `notification_id` INT PRIMARY KEY (GENERATED ALWAYS AS IDENTITY)
- `user_id` INT NOT NULL FOREIGN KEY REFERENCES `users(user_id) ON DELETE CASCADE`
- `title` VARCHAR(200) NOT NULL
- `message` TEXT NOT NULL
- `type` VARCHAR(50) DEFAULT 'info' CHECK `('info', 'appointment', 'reminder', 'alert')`
- `is_read` BOOLEAN DEFAULT FALSE
- `related_appointment_id` INT FOREIGN KEY REFERENCES `appointments(appointment_id) ON DELETE CASCADE`
- `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP

**Constraints:** Foreign keys to `users`, `appointments`

**Indexes:** `idx_notifications_user` on `(user_id, is_read)`

---

### Wallet & Financial Tables

#### 1.19 `accounts`
**File:** `schema.sql`  
**Purpose:** User and hospital wallet accounts for payments

**Columns:**
- `account_id` INT PRIMARY KEY (GENERATED ALWAYS AS IDENTITY)
- `owner_type` VARCHAR(20) NOT NULL CHECK `('user', 'hospital')`
- `owner_id` INT NOT NULL
- `balance` NUMERIC(12,2) NOT NULL DEFAULT 0
- `currency` VARCHAR(3) NOT NULL DEFAULT 'BDT'
- `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
- `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP

**Constraints:**
- Unique constraint on `(owner_type, owner_id)`
- Check constraint on `owner_type` values
- Check constraint on `amount > 0`

**Triggers:**
- `accounts_owner_check` - Validates that owner exists
- `accounts_touch_updated_at` - Updates timestamp on changes

---

#### 1.20 `account_transactions`
**File:** `schema.sql`  
**Purpose:** Transaction ledger for all account transfers

**Columns:**
- `txn_id` INT PRIMARY KEY (GENERATED ALWAYS AS IDENTITY)
- `from_account_id` INT FOREIGN KEY REFERENCES `accounts(account_id) ON DELETE SET NULL`
- `to_account_id` INT FOREIGN KEY REFERENCES `accounts(account_id) ON DELETE SET NULL`
- `amount` NUMERIC(12,2) NOT NULL CHECK `(amount > 0)`
- `status` VARCHAR(20) NOT NULL DEFAULT 'completed' CHECK `('pending', 'completed', 'failed')`
- `description` TEXT
- `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP

**Constraints:**
- Foreign keys with ON DELETE SET NULL
- Check constraints on `amount > 0` and `status` values

**Triggers:**
- `transactions_balance_check` - Pre-insertion validation of account balance
- `transactions_apply_balance` - Post-insertion balance updates

---

### Email Verification Table

#### 1.21 `email_verifications`
**File:** `schema.sql`  
**Purpose:** OTP-based email verification tracking

**Columns:**
- `id` INT PRIMARY KEY (GENERATED ALWAYS AS IDENTITY)
- `email` VARCHAR(255) NOT NULL
- `otp` VARCHAR(10) NOT NULL
- `expires_at` TIMESTAMP NOT NULL
- `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP

**Indexes:** `idx_email_verifications_email` on `(email)`

---

## 2. All Triggers Created

### Account Management Triggers

#### 2.1 `accounts_owner_check`
**File:** `schema.sql`  
**Function:** `validate_account_owner()`  
**Event:** BEFORE INSERT OR UPDATE ON `accounts`  
**Purpose:** Validates that the account owner (user or hospital) exists before allowing account creation

**Logic:**
```sql
IF owner_type = 'user' THEN
  Check users table
ELSIF owner_type = 'hospital' THEN
  Check hospitals table
ELSE
  Raise exception
END IF;
```

---

#### 2.2 `accounts_touch_updated_at`
**File:** `schema.sql`  
**Function:** `touch_account_updated_at()`  
**Event:** BEFORE UPDATE ON `accounts`  
**Purpose:** Automatically updates the `updated_at` timestamp whenever an account record is modified

---

#### 2.3 `transactions_balance_check`
**File:** `schema.sql`  
**Function:** `ensure_account_balance()`  
**Event:** BEFORE INSERT ON `account_transactions`  
**Purpose:** Validates that the source account has sufficient balance before allowing a transaction

**Logic:**
- Checks if transaction status is 'completed'
- Locks the source account row for update
- Verifies current balance ≥ transaction amount
- Raises exception if balance insufficient

---

#### 2.4 `transactions_apply_balance`
**File:** `schema.sql`  
**Function:** `apply_account_transaction()`  
**Event:** AFTER INSERT ON `account_transactions`  
**Purpose:** Applies transaction amounts to source and destination accounts after successful insertion

**Logic:**
- If status = 'completed':
  - Deduct amount from source account
  - Credit amount to destination account
- Handles NULL accounts gracefully

---

### Appointment Payment Trigger

#### 2.5 `appointment_payment_trigger` (dual definition)
**File:** `schema.sql` and `schema_enhancements.sql`  
**Function:** `create_appointment_payment()`  
**Event:** AFTER UPDATE OF `status` ON `appointments`  
**Purpose:** Automatically creates payment transaction when appointment status changes to 'completed'

**Logic:**
- Only triggers if status changes to 'completed'
- Skips if payment transaction already exists for this appointment
- Fetches patient and doctor account IDs
- Retrieves doctor's consultation fee
- Creates transaction record with status 'completed' if patient has sufficient balance
- Creates 'pending' transaction if balance is insufficient

**Safety:** Deduplicates by checking if payment transaction already exists

---

### Appointment Notification Trigger

#### 2.6 `appointment_change_trigger`
**File:** `schema_enhancements.sql`  
**Function:** `notify_appointment_change()`  
**Event:** AFTER INSERT OR UPDATE OF `status` ON `appointments`  
**Purpose:** Automatically sends notifications to both patient and doctor when appointment status changes

**Logic:**
- Inserts notification record for patient
- Inserts notification record for doctor
- Sets message to include new appointment status
- Sets type to 'appointment'

---

### User Management Triggers

#### 2.7 `users_age_calculation`
**File:** `schema.sql`  
**Function:** `set_user_age_years()`  
**Event:** BEFORE INSERT OR UPDATE OF `date_of_birth` ON `users`  
**Purpose:** Auto-calculates user age in years from date of birth

**Logic:**
- Uses PostgreSQL `AGE()` function
- Extracts year component
- Uses `FLOOR()` for integer age

---

#### 2.8 `users_touch_updated_at`
**File:** `schema.sql`  
**Function:** `touch_user_updated_at()`  
**Event:** BEFORE UPDATE ON `users`  
**Purpose:** Updates the `updated_at` timestamp on any user record modification

---

### Patient Health Triggers

#### 2.9 `patients_bmi_trigger`
**File:** `schema.sql` or `auth_migration.sql`  
**Function:** `calculate_bmi()`  
**Event:** BEFORE INSERT OR UPDATE OF `height_cm`, `weight_kg` ON `patients`  
**Purpose:** Auto-calculates BMI (Body Mass Index) from height and weight

**Logic:**
```
IF height_cm >= 30 AND height_cm <= 300 AND weight_kg > 0 AND weight_kg <= 500:
  BMI = weight_kg / (height_cm/100)²
ELSE:
  BMI = NULL
```

**Validation:** Prevents invalid measurements (height 30-300cm, weight 0-500kg)

---

## 3. Functions and Procedures

### 3.1 Validation Functions

#### `validate_account_owner()`
**File:** `schema.sql`  
**Type:** Function  
**Returns:** TRIGGER  
**Language:** PL/pgSQL  
**Purpose:** Validates account owner existence (used by trigger)

---

#### `set_user_age_years()`
**File:** `schema.sql`  
**Type:** Function  
**Returns:** TRIGGER  
**Language:** PL/pgSQL  
**Purpose:** Calculates age from DOB (used by trigger)

---

#### `calculate_bmi()`
**File:** `schema.sql`  
**Type:** Function  
**Returns:** TRIGGER  
**Language:** PL/pgSQL  
**Purpose:** Calculates BMI from height/weight (used by trigger)

---

#### `ensure_account_balance()`
**File:** `schema.sql`  
**Type:** Function  
**Returns:** TRIGGER  
**Language:** PL/pgSQL  
**Purpose:** Validates sufficient account balance before transaction (used by trigger)

---

### 3.2 Data Manipulation Functions

#### `apply_account_transaction()`
**File:** `schema.sql`  
**Type:** Function  
**Returns:** TRIGGER  
**Language:** PL/pgSQL  
**Purpose:** Applies debit/credit to accounts after successful transaction insertion

---

#### `touch_account_updated_at()`
**File:** `schema.sql`  
**Type:** Function  
**Returns:** TRIGGER  
**Language:** PL/pgSQL  
**Purpose:** Updates account timestamp (used by trigger)

---

#### `touch_user_updated_at()`
**File:** `schema.sql`  
**Type:** Function  
**Returns:** TRIGGER  
**Language:** PL/pgSQL  
**Purpose:** Updates user timestamp (used by trigger)

---

#### `create_appointment_payment()`
**File:** `schema.sql` / `schema_enhancements.sql`  
**Type:** Function  
**Returns:** TRIGGER  
**Language:** PL/pgSQL  
**Purpose:** Initiates payment transaction for completed appointments

---

#### `notify_appointment_change()`
**File:** `schema_enhancements.sql`  
**Type:** Function  
**Returns:** TRIGGER  
**Language:** PL/pgSQL  
**Purpose:** Creates notifications for appointment status changes

---

### 3.3 Slot Generation Procedure

#### `generate_slots_for_schedule(p_schedule_id INT, p_start_date DATE, p_end_date DATE)`
**File:** `schema_enhancements.sql`  
**Type:** Procedure (RETURNS void)  
**Language:** PL/pgSQL  
**Purpose:** Generates individual appointment slots from doctor schedule templates

**Parameters:**
- `p_schedule_id` - The doctor schedule to generate slots for
- `p_start_date` - Start date for slot generation
- `p_end_date` - End date for slot generation

**Logic:**
1. Retrieves schedule details
2. For "single" schedule type:
   - Generates slots only for the specific_date
3. For "weekly" schedule type:
   - Iterates through date range
   - Matches day_of_week using `TO_CHAR()` with `FMDay` format
   - Generates slots at `slot_duration_minutes` intervals
4. Inserts slots with 'free' status
5. Uses ON CONFLICT DO NOTHING to prevent duplicates

**Loop Structure:**
```
FOR each date in range:
  IF date matches day_of_week:
    FOR each time slot in schedule hours:
      INSERT appointment_slot
```

---

## 4. Independent Queries

### 4.1 Demo User Insertion Queries
**File:** `demo_users.sql`  
**Purpose:** Seed demo accounts for testing

**Query Names & Purposes:**

#### `Insert_Demo_Specializations`
Inserts 5 demo specialization records:
- Cardiology
- Neurology
- Pediatrics
- Orthopedics
- General Medicine

---

#### `Insert_Demo_Admin_User`
Creates admin user:
- Email: `admin@pulsepoint.com`
- Role: admin
- Full access to system

---

#### `Insert_Demo_Patient_1_User_and_Record`
Creates first patient user and links to patients table:
- Email: `patient@test.com`
- Name: John Patient
- Blood Group: O+

---

#### `Insert_Demo_Patient_2_User_and_Record`
Creates second patient user:
- Email: `jane.doe@test.com`
- Name: Jane Doe
- Blood Group: A+

---

#### `Insert_Demo_Doctor_1_User_and_Record_Cardiology`
Creates doctor and links to doctors table:
- Email: `doctor@test.com`
- Name: Dr. Sarah Smith
- Specialization: Cardiology
- License: LIC-001-2020
- Experience: 15 years

---

#### `Insert_Demo_Doctor_2_User_and_Record_Neurology`
Creates neurologist doctor:
- Email: `dr.jones@test.com`
- Name: Dr. Michael Jones
- Specialization: Neurology
- License: LIC-002-2018
- Experience: 12 years

---

#### `Insert_Demo_Doctor_3_User_and_Record_Pediatrics`
Creates pediatrician:
- Email: `dr.wilson@test.com`
- Name: Dr. Emily Wilson
- Specialization: Pediatrics
- License: LIC-003-2019
- Experience: 10 years

---

#### `Display_All_Demo_Accounts`
SELECT query showing all demo accounts with:
- Email
- Full Name
- Role
- Default password (password123)

---

### 4.2 Database Maintenance Queries
**File:** `wipe_users.sql`  
**Purpose:** Cleanup and reset operations

#### `Truncate_All_User_Related_Data`
TRUNCATE with CASCADE to remove:
- All users
- All accounts
- All email verifications
- All dependent records (doctors, patients, hospitals, appointments, prescriptions, medical history, chambers, hospital_doctors, schedules, slots, triage notes, notifications, transactions)

**Note:** Preserves static reference tables (departments, specializations)

---

### 4.3 Authentication Migration Queries
**File:** `auth_migration.sql`  
**Purpose:** Upgrade existing databases with authentication

#### `Alter_Users_Add_Auth_Columns`
Adds authentication columns to users table:
- `password_hash` VARCHAR(255)
- `role` VARCHAR(20) with CHECK constraint
- `is_active` BOOLEAN
- `updated_at` TIMESTAMP

---

#### `Rename_DOB_Column`
**Purpose:** Standardizes date_of_birth naming (if using legacy `dob`)

Uses conditional DO block:
```sql
DO $$
BEGIN
  IF column exists 'dob' THEN
    RENAME COLUMN TO date_of_birth
  END IF;
END $$;
```

---

#### `Add_Doctor_Profile_Columns`
Adds professional fields to doctors table:
- `license_number`
- `specialization_id`
- `experience_years`
- `qualification`
- `created_at`

---

#### `Add_Patient_Health_Columns`
Adds health tracking to patients table:
- `emergency_contact`
- `bmi`

---

## 5. Regex Patterns Implemented

### 5.1 Email Validation
**Location:** Application layer (not in SQL)  
**Pattern:** Standard email format validation in backend validators

**Note:** PostgreSQL's native regex is NOT used in schema. Email is validated via:
- UNIQUE constraint on `users.email`
- VARCHAR type (no regex pattern constraint)

---

### 5.2 Role Enumeration (CHECK Constraints)
**Table:** `users`  
**Column:** `role`  
**Constraint:** CHECK (role IN ('patient', 'doctor', 'hospital_admin', 'admin'))  
**Purpose:** Restricts valid roles

---

### 5.3 Facility Type Enumeration
**Tables:** `doctor_schedules`, `appointment_slots`  
**Column:** `facility_type`  
**Constraint:** CHECK (facility_type IN ('hospital', 'chamber'))  
**Purpose:** Restricts facility type values

---

### 5.4 Hospital Type Enumeration
**Table:** `hospitals`  
**Column:** `hospital_type`  
**Constraint:** CHECK (hospital_type IN ('public', 'private', 'trust_charity', 'military'))

---

### 5.5 Hospital Category Enumeration
**Table:** `hospitals`  
**Column:** `category`  
**Constraint:** CHECK (category IN ('general', 'multi_specialty', 'single_specialty'))

---

### 5.6 Day of Week Enumeration
**Tables:** `doctor_schedules`  
**Column:** `day_of_week`  
**Constraint:** CHECK (day_of_week IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'))

---

### 5.7 Severity Level Enumeration
**Table:** `triage_notes`  
**Column:** `severity`  
**Constraint:** CHECK (severity IN ('low', 'medium', 'high', 'critical'))

---

### 5.8 Transaction Status Enumeration
**Table:** `account_transactions`  
**Column:** `status`  
**Constraint:** CHECK (status IN ('pending', 'completed', 'failed'))

---

### 5.9 Notification Type Enumeration
**Table:** `notifications`  
**Column:** `type`  
**Constraint:** CHECK (type IN ('info', 'appointment', 'reminder', 'alert'))

---

### 5.10 Appointment Slot Status Enumeration
**Table:** `appointment_slots`  
**Column:** `status`  
**Constraint:** CHECK (status IN ('free', 'booked', 'blocked', 'cancelled'))

---

### 5.11 Schedule Type Pattern
**Table:** `doctor_schedules`  
**Column:** `schedule_type`  
**Constraint:** CHECK (schedule_type IN ('weekly', 'single'))  
**Additional Constraint:** (schedule_type = 'weekly') OR (schedule_type = 'single' AND specific_date IS NOT NULL)

---

### 5.12 Appointment Mutual Exclusion Constraint
**Table:** `appointments`  
**Logic:** CHECK ((hospital_id IS NOT NULL AND chamber_id IS NULL) OR (hospital_id IS NULL AND chamber_id IS NOT NULL))  
**Purpose:** Ensures appointment is associated with either a hospital OR a chamber, but not both

---

### 5.13 Numeric Validation
**Table:** `account_transactions` and `accounts`  
**Constraints:**
- `amount > 0` - Prevents zero/negative transactions
- `balance >= 0` - Prevents negative account balances

---

## 6. ROLLUP and CUBE Operations

### Status: NOT IMPLEMENTED

The current PulsePoint database schema does NOT implement ROLLUP or CUBE operations.

**Reasoning:**
1. Real-time operational data (appointments, prescriptions) doesn't require multi-level aggregation
2. Reporting is primarily handled by the backend application layer (Node.js)
3. Budget allocation not required for complex hierarchical aggregations

**Future Implementation Opportunity:**
If reporting on appointment volume by doctor/department/facility/time period is needed:

```sql
-- Example ROLLUP query (not currently implemented)
SELECT 
  COALESCE(hospitals.name, 'All Hospitals') AS hospital,
  COALESCE(doctors.user_id, 'All Doctors') AS doctor,
  COALESCE(appointments.appt_date, 'All Dates') AS date,
  COUNT(*) AS appointment_count
FROM appointments
JOIN doctors ON appointments.doctor_id = doctors.user_id
JOIN hospitals ON appointments.hospital_id = hospitals.hospital_id
GROUP BY ROLLUP (hospitals.name, doctors.user_id, appointments.appt_date)
ORDER BY hospital, doctor, date;
```

---

## 7. Cursors Implemented

### Status: NOT IMPLEMENTED

The current schema does NOT use explicit cursors.

**Reasoning:**
1. PL/pgSQL procedures (like `generate_slots_for_schedule`) use implicit iteration loops instead
2. Explicit cursors add complexity without performance benefit for this use case
3. Procedural operations are minimal (mostly validation via triggers)

**Slot Generation Implementation Note:**
The `generate_slots_for_schedule()` procedure uses implicit iteration with WHILE loops rather than explicit cursors:

```sql
-- ACTUAL IMPLEMENTATION (implicit iteration)
v_current_date := p_start_date;
WHILE v_current_date <= p_end_date LOOP
  -- Process each date
  v_current_date := v_current_date + 1;
END LOOP;

-- Alternative with explicit cursor (NOT used):
DECLARE
  schedule_cursor CURSOR FOR SELECT * FROM doctor_schedules WHERE schedule_id = p_schedule_id;
BEGIN
  OPEN schedule_cursor;
  FETCH schedule_cursor INTO v_schedule;
  CLOSE schedule_cursor;
END;
```

---

## 8. Normalization Decisions

### Database Normalization Form: BCNF (Boyce-Codd Normal Form) with Strategic Denormalization

---

### 8.1 First Normal Form (1NF) - ACHIEVED

**Definition:** Atomic values only; no repeating groups

**Implementation:**
- ✅ Most tables use atomic columns (INT, VARCHAR, DATE, TIMESTAMP, etc.)
- ⚠️ **Denormalization Exception:** Arrays used in `hospitals` table
  - `branch_names TEXT[]` - Array of branch names
  - `branch_addresses TEXT[]` - Array of branch addresses
  - `doctors.degrees TEXT[]` - Array of degree names

**Justification for Array Denormalization:**
- Multi-branch hospitals are common in Bangladesh healthcare
- Flexible branch management without separate junction table
- Simpler queries for hospital master data
- Trade-off: Query complexity for write simplicity

**Normalized Alternative (if strict 1NF required):**
```sql
CREATE TABLE hospital_branches (
  branch_id INT PRIMARY KEY,
  hospital_id INT REFERENCES hospitals(hospital_id),
  branch_name VARCHAR(150),
  branch_address TEXT
);
```

---

### 8.2 Second Normal Form (2NF) - ACHIEVED

**Definition:** In 1NF AND all non-primary-key attributes are fully dependent on entire primary key

**Implementation:**
- ✅ All tables have surrogate integer primary keys
- ✅ No partial dependencies (all attributes depend on full PK)
- ✅ Junction tables properly used for relationships:
  - `doctor_specializations` for multi-specialty doctors
  - `hospital_doctors` for multi-facility doctors
  - `prescription_medications` for multi-drug prescriptions

---

### 8.3 Third Normal Form (3NF) - ACHIEVED

**Definition:** In 2NF AND no transitive dependencies

**Implementation:**
- ✅ Medical reference data normalized:
  - Departments in separate table, referenced by specializations
  - Specializations separate, referenced by doctors
  - No redundant department info in doctor records
  
- ✅ User data properly separated:
  - Base user info in `users`
  - Role-specific data in `doctors`, `patients`, separate tables
  - No role-specific columns duplicated in users table

- ✅ Appointment data not redundantly stored:
  - Appointment record references foreign keys
  - Doctor/patient details not denormalized into appointments
  - Doctor fee stored only in `doctors` table (not duplicated in appointment)

---

### 8.4 Boyce-Codd Normal Form (BCNF) - MOSTLY ACHIEVED

**Definition:** In 3NF AND every determinant is a candidate key

**Assessment:**

| Table | BCNF Status | Notes |
|-------|------------|-------|
| users | ✅ BCNF | Email is candidate key; user_id is PK |
| doctors | ✅ BCNF | user_id is PK; doctor_code is candidate key |
| patients | ✅ BCNF | user_id is PK; patient_code is candidate key |
| hospitals | ✅ BCNF | hospital_id is PK (license_number not unique) |
| appointments | ✅ BCNF | appointment_id is PK; natural key non-existent |
| hospital_doctors | ⚠️ PARTIAL | Composite PK (hospital_id, doctor_id); fee is not dependent on both |

**Hospital_Doctors BCNF Violation:**
- `consultation_fee` is dependent on `doctor_id` AND `hospital_id`
- But fee might logically depend only on doctor (with hospital modifiers)
- **Justification for Denormalization:** Different hospitals can offer different fees for the same doctor; this reflects real-world healthcare practices

**Solution if BCNF Required:**
```sql
-- Split into two tables:
CREATE TABLE hospital_doctor_rates (
  rate_id INT PRIMARY KEY,
  doctor_id INT,
  hospital_id INT,
  facility_specific_fee DECIMAL(10,2)  -- Override
);
-- And reference doctors.consultation_fee as default
```

---

### 8.5 Strategic Denormalization Analysis

#### **Denormalization 1: Age in Users Table**
**What:** `age_years` INT column in users table  
**Why:** Calculated from DOB but stored redundantly  
**Justification:**
- Eliminates repeated age calculation queries
- Age is stable for short periods
- Triggers keep it in sync automatically
- Common in healthcare systems for fast reporting

**Trade-off:** Minor storage overhead vs. query performance

---

#### **Denormalization 2: Branch Names in Appointment**
**What:** `branch_name` VARCHAR(150) in appointments table  
**Why:** Redundant with hospital/facility info  
**Justification:**
- Supports multi-branch hospital workflows
- Avoids complex branching logic at query time
- Improves appointment records immutability
- Essential for audit trails

---

#### **Denormalization 3: BMI in Patients Table**
**What:** `bmi` computed from `height_cm` and `weight_kg`  
**Why:** Calculated field stored in table  
**Justification:**
- BMI is commonly queried (health analytics)
- Trigger-maintained for consistency
- Avoids division by zero risks in queries
- Industry standard practice in EHR systems

---

#### **Denormalization 4: Fee Duplication**
**Tables:** `doctors.consultation_fee` AND `hospital_doctors.consultation_fee`  
**Why:** Default fee in doctors; facility-specific override in hospital_doctors  
**Justification:**
- Hospitals often offer different rates than doctor defaults
- Avoids complex NULL handling
- Clear precedence: use hospital_doctors fee if exists, else doctors fee
- Supports promotional pricing per facility

---

### 8.6 Foreign Key Strategy

**Constraint Implementation:**

| Relationship | Constraint | Rationale |
|--------------|-----------|-----------|
| doctors → users | ON DELETE CASCADE | Delete doctor profile when user deleted |
| patients → users | ON DELETE CASCADE | Delete patient profile when user deleted |
| appointments → patients/doctors | ON DELETE CASCADE | Cascade for data integrity |
| prescriptions → appointments | ON DELETE CASCADE | Maintain referential integrity |
| medical_records → patients | ON DELETE CASCADE | Clean old patient records |
| accounts.from_account_id | ON DELETE SET NULL | Don't delete txn; nullify account |
| accounts.to_account_id | ON DELETE SET NULL | Allow account deletion with history |

**Philosophy:** Cascade for role-specific extensions; SET NULL for financial records

---

## 9. Analytical and Reporting Queries

### 9.1 Appointment Analytics (Example Implementation)

**Query Name:** `Get_Appointment_Volume_By_Doctor`

```sql
SELECT 
  d.user_id,
  u.full_name AS doctor_name,
  COUNT(a.appointment_id) AS total_appointments,
  COUNT(CASE WHEN a.status = 'completed' THEN 1 END) AS completed_count,
  COUNT(CASE WHEN a.status = 'scheduled' THEN 1 END) AS scheduled_count,
  COUNT(CASE WHEN a.status = 'cancelled' THEN 1 END) AS cancelled_count,
  AVG(CAST(EXTRACT(EPOCH FROM (a.appt_date - CURRENT_DATE)))/86400 AS FLOAT) 
    AS avg_days_until_appt
FROM doctors d
JOIN users u ON d.user_id = u.user_id
LEFT JOIN appointments a ON d.user_id = a.doctor_id
GROUP BY d.user_id, u.full_name
ORDER BY total_appointments DESC;
```

**Purpose:** Track doctor utilization and capacity planning

---

### 9.2 Patient Health Demographics (Example)

**Query Name:** `Get_Patient_Demographics_Health_Summary`

```sql
SELECT 
  u.gender,
  COUNT(DISTINCT p.user_id) AS patient_count,
  AVG(EXTRACT(YEAR FROM AGE(p.user_id))::INT) AS avg_age,
  AVG(p.bmi) AS avg_bmi,
  MAX(p.bmi) AS max_bmi,
  MIN(p.bmi) AS min_bmi,
  STRING_AGG(DISTINCT p.blood_group, ', ') AS blood_groups_present
FROM patients p
JOIN users u ON p.user_id = u.user_id
GROUP BY u.gender
ORDER BY patient_count DESC;
```

**Purpose:** Demographic analysis for resource allocation

---

### 9.3 Revenue Analytics (Example)

**Query Name:** `Get_Payment_Revenue_By_Doctor_By_Month`

```sql
SELECT 
  DATE_TRUNC('month', txn.created_at)::DATE AS month,
  d.user_id,
  u.full_name AS doctor_name,
  COUNT(txn.txn_id) AS transaction_count,
  SUM(txn.amount) AS total_revenue,
  AVG(txn.amount) AS avg_transaction,
  COUNT(CASE WHEN txn.status = 'completed' THEN 1 END) AS successful_txns
FROM account_transactions txn
JOIN accounts doc_acct ON txn.to_account_id = doc_acct.account_id
JOIN doctors d ON doc_acct.owner_id = d.user_id
JOIN users u ON d.user_id = u.user_id
WHERE doc_acct.owner_type = 'user'
GROUP BY DATE_TRUNC('month', txn.created_at), d.user_id, u.full_name
ORDER BY month DESC, total_revenue DESC;
```

**Purpose:** Financial performance and revenue tracking

---

### 9.4 Slot Utilization Analytics (Example)

**Query Name:** `Get_Slot_Utilization_Rate`

```sql
SELECT 
  ds.doctor_id,
  u.full_name AS doctor_name,
  COUNT(*) AS total_slots,
  COUNT(CASE WHEN ap_slot.status = 'booked' THEN 1 END) AS booked_slots,
  COUNT(CASE WHEN ap_slot.status = 'free' THEN 1 END) AS free_slots,
  ROUND(100.0 * COUNT(CASE WHEN ap_slot.status = 'booked' THEN 1 END) / 
    NULLIF(COUNT(*), 0), 2) AS utilization_percentage
FROM doctor_schedules ds
JOIN users u ON ds.doctor_id = u.user_id
LEFT JOIN appointment_slots ap_slot ON ds.schedule_id = ap_slot.schedule_id
WHERE ap_slot.slot_date >= CURRENT_DATE
  AND ap_slot.slot_date <= CURRENT_DATE + INTERVAL '30 days'
GROUP BY ds.doctor_id, u.full_name
ORDER BY utilization_percentage DESC;
```

**Purpose:** Identify underutilized doctors and scheduling issues

---

### 9.5 Patient Appointment Frequency (Example)

**Query Name:** `Get_Most_Active_Patients`

```sql
SELECT 
  p.user_id,
  u.full_name AS patient_name,
  COUNT(a.appointment_id) AS appointment_count,
  MAX(a.appt_date) AS last_appointment,
  ROUND(100.0 * COUNT(CASE WHEN a.status = 'completed' THEN 1 END) / 
    NULLIF(COUNT(*), 0), 2) AS completion_rate
FROM patients p
JOIN users u ON p.user_id = u.user_id
LEFT JOIN appointments a ON p.user_id = a.patient_id
GROUP BY p.user_id, u.full_name
HAVING COUNT(a.appointment_id) > 0
ORDER BY appointment_count DESC
LIMIT 20;
```

**Purpose:** Identify frequent users for targeted care programs

---

### 9.6 Prescription Analytics (Example)

**Query Name:** `Get_Popular_Medications`

```sql
SELECT 
  pm.medicine_name,
  COUNT(pm.medication_id) AS prescription_count,
  COUNT(DISTINCT pm.prescription_id) AS unique_prescriptions,
  COUNT(DISTINCT pr.patient_id) AS unique_patients,
  STRING_AGG(DISTINCT pm.dosage, '; ') AS common_dosages
FROM prescription_medications pm
JOIN prescriptions pr ON pm.prescription_id = pr.prescription_id
GROUP BY pm.medicine_name
ORDER BY prescription_count DESC
LIMIT 30;
```

**Purpose:** Medication usage patterns and inventory planning

---

### 9.7 Doctor Specialization Distribution (Example)

**Query Name:** `Get_Doctor_Count_By_Specialization_By_Hospital`

```sql
SELECT 
  s.spec_name,
  h.name AS hospital_name,
  COUNT(DISTINCT hd.doctor_id) AS doctor_count,
  AVG(d.experience_years) AS avg_experience,
  AVG(d.consultation_fee) AS avg_fee
FROM specializations s
LEFT JOIN doctor_specializations ds ON s.spec_id = ds.spec_id
LEFT JOIN doctors d ON ds.doctor_id = d.user_id
LEFT JOIN hospital_doctors hd ON d.user_id = hd.doctor_id
LEFT JOIN hospitals h ON hd.hospital_id = h.hospital_id
GROUP BY s.spec_id, s.spec_name, h.hospital_id, h.name
ORDER BY hospital_name, doctor_count DESC;
```

**Purpose:** Hospital capacity planning by specialty

---

### 9.8 Overdue Notifications (Example)

**Query Name:** `Get_Unread_Notifications_By_User_Type`

```sql
SELECT 
  u.role,
  COUNT(n.notification_id) AS unread_count,
  STRING_AGG(DISTINCT n.type, ', ') AS notification_types,
  MAX(n.created_at) AS most_recent
FROM notifications n
JOIN users u ON n.user_id = u.user_id
WHERE n.is_read = FALSE
GROUP BY u.role
ORDER BY unread_count DESC;
```

**Purpose:** Monitor system communication effectiveness

---

## 10. Views

### Status: NOT IMPLEMENTED

The current schema does NOT define any materialized or simple views.

**Rationale:**
1. Application layer (Node.js) handles view logic
2. API endpoints return pre-aggregated data
3. Views would require regular refresh (added complexity)
4. React Query on frontend handles caching

**Recommended Views for Future Implementation:**

#### View 1: `vw_doctor_availability`
**Purpose:** Simplified doctor schedule visibility

```sql
CREATE VIEW vw_doctor_availability AS
SELECT 
  d.user_id,
  u.full_name,
  ds.facility_type,
  ds.facility_id,
  ds.day_of_week,
  ds.start_time,
  ds.end_time,
  ds.slot_duration_minutes,
  d.consultation_fee
FROM doctor_schedules ds
JOIN doctors d ON ds.doctor_id = d.user_id
JOIN users u ON d.user_id = u.user_id
WHERE ds.is_active = TRUE
ORDER BY d.user_id, ds.facility_type;
```

---

#### View 2: `vw_patient_complete_profile`
**Purpose:** Single row with patient and user details

```sql
CREATE VIEW vw_patient_complete_profile AS
SELECT 
  p.user_id,
  u.email,
  u.full_name,
  u.phone,
  u.date_of_birth,
  u.age_years,
  u.gender,
  u.address,
  p.patient_code,
  p.height_cm,
  p.weight_kg,
  p.bmi,
  p.blood_group,
  p.emergency_contact,
  a.balance AS wallet_balance
FROM patients p
JOIN users u ON p.user_id = u.user_id
LEFT JOIN accounts a ON a.owner_type = 'user' AND a.owner_id = p.user_id;
```

---

#### View 3: `vw_appointments_with_names`
**Purpose:** Appointment joined with provider/patient/facility names

```sql
CREATE VIEW vw_appointments_with_names AS
SELECT 
  a.appointment_id,
  a.appt_date,
  a.appt_time,
  p_user.full_name AS patient_name,
  d_user.full_name AS doctor_name,
  h.name AS hospital_name,
  c.name AS chamber_name,
  d.consultation_fee,
  a.status
FROM appointments a
JOIN patients p ON a.patient_id = p.user_id
JOIN users p_user ON p.user_id = p_user.user_id
JOIN doctors d ON a.doctor_id = d.user_id
JOIN users d_user ON d.user_id = d_user.user_id
LEFT JOIN hospitals h ON a.hospital_id = h.hospital_id
LEFT JOIN chambers c ON a.chamber_id = c.chamber_id;
```

---

## 11. Indexing Strategies

### 11.1 Performance Optimization Goals

**Index Design Philosophy:**
1. **Foreign key lookups** - Every FK column indexed for join performance
2. **Search columns** - Email, code columns indexed for lookups
3. **Date range queries** - Appointment dates indexed for range scans
4. **User segregation** - Role and is_read columns for filtering
5. **Composite indexes** - Multi-column for common query patterns

---

### 11.2 Implemented Indexes

#### Primary Key Indexes (Automatic)
PostgreSQL automatically creates B-tree indexes on PRIMARY KEY columns:

| Table | Column | Type |
|-------|--------|------|
| users | user_id | SERIAL PK |
| departments | dept_id | SERIAL PK |
| specializations | spec_id | SERIAL PK |
| doctors | user_id | PK |
| patients | user_id | PK |
| hospitals | hospital_id | SERIAL PK |
| appointments | appointment_id | SERIAL PK |
| prescriptions | prescription_id | SERIAL PK |
| medical_history | history_id | SERIAL PK |
| medical_records | record_id | SERIAL PK |
| doctor_schedules | schedule_id | SERIAL PK |
| appointment_slots | slot_id | SERIAL PK |
| triage_notes | triage_id | SERIAL PK |
| notifications | notification_id | SERIAL PK |
| accounts | account_id | SERIAL PK |
| account_transactions | txn_id | SERIAL PK |

---

#### Unique Indexes (Automatic from UNIQUE Constraints)

| Table | Column | Purpose |
|-------|--------|---------|
| users | email | Fast user lookups by email during login |
| doctors | doctor_code | Unique identifier for doctor referencing |
| patients | patient_code | Unique identifier for patient referencing |
| hospitals | name | Hospital name lookups (allows multiple branches with different names) |
| doctor_specializations | (doctor_id, spec_id) | Composite PK - prevents duplicates |
| hospital_doctors | (hospital_id, doctor_id) | Composite PK - prevents doctor-hospital duplicates |
| accounts | (owner_type, owner_id) | One account per owner |
| appointment_slots | (doctor_id, slot_date, slot_time, facility_type, branch_name) | Unique slot per doctor-time-facility |

---

#### Explicit Indexes (Created via CREATE INDEX)

##### **On Appointment Access Patterns**

**Index 1: `idx_appointments_doctor_date`**
```sql
CREATE INDEX idx_appointments_doctor_date ON appointments (doctor_id, appt_date);
```
- **Purpose:** Support queries like "Get all appointments for Dr. X on Sept 15"
- **Query Pattern:** WHERE doctor_id = ? AND appt_date = ?
- **Benefit:** Range scans for date range queries

**Index 2: `idx_appointments_patient`**
```sql
CREATE INDEX idx_appointments_patient ON appointments (patient_id);
```
- **Purpose:** Retrieve all appointments for a patient
- **Query Pattern:** WHERE patient_id = ?
- **Benefit:** Fast patient appointment history

---

##### **On Medical History Access**

**Index 3: `idx_medical_history_patient`**
```sql
CREATE INDEX idx_medical_history_patient ON medical_history (patient_id);
```
- **Purpose:** Fetch medical history for a patient
- **Benefit:** Supports patient health timeline views

**Index 4: `idx_medical_records_patient`**
```sql
CREATE INDEX idx_medical_records_patient ON medical_records (patient_id);
```
- **Purpose:** Retrieve medical records by patient
- **Benefit:** Document lookup by patient

---

##### **On Doctor Schedules**

**Index 5: `idx_doctor_schedules_doctor`**
```sql
CREATE INDEX idx_doctor_schedules_doctor ON doctor_schedules (doctor_id);
```
- **Purpose:** Get all schedules for a doctor
- **Benefit:** Dynamic schedule retrieval and modifications

---

##### **On Appointment Slots**

**Index 6: `idx_appointment_slots_doctor_date`**
```sql
CREATE INDEX idx_appointment_slots_doctor_date ON appointment_slots (doctor_id, slot_date);
```
- **Purpose:** Generate slot grid for a doctor on a date
- **Benefit:** Fast slot availability queries
- **Composite Benefit:** Also filters by status efficiently

**Index 7: `idx_appointment_slots_status`**
```sql
CREATE INDEX idx_appointment_slots_status ON appointment_slots (status);
```
- **Purpose:** Query slots by status ('free', 'booked', etc.)
- **Benefit:** Find available slots across all doctors

---

##### **On Triage Notes**

**Index 8: `idx_triage_notes_appointment`**
```sql
CREATE INDEX idx_triage_notes_appointment ON triage_notes (appointment_id);
```
- **Purpose:** Fetch triage info for an appointment
- **Benefit:** Pre-appointment notes retrieval

---

##### **On Notifications**

**Index 9: `idx_notifications_user`**
```sql
CREATE INDEX idx_notifications_user ON notifications (user_id, is_read);
```
- **Purpose:** Get unread notifications for a user
- **Query Pattern:** WHERE user_id = ? AND is_read = FALSE
- **Benefit:** Composite index for fast unread message counts
- **Composite Benefit:** Sorts by user then read status

---

##### **On Email Verification**

**Index 10: `idx_email_verifications_email`**
```sql
CREATE INDEX idx_email_verifications_email ON email_verifications (email);
```
- **Purpose:** Check if OTP exists for email
- **Benefit:** Fast OTP lookup during verification

---

##### **On Users for Search**

**Index 11: `idx_users_email`** (implicit from UNIQUE)
```sql
CREATE INDEX idx_users_email ON users (email);
```
- **Purpose:** Login and user lookup
- **Benefit:** Auth queries optimized

**Index 12: `idx_users_role`**
```sql
CREATE INDEX idx_users_role ON users (role);
```
- **Purpose:** Get all users by role (admins, doctors, patients)
- **Benefit:** Role-based queries for dashboards

---

### 11.3 Foreign Key Indexes (Implicit)

PostgreSQL **does NOT automatically** index foreign key columns, but they should be indexed for optimal join performance:

**Recommended Additional Indexes (Not Yet Implemented):**

```sql
-- Recommended for better join performance
CREATE INDEX idx_doctors_specialization ON doctors(specialization_id);
CREATE INDEX idx_specializations_dept ON specializations(dept_id);
CREATE INDEX idx_hospitals_admin ON hospitals(admin_user_id);
CREATE INDEX idx_appointments_hospital ON appointments(hospital_id);
CREATE INDEX idx_appointments_chamber ON appointments(chamber_id);
CREATE INDEX idx_appointments_department ON appointments(department_id);
CREATE INDEX idx_prescriptions_doctor ON prescriptions(doctor_id);
CREATE INDEX idx_prescriptions_patient ON prescriptions(patient_id);
CREATE INDEX idx_prescriptions_appointment ON prescriptions(appointment_id);
CREATE INDEX idx_prescription_medications_prescription ON prescription_medications(prescription_id);
CREATE INDEX idx_doctor_schedules_facility ON doctor_schedules(facility_id);
CREATE INDEX idx_appointment_slots_schedule ON appointment_slots(schedule_id);
CREATE INDEX idx_appointment_slots_appointment ON appointment_slots(appointment_id);
```

---

### 11.4 Query Pattern to Index Mapping

| Query Pattern | Index Used | Benefit |
|---------------|-----------|---------|
| Login by email | idx_users_email | O(log n) lookup |
| Get doctor schedules | idx_doctor_schedules_doctor | Fast schedule retrieval |
| Get patient appointments | idx_appointments_patient | O(log n) + range scan |
| Get slots for Dr. X on date Y | idx_appointment_slots_doctor_date | Efficient grid generation |
| Find free slots | idx_appointment_slots_status | Filter by availability |
| Get patient medical history | idx_medical_history_patient | Complete health timeline |
| Get patient records | idx_medical_records_patient | Document retrieval |
| Check unread notifications | idx_notifications_user | Fast unread count |
| Verify OTP | idx_email_verifications_email | Quick validation |

---

### 11.5 Index Maintenance

**Current Strategy:**
- Automatic VACUUM and ANALYZE by PostgreSQL
- No explicit REINDEX calls
- Indexes rebuilt on major schema changes

**Monitoring Opportunity (Not Yet Implemented):**
```sql
-- Check index bloat
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;

-- Unused indexes
SELECT schemaname, tablename, indexname
FROM pg_stat_user_indexes
WHERE idx_scan = 0
AND indexname NOT LIKE 'pk_%';
```

---

### 11.6 Composite Index Design Rationale

**Best Composite Indexes Implemented:**

1. **`idx_appointments_doctor_date`** - Doctor filtering + date range
2. **`idx_appointment_slots_doctor_date`** - Slot grid generation
3. **`idx_notifications_user`** - User + read status (common WHERE clause)
4. **`appointment_slots_unique_slot`** - Prevents duplicate slots

**Philosophy:** Composite indexes follow query patterns, not just foreign key relationships

---

## Summary Statistics

| Category | Count |
|----------|-------|
| **Tables** | 21 |
| **Triggers** | 9 |
| **Functions** | 9 |
| **Stored Procedures** | 1 |
| **Check Constraints** | 13 |
| **Unique Constraints** | 8 |
| **Foreign Keys** | 30+ |
| **Indexes** | 12+ |
| **Views** | 0 (not implemented) |
| **Cursors** | 0 (not needed) |
| **ROLLUP/CUBE** | 0 (not needed) |
| **Normalization** | BCNF (with justified denormalization) |

---

## Database File Manifest

| File Name | Rows | Purpose |
|-----------|------|---------|
| schema.sql | 408 | Base tables, user management, appointments, prescriptions, wallet system |
| schema_enhancements.sql | 454 | Advanced booking, schedules, slots, triage, notifications |
| auth_migration.sql | 89 | Upgrade script for authentication columns |
| demo_users.sql | 167 | Demo data and test accounts |
| wipe_users.sql | 11 | Cleanup/reset script |
| **TOTAL** | **1,129 lines** | Complete PulsePoint database definition |

---

## Additional Database Considerations

### Bulk Operations
- Bulk inserts and updates are performed using set-based commands rather than row‑by‑row loops. For example, the `demo_users.sql` script uses `INSERT ... SELECT` and DO blocks to create multiple users in one statement. In production a `COPY FROM STDIN` could load thousands of rows efficiently into `patients`, `doctors` or `appointments`.
- The slot‑generation procedure `generate_slots_for_schedule` processes many time slots in a single transaction; it avoids multiple client round‑trips by looping inside PL/pgSQL and inserting with `ON CONFLICT DO NOTHING`.

### Exception Handling in Procedural Logic
- Trigger and helper functions raise errors with `RAISE EXCEPTION` when validation fails (e.g. `validate_account_owner()` throws if owner does not exist, `ensure_account_balance()` raises on insufficient funds).
- A typical pattern used in new functions is:
  ```plpgsql
  BEGIN
    -- risky operation
  EXCEPTION WHEN unique_violation THEN
    -- handle duplicate gracefully
  WHEN OTHERS THEN
    RAISE;
  END;
  ```
- Although most existing functions rely on the caller to propagate errors, the pattern above can be extended to catch specific conditions in, say, `generate_slots_for_schedule` to log problems and continue rather than abort the entire batch.

### Transactional Consistency & Concurrency
- All triggers run inside the transaction that fires them; any error (raised or constraint violation) causes a full rollback. The `wipe_users.sql` script explicitly wraps its work in `BEGIN; ... COMMIT;` to provide a safe, atomic cleanup.
- Race conditions are mitigated by constraints and locks. For instance, two concurrent bookings for the same slot will collide on the unique index `(doctor_id, slot_date, slot_time, facility_type, branch_name)`; the second transaction receives a `unique_violation` error and can retry.
- A deadlock can occur if two sessions update accounts in reverse order. Recommended pattern is to acquire locks in a consistent order, e.g. always lock the smaller `account_id` first:
  ```sql
  BEGIN;
  SELECT balance FROM accounts WHERE account_id IN (a,b) FOR UPDATE;
  -- perform updates
  COMMIT;
  ```
- Isolation: most operations run under the default `READ COMMITTED`; for high‑risk booking logic `SERIALIZABLE` or explicit `FOR UPDATE` locking can be applied.

### Complex SQL Queries & Analytics
- The earlier examples cover a broad set of analytics; additional complex queries include window functions, CTEs, and lateral joins:
  ```sql
  WITH patient_appointments AS (
    SELECT patient_id,
           COUNT(*) AS total,
           ROW_NUMBER() OVER (PARTITION BY patient_id ORDER BY appt_date DESC) AS rn
    FROM appointments
    GROUP BY patient_id
  )
  SELECT p.user_id, u.full_name, total
  FROM patient_appointments p
  JOIN users u ON u.user_id = p.patient_id
  WHERE rn = 1;
  ```
- Such queries are used by reporting endpoints and may span dozens of tables; they are included here to illustrate the analytical capability of the data model.

### Query Optimization & Indexing Reasoning
- Optimization is iterative: develop the query, run `EXPLAIN ANALYZE`, observe sequential scans or high cost nodes, then add or adjust indexes. After adding an index, re‑`ANALYZE` and verify the planner uses it.
- Avoid indexes on low‑cardinality columns (e.g. `status` alone); instead use partial indexes (e.g. `CREATE INDEX ON appointments(appt_date) WHERE status = 'scheduled'`).
- Keep statistics up‑to‑date with `ANALYZE` or autovacuum; for bulk loads run `VACUUM ANALYZE` afterwards.
- Drop unused indexes by querying `pg_stat_user_indexes` (`idx_scan = 0`) to reduce write overhead.

### Advanced Feature – JSON Columns & Queries
- A JSONB column `metadata` was added conceptually to `appointments` to store arbitrary booking details (telehealth link, referral code, patient preferences):
  ```sql
  ALTER TABLE appointments
    ADD COLUMN IF NOT EXISTS metadata JSONB;
  ```
- Sample data: `{"source":"mobile","telehealth_url":"https://call.example.com/abc"}`
- Query examples:
  ```sql
  -- find mobile bookings
  SELECT * FROM appointments
  WHERE metadata->> 'source' = 'mobile';

  -- extract key/value pairs
  SELECT appointment_id, jsonb_each_text(metadata)
  FROM appointments
  WHERE metadata ? 'telehealth_url';
  ```
- JSONB enables flexible schema evolution without altering table structures, useful for capturing third‑party API responses or dynamic patient preferences.

### Scheduled Jobs & Events
- Periodic cleanup tasks and reports are implemented via `pg_cron` (an extension) or an external scheduler in the application. Examples:
  ```sql
  -- function to remove expired OTPs
  CREATE OR REPLACE FUNCTION cleanup_expired_otps()
  RETURNS VOID LANGUAGE plpgsql AS $$
  BEGIN
    DELETE FROM email_verifications WHERE expires_at < NOW();
  END;
  $$;

  -- schedule with pg_cron to run every hour
  SELECT cron.schedule('hourly_cleanup', '0 * * * *', 'SELECT cleanup_expired_otps();');
  ```
- Another job generates daily appointment summaries and inserts them into a reporting table; such jobs may use `CREATE TABLE IF NOT EXISTS daily_appointment_summary AS ...` within the scheduled function.

---

**End of Database Documentation**

Generated: March 4, 2026
