export enum TokenType {
  OPERAND = 'OPERAND',
  OPERATOR = 'OPERATOR',
  LEFT_PAREN = 'LEFT_PAREN',
  RIGHT_PAREN = 'RIGHT_PAREN',
}

export interface Token {
  id: string;
  value: string;
  type: TokenType;
  priority: number;
}

export enum TokenLocation {
  INPUT = 'INPUT',
  STACK = 'STACK',
  OUTPUT = 'OUTPUT',
  DISCARDED = 'DISCARDED',
}

export type ConversionMode = 'POSTFIX' | 'PREFIX';

// A snapshot of a single token's state at a specific step
export interface TokenState {
  location: TokenLocation;
  index: number; // Its position within that location (e.g., stack index 0, 1, 2...)
}

// A complete snapshot of the entire system at one step
export interface StepSnapshot {
  stepIndex: number;
  description: string;
  detailedExplanation: string;
  tokenStates: Record<string, TokenState>; // Map token ID to its state
  activeTokenId: string | null; // The token currently being acted upon
}

export interface AlgorithmResult {
  tokens: Token[];
  steps: StepSnapshot[];
  mode: ConversionMode;
}

// For Gemini Integration
export interface GeminiExplanationRequest {
  expression: string;
  currentStepIndex: number;
  stepDescription: string;
}