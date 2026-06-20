export type WorkspaceFile = {
  id: string;
  name: string;
  path: string;
  language: string;
  content: string;
};

export type WorkspaceSignal = {
  label: string;
  value: string;
  tone: "ready" | "active" | "warning";
};

export type CursorHandoff = {
  activeFile: WorkspaceFile;
  activeContent: string;
  workspaceFiles: WorkspaceFile[];
  request: string;
};
