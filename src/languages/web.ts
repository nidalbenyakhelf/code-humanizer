import { HumanizeOptions, LanguageProfile, ResolvedLanguage } from './types';

const WEB_PROTECTED = new Set([
  'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'default', 'break',
  'continue', 'return', 'function', 'const', 'let', 'var', 'class', 'new',
  'try', 'catch', 'finally', 'throw', 'async', 'await', 'import', 'export',
  'from', 'true', 'false', 'null', 'undefined', 'typeof', 'instanceof',
  'console', 'log', 'warn', 'error', 'document', 'window', 'fetch', 'Promise',
  'Array', 'Object', 'String', 'Number', 'Boolean', 'Math', 'JSON', 'Error',
  'interface', 'type', 'any', 'void', 'string', 'number', 'boolean'
]);

export function createWebProfile(id: 'javascript' | 'typescript' | 'html' | 'css'): LanguageProfile {
  return {
    id: id as ResolvedLanguage,
    protectedWords: WEB_PROTECTED,
    isCommentLine(line: string): boolean {
      const t = line.trim();
      if (id === 'html') {
        return t.startsWith('<!--') || t.endsWith('-->');
      }
      if (id === 'css') {
        return t.startsWith('/*') || t.startsWith('*') || t.endsWith('*/');
      }
      return t.startsWith('//') || t.startsWith('/*') || t.startsWith('*');
    },
    extractVariables(code: string): string[] {
      if (id === 'html' || id === 'css') {
        return [];
      }
      const found: string[] = [];
      for (const m of code.matchAll(/\b(?:let|const|var)\s+([a-zA-Z_][a-zA-Z0-9_]*)\b/g)) {
        const name = m[1];
        if (!WEB_PROTECTED.has(name) && name.length > 2 && !found.includes(name)) {
          found.push(name);
        }
      }
      return found;
    },
    applyStyleTweaks(code: string, options: HumanizeOptions): string {
      if (id === 'html' || id === 'css') {
        return code;
      }
      if (options.style === 'stone-age' && options.intensity === 'heavy') {
        return code.replace(/\bconst\b/g, 'var').replace(/\blet\b/g, 'var');
      }
      return code;
    }
  };
}
