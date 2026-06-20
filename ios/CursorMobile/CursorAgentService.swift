import Foundation

struct CursorAgentService {
    var baseURL: URL
    var session: URLSession

    init(
        baseURL: URL = URL(string: "http://localhost:8787")!,
        session: URLSession = .shared
    ) {
        self.baseURL = baseURL
        self.session = session
    }

    func createAgent(
        prompt: String,
        repositoryURL: String,
        startingRef: String,
        autoCreatePR: Bool
    ) async throws -> AgentLaunchResponse {
        var request = URLRequest(url: baseURL.appending(path: "/api/agents"))
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONEncoder().encode(CreateAgentRequest(
            promptText: prompt,
            repositoryUrl: repositoryURL,
            startingRef: startingRef,
            autoCreatePR: autoCreatePR
        ))

        return try await send(request)
    }

    func streamRun(
        agentID: String,
        runID: String,
        onEvent: @escaping (CursorStreamEvent) -> Void
    ) async throws {
        let path = "/api/agents/\(agentID)/runs/\(runID)/stream"
        var request = URLRequest(url: baseURL.appending(path: path))
        request.setValue("text/event-stream", forHTTPHeaderField: "Accept")

        let (lines, response) = try await session.bytes(for: request)
        try validate(response)

        var eventName = "message"
        var dataLines: [String] = []

        for try await line in lines.lines {
            if line.isEmpty {
                if !dataLines.isEmpty {
                    onEvent(CursorStreamEvent(name: eventName, jsonData: dataLines.joined(separator: "\n")))
                    eventName = "message"
                    dataLines.removeAll(keepingCapacity: true)
                }
                continue
            }

            if line.hasPrefix("event:") {
                eventName = String(line.dropFirst("event:".count)).trimmingCharacters(in: .whitespaces)
            } else if line.hasPrefix("data:") {
                dataLines.append(String(line.dropFirst("data:".count)).trimmingCharacters(in: .whitespaces))
            }
        }
    }

    private func send<T: Decodable>(_ request: URLRequest) async throws -> T {
        let (data, response) = try await session.data(for: request)
        try validate(response)
        return try JSONDecoder().decode(T.self, from: data)
    }

    private func validate(_ response: URLResponse) throws {
        guard let httpResponse = response as? HTTPURLResponse else {
            throw CursorAgentError.invalidResponse
        }

        guard (200..<300).contains(httpResponse.statusCode) else {
            throw CursorAgentError.httpStatus(httpResponse.statusCode)
        }
    }
}

struct CreateAgentRequest: Encodable {
    let promptText: String
    let repositoryUrl: String
    let startingRef: String
    let autoCreatePR: Bool
}

struct AgentLaunchResponse: Decodable {
    let agent: CursorAgent
    let run: CursorRun
}

struct CursorAgent: Decodable {
    let id: String
    let name: String?
}

struct CursorRun: Decodable {
    let id: String
    let status: String?
}

struct CursorStreamEvent {
    let name: String
    let data: [String: String]

    init(name: String, jsonData: String) {
        self.name = name
        self.data = CursorStreamEvent.decode(jsonData)
    }

    private static func decode(_ jsonData: String) -> [String: String] {
        guard
            let data = jsonData.data(using: .utf8),
            let object = try? JSONSerialization.jsonObject(with: data) as? [String: Any]
        else {
            return [:]
        }

        return object.reduce(into: [:]) { result, entry in
            result[entry.key] = String(describing: entry.value)
        }
    }
}

enum CursorAgentError: LocalizedError {
    case invalidResponse
    case httpStatus(Int)

    var errorDescription: String? {
        switch self {
        case .invalidResponse:
            return "The proxy returned an invalid response."
        case .httpStatus(let status):
            return "The proxy returned HTTP \(status)."
        }
    }
}
