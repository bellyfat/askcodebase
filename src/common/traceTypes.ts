export interface AnalyticsEngineDataPoint {
  indexes?: ((ArrayBuffer | string) | null)[]
  doubles?: number[]
  blobs?: ((ArrayBuffer | string) | null)[]
}

export enum TraceID {
  Client_Login_Expose = 'Client_Login_Expose',
  Client_Login_Click = 'Client_Login_Click',
  Client_Login_Success = 'Client_Login_Success',
  Client_OnExtensionActive = 'Client_OnExtensionActive',
  Client_OnShow = 'Client_OnShow',
  Client_OnRecommendExtension = 'Client_OnRecommendExtension',
  Client_CommandClear = 'Client_CommandClear',
  Client_CommandChangelog = 'Client_CommandChangelog',
  Client_CommandHelp = 'Client_CommandHelp',
  Client_OnChatRequest = 'Client_OnChatRequest',
  Client_OnChatResponseSuccess = 'Client_OnChatResponseSuccess',
  Client_OnChatResponseFailure = 'Client_OnChatResponseFailure',
}
