import * as vscode from 'vscode';
import { AuthorStyle, HumanizeIntensity, humanizeCode } from './humanizer';

const SAMPLE_AI_CODE = `// Helper function to calculate total price with discount
function calculateTotalPrice(itemPrices, discountRate) {
  // Initialize subtotal variable
  let subtotalAmount = 0;

  // Loop through all item prices
  for (let index = 0; index < itemPrices.length; index++) {
    subtotalAmount += itemPrices[index];
  }

  // Apply discount if valid
  let finalAmount = subtotalAmount - (subtotalAmount * discountRate);
  return finalAmount;
}`;

export class PreviewPanel {
  public static currentPanel: PreviewPanel | undefined;
  private readonly panel: vscode.WebviewPanel;
  private disposables: vscode.Disposable[] = [];

  public static createOrShow(extensionUri: vscode.Uri, initialCode?: string): void {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    if (PreviewPanel.currentPanel) {
      PreviewPanel.currentPanel.panel.reveal(column);
      if (initialCode) {
        PreviewPanel.currentPanel.updateSourceCode(initialCode);
      }
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      'codeHumanizerPreview',
      'Code Humanizer — Live Preview',
      column || vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true
      }
    );

    PreviewPanel.currentPanel = new PreviewPanel(panel, extensionUri, initialCode);
  }

  private constructor(panel: vscode.WebviewPanel, _extensionUri: vscode.Uri, initialCode?: string) {
    this.panel = panel;
    const startCode = initialCode && initialCode.trim().length > 0 ? initialCode : SAMPLE_AI_CODE;
    this.panel.webview.html = this.getHtml(startCode);

    this.panel.webview.onDidReceiveMessage(
      async (message) => {
        if (message.type === 'render') {
          const humanized = humanizeCode(message.source, {
            intensity: message.intensity as HumanizeIntensity,
            style: message.style as AuthorStyle,
            removeAiComments: Boolean(message.removeAiComments),
            stripAllComments: Boolean(message.stripAllComments),
            shortVariablesInBeginnerMode: Boolean(message.shortVariablesInBeginnerMode),
            simplifyOutput: Boolean(message.simplifyOutput)
          });
          this.panel.webview.postMessage({ type: 'result', code: humanized });
        } else if (message.type === 'applyToEditor') {
          await this.applyCodeToActiveEditor(message.code);
        } else if (message.type === 'loadSelection') {
          const editor = vscode.window.activeTextEditor;
          if (editor && !editor.selection.isEmpty) {
            const selected = editor.document.getText(editor.selection);
            this.panel.webview.postMessage({ type: 'setSource', code: selected });
          } else {
            vscode.window.showInformationMessage('Select some code in the active editor first.');
          }
        }
      },
      null,
      this.disposables
    );

    this.panel.onDidDispose(() => this.dispose(), null, this.disposables);
  }

  public updateSourceCode(code: string): void {
    this.panel.webview.postMessage({ type: 'setSource', code });
  }

  private async applyCodeToActiveEditor(code: string): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showWarningMessage('No active text editor found.');
      return;
    }

    await editor.edit((editBuilder) => {
      if (!editor.selection.isEmpty) {
        editBuilder.replace(editor.selection, code);
      } else {
        const fullRange = new vscode.Range(
          editor.document.positionAt(0),
          editor.document.positionAt(editor.document.getText().length)
        );
        editBuilder.replace(fullRange, code);
      }
    });

    vscode.window.showInformationMessage('Humanized code applied to editor.');
  }

  private getHtml(initialSource: string): string {
    const escapedSource = initialSource
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Code Humanizer Preview</title>
  <style>
    body {
      font-family: var(--vscode-font-family, sans-serif);
      color: var(--vscode-foreground);
      background: var(--vscode-editor-background);
      margin: 0;
      padding: 16px;
    }
    .controls {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      align-items: center;
      margin-bottom: 14px;
      padding: 12px;
      border: 1px solid var(--vscode-panel-border);
      border-radius: 6px;
    }
    label {
      display: flex;
      flex-direction: column;
      gap: 4px;
      font-size: 12px;
    }
    .checkbox-label {
      flex-direction: row;
      align-items: center;
      margin-top: 14px;
    }
    select, button {
      background: var(--vscode-dropdown-background, var(--vscode-button-secondaryBackground));
      color: var(--vscode-dropdown-foreground, var(--vscode-button-secondaryForeground));
      border: 1px solid var(--vscode-dropdown-border, var(--vscode-panel-border));
      padding: 6px 10px;
      border-radius: 4px;
      font-family: inherit;
    }
    button.primary {
      background: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
      border: none;
      cursor: pointer;
      font-weight: 600;
    }
    button {
      cursor: pointer;
    }
    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
    }
    textarea {
      width: 100%;
      height: 340px;
      box-sizing: border-box;
      resize: vertical;
      font-family: var(--vscode-editor-font-family, monospace);
      font-size: var(--vscode-editor-font-size, 13px);
      background: var(--vscode-input-background);
      color: var(--vscode-input-foreground);
      border: 1px solid var(--vscode-input-border, var(--vscode-panel-border));
      border-radius: 6px;
      padding: 10px;
    }
    .pane-title {
      font-size: 12px;
      font-weight: 600;
      margin-bottom: 6px;
      opacity: 0.85;
    }
    .actions {
      display: flex;
      gap: 8px;
      margin-top: 12px;
    }
    @media (max-width: 780px) {
      .grid {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body>
  <div class="controls">
    <label>
      Intensity
      <select id="intensity">
        <option value="subtle">Subtle (A bit human)</option>
        <option value="balanced" selected>Balanced</option>
        <option value="heavy">Heavy (Very human)</option>
      </select>
    </label>

    <label>
      Author Style
      <select id="style">
        <option value="clean-standard" selected>Clean Standard</option>
        <option value="pragmatic">Pragmatic / Fast</option>
        <option value="beginner">Beginner (Short vars)</option>
        <option value="stone-age">Stone Age (Raw primitive)</option>
      </select>
    </label>

    <label class="checkbox-label">
      <input type="checkbox" id="removeAiComments" checked />
      Remove AI-like comments
    </label>

    <label class="checkbox-label">
      <input type="checkbox" id="stripAllComments" />
      Strip all comments (Stone Age)
    </label>

    <label class="checkbox-label">
      <input type="checkbox" id="shortVars" checked />
      Short vars in beginner mode
    </label>

    <label class="checkbox-label">
      <input type="checkbox" id="simplifyOutput" checked />
      Simplify output
    </label>
  </div>

  <div class="grid">
    <div>
      <div class="pane-title">Input (AI-generated / Source)</div>
      <textarea id="source">${escapedSource}</textarea>
    </div>
    <div>
      <div class="pane-title">Live Humanized Output</div>
      <textarea id="output" readonly></textarea>
    </div>
  </div>

  <div class="actions">
    <button type="button" id="loadSelection">Load Active Selection</button>
    <button type="button" class="primary" id="applyToEditor">Apply Output to Editor</button>
  </div>

  <script>
    const vscode = acquireVsCodeApi();
    const intensityEl = document.getElementById('intensity');
    const styleEl = document.getElementById('style');
    const removeCommentsEl = document.getElementById('removeAiComments');
    const stripAllCommentsEl = document.getElementById('stripAllComments');
    const shortVarsEl = document.getElementById('shortVars');
    const simplifyOutputEl = document.getElementById('simplifyOutput');
    const sourceEl = document.getElementById('source');
    const outputEl = document.getElementById('output');

    function triggerRender() {
      vscode.postMessage({
        type: 'render',
        source: sourceEl.value,
        intensity: intensityEl.value,
        style: styleEl.value,
        removeAiComments: removeCommentsEl.checked,
        stripAllComments: stripAllCommentsEl.checked,
        shortVariablesInBeginnerMode: shortVarsEl.checked,
        simplifyOutput: simplifyOutputEl.checked
      });
    }

    [intensityEl, styleEl, removeCommentsEl, stripAllCommentsEl, shortVarsEl, simplifyOutputEl, sourceEl].forEach((el) => {
      el.addEventListener('input', triggerRender);
      el.addEventListener('change', triggerRender);
    });

    document.getElementById('loadSelection').addEventListener('click', () => {
      vscode.postMessage({ type: 'loadSelection' });
    });

    document.getElementById('applyToEditor').addEventListener('click', () => {
      vscode.postMessage({ type: 'applyToEditor', code: outputEl.value });
    });

    window.addEventListener('message', (event) => {
      const msg = event.data;
      if (msg.type === 'result') {
        outputEl.value = msg.code;
      } else if (msg.type === 'setSource') {
        sourceEl.value = msg.code;
        triggerRender();
      }
    });

    triggerRender();
  </script>
</body>
</html>`;
  }

  public dispose(): void {
    PreviewPanel.currentPanel = undefined;
    while (this.disposables.length) {
      const item = this.disposables.pop();
      if (item) {
        item.dispose();
      }
    }
  }
}
