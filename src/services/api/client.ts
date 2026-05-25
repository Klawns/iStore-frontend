import axios, { AxiosError } from 'axios'

export type RestErr = {
  code: number
  message: string
  error?: string
  causes?: string[]
}

export class ApiError extends Error {
  code?: number
  causes?: string[]

  constructor(restErr: RestErr) {
    super(restErr.message || restErr.error || 'Nao foi possivel conectar.')
    this.name = 'ApiError'
    this.code = restErr.code
    this.causes = restErr.causes
  }
}

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api',
  withCredentials: true,
})

function readCookie(name: string) {
  return document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${name}=`))
    ?.split('=')[1]
}

api.interceptors.request.use((config) => {
  const method = config.method?.toUpperCase()
  if (method && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    const csrfToken = readCookie('csrf_token')
    if (csrfToken) {
      config.headers.set('X-CSRF-Token', decodeURIComponent(csrfToken))
    }
  }

  return config
})

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<RestErr>) => {
    if (error.response?.data) {
      return Promise.reject(new ApiError(error.response.data))
    }

    return Promise.reject(error)
  },
)
