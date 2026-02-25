SELECT 
  u.role,
  COUNT(n.notification_id) AS unread_count,
  STRING_AGG(DISTINCT n.type, ', ') AS notification_types,
  MAX(n.created_at) AS most_recent
FROM notifications n
JOIN users u ON n.user_id = u.user_id
WHERE n.is_read = FALSE
GROUP BY u.role
ORDER BY unread_count DESC;
