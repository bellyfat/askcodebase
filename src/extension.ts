import * as vscode from 'vscode'
import { WebViewProvider } from './WebViewProvider'
import semverCompare = require('semver-compare')
import { randomString } from './common/randomString'
import { trace } from './trace'
import { TraceID } from './common/traceTypes'
import { EXTENSION_ID, WALKTHROUGH_ID } from './constants'
import { STORAGE_KEYS } from './STORAGE_KEYS'
import { updateLayout, openChangelog } from './utils'
import { getFileTree } from './getFileTree'

function registerStatusBarItem(context: vscode.ExtensionContext) {
  let statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
    -Number.MAX_SAFE_INTEGER,
  )

  statusBarItem.command = 'askcodebase.toggleAskCodebase'
  statusBarItem.text = '$(askcodebase-logo) Open AskCodebase'
  statusBarItem.tooltip = 'Toggle AskCodebase Panel'
  context.subscriptions.push(statusBarItem)
  statusBarItem.show()
  return statusBarItem
}

export function activate(context: vscode.ExtensionContext) {
  const extension = vscode.extensions.getExtension(EXTENSION_ID)
  const extensionVersion = extension?.packageJSON.version ?? '0.0.0'
  const localVersion = context.globalState.get<string>(STORAGE_KEYS.localVersion, '0.0.0')
  const isNeedUpdate = semverCompare(extensionVersion, localVersion)
  const isFirstInstall = localVersion === '0.0.0'

  const statusBarItem = registerStatusBarItem(context)
  const updateStatusBar = () => updateStatusBarItem(statusBarItem, provider.isWebviewVisible)
  const provider = new WebViewProvider(context, updateStatusBar)
  const { isWebviewVisible } = provider
  const disposable = vscode.window.registerWebviewViewProvider(WebViewProvider.viewType, provider, {
    webviewOptions: { retainContextWhenHidden: true },
  })

  context.globalState.update(STORAGE_KEYS.extensionVersion, extensionVersion)
  context.subscriptions.push(disposable)
  updateStatusBar()
  setDeviceIdIfNotExist(context)
  trace(context, { id: TraceID.Client_OnExtensionActive })
  updateLayout()

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
        await vscode.commands.executeCommand('workbench.action.positionPanelRight')
      }
      await vscode.commands.executeCommand('ask-codebase.focus')
    }
    updateStatusBarItem(statusBarItem, isWebviewVisible)
  })

  vscode.commands.registerCommand('askcodebase.clearLocalCache', async () => {
    context.globalState.update(STORAGE_KEYS.localVersion, '0.0.0')
  })

  vscode.commands.registerCommand('askcodebase.openWalkthrough', async () => {
    await vscode.commands.executeCommand(
      'workbench.action.openWalkthrough',
      `${EXTENSION_ID}#${WALKTHROUGH_ID}`,
    )
  })

  vscode.commands.registerCommand('askcodebase.searchSymbols', async () => {
    try {
      const fileTree = await getFileTree()
      console.log(fileTree)
    } catch (error) {
      console.error(error)
    }
  })

  vscode.commands.registerCommand('askcodebase.changelog', async () => {
    openChangelog(context)
  })

  vscode.commands.registerCommand('askcodebase.joinDiscord', async () => {
    const discordLink = 'https://discord.gg/5Ny6UuNKVD'
    await vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(discordLink))
  })

  vscode.commands.registerCommand('askcodebase.selectLayout', async () => {
    const options = {
      center: '$(layout-centered) Position Centered',
      bottom: '$(layout-panel) Position Bottom',
      right: '$(layout-sidebar-right) Position Right (Recommended)',
    }
    const option = await vscode.window.showQuickPick(Object.values(options))
    if (option != null) {
      await vscode.commands.executeCommand('ask-codebase.focus')
      switch (option) {
        case options.right: {
          vscode.workspace
            .getConfiguration('askcodebase')
            .update('layout', 'right', vscode.ConfigurationTarget.Global)
          await vscode.commands.executeCommand('workbench.action.positionPanelRight')
          break
        }
        case options.center: {
          vscode.workspace
            .getConfiguration('askcodebase')
            .update('layout', 'left', vscode.ConfigurationTarget.Global)
          await vscode.commands.executeCommand('workbench.action.positionPanelLeft')
          break
        }
        case options.bottom: {
          vscode.workspace
            .getConfiguration('askcodebase')
            .update('layout', 'bottom', vscode.ConfigurationTarget.Global)
          await vscode.commands.executeCommand('workbench.action.positionPanelBottom')
          break
        }
      }
    }
  })

  vscode.commands.registerCommand('askcodebase.readWhatsNew', async () => {
    return vscode.commands.executeCommand(
      'walkthroughs.selectStep',
      `${EXTENSION_ID}#${WALKTHROUGH_ID}#select-layout`,
    )
  })

  console.log({ isNeedUpdate, extensionVersion, localVersion, isFirstInstall })
  if (isNeedUpdate) {
    context.globalState.update(STORAGE_KEYS.localVersion, extensionVersion)
  }
}

function setDeviceIdIfNotExist(context: vscode.ExtensionContext) {
  let deviceId = context.globalState.get<string>('deviceID')
  if (deviceId === undefined) {
    deviceId = randomString()
    context.globalState.update('deviceID', deviceId)
  }
}

function updateStatusBarItem(statusBarItem: vscode.StatusBarItem, isWebviewVisible: () => boolean) {
  if (isWebviewVisible()) {
    statusBarItem.text = '$(askcodebase-logo) Hide AskCodebase'
  } else {
    statusBarItem.text = '$(askcodebase-logo) Open AskCodebase'
  }
}

export function deactivate() {}
