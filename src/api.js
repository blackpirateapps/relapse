// A helper for making API requests
const apiRequest = async (endpoint, options = {}) => {
  const response = await fetch(`/api/${endpoint}`, options);
  if (!response.ok) {
    if (response.status === 401) {
      // Unauthorized, let the App component handle redirect
      throw new Error('Unauthorized');
    }
    const errorData = await response.json().catch(() => ({ message: 'An unknown error occurred' }));
    throw new Error(errorData.message);
  }
  // For POST requests that might not return JSON
  if (response.headers.get("content-length") === "0" || response.status === 204) {
    return true;
  }
  return response.json();
};

export const login = async (password) => {
    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password }),
        });
        const data = await response.json();
        return data.success;
    } catch (e) {
        return false;
    }
};

export const fetchState = () => apiRequest('state');
export const fetchShopData = () => apiRequest('shop');
export const fetchHistory = () => apiRequest('history');
export const postRelapse = () => apiRequest('relapse', { method: 'POST' });

export const buyItem = (itemId) => apiRequest('shop', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ action: 'buy', itemId }),
});

export const equipItem = (itemId, equip) => apiRequest('shop', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ action: 'equip', itemId, equip }),
});

// Utility function to get rank, now client-side
export function getRank(totalHours, ranks) {
  for (let i = ranks.length - 1; i >= 0; i--) {
    if (totalHours >= ranks[i].hours) return { ...ranks[i], level: i };
  }
  return { ...ranks[0], level: 0 };
}
