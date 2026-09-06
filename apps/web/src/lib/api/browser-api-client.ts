import axios from 'axios'

function getBrowserApiBaseUrl() {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL
  }

  return process.env.NODE_ENV === 'production'
    ? '/api/v1'
    : 'http://127.0.0.1:4000/api/v1'
}

export const browserApiClient = axios.create({
  baseURL: getBrowserApiBaseUrl(),
  timeout: 5_000,
  withCredentials: true,
  headers: { Accept: 'application/json' },
})
