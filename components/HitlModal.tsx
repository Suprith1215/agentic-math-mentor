import React, { useState } from 'react';
import { MathProblem } from '../types';
import { AlertCircle, Check } from 'lucide-react';

interface HitlModalProps {
  problem: MathProblem;
  onConfirm: (correctedText: string) => void;
  onCancel: () => void;
}

const HitlModal: React.FC<HitlModalProps> = ({ problem, onConfirm, onCancel }) => {
  const [editedText, setEditedText] = useState(problem.parsedText);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden animate-fade-in">
        <div className="bg-amber-50 p-4 border-b border-amber-100 flex items-start gap-3">
          <AlertCircle className="text-amber-600 shrink-0" size={24} />
          <div>
            <h3 className="text-lg font-semibold text-amber-800">Review Required</h3>
            <p className="text-sm text-amber-700">
              The confidence for this problem is low ({(problem.confidence * 100).toFixed(0)}%). 
              Please verify the interpretation before we solve it.
            </p>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Problem Text
            </label>
            <textarea
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
              className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 min-h-[120px]"
            />
          </div>

          <div className="flex gap-2 text-xs text-slate-500">
            <span className="font-semibold">Detected Topic:</span> {problem.topic}
          </div>
        </div>

        <div className="bg-slate-50 p-4 border-t border-slate-100 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-slate-600 font-medium hover:text-slate-800"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(editedText)}
            className="px-4 py-2 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 flex items-center gap-2"
          >
            <Check size={16} />
            Confirm & Solve
          </button>
        </div>
      </div>
    </div>
  );
};

export default HitlModal;