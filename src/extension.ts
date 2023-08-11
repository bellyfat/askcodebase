import * as vscode from 'vscode'
import { WebViewProvider } from './WebViewProvider'
import semverCompare = require('semver-compare')

function registerStatusBarItem(context: vscode.ExtensionContext) {
  let statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
    -Number.MAX_SAFE_INTEGER,
  )

  statusBarItem.command = 'askcodebase.toggleAskCodebase'
  statusBarItem.text = '$(layout-panel) Open AskCodebase'
  statusBarItem.tooltip = 'Toggle AskCodebase Panel'
  context.subscriptions.push(statusBarItem)
  statusBarItem.show()

  return statusBarItem
}

const STORAGE_KEYS = {
  localVersion: 'localVersion',
  isDefaultPanelPositionSet: 'isDefaultPanelPositionSet',
}
const EXTENSION_ID = 'JipitiAI.askcodebase'
const WALKTHROUGH_ID = 'askcodebase-walkthrough'

export function activate(context: vscode.ExtensionContext) {
  const extension = vscode.extensions.getExtension(EXTENSION_ID)
  const statusBarItem = registerStatusBarItem(context)
  const updateStatusBar = () => updateStatusBarItem(statusBarItem, provider.isWebviewVisible)
  const provider = new WebViewProvider(context, updateStatusBar)
  const { isWebviewVisible } = provider
  const disposable = vscode.window.registerWebviewViewProvider(WebViewProvider.viewType, provider, {
    webviewOptions: { retainContextWhenHidden: true },
  })

  context.subscriptions.push(disposable)
  updateStatusBar()

  vscode.commands.registerCommand('askcodebase.toggleAskCodebase', async () => {
    if (isWebviewVisible()) {
      await vscode.commands.executeCommand('workbench.action.closePanel')
    } else {
      const isDefaultPanelPositionSet = context.globalState.get<boolean>(
        STORAGE_KEYS.isDefaultPanelPositionSet,
        false,
      )
      if (!isDefaultPanelPositionSet) {
        context.globalState.update(STORAGE_KEYS.isDefaultPanelPositionSet, true)
        await vscode.commands.executeCommand('workbench.action.positionPanelLeft')
      }
      await vscode.commands.executeCommand('ask-codebase.focus')
    }
    updateStatusBarItem(statusBarItem, isWebviewVisible)
  })

  vscode.commands.registerCommand('askcodebase.clearLocalCache', async () => {
    context.globalState.update(STORAGE_KEYS.localVersion, '0.0.0')
  })

  vscode.commands.registerCommand('askcodebase.joinDiscord', async () => {
    const discordLink = 'https://discord.gg/5Ny6UuNKVD'
    await vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(discordLink))
  })

  vscode.commands.registerCommand('askcodebase.selectLayout', async () => {
    const options = {
      center: '$(layout-centered) Position Centered (Recommended)',
      bottom: '$(layout-panel) Position Bottom',
      right: '$(layout-sidebar-right) Position Right',
    }
    const option = await vscode.window.showQuickPick(Object.values(options))
    if (option != null) {
      await vscode.commands.executeCommand('ask-codebase.focus')
      switch (option) {
        case options.center: {
          await vscode.commands.executeCommand('workbench.action.positionPanelLeft')
          break
        }
        case options.bottom: {
          await vscode.commands.executeCommand('workbench.action.positionPanelBottom')
          break
        }
        case options.right: {
          await vscode.commands.executeCommand('workbench.action.positionPanelRight')
          break
        }
      }
    }
  })

  const extensionVersion = extension?.packageJSON.version ?? '0.0.0'
  const localVersion = context.globalState.get<string>(STORAGE_KEYS.localVersion, '0.0.0')
  const isNeedUpdate = semverCompare(extensionVersion, localVersion)
  const isFirstInstall = localVersion === '0.0.0'

  console.log({ extensionVersion, localVersion, isNeedUpdate, isFirstInstall })

  vscode.commands.registerCommand('askcodebase.readWhatsNew', async () => {
    if (isFirstInstall) {
      return vscode.commands.executeCommand(
        'walkthroughs.selectStep',
        `${EXTENSION_ID}#${WALKTHROUGH_ID}#open-askcodebase`,
      )
    }
    return vscode.commands.executeCommand('workbench.action.closeActiveEditor')
  })

  vscode.commands.registerCommand('askcodebase.readOpenAskCodebase', async () => {
    return vscode.commands.executeCommand(
      'walkthroughs.selectStep',
      `${EXTENSION_ID}#${WALKTHROUGH_ID}#select-layout`,
    )
  })

  if (isNeedUpdate) {
    context.globalState.update(STORAGE_KEYS.localVersion, extensionVersion)

    setTimeout(async () => {
      await vscode.commands.executeCommand(
        'workbench.action.openWalkthrough',
        `${EXTENSION_ID}#${WALKTHROUGH_ID}`,
      )
    }, 3 * 1000)
  }
}

async function openWalkthroughWithStep(walkthrough: string, step: string) {
  await vscode.commands.executeCommand(
    'workbench.action.openWalkthrough',
    `${EXTENSION_ID}#${WALKTHROUGH_ID}`,
  )
  await vscode.commands.executeCommand(
    'walkthroughs.selectStep',
    `${EXTENSION_ID}#${WALKTHROUGH_ID}#open-askcodebase`,
  )
}

function updateStatusBarItem(statusBarItem: vscode.StatusBarItem, isWebviewVisible: () => boolean) {
  if (isWebviewVisible()) {
    statusBarItem.text = '$(layout-panel) Hide AskCodebase'
  } else {
    statusBarItem.text = '$(layout-panel) Open AskCodebase'
  }
}

export function deactivate() {}
