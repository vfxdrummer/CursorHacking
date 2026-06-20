# CursorHacking

CursorHacking is now a native iOS app built with SwiftUI.

## Requirements

- macOS with Xcode 15.4 or newer
- iOS 17.0 simulator or device

## Run the app

1. Open `CursorHacking.xcodeproj` in Xcode.
2. Select the `CursorHacking` scheme.
3. Choose an iPhone simulator.
4. Press **Run**.

You can also build from a macOS terminal with Xcode installed:

```sh
xcodebuild \
  -project CursorHacking.xcodeproj \
  -scheme CursorHacking \
  -destination 'platform=iOS Simulator,name=iPhone 15' \
  build
```

## Project layout

- `CursorHacking/CursorHackingApp.swift` - SwiftUI app entrypoint.
- `CursorHacking/ContentView.swift` - starter home screen.
- `CursorHacking/Assets.xcassets` - app icon and accent color assets.
