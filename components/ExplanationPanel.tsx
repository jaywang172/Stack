import React from 'react';
import { Info, ArrowRight } from 'lucide-react';

interface ExplanationPanelProps {
  stepDescription: string;
  stepExplanation: string;
}

export const ExplanationPanel: React.FC<ExplanationPanelProps> = ({
  stepDescription,
  stepExplanation,
}) => {
  return (
    <div className="w-full max-w-2xl mx-auto mt-2 bg-slate-900/50 border border-slate-800 rounded-xl p-6 shadow-lg relative overflow-hidden">
      {/* Decorative background accent */}
      <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
      
      <h3 className="text-indigo-400 text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2">
        <Info size={16} />
        Current Step
      </h3>
      
      <div className="flex items-start gap-4 mb-3">
        <p className="text-2xl text-white font-light leading-tight">{stepDescription}</p>
      </div>
      
      <div className="text-slate-300 text-sm leading-relaxed bg-slate-950/30 p-4 rounded-lg border border-slate-800/50">
        {stepExplanation}
      </div>
    </div>
  );
};