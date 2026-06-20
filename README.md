# Cursor iOS Companion Scaffold

This repo explores a native iOS app experience for Cursor.

## Key constraint

A native iOS app cannot embed or run Cursor Desktop internally. Cursor Desktop is
a desktop IDE, not an iOS framework or embeddable runtime.

The practical architecture is a native iOS companion app that controls Cursor
Cloud Agents through a backend proxy:

```text
iOS app -> backend proxy -> Cursor Cloud Agents API -> cloud VM/repo/PR
```

## What is included

```text
ios/CursorMobile/              SwiftUI native iOS starter
server/cursor-agent-proxy.mjs  Dependency-free Cursor API proxy
docs/ios-native-cursor-architecture.md
package.json                   Proxy scripts
```

## Run the proxy

The proxy keeps your Cursor API key off the phone.

```bash
export CURSOR_API_KEY=your_cursor_api_key
npm start
```

Health check:

```bash
curl http://localhost:8787/health
```

Create an agent:

```bash
curl --request POST http://localhost:8787/api/agents \
  --header 'Content-Type: application/json' \
  --data '{
    "promptText": "Update the README and open a PR",
    "repositoryUrl": "https://github.com/your-org/your-repo",
    "startingRef": "main",
    "autoCreatePR": true
  }'
```

## Run the iOS app

The SwiftUI starter lives in `ios/CursorMobile/`.

To turn it into a runnable Xcode app:

1. Create a new iOS App project in Xcode.
2. Add these Swift files to the app target:
   - `CursorMobileApp.swift`
   - `ContentView.swift`
   - `CursorAgentService.swift`
3. Point `CursorAgentService(baseURL:)` at your reachable proxy URL.
   - iOS simulator can usually use `http://localhost:8787`.
   - A physical device needs your Mac/server LAN URL or a deployed HTTPS proxy.

## Verification

```bash
npm run lint
```

## Next product steps

See `docs/ios-native-cursor-architecture.md` for details. Production work should
add:

- Backend authentication.
- Repository authorization.
- Persistent agent/run storage.
- Push notifications.
- PR/diff review UI.
- Deployed HTTPS proxy infrastructure.
