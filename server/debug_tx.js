require('dotenv').config();
const pool = require('./src/config/database');

async function run() {
    try {
        const res = await pool.query("SELECT txn_id, amount, description FROM account_transactions ORDER BY created_at DESC LIMIT 10");
        res.rows.forEach(r => console.log(`${r.txn_id} | ${r.amount} | ${r.description}`));
    } catch (e) { console.error(e); }
    process.exit();
}
run();
