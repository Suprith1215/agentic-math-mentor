import React, { useState, useEffect } from 'react';
import { 
  InputMode, 
  AppState, 
  AgentStatus, 
  AgentLog, 
  MathProblem,
  UserProgress,
  LearningMemoryItem
} from './types';
import { 
  runParserAgent, 
  runSolverOrchestration, 
  fileToGenerativePart,
  blobToGenerativePart
} from './services/geminiService';

import InputSection from './components/InputSection';
import AgentTrace from './components/AgentTrace';
import SolutionView from './components/SolutionView';
import HitlModal from './components/HitlModal';
import DebugPanel from './components/DebugPanel';

import { Calculator, ShieldCheck, Bug } from 'lucide-react';

// Mock Data for User Progress and Memory
const INITIAL_USER_PROGRESS: UserProgress = {
  topicMastery: {
    'Calculus': 35, // Beginner
    'Algebra': 85,  // Advanced
    'Probability': 60 // Intermediate
  },
  commonMistakes: ['Chain Rule application', 'Negative sign distribution']
};

const INITIAL_MEMORY: LearningMemoryItem[] = [
  { id: 'm1', trigger: 'Calculus', insight: 'Use L\'Hopital\'s rule immediately for 0/0 limits', successRate: 0.95, source: 'system' },
  { id: 'm2', trigger: 'Algebra', insight: 'Check discriminant D > 0 for distinct roots', successRate: 0.88, source: 'system' }
];

