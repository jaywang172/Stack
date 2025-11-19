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
        scale: isActive ? 1.2 : 1,
        boxShadow: isActive 
          ? '0 0 20px rgba(59, 130, 246, 0.6)' 
          : '0 0 0px rgba(0,0,0,0)',
        zIndex: isActive ? 50 : 1,
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className={clsx(
        "min-w-[3rem] w-auto px-3 h-12 flex items-center justify-center rounded-xl text-lg font-bold border-2 select-none shadow-md",
        isOperator ? "bg-rose-500/20 border-rose-500 text-rose-200" :
        isParen ? "bg-yellow-500/20 border-yellow-500 text-yellow-200" :
        "bg-blue-500/20 border-blue-500 text-blue-200",
        isActive && "brightness-125"
      )}
    >
      {token.value}
    </motion.div>
  );
};