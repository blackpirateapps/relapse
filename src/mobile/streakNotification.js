import { getNativePlugin } from '../platform/runtime.js';

function toEpochMs(lastRelapse) {
  const parsed = new Date(lastRelapse).getTime();
  return Number.isFinite(parsed) ? parsed : null;
}

export async function startOrUpdateStreakNotification(lastRelapse) {
  const startedAtMs = toEpochMs(lastRelapse);
  const plugin = getNativePlugin('StreakNotification');
  if (!startedAtMs || !plugin?.start) return;
  await plugin.start({ startedAtMs });
}

export async function stopStreakNotification() {
  const plugin = getNativePlugin('StreakNotification');
  if (!plugin?.stop) return;
  await plugin.stop();
}

export async function requestMobileNotificationPermission() {
  const localNotifications = getNativePlugin('LocalNotifications');
  if (!localNotifications?.requestPermissions) return;
  await localNotifications.requestPermissions();
}
