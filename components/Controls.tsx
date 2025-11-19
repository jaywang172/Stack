import React from 'react';
import { Play, Pause, SkipBack, SkipForward, RotateCcw, ChevronRight, ChevronLeft } from 'lucide-react';
import clsx from 'clsx';

interface ControlsProps {
  isPlaying: boolean;
  onPlayPause: () => void;
  onReset: () => void;
  onStepForward: () => void;
  onStepBack: () => void;
  currentStep: number;
  totalSteps: number;
  playbackSpeed: number;
  setPlaybackSpeed: (speed: number) => void;
}

export const Controls: React.FC<ControlsProps> = ({
  isPlaying,
  onPlayPause,
  onReset,
  onStepForward,
  onStepBack,
  currentStep,
  totalSteps,
  playbackSpeed,
  setPlaybackSpeed
}) => {
  return (
    <div className="flex flex-col items-center gap-4 p-6 bg-slate-800/50 backdrop-blur-lg rounded-2xl border border-slate-700 w-full max-w-2xl mx-auto shadow-xl">
      {/* Progress Bar */}
      <div className="w-full flex items-center gap-3">
        <span className="text-xs text-slate-400 font-mono min-w-[3ch]">{currentStep}</span>
        <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden relative">
          <div 
            className="absolute top-0 left-0 h-full bg-indigo-500 transition-all duration-300 ease-out"
            style={{ width: `${(currentStep / Math.max(totalSteps - 1, 1)) * 100}%` }}
          />
        </div>
        <span className="text-xs text-slate-400 font-mono min-w-[3ch]">{totalSteps - 1}</span>
      </div>

      {/* Buttons */}
      <div className="flex items-center gap-4">
        <button onClick={onReset} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-full transition-colors" title="Reset">
          <RotateCcw size={20} />
        </button>
        
        <button onClick={onStepBack} disabled={currentStep === 0} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-full transition-colors disabled:opacity-30">
          <ChevronLeft size={24} />
        </button>

        <button 
          onClick={onPlayPause} 
          className={clsx(
            "w-14 h-14 flex items-center justify-center rounded-full text-white shadow-lg transition-all active:scale-95",
            isPlaying ? "bg-amber-500 hover:bg-amber-600 shadow-amber-500/20" : "bg-indigo-500 hover:bg-indigo-600 shadow-indigo-500/20"
          )}
        >
          {isPlaying ? <Pause fill="currentColor" /> : <Play fill="currentColor" className="ml-1" />}
        </button>

        <button onClick={onStepForward} disabled={currentStep >= totalSteps - 1} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-full transition-colors disabled:opacity-30">
          <ChevronRight size={24} />
        </button>
        
        {/* Speed Toggle */}
        <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-700">
            {[0.5, 1, 2].map(speed => (
                <button
                    key={speed}
                    onClick={() => setPlaybackSpeed(speed)}
                    className={clsx(
                        "px-2 py-1 text-xs font-bold rounded transition-colors",
                        playbackSpeed === speed ? "bg-slate-700 text-white" : "text-slate-500 hover:text-slate-300"
                    )}
                >
                    {speed}x
                </button>
            ))}
        </div>
      </div>
    </div>
  );
};
