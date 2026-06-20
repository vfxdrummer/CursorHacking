import SwiftUI

struct ContentView: View {
    @StateObject private var viewModel: CursorAgentViewModel

    init(service: CursorAgentService = CursorAgentService()) {
        _viewModel = StateObject(wrappedValue: CursorAgentViewModel(service: service))
    }

    var body: some View {
        NavigationStack {
            Form {
                Section("Repository") {
                    TextField("https://github.com/org/repo", text: $viewModel.repositoryURL)
                        .keyboardType(.URL)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()

                    TextField("Starting ref", text: $viewModel.startingRef)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                }

                Section("Prompt") {
                    TextEditor(text: $viewModel.prompt)
                        .frame(minHeight: 140)

                    Toggle("Auto-create pull request", isOn: $viewModel.autoCreatePR)
                }

                Section {
                    Button(viewModel.isRunning ? "Running..." : "Start Cursor Agent") {
                        Task {
                            await viewModel.startAgent()
                        }
                    }
                    .disabled(viewModel.isRunning || viewModel.prompt.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                }

                Section("Run") {
                    if let agentID = viewModel.agentID {
                        LabeledContent("Agent", value: agentID)
                    }

                    if let runID = viewModel.runID {
                        LabeledContent("Run", value: runID)
                    }

                    LabeledContent("Status", value: viewModel.status)
                }

                Section("Output") {
                    Text(viewModel.output.isEmpty ? "Agent output will stream here." : viewModel.output)
                        .font(.system(.body, design: .monospaced))
                        .textSelection(.enabled)
                }
            }
            .navigationTitle("Cursor Mobile")
            .toolbar {
                Button("Reset") {
                    viewModel.reset()
                }
                .disabled(viewModel.isRunning)
            }
        }
    }
}

@MainActor
final class CursorAgentViewModel: ObservableObject {
    @Published var repositoryURL = "https://github.com/your-org/your-repo"
    @Published var startingRef = "main"
    @Published var prompt = "Make the requested code change, run tests, and open a pull request."
    @Published var autoCreatePR = true
    @Published var agentID: String?
    @Published var runID: String?
    @Published var status = "Idle"
    @Published var output = ""
    @Published var isRunning = false

    private let service: CursorAgentService

    init(service: CursorAgentService) {
        self.service = service
    }

    func startAgent() async {
        isRunning = true
        status = "Creating agent"
        output = ""

        do {
            let launch = try await service.createAgent(
                prompt: prompt,
                repositoryURL: repositoryURL,
                startingRef: startingRef,
                autoCreatePR: autoCreatePR
            )

            agentID = launch.agent.id
            runID = launch.run.id
            status = launch.run.status ?? "Streaming"

            try await service.streamRun(agentID: launch.agent.id, runID: launch.run.id) { [weak self] event in
                Task { @MainActor in
                    self?.apply(event)
                }
            }

            isRunning = false
        } catch {
            status = "Error"
            output += "\n\(error.localizedDescription)"
            isRunning = false
        }
    }

    func reset() {
        agentID = nil
        runID = nil
        status = "Idle"
        output = ""
    }

    private func apply(_ event: CursorStreamEvent) {
        switch event.name {
        case "status":
            status = event.data["status"] ?? status
        case "assistant", "thinking":
            output += event.data["text"] ?? ""
        case "tool_call":
            if let name = event.data["name"], let toolStatus = event.data["status"] {
                output += "\n[\(name): \(toolStatus)]"
            }
        case "result":
            status = event.data["status"] ?? "Done"

            if let text = event.data["text"], !text.isEmpty {
                output += "\n\(text)"
            }
        case "error":
            status = "Error"
            output += "\n\(event.data["message"] ?? "Unknown stream error")"
        default:
            break
        }
    }
}
