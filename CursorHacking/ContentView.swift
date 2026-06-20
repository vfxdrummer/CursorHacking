import SwiftUI
import UIKit

struct ContentView: View {
    @Environment(\.openURL) private var openURL

    @State private var sourceCode = SampleCode.defaultText
    @State private var prompt = "Review this code and suggest a cleaner implementation."
    @State private var fileName = "ContentView.swift"
    @State private var includeCode = true
    @State private var statusMessage: String?
    @State private var fallbackLink: FallbackLink?

    private var cursorPrompt: CursorPrompt {
        CursorPrompt(
            instruction: prompt,
            code: sourceCode,
            fileName: fileName,
            includeCode: includeCode
        )
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    header
                    codeEditor
                    promptComposer
                    actions

                    if let statusMessage {
                        Text(statusMessage)
                            .font(.footnote)
                            .foregroundStyle(.secondary)
                            .frame(maxWidth: .infinity, alignment: .leading)
                    }
                }
                .padding()
            }
            .background(Color(.systemGroupedBackground))
            .navigationTitle("Cursor Hacking")
            .sheet(item: $fallbackLink) { link in
                FallbackSheet(url: link.url) {
                    UIPasteboard.general.string = link.url.absoluteString
                    statusMessage = "Cursor web link copied."
                }
            }
        }
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Edit code and prompt Cursor")
                .font(.title2.bold())

            Text("Draft code in the editor, describe what you want Cursor to do, then open a prefilled Cursor prompt.")
                .font(.subheadline)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private var codeEditor: some View {
        VStack(alignment: .leading, spacing: 12) {
            Label("Code", systemImage: "chevron.left.forwardslash.chevron.right")
                .font(.headline)

            TextField("File name", text: $fileName)
                .textInputAutocapitalization(.never)
                .autocorrectionDisabled()
                .textFieldStyle(.roundedBorder)

            TextEditor(text: $sourceCode)
                .font(.system(.body, design: .monospaced))
                .lineSpacing(3)
                .textInputAutocapitalization(.never)
                .autocorrectionDisabled()
                .scrollContentBackground(.hidden)
                .padding(10)
                .frame(minHeight: 320)
                .background(Color(.secondarySystemGroupedBackground))
                .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
                .overlay(
                    RoundedRectangle(cornerRadius: 14, style: .continuous)
                        .stroke(Color(.separator), lineWidth: 0.5)
                )
        }
        .cardStyle()
    }

    private var promptComposer: some View {
        VStack(alignment: .leading, spacing: 12) {
            Label("Prompt", systemImage: "sparkles")
                .font(.headline)

            TextEditor(text: $prompt)
                .frame(minHeight: 110)
                .textInputAutocapitalization(.sentences)
                .autocorrectionDisabled(false)
                .scrollContentBackground(.hidden)
                .padding(10)
                .background(Color(.secondarySystemGroupedBackground))
                .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
                .overlay(
                    RoundedRectangle(cornerRadius: 14, style: .continuous)
                        .stroke(Color(.separator), lineWidth: 0.5)
                )

            Toggle("Include code in Cursor prompt", isOn: $includeCode)
        }
        .cardStyle()
    }

    private var actions: some View {
        VStack(spacing: 12) {
            Button {
                openInCursor()
            } label: {
                Label("Open in Cursor", systemImage: "arrow.up.forward.app")
                    .frame(maxWidth: .infinity)
            }
            .buttonStyle(.borderedProminent)
            .controlSize(.large)

            Button {
                copyPrompt()
            } label: {
                Label("Copy Prompt", systemImage: "doc.on.doc")
                    .frame(maxWidth: .infinity)
            }
            .buttonStyle(.bordered)
            .controlSize(.large)
        }
    }

    private func openInCursor() {
        let promptText = cursorPrompt.text

        guard let cursorURL = CursorPrompt.cursorURL(for: promptText) else {
            statusMessage = "Could not build a Cursor link."
            return
        }

        openURL(cursorURL) { accepted in
            if accepted {
                statusMessage = "Cursor prompt opened."
                return
            }

            guard let webURL = CursorPrompt.webURL(for: promptText) else {
                statusMessage = "Cursor is not available and the web fallback could not be built."
                return
            }

            fallbackLink = FallbackLink(url: webURL)
            statusMessage = "Cursor is not available on this device. Use the web fallback instead."
        }
    }

    private func copyPrompt() {
        UIPasteboard.general.string = cursorPrompt.text
        statusMessage = "Prompt copied."
    }
}

private struct FallbackLink: Identifiable {
    let id = UUID()
    let url: URL
}

private struct FallbackSheet: View {
    let url: URL
    let copyURL: () -> Void

    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            VStack(alignment: .leading, spacing: 16) {
                Text("Cursor app link was not handled on this device.")
                    .font(.headline)

                Text("Open the Cursor web link to continue, or copy it and send it to a device where Cursor is installed.")
                    .foregroundStyle(.secondary)

                Link(destination: url) {
                    Label("Open Cursor Web Link", systemImage: "safari")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.borderedProminent)
                .controlSize(.large)

                Button {
                    copyURL()
                    dismiss()
                } label: {
                    Label("Copy Web Link", systemImage: "link")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.bordered)
                .controlSize(.large)

                Spacer()
            }
            .padding()
            .navigationTitle("Cursor Fallback")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Done") {
                        dismiss()
                    }
                }
            }
        }
        .presentationDetents([.medium])
    }
}

private extension View {
    func cardStyle() -> some View {
        self
            .padding()
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(Color(.systemBackground))
            .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
    }
}

private enum SampleCode {
    static let defaultText = """
    import SwiftUI

    struct GreetingView: View {
        let name: String

        var body: some View {
            VStack(spacing: 12) {
                Text("Hello, \\(name)!")
                    .font(.title)

                Button("Ask Cursor") {
                    // Try a prompt like: "Make this greeting more playful."
                }
            }
            .padding()
        }
    }
    """
}
