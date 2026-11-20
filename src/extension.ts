import * as vscode from 'vscode';
import { AuthorStyle, HumanizeIntensity, HumanizeOptions, humanizeCode } from './humanizer';
import { PreviewPanel } from './previewPanel';

function getCurrentOptions(): HumanizeOptions {
  const config = vscode.workspace.getConfiguration('codeHumanizer');
  return {
    intensity: config.get<HumanizeIntensity>('intensity', 'balanced'),
    style: config.get<AuthorStyle>('style', 'clean-standard'),
    removeAiComments: config.get<boolean>('removeAiComments', true),
    stripAllComments: config.get<boolean>('stripAllComments', false),
    shortVariablesInBeginnerMode: config.get<boolean>('shortVariablesInBeginnerMode', true),
    simplifyOutput: config.get<boolean>('simplifyOutput', true)
  };
}

export function activate(context: vscode.ExtensionContext): void {
  const humanizeSelectionCmd = vscode.commands.registerCommand(
    'codeHumanizer.humanizeSelection',
    async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showWarningMessage('Open a file and select code to humanize.');
        return;
      }

      const selection = editor.selection;
      if (selection.isEmpty) {
        vscode.window.showInformationMessage('Select a block of code first, or open Live Preview.');
        return;
      }

      const originalText = editor.document.getText(selection);
      const humanizedText = humanizeCode(originalText, getCurrentOptions());

      await editor.edit((editBuilder) => {
        editBuilder.replace(selection, humanizedText);
      });
    }
  );

  const openPreviewCmd = vscode.commands.registerCommand(
    'codeHumanizer.openLivePreview',
    () => {
      const editor = vscode.window.activeTextEditor;
      const selected = editor && !editor.selection.isEmpty
        ? editor.document.getText(editor.selection)
        : undefined;
      PreviewPanel.createOrShow(context.extensionUri, selected);
    }
  );

  context.subscriptions.push(humanizeSelectionCmd, openPreviewCmd);
}

export function deactivate(): void {}
