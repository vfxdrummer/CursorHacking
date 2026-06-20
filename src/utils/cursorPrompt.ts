import type { CursorHandoff } from "../types";

const MAX_CONTEXT_FILES = 5;

export function buildCursorPrompt({
  activeFile,
  activeContent,
  workspaceFiles,
  request,
}: CursorHandoff): string {
  const trimmedRequest = request.trim();
  const relatedFiles = workspaceFiles
    .filter((file) => file.id !== activeFile.id)
    .slice(0, MAX_CONTEXT_FILES)
    .map((file) => `- ${file.path} (${file.language})`)
    .join("\n");

  return [
    "You are receiving a task from Cursor Pocket, a mobile code editor.",
    "",
    "User request:",
    trimmedRequest || "Review the active file and suggest the next best implementation step.",
    "",
    "Active file:",
    `${activeFile.path} (${activeFile.language})`,
    "",
    "Current mobile editor buffer:",
    "```" + activeFile.language,
    activeContent.trimEnd(),
    "```",
    "",
    "Related workspace files:",
    relatedFiles || "- No related files selected.",
    "",
    "Please continue in Cursor with a focused implementation plan, code edits, and validation steps.",
  ].join("\n");
}
