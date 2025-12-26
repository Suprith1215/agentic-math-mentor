import React from 'react';
import { Solution, MathProblem } from '../types';
import { BookOpen, Check, AlertTriangle, Lightbulb, BarChart2, ArrowRight, Brain } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface SolutionViewProps {
  problem: MathProblem;
  solution: Solution;
  onReset: () => void;
  onLoadProblem: (text: string) => void;
}

const SolutionView: React.FC<SolutionViewProps> = ({ problem, solution, onReset, onLoadProblem }) => {
  
  // Mock data for complexity chart
  const complexityData = [
    { name: 'Concept', value: 30 },
    { name: 'Calculation', value: 60 },
    { name: 'Logic', value: 80 },
  ];

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header Summary */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-6">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-0.5 rounded text-xs font-bold bg-brand-100 text-brand-700 uppercase">
              {problem.topic}
            </span>
            <span className="px-2 py-0.5 rounded text-xs font-bold bg-slate-100 text-slate-600">
              {problem.complexity}
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2 font-mono">
            {problem.parsedText}
          </h2>
          <div className="flex gap-4 text-sm text-slate-500">
             <span>Variables: {problem.variables.join(', ') || 'None'}</span>
             {problem.constraints.length > 0 && <span>Constraints: {problem.constraints.join(', ')}</span>}
          </div>
        </div>
        
        <div className="flex-shrink-0 text-right">
           <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium mb-2
             ${solution.verificationStatus === 'verified' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
             {solution.verificationStatus === 'verified' ? <Check size={14} /> : <AlertTriangle size={14} />}
             {solution.verificationStatus === 'verified' ? 'Verified Correct' : 'Needs Review'}
           </div>
           <div className="text-2xl font-bold text-brand-700">
             {solution.finalAnswer}
           </div>
           <div className="text-xs text-slate-400 mt-1">Final Answer</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Solution Steps */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <Lightbulb className="text-yellow-500" size={20} />
            Step-by-Step Explanation
          </h3>
          
          <div className="space-y-4">
            {solution.steps.map((step) => (
              <div key={step.stepNumber} className="bg-white p-4 rounded-lg border border-slate-200 relative overflow-hidden group hover:border-brand-200 transition-all">
                <div className="absolute top-0 left-0 bottom-0 w-1 bg-brand-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-600">
                    {step.stepNumber}
                  </div>
                  <div>
                    <p className="text-slate-700 leading-relaxed">{step.explanation}</p>
                    {step.formula && (
                      <div className="mt-3 p-3 bg-slate-50 rounded text-slate-800 font-mono text-sm overflow-x-auto">
                        {step.formula}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Similar Problems Section */}
          {solution.similarProblems && solution.similarProblems.length > 0 && (
            <div className="mt-8 pt-6 border-t border-slate-200">
              <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2 mb-4">
                <Brain className="text-brand-500" size={20} />
                Practice Similar Problems
              </h3>
              <div className="grid gap-4">
                {solution.similarProblems.map((sim, idx) => (
                  <div key={idx} className="bg-slate-50 p-4 rounded-lg border border-slate-200 hover:border-brand-300 transition-all flex justify-between items-center group">
                    <div className="flex-1 mr-4">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-slate-500 uppercase">{sim.topic}</span>
                        <span className="text-xs px-1.5 py-0.5 bg-white rounded border border-slate-200 text-slate-400">{sim.difficulty}</span>
                      </div>
                      <p className="text-sm text-slate-800 font-mono">{sim.problemText}</p>
                    </div>
                    <button 
                      onClick={() => onLoadProblem(sim.problemText)}
                      className="px-3 py-2 bg-white text-brand-600 border border-brand-200 rounded-md text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity hover:bg-brand-50 flex items-center gap-1"
                    >
                      Solve <ArrowRight size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar: RAG & Analytics */}
        <div className="space-y-6">
          {/* RAG Context */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <BookOpen size={14} />
              Retrieved Knowledge
            </h3>
            <div className="space-y-3">
              {solution.ragSources.map((source, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded border border-slate-100 text-sm">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-semibold text-slate-700">{source.title}</span>
                    <span className="text-xs text-brand-600 font-medium">{(source.relevance * 100).toFixed(0)}% Match</span>
                  </div>
                  <p className="text-slate-500 text-xs line-clamp-2">{source.snippet}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Visualization (Advanced Feature) */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm h-64 flex flex-col">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
              <BarChart2 size={14} />
              Problem Analysis
            </h3>
            <div className="flex-1 w-full text-xs">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={complexityData} layout="vertical" margin={{ left: 10 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" width={70} tick={{fontSize: 10}} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#0ea5e9" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <button 
            onClick={onReset}
            className="w-full py-3 bg-white border-2 border-slate-200 text-slate-600 font-semibold rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-all"
          >
            Solve Another Problem
          </button>
        </div>
      </div>
    </div>
  );
};

export default SolutionView;