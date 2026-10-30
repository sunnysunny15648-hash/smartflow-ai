import { supabaseAdmin } from '../config/supabase.js';
import { logger } from '../utils/logger.js';

export const logActivity = async ({
  organizationId,
  userId = null,
  action,
  entityType,
  entityId = null,
  metadata = {},
}) => {
  try {
    if (!organizationId) {
      logger.warn(`Audit log skipped: missing organizationId for action ${action}`);
      return;
    }

    const { error } = await supabaseAdmin.from('activity_logs').insert({
      organization_id: organizationId,
      user_id: userId,
      action,
      entity_type: entityType,
      entity_id: entityId,
      metadata,
    });

    if (error) {
      logger.error(`Failed to write activity audit log: ${error.message}`, error);
    } else {
      logger.audit(action, { organizationId, userId, entityType, entityId });
    }
  } catch (err) {
    logger.error(`Exception while recording activity log: ${err.message}`, err);
  }
};

