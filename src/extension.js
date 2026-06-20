const vscode = require('vscode');

const EXTENSION_ID = 'cursorNativeUI';

function activate(context) {
  const provider = new NativeUiViewProvider(context.extensionUri);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(NativeUiViewProvider.viewType, provider),
    vscode.commands.registerCommand(`${EXTENSION_ID}.open`, () => {
      NativeUiPanel.createOrShow(context.extensionUri);
    }),
    vscode.commands.registerCommand(`${EXTENSION_ID}.runSampleWorkflow`, () => {
      vscode.window.showInformationMessage('Sample workflow dispatched from Cursor Native UI.');
    })
  );
}

function deactivate() {}

class NativeUiViewProvider {
  static viewType = `${EXTENSION_ID}.sidebar`;

  constructor(extensionUri) {
    this.extensionUri = extensionUri;
  }

  resolveWebviewView(webviewView) {
    webviewView.webview.options = getWebviewOptions(this.extensionUri);
    webviewView.webview.html = getWebviewHtml(webviewView.webview, this.extensionUri, 'sidebar');

    webviewView.webview.onDidReceiveMessage((message) => {
      handleWebviewMessage(message);
    });
  }
}

class NativeUiPanel {
  static currentPanel = undefined;
  static viewType = `${EXTENSION_ID}.panel`;

  static createOrShow(extensionUri) {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    if (NativeUiPanel.currentPanel) {
      NativeUiPanel.currentPanel.panel.reveal(column);
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      NativeUiPanel.viewType,
      'Cursor Native UI',
      column || vscode.ViewColumn.One,
      getWebviewOptions(extensionUri)
    );

    NativeUiPanel.currentPanel = new NativeUiPanel(panel, extensionUri);
  }

  constructor(panel, extensionUri) {
    this.panel = panel;
    this.extensionUri = extensionUri;

    this.panel.webview.html = getWebviewHtml(this.panel.webview, this.extensionUri, 'panel');

    this.panel.onDidDispose(() => this.dispose(), null);
    this.panel.webview.onDidReceiveMessage((message) => {
      handleWebviewMessage(message);
    });
  }

  dispose() {
    NativeUiPanel.currentPanel = undefined;
    this.panel.dispose();
  }
}

function getWebviewOptions(extensionUri) {
  return {
    enableScripts: true,
    localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'media')]
  };
}

async function handleWebviewMessage(message) {
  switch (message.type) {
    case 'openReadme':
      await openReadme();
      return;
    case 'runWorkflow':
      await vscode.commands.executeCommand(`${EXTENSION_ID}.runSampleWorkflow`);
      return;
    case 'showInfo':
      vscode.window.showInformationMessage(message.text || 'Hello from Cursor Native UI.');
      return;
    default:
      vscode.window.showWarningMessage(`Unknown Cursor Native UI message: ${message.type}`);
  }
}

async function openReadme() {
  const matches = await vscode.workspace.findFiles('README.md', '**/node_modules/**', 1);

  if (matches.length === 0) {
    vscode.window.showWarningMessage('No README.md found in the current workspace.');
    return;
  }

  const document = await vscode.workspace.openTextDocument(matches[0]);
  await vscode.window.showTextDocument(document);
}

function getWebviewHtml(webview, extensionUri, surface) {
  const nonce = getNonce();
  const stylesUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'media', 'main.css'));
  const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'media', 'main.js'));
  const workspaceName = vscode.workspace.name || 'No workspace';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource} https: data:; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="${stylesUri}" rel="stylesheet">
  <title>Cursor Native UI</title>
</head>
<body data-surface="${escapeHtml(surface)}">
  <main class="shell">
    <section class="hero">
      <p class="eyebrow">Native Cursor surface</p>
      <h1>Cursor Native UI</h1>
      <p>
        This webview is running inside Cursor's extension host. Replace this static UI with
        your app bundle, then bridge editor actions through VS Code APIs and Agent actions
        through MCP tools.
      </p>
    </section>

    <section class="card">
      <h2>Workspace</h2>
      <dl>
        <div>
          <dt>Name</dt>
          <dd>${escapeHtml(workspaceName)}</dd>
        </div>
        <div>
          <dt>Surface</dt>
          <dd>${escapeHtml(surface)}</dd>
        </div>
      </dl>
    </section>

    <section class="card">
      <h2>Native hooks</h2>
      <button data-command="openReadme">Open README</button>
      <button data-command="runWorkflow">Run sample workflow</button>
      <button data-command="showInfo">Show Cursor notification</button>
    </section>

    <section class="card">
      <h2>Agent bridge</h2>
      <p>
        The MCP server in <code>src/mcp-server.js</code> exposes app actions to Cursor Agent.
        Start with the checked-in <code>.cursor/mcp.json</code>, then swap the sample tools
        for real API calls.
      </p>
    </section>
  </main>

  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function getNonce() {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let text = '';

  for (let i = 0; i < 32; i += 1) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }

  return text;
}

module.exports = {
  activate,
  deactivate
};
