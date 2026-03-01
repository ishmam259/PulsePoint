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
