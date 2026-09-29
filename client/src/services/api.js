const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');

/**
 * Generic helper for REST API calls
 */
async function request(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMsg = data?.error?.message || `HTTP ${response.status}: ${response.statusText}`;
      const err = new Error(errorMsg);
      err.code = data?.error?.code || 'API_ERROR';
      err.status = response.status;
      err.data = data;
      throw err;
    }

    return data;
  } catch (err) {
    console.error(`[REST API Error] ${options.method || 'GET'} ${path}:`, err);
    throw err;
  }
}

// REST: Products
export const getProducts = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return request(`/api/v1/products${query ? `?${query}` : ''}`);
};

export const getProductById = (id) => request(`/api/v1/products/${id}`);

export const createProduct = (productData) =>
  request('/api/v1/products', {
    method: 'POST',
    body: JSON.stringify(productData),
  });

// REST: Orders
export const getOrders = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return request(`/api/v1/orders${query ? `?${query}` : ''}`);
};

export const getOrderById = (id) => request(`/api/v1/orders/${id}`);

export const createOrder = (orderData) =>
  request('/api/v1/orders', {
    method: 'POST',
    body: JSON.stringify(orderData),
  });

export const updateOrderStatus = (id, status, note = '', updatedBy = 'Support Agent') =>
  request(`/api/v1/orders/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status, note, updatedBy }),
  });

// REST: Demo users & stats
export const getDemoUsers = () => request('/api/v1/users/demo');
export const getSupportRooms = () => request('/api/v1/support/rooms');
export const getStats = () => request('/api/v1/stats');
export const getHealth = () => request('/health');
