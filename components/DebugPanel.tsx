import React from 'react';
import { AppState, MathProblem, Solution } from '../types';
import { X, Database, Activity, GitBranch, Terminal } from 'lucide-react';

interface DebugPanelProps {
  state: AppState;
  onClose: () => void;
}

const DebugPanel: React.FC<DebugPanelProps> = ({ state, onClose }) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 h-96 bg-slate-900 text-slate-200 border-t border-slate-700 shadow-2xl z-50 flex flex-col font-mono animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-800 border-b border-slate-700">
        <div className="flex items-center gap-2 text-sm font-bold text-brand-400">
          <Terminal size={16} />
          DevTools: Multi-Agent State Inspector
        </div>
        <button 
          onClick={onClose}
          className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white"
        >
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-hidden flex">
        {/* Sidebar */}
        <div className="w-48 bg-slate-800/50 border-r border-slate-700 flex flex-col p-2 gap-1 text-xs">
          <div className="p-2 bg-slate-700/50 rounded flex items-center justify-between">
            <span>Status:</span>
            <span className={`px-1.5 rounded ${state.status === 'ERROR' ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
              {state.status}
            </span>
          </div>
          <div className="mt-4 text-slate-500 uppercase font-bold text-[10px] tracking-wider px-2">Data Flow</div>
          <div className="flex flex-col gap-1">
            <button className="text-left px-2 py-1.5 rounded hover:bg-slate-700 flex items-center gap-2 text-blue-300">
              <Activity size={12} /> Input Processing
            </button>
            <button className="text-left px-2 py-1.5 rounded hover:bg-slate-700 flex items-center gap-2 text-purple-300">
              <GitBranch size={12} /> Parser Output
            </button>
            <button className="text-left px-2 py-1.5 rounded hover:bg-slate-700 flex items-center gap-2 text-amber-300">
              <Database size={12} /> Solver State
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-4 flex gap-4">
          
          {/* Column 1: Parser Output */}
          <div className="flex-1 min-w-[300px] flex flex-col gap-2">
            <h4 className="text-xs font-bold text-purple-400 flex items-center gap-2">
              <GitBranch size={14} /> 
              Agent 1: Parser Output (MathProblem)
            </h4>
            <div className="flex-1 bg-black/30 rounded border border-slate-700 p-2 overflow-auto">
              {state.parsedProblem ? (
                <pre className="text-[10px] text-purple-200 leading-relaxed">
                  {JSON.stringify(state.parsedProblem, null, 2)}
                </pre>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-600 text-xs italic">
                  Waiting for Parser Agent...
                </div>
              )}
            </div>
          </div>

          {/* Column 2: Solution Output */}
          <div className="flex-1 min-w-[300px] flex flex-col gap-2">
            <h4 className="text-xs font-bold text-amber-400 flex items-center gap-2">
              <Database size={14} /> 
              Agent 2: Solver Output (Solution)
            </h4>
            <div className="flex-1 bg-black/30 rounded border border-slate-700 p-2 overflow-auto">
              {state.solution ? (
                <pre className="text-[10px] text-amber-200 leading-relaxed">
                  {JSON.stringify(state.solution, null, 2)}
                </pre>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-600 text-xs italic">
                  Waiting for Solver Agent...
                </div>
              )}
            </div>
          </div>

          {/* Column 3: Live Logs */}
          <div className="w-80 flex flex-col gap-2 border-l border-slate-700 pl-4">
             <h4 className="text-xs font-bold text-slate-400">Live Agent Logs</h4>
             <div className="flex-1 overflow-auto space-y-2">
                {state.logs.map(log => (
                  <div key={log.id} className="text-[10px] border-l-2 border-slate-600 pl-2">
                    <div className="flex justify-between text-slate-500">
                      <span>{log.agentName}</span>
                      <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <div className={`
                      ${log.status === 'error' ? 'text-red-400' : 'text-slate-300'}
                    `}>
                      {log.action}
                    </div>
                  </div>
                ))}
             </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default DebugPanel;