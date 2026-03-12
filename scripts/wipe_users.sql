-- SQL script to wipe all users and related data from the database
-- This will remove all patients, doctors, hospitals, appointments, medical records, and financial accounts.
-- It preserves static data like departments and specializations.

BEGIN;

-- Truncate users and accounts tables. 
-- CASCADE will automatically truncate tables that reference these, including:
-- - doctors, patients, hospitals (referencing admin_user_id)
-- - appointments, prescriptions, medical_history, medical_records
-- - doctor_schedules, appointment_slots, triage_notes, notifications
-- - account_transactions (referencing accounts)
-- - chambers, hospital_doctors, doctor_specializations
TRUNCATE TABLE users, accounts, email_verifications CASCADE;

COMMIT;
