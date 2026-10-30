import { supabaseAdmin } from '../config/supabase.js';
import { logger } from '../utils/logger.js';

export const createNotification = async ({
  organizationId,
  userId,
  title,
  message,
  notificationType = 'info',
  entityType = null,
  entityId = null,
}) => {
  try {
    if (!organizationId || !userId) {
      logger.warn('Notification skipped: missing organizationId or userId');
      return null;
    }

    const { data, error } = await supabaseAdmin
      .from('notifications')
      .insert({
        organization_id: organizationId,
        user_id: userId,
        title,
        message,
        notification_type: notificationType,
        entity_type: entityType,
        entity_id: entityId,
        is_read: false,
      })
      .select()
      .single();

    if (error) {
      logger.error(`Failed to create notification: ${error.message}`, error);
      return null;
    }

    return data;
  } catch (err) {
    logger.error(`Exception while creating notification: ${err.message}`, err);
    return null;
  }
};

export const getNotificationsForUser = async (userId, organizationId, options = {}) => {
  const { limit = 30, unreadOnly = false } = options;

  let query = supabaseAdmin
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (organizationId) {
    query = query.eq('organization_id', organizationId);
  }

  if (unreadOnly) {
    query = query.eq('is_read', false);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
};

export const markNotificationAsRead = async (notificationId, userId) => {
  const { data, error } = await supabaseAdmin
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const markAllNotificationsAsRead = async (userId, organizationId) => {
  let query = supabaseAdmin
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId);

  if (organizationId) {
    query = query.eq('organization_id', organizationId);
  }

  const { data, error } = await query.select();
  if (error) throw error;
  return data;
};

