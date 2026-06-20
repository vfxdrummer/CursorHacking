# Native iOS Cursor Architecture

## Important constraint

A native iOS app cannot embed or run Cursor Desktop internally.

Cursor Desktop is distributed for macOS, Windows, and Linux. It is not packaged
as an iOS framework, and iOS app sandboxing does not allow bundling and running
an Electron desktop IDE, arbitrary developer tools, shells, Git workflows, or
long-lived background agent processes as if they were a desktop workstation.

The practical native iOS design is therefore:

```text
iOS app -> your backend/proxy -> Cursor Cloud Agents API -> cloud VM/repo/PR
```

That gives users a native mobile experience while Cursor work runs in the
supported Cursor cloud runtime.

## Repo scaffold

```text
CursorHacking.xcodeproj        Root Xcode project with shared schemes
ios/CursorMobile/              SwiftUI native iOS app source
server/cursor-agent-proxy.mjs  Minimal server-side Cursor API proxy
docs/                          Architecture notes
```

## Schemes

This scaffold includes both iOS/Xcode meanings of "scheme":

- **Root Xcode project:** `CursorHacking.xcodeproj`
- **Xcode build/run schemes:** `CursorHacking` and `CursorMobile`
- **iOS URL scheme:** `cursormobile://`, registered in `ios/CursorMobile/Info.plist`

The URL scheme can prefill app state:

```text
cursormobile://agent?repo=https%3A%2F%2Fgithub.com%2Fyour-org%2Fyour-repo&ref=main&prompt=Update%20the%20README
```

## Why the proxy exists

Do not put `CURSOR_API_KEY` in the iOS app. Mobile binaries can be inspected,
and app traffic can be observed on jailbroken or instrumented devices.

The proxy keeps Cursor credentials server-side and exposes a smaller product API
to the native app:

- `POST /api/agents`
- `POST /api/agents/:agentId/runs`
- `GET /api/agents/:agentId/runs/:runId/stream`
- `POST /api/agents/:agentId/runs/:runId/cancel`

## Cursor API primitives used

The proxy forwards to Cursor Cloud Agents API v1:

- `POST /v1/agents` creates a durable cloud agent and initial run.
- `POST /v1/agents/{agentId}/runs` sends follow-up prompts.
- `GET /v1/agents/{agentId}/runs/{runId}/stream` streams run events over SSE.
- `POST /v1/agents/{agentId}/runs/{runId}/cancel` cancels a run.

## Native iOS app responsibilities

The SwiftUI starter does the mobile-facing work:

- Collects repository, branch/ref, and prompt.
- Calls the proxy to create a Cursor Cloud Agent.
- Streams run events using `URLSession.bytes(for:)`.
- Displays status, assistant text, thinking text, tool-call events, and results.

For a production app, add:

- Authentication to your backend.
- User/team authorization around repositories.
- Server-side persistence for agents, runs, and PR links.
- Push notifications for completed runs.
- Secure environment/project selection.
- A richer diff/PR review UI.

## What this does not do

This does not run Cursor Desktop inside iOS. It is a native mobile control plane
for Cursor Cloud Agents.
