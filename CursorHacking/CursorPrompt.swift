import Foundation

struct CursorPrompt {
    var instruction: String
    var code: String
    var fileName: String
    var includeCode: Bool

    var text: String {
        let trimmedInstruction = instruction.trimmingCharacters(in: .whitespacesAndNewlines)
        let trimmedCode = code.trimmingCharacters(in: .whitespacesAndNewlines)
        let trimmedFileName = fileName.trimmingCharacters(in: .whitespacesAndNewlines)

        var sections: [String] = []

        if trimmedInstruction.isEmpty {
            sections.append("Help me improve this code.")
        } else {
            sections.append(trimmedInstruction)
        }

        guard includeCode, !trimmedCode.isEmpty else {
            return sections.joined(separator: "\n\n")
        }

        if !trimmedFileName.isEmpty {
            sections.append("File: \(trimmedFileName)")
        }

        sections.append("""
        ```\(Self.languageHint(for: trimmedFileName))
        \(trimmedCode)
        ```
        """)

        return sections.joined(separator: "\n\n")
    }

    static func cursorURL(for promptText: String) -> URL? {
        promptURL(for: promptText, scheme: "cursor", host: "anysphere.cursor-deeplink", path: "/prompt")
    }

    static func webURL(for promptText: String) -> URL? {
        promptURL(for: promptText, scheme: "https", host: "cursor.com", path: "/link/prompt")
    }

    private static func promptURL(for promptText: String, scheme: String, host: String, path: String) -> URL? {
        var components = URLComponents()
        components.scheme = scheme
        components.host = host
        components.path = path
        components.queryItems = [
            URLQueryItem(name: "text", value: promptText)
        ]
        return components.url
    }

    private static func languageHint(for fileName: String) -> String {
        guard let fileExtension = fileName.split(separator: ".").last?.lowercased() else {
            return ""
        }

        switch fileExtension {
        case "js", "jsx":
            return "javascript"
        case "ts", "tsx":
            return "typescript"
        case "py":
            return "python"
        case "rb":
            return "ruby"
        case "kt", "kts":
            return "kotlin"
        case "m", "mm":
            return "objective-c"
        case "rs":
            return "rust"
        case "sh", "bash", "zsh":
            return "shell"
        default:
            return fileExtension
        }
    }
}
