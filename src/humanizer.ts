export type HumanizeIntensity = 'subtle' | 'balanced' | 'heavy';
export type AuthorStyle = 'clean-standard' | 'pragmatic' | 'beginner';

export interface HumanizeOptions {
  intensity: HumanizeIntensity;
  style: AuthorStyle;
  removeAiComments: boolean;
  shortVariablesInBeginnerMode: boolean;
}

const RESERVED_WORDS = new Set([
  'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'default', 'break',
  'continue', 'return', 'function', 'const', 'let', 'var', 'class', 'new',
  'try', 'catch', 'finally', 'throw', 'async', 'await', 'import', 'export',
  'from', 'def', 'elif', 'True', 'False', 'None', 'true', 'false', 'null',
  'undefined', 'int', 'float', 'double', 'char', 'bool', 'void', 'struct',
  'public', 'private', 'protected', 'static', 'console', 'log', 'print',
  'Math', 'Object', 'Array', 'String', 'Number', 'Boolean', 'Promise', 'Error'
]);

const AI_COMMENT_PATTERNS = [
  /^\s*(\/\/|#)\s*(here is|this function|this code|the following|helper function|initialize|check if|return the|loop through|step \d+|note:)/i,
  /^\s*\/\*\*?\s*(this|helper|function|method|returns|creates|handles)\b/i
];

const SHORT_NAMES = ['x', 'y', 'z', 'n', 'm', 'k', 'val', 'tmp', 'res', 'out'];

function isAiLikeComment(line: string): boolean {
  return AI_COMMENT_PATTERNS.some((pattern) => pattern.test(line));
}

function collapseExcessBlankLines(text: string, maxBlankLines: number): string {
  const lines = text.split(/\r?\n/);
  const result: string[] = [];
  let blankCount = 0;

  for (const line of lines) {
    if (line.trim() === '') {
      blankCount++;
      if (blankCount <= maxBlankLines) {
        result.push('');
      }
    } else {
      blankCount = 0;
      result.push(line.replace(/[ \t]+$/g, ''));
    }
  }

  return result.join('\n').trim();
}

function renameBeginnerVariables(code: string): string {
  const declMatches = [...code.matchAll(/\b(?:let|const|var)\s+([a-zA-Z_][a-zA-Z0-9_]*)\b/g)];
  const candidates: string[] = [];

  for (const match of declMatches) {
    const name = match[1];
    if (!RESERVED_WORDS.has(name) && name.length > 2 && !candidates.includes(name)) {
      candidates.push(name);
    }
  }

  let updated = code;
  let idx = 0;

  for (const original of candidates.slice(0, 6)) {
    const replacement = SHORT_NAMES[idx] ?? `v${idx}`;
    idx++;
    const escaped = original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'g');
    updated = updated.replace(regex, replacement);
  }

  return updated;
}

export function humanizeCode(input: string, options: HumanizeOptions): string {
  let output = input;

  const lines = output.split(/\r?\n/);
  const filteredLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    const isComment = trimmed.startsWith('//') || trimmed.startsWith('#') || trimmed.startsWith('/*') || trimmed.startsWith('*');

    if (isComment && options.removeAiComments && isAiLikeComment(line)) {
      if (options.style === 'beginner' || options.intensity === 'heavy') {
        continue;
      }
      if (options.intensity === 'subtle') {
        continue;
      }
    }

    if (options.style === 'pragmatic' && trimmed.startsWith('//')) {
      const lower = trimmed.toLowerCase();
      if (lower.includes('todo') || lower.includes('placeholder') || lower.includes('example')) {
        continue;
      }
    }

    filteredLines.push(line);
  }

  output = filteredLines.join('\n');

  if (options.intensity === 'balanced' || options.intensity === 'heavy') {
    output = output.replace(/;\s*$/gm, (match, offset, full) => {
      const before = full.slice(Math.max(0, offset - 30), offset);
      if (before.includes('for (')) {
        return match;
      }
      return options.style === 'beginner' && options.intensity === 'heavy' ? '' : ';';
    });
  }

  if (options.style === 'beginner' && options.shortVariablesInBeginnerMode) {
    output = renameBeginnerVariables(output);
  }

  const maxBlanks = options.intensity === 'heavy' ? 1 : 1;
  output = collapseExcessBlankLines(output, maxBlanks);

  return output;
}
