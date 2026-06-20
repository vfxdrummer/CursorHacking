const vscode = acquireVsCodeApi();

const commands = {
  openReadme: () => ({
    type: 'openReadme'
  }),
  runWorkflow: () => ({
    type: 'runWorkflow'
  }),
  showInfo: () => ({
    type: 'showInfo',
    text: 'Cursor Native UI is connected to the extension host.'
  })
};

document.querySelectorAll('[data-command]').forEach((button) => {
  button.addEventListener('click', () => {
    const commandName = button.getAttribute('data-command');
    const buildMessage = commands[commandName];

    if (!buildMessage) {
      return;
    }

    vscode.postMessage(buildMessage());
  });
});
