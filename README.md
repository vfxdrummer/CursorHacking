# Cursor Native UI Scaffold

This repo is a starter scaffold for plugging a UI directly into Cursor with native
surfaces:

- A VS Code-compatible extension that renders a sidebar/webview inside Cursor.
- A Cursor URI/deep-link handler for opening the native panel from another app.
- A project-level MCP server that exposes Agent-callable tools.
- Launch and configuration files for local extension development.

## What is included

```text
package.json          Extension manifest and npm scripts
src/extension.js      Cursor/VS Code extension entry point
src/mcp-server.js     Dependency-free MCP stdio server
media/                Replaceable webview frontend assets
.cursor/mcp.json      Project MCP registration for Cursor
.vscode/launch.json   Extension host launch profile
```

## Try the native UI

1. Open this workspace in Cursor.
2. Run `npm run lint` to syntax-check the scaffold.
3. Open the Run and Debug panel.
4. Start **Run Cursor Native UI Extension**.
5. In the extension development window, open the **Cursor UI** activity bar item
   or run **Cursor Native UI: Open Panel** from the command palette.

The UI in `media/` is intentionally static. Replace it with your actual app
bundle and keep the `vscode.postMessage(...)` bridge for editor actions.

## Try the scheme/deep link

The extension registers a URI handler through VS Code's `onUri` activation:

```text
cursor://cursorhacking.cursor-native-ui/open?action=runWorkflow
```

Use that shape from an external app to reopen the native panel and optionally
dispatch a supported action.

Supported routes/actions:

- `cursor://cursorhacking.cursor-native-ui/open`
- `cursor://cursorhacking.cursor-native-ui/open?action=openReadme`
- `cursor://cursorhacking.cursor-native-ui/open?action=runWorkflow`

The URL scheme is Cursor's product scheme (`cursor://`). The URI authority is
the extension identifier (`publisher.name`), defined by `publisher` and `name`
in `package.json`.

## Try the MCP bridge

Cursor reads the project MCP config from `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "cursor-native-ui": {
      "type": "stdio",
      "command": "node",
      "args": ["${workspaceFolder}/src/mcp-server.js"]
    }
  }
}
```

After Cursor loads the MCP server, Agent can call:

- `describe_native_ui`
- `run_sample_workflow`

Replace those tools in `src/mcp-server.js` with calls into your app API or
local workspace workflows.

## Recommended integration shape

Use both surfaces together:

1. **Extension webview** for the embedded, native Cursor UI.
2. **MCP server** for actions and data that Cursor Agent can call.
3. Optional **Cursor plugin packaging** later if you want to distribute the
   extension, MCP config, rules, and commands as one installable bundle.
