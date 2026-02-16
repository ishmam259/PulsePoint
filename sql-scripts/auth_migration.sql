-- Add authentication columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255),
ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'patient' CHECK (role IN ('patient', 'doctor', 'hospital_admin', 'admin')),
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Rename dob to date_of_birth for consistency
DO $$
BEGIN
	IF EXISTS (
		SELECT 1 FROM information_schema.columns 
		WHERE table_name = 'users' AND column_name = 'dob'
	) THEN
		ALTER TABLE users RENAME COLUMN dob TO date_of_birth;
	END IF;
END $$;

-- Add gender column
ALTER TABLE users
ADD COLUMN IF NOT EXISTS gender VARCHAR(20);

-- Update specializations table column name
DO $$
BEGIN
	IF EXISTS (
		SELECT 1 FROM information_schema.columns 
		WHERE table_name = 'specializations' AND column_name = 'name'
	) THEN
		ALTER TABLE specializations RENAME COLUMN name TO spec_name;
	END IF;
END $$;

-- Add department reference to specializations
ALTER TABLE specializations
ADD COLUMN IF NOT EXISTS dept_id INT REFERENCES departments(dept_id);

-- Add license_number, experience_years, qualification to doctors
ALTER TABLE doctors
ADD COLUMN IF NOT EXISTS license_number VARCHAR(50),
ADD COLUMN IF NOT EXISTS specialization_id INT REFERENCES specializations(spec_id),
ADD COLUMN IF NOT EXISTS experience_years INT,
ADD COLUMN IF NOT EXISTS qualification VARCHAR(255),
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Add emergency_contact to patients
ALTER TABLE patients
ADD COLUMN IF NOT EXISTS emergency_contact VARCHAR(20),
ADD COLUMN IF NOT EXISTS bmi DECIMAL(5,2);

-- Appointment linkage to department
ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS department_id INT REFERENCES departments(dept_id);

-- BMI trigger to keep bmi column in sync
CREATE OR REPLACE FUNCTION calculate_bmi()
RETURNS TRIGGER AS $$
BEGIN
	IF NEW.height_cm IS NOT NULL AND NEW.height_cm > 0 AND NEW.weight_kg IS NOT NULL THEN
		NEW.bmi := ROUND(NEW.weight_kg / POWER((NEW.height_cm / 100)::numeric, 2), 2);
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

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Display updated structure
SELECT 'Users table updated with authentication columns' AS status;
