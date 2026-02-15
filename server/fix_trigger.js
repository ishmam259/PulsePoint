require('dotenv').config();
const pool = require('./src/config/database');

const sql = `
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

  -- Check if ANY payment for this appointment exists
  IF EXISTS (
    SELECT 1
    FROM account_transactions
    WHERE description LIKE '%appointment ' || NEW.appointment_id || '%'
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
`;

async function run() {
    try {
        await pool.query(sql);
        console.log("Trigger function updated.");
    } catch (e) { console.error(e); }
    process.exit();
}
run();
