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
