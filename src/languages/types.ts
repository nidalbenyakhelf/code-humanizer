export type HumanizeIntensity = 'subtle' | 'balanced' | 'heavy';
export type AuthorStyle = 'clean-standard' | 'pragmatic' | 'beginner' | 'stone-age';

export type SupportedLanguage =
  | 'auto'
  | 'c'
  | 'cpp'
  | 'python'
  | 'javascript'
  | 'typescript'
  | 'html'
  | 'css';

export type ResolvedLanguage = Exclude<SupportedLanguage, 'auto'>;

export interface HumanizeOptions {
  intensity: HumanizeIntensity;
  style: AuthorStyle;
  removeAiComments: boolean;
  stripAllComments: boolean;
  shortVariablesInBeginnerMode: boolean;
  simplifyOutput: boolean;
  language?: SupportedLanguage;
}

export interface LanguageProfile {
  id: ResolvedLanguage;
  protectedWords: Set<string>;
  isCommentLine: (line: string) => boolean;
  extractVariables: (code: string) => string[];
  applyStyleTweaks: (code: string, options: HumanizeOptions) => string;
}
