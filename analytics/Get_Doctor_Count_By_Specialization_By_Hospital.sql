SELECT 
  s.spec_name,
  h.name AS hospital_name,
  COUNT(DISTINCT hd.doctor_id) AS doctor_count,
  AVG(d.experience_years) AS avg_experience,
  AVG(d.consultation_fee) AS avg_fee
FROM specializations s
LEFT JOIN doctor_specializations ds ON s.spec_id = ds.spec_id
LEFT JOIN doctors d ON ds.doctor_id = d.user_id
LEFT JOIN hospital_doctors hd ON d.user_id = hd.doctor_id
LEFT JOIN hospitals h ON hd.hospital_id = h.hospital_id
GROUP BY s.spec_id, s.spec_name, h.hospital_id, h.name
ORDER BY hospital_name, doctor_count DESC;
