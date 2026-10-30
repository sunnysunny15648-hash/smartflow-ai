import React from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  GitBranch,
  ShieldCheck,
  Zap,
  BarChart3,
  Bot,
  Layers,
  CheckCircle2,
  Lock,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import Button from '../components/common/Button';

export const LandingPage = () => {
  return (
    <div className="min-h-screen bg-slate-900 text-white selection:bg-indigo-500 selection:text-white">
      {/* Top Navbar */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
              <Sparkles className="w-5 h-5 text-indigo-100" />
            </div>
            <span className="font-bold text-lg tracking-tight text-white flex items-center gap-2">
              SmartFlow <span className="text-xs bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded font-mono">AI</span>
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm text-slate-300">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#automation" className="hover:text-white transition-colors">Automation</a>
            <a href="#ai" className="hover:text-white transition-colors">AI Intelligence</a>
            <a href="#pricing" className="hover:text-white transition-colors">Platform</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white hover:bg-slate-800">
                Sign In
              </Button>
            </Link>
            <Link to="/register">
              <Button variant="primary" size="sm" className="shadow-lg shadow-indigo-600/30">
                Get Started Free
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-24 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(99,102,241,0.25),rgba(255,255,255,0))]"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium mb-8">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Powered by Google Gemini & Supabase PostgreSQL</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-white tracking-tight max-w-4xl mx-auto leading-tight">
            Intelligent Business <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-indigo-200 to-sky-400">
              Workflow Automation
            </span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Eliminate repetitive operational tasks, automate complex approval hierarchies, and optimize business processes with Google Gemini AI intelligence.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/register" className="w-full sm:w-auto">
              <Button variant="primary" size="lg" className="w-full sm:w-auto text-base shadow-xl shadow-indigo-600/40">
                Start Automating Free <ArrowRight className="w-5 h-5 ml-1" />
              </Button>
            </Link>
            <Link to="/login" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="w-full sm:w-auto text-base border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white">
                Live Demo Login
              </Button>
            </Link>
          </div>

          {/* Metrics preview */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto pt-8 border-t border-slate-800/80">
            <div>
              <p className="text-3xl font-extrabold text-indigo-400">70%</p>
              <p className="text-xs text-slate-400 mt-1">Faster Process Cycle</p>
            </div>
            <div>
              <p className="text-3xl font-extrabold text-indigo-400">Zero</p>
              <p className="text-xs text-slate-400 mt-1">Manual Approval Delays</p>
            </div>
            <div>
              <p className="text-3xl font-extrabold text-indigo-400">100%</p>
              <p className="text-xs text-slate-400 mt-1">Audit Trail Accountability</p>
            </div>
            <div>
              <p className="text-3xl font-extrabold text-indigo-400">Gemini</p>
              <p className="text-xs text-slate-400 mt-1">AI Process Optimization</p>
            </div>
          </div>
        </div>
      </section>

      {/* Core Features Grid */}
      <section id="features" className="py-20 bg-slate-950/60 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-semibold text-indigo-400 tracking-wider uppercase">Enterprise Capabilities</h2>
            <p className="text-3xl sm:text-4xl font-bold text-white mt-2">
              Everything required to orchestrate modern business operations
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 hover:border-indigo-500/40 transition-colors">
              <div className="w-12 h-12 bg-indigo-500/10 text-indigo-400 rounded-xl flex items-center justify-center mb-5">
                <GitBranch className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Dynamic Workflow Pipelines</h3>
              <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                Design multi-stage workflows with department-level ownership, custom step sequences, and employee assignments.
              </p>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 hover:border-indigo-500/40 transition-colors">
              <div className="w-12 h-12 bg-indigo-500/10 text-indigo-400 rounded-xl flex items-center justify-center mb-5">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Rule-Based Automation Engine</h3>
              <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                Configure Trigger → Condition → Action automation rules with execution logging and duplicate prevention.
              </p>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 hover:border-indigo-500/40 transition-colors">
              <div className="w-12 h-12 bg-indigo-500/10 text-indigo-400 rounded-xl flex items-center justify-center mb-5">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Approval Hierarchy</h3>
              <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                Enforce manager approvals on purchases, leaves, and documents with anti-self-approval security checks.
              </p>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 hover:border-indigo-500/40 transition-colors">
              <div className="w-12 h-12 bg-indigo-500/10 text-indigo-400 rounded-xl flex items-center justify-center mb-5">
                <Bot className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Gemini AI Assistant</h3>
              <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                Natural-language workflow creation suggestions, task breakdown generators, bottleneck analyzers, and instant summaries.
              </p>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 hover:border-indigo-500/40 transition-colors">
              <div className="w-12 h-12 bg-indigo-500/10 text-indigo-400 rounded-xl flex items-center justify-center mb-5">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Real-Time Analytics & Reports</h3>
              <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                Measurable productivity dashboards, completion trends, overdue metrics, and instant CSV exports.
              </p>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 hover:border-indigo-500/40 transition-colors">
              <div className="w-12 h-12 bg-indigo-500/10 text-indigo-400 rounded-xl flex items-center justify-center mb-5">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">PostgreSQL RLS & RBAC</h3>
              <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                Enterprise multi-tenant data isolation, Row-Level Security, role policies, and immutable activity audit logs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      <footer className="border-t border-slate-800 py-12 bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-500">
            © 2025 SmartFlow AI. All rights reserved. Built for high-velocity enterprise workflow management.
          </p>
          <div className="flex items-center gap-6 text-xs text-slate-400">
            <Link to="/login" className="hover:text-white">Sign In</Link>
            <Link to="/register" className="hover:text-white">Register</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;

