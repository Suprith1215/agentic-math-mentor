export enum InputMode {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  AUDIO = 'AUDIO'
}

export type ExplanationLevel = 'Beginner' | 'Advanced';

export enum AgentStatus {
  IDLE = 'IDLE',
  PARSING = 'PARSING',
  ROUTING = 'ROUTING',
  SOLVING = 'SOLVING',
  VERIFYING = 'VERIFYING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR',
  HITL_REQUIRED = 'HITL_REQUIRED'
}

export interface AgentLog {
  id: string;
  agentName: string;
  action: string;
  timestamp: number;
  status: 'success' | 'warning' | 'error' | 'info';
  details?: string;
}

export interface MathProblem {
  rawInput: string;
  parsedText: string;
  topic: string;
  subtopic: string;
  confidence: number;
  variables: string[];
  constraints: string[];
  complexity: 'Easy' | 'Medium' | 'Hard' | 'JEE-Advanced';
}

export interface RagSource {
  title: string;
  snippet: string;
  relevance: number; // 0-1
  isSynthetic?: boolean; // True if generated from user feedback
}

export interface SolutionStep {
  stepNumber: number;
  explanation: string;
  formula?: string;
}

export interface SimilarProblem {
  id: string;
  problemText: string;
  topic: string;
  difficulty: string;
}

export interface Solution {
  finalAnswer: string;
  steps: SolutionStep[];
  ragSources: RagSource[];
  similarProblems?: SimilarProblem[];
  verificationStatus: 'verified' | 'uncertain' | 'failed';
  similarProblemId?: string;
  generatedMemory?: string; // New insight generated for LearningMemory
}

export interface UserProgress {
  topicMastery: Record<string, number>; // e.g. "Calculus": 40
  commonMistakes: string[];
}

export interface LearningMemoryItem {
  id: string;
  trigger: string; // Context/Topic
  insight: string; // The learned strategy or correction
  successRate: number;
  source: 'system' | 'user_correction';
}

export interface AppState {
  mode: InputMode;
  explanationLevel: ExplanationLevel;
  inputData: string | null; // Text string or Base64 image/audio
  audioBlob: Blob | null;
  status: AgentStatus;
  logs: AgentLog[];
  parsedProblem: MathProblem | null;
  solution: Solution | null;
  error: string | null;
  userProgress: UserProgress;
  learningMemory: LearningMemoryItem[];
}