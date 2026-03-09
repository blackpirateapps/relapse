import { isNativePlatform } from './runtime.js';

const HARDCODED_MOBILE_BASE = 'https://phoenix.blackpiratex.com';
const mobileBase = import.meta.env.VITE_MOBILE_API_BASE_URL || import.meta.env.VITE_API_BASE_URL || HARDCODED_MOBILE_BASE;

export function buildApiUrl(endpoint) {
  const normalized = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  if (isNativePlatform()) {
    return `${mobileBase.replace(/\/$/, '')}${normalized}`;
  }

  return normalized;
}
