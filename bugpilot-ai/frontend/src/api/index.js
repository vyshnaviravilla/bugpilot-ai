import { request } from './client.js';

export const authApi = {
  register: (payload) => request('/auth/register', { method: 'POST', body: payload, auth: false }),
  login: (payload) => request('/auth/login', { method: 'POST', body: payload, auth: false }),
  me: () => request('/auth/me'),
};

export const systemApi = {
  health: () => request('/health', { auth: false }),
  aiStatus: () => request('/ai/status'),
  aiTest: () => request('/ai/test', { method: 'POST', body: {} }),
  overview: (role) => request(`/${role}/overview`),
};
