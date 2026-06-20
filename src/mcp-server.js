#!/usr/bin/env node
'use strict';

const PROTOCOL_VERSION = '2025-11-25';

const tools = [
  {
    name: 'describe_native_ui',
    description: 'Describe the native Cursor UI integration points in this workspace.',
    inputSchema: {
      type: 'object',
      properties: {},
      additionalProperties: false
    }
  },
  {
    name: 'run_sample_workflow',
    description: 'Run a placeholder workflow that can later call the real app backend.',
    inputSchema: {
      type: 'object',
      properties: {
        task: {
          type: 'string',
          description: 'A short description of the workflow to run.'
        }
      },
      additionalProperties: false
    }
  }
];

let buffer = '';

process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => {
  buffer += chunk;

  let newlineIndex = buffer.indexOf('\n');
  while (newlineIndex !== -1) {
    const line = buffer.slice(0, newlineIndex).trimEnd();
    buffer = buffer.slice(newlineIndex + 1);

    if (line.length > 0) {
      handleLine(line);
    }

    newlineIndex = buffer.indexOf('\n');
  }
});

process.stdin.on('end', () => {
  process.exit(0);
});

function handleLine(line) {
  let message;

  try {
    message = JSON.parse(line);
  } catch (error) {
    sendError(null, -32700, 'Parse error', error.message);
    return;
  }

  if (!message || message.jsonrpc !== '2.0' || typeof message.method !== 'string') {
    if (hasRequestId(message)) {
      sendError(message.id, -32600, 'Invalid Request');
    }
    return;
  }

  Promise.resolve(dispatch(message))
    .then((result) => {
      if (hasRequestId(message)) {
        send({ jsonrpc: '2.0', id: message.id, result });
      }
    })
    .catch((error) => {
      if (hasRequestId(message)) {
        sendError(message.id, error.code || -32603, error.message || 'Internal error', error.data);
      } else {
        process.stderr.write(`MCP notification failed: ${error.message}\n`);
      }
    });
}

async function dispatch(message) {
  switch (message.method) {
    case 'initialize':
      return {
        protocolVersion: PROTOCOL_VERSION,
        capabilities: {
          tools: {}
        },
        serverInfo: {
          name: 'cursor-native-ui',
          version: '0.1.0'
        },
        instructions: 'Use these tools to bridge Cursor Agent with the native UI scaffold.'
      };
    case 'ping':
      return {};
    case 'tools/list':
      return { tools };
    case 'tools/call':
      return callTool(message.params || {});
    default:
      throw Object.assign(new Error(`Method not found: ${message.method}`), { code: -32601 });
  }
}

function callTool(params) {
  switch (params.name) {
    case 'describe_native_ui':
      return {
        content: [
          {
            type: 'text',
            text: [
              'This workspace contains a native Cursor scaffold:',
              '- package.json contributes commands and a sidebar webview.',
              '- src/extension.js hosts the embedded UI inside Cursor.',
              '- media/ contains the replaceable frontend bundle.',
              '- src/mcp-server.js exposes Agent-callable tools over MCP.'
            ].join('\n')
          }
        ]
      };
    case 'run_sample_workflow':
      return {
        content: [
          {
            type: 'text',
            text: `Sample workflow accepted: ${params.arguments?.task || 'no task provided'}`
          }
        ]
      };
    default:
      throw Object.assign(new Error(`Unknown tool: ${params.name}`), { code: -32602 });
  }
}

function hasRequestId(message) {
  return Boolean(message) && Object.prototype.hasOwnProperty.call(message, 'id');
}

function sendError(id, code, message, data) {
  const error = { code, message };

  if (data !== undefined) {
    error.data = data;
  }

  send({ jsonrpc: '2.0', id, error });
}

function send(message) {
  process.stdout.write(`${JSON.stringify(message)}\n`);
}
