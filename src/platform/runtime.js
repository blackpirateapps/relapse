function getCapacitor() {
  if (typeof window === 'undefined') return null;
  return window.Capacitor || null;
}

export const isNativePlatform = () => {
  const capacitor = getCapacitor();
  if (!capacitor || typeof capacitor.isNativePlatform !== 'function') return false;
  return capacitor.isNativePlatform();
};

export const isAndroidApp = () => {
  const capacitor = getCapacitor();
  if (!capacitor || typeof capacitor.getPlatform !== 'function') return false;
  return isNativePlatform() && capacitor.getPlatform() === 'android';
};

export const getNativePlugin = (name) => {
  const capacitor = getCapacitor();
  return capacitor?.Plugins?.[name] || null;
};
