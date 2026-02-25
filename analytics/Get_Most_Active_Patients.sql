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
