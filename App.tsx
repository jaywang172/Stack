import React, { useState, useEffect, useRef } from 'react';
import { LayoutGroup, AnimatePresence } from 'framer-motion';
import { generateSteps } from './utils/shuntingYard';
import { AlgorithmResult, TokenLocation } from './types';
import { TokenComponent } from './components/TokenComponent';
import { Controls } from './components/Controls';
import { ExplanationPanel } from './components/ExplanationPanel';
import { Calculator, Github, HelpCircle, AlertTriangle } from 'lucide-react';

const DEFAULT_EXPRESSION = "A + B * C - ( D / E )";

const App: React.FC = () => {
  const [expression, setExpression] = useState(DEFAULT_EXPRESSION);
  const [result, setResult] = useState<AlgorithmResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  
  const timerRef = useRef<number | null>(null);

  // Re-run algorithm when expression changes
  useEffect(() => {
    if (!expression.trim()) {
        setResult(null);
        setError(null);
        return;
    }
    try {
      const newResult = generateSteps(expression);
      setResult(newResult);
      setError(null);
      setCurrentStep(0);
      setIsPlaying(false);
    } catch (e: any) {
      setResult(null);
      setError(e.message || "Invalid Expression");
    }
  }, [expression]);

  // Auto-play logic
  useEffect(() => {
    if (isPlaying && result) {
      timerRef.current = window.setInterval(() => {
        setCurrentStep((prev) => {
          if (prev >= result.steps.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1000 / playbackSpeed);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, result, playbackSpeed]);

  // Handlers
  const handlePlayPause = () => setIsPlaying(!isPlaying);
  const handleReset = () => {
    setIsPlaying(false);
    setCurrentStep(0);
  };
  const handleStepForward = () => {
    setIsPlaying(false);
    if (result && currentStep < result.steps.length - 1) setCurrentStep(currentStep + 1);
  };
  const handleStepBack = () => {
    setIsPlaying(false);
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  // Safe access to current state
  const currentSnapshot = result ? (result.steps[currentStep] || result.steps[0]) : null;

  // Helper to render tokens
  const renderTokens = () => {
     if (!result || !currentSnapshot) return null;

     const inputTokens = result.tokens.filter(t => currentSnapshot.tokenStates[t.id]?.location === TokenLocation.INPUT);
     const stackTokens = result.tokens.filter(t => currentSnapshot.tokenStates[t.id]?.location === TokenLocation.STACK);
     const outputTokens = result.tokens.filter(t => currentSnapshot.tokenStates[t.id]?.location === TokenLocation.OUTPUT);

     // Sort by index
     stackTokens.sort((a, b) => currentSnapshot.tokenStates[a.id].index - currentSnapshot.tokenStates[b.id].index);
     outputTokens.sort((a, b) => currentSnapshot.tokenStates[a.id].index - currentSnapshot.tokenStates[b.id].index);

     // Current postfix string for display
     const currentPostfix = outputTokens.map(t => t.value).join(' ');

     return { inputTokens, stackTokens, outputTokens, currentPostfix };
  };

  const tokenData = renderTokens();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-lg">
              <Calculator className="text-white" size={20} />
            </div>
            <h1 className="text-lg font-bold tracking-tight text-white">Shunting Yard Visualizer</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden sm:block text-slate-500 text-sm font-mono">Infix to Postfix</span>
            <a href="#" className="text-slate-400 hover:text-white transition-colors">
                <Github size={20} />
            </a>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center p-6 gap-8">
        
        {/* Input Section */}
        <div className="w-full max-w-2xl">
          <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">Infix Expression</label>
          <div className="relative group">
            <input
              type="text"
              value={expression}
              onChange={(e) => setExpression(e.target.value)}
              className={`w-full bg-slate-900 border-2 rounded-xl px-5 py-4 text-xl font-mono text-white outline-none transition-all placeholder-slate-600 ${error ? 'border-red-500/50 focus:border-red-500 focus:ring-4 focus:ring-red-500/10' : 'border-slate-800 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10'}`}
              placeholder="e.g. A + B * C"
            />
            {error && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-red-400 flex items-center gap-2 text-sm font-bold bg-red-950/50 px-3 py-1 rounded-full border border-red-900/50">
                    <AlertTriangle size={16} />
                    {error}
                </div>
            )}
          </div>
        </div>

        {/* Visualizer Canvas */}
        {tokenData && currentSnapshot && result ? (
        <>
            <div className="w-full max-w-5xl bg-slate-900 rounded-3xl border border-slate-800 p-8 shadow-2xl relative overflow-hidden">
            {/* Grid Background */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none opacity-20"></div>
            
            <LayoutGroup>
                <div className="relative z-10 grid grid-cols-1 md:grid-cols-[1fr_200px_1fr] gap-8 min-h-[400px]">
                
                {/* Input Queue */}
                <div className="flex flex-col gap-4">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Input Queue</h3>
                    <div className="flex-1 bg-slate-950/50 rounded-2xl border border-dashed border-slate-800 p-4 flex flex-wrap content-start gap-3">
                    <AnimatePresence>
                        {tokenData.inputTokens.map((token, i) => (
                        <TokenComponent 
                            key={token.id} 
                            token={token} 
                            index={i} 
                            isActive={token.id === currentSnapshot.activeTokenId} 
                        />
                        ))}
                    </AnimatePresence>
                    {tokenData.inputTokens.length === 0 && (
                        <div className="w-full h-full flex items-center justify-center text-slate-700 text-sm italic">
                        Empty
                        </div>
                    )}
                    </div>
                </div>

                {/* Stack - Styled like a bucket */}
                <div className="flex flex-col gap-4 items-center">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Operator Stack</h3>
                    {/* The "Bucket" Container */}
                    <div className="w-full flex-1 bg-slate-950/30 rounded-b-2xl border-l-4 border-r-4 border-b-4 border-slate-700 p-4 flex flex-col-reverse items-center gap-2 relative min-h-[300px]">
                    {/* Stack top indicator */}
                    {tokenData.stackTokens.length > 0 && (
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-indigo-400 animate-bounce">
                            <div className="text-[10px] font-mono uppercase tracking-widest">Top</div>
                            <div className="w-2 h-2 bg-indigo-400 rotate-45 mx-auto mt-1"></div>
                        </div>
                    )}
                    <AnimatePresence>
                        {tokenData.stackTokens.map((token, i) => (
                        <TokenComponent 
                            key={token.id} 
                            token={token} 
                            index={i} 
                            isActive={token.id === currentSnapshot.activeTokenId} 
                        />
                        ))}
                    </AnimatePresence>
                     {/* Stack Base decoration */}
                     <div className="absolute bottom-0 left-0 w-full h-1 bg-slate-700/50"></div>
                    </div>
                </div>

                {/* Output Queue */}
                <div className="flex flex-col gap-4">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Postfix Output</h3>
                    <div className="flex-1 bg-slate-950/50 rounded-2xl border border-slate-800 p-4 flex flex-wrap content-start gap-3 shadow-inner">
                    <AnimatePresence>
                        {tokenData.outputTokens.map((token, i) => (
                        <TokenComponent 
                            key={token.id} 
                            token={token} 
                            index={i} 
                            isActive={token.id === currentSnapshot.activeTokenId} 
                        />
                        ))}
                    </AnimatePresence>
                    {tokenData.outputTokens.length === 0 && (
                        <div className="w-full h-full flex items-center justify-center text-slate-700 text-sm italic">
                        Result appears here
                        </div>
                    )}
                    </div>
                </div>

                </div>
            </LayoutGroup>

            {/* Flow Arrows (Static SVG overlays) */}
            <svg className="absolute inset-0 pointer-events-none opacity-20 hidden md:block" width="100%" height="100%">
                <defs>
                    <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orient="auto">
                    <polygon points="0 0, 10 3.5, 0 7" fill="#64748b" />
                    </marker>
                </defs>
                <path d="M 250 200 Q 350 200 380 250" fill="none" stroke="#64748b" strokeWidth="2" strokeDasharray="5,5" markerEnd="url(#arrowhead)" />
                <path d="M 250 200 Q 500 100 750 200" fill="none" stroke="#64748b" strokeWidth="2" strokeDasharray="5,5" markerEnd="url(#arrowhead)" />
                <path d="M 450 250 Q 550 250 650 250" fill="none" stroke="#64748b" strokeWidth="2" strokeDasharray="5,5" markerEnd="url(#arrowhead)" />
            </svg>
            </div>

            {/* Live Result Display */}
            <div className="w-full max-w-2xl bg-slate-900/80 backdrop-blur border border-slate-700 rounded-xl px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-lg">
                <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Current Postfix Output</span>
                <div className="font-mono text-xl text-emerald-400 font-bold break-all text-right">
                {tokenData.currentPostfix || <span className="text-slate-700 opacity-50">Waiting to start...</span>}
                </div>
            </div>

            {/* Controls & Explanation */}
            <div className="w-full max-w-2xl space-y-6 pb-12">
            <Controls 
                isPlaying={isPlaying}
                onPlayPause={handlePlayPause}
                onReset={handleReset}
                onStepForward={handleStepForward}
                onStepBack={handleStepBack}
                currentStep={currentStep}
                totalSteps={result.steps.length}
                playbackSpeed={playbackSpeed}
                setPlaybackSpeed={setPlaybackSpeed}
            />

            <ExplanationPanel 
                stepDescription={currentSnapshot.description}
                stepExplanation={currentSnapshot.detailedExplanation}
            />
            </div>
        </>
        ) : (
            <div className="w-full max-w-2xl h-64 flex flex-col items-center justify-center bg-slate-900/50 rounded-3xl border border-slate-800 border-dashed text-slate-500 gap-4">
                <div className="p-4 bg-slate-800 rounded-full">
                    <Calculator size={32} className="opacity-50" />
                </div>
                <p>Enter a valid expression to begin</p>
            </div>
        )}
      </main>
    </div>
  );
};

export default App;