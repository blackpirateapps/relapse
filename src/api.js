import { buildApiUrl } from './platform/apiBase.js';

const apiRequest = async (endpoint, options = {}) => {
  const response = await fetch(buildApiUrl(`/api/${endpoint}`), {
    credentials: 'include',
    ...options
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Unauthorized');
    }
    const errorData = await response.json().catch(() => ({ message: 'An unknown error occurred' }));
    throw new Error(errorData.message);
  }

  if (response.headers.get('content-length') === '0' || response.status === 204) {
    return true;
  }

  return response.json();
};

export const login = async (password) => {
  let response;

  try {
    response = await fetch(buildApiUrl('/api/login'), {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });
  } catch (_error) {
    throw new Error('Unable to reach the server. Check CAP_SERVER_URL and internet connection.');
  }

  if (response.status === 401) {
    return false;
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Login failed' }));
    throw new Error(errorData.message || 'Login failed');
  }

  const data = await response.json().catch(() => ({ success: false }));
  return !!data.success;
};

export const fetchState = () => apiRequest('state');
export const fetchShopData = () => apiRequest('shop');
export const fetchHistory = () => apiRequest('history');
export const postRelapse = () => apiRequest('relapse', { method: 'POST' });

export const buyItem = (itemId, options = {}) => apiRequest('shop', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ action: 'buy', itemId, ...options })
});

export const equipItem = (itemId, equip) => apiRequest('shop', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ action: 'equip', itemId, equip })
});

export const updateForestTree = (treeId, x, y) => apiRequest('shop', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ action: 'move_tree', treeId, x, y })
});

export const usePotion = () => apiRequest('potion', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }
});

export const startGame = (gameId) => apiRequest('minigame', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ action: 'start_game', gameId })
});

export const endGame = (playId, score) => apiRequest('minigame', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ action: 'end_game', playId, score })
});

export const fetchUrgeTasks = () => apiRequest('urge');
export const startUrgeTask = (taskId) => apiRequest('urge', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ action: 'start', taskId })
});
export const endUrgeSession = (taskId) => apiRequest('urge', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ action: 'end_session', taskId })
});
export const cancelUrgeTask = (taskId) => apiRequest('urge', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ action: 'cancel', taskId })
});
export const claimUrgeTask = (taskId) => apiRequest('urge', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ action: 'claim', taskId })
});

export function getRank(totalHours, ranks) {
  for (let i = ranks.length - 1; i >= 0; i--) {
    if (totalHours >= ranks[i].hours) return { ...ranks[i], level: i };
  }
  return { ...ranks[0], level: 0 };
}
