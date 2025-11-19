import React from 'react';
import { motion } from 'framer-motion';
import { Token, TokenType } from '../types';
import clsx from 'clsx';

interface TokenComponentProps {
  token: Token;
  index: number;
  isActive: boolean;
}

export const TokenComponent: React.FC<TokenComponentProps> = ({ token, index, isActive }) => {
  const isOperator = token.type === TokenType.OPERATOR;
  const isParen = token.type === TokenType.LEFT_PAREN || token.type === TokenType.RIGHT_PAREN;
  
  return (
    <motion.div
      layoutId={token.id}
      initial={false}
      animate={{
        scale: isActive ? 1.15 : 1,
        boxShadow: isActive 
          ? '0 0 20px rgba(59, 130, 246, 0.6)' 
          : '0 2px 4px rgba(0,0,0,0.2)',
        zIndex: isActive ? 50 : 1,
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className={clsx(
        "relative min-w-[3rem] w-auto px-3 h-12 flex items-center justify-center rounded-xl text-lg font-bold border-2 select-none",
        isOperator ? "bg-rose-500/20 border-rose-500 text-rose-200" :
        isParen ? "bg-amber-500/20 border-amber-500 text-amber-200" :
        "bg-blue-500/20 border-blue-500 text-blue-200",
        isActive && "brightness-125 ring-2 ring-white/20"
      )}
    >
      {token.value}
      
      {/* Priority Badge for Operators */}
      {isOperator && (
        <div className="absolute -top-2 -right-2 w-5 h-5 bg-slate-900 border border-rose-500 rounded-full flex items-center justify-center text-[10px] text-rose-400 font-mono shadow-sm" title={`Precedence: ${token.priority}`}>
          {token.priority}
        </div>
      )}
    </motion.div>
  );
};