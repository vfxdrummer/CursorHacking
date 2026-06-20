import http from 'node:http';

const API_BASE_URL = process.env.CURSOR_API_BASE_URL || 'https://api.cursor.com';
const PORT = Number.parseInt(process.env.PORT || '8787', 10);

const server = http.createServer(async (request, response) => {
  try {
    if (request.method === 'OPTIONS') {
      sendCors(response, 204);
      return;
    }

    const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`);

    if (request.method === 'GET' && url.pathname === '/health') {
      sendJson(response, 200, { ok: true });
      return;
    }

    await routeRequest(request, response, url);
  } catch (error) {
    sendJson(response, error.status || 500, {
      error: error.message || 'Internal server error'
    });
  }
});

server.listen(PORT, () => {
  process.stderr.write(`Cursor Agent proxy listening on http://localhost:${PORT}\n`);
});

async function routeRequest(request, response, url) {
  const parts = url.pathname.split('/').filter(Boolean);

  if (parts[0] !== 'api') {
    sendJson(response, 404, { error: 'Not found' });
    return;
  }

  if (request.method === 'GET' && parts.length === 2 && parts[1] === 'agents') {
    await forwardJson(response, '/v1/agents');
    return;
  }

  if (request.method === 'POST' && parts.length === 2 && parts[1] === 'agents') {
    const body = await readJson(request);
    await forwardJson(response, '/v1/agents', {
      method: 'POST',
      body: JSON.stringify(buildCreateAgentBody(body))
    });
    return;
  }

  if (parts.length >= 4 && parts[1] === 'agents' && parts[3] === 'runs') {
    await routeRunRequest(request, response, parts);
    return;
  }

  sendJson(response, 404, { error: 'Not found' });
}

async function routeRunRequest(request, response, parts) {
  const agentId = parts[2];

  if (request.method === 'POST' && parts.length === 4) {
    const body = await readJson(request);
    await forwardJson(response, `/v1/agents/${encodeURIComponent(agentId)}/runs`, {
      method: 'POST',
      body: JSON.stringify({
        prompt: { text: requiredString(body.promptText || body.prompt, 'promptText') }
      })
    });
    return;
  }

  if (parts.length >= 5) {
    const runId = parts[4];

    if (request.method === 'GET' && parts.length === 6 && parts[5] === 'stream') {
      await streamRun(response, agentId, runId);
      return;
    }

    if (request.method === 'POST' && parts.length === 6 && parts[5] === 'cancel') {
      await forwardJson(
        response,
        `/v1/agents/${encodeURIComponent(agentId)}/runs/${encodeURIComponent(runId)}/cancel`,
        { method: 'POST' }
      );
      return;
    }
  }

  sendJson(response, 404, { error: 'Not found' });
}

function buildCreateAgentBody(body) {
  const agent = {
    prompt: { text: requiredString(body.promptText || body.prompt, 'promptText') },
    autoCreatePR: body.autoCreatePR !== false
  };

  if (typeof body.name === 'string' && body.name.trim()) {
    agent.name = body.name.trim();
  }

  if (typeof body.mode === 'string' && body.mode.trim()) {
    agent.mode = body.mode.trim();
  }

  if (typeof body.modelId === 'string' && body.modelId.trim()) {
    agent.model = { id: body.modelId.trim() };
  }

  if (typeof body.repositoryUrl === 'string' && body.repositoryUrl.trim()) {
    agent.repos = [
      {
        url: body.repositoryUrl.trim(),
        startingRef: body.startingRef || 'main'
      }
    ];
  }

  return agent;
}

async function forwardJson(response, path, options = {}) {
  const upstreamResponse = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method || 'GET',
    headers: {
      Authorization: cursorAuthHeader(),
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    body: options.body
  });

  const text = await upstreamResponse.text();
  const payload = text ? safeJson(text) : {};

  sendJson(response, upstreamResponse.status, payload);
}

async function streamRun(response, agentId, runId) {
  const upstreamResponse = await fetch(
    `${API_BASE_URL}/v1/agents/${encodeURIComponent(agentId)}/runs/${encodeURIComponent(runId)}/stream`,
    {
      headers: {
        Authorization: cursorAuthHeader(),
        Accept: 'text/event-stream'
      }
    }
  );

  if (!upstreamResponse.ok || !upstreamResponse.body) {
    const text = await upstreamResponse.text();
    sendJson(response, upstreamResponse.status, {
      error: text || `Cursor stream failed with status ${upstreamResponse.status}`
    });
    return;
  }

  sendCors(response, 200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive'
  });

  const reader = upstreamResponse.body.getReader();

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      response.end();
      return;
    }

    response.write(Buffer.from(value));
  }
}

async function readJson(request) {
  let body = '';

  for await (const chunk of request) {
    body += chunk;

    if (body.length > 1024 * 1024) {
      throw httpError(413, 'Request body too large');
    }
  }

  if (!body) {
    return {};
  }

  try {
    return JSON.parse(body);
  } catch {
    throw httpError(400, 'Invalid JSON body');
  }
}

function requiredString(value, name) {
  if (typeof value !== 'string' || !value.trim()) {
    throw httpError(400, `${name} is required`);
  }

  return value.trim();
}

function cursorAuthHeader() {
  const apiKey = process.env.CURSOR_API_KEY;

  if (!apiKey) {
    throw httpError(500, 'CURSOR_API_KEY is not configured on the proxy server');
  }

  return `Basic ${Buffer.from(`${apiKey}:`).toString('base64')}`;
}

function safeJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

function sendJson(response, status, payload) {
  sendCors(response, status, {
    'Content-Type': 'application/json; charset=utf-8'
  });
  response.end(JSON.stringify(payload));
}

function sendCors(response, status, headers = {}) {
  response.writeHead(status, {
    'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    ...headers
  });
}

function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}
