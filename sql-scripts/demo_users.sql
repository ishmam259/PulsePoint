-- Demo Users for PulsePoint HMS
-- Password for all demo users: password123
-- Hashed with bcrypt (10 rounds): $2b$10$nNrLedfhhYCHOEzeM8mr2.wA3szb6ZIFmEx1Fbnt3C.yLmnqSN26G

-- Insert demo specializations if not exist
INSERT INTO specializations (spec_name, dept_id) 
VALUES 
  ('Cardiology', 1),
  ('Neurology', 1),
  ('Pediatrics', 1),
  ('Orthopedics', 1),
  ('General Medicine', 1)
ON CONFLICT DO NOTHING;

-- Demo Admin User
INSERT INTO users (email, password_hash, full_name, phone, date_of_birth, gender, address, role, is_active)
VALUES (
  'admin@pulsepoint.com',
  '$2b$10$XqQjZVJZkXvW5YmN.YXrfeO6F0YY5YQqC5.Z0i6zF9aYhKvGxYmIe',
  'Admin User',
  '+1234567890',
  '1980-01-01',
  'Other',
  '123 Admin Street, City',
  'admin',
  TRUE
) ON CONFLICT (email) DO NOTHING;

-- Demo Patient 1
INSERT INTO users (email, password_hash, full_name, phone, date_of_birth, gender, address, role, is_active)
VALUES (
  'patient@test.com',
  '$2b$10$XqQjZVJZkXvW5YmN.YXrfeO6F0YY5YQqC5.Z0i6zF9aYhKvGxYmIe',
  'John Patient',
  '+1234567891',
  '1990-05-15',
  'Male',
  '456 Patient Ave, City',
  'patient',
  TRUE
) ON CONFLICT (email) DO NOTHING;

-- Get patient user_id and insert into patients table
DO $$
DECLARE
  patient_user_id INT;
BEGIN
  SELECT user_id INTO patient_user_id FROM users WHERE email = 'patient@test.com';
  
  IF patient_user_id IS NOT NULL THEN
    INSERT INTO patients (user_id, blood_group, emergency_contact)
    VALUES (patient_user_id, 'O+', '+1234567891')
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
END $$;

-- Demo Patient 2
INSERT INTO users (email, password_hash, full_name, phone, date_of_birth, gender, address, role, is_active)
VALUES (
  'jane.doe@test.com',
  '$2b$10$XqQjZVJZkXvW5YmN.YXrfeO6F0YY5YQqC5.Z0i6zF9aYhKvGxYmIe',
  'Jane Doe',
  '+1234567892',
  '1985-08-20',
  'Female',
  '789 Test Street, City',
  'patient',
  TRUE
) ON CONFLICT (email) DO NOTHING;

DO $$
DECLARE
  patient_user_id INT;
BEGIN
  SELECT user_id INTO patient_user_id FROM users WHERE email = 'jane.doe@test.com';
  
  IF patient_user_id IS NOT NULL THEN
    INSERT INTO patients (user_id, blood_group, emergency_contact)
    VALUES (patient_user_id, 'A+', '+1234567892')
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
END $$;

-- Demo Doctor 1
INSERT INTO users (email, password_hash, full_name, phone, date_of_birth, gender, address, role, is_active)
VALUES (
  'doctor@test.com',
  '$2b$10$XqQjZVJZkXvW5YmN.YXrfeO6F0YY5YQqC5.Z0i6zF9aYhKvGxYmIe',
  'Dr. Sarah Smith',
  '+1234567893',
  '1975-03-10',
  'Female',
  '321 Doctor Blvd, City',
  'doctor',
  TRUE
) ON CONFLICT (email) DO NOTHING;

DO $$
DECLARE
  doctor_user_id INT;
  cardio_spec_id INT;
BEGIN
  SELECT user_id INTO doctor_user_id FROM users WHERE email = 'doctor@test.com';
  SELECT spec_id INTO cardio_spec_id FROM specializations WHERE spec_name = 'Cardiology' LIMIT 1;
  
  IF doctor_user_id IS NOT NULL AND cardio_spec_id IS NOT NULL THEN
    INSERT INTO doctors (user_id, license_number, specialization_id, experience_years, qualification)
    VALUES (doctor_user_id, 'LIC-001-2020', cardio_spec_id, 15, 'MBBS, MD (Cardiology)')
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
END $$;

-- Demo Doctor 2
INSERT INTO users (email, password_hash, full_name, phone, date_of_birth, gender, address, role, is_active)
VALUES (
  'dr.jones@test.com',
  '$2b$10$XqQjZVJZkXvW5YmN.YXrfeO6F0YY5YQqC5.Z0i6zF9aYhKvGxYmIe',
  'Dr. Michael Jones',
  '+1234567894',
  '1978-11-25',
  'Male',
  '654 Medical Plaza, City',
  'doctor',
  TRUE
) ON CONFLICT (email) DO NOTHING;

DO $$
DECLARE
  doctor_user_id INT;
  neuro_spec_id INT;
BEGIN
  SELECT user_id INTO doctor_user_id FROM users WHERE email = 'dr.jones@test.com';
  SELECT spec_id INTO neuro_spec_id FROM specializations WHERE spec_name = 'Neurology' LIMIT 1;
  
  IF doctor_user_id IS NOT NULL AND neuro_spec_id IS NOT NULL THEN
    INSERT INTO doctors (user_id, license_number, specialization_id, experience_years, qualification)
    VALUES (doctor_user_id, 'LIC-002-2018', neuro_spec_id, 12, 'MBBS, MD (Neurology)')
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
END $$;

-- Demo Doctor 3
INSERT INTO users (email, password_hash, full_name, phone, date_of_birth, gender, address, role, is_active)
VALUES (
  'dr.wilson@test.com',
  '$2b$10$XqQjZVJZkXvW5YmN.YXrfeO6F0YY5YQqC5.Z0i6zF9aYhKvGxYmIe',
  'Dr. Emily Wilson',
  '+1234567895',
  '1982-07-14',
  'Female',
  '987 Healthcare Center, City',
  'doctor',
  TRUE
) ON CONFLICT (email) DO NOTHING;

DO $$
DECLARE
  doctor_user_id INT;
  pedia_spec_id INT;
BEGIN
  SELECT user_id INTO doctor_user_id FROM users WHERE email = 'dr.wilson@test.com';
  SELECT spec_id INTO pedia_spec_id FROM specializations WHERE spec_name = 'Pediatrics' LIMIT 1;
  
  IF doctor_user_id IS NOT NULL AND pedia_spec_id IS NOT NULL THEN
    INSERT INTO doctors (user_id, license_number, specialization_id, experience_years, qualification)
    VALUES (doctor_user_id, 'LIC-003-2019', pedia_spec_id, 10, 'MBBS, DCH')
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
END $$;

-- Display all demo accounts
SELECT 
  u.email,
  u.full_name,
  u.role,
  'password123' as password
FROM users u
WHERE u.email IN (
  'admin@pulsepoint.com',
  'patient@test.com',
  'jane.doe@test.com',
  'doctor@test.com',
  'dr.jones@test.com',
  'dr.wilson@test.com'
)
ORDER BY u.role, u.email;
