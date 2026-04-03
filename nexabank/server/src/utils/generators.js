// generators.js
const { query } = require('../config/database');

async function generateCustomerId() {
  const prefix = 'NXB';
  const year = new Date().getFullYear().toString().slice(-2);
  let id;
  let tries = 0;
  do {
    const num = Math.floor(10000000 + Math.random() * 89999999);
    id = `${prefix}${year}${num}`;
    const exists = await query('SELECT id FROM users WHERE customer_id = $1', [id]);
    if (!exists.rows.length) break;
    tries++;
  } while (tries < 10);
  return id;
}

async function generateAccountNumber() {
  let num;
  let tries = 0;
  do {
    num = '9' + Math.floor(1000000000000000 + Math.random() * 8999999999999999).toString();
    num = num.substring(0, 18);
    const exists = await query('SELECT id FROM accounts WHERE account_number = $1', [num]);
    if (!exists.rows.length) break;
    tries++;
  } while (tries < 10);
  return num;
}

async function generateTransactionRef() {
  const now = new Date();
  const ts = now.getFullYear().toString().slice(-2) +
    (now.getMonth() + 1).toString().padStart(2, '0') +
    now.getDate().toString().padStart(2, '0') +
    now.getHours().toString().padStart(2, '0') +
    now.getMinutes().toString().padStart(2, '0');
  const rand = Math.floor(10000 + Math.random() * 90000);
  return `NXB${ts}${rand}`;
}

async function generateRequestNumber() {
  const ts = Date.now().toString().slice(-8);
  return `REQ${ts}`;
}

module.exports = { generateCustomerId, generateAccountNumber, generateTransactionRef, generateRequestNumber };
