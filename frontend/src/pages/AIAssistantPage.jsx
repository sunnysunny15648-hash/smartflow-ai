import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Sparkles,
  Send,
  Bot,
  User,
  ArrowRight,
  GitBranch,
  CheckCircle,
  HelpCircle,
  Zap,
  TrendingUp,
} from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';

const EXAMPLE_PROMPTS = [
  'Create an employee onboarding workflow for remote engineers',
  'Generate a purchase approval process with spending limits',
  'Suggest ways to reduce repetitive manual operational work',
  'Break down the tasks needed to launch our new compliance policy',
];

export const AIAssistantPage = () => {
  const { currentOrg } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content:
        'Hello! I am SmartFlow AI, your intelligent workflow and business operations assistant powered by Groq AI. How can I help you design, optimize, or automate your business processes today?',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (messageText = input) => {
    const textToSend = messageText.trim();
    if (!textToSend || loading) return;

    setInput('');
    const newHistory = [...messages, { role: 'user', content: textToSend }];
    setMessages(newHistory);
    setLoading(true);

    try {
      const res = await api.post('/ai/chat', {
        message: textToSend,
        conversationId,
      });

      if (res.success && res.data) {
        if (res.data.conversationId) setConversationId(res.data.conversationId);
        setMessages([
          ...newHistory,
          {
            role: 'assistant',
            content: res.data.reply,
            suggestedActions: res.data.suggestedActions,
          },
        ]);
      }
    } catch (err) {
      setMessages([
        ...newHistory,
        {
          role: 'assistant',
          content: 'I apologize, but I encountered an issue connecting with the AI engine. Please ensure your backend is reachable and GROQ_API_KEY is configured.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-140px)] flex flex-col space-y-4">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <Sparkles className="w-5 h-5 text-indigo-100" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              SmartFlow AI Assistant
              <span className="text-[10px] bg-indigo-50 text-indigo-600 border border-indigo-200 px-2 py-0.5 rounded-full font-mono uppercase">
                Google Groq
              </span>
            </h1>
            <p className="text-xs text-slate-500">Business intelligence, process synthesis, and operational guidance</p>
          </div>
        </div>

        <button
          onClick={() => {
            setMessages([
              {
                role: 'assistant',
                content: 'Chat session reset. What business workflow shall we structure next?',
              },
            ]);
            setConversationId(null);
          }}
          className="text-xs text-slate-400 hover:text-slate-600"
        >
          Clear Chat
        </button>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                msg.role === 'user'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gradient-to-tr from-indigo-500 to-indigo-600 text-white shadow-sm'
              }`}
            >
              {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            <div
              className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed shadow-sm ${
                msg.role === 'user'
                  ? 'bg-indigo-600 text-white rounded-tr-none'
                  : 'bg-white border border-slate-200/80 text-slate-800 rounded-tl-none'
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.content}</p>

              {/* Action Pills */}
              {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap gap-2">
                  {msg.suggestedActions.map((act, aIdx) => (
                    <button
                      key={aIdx}
                      onClick={() => {
                        if (act.action === 'create_workflow') {
                          navigate('/workflows/create');
                        } else if (act.action === 'view_tasks') {
                          navigate('/tasks');
                        } else {
                          handleSend(`Please provide detailed steps for ${act.label}`);
                        }
                      }}
                      className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-colors"
                    >
                      {act.label} <ArrowRight className="w-3 h-3" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center">
              <Bot className="w-4 h-4 animate-pulse" />
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-3 text-xs text-slate-500 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
              <span>SmartFlow AI is reasoning with Groq...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Prompt Chips */}
      {messages.length < 3 && (
        <div className="flex items-center gap-2 overflow-x-auto py-1">
          {EXAMPLE_PROMPTS.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(p)}
              className="text-[11px] whitespace-nowrap bg-white hover:bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-600 transition-colors flex-shrink-0"
            >
              "{p}"
            </button>
          ))}
        </div>
      )}

      {/* Chat Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="flex items-center gap-2 bg-white border border-slate-200 rounded-2xl p-2 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask SmartFlow AI to create a process, analyze delays, or draft SOPs..."
          className="flex-1 bg-transparent px-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none"
        />
        <Button
          type="submit"
          variant="primary"
          size="sm"
          disabled={!input.trim() || loading}
          className="rounded-xl shadow-sm"
        >
          <Send className="w-4 h-4" />
        </Button>
      </form>
    </div>
  );
};

export default AIAssistantPage;

