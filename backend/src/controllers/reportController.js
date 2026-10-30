import * as reportService from '../services/reportService.js';
import { supabaseAdmin } from '../config/supabase.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const listReports = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('reports')
      .select(`
        id, report_type, date_from, date_to, created_at, ai_summary,
        generator:generated_by (id, full_name, email)
      `)
      .eq('organization_id', req.organizationId)
      .order('created_at', { ascending: false });

    if (error) return sendError(res, error.message, [], 500);
    return sendSuccess(res, 'Reports list retrieved', data || []);
  } catch (err) {
    return sendError(res, 'Error fetching reports', [err.message], 500);
  }
};

export const generateReport = async (req, res) => {
  try {
    const { report_type, date_from, date_to } = req.body;
    const report = await reportService.generateReport({
      organizationId: req.organizationId,
      reportType: report_type,
      dateFrom: date_from,
      dateTo: date_to,
      userId: req.user.id,
    });
    return sendSuccess(res, 'Report generated successfully', report, 201);
  } catch (err) {
    return sendError(res, 'Error generating report', [err.message], 500);
  }
};

export const getReport = async (req, res) => {
  try {
    const { data: report, error } = await supabaseAdmin
      .from('reports')
      .select(`
        *,
        generator:generated_by (id, full_name, email)
      `)
      .eq('id', req.params.id)
      .eq('organization_id', req.organizationId)
      .single();

    if (error || !report) return sendError(res, 'Report not found', [], 404);
    return sendSuccess(res, 'Report details retrieved', report);
  } catch (err) {
    return sendError(res, 'Error fetching report', [err.message], 500);
  }
};

export const exportReport = async (req, res) => {
  try {
    const { data: report, error } = await supabaseAdmin
      .from('reports')
      .select('*')
      .eq('id', req.params.id)
      .eq('organization_id', req.organizationId)
      .single();

    if (error || !report) return sendError(res, 'Report not found', [], 404);

    const csvData = await reportService.exportReportToCSV(report.report_data);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=report-${report.id}.csv`);
    return res.status(200).send(csvData);
  } catch (err) {
    return sendError(res, 'Error exporting report to CSV', [err.message], 500);
  }
};

