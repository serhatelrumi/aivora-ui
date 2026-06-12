const BASE_URL = 'http://127.0.0.1:8000';

const getToken = () => localStorage.getItem('token');

export const apiRequest = async (method, endpoint, body = null) => {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const config = { method, headers };
  if (body !== null) config.body = JSON.stringify(body);

  let response;
  try {
    response = await fetch(`${BASE_URL}${endpoint}`, config);
  } catch {
    throw new Error('Sunucuya bağlanılamadı. Backend (port 8000) çalışıyor mu?');
  }

  if (response.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
    return;
  }

  let data;
  try { data = await response.json(); } catch { data = {}; }

  if (!response.ok) {
    const detail = data?.detail;
    let msg = 'Bir hata oluştu.';
    if (typeof detail === 'string') msg = detail;
    else if (Array.isArray(detail)) {
      msg = detail.map((d) => (typeof d === 'string' ? d : d.msg || JSON.stringify(d))).join(' ');
    } else if (response.status >= 500) {
      msg = 'Sunucu hatası. Backend loglarını kontrol edin.';
    }
    throw new Error(msg);
  }
  return data;
};

export const get    = (ep)       => apiRequest('GET',    ep);
export const post   = (ep, body) => apiRequest('POST',   ep, body);
export const patch  = (ep, body) => apiRequest('PATCH',  ep, body);
export const put    = (ep, body) => apiRequest('PUT',    ep, body);
export const del    = (ep)       => apiRequest('DELETE', ep);
