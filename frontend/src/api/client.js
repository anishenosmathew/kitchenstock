const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

async function request(path, { method = 'GET', body, token } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}

export const api = {
  signup: (payload) => request('/api/auth/signup', { method: 'POST', body: payload }),
  login: (payload) => request('/api/auth/login', { method: 'POST', body: payload }),

  getInventory: (kitchenId, token) =>
    request(`/api/kitchens/${kitchenId}/inventory`, { token }),

  getItem: (kitchenId, itemId, token) =>
    request(`/api/kitchens/${kitchenId}/inventory/${itemId}`, { token }),

  createItem: (kitchenId, payload, token) =>
    request(`/api/kitchens/${kitchenId}/inventory`, { method: 'POST', body: payload, token }),

  adjustQuantity: (kitchenId, itemId, payload, token) =>
    request(`/api/kitchens/${kitchenId}/inventory/${itemId}/quantity`, {
      method: 'PATCH',
      body: payload,
      token,
    }),

  updateItem: (kitchenId, itemId, payload, token) =>
    request(`/api/kitchens/${kitchenId}/inventory/${itemId}`, { method: 'PATCH', body: payload, token }),

  deleteItem: (kitchenId, itemId, token) =>
    request(`/api/kitchens/${kitchenId}/inventory/${itemId}`, { method: 'DELETE', token }),

  updateThreshold: (kitchenId, itemId, payload, token) =>
    request(`/api/kitchens/${kitchenId}/inventory/${itemId}/threshold`, {
      method: 'PATCH',
      body: payload,
      token,
    }),

  getShoppingList: (kitchenId, token) =>
    request(`/api/kitchens/${kitchenId}/shopping-list`, { token }),

  getHousehold: (kitchenId, token) =>
    request(`/api/kitchens/${kitchenId}/household`, { token }),

  rotateInviteCode: (kitchenId, token) =>
    request(`/api/kitchens/${kitchenId}/household/rotate-code`, { method: 'POST', token }),

  leaveKitchen: (kitchenId, token) =>
    request(`/api/kitchens/${kitchenId}/household/leave`, { method: 'POST', token }),

  joinKitchen: (inviteCode, token) =>
    request('/api/auth/join-kitchen', { method: 'POST', body: { inviteCode }, token }),

  removeMember: (kitchenId, userId, token) =>
    request(`/api/kitchens/${kitchenId}/household/members/${userId}`, {
      method: 'DELETE',
      token,
    }),

  updateProfile: (payload, token) =>
    request('/api/auth/profile', { method: 'PATCH', body: payload, token }),

  changePassword: (payload, token) =>
    request('/api/auth/change-password', { method: 'POST', body: payload, token }),
};
