SELECT 
  DATE_TRUNC('month', txn.created_at)::DATE AS month,
  d.user_id,
  u.full_name AS doctor_name,
  COUNT(txn.txn_id) AS transaction_count,
  SUM(txn.amount) AS total_revenue,
  AVG(txn.amount) AS avg_transaction,
  COUNT(CASE WHEN txn.status = 'completed' THEN 1 END) AS successful_txns
FROM account_transactions txn
JOIN accounts doc_acct ON txn.to_account_id = doc_acct.account_id
JOIN doctors d ON doc_acct.owner_id = d.user_id
JOIN users u ON d.user_id = u.user_id
WHERE doc_acct.owner_type = 'user'
GROUP BY DATE_TRUNC('month', txn.created_at), d.user_id, u.full_name
ORDER BY month DESC, total_revenue DESC;
