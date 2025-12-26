import React from 'react';
import { AgentLog } from '../types';
import { Bot, CheckCircle, Brain, ShieldCheck, FileText } from 'lucide-react';

interface AgentTraceProps {
  logs: AgentLog[];
}

const AgentTrace: React.FC<AgentTraceProps> = ({ logs }) => {
  if (logs.length === 0) return null;

  const getIcon = (agent: string) => {
    switch (agent.toLowerCase()) {
      case 'parser': return <FileText size={16} />;
      case 'router': return <Brain size={16} />;
      case 'solver': return <Bot size={16} />;
      case 'verifier': return <ShieldCheck size={16} />;
      default: return <Bot size={16} />;
    }
  };

  const getColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600 bg-green-50 border-green-200';
      case 'warning': return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'error': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  return (
    <div className="w-full bg-white rounded-lg border border-slate-200 shadow-sm p-4 mb-6">
      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
        Multi-Agent Orchestration Trace
      </h3>
      <div className="space-y-3 relative">
        <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-slate-100"></div>
        {logs.map((log) => (
          <div key={log.id} className="relative flex items-start gap-3 pl-2">
            <div className={`
              z-10 flex items-center justify-center w-8 h-8 rounded-full border-2 bg-white
              ${log.status === 'success' ? 'border-green-500 text-green-600' : 'border-slate-300 text-slate-400'}
            `}>
              {log.status === 'success' ? <CheckCircle size={14} /> : getIcon(log.agentName)}
            </div>
            <div className={`flex-1 p-3 rounded border text-sm ${getColor(log.status)}`}>
              <div className="flex justify-between items-center mb-1">
                <span className="font-bold uppercase text-xs">{log.agentName} Agent</span>
                <span className="text-xs opacity-70">
                   {new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>
              <p>{log.action}</p>
              {log.details && (
                <p className="mt-1 text-xs font-mono opacity-80 border-t border-current pt-1 border-opacity-20">
                  {log.details}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AgentTrace;