const INITIAL_STATE: AppState = {
  mode: InputMode.TEXT,
  explanationLevel: 'Beginner',
  inputData: null,
  audioBlob: null,
  status: AgentStatus.IDLE,
  logs: [],
  parsedProblem: null,
  solution: null,
  error: null,
  userProgress: INITIAL_USER_PROGRESS,
  learningMemory: INITIAL_MEMORY
};

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(INITIAL_STATE);
  const [showHitl, setShowHitl] = useState(false);
  const [showDebug, setShowDebug] = useState(false);

  const addLog = (log: Omit<AgentLog, 'id' | 'timestamp'>) => {
    setState(prev => ({
      ...prev,
      logs: [
        ...prev.logs,
        { ...log, id: Math.random().toString(36), timestamp: Date.now() }
      ]
    }));
  };

  const handleError = (msg: string) => {
    setState(prev => ({ ...prev, status: AgentStatus.ERROR, error: msg }));
    addLog({ agentName: 'System', action: msg, status: 'error' });
  };

  const handleProcessingStart = async (
    input: string | File | Blob, 
    mode: InputMode
  ) => {
    // Preserve existing preferences and memory while resetting session data
    setState(prev => ({ 
      ...INITIAL_STATE, 
      explanationLevel: prev.explanationLevel, 
      userProgress: prev.userProgress, // Keep progress
      learningMemory: prev.learningMemory, // Keep memory
      mode, 
      status: AgentStatus.PARSING 
    }));
    
    addLog({ agentName: 'System', action: `Received ${mode} input. Starting pipeline...`, status: 'info' });

    try {
      // 1. Prepare Input for Gemini
      let processedInput: string | { inlineData: { data: string; mimeType: string } };
      
      if (mode === InputMode.TEXT) {
        processedInput = input as string;
      } else if (mode === InputMode.IMAGE) {
        processedInput = await fileToGenerativePart(input as File);
      } else {
        const audioBlob = input as Blob;
        processedInput = await blobToGenerativePart(audioBlob, audioBlob.type || 'audio/webm');
        setState(prev => ({ ...prev, audioBlob: audioBlob }));
      }

      setState(prev => ({ ...prev, inputData: mode === InputMode.TEXT ? (input as string) : null }));

      // 2. Run Parser Agent
      addLog({ agentName: 'Parser', action: 'Analyzing raw input for mathematical structure...', status: 'info' });
      const problem = await runParserAgent(processedInput, mode);
      
      addLog({ 
        agentName: 'Parser', 
        action: `Identified topic: ${problem.topic} (Confidence: ${(problem.confidence * 100).toFixed(0)}%)`, 
        status: problem.confidence > 0.7 ? 'success' : 'warning' 
      });

      setState(prev => ({ ...prev, parsedProblem: problem }));

      // 3. Check Confidence / HITL
      if (problem.confidence < 0.8) {
        setState(prev => ({ ...prev, status: AgentStatus.HITL_REQUIRED }));
        setShowHitl(true);
        addLog({ agentName: 'System', action: 'Low confidence detected. Requesting human verification.', status: 'warning' });
        return;
      }

      // If high confidence, proceed immediately
      await proceedToSolve(problem);

    } catch (err: any) {
      console.error(err);
      const msg = err?.message || (typeof err === 'string' ? err : "An unexpected error occurred");
      handleError(msg);
    }
  };

  const proceedToSolve = async (problem: MathProblem) => {
    setShowHitl(false);
    
    const currentExplanationLevel = state.explanationLevel;
    const { userProgress, learningMemory } = state;

    setState(prev => ({ ...prev, status: AgentStatus.ROUTING, parsedProblem: problem }));
    
    try {
      // 4. Router
      const topicMastery = userProgress.topicMastery[problem.topic] || 50;
      addLog({ 
        agentName: 'Router', 
        action: `User Mastery in ${problem.topic}: ${topicMastery}%. Adjusting explainer depth.`, 
        status: 'success' 
      });
      
      // 5. Solver & Verifier
      setState(prev => ({ ...prev, status: AgentStatus.SOLVING }));
      addLog({ agentName: 'Solver', action: `Retrieving RAG context with Learning Memory priority...`, status: 'info' });
      
      await new Promise(r => setTimeout(r, 800));
      
      const solution = await runSolverOrchestration(
        problem, 
        currentExplanationLevel,
        userProgress,
        learningMemory
      );
      
      // Dynamic Memory Update if the model generated a new insight
      if (solution.generatedMemory) {
        const newMemory: LearningMemoryItem = {
          id: Math.random().toString(36).substr(2, 9),
          trigger: problem.topic,
          insight: solution.generatedMemory,
          successRate: 1.0, // Initial high boost for new relevant insight
          source: 'system'
        };
        setState(prev => ({
          ...prev,
          learningMemory: [newMemory, ...prev.learningMemory]
        }));
        addLog({ agentName: 'LearningMemory', action: `New RAG chunk generated: "${solution.generatedMemory}"`, status: 'success' });
      }

      addLog({ agentName: 'Solver', action: 'Solution generated.', status: 'success' });
      addLog({ agentName: 'Verifier', action: `Verification status: ${solution.verificationStatus}`, status: solution.verificationStatus === 'verified' ? 'success' : 'warning' });

      setState(prev => ({ 
        ...prev, 
        status: AgentStatus.COMPLETED,
        solution
      }));

    } catch (err: any) {
      console.error(err);
      const msg = err?.message || (typeof err === 'string' ? err : "Error during solving process");
      handleError(msg);
    }
  };

  const handleLoadSimilarProblem = (text: string) => {
    handleProcessingStart(text, InputMode.TEXT);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      {/* Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-brand-600">
            <Calculator size={24} strokeWidth={2.5} />
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              AI Planet <span className="text-brand-600">Math Mentor</span>
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setShowDebug(!showDebug)}
              className={`p-2 rounded-lg transition-colors ${showDebug ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-100'}`}
              title="Toggle Debug Panel"
            >
              <Bug size={18} />
            </button>
            <div className="hidden sm:flex items-center gap-4 text-sm font-medium text-slate-500">
              <span className="flex items-center gap-1"><ShieldCheck size={16} /> Secure & Private</span>
              <span className="px-2 py-1 bg-slate-100 rounded text-xs">JEE Edition</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 pt-8">
        
        {/* Intro / Empty State */}
        {!state.solution && state.status === AgentStatus.IDLE && (
          <div className="text-center mb-10 space-y-2">
            <h2 className="text-3xl font-bold text-slate-800">What do you want to solve today?</h2>
            <p className="text-slate-500 max-w-md mx-auto">
              Upload a screenshot, record a voice note, or type your calculus, algebra, or probability problem.
            </p>
          </div>
        )}

        {/* Input Area */}
        {!state.solution && (
          <InputSection 
            mode={state.mode}
            setMode={(m) => setState(prev => ({ ...prev, mode: m }))}
            explanationLevel={state.explanationLevel}
            setExplanationLevel={(l) => setState(prev => ({ ...prev, explanationLevel: l }))}
            isProcessing={state.status !== AgentStatus.IDLE && state.status !== AgentStatus.ERROR && state.status !== AgentStatus.HITL_REQUIRED}
            onTextSubmit={(txt) => handleProcessingStart(txt, InputMode.TEXT)}
            onImageSubmit={(file) => handleProcessingStart(file, InputMode.IMAGE)}
            onAudioSubmit={(blob) => handleProcessingStart(blob, InputMode.AUDIO)}
          />
        )}

        {/* Agent Trace */}
        <div className="mt-8">
          <AgentTrace logs={state.logs} />
        </div>

        {/* Results */}
        {state.solution && state.parsedProblem && (
          <SolutionView 
            problem={state.parsedProblem}
            solution={state.solution}
            onReset={() => setState(prev => ({ 
              ...INITIAL_STATE, 
              explanationLevel: prev.explanationLevel, 
              userProgress: prev.userProgress, 
              learningMemory: prev.learningMemory,
              mode: prev.mode 
            }))}
            onLoadProblem={handleLoadSimilarProblem}
          />
        )}

        {/* Error Banner */}
        {state.error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center justify-between">
            <span>{state.error}</span>
            <button 
              onClick={() => setState(prev => ({ 
                ...INITIAL_STATE, 
                explanationLevel: prev.explanationLevel,
                userProgress: prev.userProgress,
                learningMemory: prev.learningMemory
              }))}
              className="text-sm underline hover:text-red-900"
            >
              Reset
            </button>
          </div>
        )}
      </main>

      {/* HITL Modal with Feedback Loop */}
      {showHitl && state.parsedProblem && (
        <HitlModal 
          problem={state.parsedProblem}
          onConfirm={(text) => {
            // FEEDBACK LOOP: Learning from corrections
            if (text !== state.parsedProblem?.parsedText) {
              const correctionInsight = `Corrected scanning error for ${state.parsedProblem?.topic}: user specified "${text.substring(0, 20)}..."`;
              const newMemory: LearningMemoryItem = {
                id: Math.random().toString(36).substr(2, 9),
                trigger: state.parsedProblem?.topic || 'General',
                insight: correctionInsight,
                successRate: 1.0,
                source: 'user_correction'
              };
              
              setState(prev => ({
                ...prev,
                learningMemory: [newMemory, ...prev.learningMemory]
              }));
              addLog({ agentName: 'LearningMemory', action: 'Recorded user correction as new learning pattern.', status: 'info' });
            }

            const updatedProblem = { ...state.parsedProblem!, parsedText: text, confidence: 1.0 };
            addLog({ agentName: 'User', action: 'Human verified/corrected problem text.', status: 'success' });
            proceedToSolve(updatedProblem);
          }}
          onCancel={() => {
            setShowHitl(false);
            setState(prev => ({ 
              ...INITIAL_STATE, 
              explanationLevel: prev.explanationLevel,
              userProgress: prev.userProgress,
              learningMemory: prev.learningMemory
            }));
          }}
        />
      )}

      {/* Debug Panel */}
      {showDebug && (
        <DebugPanel state={state} onClose={() => setShowDebug(false)} />
      )}
    </div>
  );
};

export default App;