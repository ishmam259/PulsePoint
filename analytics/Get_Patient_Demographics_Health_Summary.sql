SELECT 
  u.gender,
  COUNT(DISTINCT p.user_id) AS patient_count,
  AVG(EXTRACT(YEAR FROM AGE(p.user_id))::INT) AS avg_age,
  AVG(p.bmi) AS avg_bmi,
  MAX(p.bmi) AS max_bmi,
  MIN(p.bmi) AS min_bmi,
  STRING_AGG(DISTINCT p.blood_group, ', ') AS blood_groups_present
FROM patients p
JOIN users u ON p.user_id = u.user_id
GROUP BY u.gender
ORDER BY patient_count DESC;
