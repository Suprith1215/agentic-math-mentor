import React, { useState } from 'react';
import { AppState, AgentStatus } from '../types';
import { X, Database, Activity, GitBranch, Terminal, Cpu, Eye, CheckCircle2, CircleDashed, AlertCircle } from 'lucide-react';

interface DebugPanelProps {
  state: AppState;
  onClose: () => void;
}

const DebugPanel: React.FC<DebugPanelProps> = ({ state, onClose }) => {
  const [activeTab, setActiveTab] = useState<'flow' | 'parser' | 'solver' | 'logs'>('flow');

  // Helper to determine step status
  const getStepStatus = (stepStatus: AgentStatus, currentStatus: AgentStatus, pastStatuses: AgentStatus[]) => {
    if (currentStatus === stepStatus) return 'active';
    if (pastStatuses.includes(stepStatus)) return 'completed';
    if (currentStatus === AgentStatus.COMPLETED) return 'completed'; // Everything prior is done
    return 'pending';
  };

  // Determine implied progression for visual timeline
  const progressMap = [AgentStatus.PARSING, AgentStatus.ROUTING, AgentStatus.SOLVING, AgentStatus.VERIFYING];
  const currentIdx = progressMap.indexOf(state.status as AgentStatus);
  const isComplete = state.status === AgentStatus.COMPLETED;

  const getVisualStatus = (step: AgentStatus) => {
    const stepIdx = progressMap.indexOf(step);
    if (state.status === AgentStatus.ERROR) return 'error';
    if (isComplete) return 'completed';
    if (state.status === step) return 'active';
    if (currentIdx > stepIdx) return 'completed';
    return 'pending';
  };

  const PipelineStep = ({ label, status, icon: Icon }: { label: string, status: string, icon: any }) => {
    const colors = {
      pending: 'text-slate-600 border-slate-700 bg-slate-800/50',
      active: 'text-blue-400 border-blue-500 bg-blue-500/10 shadow-[0_0_15px_rgba(59,130,246,0.2)]',
      completed: 'text-emerald-400 border-emerald-500 bg-emerald-500/10',
      error: 'text-red-400 border-red-500 bg-red-500/10'
    };
    
    // @ts-ignore
    const currentStyle = colors[status] || colors.pending;

    return (
      <div className={`flex flex-col items-center gap-2 px-4 py-2 rounded-lg border transition-all duration-300 ${currentStyle}`}>
        <div className="flex items-center gap-2">
           <Icon size={16} className={status === 'active' ? 'animate-pulse' : ''} />
           <span className="text-xs font-bold uppercase tracking-wider">{label}</span>
        </div>
        <div className="text-[10px] opacity-70 capitalize">{status}</div>
      </div>
    );
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 h-[450px] bg-[#0f172a] text-slate-200 border-t border-slate-700 shadow-[0_-10px_40px_rgba(0,0,0,0.3)] z-50 flex flex-col font-mono animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600/20 p-1.5 rounded text-blue-400">
            <Terminal size={16} />
          </div>
          <div>
             <h3 className="text-sm font-bold text-slate-200">System Internals</h3>
             <p className="text-[10px] text-slate-500">Multi-Agent Data Flow & State Inspector</p>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="p-1.5 hover:bg-slate-800 rounded-md text-slate-400 hover:text-white transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      {/* Visual Pipeline */}
      <div className="px-6 py-4 bg-slate-900/50 border-b border-slate-800 flex justify-between items-center overflow-x-auto gap-4">
        <PipelineStep label="1. Perception" status={getVisualStatus(AgentStatus.PARSING)} icon={Eye} />
        <div className="h-0.5 flex-1 bg-slate-800 min-w-[20px]" />
        <PipelineStep label="2. Strategy" status={getVisualStatus(AgentStatus.ROUTING)} icon={GitBranch} />
        <div className="h-0.5 flex-1 bg-slate-800 min-w-[20px]" />
        <PipelineStep label="3. Execution" status={getVisualStatus(AgentStatus.SOLVING)} icon={Cpu} />
        <div className="h-0.5 flex-1 bg-slate-800 min-w-[20px]" />
        <PipelineStep label="4. Verification" status={getVisualStatus(AgentStatus.COMPLETED)} icon={CheckCircle2} />
      </div>

      <div className="flex-1 overflow-hidden flex">
        {/* Sidebar Tabs */}
        <div className="w-48 bg-slate-900 border-r border-slate-800 flex flex-col pt-2">
          {[
            { id: 'flow', label: 'Overview', icon: Activity },
            { id: 'parser', label: 'Parser Output', icon: Eye },
            { id: 'solver', label: 'Solver State', icon: Database },
            { id: 'logs', label: 'System Logs', icon: Terminal },
          ].map((tab) => (
            <button
              key={tab.id}
              // @ts-ignore
              onClick={() => setActiveTab(tab.id)}
              className={`
                text-left px-4 py-3 flex items-center gap-3 text-xs font-medium transition-colors border-l-2
                ${activeTab === tab.id 
                  ? 'bg-slate-800 text-blue-400 border-blue-400' 
                  : 'text-slate-500 border-transparent hover:bg-slate-800/50 hover:text-slate-300'}
              `}
            >
              <tab.icon size={14} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-0 bg-[#0b1120]">
          
          {/* VIEW: FLOW OVERVIEW */}
          {activeTab === 'flow' && (
            <div className="p-6 max-w-3xl">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg border border-slate-800 bg-slate-900/50">
                   <h4 className="text-xs text-slate-500 uppercase mb-2">Input Mode</h4>
                   <div className="text-xl font-bold text-white flex items-center gap-2">
                     {state.mode} <span className="text-xs font-normal text-slate-400 bg-slate-800 px-2 py-0.5 rounded">Raw Data</span>
                   </div>
                </div>
                <div className="p-4 rounded-lg border border-slate-800 bg-slate-900/50">
                   <h4 className="text-xs text-slate-500 uppercase mb-2">User Mastery Context</h4>
                   <div className="flex flex-col gap-1">
                      {state.parsedProblem && state.userProgress.topicMastery[state.parsedProblem.topic] !== undefined ? (
                         <>
                          <div className="text-lg font-bold text-white">
                             {state.userProgress.topicMastery[state.parsedProblem.topic]}%
                          </div>
                          <div className="text-xs text-slate-400">
                             Topic: {state.parsedProblem.topic}
                          </div>
                         </>
                      ) : (
                        <span className="text-slate-500 italic text-sm">Waiting for topic identification...</span>
                      )}
                   </div>
                </div>
                <div className="col-span-2 p-4 rounded-lg border border-slate-800 bg-slate-900/50">
                   <h4 className="text-xs text-slate-500 uppercase mb-2">Current System Status</h4>
                   <div className="flex items-center gap-2">
                      {state.status === AgentStatus.ERROR ? (
                        <AlertCircle className="text-red-500" />
                      ) : state.status === AgentStatus.COMPLETED ? (
                        <CheckCircle2 className="text-emerald-500" />
                      ) : (
                        <CircleDashed className="text-blue-500 animate-spin" />
                      )}
                      <span className="text-lg text-slate-200">{state.status}</span>
                   </div>
                   {state.error && (
                     <div className="mt-2 text-red-400 text-xs font-mono bg-red-900/20 p-2 rounded">
                       {state.error}
                     </div>
                   )}
                </div>
              </div>
            </div>
          )}

          {/* VIEW: PARSER JSON */}
          {activeTab === 'parser' && (
            <div className="relative h-full">
              <div className="absolute top-0 left-0 right-0 bg-slate-900/80 backdrop-blur p-2 border-b border-slate-800 flex justify-between items-center">
                 <span className="text-xs text-purple-400 font-mono">Agent Output: MathProblem</span>
                 <span className="text-[10px] text-slate-500">JSON</span>
              </div>
              <div className="p-4 pt-10 h-full overflow-auto">
                {state.parsedProblem ? (
                  <pre className="text-[11px] text-purple-200 font-mono leading-relaxed">
                    {JSON.stringify(state.parsedProblem, null, 2)}
                  </pre>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-600">
                    <Eye size={32} className="mb-2 opacity-50" />
                    <p className="text-xs">No parser output available yet.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* VIEW: SOLVER JSON */}
          {activeTab === 'solver' && (
            <div className="relative h-full">
               <div className="absolute top-0 left-0 right-0 bg-slate-900/80 backdrop-blur p-2 border-b border-slate-800 flex justify-between items-center">
                 <span className="text-xs text-amber-400 font-mono">Agent Output: Solution</span>
                 <span className="text-[10px] text-slate-500">JSON</span>
              </div>
              <div className="p-4 pt-10 h-full overflow-auto">
                {state.solution ? (
                  <pre className="text-[11px] text-amber-200 font-mono leading-relaxed">
                    {JSON.stringify(state.solution, null, 2)}
                  </pre>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-600">
                    <Database size={32} className="mb-2 opacity-50" />
                    <p className="text-xs">No solution generated yet.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* VIEW: LOGS */}
          {activeTab === 'logs' && (
            <div className="p-0 h-full flex flex-col">
              <div className="bg-slate-900/80 backdrop-blur p-2 border-b border-slate-800">
                 <span className="text-xs text-slate-400 font-mono">Real-time Event Stream</span>
              </div>
              <div className="flex-1 overflow-auto p-4 space-y-1">
                {state.logs.map((log) => (
                  <div key={log.id} className="grid grid-cols-[80px_1fr] gap-4 text-[10px] font-mono hover:bg-slate-800/50 p-1 rounded transition-colors group">
                     <div className="text-slate-500">{new Date(log.timestamp).toLocaleTimeString()}</div>
                     <div>
                        <span className={`font-bold mr-2 ${
                          log.agentName === 'Parser' ? 'text-purple-400' :
                          log.agentName === 'Solver' ? 'text-amber-400' :
                          log.agentName === 'Router' ? 'text-blue-400' :
                          log.agentName === 'System' ? 'text-slate-400' : 'text-emerald-400'
                        }`}>[{log.agentName}]</span>
                        <span className={log.status === 'error' ? 'text-red-400' : 'text-slate-300'}>
                          {log.action}
                        </span>
                     </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default DebugPanel;