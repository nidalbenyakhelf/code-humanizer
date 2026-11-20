import { HumanizeOptions, LanguageProfile, ResolvedLanguage } from './types';

const C_CPP_PROTECTED = new Set([
  'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'default', 'break',
  'continue', 'return', 'class', 'struct', 'enum', 'union', 'public', 'private',
  'protected', 'static', 'const', 'size_t', 'auto', 'int', 'float', 'double',
  'char', 'bool', 'void', 'long', 'short', 'unsigned', 'signed', 'typename',
  'template', 'namespace', 'using', 'nullptr', 'true', 'false', 'new', 'delete',
  'try', 'catch', 'throw', 'std', 'cout', 'cin', 'cerr', 'endl', 'vector',
  'string', 'map', 'set', 'array', 'printf', 'scanf', 'malloc', 'free',
  'main', 'include', 'iostream', 'stdio', 'numeric', 'static_cast'
]);

export function createCCppProfile(id: 'c' | 'cpp'): LanguageProfile {
  return {
    id: id as ResolvedLanguage,
    protectedWords: C_CPP_PROTECTED,
    isCommentLine(line: string): boolean {
      const t = line.trim();
      return t.startsWith('//') || t.startsWith('/*') || t.startsWith('*') || t.endsWith('*/');
    },
    extractVariables(code: string): string[] {
      const found: string[] = [];
      const regex = /\b(?:int|double|float|long|short|char|bool|size_t|auto|std::string)\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*(?:=|;|\(|\[)/g;
      for (const m of code.matchAll(regex)) {
        const name = m[1];
        if (!C_CPP_PROTECTED.has(name) && name.length > 2 && !found.includes(name)) {
          found.push(name);
        }
      }
      return found;
    },
    applyStyleTweaks(code: string, options: HumanizeOptions): string {
      let out = code;
      if (options.simplifyOutput && (options.style === 'pragmatic' || options.style === 'stone-age')) {
        out = out.replace(/\s*<<\s*std::endl/g, ' << "\\n"');
      }
      if (options.style === 'stone-age' && options.intensity === 'heavy') {
        out = out.replace(/\bstatic_cast<double>\(([^)]+)\)/g, '(double)($1)');
      }
      return out;
    }
  };
}
