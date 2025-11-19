import { AlgorithmResult, StepSnapshot, Token, TokenLocation, TokenType } from '../types';

const getPriority = (char: string): number => {
  if (char === '^') return 3;
  if (char === '*' || char === '/') return 2;
  if (char === '+' || char === '-') return 1;
  return 0;
};

const isLeftAssociative = (char: string): boolean => {
  return char !== '^'; // ^ is right associative
};

export const generateSteps = (expression: string): AlgorithmResult => {
  // 1. Parse Expression into Tokens
  const regex = /([a-zA-Z0-9.]+|[+\-*/^()])/g;
  const rawTokens = expression.match(regex) || [];

  const tokens: Token[] = rawTokens.map((str, idx) => {
    let type = TokenType.OPERAND;
    if (['+', '-', '*', '/', '^'].includes(str)) type = TokenType.OPERATOR;
    else if (str === '(') type = TokenType.LEFT_PAREN;
    else if (str === ')') type = TokenType.RIGHT_PAREN;

    return {
      id: `t-${idx}-${str}`,
      value: str,
      type,
      priority: getPriority(str),
    };
  });

  const steps: StepSnapshot[] = [];
  
  let currentTokenStates: Record<string, { location: TokenLocation; index: number }> = {};
  tokens.forEach((t, i) => {
    currentTokenStates[t.id] = { location: TokenLocation.INPUT, index: i };
  });

  const recordStep = (desc: string, explanation: string, activeId: string | null) => {
    steps.push({
      stepIndex: steps.length,
      description: desc,
      detailedExplanation: explanation,
      tokenStates: JSON.parse(JSON.stringify(currentTokenStates)),
      activeTokenId: activeId,
    });
  };

  recordStep('Start', 'Ready to process the expression.', null);

  const operatorStack: Token[] = [];
  const outputQueue: Token[] = [];

  // Simulation Loop
  for (const token of tokens) {
    recordStep(
      `Read ${token.value}`,
      `Processing token '${token.value}'.`,
      token.id
    );

    if (token.type === TokenType.OPERAND) {
      outputQueue.push(token);
      currentTokenStates[token.id] = { location: TokenLocation.OUTPUT, index: outputQueue.length - 1 };
      recordStep(
        `Move ${token.value} to Output`,
        `Operands go directly to the result.`,
        token.id
      );
    } else if (token.type === TokenType.LEFT_PAREN) {
      operatorStack.push(token);
      currentTokenStates[token.id] = { location: TokenLocation.STACK, index: operatorStack.length - 1 };
      recordStep(
        `Push ( to Stack`,
        `Parentheses wait in the stack until closed.`,
        token.id
      );
    } else if (token.type === TokenType.RIGHT_PAREN) {
      let foundLeft = false;
      while (operatorStack.length > 0) {
        const top = operatorStack[operatorStack.length - 1];
        if (top.type === TokenType.LEFT_PAREN) {
          operatorStack.pop();
          currentTokenStates[top.id] = { location: TokenLocation.DISCARDED, index: 0 };
          currentTokenStates[token.id] = { location: TokenLocation.DISCARDED, index: 0 };
          foundLeft = true;
          recordStep(
            `Discard Parentheses`,
            `Matching pair found. Both are discarded.`,
            token.id
          );
          break;
        } else {
          const popped = operatorStack.pop()!;
          outputQueue.push(popped);
          currentTokenStates[popped.id] = { location: TokenLocation.OUTPUT, index: outputQueue.length - 1 };
          operatorStack.forEach((t, idx) => currentTokenStates[t.id].index = idx);
          
          recordStep(
            `Pop ${popped.value} to Output`,
            `Inside parentheses, pop '${popped.value}' to output.`,
            popped.id
          );
        }
      }
      if (!foundLeft) {
        throw new Error("Mismatched Parentheses: Missing '('");
      }
    } else if (token.type === TokenType.OPERATOR) {
      while (
        operatorStack.length > 0 &&
        operatorStack[operatorStack.length - 1].type !== TokenType.LEFT_PAREN &&
        (
          operatorStack[operatorStack.length - 1].priority > token.priority ||
          (operatorStack[operatorStack.length - 1].priority === token.priority && isLeftAssociative(token.value))
        )
      ) {
        const popped = operatorStack.pop()!;
        outputQueue.push(popped);
        currentTokenStates[popped.id] = { location: TokenLocation.OUTPUT, index: outputQueue.length - 1 };
        operatorStack.forEach((t, idx) => currentTokenStates[t.id].index = idx);

        recordStep(
          `Pop ${popped.value} to Output`,
          `'${popped.value}' (P:${popped.priority}) has higher/equal precedence than '${token.value}' (P:${token.priority}).`,
          popped.id
        );
      }
      operatorStack.push(token);
      currentTokenStates[token.id] = { location: TokenLocation.STACK, index: operatorStack.length - 1 };
      operatorStack.forEach((t, idx) => currentTokenStates[t.id].index = idx);
      
      recordStep(
        `Push ${token.value} to Stack`,
        `Push '${token.value}' (P:${token.priority}) to stack.`,
        token.id
      );
    }
  }

  while (operatorStack.length > 0) {
    const popped = operatorStack.pop()!;
    if (popped.type === TokenType.LEFT_PAREN) {
        throw new Error("Mismatched Parentheses: Missing ')'");
    }
    outputQueue.push(popped);
    currentTokenStates[popped.id] = { location: TokenLocation.OUTPUT, index: outputQueue.length - 1 };
    operatorStack.forEach((t, idx) => currentTokenStates[t.id].index = idx);
    recordStep(
      `Pop ${popped.value} to Output`,
      `Expression end. Pop remaining '${popped.value}'.`,
      popped.id
    );
  }

  recordStep('Finished', 'Conversion complete.', null);

  return { tokens, steps };
};