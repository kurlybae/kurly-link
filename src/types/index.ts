export type BridgeType = 'normal' | 'app_only' | 'app_nudge';
export type AppCallType = 'none' | 'safe_only' | 'always';

export interface CoreLinkData {
  webUrl: string;
  iosUrl: string | null;
  aosUrl: string | null;
  bridgeType: BridgeType;
  bridgeTemplate: string | null;
  appCall: AppCallType;
}

export interface LinkFormData extends CoreLinkData {
  expireDate: number;
}

export interface LinkData extends LinkFormData {
  key: string;
  registerName: string;
  registerEmail: string;
  registerDate: number;
}
