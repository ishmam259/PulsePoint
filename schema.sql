CREATE TABLE users (
  user_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  phone VARCHAR(20),
  date_of_birth DATE,
  age_years INT,
  gender VARCHAR(20),
  address TEXT,
  password_hash VARCHAR(255),
  role VARCHAR(20) DEFAULT 'patient' CHECK (role IN ('patient', 'doctor', 'hospital_admin', 'admin')),
  is_active BOOLEAN DEFAULT TRUE,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE departments (
  dept_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE specializations (
  spec_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  spec_name VARCHAR(100) UNIQUE NOT NULL,
  dept_id INT REFERENCES departments(dept_id)
);

CREATE TABLE doctors (
  user_id INT PRIMARY KEY,
  doctor_code VARCHAR(50) UNIQUE,
  consultation_fee DECIMAL(10,2),
  license_number VARCHAR(50),
  specialization_id INT REFERENCES specializations(spec_id),
  experience_years INT,
  qualification VARCHAR(255),
  degrees TEXT[],
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE doctor_specializations (
  doctor_id INT,
  spec_id INT,
  PRIMARY KEY (doctor_id, spec_id),
  FOREIGN KEY (doctor_id) REFERENCES doctors(user_id) ON DELETE CASCADE,
  FOREIGN KEY (spec_id) REFERENCES specializations(spec_id)
);

CREATE TABLE patients (
  user_id INT PRIMARY KEY,
  patient_code VARCHAR(50) UNIQUE,
  height_cm DECIMAL(5,2),
  weight_kg DECIMAL(5,2),
  bmi DECIMAL(5,2),
  blood_group VARCHAR(5),
  medical_notes TEXT,
  emergency_contact VARCHAR(20),
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE hospitals (
  hospital_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  admin_user_id INT NOT NULL,
  name VARCHAR(150) NOT NULL,
  est_year INT,
  email VARCHAR(100),
  phone VARCHAR(20),
  address TEXT,
  license_number VARCHAR(50),
  tax_id VARCHAR(50),
  hospital_type VARCHAR(30) CHECK (hospital_type IN ('public', 'private', 'trust_charity', 'military')),
  category VARCHAR(30) CHECK (category IN ('general', 'multi_specialty', 'single_specialty')),
  specialty VARCHAR(100),
  website_url TEXT,
  location TEXT,
  branch_names TEXT[],
  branch_addresses TEXT[],
  FOREIGN KEY (admin_user_id) REFERENCES users(user_id)
);

CREATE TABLE hospital_doctors (
  hospital_id INT,
  doctor_id INT,
  consultation_fee DECIMAL(10,2),
  PRIMARY KEY (hospital_id, doctor_id),
  FOREIGN KEY (hospital_id) REFERENCES hospitals(hospital_id) ON DELETE CASCADE,
  FOREIGN KEY (doctor_id) REFERENCES doctors(user_id) ON DELETE CASCADE
);

CREATE TABLE chambers (
  chamber_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  doctor_id INT NOT NULL,
  name VARCHAR(150),
  phone VARCHAR(20),
  address TEXT,
  FOREIGN KEY (doctor_id) REFERENCES doctors(user_id) ON DELETE CASCADE
);

CREATE TABLE appointments (
  appointment_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  patient_id INT NOT NULL,
  doctor_id INT NOT NULL,
  hospital_id INT,
  chamber_id INT,
  department_id INT,
  branch_name VARCHAR(150),
  appt_date DATE NOT NULL,
  appt_time TIME NOT NULL,
  status VARCHAR(20) DEFAULT 'scheduled',
  note TEXT,

  CHECK (
    (hospital_id IS NOT NULL AND chamber_id IS NULL)
    OR
    (hospital_id IS NULL AND chamber_id IS NOT NULL)
  ),

  FOREIGN KEY (patient_id) REFERENCES patients(user_id) ON DELETE CASCADE,
  FOREIGN KEY (doctor_id) REFERENCES doctors(user_id),
  FOREIGN KEY (hospital_id) REFERENCES hospitals(hospital_id),
  FOREIGN KEY (chamber_id) REFERENCES chambers(chamber_id),
  FOREIGN KEY (department_id) REFERENCES departments(dept_id)
);

CREATE TABLE prescriptions (
  prescription_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  appointment_id INT NOT NULL,
  doctor_id INT NOT NULL,
  patient_id INT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (appointment_id) REFERENCES appointments(appointment_id) ON DELETE CASCADE,
  FOREIGN KEY (doctor_id) REFERENCES doctors(user_id),
  FOREIGN KEY (patient_id) REFERENCES patients(user_id)
);

CREATE TABLE prescription_medications (
  medication_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  prescription_id INT NOT NULL,
  medicine_name VARCHAR(100) NOT NULL,
  dosage VARCHAR(50) NOT NULL,
  duration VARCHAR(50),
  FOREIGN KEY (prescription_id) REFERENCES prescriptions(prescription_id) ON DELETE CASCADE
);

CREATE TABLE medical_history (
  history_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  patient_id INT NOT NULL,
  doctor_id INT NOT NULL,
  visit_date DATE NOT NULL,
  diagnosis TEXT,
  notes TEXT,
  FOREIGN KEY (patient_id) REFERENCES patients(user_id) ON DELETE CASCADE,
  FOREIGN KEY (doctor_id) REFERENCES doctors(user_id)
);

CREATE TABLE IF NOT EXISTS medical_records (
  record_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  patient_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  record_type VARCHAR(50) NOT NULL,
  record_date DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT,
  file_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(user_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_medical_records_patient
  ON medical_records(patient_id);

CREATE TABLE IF NOT EXISTS email_verifications (
  id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  otp VARCHAR(10) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_email_verifications_email
  ON email_verifications(email);

CREATE INDEX idx_appointments_doctor_date
  ON appointments (doctor_id, appt_date);

CREATE INDEX idx_appointments_patient
  ON appointments (patient_id);

CREATE INDEX idx_medical_history_patient
  ON medical_history (patient_id);

CREATE TABLE IF NOT EXISTS accounts (
  account_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  owner_type VARCHAR(20) NOT NULL CHECK (owner_type IN ('user', 'hospital')),
  owner_id INT NOT NULL,
  balance NUMERIC(12,2) NOT NULL DEFAULT 0,
  currency VARCHAR(3) NOT NULL DEFAULT 'BDT',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (owner_type, owner_id)
);

CREATE TABLE IF NOT EXISTS account_transactions (
  txn_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  from_account_id INT,
  to_account_id INT,
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  status VARCHAR(20) NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed')),
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (from_account_id) REFERENCES accounts(account_id) ON DELETE SET NULL,
  FOREIGN KEY (to_account_id) REFERENCES accounts(account_id) ON DELETE SET NULL
);

CREATE OR REPLACE FUNCTION validate_account_owner()
RETURNS TRIGGER AS $$
DECLARE
  owner_exists INT;
BEGIN
  IF NEW.owner_type = 'user' THEN
    SELECT COUNT(*) INTO owner_exists FROM users WHERE user_id = NEW.owner_id;
  ELSIF NEW.owner_type = 'hospital' THEN
    SELECT COUNT(*) INTO owner_exists FROM hospitals WHERE hospital_id = NEW.owner_id;
  ELSE
    owner_exists := 0;
  END IF;

  IF owner_exists = 0 THEN
    RAISE EXCEPTION 'Account owner does not exist';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS accounts_owner_check ON accounts;
CREATE TRIGGER accounts_owner_check
  BEFORE INSERT OR UPDATE ON accounts
  FOR EACH ROW
  EXECUTE FUNCTION validate_account_owner();

CREATE OR REPLACE FUNCTION touch_account_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS accounts_touch_updated_at ON accounts;
CREATE TRIGGER accounts_touch_updated_at
  BEFORE UPDATE ON accounts
  FOR EACH ROW
  EXECUTE FUNCTION touch_account_updated_at();

CREATE OR REPLACE FUNCTION ensure_account_balance()
RETURNS TRIGGER AS $$
DECLARE
  current_balance NUMERIC(12,2);
BEGIN
  IF NEW.status = 'completed' AND NEW.from_account_id IS NOT NULL THEN
    SELECT balance INTO current_balance FROM accounts WHERE account_id = NEW.from_account_id FOR UPDATE;
    IF current_balance IS NULL THEN
      RAISE EXCEPTION 'Source account not found';
    END IF;
    IF current_balance < NEW.amount THEN
      RAISE EXCEPTION 'Insufficient balance';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS transactions_balance_check ON account_transactions;
CREATE TRIGGER transactions_balance_check
  BEFORE INSERT ON account_transactions
  FOR EACH ROW
  EXECUTE FUNCTION ensure_account_balance();

CREATE OR REPLACE FUNCTION apply_account_transaction()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' THEN
    IF NEW.from_account_id IS NOT NULL THEN
      UPDATE accounts SET balance = balance - NEW.amount WHERE account_id = NEW.from_account_id;
    END IF;
    IF NEW.to_account_id IS NOT NULL THEN
      UPDATE accounts SET balance = balance + NEW.amount WHERE account_id = NEW.to_account_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS transactions_apply_balance ON account_transactions;
CREATE TRIGGER transactions_apply_balance
  AFTER INSERT ON account_transactions
  FOR EACH ROW
  EXECUTE FUNCTION apply_account_transaction();

CREATE OR REPLACE FUNCTION create_appointment_payment()
RETURNS TRIGGER AS $$
DECLARE
  patient_account_id INT;
  doctor_account_id INT;
  fee NUMERIC(12,2);
  patient_balance NUMERIC(12,2);
BEGIN
  IF NEW.status <> 'completed' OR OLD.status = 'completed' THEN
    RETURN NEW;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM account_transactions
    WHERE description = ('Appointment payment for appointment ' || NEW.appointment_id)
  ) THEN
    RETURN NEW;
  END IF;

  SELECT account_id, balance INTO patient_account_id, patient_balance
  FROM accounts WHERE owner_type = 'user' AND owner_id = NEW.patient_id;

  SELECT account_id INTO doctor_account_id
  FROM accounts WHERE owner_type = 'user' AND owner_id = NEW.doctor_id;

  SELECT consultation_fee INTO fee FROM doctors WHERE user_id = NEW.doctor_id;

  IF patient_account_id IS NULL OR doctor_account_id IS NULL OR fee IS NULL THEN
    RETURN NEW;
  END IF;

  IF patient_balance >= fee THEN
    INSERT INTO account_transactions (from_account_id, to_account_id, amount, status, description)
    VALUES (patient_account_id, doctor_account_id, fee, 'completed', 'Appointment payment for appointment ' || NEW.appointment_id);
  ELSE
    INSERT INTO account_transactions (from_account_id, to_account_id, amount, status, description)
    VALUES (patient_account_id, doctor_account_id, fee, 'pending', 'Insufficient balance for appointment ' || NEW.appointment_id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS appointment_payment_trigger ON appointments;
CREATE TRIGGER appointment_payment_trigger
  AFTER UPDATE OF status ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION create_appointment_payment();

CREATE OR REPLACE FUNCTION set_user_age_years()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.date_of_birth IS NOT NULL THEN
    NEW.age_years := FLOOR(EXTRACT(YEAR FROM AGE(CURRENT_DATE, NEW.date_of_birth)));
  ELSE
    NEW.age_years := NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS users_age_calculation ON users;
CREATE TRIGGER users_age_calculation
  BEFORE INSERT OR UPDATE OF date_of_birth ON users
  FOR EACH ROW
  EXECUTE FUNCTION set_user_age_years();

CREATE OR REPLACE FUNCTION touch_user_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS users_touch_updated_at ON users;
CREATE TRIGGER users_touch_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION touch_user_updated_at();

CREATE OR REPLACE FUNCTION calculate_bmi()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.height_cm IS NOT NULL AND NEW.weight_kg IS NOT NULL THEN
    IF NEW.height_cm >= 30 AND NEW.height_cm <= 300 AND NEW.weight_kg > 0 AND NEW.weight_kg <= 500 THEN
      NEW.bmi := LEAST(
        ROUND(NEW.weight_kg / POWER((NEW.height_cm / 100)::numeric, 2), 2),
        999.99
      );
    ELSE
      NEW.bmi := NULL;
    END IF;
  ELSE
    NEW.bmi := NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS patients_bmi_trigger ON patients;
CREATE TRIGGER patients_bmi_trigger
  BEFORE INSERT OR UPDATE OF height_cm, weight_kg ON patients
  FOR EACH ROW
  EXECUTE FUNCTION calculate_bmi();
