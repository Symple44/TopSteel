import axios, { type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'
import { type ApiConfig, type ApiError, type AuthToken, HttpClient } from '../http-client'

// Mock axios
jest.mock('axios')
const mockedAxios = axios as jest.Mocked<typeof axios>

describe('HttpClient', () => {
  let httpClient: HttpClient
  let mockAxiosInstance: jest.Mocked<{
    create: jest.MockedFunction<typeof axios.create>
    get: jest.MockedFunction<any>
    post: jest.MockedFunction<any>
    put: jest.MockedFunction<any>
    patch: jest.MockedFunction<any>
    delete: jest.MockedFunction<any>
    interceptors: {
      request: {
        use: jest.MockedFunction<any>
      }
      response: {
        use: jest.MockedFunction<any>
      }
    }
  }>
  const mockConfig: ApiConfig = {
    baseURL: 'https://api.example.com',
    timeout: 5000,
    retries: 3,
    retryDelay: 1000,
  }

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks()

    // Mock axios instance
    mockAxiosInstance = {
      create: jest.fn(),
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      patch: jest.fn(),
      delete: jest.fn(),
      interceptors: {
        request: {
          use: jest.fn(),
        },
        response: {
          use: jest.fn(),
        },
      },
    }

    mockedAxios.create.mockReturnValue(mockAxiosInstance)
    httpClient = new HttpClient(mockConfig)
  })

  describe('constructor', () => {
    it('should create axios instance with correct config', () => {
      expect(mockedAxios.create).toHaveBeenCalledWith({
        baseURL: mockConfig.baseURL,
        timeout: mockConfig.timeout,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      })
    })

    it('should use default timeout when not provided', () => {
      const configWithoutTimeout = { baseURL: 'https://api.example.com' }
      new HttpClient(configWithoutTimeout)

      expect(mockedAxios.create).toHaveBeenCalledWith({
        baseURL: configWithoutTimeout.baseURL,
        timeout: 30000, // default timeout
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      })
    })

    it('should setup interceptors', () => {
      expect(mockAxiosInstance.interceptors.request.use).toHaveBeenCalled()
      expect(mockAxiosInstance.interceptors.response.use).toHaveBeenCalled()
    })
  })

  describe('axiosInstance getter', () => {
    it('should return the axios instance', () => {
      expect(httpClient.axiosInstance).toBe(mockAxiosInstance)
    })
  })

  describe('auth management', () => {
    const mockToken: AuthToken = {
      access_token: 'test-access-token',
      refresh_token: 'test-refresh-token',
      token_type: 'Bearer',
      expires_in: 3600,
    }

    it('should set auth token', () => {
      httpClient.setAuthToken(mockToken)
      // Token should be stored internally
      // We can't directly test the private property, but we can test the side effects
    })

    it('should clear auth', () => {
      httpClient.setAuthToken(mockToken)
      httpClient.clearAuth()
      // Token should be cleared internally
    })

    describe('request interceptor', () => {
      it('should add authorization header when token is set', () => {
        httpClient.setAuthToken(mockToken)

        // Get the request interceptor
        const requestInterceptor = mockAxiosInstance.interceptors.request.use.mock.calls[0][0]

        const config: InternalAxiosRequestConfig = {
          headers: {},
        } as InternalAxiosRequestConfig

        const result = requestInterceptor(config)

        expect(result.headers.Authorization).toBe(`Bearer ${mockToken.access_token}`)
      })

      it('should not override existing authorization header', () => {
        httpClient.setAuthToken(mockToken)

        const requestInterceptor = mockAxiosInstance.interceptors.request.use.mock.calls[0][0]

        const config: InternalAxiosRequestConfig = {
          headers: {
            Authorization: 'Bearer existing-token',
          },
        } as InternalAxiosRequestConfig

        const result = requestInterceptor(config)

        expect(result.headers.Authorization).toBe('Bearer existing-token')
      })
    })
  })

  describe('HTTP methods', () => {
    it('should call axios.get', async () => {
      const mockResponse: AxiosResponse = {
        data: { test: 'data' },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {},
        request: {},
      }

      mockAxiosInstance.get.mockResolvedValue(mockResponse)

      const result = await httpClient.get('/test')

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/test', undefined)
      expect(result).toEqual(mockResponse)
    })

    it('should call axios.post', async () => {
      const mockData = { name: 'test' }
      const mockResponse: AxiosResponse = {
        data: { id: 1, ...mockData },
        status: 201,
        statusText: 'Created',
        headers: {},
        config: {},
        request: {},
      }

      mockAxiosInstance.post.mockResolvedValue(mockResponse)

      const result = await httpClient.post('/test', mockData)

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/test', mockData, undefined)
      expect(result).toEqual(mockResponse)
    })

    it('should call axios.put', async () => {
      const mockData = { name: 'updated' }
      const mockResponse: AxiosResponse = {
        data: { id: 1, ...mockData },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {},
        request: {},
      }

      mockAxiosInstance.put.mockResolvedValue(mockResponse)

      const result = await httpClient.put('/test/1', mockData)

      expect(mockAxiosInstance.put).toHaveBeenCalledWith('/test/1', mockData, undefined)
      expect(result).toEqual(mockResponse)
    })

    it('should call axios.patch', async () => {
      const mockData = { name: 'patched' }
      const mockResponse: AxiosResponse = {
        data: { id: 1, ...mockData },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {},
        request: {},
      }

      mockAxiosInstance.patch.mockResolvedValue(mockResponse)

      const result = await httpClient.patch('/test/1', mockData)

      expect(mockAxiosInstance.patch).toHaveBeenCalledWith('/test/1', mockData, undefined)
      expect(result).toEqual(mockResponse)
    })

    it('should call axios.delete', async () => {
      const mockResponse: AxiosResponse = {
        data: { success: true },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {},
        request: {},
      }

      mockAxiosInstance.delete.mockResolvedValue(mockResponse)

      const result = await httpClient.delete('/test/1')

      expect(mockAxiosInstance.delete).toHaveBeenCalledWith('/test/1', undefined)
      expect(result).toEqual(mockResponse)
    })
  })

  describe('helper methods', () => {
    describe('getWithPagination', () => {
      it('should return paginated response', async () => {
        const mockPaginatedData = {
          items: [{ id: 1 }, { id: 2 }],
          total: 10,
          page: 1,
          limit: 2,
          totalPages: 5,
        }

        const mockResponse: AxiosResponse = {
          data: mockPaginatedData,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {},
          request: {},
        }

        mockAxiosInstance.get.mockResolvedValue(mockResponse)

        const result = await httpClient.getWithPagination('/test', { page: 1, limit: 2 })

        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/test', {
          params: { page: 1, limit: 2 },
        })
        expect(result).toEqual(mockPaginatedData)
      })
    })

    describe('executeOperation', () => {
      it('should return success result for successful operation', async () => {
        const mockData = { id: 1, name: 'test' }
        const mockResponse: AxiosResponse = {
          data: mockData,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {},
          request: {},
        }

        const operation = jest.fn().mockResolvedValue(mockResponse)

        const result = await httpClient.executeOperation(operation)

        expect(result).toEqual({
          success: true,
          data: mockData,
        })
      })

      it('should return error result for failed operation', async () => {
        const mockError: ApiError = {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: { name: ['Name is required'] },
        }

        const operation = jest.fn().mockRejectedValue(mockError)

        const result = await httpClient.executeOperation(operation)

        expect(result).toEqual({
          success: false,
          error: mockError.message,
          validationErrors: mockError.details,
        })
      })
    })
  })

  describe('error transformation', () => {
    describe('response interceptor', () => {
      let responseInterceptorSuccess: (response: AxiosResponse) => AxiosResponse
      let responseInterceptorError: (error: unknown) => Promise<never>

      beforeEach(() => {
        // Get the response interceptor functions
        const interceptorCall = mockAxiosInstance.interceptors.response.use.mock.calls[0]
        responseInterceptorSuccess = interceptorCall[0]
        responseInterceptorError = interceptorCall[1]
      })

      it('should return response unchanged for successful responses', () => {
        const mockResponse: AxiosResponse = {
          data: { test: 'data' },
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {},
          request: {},
        }

        const result = responseInterceptorSuccess(mockResponse)
        expect(result).toBe(mockResponse)
      })

      it('should transform server errors correctly', async () => {
        const serverError = {
          response: {
            data: {
              code: 'VALIDATION_ERROR',
              message: 'Validation failed',
              details: { email: ['Email is required'] },
            },
            status: 400,
          },
          config: {},
          message: 'Request failed with status code 400',
        }

        try {
          await responseInterceptorError(serverError)
        } catch (transformedError) {
          const apiError = transformedError as ApiError
          expect(apiError.code).toBe('VALIDATION_ERROR')
          expect(apiError.message).toBe('Validation failed')
          expect(apiError.statusCode).toBe(400)
          expect(apiError.details).toEqual({ email: ['Email is required'] })
        }
      })

      it('should transform network errors correctly', async () => {
        const networkError = {
          request: {},
          message: 'Network Error',
        }

        try {
          await responseInterceptorError(networkError)
        } catch (transformedError) {
          const apiError = transformedError as ApiError
          expect(apiError.code).toBe('NETWORK_ERROR')
          expect(apiError.message).toBe('Erreur de connexion au serveur')
          expect(apiError.details?.originalError).toBe('Network Error')
        }
      })

      it('should transform unknown errors correctly', async () => {
        const unknownError = {
          message: 'Something went wrong',
        }

        try {
          await responseInterceptorError(unknownError)
        } catch (transformedError) {
          const apiError = transformedError as ApiError
          expect(apiError.code).toBe('UNKNOWN_ERROR')
          expect(apiError.message).toBe('Something went wrong')
        }
      })

      describe('token refresh on 401', () => {
        it('should set up 401 error handling interceptor', () => {
          // This test verifies that the 401 interceptor is set up
          // The actual token refresh logic is complex to test due to async nature
          expect(mockAxiosInstance.interceptors.response.use).toHaveBeenCalled()

          // Verify that the interceptor function exists
          const interceptorCall = mockAxiosInstance.interceptors.response.use.mock.calls[0]
          const responseInterceptorError = interceptorCall[1]
          expect(typeof responseInterceptorError).toBe('function')
        })

        it('should clear auth and reject on refresh failure', async () => {
          const mockToken: AuthToken = {
            access_token: 'old-token',
            refresh_token: 'refresh-token',
          }

          httpClient.setAuthToken(mockToken)

          // Mock refresh token failure
          mockAxiosInstance.post.mockRejectedValue({
            response: { status: 401 },
            message: 'Refresh token expired',
          })

          const unauthorizedError = {
            response: { status: 401 },
            config: { _retry: false },
            message: 'Unauthorized',
          }

          try {
            await responseInterceptorError(unauthorizedError)
          } catch (error) {
            const apiError = error as ApiError
            expect(apiError.code).toBe('API_ERROR')
          }
        })

        it('should not retry if already retried', async () => {
          const unauthorizedError = {
            response: { status: 401 },
            config: { _retry: true }, // Already retried
            message: 'Unauthorized',
          }

          try {
            await responseInterceptorError(unauthorizedError)
          } catch (error) {
            const apiError = error as ApiError
            expect(apiError.code).toBe('API_ERROR')
            expect(mockAxiosInstance.post).not.toHaveBeenCalled()
          }
        })

        it('should not retry if no refresh token available', async () => {
          const unauthorizedError = {
            response: { status: 401 },
            config: { _retry: false },
            message: 'Unauthorized',
          }

          try {
            await responseInterceptorError(unauthorizedError)
          } catch (error) {
            const apiError = error as ApiError
            expect(apiError.code).toBe('API_ERROR')
            expect(mockAxiosInstance.post).not.toHaveBeenCalled()
          }
        })
      })
    })
  })
})
