-- Enhancements to the existing hospital management system
-- Add these tables to support advanced booking features

-- Doctor Availability Schedules (for time slot management)
CREATE TABLE IF NOT EXISTS doctor_schedules (
  schedule_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  doctor_id INT NOT NULL,
  facility_id INT, -- References either hospital_id or chamber_id
  facility_type VARCHAR(10) CHECK (facility_type IN ('hospital', 'chamber')),
  branch_name VARCHAR(150),
  schedule_type VARCHAR(10) DEFAULT 'weekly' CHECK (schedule_type IN ('weekly', 'single')),
  specific_date DATE,
  day_of_week VARCHAR(10) CHECK (day_of_week IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  slot_duration_minutes INT DEFAULT 30,
  is_active BOOLEAN DEFAULT TRUE,
  FOREIGN KEY (doctor_id) REFERENCES doctors(user_id) ON DELETE CASCADE
);

-- Backward-compatible upgrades for existing databases
ALTER TABLE doctor_schedules ADD COLUMN IF NOT EXISTS branch_name VARCHAR(150);
ALTER TABLE doctor_schedules
  ADD COLUMN IF NOT EXISTS schedule_type VARCHAR(10) DEFAULT 'weekly' CHECK (schedule_type IN ('weekly', 'single'));
ALTER TABLE doctor_schedules ADD COLUMN IF NOT EXISTS specific_date DATE;

ALTER TABLE doctor_schedules DROP CONSTRAINT IF EXISTS check_schedule_type_dates;
ALTER TABLE doctor_schedules ADD CONSTRAINT check_schedule_type_dates
  CHECK (
    (schedule_type = 'weekly') OR
    (schedule_type = 'single' AND specific_date IS NOT NULL)
  );

-- Time Slots (individual bookable slots)
CREATE TABLE IF NOT EXISTS appointment_slots (
  slot_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  schedule_id INT NOT NULL,
  doctor_id INT NOT NULL,
  slot_date DATE NOT NULL,
  slot_time TIME NOT NULL,
  facility_id INT,
  facility_type VARCHAR(10) CHECK (facility_type IN ('hospital', 'chamber')),
  branch_name VARCHAR(150),
  status VARCHAR(20) DEFAULT 'free' CHECK (status IN ('free', 'booked', 'blocked', 'cancelled')),
  appointment_id INT,
  FOREIGN KEY (schedule_id) REFERENCES doctor_schedules(schedule_id) ON DELETE CASCADE,
  FOREIGN KEY (doctor_id) REFERENCES doctors(user_id) ON DELETE CASCADE,
  FOREIGN KEY (appointment_id) REFERENCES appointments(appointment_id) ON DELETE SET NULL,
  UNIQUE(doctor_id, slot_date, slot_time, facility_type, branch_name)
);

ALTER TABLE appointment_slots ADD COLUMN IF NOT EXISTS branch_name VARCHAR(150);
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS branch_name VARCHAR(150);

ALTER TABLE appointment_slots DROP CONSTRAINT IF EXISTS appointment_slots_doctor_id_slot_date_slot_time_facility_ty_key;
ALTER TABLE appointment_slots DROP CONSTRAINT IF EXISTS appointment_slots_unique_slot;
ALTER TABLE appointment_slots ADD CONSTRAINT appointment_slots_unique_slot UNIQUE(doctor_id, slot_date, slot_time, facility_type, branch_name);

-- Triage Notes (pre-appointment information)
CREATE TABLE IF NOT EXISTS triage_notes (
  triage_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  appointment_id INT NOT NULL,
  patient_id INT NOT NULL,
  symptoms TEXT,
  severity VARCHAR(20) CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (appointment_id) REFERENCES appointments(appointment_id) ON DELETE CASCADE,
  FOREIGN KEY (patient_id) REFERENCES patients(user_id) ON DELETE CASCADE
);

-- Notifications System
CREATE TABLE IF NOT EXISTS notifications (
  notification_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) DEFAULT 'info' CHECK (type IN ('info', 'appointment', 'reminder', 'alert')),
  is_read BOOLEAN DEFAULT FALSE,
  related_appointment_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (related_appointment_id) REFERENCES appointments(appointment_id) ON DELETE CASCADE
);

-- Add location column to existing tables if not exists
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS location VARCHAR(100);
ALTER TABLE chambers ADD COLUMN IF NOT EXISTS location VARCHAR(100);

-- Prescriptions v2 (multi-medication support)
CREATE TABLE IF NOT EXISTS prescription_medications (
  medication_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  prescription_id INT NOT NULL,
  medicine_name VARCHAR(100) NOT NULL,
  dosage VARCHAR(50) NOT NULL,
  duration VARCHAR(50),
  FOREIGN KEY (prescription_id) REFERENCES prescriptions(prescription_id) ON DELETE CASCADE
);

ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS doctor_id INT;
ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS patient_id INT;
ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE prescriptions DROP CONSTRAINT IF EXISTS prescriptions_doctor_fk;
ALTER TABLE prescriptions
  ADD CONSTRAINT prescriptions_doctor_fk
  FOREIGN KEY (doctor_id) REFERENCES doctors(user_id);

