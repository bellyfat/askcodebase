import { useAtomValue } from 'jotai'
import { userAtom } from '../store'
import { systemInfoAtom } from '../store/systemInfoAtom'
import { deviceIDAtom } from '../store/deviceIDAtom'
import { useAtomRefValue } from './useAtomRefValue'
import { useRef } from 'react'

export interface AnalyticsEngineDataPoint {
  indexes?: ((ArrayBuffer | string) | null)[]
  doubles?: number[]
  blobs?: ((ArrayBuffer | string) | null)[]
}

export enum TraceID {
  Client_Login_Expose = 'Client_Login_Expose',
  Client_Login_Click = 'Client_Login_Click',
  Client_Login_Success = 'Client_Login_Success',
}

export function useTrace() {
  const [user, getUser] = useAtomRefValue(userAtom)
  const systemInfo = useAtomValue(systemInfoAtom)
  const deviceID = useAtomValue(deviceIDAtom)

  const platformAsBlob2 = systemInfo?.platform ?? ''
  const deviceIDAsBlob3 = deviceID ?? ''
  const archAsBlob4 = systemInfo?.arch ?? ''
  const vscodeVersionAsBlob5 = systemInfo?.vscodeVersion ?? ''

  return async function trace(dataPoint: {
    id: TraceID
    doubles?: AnalyticsEngineDataPoint['doubles']
    blobs?: AnalyticsEngineDataPoint['blobs']
  }) {
    const { id, doubles, blobs } = dataPoint
    const useridAsBlob1 = getUser()?.userID ?? ''

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
    return fetch('https://askcodebase.com/api/trace', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }
}
