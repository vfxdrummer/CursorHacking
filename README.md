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
CursorHacking.xcodeproj        Root Xcode project with shared schemes
ios/CursorMobile/              SwiftUI native iOS app source
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

The iOS app opens from the root Xcode project:

1. Open `CursorHacking.xcodeproj` in Xcode.
2. Select the shared **CursorHacking** or **CursorMobile** scheme.
3. Run it on an iOS simulator or device.
4. Point `CursorAgentService(baseURL:)` at your reachable proxy URL.
   - iOS simulator can usually use `http://localhost:8787`.
   - A physical device needs your Mac/server LAN URL or a deployed HTTPS proxy.

## iOS URL scheme

The app registers the custom URL scheme in `ios/CursorMobile/Info.plist`:

```text
cursormobile://
```

Example deep link:

```text
cursormobile://agent?repo=https%3A%2F%2Fgithub.com%2Fyour-org%2Fyour-repo&ref=main&prompt=Update%20the%20README&autoStart=false
```

Supported query parameters:

- `repo` sets the repository URL field.
- `ref` sets the starting branch/ref field.
- `prompt` sets the prompt field.
- `autoStart=true` immediately starts the Cursor Cloud Agent through the proxy.

On a booted simulator, you can test it with:

```bash
xcrun simctl openurl booted 'cursormobile://agent?prompt=Update%20the%20README'
```

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
