import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
  withCredentials: true,
});

let onUnauthorized = () => {};

// lets the auth state react when the session expires in the middle of any request
export const setUnauthorizedHandler = (handler) => {
  onUnauthorized = handler;
};

// a 401 from these two is an answer to "am I logged in?", not an expired session
const isAuthCheck = (config) =>
  config?.url === '/users/login' || (config?.url === '/users/me' && config?.method === 'get');

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !isAuthCheck(error.config)) {
      onUnauthorized();
    }
    return Promise.reject(error);
  }
);

export const errorMessage = (error) =>
  error.response?.data?.message || 'Something went wrong. Please try again.';

export default api;
