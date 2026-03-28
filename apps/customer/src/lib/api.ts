const API_URL = 'http://localhost:3000/api/v1';

interface FetchOptions extends RequestInit {
  token?: string;
  _skipAuthRedirect?: boolean;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async fetch<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
    const { token, _skipAuthRedirect, ...fetchOptions } = options;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...fetchOptions.headers,
    };

    if (token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }

    const url = `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      ...fetchOptions,
      headers,
    });

    if (!response.ok) {
      if (response.status === 401 && !_skipAuthRedirect && typeof window !== 'undefined') {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        window.location.href = '/?sessionExpired=true';
      }
      const error = await response.json().catch(() => ({ message: 'An error occurred' }));
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  get<T>(endpoint: string, token?: string): Promise<T> {
    return this.fetch<T>(endpoint, { method: 'GET', token });
  }

  post<T>(endpoint: string, data?: unknown, token?: string): Promise<T> {
    return this.fetch<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
      token,
    });
  }

  patch<T>(endpoint: string, data?: unknown, token?: string): Promise<T> {
    return this.fetch<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
      token,
    });
  }

  delete<T>(endpoint: string, token?: string): Promise<T> {
    return this.fetch<T>(endpoint, { method: 'DELETE', token });
  }
}

export const api = new ApiClient(API_URL);
export { API_URL };
