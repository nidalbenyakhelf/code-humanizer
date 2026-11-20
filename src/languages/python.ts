import { HumanizeOptions, LanguageProfile } from './types';

const PYTHON_PROTECTED = new Set([
  'False', 'None', 'True', 'and', 'as', 'assert', 'async', 'await', 'break',
  'class', 'continue', 'def', 'del', 'elif', 'else', 'except', 'finally',
  'for', 'from', 'global', 'if', 'import', 'in', 'is', 'lambda', 'nonlocal',
  'not', 'or', 'pass', 'raise', 'return', 'try', 'while', 'with', 'yield',
  'print', 'len', 'range', 'int', 'float', 'str', 'bool', 'list', 'dict',
  'set', 'tuple', 'open', 'input', 'enumerate', 'zip', 'map', 'filter', 'sum',
  'min', 'max', 'abs'
]);

export const pythonProfile: LanguageProfile = {
  id: 'python',
  protectedWords: PYTHON_PROTECTED,
  isCommentLine(line: string): boolean {
    return line.trim().startsWith('#');
  },
  extractVariables(code: string): string[] {
    const found: string[] = [];
    for (const m of code.matchAll(/^[ \t]*([a-zA-Z_][a-zA-Z0-9_]*)\s*=[^=]/gm)) {
      const name = m[1];
      if (!PYTHON_PROTECTED.has(name) && name.length > 2 && !found.includes(name)) {
        found.push(name);
      }
    }
    return found;
  },
  applyStyleTweaks(code: string, _options: HumanizeOptions): string {
    // Keep Python indentation completely untouched to avoid IndentationError
    return code;
  }
};
