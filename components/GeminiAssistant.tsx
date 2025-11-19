import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Sparkles, Loader2, AlertCircle } from 'lucide-react';

interface GeminiAssistantProps {
  expression: string;
  stepDescription: string;
  stepExplanation: string;
  stepIndex: number;
}

export const GeminiAssistant: React.FC<GeminiAssistantProps> = ({ 
  expression, 
  stepDescription, 
  stepExplanation,
  stepIndex
}) => {
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // We don't auto-fetch to save tokens and avoid annoyance, 
  // but we could if we wanted a "Live Commentary" mode.
  // For now, we just show the algorithmic explanation, and offer a button for "Deep Dive".

  const handleDeepDive = async () => {
    if (!process.env.API_KEY) {
      setError("API Key not configured in environment.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const model = 'gemini-2.5-flash';
      
      const prompt = `
        I am visualizing the Shunting-yard algorithm for the expression: "${expression}".
        Current Step: ${stepDescription}.
        Algorithm Note: ${stepExplanation}.
        
        Please explain simply to a computer science student why this specific step is happening right now. 
        Focus on operator precedence or stack rules. Keep it under 3 sentences.
      `;

      const result = await ai.models.generateContent({
        model,
        contents: prompt,
      });
      
      setResponse(result.text);
    } catch (e) {
      setError("Failed to fetch AI explanation.");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };
  
  // Reset when step changes
  useEffect(() => {
    setResponse(null);
    setError(null);
    setLoading(false);
  }, [stepIndex, expression]);

  return (
    <div className="w-full max-w-2xl mx-auto mt-6 bg-slate-900/50 border border-slate-700 rounded-xl p-6">
      <h3 className="text-slate-400 text-sm font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
        Current Operation
      </h3>
      <p className="text-xl text-white font-light mb-2">{stepDescription}</p>
      <p className="text-slate-400 text-sm mb-4 border-l-2 border-slate-700 pl-3">{stepExplanation}</p>

      {response && (
        <div className="mb-4 p-4 bg-indigo-900/20 border border-indigo-500/30 rounded-lg">
           <h4 className="text-indigo-300 text-xs font-bold uppercase mb-1 flex items-center gap-1">
             <Sparkles size={12} /> Gemini Insight
           </h4>
           <p className="text-indigo-100 text-sm leading-relaxed">{response}</p>
        </div>
      )}

      {error && (
         <div className="mb-4 p-3 bg-red-900/20 border border-red-500/30 rounded-lg flex items-center gap-2 text-red-300 text-sm">
            <AlertCircle size={16} /> {error}
         </div>
      )}

      <button 
        onClick={handleDeepDive}
        disabled={loading || !process.env.API_KEY}
        className="text-xs flex items-center gap-2 text-indigo-400 hover:text-indigo-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
        {loading ? "Asking Gemini..." : "Ask AI Why"}
      </button>
    </div>
  );
};
