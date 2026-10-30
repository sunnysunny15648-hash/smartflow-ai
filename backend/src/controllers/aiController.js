import * as geminiService from '../services/aiService.js';
import { supabaseAdmin } from '../config/supabase.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const workflowSuggestions = async (req, res) => {
  try {
    const { prompt, context = {} } = req.body;
    if (!prompt) return sendError(res, 'Prompt is required', [], 400);

    const result = await geminiService.generateWorkflowSuggestion(prompt, {
      ...context,
      organizationId: req.organizationId,
    });

    return sendSuccess(res, 'Workflow suggestion generated', result);
  } catch (err) {
    return sendError(res, err.message, [], 500);
  }
};

export const taskGeneration = async (req, res) => {
  try {
    const { prompt, context = {} } = req.body;
    if (!prompt) return sendError(res, 'Prompt is required', [], 400);

    const result = await geminiService.generateTaskBreakdown(prompt, context);
    return sendSuccess(res, 'Task breakdown generated', result);
  } catch (err) {
    return sendError(res, err.message, [], 500);
  }
};

export const analyzeWorkflow = async (req, res) => {
  try {
    const { workflowId, workflowData } = req.body;

    let dataToAnalyze = workflowData;
    if (!dataToAnalyze && workflowId) {
      const { data } = await supabaseAdmin
        .from('workflows')
        .select(`*, workflow_steps (*), tasks (*)`)
        .eq('id', workflowId)
        .eq('organization_id', req.organizationId)
        .single();
      dataToAnalyze = data;
    }

    if (!dataToAnalyze) {
      return sendError(res, 'Workflow data or ID is required for analysis', [], 400);
    }

    const result = await geminiService.analyzeWorkflowBottlenecks(dataToAnalyze);
    return sendSuccess(res, 'Workflow bottleneck analysis completed', result);
  } catch (err) {
    return sendError(res, err.message, [], 500);
  }
};

export const reportSummary = async (req, res) => {
  try {
    const { metrics } = req.body;
    if (!metrics) return sendError(res, 'Metrics payload is required', [], 400);

    const result = await geminiService.generateReportSummary(metrics);
    return sendSuccess(res, 'Report summary generated', result);
  } catch (err) {
    return sendError(res, err.message, [], 500);
  }
};

export const chat = async (req, res) => {
  try {
    const { message, conversationId } = req.body;
    const userId = req.user.id;
    const organizationId = req.organizationId;

    let activeConversationId = conversationId;

    // Create conversation record if not present
    if (!activeConversationId) {
      const { data: conv } = await supabaseAdmin
        .from('ai_conversations')
        .insert({
          organization_id: organizationId,
          user_id: userId,
          title: message.slice(0, 50),
        })
        .select()
        .single();

      if (conv) activeConversationId = conv.id;
    }

    // Retrieve previous messages for conversation history
    let previousMessages = [];
    if (activeConversationId) {
      const { data: history } = await supabaseAdmin
        .from('ai_messages')
        .select('role, content')
        .eq('conversation_id', activeConversationId)
        .order('created_at', { ascending: true })
        .limit(10);

      previousMessages = history || [];

      // Save user message
      await supabaseAdmin.from('ai_messages').insert({
        conversation_id: activeConversationId,
        role: 'user',
        content: message,
      });
    }

    // Call Gemini Assistant
    const aiResult = await geminiService.chatAssistant(message, previousMessages, {
      organizationId,
    });

    // Save assistant response
    if (activeConversationId) {
      await supabaseAdmin.from('ai_messages').insert({
        conversation_id: activeConversationId,
        role: 'assistant',
        content: aiResult.reply,
        metadata: { suggestedActions: aiResult.suggestedActions },
      });
    }

    return sendSuccess(res, 'AI response received', {
      conversationId: activeConversationId,
      ...aiResult,
    });
  } catch (err) {
    return sendError(res, err.message, [], 500);
  }
};

