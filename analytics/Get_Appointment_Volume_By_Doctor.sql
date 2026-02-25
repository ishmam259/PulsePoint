SELECT 
  d.user_id,
  u.full_name AS doctor_name,
  COUNT(a.appointment_id) AS total_appointments,
  COUNT(CASE WHEN a.status = 'completed' THEN 1 END) AS completed_count,
  COUNT(CASE WHEN a.status = 'scheduled' THEN 1 END) AS scheduled_count,
  COUNT(CASE WHEN a.status = 'cancelled' THEN 1 END) AS cancelled_count,
  AVG(CAST(EXTRACT(EPOCH FROM (a.appt_date - CURRENT_DATE)))/86400 AS FLOAT) 
    AS avg_days_until_appt
FROM doctors d
JOIN users u ON d.user_id = u.user_id
LEFT JOIN appointments a ON d.user_id = a.doctor_id
GROUP BY d.user_id, u.full_name
ORDER BY total_appointments DESC;