ALTER TABLE prescriptions DROP CONSTRAINT IF EXISTS prescriptions_patient_fk;
ALTER TABLE prescriptions
  ADD CONSTRAINT prescriptions_patient_fk
  FOREIGN KEY (patient_id) REFERENCES patients(user_id);

-- Ensure user roles include hospital_admin (older DBs may not)
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users
  ADD CONSTRAINT users_role_check
  CHECK (role IN ('patient', 'doctor', 'hospital_admin', 'admin'));

-- Hospital verification / onboarding fields
-- Allow multiple branches to share the same registration/license number.
ALTER TABLE hospitals DROP CONSTRAINT IF EXISTS hospitals_license_number_key;

ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS tax_id VARCHAR(50);
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS hospital_type VARCHAR(30);
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS category VARCHAR(30);
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS specialty VARCHAR(100);
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS website_url TEXT;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_doctor_schedules_doctor ON doctor_schedules(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointment_slots_doctor_date ON appointment_slots(doctor_id, slot_date);
CREATE INDEX IF NOT EXISTS idx_appointment_slots_status ON appointment_slots(status);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_triage_notes_appointment ON triage_notes(appointment_id);

-- Function to automatically create notification on appointment changes
CREATE OR REPLACE FUNCTION notify_appointment_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Notify patient
  INSERT INTO notifications (user_id, title, message, type, related_appointment_id)
  VALUES (
    NEW.patient_id,
    'Appointment Update',
    'Your appointment status is now ' || NEW.status,
    'appointment',
    NEW.appointment_id
  );
  
  -- Notify doctor
  INSERT INTO notifications (user_id, title, message, type, related_appointment_id)
  VALUES (
    NEW.doctor_id,
    'Appointment Update',
    'Appointment status updated to ' || NEW.status,
    'appointment',
    NEW.appointment_id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for appointment notifications
DROP TRIGGER IF EXISTS appointment_change_trigger ON appointments;
CREATE TRIGGER appointment_change_trigger
  AFTER INSERT OR UPDATE OF status ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION notify_appointment_change();

-- Function to generate time slots based on doctor schedule
CREATE OR REPLACE FUNCTION generate_slots_for_schedule(
  p_schedule_id INT,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS void AS $$
DECLARE
  v_schedule RECORD;
  v_current_date DATE;
  v_current_time TIME;
BEGIN
  -- Get schedule details
  SELECT * INTO v_schedule FROM doctor_schedules WHERE schedule_id = p_schedule_id AND is_active = TRUE;
  
  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- Handle 'single' schedules (one specific date)
  IF v_schedule.schedule_type = 'single' THEN
    IF v_schedule.specific_date >= p_start_date AND v_schedule.specific_date <= p_end_date THEN
      v_current_date := v_schedule.specific_date;
      v_current_time := v_schedule.start_time;

      WHILE v_current_time < v_schedule.end_time LOOP
        INSERT INTO appointment_slots (
          schedule_id, doctor_id, slot_date, slot_time,
          facility_id, facility_type, branch_name, status
        )
        VALUES (
          v_schedule.schedule_id,
          v_schedule.doctor_id,
          v_current_date,
          v_current_time,
          v_schedule.facility_id,
          v_schedule.facility_type,
          v_schedule.branch_name,
          'free'
        )
        ON CONFLICT (doctor_id, slot_date, slot_time, facility_type, branch_name) DO NOTHING;

        v_current_time := v_current_time + (v_schedule.slot_duration_minutes || ' minutes')::INTERVAL;
      END LOOP;
    END IF;

    RETURN;
  END IF;
  
  -- Loop through dates
  v_current_date := p_start_date;
  WHILE v_current_date <= p_end_date LOOP
    -- Check if current date matches the day of week
    -- Use FMDay to avoid trailing spaces from the 'Day' format.
    IF TRIM(TO_CHAR(v_current_date, 'FMDay')) = TRIM(v_schedule.day_of_week) THEN
      -- Generate slots for this day
      v_current_time := v_schedule.start_time;
      WHILE v_current_time < v_schedule.end_time LOOP
        -- Insert slot if it doesn't exist
        INSERT INTO appointment_slots (
          schedule_id, doctor_id, slot_date, slot_time, 
          facility_id, facility_type, branch_name, status
        )
        VALUES (
          v_schedule.schedule_id,
          v_schedule.doctor_id,
          v_current_date,
          v_current_time,
          v_schedule.facility_id,
          v_schedule.facility_type,
          v_schedule.branch_name,
          'free'
        )
        ON CONFLICT (doctor_id, slot_date, slot_time, facility_type, branch_name) DO NOTHING;
        
        -- Increment time by slot duration
        v_current_time := v_current_time + (v_schedule.slot_duration_minutes || ' minutes')::INTERVAL;
      END LOOP;
    END IF;
    
    v_current_date := v_current_date + 1;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Payment safety: avoid duplicate appointment payments
-- Some flows charge at booking time; this trigger only backfills payment on completion
-- when no payment transaction has been recorded yet.
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
