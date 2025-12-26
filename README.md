# Multimodal Math Mentor 🧠📘

A reliable multimodal AI system that solves **JEE-style math problems** using **Retrieval-Augmented Generation (RAG)**, **multi-agent reasoning**, **human-in-the-loop (HITL) validation**, and **long-term memory**.

This project is built as part of the **AI Engineer Assignment for AI Planet**.

---

## 🚀 Features

- 📷 Image-based math problem solving (OCR)
- 🎙️ Audio-based math problem solving (ASR)
- ⌨️ Text-based math input
- 🧠 Multi-agent architecture (Parser, Solver, Verifier, Explainer)
- 📚 Retrieval-Augmented Generation (RAG)
- 🧑‍⚖️ Human-in-the-Loop (HITL) validation
- 🗂️ Memory-based self-learning (no retraining)
- 📊 Confidence scoring & verification
- 🧾 Full audit trail for every solution

---

## 📐 Math Scope

- Algebra  
- Probability  
- Basic Calculus (limits, derivatives, optimization)  
- Linear Algebra (basics)  

⚠️ Difficulty is strictly limited to **JEE-level** problems.

---

## 🏗️ System Architecture

The system uses a **modular, agent-based design** with a central orchestrator.

- Multimodal input pipeline (Image / Audio / Text)
- Parser Agent → Intent Router → Solver Agent
- Retrieval-Augmented Knowledge Base
- Verifier Agent for correctness & safety
- Explainer Agent for step-by-step tutoring
- Human-in-the-Loop for low-confidence cases
- Memory layer for continuous improvement

📄 See `architecture.mmd` for the full diagram.

---

## 🧠 Multi-Agent Roles

| Agent | Responsibility |
|------|----------------|
| Parser Agent | Cleans and structures raw input |
| Intent Router Agent | Determines topic and solving strategy |
| Solver Agent | Solves problems using RAG and tools |
| Verifier Agent | Checks correctness and edge cases |
| Explainer Agent | Generates student-friendly explanations |

---

## 🔁 Human-in-the-Loop (HITL)

HITL is triggered when:
- OCR / ASR confidence is low
- Input is ambiguous
- Verifier confidence is low
- User requests a re-check

Human feedback is stored and reused as **learning signals**.

---

## 🧠 Memory & Self-Learning

The system stores:
- Original input
- Parsed problem
- Retrieved context
- Final answer
- Verifier score
- User feedback

Memory is used to:
- Retrieve similar solved problems
- Reuse solution patterns
- Avoid repeating known mistakes

---

## 🖥️ Running the App Locally

### 1️⃣ Clone the repository
```bash
git clone https://github.com/your-username/multimodal-math-mentor.git
cd multimodal-math-mentor
2️⃣ Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
3️⃣ Install dependencies
pip install -r requirements.txt
4️⃣ Setup environment variables
cp .env.example .env
5️⃣ Run the application
streamlit run app.py

