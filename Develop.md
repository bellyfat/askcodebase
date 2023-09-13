# Development Guide

## Develop

```bash
npm run dev # develop client
npm run watch # develop backend
npm run pub # bump version and publish to marketplace
```

<kbd>F5</kbd> start the extension

## Resources

1. [Monaco Editor APIs](https://microsoft.github.io/monaco-editor/docs.html)

## enabledApiProposals

```json
  "enabledApiProposals": [
    "interactive",
    "interactiveUserActions",
    "terminalContextMenu",
    "terminalDataWriteEvent",
    "terminalSelection",
    "terminalQuickFixProvider",
    "semanticSimilarity",
    "handleIssueUri",
    "chatSlashCommands",
    "chatVariables"
  ],
```

The `enabledApiProposals` is not allowed for 3rd party extensions. It is only used for extensions developed by Microsoft.