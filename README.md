# CursorHacking

A tiny iOS SwiftUI shell for drafting code on-device and sending a prompt to Cursor.

## What it does

- Edit source in a monospaced in-app text editor.
- Write an instruction for Cursor.
- Include or omit the code block from the outgoing prompt.
- Open a Cursor prompt deeplink:
  `cursor://anysphere.cursor-deeplink/prompt?text=...`
- Fall back to a `https://cursor.com/link/prompt?...` web link when the Cursor app
  URL scheme is not available on the device.

## Run

Open `CursorHacking.xcodeproj` in Xcode and run the `CursorHacking` target on an
iPhone or iPad simulator/device.
