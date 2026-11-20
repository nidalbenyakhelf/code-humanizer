import {
  AuthorStyle,
  getLanguageProfile,
  HumanizeIntensity,
  HumanizeOptions,
  LanguageProfile,
  resolveLanguage
} from './languages';

export { AuthorStyle, HumanizeIntensity, HumanizeOptions };

const AI_COMMENT_PATTERNS = [
  /^\s*(\/\/|#|\/\*|\*|<!--)\s*(helper function|this function|this code|the following|check if|return zero|return the|initialize|iterate through|loop through|calculate|invoke|output|indicate|step \d+|note:|todo:|placeholder|example)/i,
  /^\s*\/\*\*?\s*(this|helper|function|method|returns|creates|handles)\b/i
];

const SHORT_NAMES = ['a', 'b', 'c', 'x', 'y', 'z', 'n', 'm', 'res', 'tmp'];

function isAiLikeComment(line: string): boolean {
  return AI_COMMENT_PATTERNS.some((p) => p.test(line));
}

function collapseExcessBlankLines(text: string): string {
  const lines = text.split(/\r?\n/);
  const result: string[] = [];
  let blankCount = 0;

  for (const line of lines) {
    if (line.trim() === '') {
      blankCount++;
      if (blankCount <= 1) {
        result.push('');
      }
    } else {
      blankCount = 0;
      result.push(line.replace(/[ \t]+$/g, ''));
    }
  }

  return result.join('\n').trim();
}

function renameVariables(code: string, profile: LanguageProfile, limit: number): string {
  const candidates = profile.extractVariables(code);
  let updated = code;
  let idx = 0;

  for (const original of candidates.slice(0, limit)) {
    const replacement = SHORT_NAMES[idx] ?? `v${idx}`;
    idx++;
    const escaped = original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'g');
    updated = updated.replace(regex, replacement);
  }

  return updated;
}

export function humanizeCode(input: string, options: HumanizeOptions): string {
  const lang = resolveLanguage(input, options.language);
  const profile = getLanguageProfile(lang);
  const lines = input.split(/\r?\n/);
  const filteredLines: string[] = [];

  for (const line of lines) {
    if (profile.isCommentLine(line)) {
      if (options.stripAllComments && options.style === 'stone-age') {
        continue;
      }
      if (options.removeAiComments && isAiLikeComment(line)) {
        continue;
      }
    }
    filteredLines.push(line);
  }

  let output = filteredLines.join('\n');

  const shouldShortenVars =
    (options.style === 'beginner' && options.shortVariablesInBeginnerMode) ||
    options.style === 'stone-age';

  if (shouldShortenVars) {
    const limit = options.style === 'stone-age' ? 12 : 8;
    output = renameVariables(output, profile, limit);
  }

  output = profile.applyStyleTweaks(output, options);
  output = collapseExcessBlankLines(output);

  return output;
}
