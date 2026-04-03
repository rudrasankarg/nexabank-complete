const { query } = require('../config/database');

async function auditLog({ actorId, actorType, action, entityType, entityId, oldValues, newValues, ip }) {
  try {
    await query(
      `INSERT INTO audit_log (actor_id, actor_type, action, entity_type, entity_id, old_values, new_values, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [actorId, actorType, action, entityType, entityId,
       oldValues ? JSON.stringify(oldValues) : null,
       newValues ? JSON.stringify(newValues) : null,
       ip]
    );
  } catch (err) {
    console.error('Audit log error:', err.message);
  }
}

module.exports = { auditLog };
