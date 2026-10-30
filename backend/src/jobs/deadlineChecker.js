import cron from 'node-cron';
import { supabaseAdmin } from '../config/supabase.js';
import { logger } from '../utils/logger.js';
import { dispatchEvent } from '../services/automationService.js';

export const startDeadlineCheckerJob = () => {
  // Run every 15 minutes: '*/15 * * * *'
  cron.schedule('*/15 * * * *', async () => {
    logger.info('Running scheduled deadline & overdue tasks checker...');

    try {
      const now = new Date();
      const todayString = now.toISOString().split('T')[0];
      const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      // 1. Check Overdue Tasks
      const { data: overdueTasks, error: overdueErr } = await supabaseAdmin
        .from('tasks')
        .select('id, organization_id, title, assigned_to, priority, due_date')
        .neq('status', 'completed')
        .not('due_date', 'is', null)
        .lt('due_date', now.toISOString());

      if (!overdueErr && overdueTasks) {
        for (const task of overdueTasks) {
          const eventId = `overdue_${task.id}_${todayString}`;
          await dispatchEvent({
            organizationId: task.organization_id,
            triggerType: 'task_overdue',
            eventId,
            eventData: { ...task, entityType: 'task' },
          });
        }
      }

      // 2. Check Approaching Due Dates (within 24 hours)
      const { data: approachingTasks, error: apprErr } = await supabaseAdmin
        .from('tasks')
        .select('id, organization_id, title, assigned_to, priority, due_date')
        .neq('status', 'completed')
        .not('due_date', 'is', null)
        .gte('due_date', now.toISOString())
        .lte('due_date', in24Hours.toISOString());

      if (!apprErr && approachingTasks) {
        for (const task of approachingTasks) {
          const eventId = `approaching_${task.id}_${todayString}`;
          await dispatchEvent({
            organizationId: task.organization_id,
            triggerType: 'due_date_approaching',
            eventId,
            eventData: { ...task, entityType: 'task' },
          });
        }
      }
    } catch (err) {
      logger.error('Error during scheduled deadline check execution:', err);
    }
  });

  logger.info('Deadline checker cron job initialized (runs every 15 minutes)');
};

