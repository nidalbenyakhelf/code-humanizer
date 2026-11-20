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

async function applyToSelection(editor: vscode.TextEditor, override?: Partial<HumanizeOptions>): Promise<void> {
  const selection = editor.selection;
  if (selection.isEmpty) {
    vscode.window.showInformationMessage('Select a block of code first, or open Live Preview.');
    return;
  }

  const originalText = editor.document.getText(selection);
  const options: HumanizeOptions = {
    ...getCurrentOptions(),
    ...override
  };
  const humanizedText = humanizeCode(originalText, options);

  await editor.edit((editBuilder) => {
    editBuilder.replace(selection, humanizedText);
  });
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
      await applyToSelection(editor);
    }
  );

  const quickStoneAgeCmd = vscode.commands.registerCommand(
    'codeHumanizer.applyStoneAgeSelection',
    async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showWarningMessage('Open a file and select code to humanize.');
        return;
      }
      await applyToSelection(editor, {
        style: 'stone-age',
        intensity: 'heavy',
        removeAiComments: true,
        shortVariablesInBeginnerMode: true
      });
    }
  );

  const switchStyleCmd = vscode.commands.registerCommand(
    'codeHumanizer.switchStyle',
    async () => {
      const picked = await vscode.window.showQuickPick(
        [
          { label: 'clean-standard', description: 'Clean and natural code' },
          { label: 'pragmatic', description: 'Fast and direct code' },
          { label: 'beginner', description: 'Beginner style with short variables' },
          { label: 'stone-age', description: 'Raw primitive stone-age style' }
        ],
        { placeHolder: 'Choose Code Humanizer author style' }
      );
      if (!picked) {
        return;
      }
      await vscode.workspace
        .getConfiguration('codeHumanizer')
        .update('style', picked.label, vscode.ConfigurationTarget.Global);
      vscode.window.showInformationMessage(`Code Humanizer style set to: ${picked.label}`);
    }
  );

  const switchIntensityCmd = vscode.commands.registerCommand(
    'codeHumanizer.switchIntensity',
    async () => {
      const picked = await vscode.window.showQuickPick(
        [
          { label: 'subtle', description: 'Light touch' },
          { label: 'balanced', description: 'Balanced humanization' },
          { label: 'heavy', description: 'Strong stylistic shifts' }
        ],
        { placeHolder: 'Choose Code Humanizer intensity' }
      );
      if (!picked) {
        return;
      }
      await vscode.workspace
        .getConfiguration('codeHumanizer')
        .update('intensity', picked.label, vscode.ConfigurationTarget.Global);
      vscode.window.showInformationMessage(`Code Humanizer intensity set to: ${picked.label}`);
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

  context.subscriptions.push(
    humanizeSelectionCmd,
    quickStoneAgeCmd,
    switchStyleCmd,
    switchIntensityCmd,
    openPreviewCmd
  );
}

export function deactivate(): void {}
