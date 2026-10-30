import { supabaseAdmin } from '../config/supabase.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const listAuditLogs = async (req, res) => {
  try {
    let query = supabaseAdmin
      .from('activity_logs')
      .select(`
        *,
        profiles (id, full_name, email, avatar_url)
      `)
      .eq('organization_id', req.organizationId)
      .order('created_at', { ascending: false })
      .limit(100);

    if (req.query.entity_type) {
      query = query.eq('entity_type', req.query.entity_type);
    }
    if (req.query.action) {
      query = query.ilike('action', `%${req.query.action}%`);
    }

    const { data, error } = await query;
    if (error) return sendError(res, error.message, [], 500);

    return sendSuccess(res, 'Audit logs retrieved', data || []);
  } catch (err) {
    return sendError(res, 'Error fetching audit logs', [err.message], 500);
  }
};

