import React, { useState, useEffect, useRef } from 'react';
import { LayoutGroup, AnimatePresence } from 'framer-motion';
import { generateSteps } from './utils/shuntingYard';
import { AlgorithmResult, TokenLocation } from './types';
import { TokenComponent } from './components/TokenComponent';
import { Controls } from './components/Controls';
import { ExplanationPanel } from './components/ExplanationPanel';
import { Calculator, Github, HelpCircle } from 'lucide-react';

const DEFAULT_EXPRESSION = "A + B * C - ( D / E )";

const App: React.FC = () => {
  const [expression, setExpression] = useState(DEFAULT_EXPRESSION);
  const [result, setResult] = useState<AlgorithmResult>(generateSteps(DEFAULT_EXPRESSION));
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  
  const timerRef = useRef<number | null>(null);

  // Re-run algorithm when expression changes
  useEffect(() => {
    try {
      const newResult = generateSteps(expression);
      setResult(newResult);
      setCurrentStep(0);
      setIsPlaying(false);
    } catch (e) {
      // Handle invalid expression gracefully
      console.error("Invalid expression");
    }
  }, [expression]);

  // Auto-play logic
  useEffect(() => {
    if (isPlaying) {
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
  }, [isPlaying, result.steps.length, playbackSpeed]);

  // Handlers
  const handlePlayPause = () => setIsPlaying(!isPlaying);
  const handleReset = () => {
    setIsPlaying(false);
    setCurrentStep(0);
  };
  const handleStepForward = () => {
    setIsPlaying(false);
    if (currentStep < result.steps.length - 1) setCurrentStep(currentStep + 1);
  };
  const handleStepBack = () => {
    setIsPlaying(false);
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const currentSnapshot = result.steps[currentStep] || result.steps[0];

  // Filter tokens for each area based on current snapshot
  const inputTokens = result.tokens.filter(t => currentSnapshot.tokenStates[t.id]?.location === TokenLocation.INPUT);
  const stackTokens = result.tokens.filter(t => currentSnapshot.tokenStates[t.id]?.location === TokenLocation.STACK);
  const outputTokens = result.tokens.filter(t => currentSnapshot.tokenStates[t.id]?.location === TokenLocation.OUTPUT);

  // Sort stack tokens by index for visual stacking
  stackTokens.sort((a, b) => currentSnapshot.tokenStates[a.id].index - currentSnapshot.tokenStates[b.id].index);
  // Sort output tokens by index
  outputTokens.sort((a, b) => currentSnapshot.tokenStates[a.id].index - currentSnapshot.tokenStates[b.id].index);

  // Calculate current postfix string
  const currentPostfix = outputTokens.map(t => t.value).join(' ');

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
              className="w-full bg-slate-900 border-2 border-slate-800 rounded-xl px-5 py-4 text-xl font-mono text-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all placeholder-slate-600"
              placeholder="e.g. A + B * C"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none group-focus-within:text-indigo-500">
               <HelpCircle size={20} />
            </div>
          </div>
        </div>

        {/* Visualizer Canvas */}
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
                    {inputTokens.map((token, i) => (
                      <TokenComponent 
                        key={token.id} 
                        token={token} 
                        index={i} 
                        isActive={token.id === currentSnapshot.activeTokenId} 
                      />
                    ))}
                  </AnimatePresence>
                  {inputTokens.length === 0 && (
                    <div className="w-full h-full flex items-center justify-center text-slate-700 text-sm italic">
                      Empty
                    </div>
                  )}
                </div>
              </div>

              {/* Stack */}
              <div className="flex flex-col gap-4 items-center">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Operator Stack</h3>
                <div className="w-full flex-1 bg-slate-950/50 rounded-2xl border-x-2 border-b-2 border-slate-700 p-4 flex flex-col-reverse items-center gap-2 relative">
                   {/* Stack top indicator */}
                   <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-slate-800 px-2 py-0.5 rounded text-[10px] text-slate-400 font-mono">TOP</div>
                   <AnimatePresence>
                    {stackTokens.map((token, i) => (
                      <TokenComponent 
                        key={token.id} 
                        token={token} 
                        index={i} 
                        isActive={token.id === currentSnapshot.activeTokenId} 
                      />
                    ))}
                   </AnimatePresence>
                </div>
              </div>

              {/* Output Queue */}
              <div className="flex flex-col gap-4">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Postfix Output</h3>
                <div className="flex-1 bg-slate-950/50 rounded-2xl border border-slate-800 p-4 flex flex-wrap content-start gap-3 shadow-inner">
                   <AnimatePresence>
                    {outputTokens.map((token, i) => (
                      <TokenComponent 
                        key={token.id} 
                        token={token} 
                        index={i} 
                        isActive={token.id === currentSnapshot.activeTokenId} 
                      />
                    ))}
                   </AnimatePresence>
                   {outputTokens.length === 0 && (
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
              {/* Arrow from Input to Stack */}
              <path d="M 250 200 Q 350 200 380 250" fill="none" stroke="#64748b" strokeWidth="2" strokeDasharray="5,5" markerEnd="url(#arrowhead)" />
              {/* Arrow from Input to Output */}
              <path d="M 250 200 Q 500 100 750 200" fill="none" stroke="#64748b" strokeWidth="2" strokeDasharray="5,5" markerEnd="url(#arrowhead)" />
              {/* Arrow from Stack to Output */}
              <path d="M 450 250 Q 550 250 650 250" fill="none" stroke="#64748b" strokeWidth="2" strokeDasharray="5,5" markerEnd="url(#arrowhead)" />
           </svg>
        </div>

        {/* Live Result Display */}
        <div className="w-full max-w-2xl bg-slate-900/80 backdrop-blur border border-slate-700 rounded-xl px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-lg">
            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Current Postfix Output</span>
            <div className="font-mono text-xl text-emerald-400 font-bold break-all text-right">
              {currentPostfix || <span className="text-slate-700 opacity-50">Waiting to start...</span>}
            </div>
        </div>

        {/* Controls & Explanation */}
        <div className="w-full max-w-2xl space-y-6">
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

      </main>
    </div>
  );
};

export default App;