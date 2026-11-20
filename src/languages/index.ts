import { createCCppProfile } from './cCpp';
import { pythonProfile } from './python';
import { LanguageProfile, ResolvedLanguage, SupportedLanguage } from './types';
import { createWebProfile } from './web';

export function resolveLanguage(code: string, explicit?: SupportedLanguage): ResolvedLanguage {
  if (explicit && explicit !== 'auto') {
    return explicit;
  }
  if (/^\s*<!DOCTYPE\s+html|<html|<div|<body|<head/im.test(code)) {
    return 'html';
  }
  if (/^\s*def\s+[a-zA-Z_]|^\s*from\s+\S+\s+import\s+|^\s*import\s+[a-zA-Z_]/m.test(code)) {
    return 'python';
  }
  if (/#include\s*<iostream>|std::|cout\s*<<|cin\s*>>/.test(code)) {
    return 'cpp';
  }
  if (/#include\s*<stdio\.h>|printf\s*\(|scanf\s*\(/.test(code)) {
    return 'c';
  }
  if (/:\s*(string|number|boolean|void|any)\b|interface\s+[A-Z]/.test(code)) {
    return 'typescript';
  }
  if (/\bfunction\s+[a-zA-Z_]|=>|\b(?:const|let|var)\s+/.test(code)) {
    return 'javascript';
  }
  if (/\{[\s\S]*?:[^;]+;[\s\S]*?\}/.test(code)) {
    return 'css';
  }
  return 'javascript';
}

export function getLanguageProfile(lang: ResolvedLanguage): LanguageProfile {
  switch (lang) {
    case 'c':
      return createCCppProfile('c');
    case 'cpp':
      return createCCppProfile('cpp');
    case 'python':
      return pythonProfile;
    case 'javascript':
      return createWebProfile('javascript');
    case 'typescript':
      return createWebProfile('typescript');
    case 'html':
      return createWebProfile('html');
    case 'css':
      return createWebProfile('css');
  }
}

export * from './types';
