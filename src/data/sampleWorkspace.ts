import type { WorkspaceFile, WorkspaceSignal } from "../types";

export const workspaceFiles: WorkspaceFile[] = [
  {
    id: "app",
    name: "App.tsx",
    path: "mobile/App.tsx",
    language: "tsx",
    content: `import { CursorAgent } from "@cursor/mobile";

export default function App() {
  return (
    <EditorShell>
      <CursorAgent mode="pair" />
      <ProjectTree source="github:vfxdrummer/CursorHacking" />
    </EditorShell>
  );
}
`,
  },
  {
    id: "agent",
    name: "cursor.agent.md",
    path: ".cursor/mobile-agent.md",
    language: "markdown",
    content: `# Cursor mobile handoff

Goal: let a developer review code, sketch an edit, and hand the full context to Cursor from a phone.

When the user taps "Send to Cursor":
1. Include the active file and dirty buffer.
2. Include the selected repository and branch.
3. Ask Cursor to open a cloud agent with this exact task.
`,
  },
  {
    id: "theme",
    name: "theme.ts",
    path: "mobile/src/theme.ts",
    language: "ts",
    content: `export const palette = {
  background: "#08111f",
  panel: "#101d33",
  accent: "#7c5cff",
  success: "#26e0a3",
};
`,
  },
];

export const workspaceSignals: WorkspaceSignal[] = [
  {
    label: "Repo",
    value: "vfxdrummer/CursorHacking",
    tone: "ready",
  },
  {
    label: "Branch",
    value: "main",
    tone: "active",
  },
  {
    label: "Cursor",
    value: "Cloud handoff ready",
    tone: "ready",
  },
];
