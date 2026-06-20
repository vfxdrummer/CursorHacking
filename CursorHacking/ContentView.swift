import SwiftUI

struct ContentView: View {
    var body: some View {
        ZStack {
            LinearGradient(
                colors: [
                    Color(red: 0.13, green: 0.15, blue: 0.25),
                    Color(red: 0.24, green: 0.18, blue: 0.44)
                ],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            .ignoresSafeArea()

            VStack(spacing: 24) {
                Image(systemName: "cursorarrow.rays")
                    .font(.system(size: 72, weight: .semibold))
                    .foregroundStyle(.white)
                    .accessibilityHidden(true)

                VStack(spacing: 12) {
                    Text("CursorHacking")
                        .font(.largeTitle.bold())

                    Text("Your new iOS app is ready to build on.")
                        .font(.title3)
                        .multilineTextAlignment(.center)
                        .foregroundStyle(.white.opacity(0.82))
                }

                Text("Open this project in Xcode, choose an iPhone simulator, and press Run.")
                    .font(.callout.weight(.medium))
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 24)
                    .padding(.vertical, 14)
                    .background(.white.opacity(0.14), in: Capsule())
            }
            .foregroundStyle(.white)
            .padding(32)
        }
    }
}

#Preview {
    ContentView()
}
