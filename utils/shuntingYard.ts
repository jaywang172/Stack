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
  // Match numbers/variables (alphanumeric + dots) OR operators
  // We do not match whitespace, effectively stripping it out
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
  
  // Initial State: All in INPUT
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

  // Initial Record
  recordStep('Start', 'Ready to process the expression.', null);

  const operatorStack: Token[] = [];
  const outputQueue: Token[] = [];
  let inputIndex = 0;

  // Simulation Loop
  for (const token of tokens) {
    // 1. Highlight processing token
    recordStep(
      `Read ${token.value}`,
      `Processing token '${token.value}'.`,
      token.id
    );

    if (token.type === TokenType.OPERAND) {
      // Move to Output
      outputQueue.push(token);
      currentTokenStates[token.id] = { location: TokenLocation.OUTPUT, index: outputQueue.length - 1 };
      recordStep(
        `Move ${token.value} to Output`,
        `Operands like '${token.value}' go directly to the postfix output.`,
        token.id
      );
    } else if (token.type === TokenType.LEFT_PAREN) {
      // Push to Stack
      operatorStack.push(token);
      currentTokenStates[token.id] = { location: TokenLocation.STACK, index: operatorStack.length - 1 };
      recordStep(
        `Push ( to Stack`,
        `Left parentheses are pushed to the stack to wait for a matching closing parenthesis.`,
        token.id
      );
    } else if (token.type === TokenType.RIGHT_PAREN) {
      // Pop until Left Paren
      let foundLeft = false;
      while (operatorStack.length > 0) {
        const top = operatorStack[operatorStack.length - 1];
        if (top.type === TokenType.LEFT_PAREN) {
          operatorStack.pop();
          // Discard both parens
          currentTokenStates[top.id] = { location: TokenLocation.DISCARDED, index: 0 };
          currentTokenStates[token.id] = { location: TokenLocation.DISCARDED, index: 0 };
          foundLeft = true;
          recordStep(
            `Discard Parentheses`,
            `Found matching '(', so both parentheses are discarded.`,
            token.id
          );
          break;
        } else {
          // Pop operator to output
          const popped = operatorStack.pop()!;
          outputQueue.push(popped);
          currentTokenStates[popped.id] = { location: TokenLocation.OUTPUT, index: outputQueue.length - 1 };
          operatorStack.forEach((t, idx) => currentTokenStates[t.id].index = idx);
          
          recordStep(
            `Pop ${popped.value} to Output`,
            `Popping '${popped.value}' because we hit a closing parenthesis.`,
            popped.id
          );
        }
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
          `'${popped.value}' has higher or equal precedence than '${token.value}', so we pop it first.`,
          popped.id
        );
      }
      operatorStack.push(token);
      currentTokenStates[token.id] = { location: TokenLocation.STACK, index: operatorStack.length - 1 };
      operatorStack.forEach((t, idx) => currentTokenStates[t.id].index = idx);
      
      recordStep(
        `Push ${token.value} to Stack`,
        `Pushing '${token.value}' to the operator stack.`,
        token.id
      );
    }
  }

  // Pop remaining
  while (operatorStack.length > 0) {
    const popped = operatorStack.pop()!;
    if (popped.type === TokenType.LEFT_PAREN) {
        // Mismatched, but just discard
        currentTokenStates[popped.id] = { location: TokenLocation.DISCARDED, index: 0 };
    } else {
        outputQueue.push(popped);
        currentTokenStates[popped.id] = { location: TokenLocation.OUTPUT, index: outputQueue.length - 1 };
    }
    operatorStack.forEach((t, idx) => currentTokenStates[t.id].index = idx);
    recordStep(
      `Pop ${popped.value} to Output`,
      `End of expression. Popping remaining operator '${popped.value}'.`,
      popped.id
    );
  }

  recordStep('Finished', 'Conversion complete.', null);

  return { tokens, steps };
};