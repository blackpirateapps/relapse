import { useEffect } from 'react';
import { isAndroidApp } from '../platform/runtime.js';
import {
  requestMobileNotificationPermission,
  startOrUpdateStreakNotification,
  stopStreakNotification
} from './streakNotification.js';

export function useStreakNotification(lastRelapse) {
  useEffect(() => {
    if (!isAndroidApp()) return;

    let canceled = false;

    async function sync() {
      try {
        await requestMobileNotificationPermission();
        if (canceled) return;

        if (lastRelapse) {
          await startOrUpdateStreakNotification(lastRelapse);
        } else {
          await stopStreakNotification();
        }
      } catch (error) {
        console.error('Failed to sync streak notification:', error);
      }
    }

    sync();

    return () => {
      canceled = true;
    };
  }, [lastRelapse]);
}
