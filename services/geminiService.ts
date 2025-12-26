import { GoogleGenAI } from "@google/genai";
import { AgentLog, MathProblem, Solution, RagSource, ExplanationLevel, UserProgress, LearningMemoryItem } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- Helper: Clean JSON String ---
const cleanJsonString = (text: string): string => {
  if (!text) return "{}";
  // Remove markdown code blocks of any kind
  let clean = text.replace(/```(?:json)?/g, "").replace(/```/g, "");
  
  // Find the outer-most braces to extract JSON
  const firstBrace = clean.indexOf('{');
  const lastBrace = clean.lastIndexOf('}');
  
  if (firstBrace !== -1 && lastBrace !== -1) {
    clean = clean.substring(firstBrace, lastBrace + 1);
  }
  
  return clean.trim();
};

// --- Helper: File to Base64 ---
export const fileToGenerativePart = async (file: File): Promise<{ inlineData: { data: string; mimeType: string } }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1];
      resolve({
        inlineData: {
          data: base64String,
          mimeType: file.type,
        },
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const blobToGenerativePart = async (blob: Blob, mimeType: string): Promise<{ inlineData: { data: string; mimeType: string } }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1];
      resolve({
        inlineData: {
          data: base64String,
          mimeType: mimeType,
        },
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

// --- Agent 1: Parser Agent ---
// Parses raw input (text/image/audio transcript) into a structured math problem.
export const runParserAgent = async (
  inputData: string | { inlineData: { data: string; mimeType: string } },
  mode: 'TEXT' | 'IMAGE' | 'AUDIO'
): Promise<MathProblem> => {
  
  // Use Flash for faster, more reliable JSON parsing of structured data
  const modelId = "gemini-3-flash-preview"; 
  
  let parts = [];
  
  // Construct parts array. Media MUST be first for the model to attend to it properly.
  if (mode === 'TEXT') {
    parts.push({ text: "Analyze the following math problem text:" });
    parts.push({ text: inputData as string });
  } else if (mode === 'IMAGE') {
    // @ts-ignore
    parts.push(inputData); // Image First
    parts.push({ text: "Analyze this image. Extract the math problem exactly. Return JSON format." });
  } else if (mode === 'AUDIO') {
    // @ts-ignore
    parts.push(inputData); // Audio First
    // Stronger prompt for audio transcription
    parts.push({ text: "Listen carefully to this audio file. It contains a spoken math problem. Transcribe it word-for-word into mathematical notation (e.g. 'root x' -> 'sqrt(x)'). Ignore background noise. Return the structure in JSON." });
  }

  const prompt = `
    You are an expert Math Parser Agent for JEE level problems.
    Analyze the input and output a STRICT JSON object with this schema:
    {
      "parsedText": "The clean mathematical statement",
      "topic": "Algebra | Calculus | Probability | Linear Algebra",
      "subtopic": "Specific subtopic",
      "confidence": 0.0 to 1.0,
      "variables": ["list", "of", "variables"],
      "constraints": ["list", "of", "constraints"],
      "complexity": "Easy | Medium | Hard | JEE-Advanced"
    }
    If the input is gibberish or not math, set confidence to 0.
    IMPORTANT: Return ONLY the JSON object. Do not add markdown formatting or explanations.
  `;
  
  parts.push({ text: prompt });

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: [
        { role: 'user', parts: parts }
      ],
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = response.text;
    if (!text) throw new Error("Empty response from Gemini.");
    
    // console.log("Parser Raw Response:", text); 
    const cleanedText = cleanJsonString(text);
    return JSON.parse(cleanedText) as MathProblem;
  } catch (error: any) {
    console.error("Parser Error Details:", error);
    // Enhance error message for UI
    let msg = error.message || "Unknown error";
    if (msg.includes("404")) msg = "Model not found (Check API Key/Region)";
    else if (msg.includes("429")) msg = "Too many requests. Please wait.";
    else if (msg.includes("SAFETY")) msg = "Content flagged by safety filters.";
    
    throw new Error(msg);
  }
};

// --- Agent 2 & 3 & 4: Solver, Verifier, Explainer Orchestration ---
export const runSolverOrchestration = async (
  problem: MathProblem, 
  explanationLevel: ExplanationLevel,
  userProgress: UserProgress,
  learningMemory: LearningMemoryItem[]
): Promise<Solution> => {
  
  // Use Pro for complex reasoning
  const modelId = "gemini-3-pro-preview";

  // 1. Determine Adaptive Context
  const topicMastery = userProgress.topicMastery[problem.topic] || 50;
  const userMistakes = userProgress.commonMistakes.join(', ') || "None recorded";
  
  const relevantMemory = learningMemory
    .filter(item => item.trigger.includes(problem.topic) || item.trigger === 'General')
    .sort((a, b) => b.successRate - a.successRate)
    .slice(0, 3);

  const memoryContext = relevantMemory.length > 0 
    ? relevantMemory.map(m => `- [Proven Strategy]: ${m.insight} (Success Rate: ${(m.successRate * 100).toFixed(0)}%)`).join('\n')
    : "No specific past memory for this topic.";

  // 2. Construct Adaptive Instruction
  // CRITICAL: This logic drives the explanation depth
  let personaInstruction = "";
  if (topicMastery < 40 || explanationLevel === 'Beginner') {
      personaInstruction = `
      MODE: TUTOR (For Beginners)
      - Break down every single step. Do not skip arithmetic.
      - Define terms like 'derivative', 'integral', 'probability' when used first.
      - Use analogies.
      - Tone: Encouraging, patient, detailed.
      `;
  } else if (topicMastery > 80 || explanationLevel === 'Advanced') {
      personaInstruction = `
      MODE: PEER (For Experts)
      - Skip trivial arithmetic (like simple addition/multiplication).
      - Focus on the 'Key Insight' or the 'Trick' to solve the problem.
      - Use dense mathematical notation.
      - Tone: Concise, professional, fast.
      `;
  } else {
      personaInstruction = `
      MODE: GUIDE (Intermediate)
      - Balance detail and brevity.
      - Verify complex steps, skip obvious ones.
      `;
  }

  const prompt = `
    You are a Multi-Agent Math Mentor System composed of Solver, Verifier, RAG, and Explainer Agents.

    Problem: ${problem.parsedText}
    Topic: ${problem.topic}
    Constraints: ${problem.constraints.join(', ')}
    
    USER CONTEXT:
    - Mastery in ${problem.topic}: ${topicMastery}%
    - Past Mistakes: ${userMistakes}
    
    ${personaInstruction}
    
    LEARNING MEMORY (RAG):
    ${memoryContext}

    Perform the following:
    1. Plan the solution.
    2. Solve step-by-step according to the MODE defined above.
    3. Verify the answer.
    4. [Dynamic Memory]: If this problem uses a unique trick, generate a brief insight string.

    JSON Schema:
    {
      "finalAnswer": "The final concise answer",
      "verificationStatus": "verified" | "uncertain" | "failed",
      "steps": [
        { "stepNumber": 1, "explanation": "Actual explanation text...", "formula": "Latex string" }
      ],
      "ragSources": [
        { "title": "Name of Theorem/Formula", "snippet": "Definition...", "relevance": 0.95, "isSynthetic": false }
      ],
      "similarProblems": [
        { "id": "1", "problemText": "Similar problem statement", "topic": "Calculus", "difficulty": "Medium" }
      ],
      "generatedMemory": "Optional short string of new insight to learn"
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: [
        { role: 'user', parts: [{ text: prompt }] }
      ],
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = response.text;
    if (!text) throw new Error("Empty response from Solver.");

    const cleanedText = cleanJsonString(text);
    return JSON.parse(cleanedText) as Solution;
  } catch (error: any) {
    console.error("Solver Error:", error);
    let msg = error.message || "Unknown error";
    if (msg.includes("404")) msg = "Solver Model not found";
    throw new Error(msg);
  }
};