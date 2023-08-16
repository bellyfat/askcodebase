import * as vscode from 'vscode'
import { AnalyticsEngineDataPoint, TraceID } from './common/traceTypes'
import fetch from 'node-fetch'

export async function trace(
  context: vscode.ExtensionContext,
  dataPoint: {
    id: TraceID
    doubles?: AnalyticsEngineDataPoint['doubles']
    blobs?: AnalyticsEngineDataPoint['blobs']
  },
) {
  const { id, doubles, blobs } = dataPoint
  let useridAsBlob1 = ''

  try {
    const user = JSON.parse(context.globalState.get('user') ?? '')
    useridAsBlob1 = user.userID
  } catch (e) {}

  const platformAsBlob2 = process.platform
  const deviceIDAsBlob3 = context.globalState.get('deviceID') as string
  const archAsBlob4 = process.arch
  const vscodeVersionAsBlob5 = vscode.version
  const data: AnalyticsEngineDataPoint = {
    indexes: [id],
    blobs: [useridAsBlob1, platformAsBlob2, deviceIDAsBlob3, archAsBlob4, vscodeVersionAsBlob5],
  }
  if (Array.isArray(blobs)) {
    data.blobs = data.blobs!.concat(blobs)
  }
  if (Array.isArray(doubles)) {
    data.doubles = doubles
  }
  const resp = await fetch('https://askcodebase.com/api/trace', {
    method: 'POST',
    body: JSON.stringify(data),
  })
  console.log('[fetch]', {
    data,
    resp: await resp.json(),
  })
  return resp
}
