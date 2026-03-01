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
