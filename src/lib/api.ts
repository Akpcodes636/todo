import axios, {
  AxiosError,
  type AxiosAdapter,
  type AxiosHeaders,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios'

export const api = axios.create({
  baseURL: '/api',
  timeout: 1500,
})

function toAxiosHeaders(headers?: AxiosRequestConfig['headers']): AxiosHeaders {
  return axios.AxiosHeaders.from(headers as AxiosHeaders | undefined)
}

export function createLocalAdapter<T>(
  resolver: () => Promise<T> | T,
  status = 200,
): AxiosAdapter {
  return async (
    config: InternalAxiosRequestConfig,
  ): Promise<AxiosResponse<T>> => {
    try {
      const data = await resolver()

      return {
        config,
        data,
        headers: toAxiosHeaders(config.headers),
        request: null,
        status,
        statusText: 'OK',
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unexpected API failure'

      throw new AxiosError(message, 'ERR_BAD_RESPONSE', config)
    }
  }
}
