import { isNativePlatform } from './runtime.js';

const mobileBase = import.meta.env.VITE_MOBILE_API_BASE_URL || import.meta.env.VITE_API_BASE_URL || '';

export function buildApiUrl(endpoint) {
  const normalized = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  if (isNativePlatform() && mobileBase) {
    return `${mobileBase.replace(/\/$/, '')}${normalized}`;
  }

  return normalized;
}
