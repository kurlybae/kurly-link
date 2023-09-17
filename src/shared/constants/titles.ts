import { AppCallType, BridgeType } from '@/types';

export const BridgeTypeTitle: Record<BridgeType, string> = {
  normal: '일반',
  app_only: '앱 전용',
  app_nudge: '앱 추천',
};
export const AppCallTypeTitle: Record<AppCallType, string> = {
  none: '없음',
  safe_only: '안전모드',
  always: '항상',
};
